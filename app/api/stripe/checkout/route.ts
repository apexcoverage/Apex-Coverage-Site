import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  agentUpdateLead,
  getStripeModeFromSecretKey,
} from "@/lib/agentAppsScript";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_SUCCESS_URL = process.env.STRIPE_SUCCESS_URL; // optional
const STRIPE_CANCEL_URL = process.env.STRIPE_CANCEL_URL; // optional

function mustGetStripe() {
  if (!STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  return new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-06-30.basil" });
}

function normalizeOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function parseAmountToCents(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  const raw = String(value).replace(/[$,\s]/g, "");
  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  return Math.round(parsed * 100);
}

function formatAmountForLog(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

async function getOrCreateStripeCustomer(params: {
  stripe: Stripe;
  stripeCustomerId?: string;
  email?: string;
  name?: string;
  phone?: string;
  leadId: number;
}) {
  const { stripe, stripeCustomerId, email, name, phone, leadId } = params;

  if (stripeCustomerId) {
    try {
      const existing = await stripe.customers.retrieve(stripeCustomerId);

      if (!("deleted" in existing) || existing.deleted !== true) {
        const updated = await stripe.customers.update(stripeCustomerId, {
          email: email || undefined,
          name: name || undefined,
          phone: phone || undefined,
          metadata: {
            ...(existing.metadata || {}),
            leadId: String(leadId),
          },
        });

        return updated;
      }
    } catch (err) {
      console.warn(
        "[/api/stripe/checkout] Failed to reuse stripeCustomerId, creating new customer instead:",
        stripeCustomerId,
        err
      );
    }
  }

  return stripe.customers.create({
    email: email || undefined,
    name: name || undefined,
    phone: phone || undefined,
    metadata: {
      leadId: String(leadId),
    },
  });
}

export async function POST(req: Request) {
  try {
    const stripe = mustGetStripe();
    const stripeMode = getStripeModeFromSecretKey(STRIPE_SECRET_KEY!);

    const body = await req.json().catch(() => ({}));
    const {
      id,
      email,
      name,
      phone,
      stripeCustomerId,
      mode,
      amount,
      monthlyPremium,
      currency,
      description,
      chargeType, // "initial_payment" | "manual_one_time"
    } = body || {};

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Missing id" },
        { status: 400 }
      );
    }

    const leadId = Number(id);
    if (!Number.isFinite(leadId) || leadId < 2) {
      return NextResponse.json(
        { ok: false, error: "Invalid id" },
        { status: 400 }
      );
    }

    const normalizedCurrency = normalizeOptionalString(currency) || "usd";

    const origin =
      req.headers.get("origin") ||
      (req.headers.get("host") ? `https://${req.headers.get("host")}` : "");

    const successUrl =
      STRIPE_SUCCESS_URL ||
      (origin ? `${origin}/agent/customers/${leadId}?paid=1` : "");

    const cancelUrl =
      STRIPE_CANCEL_URL ||
      (origin ? `${origin}/agent/customers/${leadId}?canceled=1` : "");

    const customer = await getOrCreateStripeCustomer({
      stripe,
      stripeCustomerId: normalizeOptionalString(stripeCustomerId),
      email: normalizeOptionalString(email),
      name: normalizeOptionalString(name),
      phone: normalizeOptionalString(phone),
      leadId,
    });

    await agentUpdateLead(leadId, {
      stripeCustomerId: customer.id,
      stripeMode,
      billingStatus: "initiated",
    });

    const checkoutMode = mode === "payment" ? "payment" : "subscription";

    let session: Stripe.Checkout.Session;

    if (checkoutMode === "subscription") {
      const monthlyPremiumCents = parseAmountToCents(monthlyPremium);

      if (!monthlyPremiumCents || monthlyPremiumCents < 50) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Missing or invalid monthlyPremium. Add the customer's Monthly Premium before starting billing.",
          },
          { status: 400 }
        );
      }

      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customer.id,
        client_reference_id: String(leadId),
        line_items: [
          {
            price_data: {
              currency: normalizedCurrency,
              product_data: {
                name: description || "Apex Coverage Monthly Billing",
              },
              recurring: {
                interval: "month",
              },
              unit_amount: monthlyPremiumCents,
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          leadId: String(leadId),
          monthlyPremium: String(monthlyPremium || ""),
          chargeType: "subscription_start",
        },
        subscription_data: {
          metadata: {
            leadId: String(leadId),
            monthlyPremium: String(monthlyPremium || ""),
            chargeType: "subscription_start",
          },
        },
      });

      await agentUpdateLead(leadId, {
        activityNote: `Started monthly billing checkout (${formatAmountForLog(
          monthlyPremiumCents
        )})`,
      });
    } else {
      let oneTimeAmountCents: number | null = null;

      if (typeof amount === "number" && Number.isFinite(amount)) {
        oneTimeAmountCents = Math.round(amount);
      } else {
        oneTimeAmountCents = parseAmountToCents(amount);
      }

      if (!oneTimeAmountCents || oneTimeAmountCents < 50) {
        return NextResponse.json(
          {
            ok: false,
            error: "Missing/invalid amount for payment mode",
          },
          { status: 400 }
        );
      }

      const normalizedChargeType =
        chargeType === "manual_one_time"
          ? "manual_one_time"
          : "initial_payment";

      const isManualOneTime = normalizedChargeType === "manual_one_time";

      session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer: customer.id,
        client_reference_id: String(leadId),
        line_items: [
          {
            price_data: {
              currency: normalizedCurrency,
              product_data: {
                name:
                  description ||
                  (isManualOneTime
                    ? "Apex Coverage One-Time Charge"
                    : "Apex Coverage Initial Payment"),
              },
              unit_amount: oneTimeAmountCents,
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          leadId: String(leadId),
          chargeType: normalizedChargeType,
        },
        payment_intent_data: {
          metadata: {
            leadId: String(leadId),
            chargeType: normalizedChargeType,
          },
        },
      });

      await agentUpdateLead(leadId, {
        activityNote: isManualOneTime
          ? `Started one-time charge checkout (${formatAmountForLog(
              oneTimeAmountCents
            )})`
          : `Started first payment checkout (${formatAmountForLog(
              oneTimeAmountCents
            )})`,
      });
    }

    return NextResponse.json({
      ok: true,
      url: session.url,
      stripeCustomerId: customer.id,
    });
  } catch (err: any) {
    console.error("[/api/stripe/checkout] Error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  agentUpdateLead,
  getStripeModeFromSecretKey,
} from "@/lib/agentAppsScript";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID; // subscription price
const STRIPE_SUCCESS_URL = process.env.STRIPE_SUCCESS_URL; // optional
const STRIPE_CANCEL_URL = process.env.STRIPE_CANCEL_URL; // optional

function mustGetStripe() {
  if (!STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  return new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-06-30.basil" });
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
      id, // Lead/Customer row id (your system of record)
      email,
      name,
      phone,
      stripeCustomerId, // optional existing Stripe customer id from CRM
      mode, // "subscription" | "payment" (optional; default subscription)
      amount, // for one-time payment in cents if mode==="payment"
      currency, // default "usd"
      description, // optional
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
      stripeCustomerId:
        typeof stripeCustomerId === "string" && stripeCustomerId.trim()
          ? stripeCustomerId.trim()
          : undefined,
      email:
        typeof email === "string" && email.trim() ? email.trim() : undefined,
      name: typeof name === "string" && name.trim() ? name.trim() : undefined,
      phone:
        typeof phone === "string" && phone.trim() ? phone.trim() : undefined,
      leadId,
    });

    // Persist Stripe customer id immediately (refresh-proof)
    await agentUpdateLead(leadId, {
      stripeCustomerId: customer.id,
      stripeMode,
      billingStatus: "initiated",
    });

    const checkoutMode = mode === "payment" ? "payment" : "subscription";

    let session: Stripe.Checkout.Session;

    if (checkoutMode === "subscription") {
      if (!STRIPE_PRICE_ID) {
        return NextResponse.json(
          { ok: false, error: "Missing STRIPE_PRICE_ID for subscriptions" },
          { status: 500 }
        );
      }

      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customer.id,
        client_reference_id: String(leadId),
        line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          leadId: String(leadId),
        },
        subscription_data: {
          metadata: {
            leadId: String(leadId),
          },
        },
      });
    } else {
      const amt = Number(amount);

      if (!amt || amt < 50) {
        return NextResponse.json(
          { ok: false, error: "Missing/invalid amount (cents) for payment mode" },
          { status: 400 }
        );
      }

      session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer: customer.id,
        client_reference_id: String(leadId),
        line_items: [
          {
            price_data: {
              currency: currency || "usd",
              product_data: {
                name: description || "Apex Coverage Payment",
              },
              unit_amount: amt,
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          leadId: String(leadId),
        },
        payment_intent_data: {
          metadata: {
            leadId: String(leadId),
          },
        },
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

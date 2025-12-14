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

    const origin =
      req.headers.get("origin") ||
      (req.headers.get("host") ? `https://${req.headers.get("host")}` : "");

    const successUrl =
      STRIPE_SUCCESS_URL || (origin ? `${origin}/agent/customers/${id}?paid=1` : "");
    const cancelUrl =
      STRIPE_CANCEL_URL || (origin ? `${origin}/agent/customers/${id}?canceled=1` : "");

    // Create Stripe Customer (always in test mode initially)
    const customer = await stripe.customers.create({
      email: email || undefined,
      name: name || undefined,
      phone: phone || undefined,
      metadata: {
        leadId: String(id),
      },
    });

    // Persist Stripe customer id immediately (refresh-proof)
    await agentUpdateLead(Number(id), {
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
        line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          leadId: String(id),
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
          leadId: String(id),
        },
      });
    }

    return NextResponse.json({ ok: true, url: session.url });
  } catch (err: any) {
    console.error("[/api/stripe/checkout] Error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

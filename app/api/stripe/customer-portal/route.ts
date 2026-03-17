import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_CUSTOMER_PORTAL_RETURN_URL =
  process.env.STRIPE_CUSTOMER_PORTAL_RETURN_URL;

function mustGetStripe() {
  if (!STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  return new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-06-30.basil" });
}

export async function POST(req: Request) {
  try {
    const stripe = mustGetStripe();

    const body = await req.json().catch(() => ({}));
    const { id, stripeCustomerId } = body || {};

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Missing id" },
        { status: 400 }
      );
    }

    if (
      !stripeCustomerId ||
      typeof stripeCustomerId !== "string" ||
      !stripeCustomerId.trim()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing Stripe customer ID. Start billing first so a Stripe customer exists.",
        },
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

    const returnUrl =
      STRIPE_CUSTOMER_PORTAL_RETURN_URL ||
      (origin ? `${origin}/agent/customers/${leadId}` : "");

    if (!returnUrl) {
      return NextResponse.json(
        { ok: false, error: "Unable to determine return URL" },
        { status: 500 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId.trim(),
      return_url: returnUrl,
    });

    return NextResponse.json({
      ok: true,
      url: session.url,
    });
  } catch (err: any) {
    console.error("[/api/stripe/customer-portal] Error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { agentUpdateLead } from "@/lib/agentAppsScript";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_RETURN_URL = process.env.STRIPE_RETURN_URL;

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

    if (!stripeCustomerId) {
      return NextResponse.json(
        { ok: false, error: "Missing stripeCustomerId" },
        { status: 400 }
      );
    }

    const leadId = Number(id);

    const origin =
      req.headers.get("origin") ||
      (req.headers.get("host") ? `https://${req.headers.get("host")}` : "");

    const returnUrl =
      STRIPE_RETURN_URL ||
      (origin ? `${origin}/agent/customers/${leadId}` : "");

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    // ✅ Activity Log
    await agentUpdateLead(leadId, {
      activityNote: "Agent opened billing portal",
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

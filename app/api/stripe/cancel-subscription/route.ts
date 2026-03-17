import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  agentUpdateLead,
  getStripeModeFromSecretKey,
} from "@/lib/agentAppsScript";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

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
    const { id, stripeSubscriptionId } = body || {};

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

    if (
      !stripeSubscriptionId ||
      typeof stripeSubscriptionId !== "string" ||
      !stripeSubscriptionId.trim()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing Stripe subscription ID. This customer does not appear to have an active subscription.",
        },
        { status: 400 }
      );
    }

    const subscription = await stripe.subscriptions.update(
      stripeSubscriptionId.trim(),
      {
        cancel_at_period_end: true,
      }
    );

    await agentUpdateLead(leadId, {
      stripeMode,
      stripeSubscriptionId: subscription.id,
      billingStatus: subscription.cancel_at_period_end
        ? "canceled"
        : subscription.status || "unknown",
      activityNote: "Subscription set to cancel at period end",
    });

    return NextResponse.json({
      ok: true,
      subscriptionId: subscription.id,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd:
        typeof subscription.current_period_end === "number"
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
    });
  } catch (err: any) {
    console.error("[/api/stripe/cancel-subscription] Error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

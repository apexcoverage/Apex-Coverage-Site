import { NextResponse } from "next/server";
import Stripe from "stripe";
import { agentUpdateLead, getStripeModeFromSecretKey } from "@/lib/agentAppsScript";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function mustGetStripe() {
  if (!STRIPE_SECRET_KEY) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-06-30.basil" });
}

export async function POST(req: Request) {
  try {
    if (!STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { ok: false, error: "Missing STRIPE_WEBHOOK_SECRET" },
        { status: 500 }
      );
    }

    const stripe = mustGetStripe();
    const stripeMode = getStripeModeFromSecretKey(STRIPE_SECRET_KEY!);

    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return NextResponse.json(
        { ok: false, error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const rawBody = await req.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error("[/api/stripe/webhook] Signature verify failed:", err?.message);
      return NextResponse.json(
        { ok: false, error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    // Helper to read leadId from metadata (preferred) or fallback
    const getLeadId = (obj: any): number | null => {
      const metaLeadId = obj?.metadata?.leadId;
      const n = Number(metaLeadId);
      return Number.isFinite(n) && n > 0 ? n : null;
    };

    // We only update Sheets on events we care about.
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const leadId = getLeadId(session);

        if (leadId) {
          const patch: Record<string, any> = {
            stripeMode,
            stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
          };

          // If subscription checkout, capture subscription id
          if (session.mode === "subscription") {
            if (typeof session.subscription === "string") {
              patch.stripeSubscriptionId = session.subscription;
              patch.billingStatus = "active";
            }
          } else {
            patch.billingStatus = "paid";
          }

          await agentUpdateLead(leadId, patch);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const leadId = getLeadId(invoice);

        if (leadId) {
          await agentUpdateLead(leadId, {
            stripeMode,
            lastInvoiceStatus: invoice.status || "paid",
            lastPaymentDate: new Date((invoice.status_transitions?.paid_at || Date.now() / 1000) * 1000).toISOString(),
            billingStatus: "active",
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const leadId = getLeadId(invoice);

        if (leadId) {
          await agentUpdateLead(leadId, {
            stripeMode,
            lastInvoiceStatus: invoice.status || "open",
            billingStatus: "past_due",
          });
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const leadId = getLeadId(sub);

        if (leadId) {
          await agentUpdateLead(leadId, {
            stripeMode,
            stripeSubscriptionId: sub.id,
            billingStatus: sub.status || (event.type === "customer.subscription.deleted" ? "canceled" : "unknown"),
          });
        }
        break;
      }

      default:
        // Ignore other events
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[/api/stripe/webhook] Error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  agentUpdateLead,
  getStripeModeFromSecretKey,
} from "@/lib/agentAppsScript";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function mustGetStripe() {
  if (!STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  return new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-06-30.basil" });
}

function parseLeadId(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function getLeadIdFromCustomer(
  stripe: Stripe,
  customerId: string | null | undefined
): Promise<number | null> {
  if (!customerId) return null;

  try {
    const customer = await stripe.customers.retrieve(customerId);

    if ("deleted" in customer && customer.deleted) {
      return null;
    }

    return parseLeadId(customer.metadata?.leadId);
  } catch (err) {
    console.warn(
      "[/api/stripe/webhook] Failed to resolve leadId from customer:",
      customerId,
      err
    );
    return null;
  }
}

async function getLeadIdFromSubscription(
  stripe: Stripe,
  subscriptionId: string | null | undefined
): Promise<number | null> {
  if (!subscriptionId) return null;

  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    return parseLeadId(sub.metadata?.leadId);
  } catch (err) {
    console.warn(
      "[/api/stripe/webhook] Failed to resolve leadId from subscription:",
      subscriptionId,
      err
    );
    return null;
  }
}

async function resolveLeadId(
  stripe: Stripe,
  obj: any
): Promise<number | null> {
  // 1) Direct metadata on object
  const fromMetadata = parseLeadId(obj?.metadata?.leadId);
  if (fromMetadata) return fromMetadata;

  // 2) Checkout session client_reference_id
  const fromClientRef = parseLeadId(obj?.client_reference_id);
  if (fromClientRef) return fromClientRef;

  // 3) Customer metadata fallback
  const customerId =
    typeof obj?.customer === "string" ? obj.customer : null;

  const fromCustomer = await getLeadIdFromCustomer(stripe, customerId);
  if (fromCustomer) return fromCustomer;

  // 4) Subscription metadata fallback
  const subscriptionId =
    typeof obj?.subscription === "string"
      ? obj.subscription
      : typeof obj?.id === "string" && obj?.object === "subscription"
      ? obj.id
      : null;

  const fromSubscription = await getLeadIdFromSubscription(
    stripe,
    subscriptionId
  );
  if (fromSubscription) return fromSubscription;

  return null;
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
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error(
        "[/api/stripe/webhook] Signature verify failed:",
        err?.message
      );
      return NextResponse.json(
        { ok: false, error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const leadId = await resolveLeadId(stripe, session);

        if (leadId) {
          const patch: Record<string, any> = {
            stripeMode,
            stripeCustomerId:
              typeof session.customer === "string" ? session.customer : undefined,
          };

          if (session.mode === "subscription") {
            if (typeof session.subscription === "string") {
              patch.stripeSubscriptionId = session.subscription;
            }
            patch.billingStatus = "active";
          } else {
            patch.billingStatus = "paid";
          }

          await agentUpdateLead(leadId, patch);
        } else {
          console.warn(
            "[/api/stripe/webhook] checkout.session.completed had no resolvable leadId",
            {
              sessionId: session.id,
              customer: session.customer,
              subscription: session.subscription,
              client_reference_id: session.client_reference_id,
              metadata: session.metadata,
            }
          );
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const leadId = await resolveLeadId(stripe, invoice);

        if (leadId) {
          await agentUpdateLead(leadId, {
            stripeMode,
            stripeCustomerId:
              typeof invoice.customer === "string" ? invoice.customer : undefined,
            stripeSubscriptionId:
              typeof invoice.subscription === "string"
                ? invoice.subscription
                : undefined,
            lastInvoiceStatus: invoice.status || "paid",
            lastPaymentDate: new Date(
              ((invoice.status_transitions?.paid_at as number | null) ||
                Math.floor(Date.now() / 1000)) * 1000
            ).toISOString(),
            billingStatus: "active",
          });
        } else {
          console.warn(
            "[/api/stripe/webhook] invoice.paid had no resolvable leadId",
            {
              invoiceId: invoice.id,
              customer: invoice.customer,
              subscription: invoice.subscription,
              metadata: invoice.metadata,
            }
          );
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const leadId = await resolveLeadId(stripe, invoice);

        if (leadId) {
          await agentUpdateLead(leadId, {
            stripeMode,
            stripeCustomerId:
              typeof invoice.customer === "string" ? invoice.customer : undefined,
            stripeSubscriptionId:
              typeof invoice.subscription === "string"
                ? invoice.subscription
                : undefined,
            lastInvoiceStatus: invoice.status || "open",
            billingStatus: "past_due",
          });
        } else {
          console.warn(
            "[/api/stripe/webhook] invoice.payment_failed had no resolvable leadId",
            {
              invoiceId: invoice.id,
              customer: invoice.customer,
              subscription: invoice.subscription,
              metadata: invoice.metadata,
            }
          );
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const leadId = await resolveLeadId(stripe, sub);

        if (leadId) {
          await agentUpdateLead(leadId, {
            stripeMode,
            stripeCustomerId:
              typeof sub.customer === "string" ? sub.customer : undefined,
            stripeSubscriptionId: sub.id,
            billingStatus:
              event.type === "customer.subscription.deleted"
                ? "canceled"
                : sub.status || "unknown",
          });
        } else {
          console.warn(
            "[/api/stripe/webhook] subscription event had no resolvable leadId",
            {
              eventType: event.type,
              subscriptionId: sub.id,
              customer: sub.customer,
              metadata: sub.metadata,
            }
          );
        }
        break;
      }

      default:
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

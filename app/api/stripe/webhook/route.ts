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

const AGENT_URL =
  process.env.APPSCRIPT_AGENT_WEBHOOK_URL ||
  process.env.APPSCRIPT_WEBHOOK_URL;

const AGENT_SECRET =
  process.env.AGENT_BACKEND_SECRET ||
  process.env.AGENT_SECRET;

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

function formatAmountFromCents(cents: number | null | undefined): string {
  if (typeof cents !== "number" || !Number.isFinite(cents)) return "";
  return (cents / 100).toFixed(2);
}

function formatAmountForActivity(cents: number | null | undefined): string {
  if (typeof cents !== "number" || !Number.isFinite(cents)) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function getChargeType(obj: any): string {
  return String(obj?.metadata?.chargeType || "").trim().toLowerCase();
}

async function appendPaymentHistory(entry: {
  leadId: number;
  customerName?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeInvoiceId?: string;
  stripePaymentIntentId?: string;
  amount?: string;
  currency?: string;
  method?: string;
  status?: string;
  receiptUrl?: string;
  eventType?: string;
}) {
  if (!AGENT_URL || !AGENT_SECRET) {
    console.warn(
      "[/api/stripe/webhook] Missing Apps Script env vars for payment history append"
    );
    return;
  }

  const payload = {
    action: "appendpaymenthistory",
    secret: AGENT_SECRET,
    ...entry,
  };

  const res = await fetch(AGENT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error("Bad JSON from Apps Script (appendpaymenthistory): " + text);
  }

  if (!res.ok || !data?.ok) {
    throw new Error(
      data?.error || text || res.statusText || "Payment history append failed"
    );
  }
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
  const fromMetadata = parseLeadId(obj?.metadata?.leadId);
  if (fromMetadata) return fromMetadata;

  const fromClientRef = parseLeadId(obj?.client_reference_id);
  if (fromClientRef) return fromClientRef;

  const customerId =
    typeof obj?.customer === "string" ? obj.customer : null;

  const fromCustomer = await getLeadIdFromCustomer(stripe, customerId);
  if (fromCustomer) return fromCustomer;

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
        const chargeType = getChargeType(session);

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
            patch.activityNote = "Monthly billing checkout completed";
          } else {
            patch.billingStatus = "paid";
            patch.activityNote =
              chargeType === "manual_one_time"
                ? "One-time charge checkout completed"
                : "First payment checkout completed";
          }

          await agentUpdateLead(leadId, patch);

          if (session.mode === "payment") {
            await appendPaymentHistory({
              leadId,
              customerName:
                typeof session.customer_details?.name === "string"
                  ? session.customer_details.name
                  : "",
              stripeCustomerId:
                typeof session.customer === "string" ? session.customer : "",
              stripeSubscriptionId: "",
              stripeInvoiceId: "",
              stripePaymentIntentId:
                typeof session.payment_intent === "string"
                  ? session.payment_intent
                  : "",
              amount: formatAmountFromCents(session.amount_total ?? null),
              currency: session.currency || "usd",
              method:
                chargeType === "manual_one_time"
                  ? "One-Time Charge"
                  : "Initial Payment",
              status:
                session.payment_status ||
                (session.status === "complete" ? "paid" : session.status || ""),
              receiptUrl: "",
              eventType: chargeType || event.type,
            });
          }
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
        const chargeType = getChargeType(invoice);

        if (leadId) {
          const amountText = formatAmountFromCents(invoice.amount_paid);
          const amountLabel = formatAmountForActivity(invoice.amount_paid);
          const isSubscriptionInvoice =
            typeof invoice.subscription === "string" && !!invoice.subscription;

          let activityNote = "";

          if (chargeType === "manual_one_time") {
            activityNote = `One-time charge succeeded${
              amountLabel ? ` (${amountLabel})` : ""
            }`;
          } else if (isSubscriptionInvoice) {
            activityNote = `Subscription payment succeeded${
              amountLabel ? ` (${amountLabel})` : ""
            }`;
          } else {
            activityNote = `Payment succeeded${
              amountLabel ? ` (${amountLabel})` : ""
            }`;
          }

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
            billingStatus: isSubscriptionInvoice ? "active" : "paid",
            activityNote,
          });

          await appendPaymentHistory({
            leadId,
            customerName: "",
            stripeCustomerId:
              typeof invoice.customer === "string" ? invoice.customer : "",
            stripeSubscriptionId:
              typeof invoice.subscription === "string"
                ? invoice.subscription
                : "",
            stripeInvoiceId: invoice.id || "",
            stripePaymentIntentId:
              typeof invoice.payment_intent === "string"
                ? invoice.payment_intent
                : "",
            amount: amountText,
            currency: invoice.currency || "usd",
            method:
              chargeType === "manual_one_time"
                ? "One-Time Charge"
                : isSubscriptionInvoice
                ? "Stripe Subscription"
                : "Stripe Payment",
            status: invoice.status || "paid",
            receiptUrl: invoice.hosted_invoice_url || invoice.invoice_pdf || "",
            eventType: chargeType || event.type,
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
        const chargeType = getChargeType(invoice);

        if (leadId) {
          const amountText = formatAmountFromCents(invoice.amount_due);
          const amountLabel = formatAmountForActivity(invoice.amount_due);
          const isSubscriptionInvoice =
            typeof invoice.subscription === "string" && !!invoice.subscription;

          let activityNote = "";

          if (chargeType === "manual_one_time") {
            activityNote = `One-time charge failed${
              amountLabel ? ` (${amountLabel})` : ""
            }`;
          } else if (isSubscriptionInvoice) {
            activityNote = `Subscription payment failed${
              amountLabel ? ` (${amountLabel})` : ""
            }`;
          } else {
            activityNote = `Payment failed${
              amountLabel ? ` (${amountLabel})` : ""
            }`;
          }

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
            activityNote,
          });

          await appendPaymentHistory({
            leadId,
            customerName: "",
            stripeCustomerId:
              typeof invoice.customer === "string" ? invoice.customer : "",
            stripeSubscriptionId:
              typeof invoice.subscription === "string"
                ? invoice.subscription
                : "",
            stripeInvoiceId: invoice.id || "",
            stripePaymentIntentId:
              typeof invoice.payment_intent === "string"
                ? invoice.payment_intent
                : "",
            amount: amountText,
            currency: invoice.currency || "usd",
            method:
              chargeType === "manual_one_time"
                ? "One-Time Charge"
                : isSubscriptionInvoice
                ? "Stripe Subscription"
                : "Stripe Payment",
            status: invoice.status || "failed",
            receiptUrl: invoice.hosted_invoice_url || invoice.invoice_pdf || "",
            eventType: chargeType || event.type,
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
          let activityNote = "";

          if (event.type === "customer.subscription.deleted") {
            activityNote = "Subscription canceled in Stripe";
          } else if (sub.cancel_at_period_end) {
            activityNote = "Subscription set to cancel at period end";
          } else {
            activityNote = `Subscription updated (${sub.status || "unknown"})`;
          }

          await agentUpdateLead(leadId, {
            stripeMode,
            stripeCustomerId:
              typeof sub.customer === "string" ? sub.customer : undefined,
            stripeSubscriptionId: sub.id,
            billingStatus:
              event.type === "customer.subscription.deleted"
                ? "canceled"
                : sub.status || "unknown",
            activityNote,
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

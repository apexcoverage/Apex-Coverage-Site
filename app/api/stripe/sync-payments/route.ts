import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  agentUpdateLead,
  getStripeModeFromSecretKey,
} from "@/lib/agentAppsScript";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const AGENT_URL =
  process.env.APPSCRIPT_AGENT_WEBHOOK_URL ||
  process.env.APPSCRIPT_AGENT_URL ||
  process.env.APPSCRIPT_WEBHOOK_URL;

const AGENT_SECRET =
  process.env.AGENT_BACKEND_SECRET ||
  process.env.AGENT_SECRET;

type ExistingPaymentRow = {
  stripeInvoiceId?: string;
  stripePaymentIntentId?: string;
};

function mustGetStripe() {
  if (!STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  return new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" });
}

function parseLeadId(value: unknown) {
  const id = Number(value);
  return Number.isFinite(id) && id >= 2 ? id : null;
}

function formatAmountFromCents(cents: number | null | undefined) {
  if (typeof cents !== "number" || !Number.isFinite(cents)) return "";
  return (cents / 100).toFixed(2);
}

function paidAtIso(invoice: Stripe.Invoice) {
  const raw = invoice as any;
  const seconds =
    Number(raw?.status_transitions?.paid_at || 0) ||
    Number(raw?.created || 0) ||
    Math.floor(Date.now() / 1000);

  return new Date(seconds * 1000).toISOString();
}

function invoiceSubscriptionId(invoice: Stripe.Invoice) {
  const raw = invoice as any;
  if (typeof raw.subscription === "string") return raw.subscription;
  if (typeof raw.parent?.subscription_details?.subscription === "string") {
    return raw.parent.subscription_details.subscription;
  }
  return "";
}

function invoicePaymentIntentId(invoice: Stripe.Invoice) {
  const raw = invoice as any;
  if (typeof raw.payment_intent === "string") return raw.payment_intent;
  if (typeof raw.payment_intent?.id === "string") return raw.payment_intent.id;
  return "";
}

function invoiceReceiptUrl(invoice: Stripe.Invoice) {
  return invoice.hosted_invoice_url || invoice.invoice_pdf || "";
}

async function callAgentListPayments(leadId: number) {
  if (!AGENT_URL || !AGENT_SECRET) {
    throw new Error(
      "Missing Apps Script env vars. Need APPSCRIPT_AGENT_WEBHOOK_URL, APPSCRIPT_AGENT_URL, or APPSCRIPT_WEBHOOK_URL, and AGENT_BACKEND_SECRET or AGENT_SECRET."
    );
  }

  const url = new URL(AGENT_URL);
  url.searchParams.set("agent", "1");
  url.searchParams.set("secret", AGENT_SECRET);
  url.searchParams.set("action", "listpayments");
  url.searchParams.set("leadId", String(leadId));

  const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
  const text = await res.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error("Bad JSON from Apps Script (GET listpayments): " + text);
  }

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || text || res.statusText || "Upstream error");
  }

  return Array.isArray(data.rows) ? (data.rows as ExistingPaymentRow[]) : [];
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
    throw new Error(
      "Missing Apps Script env vars. Need APPSCRIPT_AGENT_WEBHOOK_URL, APPSCRIPT_AGENT_URL, or APPSCRIPT_WEBHOOK_URL, and AGENT_BACKEND_SECRET or AGENT_SECRET."
    );
  }

  const res = await fetch(AGENT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "appendpaymenthistory",
      secret: AGENT_SECRET,
      ...entry,
    }),
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

async function updateCustomerMetadata(
  stripe: Stripe,
  customerId: string,
  leadId: number
) {
  const customer = await stripe.customers.retrieve(customerId);
  if ("deleted" in customer && customer.deleted) {
    throw new Error("Stripe customer has been deleted.");
  }

  await stripe.customers.update(customerId, {
    metadata: {
      ...(customer.metadata || {}),
      leadId: String(leadId),
    },
  });
}

async function updateSubscriptionMetadata(
  stripe: Stripe,
  subscriptionId: string,
  leadId: number
) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  await stripe.subscriptions.update(subscriptionId, {
    metadata: {
      ...(subscription.metadata || {}),
      leadId: String(leadId),
    },
  });

  return subscription;
}

export async function POST(req: Request) {
  try {
    const stripe = mustGetStripe();
    const stripeMode = getStripeModeFromSecretKey(STRIPE_SECRET_KEY!);
    const body = await req.json().catch(() => ({}));
    const leadId = parseLeadId(body?.id);
    let stripeCustomerId =
      typeof body?.stripeCustomerId === "string" ? body.stripeCustomerId.trim() : "";
    let stripeSubscriptionId =
      typeof body?.stripeSubscriptionId === "string"
        ? body.stripeSubscriptionId.trim()
        : "";

    if (!leadId) {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid lead id." },
        { status: 400 }
      );
    }

    if (!stripeCustomerId && !stripeSubscriptionId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This customer does not have a Stripe customer ID or subscription ID saved.",
        },
        { status: 400 }
      );
    }

    let subscriptionStatus = "";

    if (stripeSubscriptionId) {
      const subscription = await updateSubscriptionMetadata(
        stripe,
        stripeSubscriptionId,
        leadId
      );
      subscriptionStatus = subscription.status || "";
      if (!stripeCustomerId && typeof subscription.customer === "string") {
        stripeCustomerId = subscription.customer;
      }
    }

    if (stripeCustomerId) {
      await updateCustomerMetadata(stripe, stripeCustomerId, leadId);
    }

    const invoiceParams: Record<string, string | number> = { limit: 100 };
    if (stripeSubscriptionId) {
      invoiceParams.subscription = stripeSubscriptionId;
    } else {
      invoiceParams.customer = stripeCustomerId;
    }

    const invoiceList = await stripe.invoices.list(invoiceParams as any);
    const paidInvoices = invoiceList.data
      .filter((invoice) => invoice.status === "paid" && invoice.amount_paid > 0)
      .sort((a, b) => {
        const aPaid = Date.parse(paidAtIso(a));
        const bPaid = Date.parse(paidAtIso(b));
        return aPaid - bPaid;
      });

    const existingRows = await callAgentListPayments(leadId);
    const existingInvoiceIds = new Set(
      existingRows
        .map((row) => String(row.stripeInvoiceId || "").trim())
        .filter(Boolean)
    );
    const existingPaymentIntentIds = new Set(
      existingRows
        .map((row) => String(row.stripePaymentIntentId || "").trim())
        .filter(Boolean)
    );

    let added = 0;
    let latestInvoice: Stripe.Invoice | null = null;

    for (const invoice of paidInvoices) {
      latestInvoice = invoice;
      const paymentIntentId = invoicePaymentIntentId(invoice);
      const alreadySynced =
        existingInvoiceIds.has(invoice.id) ||
        (!!paymentIntentId && existingPaymentIntentIds.has(paymentIntentId));

      if (alreadySynced) continue;

      await appendPaymentHistory({
        leadId,
        customerName: "",
        stripeCustomerId:
          typeof invoice.customer === "string"
            ? invoice.customer
            : stripeCustomerId,
        stripeSubscriptionId:
          invoiceSubscriptionId(invoice) || stripeSubscriptionId,
        stripeInvoiceId: invoice.id || "",
        stripePaymentIntentId: paymentIntentId,
        amount: formatAmountFromCents(invoice.amount_paid),
        currency: invoice.currency || "usd",
        method: invoiceSubscriptionId(invoice)
          ? "Stripe Subscription"
          : "Stripe Payment",
        status: invoice.status || "paid",
        receiptUrl: invoiceReceiptUrl(invoice),
        eventType: "manual_sync_invoice.paid",
      });

      added += 1;
    }

    const latestPaymentDate = latestInvoice ? paidAtIso(latestInvoice) : "";

    await agentUpdateLead(leadId, {
      stripeMode,
      stripeCustomerId: stripeCustomerId || undefined,
      stripeSubscriptionId: stripeSubscriptionId || undefined,
      lastInvoiceStatus: latestInvoice?.status || undefined,
      lastPaymentDate: latestPaymentDate || undefined,
      billingStatus: subscriptionStatus || (latestInvoice ? "paid" : undefined),
      activityNote: `Stripe payment sync completed (${added} payment${
        added === 1 ? "" : "s"
      } added)`,
    });

    return NextResponse.json({
      ok: true,
      added,
      scanned: paidInvoices.length,
      latestPaymentDate,
      stripeCustomerId,
      stripeSubscriptionId,
      subscriptionStatus,
    });
  } catch (err: any) {
    console.error("[/api/stripe/sync-payments] Error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

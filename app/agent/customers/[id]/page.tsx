"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

type Lead = {
  id: number;
  when: string;
  name: string;
  email: string;
  phone: string;
  zip: string;
  dob: string;
  year: string;
  make: string;
  model: string;
  consent: string;
  status?: string;
  agent?: string;
  policyNumber?: string;

  // policy-related fields
  coverage?: string;
  deductibles?: string;
  discounts?: string;
  renewalDate?: string;
  vehicles?: string;
  monthlyPremium?: string;

  // activity log
  activityLog?: string;

  // stripe / billing fields
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  billingStatus?: string;
  lastInvoiceStatus?: string;
  lastPaymentDate?: string;
  stripeMode?: string;
};

type ApiListResponse = {
  ok: boolean;
  rows?: Lead[];
  error?: string;
};

type PaymentHistoryRow = {
  timestamp: string;
  leadId: string;
  customerName: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripeInvoiceId: string;
  stripePaymentIntentId: string;
  amount: string;
  currency: string;
  method: string;
  status: string;
  receiptUrl: string;
  eventType: string;
};

type ApiPaymentsResponse = {
  ok: boolean;
  rows?: PaymentHistoryRow[];
  error?: string;
};

type ActivityNote = {
  id: number;
  text: string;
  createdAt: string;
  agent: string;
};

type UiPaymentRow = {
  date: string;
  amount: string;
  method: string;
  status: string;
  statusClass: string;
  receiptUrl: string;
  eventType: string;
};

function formatDateTime(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function formatCurrency(value?: string) {
  if (!value) return "—";
  const cleaned = String(value).replace(/[$,\s]/g, "");
  const amount = Number(cleaned);
  if (!Number.isFinite(amount)) return value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatPaymentAmount(value?: string, currency?: string) {
  if (!value) return "—";

  const cleaned = String(value).replace(/[$,\s]/g, "");
  const amount = Number(cleaned);

  if (!Number.isFinite(amount)) return value;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: String(currency || "usd").toUpperCase(),
  }).format(amount);
}

function getBillingStatusMeta(status?: string) {
  const normalized = String(status || "").trim().toLowerCase();

  switch (normalized) {
    case "active":
    case "paid":
    case "trialing":
    case "succeeded":
      return {
        label: normalized ? normalized.replace(/_/g, " ") : "Active",
        className: "status-pill status-active",
      };
    case "initiated":
    case "incomplete":
    case "incomplete_expired":
    case "processing":
    case "open":
    case "unpaid":
    case "paused":
    case "pending":
      return {
        label: normalized ? normalized.replace(/_/g, " ") : "Pending",
        className: "status-pill status-warning",
      };
    case "past_due":
    case "canceled":
    case "cancelled":
    case "failed":
    case "failure":
      return {
        label: normalized ? normalized.replace(/_/g, " ") : "Issue",
        className: "status-pill status-error",
      };
    default:
      return {
        label: normalized ? normalized.replace(/_/g, " ") : "Not started",
        className: "status-pill status-neutral",
      };
  }
}

function parseActivityLog(
  raw: string | undefined,
  fallbackAgent: string
): ActivityNote[] {
  if (!raw || !raw.trim()) return [];

  return raw
    .split(/\r?\n/)
    .map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return null;

      const parts = trimmed.split(" — ");
      const createdAt = parts.length > 1 ? parts[0].trim() : "Activity";
      const text =
        parts.length > 1 ? parts.slice(1).join(" — ").trim() : trimmed;

      return {
        id: Date.now() + index,
        text,
        createdAt,
        agent: fallbackAgent || "System",
      };
    })
    .filter(Boolean) as ActivityNote[];
}

function getFriendlyPaymentMethod(row: PaymentHistoryRow) {
  const rawMethod = String(row.method || "").trim().toLowerCase();
  const rawEvent = String(row.eventType || "").trim().toLowerCase();
  const hasSub = !!String(row.stripeSubscriptionId || "").trim();

  if (rawEvent.includes("manual_one_time")) {
    return "One-Time Charge";
  }

  if (rawEvent.includes("payment_failed")) {
    return hasSub ? "Failed Renewal" : "Failed Payment";
  }

  if (rawEvent.includes("checkout.session.completed")) {
    return hasSub ? "Billing Setup" : "Initial Payment";
  }

  if (rawEvent.includes("invoice.paid")) {
    return hasSub ? "Monthly Renewal" : "Invoice Payment";
  }

  if (rawEvent.includes("invoice.payment_failed")) {
    return hasSub ? "Failed Renewal" : "Failed Invoice";
  }

  if (rawEvent.includes("subscription.deleted")) {
    return "Subscription Ended";
  }

  if (rawEvent.includes("subscription.updated")) {
    return "Subscription Update";
  }

  if (rawMethod.includes("one-time")) {
    return "One-Time Charge";
  }

  if (rawMethod.includes("subscription")) {
    return "Monthly Renewal";
  }

  if (rawMethod.includes("payment")) {
    return "Initial Payment";
  }

  return row.method || "Payment";
}

function getFriendlyPaymentStatus(row: PaymentHistoryRow) {
  const rawStatus = String(row.status || "").trim().toLowerCase();
  const rawEvent = String(row.eventType || "").trim().toLowerCase();

  if (rawEvent.includes("invoice.payment_failed")) return "Failed";
  if (rawEvent.includes("payment_failed")) return "Failed";
  if (rawEvent.includes("invoice.paid")) return "Paid";
  if (rawEvent.includes("checkout.session.completed")) return "Completed";
  if (rawEvent.includes("subscription.deleted")) return "Canceled";

  if (rawStatus === "paid") return "Paid";
  if (rawStatus === "active") return "Active";
  if (rawStatus === "succeeded") return "Paid";
  if (rawStatus === "open") return "Open";
  if (rawStatus === "past_due") return "Past Due";
  if (rawStatus === "canceled" || rawStatus === "cancelled") return "Canceled";
  if (rawStatus === "failed") return "Failed";

  return row.status || "—";
}

function parseDollarInputToCents(value: string): number | null {
  const cleaned = String(value).replace(/[$,\s]/g, "");
  const amount = Number(cleaned);

  if (!Number.isFinite(amount) || amount <= 0) return null;

  return Math.round(amount * 100);
}

function formatCentsForDisplay(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function escapeHtml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function CustomerProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [customer, setCustomer] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityNotes, setActivityNotes] = useState<ActivityNote[]>([]);
  const [paymentHistoryRows, setPaymentHistoryRows] = useState<UiPaymentRow[]>(
    []
  );
  const [billingActionLoading, setBillingActionLoading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    zip: "",
    dob: "",
    agent: "",
    coverage: "",
    deductibles: "",
    discounts: "",
    renewalDate: "",
    vehicles: "",
    monthlyPremium: "",
  });

  function getPhoneHref(phone: string | undefined) {
    if (!phone) return "#";
    return `tel:${phone.replace(/\D/g, "")}`;
  }

  const handleBackToCustomers = () => {
    router.push("/agent/customers");
  };

  const refreshPaymentHistoryFromApi = async (leadId: number) => {
    const res = await fetch(`/api/agent/payments?leadId=${leadId}`, {
      cache: "no-store",
    });

    const data: ApiPaymentsResponse = await res.json();

    if (!data.ok) {
      throw new Error(data.error || "Failed to load payment history");
    }

    const rows = (data.rows || []).map((row, index) => {
      const friendlyStatus = getFriendlyPaymentStatus(row);
      const statusMeta = getBillingStatusMeta(friendlyStatus);

      return {
        date: formatDateTime(row.timestamp),
        amount: formatPaymentAmount(row.amount, row.currency),
        method: getFriendlyPaymentMethod(row),
        status: friendlyStatus,
        statusClass: statusMeta.className,
        receiptUrl: row.receiptUrl || "",
        eventType: row.eventType || `payment-${index}`,
      };
    });

    setPaymentHistoryRows(rows);
    return rows;
  };

  const refreshCustomerFromApi = async () => {
    const res = await fetch("/api/agent/leads", { cache: "no-store" });
    const data: ApiListResponse = await res.json();

    if (!data.ok || !data.rows) {
      throw new Error(data.error || "Failed to load customers");
    }

    const idNumber = Number(params.id);
    const found = data.rows.find((lead) => lead.id === idNumber);

    if (!found) {
      throw new Error("Customer not found");
    }

    const fallbackVehicle = [found.year, found.make, found.model]
      .filter(Boolean)
      .join(" ");

    const hydrated = {
      ...found,
      coverage: found.coverage || "Full Coverage",
      deductibles: found.deductibles || "$500 Comp / $1,000 Collision",
      discounts: found.discounts || "",
      renewalDate: found.renewalDate || "",
      vehicles: found.vehicles || fallbackVehicle,
      monthlyPremium: found.monthlyPremium || "",
      activityLog: found.activityLog || "",
    };

    setCustomer(hydrated);
    setActivityNotes(
      parseActivityLog(hydrated.activityLog, hydrated.agent || "System")
    );

    await refreshPaymentHistoryFromApi(hydrated.id);

    return hydrated;
  };

  const openEditProfile = () => {
    if (!customer) return;

    const fallbackVehicle = [customer.year, customer.make, customer.model]
      .filter(Boolean)
      .join(" ");

    setEditForm({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      zip: customer.zip || "",
      dob: customer.dob || "",
      agent: customer.agent || "",
      coverage: customer.coverage || "Full Coverage",
      deductibles: customer.deductibles || "$500 Comp / $1,000 Collision",
      discounts: customer.discounts || "",
      renewalDate: customer.renewalDate || "",
      vehicles: customer.vehicles || fallbackVehicle,
      monthlyPremium: customer.monthlyPremium || "",
    });
    setIsEditing(true);
  };

  const handleEditProfile = () => {
    openEditProfile();
  };

  const handleEditContactDetails = () => {
    openEditProfile();
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!customer) return;

    try {
      const res = await fetch("/api/agent/customers/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: customer.id,
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          zip: editForm.zip,
          dob: editForm.dob,
          agent: editForm.agent,
          coverage: editForm.coverage,
          deductibles: editForm.deductibles,
          discounts: editForm.discounts,
          renewalDate: editForm.renewalDate,
          vehicles: editForm.vehicles,
          monthlyPremium: editForm.monthlyPremium,
          activityNote: "Profile updated",
        }),
      });

      const data = await res.json();

      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "Failed to save customer.");
      }

      await refreshCustomerFromApi();
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert(
        "There was a problem saving this customer to Google Sheets. Please try again."
      );
    }
  };

  const beginStripeCheckout = async (opts: {
    mode: "subscription" | "payment";
    amount?: number;
    monthlyPremium?: string;
    description?: string;
    chargeType?: string;
  }) => {
    if (!customer) return;

    try {
      setBillingActionLoading(true);

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: customer.id,
          email: customer.email,
          name: customer.name,
          phone: customer.phone,
          stripeCustomerId: customer.stripeCustomerId,
          mode: opts.mode,
          amount: opts.amount,
          monthlyPremium: opts.monthlyPremium,
          description: opts.description,
          chargeType: opts.chargeType,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.ok === false || !data.url) {
        throw new Error(data.error || "Unable to start Stripe checkout.");
      }

      if (data.stripeCustomerId) {
        setCustomer((prev) =>
          prev
            ? {
                ...prev,
                stripeCustomerId: data.stripeCustomerId,
                billingStatus: prev.billingStatus || "initiated",
              }
            : prev
        );
      }

      window.location.href = data.url;
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "There was a problem starting Stripe checkout.");
    } finally {
      setBillingActionLoading(false);
    }
  };

  const handleCollectFirstPayment = async () => {
    if (!customer) return;

    const premium = String(customer.monthlyPremium || "").trim();

    if (!premium) {
      alert(
        "Set the customer's Monthly Premium first, then save the profile before collecting payment."
      );
      return;
    }

    await beginStripeCheckout({
      mode: "payment",
      amount: Math.round(Number(String(premium).replace(/[$,\s]/g, "")) * 100),
      description: `First payment for ${customer.name || "customer"}`,
      chargeType: "first_payment",
    });
  };

  const handleStartMonthlyBilling = async () => {
    if (!customer) return;

    const premium = String(customer.monthlyPremium || "").trim();

    if (!premium) {
      alert(
        "Set the customer's Monthly Premium first, then save the profile before starting monthly billing."
      );
      return;
    }

    await beginStripeCheckout({
      mode: "subscription",
      monthlyPremium: premium,
      description: `Monthly billing for ${customer.name || "customer"}`,
      chargeType: "subscription_setup",
    });
  };

  const handleChargeCustomerNow = async () => {
    if (!customer) return;

    const input = window.prompt(
      "Enter the one-time charge amount in dollars (example: 75 or 125.50)"
    );

    if (!input) return;

    const amountCents = parseDollarInputToCents(input);

    if (!amountCents || amountCents < 50) {
      alert("Enter a valid amount of at least $0.50.");
      return;
    }

    const confirmed = window.confirm(
      `Charge ${customer.name || "this customer"} ${formatCentsForDisplay(
        amountCents
      )} as a one-time payment?`
    );

    if (!confirmed) return;

    await beginStripeCheckout({
      mode: "payment",
      amount: amountCents,
      description: `One-time charge for ${customer.name || "customer"}`,
      chargeType: "manual_one_time",
    });
  };

  const handleUpdateCard = async () => {
    if (!customer) return;

    if (!customer.stripeCustomerId) {
      alert(
        "This customer does not have a Stripe customer record yet. Start billing first before updating the card on file."
      );
      return;
    }

    try {
      setBillingActionLoading(true);

      const res = await fetch("/api/stripe/customer-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: customer.id,
          stripeCustomerId: customer.stripeCustomerId,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.ok === false || !data.url) {
        throw new Error(data.error || "Unable to open Stripe customer portal.");
      }

      window.location.href = data.url;
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "There was a problem opening the card update flow.");
    } finally {
      setBillingActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!customer) return;

    if (!customer.stripeSubscriptionId) {
      alert(
        "This customer does not have an active Stripe subscription to cancel."
      );
      return;
    }

    const confirmed = window.confirm(
      "Cancel this subscription at the end of the current billing period?"
    );

    if (!confirmed) return;

    try {
      setBillingActionLoading(true);

      const res = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: customer.id,
          stripeSubscriptionId: customer.stripeSubscriptionId,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "Unable to cancel subscription.");
      }

      await refreshCustomerFromApi();

      alert("Subscription has been marked to cancel at period end.");
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "There was a problem canceling the subscription.");
    } finally {
      setBillingActionLoading(false);
    }
  };

  const handleViewAllPayments = () => {
    alert(
      "This page now shows the full synced payment history. A separate full-screen payments page is not wired yet."
    );
  };

  const handleViewReceipt = (receiptUrl?: string) => {
    if (!receiptUrl) {
      alert("No receipt is available for this transaction.");
      return;
    }

    window.open(receiptUrl, "_blank", "noopener,noreferrer");
  };

  const handleViewFullPolicy = () => {
    alert("Full policy view coming soon.");
  };

  const handleGenerateDeclarationsPage = () => {
    if (!customer) return;

    const fallbackVehicleText = [customer.year, customer.make, customer.model]
      .filter(Boolean)
      .join(" ");

    const vehiclesRaw = customer.vehicles || fallbackVehicleText || "";
    const vehicleItems = vehiclesRaw
      .split(/\r?\n/)
      .map((v) => v.trim())
      .filter(Boolean);

    const vehicleListHtml =
      vehicleItems.length > 0
        ? vehicleItems.map((v) => `<li>${escapeHtml(v)}</li>`).join("")
        : "<li>—</li>";

    const generatedAt = new Date().toLocaleString();

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Declarations Page - ${escapeHtml(customer.name || "Customer")}</title>
          <style>
            body {
              font-family: Arial, Helvetica, sans-serif;
              margin: 0;
              background: #f3f4f6;
              color: #111827;
            }
            .page {
              max-width: 900px;
              margin: 24px auto;
              background: #ffffff;
              padding: 32px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.08);
            }
            .topbar {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #dc2626;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            .brand h1 {
              margin: 0;
              font-size: 28px;
              color: #dc2626;
            }
            .brand p {
              margin: 6px 0 0;
              color: #6b7280;
              font-size: 14px;
            }
            .meta {
              text-align: right;
              font-size: 13px;
              color: #374151;
            }
            .section {
              margin-bottom: 24px;
            }
            .section h2 {
              margin: 0 0 12px;
              font-size: 18px;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 8px;
            }
            .grid {
              display: grid;
              grid-template-columns: 180px 1fr;
              gap: 8px 16px;
              font-size: 14px;
            }
            .label {
              font-weight: 700;
              color: #374151;
            }
            .value {
              color: #111827;
              word-break: break-word;
            }
            ul {
              margin: 0;
              padding-left: 18px;
            }
            .footer {
              margin-top: 32px;
              padding-top: 16px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #6b7280;
            }
            .actions {
              max-width: 900px;
              margin: 16px auto 0;
              display: flex;
              justify-content: flex-end;
              gap: 12px;
            }
            .actions button {
              border: 1px solid #d1d5db;
              background: #fff;
              border-radius: 999px;
              padding: 10px 16px;
              cursor: pointer;
              font-size: 14px;
            }
            .actions button.primary {
              background: #dc2626;
              color: #fff;
              border-color: #dc2626;
            }
            @media print {
              body {
                background: #fff;
              }
              .actions {
                display: none;
              }
              .page {
                margin: 0;
                max-width: none;
                box-shadow: none;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="actions">
            <button onclick="history.back()">Back</button>
            <button class="primary" onclick="window.print()">Print / Save PDF</button>
          </div>

          <div class="page">
            <div class="topbar">
              <div class="brand">
                <h1>Apex Coverage</h1>
                <p>Policy Declarations Page</p>
              </div>
              <div class="meta">
                <div><strong>Generated:</strong> ${escapeHtml(generatedAt)}</div>
                <div><strong>Customer ID:</strong> ${escapeHtml(String(customer.id || "—"))}</div>
              </div>
            </div>

            <div class="section">
              <h2>Named Insured</h2>
              <div class="grid">
                <div class="label">Customer Name</div>
                <div class="value">${escapeHtml(customer.name || "—")}</div>

                <div class="label">Email</div>
                <div class="value">${escapeHtml(customer.email || "—")}</div>

                <div class="label">Phone</div>
                <div class="value">${escapeHtml(customer.phone || "—")}</div>

                <div class="label">ZIP Code</div>
                <div class="value">${escapeHtml(customer.zip || "—")}</div>

                <div class="label">Date of Birth</div>
                <div class="value">${escapeHtml(customer.dob || "—")}</div>
              </div>
            </div>

            <div class="section">
              <h2>Policy Information</h2>
              <div class="grid">
                <div class="label">Policy Number</div>
                <div class="value">${escapeHtml(
                  customer.policyNumber && customer.policyNumber.trim()
                    ? customer.policyNumber
                    : "Policy number not set"
                )}</div>

                <div class="label">Coverage</div>
                <div class="value">${escapeHtml(customer.coverage || "Full Coverage")}</div>

                <div class="label">Deductibles</div>
                <div class="value">${escapeHtml(
                  customer.deductibles || "$500 Comp / $1,000 Collision"
                )}</div>

                <div class="label">Discounts</div>
                <div class="value">${escapeHtml(
                  customer.discounts && customer.discounts.trim()
                    ? customer.discounts
                    : "—"
                )}</div>

                <div class="label">Renewal Date</div>
                <div class="value">${escapeHtml(
                  customer.renewalDate && customer.renewalDate.trim()
                    ? customer.renewalDate
                    : "—"
                )}</div>

                <div class="label">Monthly Premium</div>
                <div class="value">${escapeHtml(
                  customer.monthlyPremium && customer.monthlyPremium.trim()
                    ? formatCurrency(customer.monthlyPremium)
                    : "—"
                )}</div>

                <div class="label">Assigned Agent</div>
                <div class="value">${escapeHtml(customer.agent || "Unassigned")}</div>
              </div>
            </div>

            <div class="section">
              <h2>Covered Vehicle(s)</h2>
              <ul>
                ${vehicleListHtml}
              </ul>
            </div>

            <div class="section">
              <h2>Billing Status</h2>
              <div class="grid">
                <div class="label">Billing Status</div>
                <div class="value">${escapeHtml(
                  customer.billingStatus ? customer.billingStatus.replace(/_/g, " ") : "Not started"
                )}</div>

                <div class="label">Last Invoice Status</div>
                <div class="value">${escapeHtml(customer.lastInvoiceStatus || "—")}</div>

                <div class="label">Last Payment Date</div>
                <div class="value">${escapeHtml(formatDateTime(customer.lastPaymentDate))}</div>
              </div>
            </div>

            <div class="footer">
              This declarations page was generated from Apex Coverage CRM data.
            </div>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.location.assign(url);
  };

  const handleUploadFile = () => {
    alert("File upload (policy docs, IDs, etc.) coming soon.");
  };

  const handleViewFile = () => {
    alert("File viewer coming soon.");
  };

  const handleDownloadFile = () => {
    alert("File download coming soon.");
  };

  const handleAddNote = async () => {
    if (!customer) return;

    const text = window.prompt("Add a note for this customer:");
    if (!text || !text.trim()) return;

    try {
      const res = await fetch("/api/agent/customers/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: customer.id,
          activityNote: text.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "Unable to save note.");
      }

      await refreshCustomerFromApi();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "There was a problem saving the note.");
    }
  };

  useEffect(() => {
    async function loadCustomer() {
      try {
        setLoading(true);
        setError(null);
        await refreshCustomerFromApi();
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error loading customer");
      } finally {
        setLoading(false);
      }
    }

    if (params?.id) {
      loadCustomer();
    }
  }, [params?.id]);

  useEffect(() => {
    const paid = searchParams.get("paid");
    const canceled = searchParams.get("canceled");

    if (!customer) return;
    if (!paid && !canceled) return;

    refreshCustomerFromApi().catch((err) => {
      console.error("Failed to refresh customer after Stripe redirect:", err);
    });
  }, [searchParams, customer]);

  const fallbackVehicle = customer
    ? [customer.year, customer.make, customer.model].filter(Boolean).join(" ")
    : "";

  const vehicleLines = useMemo(() => {
    const vehiclesRaw = customer?.vehicles || fallbackVehicle || "";
    return vehiclesRaw
      .split(/\r?\n/)
      .map((v) => v.trim())
      .filter(Boolean);
  }, [customer?.vehicles, fallbackVehicle]);

  const policyNumber =
    customer?.policyNumber && customer.policyNumber.trim().length > 0
      ? customer.policyNumber
      : "Policy number not set";

  const coverageText = customer?.coverage || "Full Coverage";
  const deductiblesText =
    customer?.deductibles || "$500 Comp / $1,000 Collision";
  const discountsText =
    customer?.discounts && customer.discounts.trim().length > 0
      ? customer.discounts
      : "—";
  const renewalText =
    customer?.renewalDate && customer.renewalDate.trim().length > 0
      ? customer.renewalDate
      : "—";
  const monthlyPremiumText =
    customer?.monthlyPremium && customer.monthlyPremium.trim().length > 0
      ? formatCurrency(customer.monthlyPremium)
      : "—";

  const billingMeta = getBillingStatusMeta(customer?.billingStatus);
  const stripeModeText =
    customer?.stripeMode && customer.stripeMode.trim()
      ? customer.stripeMode
      : "—";

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-gray-900">
        <div className="max-w-5xl mx-auto px-4 py-10 text-sm text-gray-600">
          Loading customer…
        </div>
      </main>
    );
  }

  if (error || !customer) {
    return (
      <main className="min-h-screen bg-slate-50 text-gray-900">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <button
            onClick={handleBackToCustomers}
            className="mb-4 inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-100"
          >
            ← Back to customers
          </button>
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error || "Customer not found"}
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <div className="crm-page">
        <header className="crm-header">
          <div className="crm-header-left">
            <button className="btn-secondary" onClick={handleBackToCustomers}>
              &larr; Back to Customers
            </button>
            <div className="crm-header-title">
              <h1>Customer Profile</h1>
              <span className="crm-breadcrumb">
                Dashboard &gt; Customers &gt; {customer.name || "Customer"}
              </span>
            </div>
          </div>
          <div className="crm-header-right">
            <button className="btn-secondary" onClick={handleAddNote}>
              Add Note
            </button>
            <button
              className="btn-secondary"
              onClick={handleGenerateDeclarationsPage}
            >
              Generate Declarations Page
            </button>
            <button className="btn-primary" onClick={handleEditProfile}>
              Edit Profile
            </button>
          </div>
        </header>

        {(searchParams.get("paid") === "1" ||
          searchParams.get("canceled") === "1") && (
          <section className="card" style={{ marginBottom: "1rem" }}>
            <div className="card-body">
              {searchParams.get("paid") === "1" ? (
                <div className="notice-success">
                  Stripe checkout returned successfully. Billing data and payment
                  history will appear here after the webhook updates Google
                  Sheets.
                </div>
              ) : (
                <div className="notice-warning">
                  Stripe checkout was canceled. No billing changes were applied.
                </div>
              )}
            </div>
          </section>
        )}

        {isEditing && (
          <section className="card" style={{ marginBottom: "1rem" }}>
            <div className="card-header">
              <h3>Edit Profile</h3>
            </div>
            <div className="card-body">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "0.75rem",
                  fontSize: "0.85rem",
                  marginBottom: "1rem",
                }}
              >
                <div>
                  <label className="meta-text">Name</label>
                  <input
                    name="name"
                    value={editForm.name}
                    onChange={handleEditInputChange}
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="meta-text">Email</label>
                  <input
                    name="email"
                    value={editForm.email}
                    onChange={handleEditInputChange}
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="meta-text">Phone</label>
                  <input
                    name="phone"
                    value={editForm.phone}
                    onChange={handleEditInputChange}
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="meta-text">ZIP</label>
                  <input
                    name="zip"
                    value={editForm.zip}
                    onChange={handleEditInputChange}
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="meta-text">Date of Birth</label>
                  <input
                    name="dob"
                    value={editForm.dob}
                    onChange={handleEditInputChange}
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="meta-text">Assigned Agent</label>
                  <input
                    name="agent"
                    value={editForm.agent}
                    onChange={handleEditInputChange}
                    className="crm-input"
                  />
                </div>
              </div>

              <hr style={{ margin: "0.5rem 0 1rem", borderColor: "#e5e7eb" }} />
              <h4
                style={{
                  fontSize: "0.95rem",
                  marginBottom: "0.5rem",
                  fontWeight: 600,
                }}
              >
                Policy Details
              </h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "0.75rem",
                  fontSize: "0.85rem",
                }}
              >
                <div>
                  <label className="meta-text">Coverage</label>
                  <input
                    name="coverage"
                    value={editForm.coverage}
                    onChange={handleEditInputChange}
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="meta-text">Deductibles</label>
                  <input
                    name="deductibles"
                    value={editForm.deductibles}
                    onChange={handleEditInputChange}
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="meta-text">Discounts</label>
                  <input
                    name="discounts"
                    value={editForm.discounts}
                    onChange={handleEditInputChange}
                    className="crm-input"
                    placeholder="e.g. Military, Safe Driver"
                  />
                </div>
                <div>
                  <label className="meta-text">Renewal Date</label>
                  <input
                    name="renewalDate"
                    value={editForm.renewalDate}
                    onChange={handleEditInputChange}
                    className="crm-input"
                    placeholder="e.g. 12/18/2025"
                  />
                </div>
                <div>
                  <label className="meta-text">Monthly Premium</label>
                  <input
                    name="monthlyPremium"
                    value={editForm.monthlyPremium}
                    onChange={handleEditInputChange}
                    className="crm-input"
                    placeholder="e.g. 189"
                  />
                </div>
              </div>

              <div style={{ marginTop: "0.75rem" }}>
                <label className="meta-text">
                  Vehicles (one per line, e.g. &quot;2019 Ford F-150&quot;)
                </label>
                <textarea
                  name="vehicles"
                  value={editForm.vehicles}
                  onChange={handleEditInputChange}
                  className="crm-input"
                  rows={3}
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>
            <div className="card-footer" style={{ textAlign: "right" }}>
              <button
                className="btn-secondary"
                onClick={handleCancelEdit}
                style={{ marginRight: "0.5rem" }}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSaveEdit}>
                Save Changes
              </button>
            </div>
          </section>
        )}

        <main className="crm-main">
          <section className="card card-summary">
            <div className="card-summary-left">
              <h2 className="customer-name">{customer.name}</h2>
              <p>
                Policy #: <strong>{policyNumber}</strong>
              </p>
              <p>
                Status:{" "}
                <span className="status-pill status-active">
                  {customer.status || "Active"}
                </span>
              </p>
              <p>
                Assigned Agent:{" "}
                <strong>{customer.agent || "Unassigned"}</strong>
              </p>
            </div>
            <div className="card-summary-right">
              <p>
                Phone:{" "}
                {customer.phone ? (
                  <a href={getPhoneHref(customer.phone)}>{customer.phone}</a>
                ) : (
                  "—"
                )}
              </p>
              <p>
                Email:{" "}
                {customer.email ? (
                  <a href={`mailto:${customer.email}`}>{customer.email}</a>
                ) : (
                  "—"
                )}
              </p>
              <p>Location: {customer.zip || "—"}</p>
              <p className="meta-text">Created: {customer.when}</p>
            </div>
          </section>

          <section className="grid-two">
            <section className="card">
              <div className="card-header">
                <h3>Contact Info</h3>
              </div>
              <div className="card-body">
                <dl className="details-list">
                  <div>
                    <dt>Name</dt>
                    <dd>{customer.name || "—"}</dd>
                  </div>
                  <div>
                    <dt>Phone</dt>
                    <dd>{customer.phone || "—"}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{customer.email || "—"}</dd>
                  </div>
                  <div>
                    <dt>Address</dt>
                    <dd>{customer.zip ? `ZIP: ${customer.zip}` : "—"}</dd>
                  </div>
                  <div>
                    <dt>Date of Birth</dt>
                    <dd>{customer.dob || "—"}</dd>
                  </div>
                </dl>
              </div>
              <div className="card-footer">
                <button
                  className="link-button"
                  onClick={handleEditContactDetails}
                >
                  Edit contact details
                </button>
              </div>
            </section>

            <section className="card">
              <div className="card-header">
                <h3>Policy Details</h3>
              </div>
              <div className="card-body">
                <dl className="details-list">
                  <div>
                    <dt>Policy #</dt>
                    <dd>{policyNumber}</dd>
                  </div>
                  <div>
                    <dt>Coverage</dt>
                    <dd>{coverageText}</dd>
                  </div>
                  <div>
                    <dt>Vehicles</dt>
                    <dd>
                      {vehicleLines.length === 0 ? (
                        "—"
                      ) : (
                        <ul className="policy-vehicle-list">
                          {vehicleLines.map((v) => (
                            <li key={v}>{v}</li>
                          ))}
                        </ul>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Deductibles</dt>
                    <dd>{deductiblesText}</dd>
                  </div>
                  <div>
                    <dt>Discounts</dt>
                    <dd>{discountsText}</dd>
                  </div>
                  <div>
                    <dt>Renewal Date</dt>
                    <dd>{renewalText}</dd>
                  </div>
                  <div>
                    <dt>Monthly Premium</dt>
                    <dd>{monthlyPremiumText}</dd>
                  </div>
                </dl>
              </div>
              <div className="card-footer">
                <button className="link-button" onClick={handleViewFullPolicy}>
                  View full policy info
                </button>
              </div>
            </section>
          </section>

          <section className="card">
            <div className="card-header card-header-with-actions">
              <div>
                <h3>Billing &amp; Payments</h3>
                <p className="subtitle">
                  Manage billing status, payment method, and history.
                </p>
              </div>
              <div className="card-actions">
                <button
                  className="btn-primary"
                  onClick={handleCollectFirstPayment}
                  disabled={billingActionLoading}
                >
                  {billingActionLoading
                    ? "Working..."
                    : "Collect First Payment"}
                </button>
                <button
                  className="btn-outline"
                  onClick={handleStartMonthlyBilling}
                  disabled={billingActionLoading}
                >
                  {billingActionLoading
                    ? "Working..."
                    : "Start Monthly Billing"}
                </button>
                <button
                  className="btn-outline"
                  onClick={handleChargeCustomerNow}
                  disabled={billingActionLoading}
                >
                  {billingActionLoading
                    ? "Working..."
                    : "Charge Customer Now"}
                </button>
                <button
                  className="btn-outline"
                  onClick={handleCancelSubscription}
                  disabled={billingActionLoading}
                >
                  Cancel Subscription
                </button>
              </div>
            </div>

            <div className="card-body billing-layout">
              <div className="billing-overview">
                <h4>Billing Overview</h4>
                <dl className="details-list">
                  <div>
                    <dt>Billing Status</dt>
                    <dd>
                      <span className={billingMeta.className}>
                        {billingMeta.label}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt>Monthly Premium</dt>
                    <dd>{monthlyPremiumText}</dd>
                  </div>
                  <div>
                    <dt>Stripe Mode</dt>
                    <dd>{stripeModeText}</dd>
                  </div>
                  <div>
                    <dt>Last Invoice Status</dt>
                    <dd>{customer.lastInvoiceStatus || "—"}</dd>
                  </div>
                  <div>
                    <dt>Last Payment Date</dt>
                    <dd>{formatDateTime(customer.lastPaymentDate)}</dd>
                  </div>
                </dl>
              </div>

              <div className="payment-method">
                <h4>Stripe / Payment Record</h4>
                <p>
                  Stripe Customer ID:{" "}
                  <span className="mono-text">
                    {customer.stripeCustomerId || "—"}
                  </span>
                </p>
                <p>
                  Stripe Subscription ID:{" "}
                  <span className="mono-text">
                    {customer.stripeSubscriptionId || "—"}
                  </span>
                </p>
                <p>Name on Card: {customer.name || "—"}</p>
                <p className="meta-text">
                  Open Stripe to update the saved card or billing method.
                </p>
                <button
                  className="link-button"
                  onClick={handleUpdateCard}
                  disabled={billingActionLoading}
                >
                  Update card on file
                </button>
              </div>
            </div>

            <div className="card-subsection">
              <div className="card-subheader">
                <h4>Payment History</h4>
                <button className="link-button" onClick={handleViewAllPayments}>
                  View all
                </button>
              </div>
              <div className="table-wrapper payment-history-scroll">
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistoryRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="empty-cell">
                          No Stripe payment history has been synced yet.
                        </td>
                      </tr>
                    ) : (
                      paymentHistoryRows.map((row, idx) => (
                        <tr
                          key={`${row.date}-${row.status}-${row.eventType}-${idx}`}
                        >
                          <td>{row.date}</td>
                          <td>{row.amount}</td>
                          <td>{row.method}</td>
                          <td>
                            <span className={row.statusClass}>
                              {row.status || "—"}
                            </span>
                          </td>
                          <td>
                            <button
                              className="link-button"
                              onClick={() => handleViewReceipt(row.receiptUrl)}
                              disabled={!row.receiptUrl}
                            >
                              {row.receiptUrl ? "View Receipt" : "No Receipt"}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-header card-header-with-actions">
              <h3>Activity Log</h3>
              <button className="btn-secondary" onClick={handleAddNote}>
                + Add Note
              </button>
            </div>
            <div className="card-body activity-log activity-log-scroll">
              {activityNotes.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No notes yet. Click &quot;Add Note&quot; to record an update
                  for this customer.
                </p>
              ) : (
                activityNotes.map((note) => (
                  <article key={note.id} className="activity-item">
                    <div className="activity-meta">
                      <span className="activity-date">{note.createdAt}</span>
                      <span className="activity-agent">{note.agent}</span>
                    </div>
                    <p>{note.text}</p>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="card">
            <div className="card-header card-header-with-actions">
              <h3>Files &amp; Documents</h3>
              <button className="btn-secondary" onClick={handleUploadFile}>
                Upload New File
              </button>
            </div>
            <div className="card-body">
              <ul className="file-list">
                <li>
                  <span>Quote PDF</span>
                  <div className="file-actions">
                    <button className="link-button" onClick={handleViewFile}>
                      View
                    </button>
                    <button
                      className="link-button"
                      onClick={handleDownloadFile}
                    >
                      Download
                    </button>
                  </div>
                </li>
                <li>
                  <span>ID Cards</span>
                  <div className="file-actions">
                    <button className="link-button" onClick={handleViewFile}>
                      View
                    </button>
                    <button
                      className="link-button"
                      onClick={handleDownloadFile}
                    >
                      Download
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </section>
        </main>
      </div>

      <style jsx global>{`
        :root {
          --bg-page: #f3f4f6;
          --bg-card: #ffffff;
          --border-subtle: #e5e7eb;
          --text-main: #111827;
          --text-muted: #6b7280;
          --primary: #dc2626;
          --primary-soft: #fee2e2;
          --accent: #2563eb;
          --radius-lg: 0.75rem;
          --shadow-soft: 0 10px 25px rgba(15, 23, 42, 0.06);
        }

        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
          margin: 0;
          background: var(--bg-page);
          color: var(--text-main);
        }

        .crm-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1.5rem;
        }

        .crm-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          gap: 1rem;
        }

        .crm-header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .crm-header-title h1 {
          margin: 0;
          font-size: 1.4rem;
        }

        .crm-breadcrumb {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .crm-header-right {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .crm-main {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .card {
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-soft);
          border: 1px solid var(--border-subtle);
          overflow: hidden;
        }

        .card-summary {
          display: flex;
          justify-content: space-between;
          gap: 1.5rem;
          padding: 1.25rem 1.5rem;
        }

        .card-summary-left h2 {
          margin: 0 0 0.25rem;
        }

        .card-summary-left p,
        .card-summary-right p {
          margin: 0.1rem 0;
        }

        .card-summary-right {
          text-align: right;
          font-size: 0.9rem;
        }

        .meta-text {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .mono-text {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
          font-size: 0.78rem;
          word-break: break-all;
        }

        .card-header,
        .card-subheader {
          padding: 0.9rem 1.25rem;
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
        }

        .card-header h3,
        .card-subheader h4 {
          margin: 0;
          font-size: 1rem;
        }

        .card-header-with-actions {
          padding: 0.9rem 1.25rem;
        }

        .card-actions {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
        }

        .card-body {
          padding: 1rem 1.25rem;
        }

        .card-footer {
          padding: 0.75rem 1.25rem;
          border-top: 1px solid var(--border-subtle);
          text-align: right;
        }

        .card-subsection {
          padding: 0 1.25rem 1rem;
        }

        .subtitle {
          margin: 0.2rem 0 0;
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .grid-two {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 1rem;
        }

        .details-list {
          margin: 0;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 0.4rem;
        }

        .details-list div {
          display: grid;
          grid-template-columns: 120px minmax(0, 1fr);
          column-gap: 0.5rem;
          row-gap: 0.1rem;
          font-size: 0.9rem;
        }

        dt {
          font-weight: 600;
          color: var(--text-muted);
        }

        dd {
          margin: 0;
        }

        .billing-layout {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(0, 1.5fr);
          gap: 1rem;
        }

        .billing-overview h4,
        .payment-method h4 {
          margin: 0 0 0.5rem;
        }

        .table-wrapper {
          overflow-x: auto;
          margin-top: 0.75rem;
        }

        .payment-history-scroll {
          max-height: 360px;
          overflow: auto;
          padding-right: 0.2rem;
        }

        .payment-history-scroll::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        .payment-history-scroll::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 999px;
        }

        .payment-history-scroll::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 999px;
        }

        .payment-history-scroll::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }

        .crm-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.88rem;
        }

        .crm-table th,
        .crm-table td {
          padding: 0.5rem 0.5rem;
          border-bottom: 1px solid var(--border-subtle);
          text-align: left;
          white-space: nowrap;
        }

        .crm-table th {
          font-weight: 600;
          font-size: 0.8rem;
          color: var(--text-muted);
          position: sticky;
          top: 0;
          background: var(--bg-card);
          z-index: 1;
        }

        .empty-cell {
          color: var(--text-muted);
          text-align: center;
          padding: 1rem 0.5rem;
        }

        .activity-log {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .activity-log-scroll {
          max-height: 420px;
          overflow-y: auto;
          padding-right: 0.35rem;
        }

        .activity-log-scroll::-webkit-scrollbar {
          width: 10px;
        }

        .activity-log-scroll::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 999px;
        }

        .activity-log-scroll::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 999px;
        }

        .activity-log-scroll::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }

        .activity-item {
          padding: 0.6rem 0;
          border-bottom: 1px dashed var(--border-subtle);
        }

        .activity-item:last-child {
          border-bottom: none;
        }

        .activity-meta {
          display: flex;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-bottom: 0.2rem;
        }

        .activity-agent {
          font-weight: 600;
        }

        .file-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .file-list li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.4rem 0;
          border-bottom: 1px solid var(--border-subtle);
          font-size: 0.9rem;
        }

        .file-actions {
          display: flex;
          gap: 0.5rem;
        }

        .policy-vehicle-list {
          list-style: disc;
          padding-left: 1.1rem;
          margin: 0;
        }

        .policy-vehicle-list li {
          margin: 0;
          padding: 0;
        }

        .btn-primary,
        .btn-secondary,
        .btn-outline,
        .link-button {
          font-family: inherit;
          font-size: 0.85rem;
          cursor: pointer;
          border-radius: 999px;
          border: none;
          padding: 0.4rem 0.9rem;
          transition: all 0.15s ease;
        }

        .btn-primary:disabled,
        .btn-secondary:disabled,
        .btn-outline:disabled,
        .link-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .btn-primary {
          background: var(--primary);
          color: #fff;
          border: 1px solid var(--primary);
        }

        .btn-primary:hover:not(:disabled) {
          background: #b91c1c;
        }

        .btn-secondary {
          background: #f9fafb;
          color: var(--text-main);
          border: 1px solid var(--border-subtle);
        }

        .btn-secondary:hover:not(:disabled) {
          background: #eef2ff;
        }

        .btn-outline {
          background: #fff;
          color: var(--text-main);
          border: 1px solid var(--border-subtle);
        }

        .btn-outline:hover:not(:disabled) {
          border-color: var(--primary);
          color: var(--primary);
        }

        .link-button {
          background: transparent;
          border: none;
          color: var(--accent);
          padding: 0;
        }

        .link-button:hover:not(:disabled) {
          text-decoration: underline;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          padding: 0.1rem 0.55rem;
          font-size: 0.75rem;
          border-radius: 999px;
          font-weight: 600;
        }

        .status-active {
          background: #dcfce7;
          color: #166534;
        }

        .status-warning {
          background: #fef9c3;
          color: #854d0e;
        }

        .status-error {
          background: #fee2e2;
          color: #b91c1c;
        }

        .status-neutral {
          background: #e5e7eb;
          color: #374151;
        }

        .crm-input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid var(--border-subtle);
          padding: 0.35rem 0.5rem;
          font-size: 0.85rem;
        }

        .crm-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 1px var(--primary-soft);
        }

        .notice-success,
        .notice-warning {
          border-radius: 0.65rem;
          padding: 0.85rem 1rem;
          font-size: 0.9rem;
        }

        .notice-success {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #065f46;
        }

        .notice-warning {
          background: #fffbeb;
          border: 1px solid #fde68a;
          color: #92400e;
        }

        @media (max-width: 900px) {
          .card-summary {
            flex-direction: column;
            align-items: flex-start;
          }

          .card-summary-right {
            text-align: left;
          }

          .grid-two {
            grid-template-columns: minmax(0, 1fr);
          }

          .billing-layout {
            grid-template-columns: minmax(0, 1fr);
          }

          .crm-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .crm-header-right {
            align-self: stretch;
            justify-content: flex-start;
          }

          .payment-history-scroll {
            max-height: 320px;
          }

          .activity-log-scroll {
            max-height: 360px;
          }
        }
      `}</style>
    </>
  );
}

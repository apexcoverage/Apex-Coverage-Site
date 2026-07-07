"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

type AutoLead = {
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
  coverage?: string;
  deductibles?: string;
  discounts?: string;
  renewalDate?: string;
  vehicles?: string;
  monthlyPremium?: string;
  activityLog?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  billingStatus?: string;
  lastInvoiceStatus?: string;
  lastPaymentDate?: string;
  stripeMode?: string;
};

type BuildReview = {
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
  vin: string;
  mileage: string;
  annualMileage: string;
  titleStatus: string;
  vehicleUse: string;
  partsList: string;
  partsValue: string;
  professionalInstallStatus: string;
  installerInfo: string;
  documentation: string;
  tierInterest: string;
  deductible: string;
  drivingHistory: string;
  claimHistory: string;
  discountNotes: string;
  autoInsuranceReview: string;
  consent: string;
  status?: string;
  agent?: string;
  source?: string;
  activityLog?: string;
};

type ApiListResponse<T> = {
  ok: boolean;
  rows?: T[];
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

type UiPaymentRow = {
  date: string;
  amount: string;
  method: string;
  status: string;
  statusClass: string;
  receiptUrl: string;
  eventType: string;
};

type ActivityItem = {
  key: string;
  source: "Auto" | "Build";
  createdAt: string;
  text: string;
};

type ContactForm = {
  name: string;
  email: string;
  phone: string;
  zip: string;
  dob: string;
  agent: string;
};

type AutoForm = {
  policyNumber: string;
  status: string;
  coverage: string;
  deductibles: string;
  discounts: string;
  renewalDate: string;
  vehicles: string;
  monthlyPremium: string;
};

type BuildForm = {
  status: string;
  year: string;
  make: string;
  model: string;
  vin: string;
  mileage: string;
  annualMileage: string;
  titleStatus: string;
  vehicleUse: string;
  partsList: string;
  partsValue: string;
  professionalInstallStatus: string;
  installerInfo: string;
  documentation: string;
  tierInterest: string;
  deductible: string;
  drivingHistory: string;
  claimHistory: string;
  discountNotes: string;
  autoInsuranceReview: string;
};

const AUTO_STATUSES = ["Won", "Inactive", "Canceled", "Lost", "Do Not Contact"];
const BUILD_STATUSES = ["Active", "Inactive", "Canceled", "Rejected", "Lost"];

function contactKey(item: { email?: string; phone?: string; name?: string }) {
  const email = String(item.email || "").trim().toLowerCase();
  const phone = String(item.phone || "").replace(/\D/g, "");
  const name = String(item.name || "").trim().toLowerCase();
  return email || phone || name;
}

function vehicleLabel(item: { year?: string; make?: string; model?: string }) {
  return [item.year, item.make, item.model].filter(Boolean).join(" ");
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function formatCurrency(value?: string) {
  if (!value) return "-";
  const amount = Number(String(value).replace(/[$,\s]/g, ""));
  if (!Number.isFinite(amount)) return value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatPaymentAmount(value?: string, currency?: string) {
  if (!value) return "-";
  const amount = Number(String(value).replace(/[$,\s]/g, ""));
  if (!Number.isFinite(amount)) return value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: String(currency || "usd").toUpperCase(),
  }).format(amount);
}

function getBillingStatusMeta(status?: string) {
  const normalized = String(status || "").trim().toLowerCase();

  if (["active", "paid", "trialing", "succeeded"].includes(normalized)) {
    return { label: normalized || "active", className: "status-pill status-active" };
  }

  if (
    [
      "initiated",
      "incomplete",
      "processing",
      "open",
      "unpaid",
      "paused",
      "pending",
    ].includes(normalized)
  ) {
    return { label: normalized || "pending", className: "status-pill status-warning" };
  }

  if (["past_due", "canceled", "cancelled", "failed"].includes(normalized)) {
    return { label: normalized, className: "status-pill status-error" };
  }

  return { label: normalized || "not started", className: "status-pill status-neutral" };
}

function getFriendlyPaymentMethod(row: PaymentHistoryRow) {
  const rawMethod = String(row.method || "").trim().toLowerCase();
  const rawEvent = String(row.eventType || "").trim().toLowerCase();
  const hasSub = !!String(row.stripeSubscriptionId || "").trim();

  if (rawEvent.includes("manual_one_time")) return "One-Time Charge";
  if (rawEvent.includes("payment_failed")) return hasSub ? "Failed Renewal" : "Failed Payment";
  if (rawEvent.includes("checkout.session.completed")) {
    return hasSub ? "Billing Setup" : "Initial Payment";
  }
  if (rawEvent.includes("invoice.paid")) return hasSub ? "Monthly Renewal" : "Invoice Payment";
  if (rawEvent.includes("invoice.payment_failed")) return hasSub ? "Failed Renewal" : "Failed Invoice";
  if (rawEvent.includes("subscription.deleted")) return "Subscription Ended";
  if (rawEvent.includes("subscription.updated")) return "Subscription Update";
  if (rawMethod.includes("one-time")) return "One-Time Charge";
  if (rawMethod.includes("subscription")) return "Monthly Renewal";
  if (rawMethod.includes("payment")) return "Initial Payment";
  return row.method || "Payment";
}

function getFriendlyPaymentStatus(row: PaymentHistoryRow) {
  const rawStatus = String(row.status || "").trim().toLowerCase();
  const rawEvent = String(row.eventType || "").trim().toLowerCase();

  if (rawEvent.includes("payment_failed")) return "Failed";
  if (rawEvent.includes("invoice.paid")) return "Paid";
  if (rawEvent.includes("checkout.session.completed")) return "Completed";
  if (rawEvent.includes("subscription.deleted")) return "Canceled";
  if (rawStatus === "paid" || rawStatus === "succeeded") return "Paid";
  if (rawStatus === "active") return "Active";
  if (rawStatus === "open") return "Open";
  if (rawStatus === "past_due") return "Past Due";
  if (rawStatus === "canceled" || rawStatus === "cancelled") return "Canceled";
  if (rawStatus === "failed") return "Failed";
  return row.status || "-";
}

function parseDollarInputToCents(value: string): number | null {
  const amount = Number(String(value).replace(/[$,\s]/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}

function formatCentsForDisplay(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function parseActivityLog(
  raw: string | undefined,
  source: "Auto" | "Build",
  id: number
): ActivityItem[] {
  if (!raw || !raw.trim()) return [];

  return raw
    .split(/\r?\n/)
    .map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return null;

      const parts = trimmed.split(" — ");
      const createdAt = parts.length > 1 ? parts[0].trim() : "Activity";
      const text = parts.length > 1 ? parts.slice(1).join(" — ").trim() : trimmed;

      return {
        key: `${source}-${id}-${index}`,
        source,
        createdAt,
        text,
      };
    })
    .filter(Boolean) as ActivityItem[];
}

function emptyContactForm(seed?: Partial<AutoLead & BuildReview>): ContactForm {
  return {
    name: seed?.name || "",
    email: seed?.email || "",
    phone: seed?.phone || "",
    zip: seed?.zip || "",
    dob: seed?.dob || "",
    agent: seed?.agent || "",
  };
}

function autoFormFromRecord(auto?: AutoLead): AutoForm {
  const fallbackVehicle = auto ? vehicleLabel(auto) : "";
  return {
    policyNumber: auto?.policyNumber || "",
    status: auto?.status || "Won",
    coverage: auto?.coverage || "",
    deductibles: auto?.deductibles || "",
    discounts: auto?.discounts || "",
    renewalDate: auto?.renewalDate || "",
    vehicles: auto?.vehicles || fallbackVehicle,
    monthlyPremium: auto?.monthlyPremium || "",
  };
}

function buildFormFromRecord(build?: BuildReview): BuildForm {
  return {
    status: build?.status || "Active",
    year: build?.year || "",
    make: build?.make || "",
    model: build?.model || "",
    vin: build?.vin || "",
    mileage: build?.mileage || "",
    annualMileage: build?.annualMileage || "",
    titleStatus: build?.titleStatus || "",
    vehicleUse: build?.vehicleUse || "",
    partsList: build?.partsList || "",
    partsValue: build?.partsValue || "",
    professionalInstallStatus: build?.professionalInstallStatus || "",
    installerInfo: build?.installerInfo || "",
    documentation: build?.documentation || "",
    tierInterest: build?.tierInterest || "",
    deductible: build?.deductible || "",
    drivingHistory: build?.drivingHistory || "",
    claimHistory: build?.claimHistory || "",
    discountNotes: build?.discountNotes || "",
    autoInsuranceReview: build?.autoInsuranceReview || "",
  };
}

export default function CustomerProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeId = String(params?.id || "");

  const [autoLeads, setAutoLeads] = useState<AutoLead[]>([]);
  const [buildReviews, setBuildReviews] = useState<BuildReview[]>([]);
  const [paymentHistoryRows, setPaymentHistoryRows] = useState<UiPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [billingActionLoading, setBillingActionLoading] = useState(false);

  const [editingContact, setEditingContact] = useState(false);
  const [editingAuto, setEditingAuto] = useState(false);
  const [editingBuildId, setEditingBuildId] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState<ContactForm>(emptyContactForm());
  const [autoForm, setAutoForm] = useState<AutoForm>(autoFormFromRecord());
  const [buildForm, setBuildForm] = useState<BuildForm>(buildFormFromRecord());

  const parsedRoute = useMemo(() => {
    if (routeId.startsWith("build-")) {
      return { kind: "build", id: Number(routeId.replace("build-", "")) };
    }
    if (routeId.startsWith("auto-")) {
      return { kind: "auto", id: Number(routeId.replace("auto-", "")) };
    }
    return { kind: "auto", id: Number(routeId) };
  }, [routeId]);

  const profile = useMemo(() => {
    const seedAuto =
      parsedRoute.kind === "auto"
        ? autoLeads.find((lead) => lead.id === parsedRoute.id)
        : undefined;
    const seedBuild =
      parsedRoute.kind === "build"
        ? buildReviews.find((review) => review.id === parsedRoute.id)
        : undefined;
    const seed = seedAuto || seedBuild;

    if (!seed) return null;

    const key = contactKey(seed);
    const matchedAutos = autoLeads.filter((lead) => contactKey(lead) === key);
    const matchedBuilds = buildReviews.filter((review) => contactKey(review) === key);
    const auto =
      matchedAutos.find((lead) => (lead.status || "") === "Won") ||
      matchedAutos[0];
    const activeBuilds = matchedBuilds.filter(
      (review) => (review.status || "") === "Active"
    );
    const primaryBuild = activeBuilds[0] || matchedBuilds[0];
    const display = auto || primaryBuild || seed;

    return {
      display,
      auto,
      autos: matchedAutos,
      builds: matchedBuilds,
      activeBuilds,
      primaryBuild,
      hasAuto: !!auto && (auto.status || "") === "Won",
      hasBuild: activeBuilds.length > 0,
    };
  }, [autoLeads, buildReviews, parsedRoute.id, parsedRoute.kind]);

  const activityItems = useMemo(() => {
    if (!profile) return [];

    const autoItems = profile.auto
      ? parseActivityLog(profile.auto.activityLog, "Auto", profile.auto.id)
      : [];
    const buildItems = profile.builds.flatMap((build) =>
      parseActivityLog(build.activityLog, "Build", build.id)
    );

    return [...autoItems, ...buildItems];
  }, [profile]);

  const coverageLabel = profile?.hasAuto && profile.hasBuild
    ? "Auto + Build"
    : profile?.hasBuild
      ? "Build Coverage"
      : "Auto Coverage";

  const billingMeta = getBillingStatusMeta(profile?.auto?.billingStatus);

  async function loadProfile() {
    try {
      setLoading(true);
      setError(null);

      const [autoRes, buildRes] = await Promise.all([
        fetch("/api/agent/leads", { cache: "no-store" }),
        fetch("/api/agent/build-reviews", { cache: "no-store" }),
      ]);

      const autoData: ApiListResponse<AutoLead> = await autoRes.json();
      const buildData: ApiListResponse<BuildReview> = await buildRes.json();

      if (!autoData.ok || !autoData.rows) {
        throw new Error(autoData.error || "Failed to load auto policies");
      }

      if (!buildData.ok || !buildData.rows) {
        throw new Error(buildData.error || "Failed to load build coverage");
      }

      setAutoLeads(autoData.rows);
      setBuildReviews(buildData.rows);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error loading customer profile");
    } finally {
      setLoading(false);
    }
  }

  async function loadPaymentHistory(autoId?: number) {
    if (!autoId) {
      setPaymentHistoryRows([]);
      return;
    }

    const res = await fetch(`/api/agent/payments?leadId=${autoId}`, {
      cache: "no-store",
    });
    const data: ApiListResponse<PaymentHistoryRow> = await res.json();

    if (!data.ok) {
      throw new Error(data.error || "Failed to load payment history");
    }

    setPaymentHistoryRows(
      (data.rows || []).map((row, index) => {
        const status = getFriendlyPaymentStatus(row);
        return {
          date: formatDateTime(row.timestamp),
          amount: formatPaymentAmount(row.amount, row.currency),
          method: getFriendlyPaymentMethod(row),
          status,
          statusClass: getBillingStatusMeta(status).className,
          receiptUrl: row.receiptUrl || "",
          eventType: row.eventType || `payment-${index}`,
        };
      })
    );
  }

  useEffect(() => {
    loadProfile();
  }, [routeId]);

  useEffect(() => {
    if (!profile?.auto?.id) {
      setPaymentHistoryRows([]);
      return;
    }

    loadPaymentHistory(profile.auto.id).catch((err) => {
      console.error("Failed to load payment history", err);
    });
  }, [profile?.auto?.id]);

  useEffect(() => {
    const paid = searchParams.get("paid");
    const canceled = searchParams.get("canceled");
    if (!paid && !canceled) return;
    loadProfile();
  }, [searchParams]);

  function openContactEditor() {
    if (!profile) return;
    setContactForm(emptyContactForm(profile.display));
    setEditingContact(true);
  }

  function openAutoEditor() {
    setAutoForm(autoFormFromRecord(profile?.auto));
    setEditingAuto(true);
  }

  function openBuildEditor(build: BuildReview) {
    setBuildForm(buildFormFromRecord(build));
    setEditingBuildId(build.id);
  }

  async function updateAuto(id: number, patch: Record<string, any>) {
    const res = await fetch("/api/agent/customers/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    const data = await res.json();
    if (!res.ok || data.ok === false) {
      throw new Error(data.error || "Could not update auto policy");
    }
  }

  async function updateBuild(id: number, patch: Record<string, any>) {
    const res = await fetch("/api/agent/build-reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, patch }),
    });
    const data = await res.json();
    if (!res.ok || data.ok === false) {
      throw new Error(data.error || "Could not update build coverage");
    }
  }

  async function saveContact() {
    if (!profile) return;
    setSaving("contact");

    try {
      const note = "Contact/profile details updated";
      const updates: Promise<void>[] = [];

      if (profile.auto) {
        updates.push(updateAuto(profile.auto.id, { ...contactForm, activityNote: note }));
      }

      profile.builds.forEach((build) => {
        updates.push(
          updateBuild(build.id, {
            ...contactForm,
            activityNote: note,
          })
        );
      });

      await Promise.all(updates);
      setEditingContact(false);
      await loadProfile();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Could not save contact details.");
    } finally {
      setSaving(null);
    }
  }

  async function saveAuto() {
    if (!profile?.auto) return;
    setSaving("auto");

    try {
      await updateAuto(profile.auto.id, {
        ...autoForm,
        activityNote: "Auto policy details updated",
      });
      setEditingAuto(false);
      await loadProfile();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Could not save auto policy.");
    } finally {
      setSaving(null);
    }
  }

  async function saveBuild() {
    if (!editingBuildId) return;
    setSaving(`build-${editingBuildId}`);

    try {
      await updateBuild(editingBuildId, {
        ...buildForm,
        activityNote: "Build coverage details updated",
      });
      setEditingBuildId(null);
      await loadProfile();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Could not save build coverage.");
    } finally {
      setSaving(null);
    }
  }

  async function addAutoCoverage() {
    if (!profile) return;
    setSaving("add-auto");

    try {
      const existingAuto = profile.autos[0];

      if (existingAuto) {
        await updateAuto(existingAuto.id, {
          status: "Won",
          activityNote: "Auto coverage reactivated from customer profile",
        });
      } else if (profile.primaryBuild) {
        const res = await fetch("/api/agent/cross-coverage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            direction: "auto-from-build",
            buildReviewId: profile.primaryBuild.id,
          }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Could not add auto coverage");
      }

      await loadProfile();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Could not add auto coverage.");
    } finally {
      setSaving(null);
    }
  }

  async function addBuildCoverage() {
    if (!profile?.auto) return;
    setSaving("add-build");

    try {
      const existingBuild = profile.builds[0];

      if (existingBuild) {
        await updateBuild(existingBuild.id, {
          status: "Active",
          activityNote: "Build coverage reactivated from customer profile",
        });
      } else {
        const res = await fetch("/api/agent/cross-coverage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            direction: "build-from-auto",
            autoLeadId: profile.auto.id,
          }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Could not add build coverage");
      }

      await loadProfile();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Could not add build coverage.");
    } finally {
      setSaving(null);
    }
  }

  async function setAutoActive(active: boolean) {
    if (!profile?.auto) return;
    setSaving("auto-status");

    try {
      await updateAuto(profile.auto.id, {
        status: active ? "Won" : "Inactive",
        activityNote: active
          ? "Auto coverage reactivated"
          : "Auto coverage deactivated",
      });
      await loadProfile();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Could not update auto status.");
    } finally {
      setSaving(null);
    }
  }

  async function setBuildActive(build: BuildReview, active: boolean) {
    setSaving(`build-status-${build.id}`);

    try {
      await updateBuild(build.id, {
        status: active ? "Active" : "Inactive",
        activityNote: active
          ? "Build coverage reactivated"
          : "Build coverage deactivated",
      });
      await loadProfile();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Could not update build status.");
    } finally {
      setSaving(null);
    }
  }

  async function addNote() {
    if (!profile) return;

    const text = window.prompt("Add a note for this customer:");
    if (!text || !text.trim()) return;

    setSaving("note");
    try {
      const note = text.trim();
      const updates: Promise<void>[] = [];

      if (profile.auto) updates.push(updateAuto(profile.auto.id, { activityNote: note }));
      profile.builds.forEach((build) =>
        updates.push(updateBuild(build.id, { activityNote: note }))
      );

      await Promise.all(updates);
      await loadProfile();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Could not save note.");
    } finally {
      setSaving(null);
    }
  }

  async function beginStripeCheckout(opts: {
    mode: "subscription" | "payment";
    amount?: number;
    monthlyPremium?: string;
    description?: string;
    chargeType?: string;
  }) {
    if (!profile?.auto) return;

    try {
      setBillingActionLoading(true);
      const auto = profile.auto;

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: auto.id,
          email: auto.email,
          name: auto.name,
          phone: auto.phone,
          stripeCustomerId: auto.stripeCustomerId,
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

      window.location.href = data.url;
    } catch (err: any) {
      console.error(err);
      alert(err.message || "There was a problem starting Stripe checkout.");
    } finally {
      setBillingActionLoading(false);
    }
  }

  async function collectFirstPayment() {
    const premium = String(profile?.auto?.monthlyPremium || "").trim();
    if (!premium) {
      alert("Set the monthly premium before collecting payment.");
      return;
    }

    await beginStripeCheckout({
      mode: "payment",
      amount: Math.round(Number(premium.replace(/[$,\s]/g, "")) * 100),
      description: `First payment for ${profile?.display.name || "customer"}`,
      chargeType: "first_payment",
    });
  }

  async function startMonthlyBilling() {
    const premium = String(profile?.auto?.monthlyPremium || "").trim();
    if (!premium) {
      alert("Set the monthly premium before starting billing.");
      return;
    }

    await beginStripeCheckout({
      mode: "subscription",
      monthlyPremium: premium,
      description: `Monthly billing for ${profile?.display.name || "customer"}`,
      chargeType: "subscription_setup",
    });
  }

  async function chargeCustomerNow() {
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
      `Charge ${profile?.display.name || "this customer"} ${formatCentsForDisplay(
        amountCents
      )} as a one-time payment?`
    );
    if (!confirmed) return;

    await beginStripeCheckout({
      mode: "payment",
      amount: amountCents,
      description: `One-time charge for ${profile?.display.name || "customer"}`,
      chargeType: "manual_one_time",
    });
  }

  async function updateCard() {
    const auto = profile?.auto;
    if (!auto?.stripeCustomerId) {
      alert("Start billing first before updating the card on file.");
      return;
    }

    try {
      setBillingActionLoading(true);
      const res = await fetch("/api/stripe/customer-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: auto.id,
          stripeCustomerId: auto.stripeCustomerId,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false || !data.url) {
        throw new Error(data.error || "Unable to open Stripe customer portal.");
      }
      window.location.href = data.url;
    } catch (err: any) {
      console.error(err);
      alert(err.message || "There was a problem opening Stripe.");
    } finally {
      setBillingActionLoading(false);
    }
  }

  async function cancelSubscription() {
    const auto = profile?.auto;
    if (!auto?.stripeSubscriptionId) {
      alert("This customer does not have an active Stripe subscription to cancel.");
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
          id: auto.id,
          stripeSubscriptionId: auto.stripeSubscriptionId,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "Unable to cancel subscription.");
      }
      await loadProfile();
      alert("Subscription has been marked to cancel at period end.");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "There was a problem canceling the subscription.");
    } finally {
      setBillingActionLoading(false);
    }
  }

  async function generateDeclarationsPage() {
    const auto = profile?.auto;
    if (!auto) return;

    try {
      const vehicleLines = String(auto.vehicles || vehicleLabel(auto) || "")
        .split(/\r?\n/)
        .map((v) => v.trim())
        .filter(Boolean);
      const discountParts = String(auto.discounts || "")
        .split(/[|,\n]/)
        .map((d) => d.trim())
        .filter(Boolean);

      const res = await fetch("/api/declarations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: auto.name || "",
          policyNumber: auto.policyNumber || "",
          startDate: auto.renewalDate || "",
          endDate: auto.renewalDate || "",
          totalPremium: auto.monthlyPremium || "",
          vehicles: vehicleLines,
          discounts: auto.discounts || "",
          discount1: discountParts[0] || "",
          discount2: discountParts[1] || "",
          discount3: discountParts[2] || "",
          discount4: discountParts[3] || "",
          discount5: discountParts[4] || "",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Error generating declaration");
      }

      await updateAuto(auto.id, { activityNote: "Declarations page generated" });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `declaration-${auto.name || "customer"}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      await loadProfile();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error generating declaration");
    }
  }

  function viewReceipt(receiptUrl?: string) {
    if (!receiptUrl) return;
    window.open(receiptUrl, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return <ShellMessage>Loading customer profile...</ShellMessage>;
  }

  if (error || !profile) {
    return (
      <ShellMessage>
        <button className="btn-secondary" onClick={() => router.push("/agent/customers")}>
          Back to Customers
        </button>
        <div className="notice-error">{error || "Customer not found"}</div>
      </ShellMessage>
    );
  }

  const auto = profile.auto;
  const primaryBuild = profile.primaryBuild;
  const display = profile.display;
  const autoVehicleLines = String(auto?.vehicles || (auto ? vehicleLabel(auto) : ""))
    .split(/\r?\n/)
    .map((v) => v.trim())
    .filter(Boolean);

  return (
    <>
      <div className="crm-page">
        <header className="crm-header">
          <div className="crm-header-left">
            <button className="btn-secondary" onClick={() => router.push("/agent/customers")}>
              Back to Customers
            </button>
            <div>
              <h1>Customer Profile</h1>
              <p className="meta-text">Dashboard / Customers / {display.name || "Customer"}</p>
            </div>
          </div>
          <div className="crm-header-right">
            <button className="btn-secondary" onClick={addNote} disabled={saving === "note"}>
              Add Note
            </button>
            {auto && (
              <button className="btn-secondary" onClick={generateDeclarationsPage}>
                Generate Declarations Page
              </button>
            )}
            <button className="btn-primary" onClick={openContactEditor}>
              Edit Contact
            </button>
          </div>
        </header>

        {(searchParams.get("paid") === "1" || searchParams.get("canceled") === "1") && (
          <section className="card">
            <div className="card-body">
              {searchParams.get("paid") === "1" ? (
                <div className="notice-success">
                  Stripe checkout returned successfully. Billing data will update after the webhook syncs.
                </div>
              ) : (
                <div className="notice-warning">
                  Stripe checkout was canceled. No billing changes were applied.
                </div>
              )}
            </div>
          </section>
        )}

        {editingContact && (
          <section className="card">
            <div className="card-header">
              <h2>Edit Shared Contact</h2>
            </div>
            <div className="card-body form-grid">
              <Input label="Name" value={contactForm.name} onChange={(value) => setContactForm((prev) => ({ ...prev, name: value }))} />
              <Input label="Email" value={contactForm.email} onChange={(value) => setContactForm((prev) => ({ ...prev, email: value }))} />
              <Input label="Phone" value={contactForm.phone} onChange={(value) => setContactForm((prev) => ({ ...prev, phone: value }))} />
              <Input label="ZIP" value={contactForm.zip} onChange={(value) => setContactForm((prev) => ({ ...prev, zip: value }))} />
              <Input label="Date of Birth" value={contactForm.dob} onChange={(value) => setContactForm((prev) => ({ ...prev, dob: value }))} />
              <Input label="Assigned Agent" value={contactForm.agent} onChange={(value) => setContactForm((prev) => ({ ...prev, agent: value }))} />
            </div>
            <CardActions>
              <button className="btn-secondary" onClick={() => setEditingContact(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={saveContact} disabled={saving === "contact"}>
                {saving === "contact" ? "Saving..." : "Save Contact"}
              </button>
            </CardActions>
          </section>
        )}

        <main className="crm-main">
          <section className="card card-summary">
            <div>
              <h2>{display.name || "Customer"}</h2>
              <div className="badge-row">
                <CoverageBadge active={profile.hasAuto} label="Auto Coverage" />
                <CoverageBadge active={profile.hasBuild} label="Build Coverage" />
              </div>
              <p className="meta-text">Coverage: {coverageLabel}</p>
              <p className="meta-text">Assigned Agent: {display.agent || "Unassigned"}</p>
            </div>
            <div className="summary-right">
              <p>{display.phone || "-"}</p>
              <p>{display.email || "-"}</p>
              <p>ZIP {display.zip || "-"}</p>
              <p className="meta-text">Created: {display.when || "-"}</p>
            </div>
          </section>

          <section className="grid-two">
            <section className="card">
              <div className="card-header">
                <h2>Contact Info</h2>
              </div>
              <div className="card-body">
                <Details
                  rows={[
                    ["Name", display.name],
                    ["Phone", display.phone],
                    ["Email", display.email],
                    ["ZIP", display.zip],
                    ["Date of Birth", display.dob],
                  ]}
                />
              </div>
              <CardActions>
                <button className="link-button" onClick={openContactEditor}>
                  Edit contact details
                </button>
              </CardActions>
            </section>

            <section className="card">
              <div className="card-header">
                <h2>Coverage Controls</h2>
              </div>
              <div className="card-body action-stack">
                {profile.hasAuto ? (
                  <button className="btn-outline" onClick={() => setAutoActive(false)}>
                    Deactivate Auto Coverage
                  </button>
                ) : (
                  <button className="btn-primary" onClick={addAutoCoverage} disabled={saving === "add-auto"}>
                    Add Auto Coverage
                  </button>
                )}

                {profile.hasBuild ? (
                  primaryBuild && (
                    <button className="btn-outline" onClick={() => setBuildActive(primaryBuild, false)}>
                      Deactivate Build Coverage
                    </button>
                  )
                ) : (
                  <button
                    className="btn-primary"
                    onClick={addBuildCoverage}
                    disabled={!auto || saving === "add-build"}
                  >
                    Add Build Coverage
                  </button>
                )}

                {!profile.hasAuto && profile.autos[0] && (
                  <button className="btn-outline" onClick={() => setAutoActive(true)}>
                    Reactivate Auto Coverage
                  </button>
                )}

                {!profile.hasBuild && profile.builds[0] && (
                  <button className="btn-outline" onClick={() => setBuildActive(profile.builds[0], true)}>
                    Reactivate Build Coverage
                  </button>
                )}

                {!auto && !primaryBuild && (
                  <p className="meta-text">No coverage records are available to manage.</p>
                )}
              </div>
            </section>
          </section>

          <section className="card">
            <div className="card-header card-header-with-actions">
              <div>
                <h2>Auto Policy</h2>
                <p className="subtitle">Policy, vehicle, premium, and billing setup.</p>
              </div>
              {auto && (
                <button className="btn-secondary" onClick={openAutoEditor}>
                  Edit Auto Policy
                </button>
              )}
            </div>
            {!auto ? (
              <div className="card-body empty-state">
                No auto policy record is attached to this customer.
              </div>
            ) : editingAuto ? (
              <>
                <div className="card-body form-grid">
                  <Input label="Policy Number" value={autoForm.policyNumber} onChange={(value) => setAutoForm((prev) => ({ ...prev, policyNumber: value }))} />
                  <Select label="Status" value={autoForm.status} options={AUTO_STATUSES} onChange={(value) => setAutoForm((prev) => ({ ...prev, status: value }))} />
                  <Input label="Coverage" value={autoForm.coverage} onChange={(value) => setAutoForm((prev) => ({ ...prev, coverage: value }))} />
                  <Input label="Deductibles" value={autoForm.deductibles} onChange={(value) => setAutoForm((prev) => ({ ...prev, deductibles: value }))} />
                  <Input label="Discounts" value={autoForm.discounts} onChange={(value) => setAutoForm((prev) => ({ ...prev, discounts: value }))} />
                  <Input label="Renewal Date" value={autoForm.renewalDate} onChange={(value) => setAutoForm((prev) => ({ ...prev, renewalDate: value }))} />
                  <Input label="Monthly Premium" value={autoForm.monthlyPremium} onChange={(value) => setAutoForm((prev) => ({ ...prev, monthlyPremium: value }))} />
                  <Textarea label="Vehicles" value={autoForm.vehicles} onChange={(value) => setAutoForm((prev) => ({ ...prev, vehicles: value }))} />
                </div>
                <CardActions>
                  <button className="btn-secondary" onClick={() => setEditingAuto(false)}>
                    Cancel
                  </button>
                  <button className="btn-primary" onClick={saveAuto} disabled={saving === "auto"}>
                    {saving === "auto" ? "Saving..." : "Save Auto Policy"}
                  </button>
                </CardActions>
              </>
            ) : (
              <div className="card-body">
                <Details
                  rows={[
                    ["Policy #", auto.policyNumber || "Policy number not set"],
                    ["Status", auto.status || "-"],
                    ["Coverage", auto.coverage || "-"],
                    ["Vehicles", autoVehicleLines.length ? autoVehicleLines.join("\n") : "-"],
                    ["Deductibles", auto.deductibles || "-"],
                    ["Discounts", auto.discounts || "-"],
                    ["Renewal Date", auto.renewalDate || "-"],
                    ["Monthly Premium", formatCurrency(auto.monthlyPremium)],
                  ]}
                />
              </div>
            )}
          </section>

          <section className="card">
            <div className="card-header card-header-with-actions">
              <div>
                <h2>Build Coverage</h2>
                <p className="subtitle">Modified vehicle protection details and review notes.</p>
              </div>
              {primaryBuild && (
                <button className="btn-secondary" onClick={() => openBuildEditor(primaryBuild)}>
                  Edit Build Coverage
                </button>
              )}
            </div>
            {!primaryBuild ? (
              <div className="card-body empty-state">
                No build coverage record is attached to this customer.
              </div>
            ) : editingBuildId === primaryBuild.id ? (
              <>
                <div className="card-body form-grid">
                  <Select label="Status" value={buildForm.status} options={BUILD_STATUSES} onChange={(value) => setBuildForm((prev) => ({ ...prev, status: value }))} />
                  <Input label="Year" value={buildForm.year} onChange={(value) => setBuildForm((prev) => ({ ...prev, year: value }))} />
                  <Input label="Make" value={buildForm.make} onChange={(value) => setBuildForm((prev) => ({ ...prev, make: value }))} />
                  <Input label="Model" value={buildForm.model} onChange={(value) => setBuildForm((prev) => ({ ...prev, model: value }))} />
                  <Input label="VIN" value={buildForm.vin} onChange={(value) => setBuildForm((prev) => ({ ...prev, vin: value }))} />
                  <Input label="Current Mileage" value={buildForm.mileage} onChange={(value) => setBuildForm((prev) => ({ ...prev, mileage: value }))} />
                  <Input label="Annual Mileage" value={buildForm.annualMileage} onChange={(value) => setBuildForm((prev) => ({ ...prev, annualMileage: value }))} />
                  <Input label="Title Status" value={buildForm.titleStatus} onChange={(value) => setBuildForm((prev) => ({ ...prev, titleStatus: value }))} />
                  <Input label="Vehicle Use" value={buildForm.vehicleUse} onChange={(value) => setBuildForm((prev) => ({ ...prev, vehicleUse: value }))} />
                  <Input label="Parts Value" value={buildForm.partsValue} onChange={(value) => setBuildForm((prev) => ({ ...prev, partsValue: value }))} />
                  <Input label="Install Status" value={buildForm.professionalInstallStatus} onChange={(value) => setBuildForm((prev) => ({ ...prev, professionalInstallStatus: value }))} />
                  <Input label="Documentation" value={buildForm.documentation} onChange={(value) => setBuildForm((prev) => ({ ...prev, documentation: value }))} />
                  <Input label="Tier Interest" value={buildForm.tierInterest} onChange={(value) => setBuildForm((prev) => ({ ...prev, tierInterest: value }))} />
                  <Input label="Deductible" value={buildForm.deductible} onChange={(value) => setBuildForm((prev) => ({ ...prev, deductible: value }))} />
                  <Input label="Driving History" value={buildForm.drivingHistory} onChange={(value) => setBuildForm((prev) => ({ ...prev, drivingHistory: value }))} />
                  <Input label="Claim History" value={buildForm.claimHistory} onChange={(value) => setBuildForm((prev) => ({ ...prev, claimHistory: value }))} />
                  <Input label="Auto Review Requested" value={buildForm.autoInsuranceReview} onChange={(value) => setBuildForm((prev) => ({ ...prev, autoInsuranceReview: value }))} />
                  <Textarea label="Parts List" value={buildForm.partsList} onChange={(value) => setBuildForm((prev) => ({ ...prev, partsList: value }))} />
                  <Textarea label="Installer Info" value={buildForm.installerInfo} onChange={(value) => setBuildForm((prev) => ({ ...prev, installerInfo: value }))} />
                  <Textarea label="Discount Notes" value={buildForm.discountNotes} onChange={(value) => setBuildForm((prev) => ({ ...prev, discountNotes: value }))} />
                </div>
                <CardActions>
                  <button className="btn-secondary" onClick={() => setEditingBuildId(null)}>
                    Cancel
                  </button>
                  <button className="btn-primary" onClick={saveBuild} disabled={saving === `build-${primaryBuild.id}`}>
                    {saving === `build-${primaryBuild.id}` ? "Saving..." : "Save Build Coverage"}
                  </button>
                </CardActions>
              </>
            ) : (
              <div className="card-body">
                <Details
                  rows={[
                    ["Status", primaryBuild.status || "-"],
                    ["Vehicle", vehicleLabel(primaryBuild) || "-"],
                    ["VIN", primaryBuild.vin || "-"],
                    ["Mileage", primaryBuild.mileage || "-"],
                    ["Annual Mileage", primaryBuild.annualMileage || "-"],
                    ["Title Status", primaryBuild.titleStatus || "-"],
                    ["Vehicle Use", primaryBuild.vehicleUse || "-"],
                    ["Parts Value", primaryBuild.partsValue || "-"],
                    ["Install Status", primaryBuild.professionalInstallStatus || "-"],
                    ["Documentation", primaryBuild.documentation || "-"],
                    ["Tier Interest", primaryBuild.tierInterest || "-"],
                    ["Deductible", primaryBuild.deductible || "-"],
                    ["Driving History", primaryBuild.drivingHistory || "-"],
                    ["Claim History", primaryBuild.claimHistory || "-"],
                    ["Auto Review Requested", primaryBuild.autoInsuranceReview || "-"],
                    ["Parts List", primaryBuild.partsList || "-"],
                    ["Installer Info", primaryBuild.installerInfo || "-"],
                    ["Discount Notes", primaryBuild.discountNotes || "-"],
                  ]}
                />
              </div>
            )}
          </section>

          <section className="card">
            <div className="card-header card-header-with-actions">
              <div>
                <h2>Billing & Payments</h2>
                <p className="subtitle">Stripe billing belongs to the auto policy record.</p>
              </div>
              {auto && (
                <div className="card-actions">
                  <button className="btn-primary" onClick={collectFirstPayment} disabled={billingActionLoading}>
                    {billingActionLoading ? "Working..." : "Collect First Payment"}
                  </button>
                  <button className="btn-outline" onClick={startMonthlyBilling} disabled={billingActionLoading}>
                    Start Monthly Billing
                  </button>
                  <button className="btn-outline" onClick={chargeCustomerNow} disabled={billingActionLoading}>
                    Charge Customer Now
                  </button>
                  <button className="btn-outline" onClick={cancelSubscription} disabled={billingActionLoading}>
                    Cancel Subscription
                  </button>
                </div>
              )}
            </div>
            {!auto ? (
              <div className="card-body empty-state">
                Add auto coverage before using billing tools.
              </div>
            ) : (
              <>
                <div className="card-body billing-layout">
                  <Details
                    rows={[
                      ["Billing Status", billingMeta.label],
                      ["Monthly Premium", formatCurrency(auto.monthlyPremium)],
                      ["Stripe Mode", auto.stripeMode || "-"],
                      ["Last Invoice Status", auto.lastInvoiceStatus || "-"],
                      ["Last Payment Date", formatDateTime(auto.lastPaymentDate)],
                    ]}
                  />
                  <div className="payment-method">
                    <h3>Stripe Record</h3>
                    <p className="mono-text">Customer: {auto.stripeCustomerId || "-"}</p>
                    <p className="mono-text">Subscription: {auto.stripeSubscriptionId || "-"}</p>
                    <button className="link-button" onClick={updateCard} disabled={billingActionLoading}>
                      Update card on file
                    </button>
                  </div>
                </div>
                <PaymentHistory rows={paymentHistoryRows} onViewReceipt={viewReceipt} />
              </>
            )}
          </section>

          <section className="card">
            <div className="card-header card-header-with-actions">
              <h2>Activity Log</h2>
              <button className="btn-secondary" onClick={addNote} disabled={saving === "note"}>
                Add Note
              </button>
            </div>
            <div className="card-body activity-log activity-log-scroll">
              {activityItems.length === 0 ? (
                <p className="meta-text">No activity has been recorded yet.</p>
              ) : (
                activityItems.map((item) => (
                  <article key={item.key} className="activity-item">
                    <div className="activity-meta">
                      <span>{item.createdAt}</span>
                      <span>{item.source}</span>
                    </div>
                    <p>{item.text}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        </main>
      </div>

      <style>{`
        :root {
          --bg-page: #f3f4f6;
          --bg-card: #ffffff;
          --border-subtle: #e5e7eb;
          --text-main: #111827;
          --text-muted: #6b7280;
          --primary: #dc2626;
          --accent: #2563eb;
          --radius-lg: 0.75rem;
          --shadow-soft: 0 10px 25px rgba(15, 23, 42, 0.06);
        }

        body {
          margin: 0;
          background: var(--bg-page);
          color: var(--text-main);
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
        }

        .crm-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1.5rem;
        }

        .crm-header,
        .crm-header-left,
        .crm-header-right,
        .card-header-with-actions,
        .card-actions,
        .badge-row {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .crm-header {
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .crm-header h1 {
          margin: 0;
          font-size: 1.5rem;
        }

        .crm-main {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-soft);
          overflow: hidden;
        }

        .card-summary {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.25rem;
        }

        .summary-right {
          text-align: right;
        }

        .card-header {
          padding: 0.9rem 1.25rem;
          border-bottom: 1px solid var(--border-subtle);
          justify-content: space-between;
        }

        .card-header h2,
        .card-header h3,
        .card-summary h2 {
          margin: 0;
        }

        .card-header h2 {
          font-size: 1rem;
        }

        .card-body {
          padding: 1rem 1.25rem;
        }

        .card-footer {
          padding: 0.75rem 1.25rem;
          border-top: 1px solid var(--border-subtle);
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        }

        .grid-two {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 0.75rem;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.85rem;
        }

        .field label,
        .meta-text,
        .subtitle {
          color: var(--text-muted);
          font-size: 0.8rem;
        }

        .field input,
        .field select,
        .field textarea {
          border: 1px solid var(--border-subtle);
          border-radius: 0.5rem;
          padding: 0.45rem 0.55rem;
          font: inherit;
        }

        .field textarea {
          min-height: 5rem;
          resize: vertical;
        }

        .details-list {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 0.55rem;
          margin: 0;
        }

        .details-list div {
          display: grid;
          grid-template-columns: 150px minmax(0, 1fr);
          gap: 0.75rem;
        }

        .details-list dt {
          color: var(--text-muted);
          font-weight: 600;
        }

        .details-list dd {
          margin: 0;
          white-space: pre-wrap;
        }

        .billing-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 1rem;
        }

        .payment-history-scroll,
        .activity-log-scroll {
          max-height: 360px;
          overflow: auto;
        }

        .crm-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .crm-table th,
        .crm-table td {
          border-bottom: 1px solid var(--border-subtle);
          padding: 0.55rem;
          text-align: left;
          white-space: nowrap;
        }

        .activity-item {
          border-bottom: 1px dashed var(--border-subtle);
          padding: 0.6rem 0;
        }

        .activity-meta {
          display: flex;
          gap: 0.5rem;
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .action-stack {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .empty-state {
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .mono-text {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
          font-size: 0.8rem;
          word-break: break-all;
        }

        .btn-primary,
        .btn-secondary,
        .btn-outline,
        .link-button {
          border-radius: 999px;
          cursor: pointer;
          font: inherit;
          font-size: 0.85rem;
          padding: 0.45rem 0.9rem;
        }

        .btn-primary:disabled,
        .btn-secondary:disabled,
        .btn-outline:disabled,
        .link-button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .btn-primary {
          background: var(--primary);
          border: 1px solid var(--primary);
          color: #fff;
        }

        .btn-secondary,
        .btn-outline {
          background: #fff;
          border: 1px solid var(--border-subtle);
          color: var(--text-main);
        }

        .link-button {
          background: transparent;
          border: 0;
          color: var(--accent);
          padding: 0;
        }

        .status-pill,
        .coverage-pill {
          border-radius: 999px;
          display: inline-flex;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.18rem 0.6rem;
        }

        .coverage-active,
        .status-active {
          background: #dcfce7;
          color: #166534;
        }

        .coverage-inactive,
        .status-neutral {
          background: #e5e7eb;
          color: #374151;
        }

        .status-warning {
          background: #fef9c3;
          color: #854d0e;
        }

        .status-error,
        .notice-error {
          background: #fee2e2;
          color: #991b1b;
        }

        .notice-success,
        .notice-warning,
        .notice-error {
          border-radius: 0.65rem;
          padding: 0.85rem 1rem;
        }

        .notice-success {
          background: #ecfdf5;
          color: #065f46;
        }

        .notice-warning {
          background: #fffbeb;
          color: #92400e;
        }

        @media (max-width: 900px) {
          .card-summary,
          .crm-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .summary-right {
            text-align: left;
          }

          .grid-two,
          .billing-layout {
            grid-template-columns: minmax(0, 1fr);
          }

          .details-list div {
            grid-template-columns: minmax(0, 1fr);
            gap: 0.1rem;
          }
        }
      `}</style>
    </>
  );
}

function ShellMessage({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 text-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-10 text-sm text-gray-600">
        {children}
      </div>
    </main>
  );
}

function CoverageBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={`coverage-pill ${active ? "coverage-active" : "coverage-inactive"}`}>
      {label}: {active ? "Active" : "Not Active"}
    </span>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value || ""} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value || ""} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea value={value || ""} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Details({ rows }: { rows: Array<[string, string | undefined]> }) {
  return (
    <dl className="details-list">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value && String(value).trim() ? value : "-"}</dd>
        </div>
      ))}
    </dl>
  );
}

function CardActions({ children }: { children: React.ReactNode }) {
  return <div className="card-footer">{children}</div>;
}

function PaymentHistory({
  rows,
  onViewReceipt,
}: {
  rows: UiPaymentRow[];
  onViewReceipt: (url?: string) => void;
}) {
  return (
    <div className="card-body payment-history-scroll">
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
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5}>No Stripe payment history has been synced yet.</td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={`${row.date}-${row.eventType}-${index}`}>
                <td>{row.date}</td>
                <td>{row.amount}</td>
                <td>{row.method}</td>
                <td>
                  <span className={row.statusClass}>{row.status}</span>
                </td>
                <td>
                  <button
                    className="link-button"
                    onClick={() => onViewReceipt(row.receiptUrl)}
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
  );
}

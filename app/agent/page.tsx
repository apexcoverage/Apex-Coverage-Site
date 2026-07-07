"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

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

type WorksheetState = {
  coveragePackage: string;
  liability: string;
  compDed: string;
  collDed: string;
  discounts: string[];
  notes: string;
};

type WorksheetLoadApiResponse = {
  ok: boolean;
  worksheet?: Partial<WorksheetState> | null;
  error?: string;
};

type ProductFilter = "all" | "build-review" | "auto-quote";

type DashboardItem =
  | {
      key: string;
      kind: "build-review";
      id: number;
      when: string;
      name: string;
      email: string;
      phone: string;
      zip: string;
      vehicle: string;
      status: string;
      agent: string;
      searchText: string;
      hasAutoCustomer: boolean;
      hasBuildCustomer: boolean;
      relatedAutoLead?: AutoLead;
      buildReview: BuildReview;
    }
  | {
      key: string;
      kind: "auto-quote";
      id: number;
      when: string;
      name: string;
      email: string;
      phone: string;
      zip: string;
      vehicle: string;
      status: string;
      agent: string;
      searchText: string;
      hasAutoCustomer: boolean;
      hasBuildCustomer: boolean;
      relatedBuildReview?: BuildReview;
      autoLead: AutoLead;
    };

const AGENTS = ["", "Lewis", "Brandon", "Kelly"];

const AUTO_STATUS_OPTIONS = [
  "",
  "New",
  "Attempted Contact",
  "In Progress",
  "Quoted",
  "Won",
  "Lost",
  "Do Not Contact",
];

const BUILD_STATUS_OPTIONS = [
  "",
  "New Build Review",
  "Docs Needed",
  "Under Review",
  "Approved",
  "Quoted",
  "Active",
  "Rejected",
  "Lost",
  "Do Not Contact",
];

const COVERAGE_PACKAGES = [
  "",
  "Basic Liability",
  "Standard Full Coverage",
  "Premium Full Coverage",
];

const LIABILITY_LIMITS = [
  "",
  "25/50/25",
  "50/100/50",
  "100/300/100",
  "250/500/250",
];

const DEDUCTIBLE_OPTIONS = ["", "0", "250", "500", "1000"];

const DISCOUNT_OPTIONS = [
  "Multi-car",
  "Home/Auto",
  "Safe Driver",
  "Paid in Full",
  "Low Mileage",
  "Claims Free",
  "Good Student",
  "Anti-Theft",
  "Safety Equipment",
  "New Vehicle",
  "Garaged",
  "Military",
];

const EMPTY_WORKSHEET: WorksheetState = {
  coveragePackage: "",
  liability: "",
  compDed: "",
  collDed: "",
  discounts: [],
  notes: "",
};

function vehicleLabel(item: {
  year?: string;
  make?: string;
  model?: string;
}) {
  return [item.year, item.make, item.model].filter(Boolean).join(" ");
}

function isAutoCustomer(lead: AutoLead) {
  return (lead.status || "") === "Won";
}

function isBuildCustomer(review: BuildReview) {
  return (review.status || "") === "Active";
}

function normalizeAutoInterest(value?: string) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "yes" || normalized === "true" ? "Yes" : "No";
}

function contactKey(item: { email?: string; phone?: string; name?: string }) {
  const email = String(item.email || "").trim().toLowerCase();
  const phone = String(item.phone || "").replace(/\D/g, "");
  const name = String(item.name || "").trim().toLowerCase();
  return email || phone || name;
}

export default function AgentDashboardPage() {
  const [autoLeads, setAutoLeads] = useState<AutoLead[]>([]);
  const [buildReviews, setBuildReviews] = useState<BuildReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState<ProductFilter>("all");
  const [statusFilter, setStatusFilter] = useState("");
  const [agentFilter, setAgentFilter] = useState("");

  const [activeWorksheetLead, setActiveWorksheetLead] =
    useState<AutoLead | null>(null);
  const [worksheet, setWorksheet] = useState<WorksheetState>(EMPTY_WORKSHEET);
  const [worksheetCache, setWorksheetCache] = useState<
    Record<number, WorksheetState>
  >({});
  const [worksheetLoading, setWorksheetLoading] = useState(false);
  const [savingWorksheet, setSavingWorksheet] = useState(false);

  const [activeBuildReview, setActiveBuildReview] =
    useState<BuildReview | null>(null);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(null);

      const [leadsRes, buildRes] = await Promise.all([
        fetch("/api/agent/leads", { cache: "no-store" }),
        fetch("/api/agent/build-reviews", { cache: "no-store" }),
      ]);

      const leadsData: ApiListResponse<AutoLead> = await leadsRes.json();
      const buildData: ApiListResponse<BuildReview> = await buildRes.json();

      if (!leadsData.ok || !leadsData.rows) {
        throw new Error(leadsData.error || "Failed to load auto quote leads");
      }

      if (!buildData.ok || !buildData.rows) {
        throw new Error(buildData.error || "Failed to load build reviews");
      }

      setAutoLeads(leadsData.rows);
      setBuildReviews(buildData.rows);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error loading dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const dashboardItems = useMemo<DashboardItem[]>(() => {
    const autoByContact = new Map<string, AutoLead[]>();
    const buildByContact = new Map<string, BuildReview[]>();

    autoLeads.forEach((lead) => {
      const key = contactKey(lead);
      if (!key) return;
      autoByContact.set(key, [...(autoByContact.get(key) || []), lead]);
    });

    buildReviews.forEach((review) => {
      const key = contactKey(review);
      if (!key) return;
      buildByContact.set(key, [...(buildByContact.get(key) || []), review]);
    });

    const buildItems: DashboardItem[] = buildReviews
      .filter((review) => !isBuildCustomer(review))
      .map((review) => {
        const vehicle = vehicleLabel(review);
        const relatedAutoLeads = autoByContact.get(contactKey(review)) || [];
        const relatedAutoLead =
          relatedAutoLeads.find(isAutoCustomer) || relatedAutoLeads[0];
        const searchText = [
          review.name,
          review.email,
          review.phone,
          review.zip,
          vehicle,
          review.vin,
          review.partsList,
          review.tierInterest,
        ]
          .join(" ")
          .toLowerCase();

        return {
          key: `build-review-${review.id}`,
          kind: "build-review",
          id: review.id,
          when: review.when,
          name: review.name,
          email: review.email,
          phone: review.phone,
          zip: review.zip,
          vehicle,
          status: review.status || "New Build Review",
          agent: review.agent || "",
          searchText,
          hasAutoCustomer: relatedAutoLeads.some(isAutoCustomer),
          hasBuildCustomer: isBuildCustomer(review),
          relatedAutoLead,
          buildReview: review,
        };
      });

    const autoItems: DashboardItem[] = autoLeads
      .filter((lead) => !isAutoCustomer(lead))
      .map((lead) => {
        const vehicle = vehicleLabel(lead);
        const relatedBuildReviews = buildByContact.get(contactKey(lead)) || [];
        const relatedBuildReview =
          relatedBuildReviews.find(isBuildCustomer) || relatedBuildReviews[0];
        const searchText = [
          lead.name,
          lead.email,
          lead.phone,
          lead.zip,
          vehicle,
        ]
          .join(" ")
          .toLowerCase();

        return {
          key: `auto-quote-${lead.id}`,
          kind: "auto-quote",
          id: lead.id,
          when: lead.when,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          zip: lead.zip,
          vehicle,
          status: lead.status || "New",
          agent: lead.agent || "",
          searchText,
          hasAutoCustomer: isAutoCustomer(lead),
          hasBuildCustomer: relatedBuildReviews.some(isBuildCustomer),
          relatedBuildReview,
          autoLead: lead,
        };
      });

    return [...buildItems, ...autoItems].sort((a, b) =>
      String(b.when || "").localeCompare(String(a.when || ""))
    );
  }, [autoLeads, buildReviews]);

  const statusOptions = useMemo(() => {
    const options =
      productFilter === "build-review"
        ? BUILD_STATUS_OPTIONS
        : productFilter === "auto-quote"
          ? AUTO_STATUS_OPTIONS
          : Array.from(new Set([...BUILD_STATUS_OPTIONS, ...AUTO_STATUS_OPTIONS]));

    return options.filter(Boolean);
  }, [productFilter]);

  const visibleItems = useMemo(() => {
    const s = search.trim().toLowerCase();

    return dashboardItems.filter((item) => {
      if (productFilter !== "all" && item.kind !== productFilter) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      if (agentFilter && item.agent !== agentFilter) return false;
      if (s && !item.searchText.includes(s)) return false;
      return true;
    });
  }, [dashboardItems, productFilter, statusFilter, agentFilter, search]);

  const stats = useMemo(() => {
    const buildOpen = buildReviews.filter((review) => !isBuildCustomer(review))
      .length;
    const autoOpen = autoLeads.filter((lead) => !isAutoCustomer(lead)).length;
    const customersWithAuto = autoLeads.filter(isAutoCustomer).length;
    const customersWithBuild = buildReviews.filter(isBuildCustomer).length;
    const bothInterested = buildReviews.filter(
      (review) => normalizeAutoInterest(review.autoInsuranceReview) === "Yes"
    ).length;

    return {
      buildOpen,
      autoOpen,
      customersWithAuto,
      customersWithBuild,
      bothInterested,
      unassigned: dashboardItems.filter((item) => !item.agent).length,
    };
  }, [autoLeads, buildReviews, dashboardItems]);

  async function updateAutoLead(id: number, patch: Partial<AutoLead>) {
    setSavingKey(`auto-quote-${id}`);
    try {
      const current = autoLeads.find((lead) => lead.id === id);
      let finalPatch: Partial<AutoLead> = { ...patch };

      if (patch.status === "Won" && current && !current.policyNumber) {
        const now = new Date();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const yy = String(now.getFullYear()).slice(-2);
        const formattedId = String(id).padStart(2, "0");
        finalPatch.policyNumber = `APX-321326${mm}${yy}-${formattedId}`;
      }

      const res = await fetch("/api/agent/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, patch: finalPatch }),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Update failed");

      setAutoLeads((prev) =>
        prev.map((lead) =>
          lead.id === id ? { ...lead, ...finalPatch } : lead
        )
      );
    } catch (err: any) {
      console.error(err);
      alert(`Could not save auto quote changes: ${err.message || err}`);
    } finally {
      setSavingKey(null);
    }
  }

  async function updateBuildReview(id: number, patch: Partial<BuildReview>) {
    setSavingKey(`build-review-${id}`);
    try {
      const res = await fetch("/api/agent/build-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, patch }),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Update failed");

      setBuildReviews((prev) =>
        prev.map((review) =>
          review.id === id ? { ...review, ...patch } : review
        )
      );
    } catch (err: any) {
      console.error(err);
      alert(`Could not save build review changes: ${err.message || err}`);
    } finally {
      setSavingKey(null);
    }
  }

  async function createBuildCustomerFromAuto(lead: AutoLead) {
    const key = `auto-quote-${lead.id}`;
    setSavingKey(key);

    try {
      const res = await fetch("/api/agent/cross-coverage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction: "build-from-auto",
          autoLeadId: lead.id,
        }),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Could not add build coverage");

      await loadDashboard();
    } catch (err: any) {
      console.error(err);
      alert(`Could not add build coverage: ${err.message || err}`);
    } finally {
      setSavingKey(null);
    }
  }

  async function createAutoCustomerFromBuild(review: BuildReview) {
    const key = `build-review-${review.id}`;
    setSavingKey(key);

    try {
      const res = await fetch("/api/agent/cross-coverage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction: "auto-from-build",
          buildReviewId: review.id,
        }),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Could not add auto customer");

      await loadDashboard();
    } catch (err: any) {
      console.error(err);
      alert(`Could not add auto customer: ${err.message || err}`);
    } finally {
      setSavingKey(null);
    }
  }

  async function addBuildCoverage(item: Extract<DashboardItem, { kind: "auto-quote" }>) {
    if (item.relatedBuildReview) {
      await updateBuildReview(item.relatedBuildReview.id, {
        status: "Active",
        agent: item.agent,
        activityNote: "Build coverage marked active from auto quote pipeline",
      } as Partial<BuildReview>);
      await loadDashboard();
      return;
    }

    await createBuildCustomerFromAuto(item.autoLead);
  }

  async function addAutoCoverage(item: Extract<DashboardItem, { kind: "build-review" }>) {
    if (item.relatedAutoLead) {
      await updateAutoLead(item.relatedAutoLead.id, {
        status: "Won",
        agent: item.agent,
        activityNote: "Auto insurance marked won from build review pipeline",
      } as Partial<AutoLead>);
      await loadDashboard();
      return;
    }

    await createAutoCustomerFromBuild(item.buildReview);
  }

  async function deletePipelineItem(item: DashboardItem) {
    const label = item.kind === "build-review" ? "build review" : "auto quote";
    const confirmed = window.confirm(
      `Remove this ${label} from the pipeline? This will delete the row from Google Sheets.`
    );

    if (!confirmed) return;

    setSavingKey(item.key);

    try {
      const res = await fetch(
        item.kind === "build-review"
          ? "/api/agent/build-reviews"
          : "/api/agent/leads",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id }),
        }
      );

      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Delete failed");

      await loadDashboard();
    } catch (err: any) {
      console.error(err);
      alert(`Could not remove from pipeline: ${err.message || err}`);
    } finally {
      setSavingKey(null);
    }
  }

  async function openWorksheet(lead: AutoLead) {
    setActiveWorksheetLead(lead);

    const cached = worksheetCache[lead.id];
    if (cached) {
      setWorksheet(cached);
      return;
    }

    setWorksheet(EMPTY_WORKSHEET);
    setWorksheetLoading(true);

    try {
      const res = await fetch("/api/agent/worksheet/load", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });

      const data: WorksheetLoadApiResponse = await res.json();

      if (data.ok && data.worksheet) {
        const loaded: WorksheetState = {
          coveragePackage: data.worksheet.coveragePackage || "",
          liability: data.worksheet.liability || "",
          compDed: data.worksheet.compDed || "",
          collDed: data.worksheet.collDed || "",
          discounts: Array.isArray(data.worksheet.discounts)
            ? data.worksheet.discounts
            : [],
          notes: data.worksheet.notes || "",
        };

        setWorksheet(loaded);
        setWorksheetCache((prev) => ({ ...prev, [lead.id]: loaded }));
      }
    } catch (err) {
      console.error("Failed to load worksheet", err);
    } finally {
      setWorksheetLoading(false);
    }
  }

  function closeWorksheet() {
    setActiveWorksheetLead(null);
  }

  function toggleDiscount(discount: string) {
    setWorksheet((prev) => {
      const exists = prev.discounts.includes(discount);
      return {
        ...prev,
        discounts: exists
          ? prev.discounts.filter((item) => item !== discount)
          : [...prev.discounts, discount],
      };
    });
  }

  async function saveWorksheet() {
    if (!activeWorksheetLead) return;

    try {
      setSavingWorksheet(true);

      const vehicle = vehicleLabel(activeWorksheetLead);
      const payload = {
        leadId: activeWorksheetLead.id,
        leadSheetRow: activeWorksheetLead.id,
        name: activeWorksheetLead.name,
        email: activeWorksheetLead.email,
        phone: activeWorksheetLead.phone,
        zip: activeWorksheetLead.zip,
        dob: activeWorksheetLead.dob,
        year: activeWorksheetLead.year,
        make: activeWorksheetLead.make,
        model: activeWorksheetLead.model,
        vehicle,
        status: activeWorksheetLead.status || "",
        agent: activeWorksheetLead.agent || "",
        coveragePackage: worksheet.coveragePackage,
        liability: worksheet.liability,
        compDed: worksheet.compDed,
        collDed: worksheet.collDed,
        discounts: worksheet.discounts,
        notes: worksheet.notes,
      };

      const res = await fetch("/api/agent/worksheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to save worksheet");

      setWorksheetCache((prev) => ({
        ...prev,
        [activeWorksheetLead.id]: { ...worksheet },
      }));

      alert("Worksheet saved to Google Sheets.");
      closeWorksheet();
    } catch (err: any) {
      console.error(err);
      alert(`Could not save worksheet: ${err.message || err}`);
    } finally {
      setSavingWorksheet(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#cc0000]">
              Apex Coverage Agent Workspace
            </p>
            <h1 className="mt-1 text-3xl font-bold">Coverage Pipeline</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage build reviews, auto quote requests, assignments, and next
              steps from one queue.
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <div className="inline-flex items-center rounded-full border border-gray-200 bg-white p-1 text-xs font-medium shadow-sm">
              <Link
                href="/agent"
                className="px-3 py-1.5 rounded-full bg-slate-900 text-white shadow-sm"
              >
                Pipeline
              </Link>
              <Link
                href="/agent/customers"
                className="px-3 py-1.5 rounded-full text-slate-700 hover:bg-slate-100"
              >
                Customers
              </Link>
            </div>

            <button
              onClick={loadDashboard}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>
        </header>

        <section className="mb-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Open Build Reviews" value={stats.buildOpen} />
          <StatCard label="Open Auto Quotes" value={stats.autoOpen} />
          <StatCard label="Build Customers" value={stats.customersWithBuild} />
          <StatCard label="Auto Customers" value={stats.customersWithAuto} />
          <StatCard label="Both Requested" value={stats.bothInterested} />
          <StatCard label="Unassigned" value={stats.unassigned} />
        </section>

        <section className="mb-6 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto] lg:items-end">
          <div className="flex flex-col text-xs text-gray-600">
            <span className="mb-1">Search</span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, phone, ZIP, vehicle, VIN, parts..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>

          <FilterSelect
            label="Product"
            value={productFilter}
            onChange={(value) => setProductFilter(value as ProductFilter)}
            options={[
              { label: "All coverage", value: "all" },
              { label: "Build Reviews", value: "build-review" },
              { label: "Auto Quotes", value: "auto-quote" },
            ]}
          />

          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: "All statuses", value: "" },
              ...statusOptions.map((status) => ({ label: status, value: status })),
            ]}
          />

          <FilterSelect
            label="Agent"
            value={agentFilter}
            onChange={setAgentFilter}
            options={[
              { label: "All agents", value: "" },
              ...AGENTS.filter(Boolean).map((agent) => ({
                label: agent,
                value: agent,
              })),
            ]}
          />
        </section>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-gray-600">Loading pipeline...</div>
        ) : visibleItems.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
            No records match your current filters.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-3 py-2 font-semibold">Coverage</th>
                  <th className="px-3 py-2 font-semibold">Received</th>
                  <th className="px-3 py-2 font-semibold">Customer</th>
                  <th className="px-3 py-2 font-semibold">Vehicle</th>
                  <th className="px-3 py-2 font-semibold">Intake</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Agent</th>
                  <th className="px-3 py-2 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item) => {
                  const disabled = savingKey === item.key;
                  return (
                    <tr
                      key={item.key}
                      className="border-t border-gray-100 align-top hover:bg-gray-50"
                    >
                      <td className="px-3 py-3">
                        <ProductBadge kind={item.kind} />
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.hasBuildCustomer && (
                            <MiniBadge label="Build customer" tone="build" />
                          )}
                          {item.hasAutoCustomer && (
                            <MiniBadge label="Auto customer" tone="auto" />
                          )}
                        </div>
                        {item.kind === "build-review" &&
                          normalizeAutoInterest(
                            item.buildReview.autoInsuranceReview
                          ) === "Yes" && (
                            <div className="mt-1 text-[11px] font-medium text-slate-500">
                              Also wants auto
                            </div>
                          )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-500">
                        {item.when || "-"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-medium">{item.name || "-"}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          {item.phone || "-"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.email || ""}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div>{item.vehicle || "-"}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          ZIP {item.zip || "-"}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {item.kind === "build-review" ? (
                          <BuildReviewSummary review={item.buildReview} />
                        ) : (
                          <AutoQuoteSummary lead={item.autoLead} />
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <select
                          className="w-full min-w-[150px] rounded-md border border-gray-300 bg-white px-2 py-1 text-xs"
                          value={item.status || ""}
                          disabled={disabled}
                          onChange={(event) =>
                            item.kind === "build-review"
                              ? updateBuildReview(item.id, {
                                  status: event.target.value,
                                })
                              : updateAutoLead(item.id, {
                                  status: event.target.value,
                                })
                          }
                        >
                          {(item.kind === "build-review"
                            ? BUILD_STATUS_OPTIONS
                            : AUTO_STATUS_OPTIONS
                          ).map((option) => (
                            <option key={option} value={option}>
                              {option || "-"}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <select
                          className="w-full min-w-[130px] rounded-md border border-gray-300 bg-white px-2 py-1 text-xs"
                          value={item.agent || ""}
                          disabled={disabled}
                          onChange={(event) =>
                            item.kind === "build-review"
                              ? updateBuildReview(item.id, {
                                  agent: event.target.value,
                                })
                              : updateAutoLead(item.id, {
                                  agent: event.target.value,
                                })
                          }
                        >
                          {AGENTS.map((option) => (
                            <option key={option} value={option}>
                              {option || "Unassigned"}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex min-w-[170px] flex-wrap justify-end gap-1">
                          {item.kind === "build-review" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setActiveBuildReview(item.buildReview)}
                                className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                              >
                                Review/Edit
                              </button>
                              {!item.hasBuildCustomer && (
                                <button
                                  type="button"
                                  disabled={disabled}
                                  onClick={() =>
                                    updateBuildReview(item.id, {
                                      status: "Active",
                                      activityNote: "Build coverage marked active from pipeline",
                                    } as Partial<BuildReview>)
                                  }
                                  className="rounded-md bg-[#cc0000] px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                                >
                                  Mark Customer
                                </button>
                              )}
                              {!item.hasAutoCustomer && (
                                <button
                                  type="button"
                                  disabled={disabled}
                                  onClick={() => addAutoCoverage(item)}
                                  className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                >
                                  Add Auto
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={disabled}
                                onClick={() => deletePipelineItem(item)}
                                className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                              >
                                Remove
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => openWorksheet(item.autoLead)}
                                className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                              >
                                Worksheet
                              </button>
                              {!item.hasAutoCustomer && (
                                <button
                                  type="button"
                                  disabled={disabled}
                                  onClick={() =>
                                    updateAutoLead(item.id, {
                                      status: "Won",
                                      activityNote: "Auto insurance marked won from pipeline",
                                    } as Partial<AutoLead>)
                                  }
                                  className="rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                                >
                                  Mark Customer
                                </button>
                              )}
                              {!item.hasBuildCustomer && (
                                <button
                                  type="button"
                                  disabled={disabled}
                                  onClick={() => addBuildCoverage(item)}
                                  className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                >
                                  Add Build
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={disabled}
                                onClick={() => deletePipelineItem(item)}
                                className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                              >
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeWorksheetLead && (
        <AutoWorksheetPanel
          lead={activeWorksheetLead}
          worksheet={worksheet}
          worksheetLoading={worksheetLoading}
          savingWorksheet={savingWorksheet}
          setWorksheet={setWorksheet}
          toggleDiscount={toggleDiscount}
          onClose={closeWorksheet}
          onSave={saveWorksheet}
        />
      )}

      {activeBuildReview && (
        <BuildReviewPanel
          review={activeBuildReview}
          onClose={() => setActiveBuildReview(null)}
          onSave={async (id, patch) => {
            await updateBuildReview(id, patch);
            setActiveBuildReview((prev) =>
              prev && prev.id === id ? { ...prev, ...patch } : prev
            );
          }}
        />
      )}
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-2xl font-bold">{value}</div>
      <div className="mt-1 text-xs font-medium text-gray-500">{label}</div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div className="flex flex-col text-xs text-gray-600">
      <span className="mb-1">{label}</span>
      <select
        className="min-w-[150px] rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs shadow-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ProductBadge({ kind }: { kind: DashboardItem["kind"] }) {
  const isBuild = kind === "build-review";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
        isBuild
          ? "bg-red-50 text-[#cc0000] ring-1 ring-red-100"
          : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
      }`}
    >
      {isBuild ? "Build Coverage" : "Auto Quote"}
    </span>
  );
}

function MiniBadge({
  label,
  tone,
}: {
  label: string;
  tone: "build" | "auto";
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        tone === "build"
          ? "bg-red-50 text-[#cc0000] ring-1 ring-red-100"
          : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
      }`}
    >
      {label}
    </span>
  );
}

function BuildReviewSummary({ review }: { review: BuildReview }) {
  return (
    <div className="max-w-xs space-y-1 text-xs text-gray-600">
      <div>
        <span className="font-semibold text-gray-800">Tier:</span>{" "}
        {review.tierInterest || "-"} / {review.deductible || "No deductible"}
      </div>
      <div>
        <span className="font-semibold text-gray-800">Parts:</span>{" "}
        {review.partsValue || "-"}
      </div>
      <div>
        <span className="font-semibold text-gray-800">Install:</span>{" "}
        {review.professionalInstallStatus || "-"}
      </div>
      <div>
        <span className="font-semibold text-gray-800">Docs:</span>{" "}
        {review.documentation || "-"}
      </div>
    </div>
  );
}

function AutoQuoteSummary({ lead }: { lead: AutoLead }) {
  return (
    <div className="max-w-xs space-y-1 text-xs text-gray-600">
      <div>
        <span className="font-semibold text-gray-800">DOB:</span>{" "}
        {lead.dob || "-"}
      </div>
      <div>
        <span className="font-semibold text-gray-800">Consent:</span>{" "}
        {lead.consent || "-"}
      </div>
      <div>
        <span className="font-semibold text-gray-800">Policy:</span>{" "}
        {lead.policyNumber || "Not issued"}
      </div>
    </div>
  );
}

function AutoWorksheetPanel({
  lead,
  worksheet,
  worksheetLoading,
  savingWorksheet,
  setWorksheet,
  toggleDiscount,
  onClose,
  onSave,
}: {
  lead: AutoLead;
  worksheet: WorksheetState;
  worksheetLoading: boolean;
  savingWorksheet: boolean;
  setWorksheet: React.Dispatch<React.SetStateAction<WorksheetState>>;
  toggleDiscount: (discount: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">Auto Quote Worksheet</h2>
            <p className="text-xs text-slate-500">
              {lead.name} - {lead.zip} - {vehicleLabel(lead)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4 text-sm">
          {worksheetLoading && (
            <p className="text-xs text-slate-500">Loading saved worksheet...</p>
          )}

          <SelectField
            label="Coverage Package"
            value={worksheet.coveragePackage}
            options={COVERAGE_PACKAGES}
            emptyLabel="Select package"
            onChange={(value) =>
              setWorksheet((prev) => ({ ...prev, coveragePackage: value }))
            }
          />

          <SelectField
            label="Liability Limits"
            value={worksheet.liability}
            options={LIABILITY_LIMITS}
            emptyLabel="Select limits"
            onChange={(value) =>
              setWorksheet((prev) => ({ ...prev, liability: value }))
            }
          />

          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Comp Deductible"
              value={worksheet.compDed}
              options={DEDUCTIBLE_OPTIONS}
              emptyLabel="Select"
              onChange={(value) =>
                setWorksheet((prev) => ({ ...prev, compDed: value }))
              }
            />
            <SelectField
              label="Collision Deductible"
              value={worksheet.collDed}
              options={DEDUCTIBLE_OPTIONS}
              emptyLabel="Select"
              onChange={(value) =>
                setWorksheet((prev) => ({ ...prev, collDed: value }))
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-slate-600">
              Discounts Applied
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {DISCOUNT_OPTIONS.map((discount) => {
                const checked = worksheet.discounts.includes(discount);
                return (
                  <label
                    key={discount}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      className="h-3 w-3"
                      checked={checked}
                      onChange={() => toggleDiscount(discount)}
                    />
                    <span>{discount}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Underwriting / Quote Notes
            </label>
            <textarea
              rows={4}
              className="w-full resize-y rounded-md border border-slate-300 px-2 py-2 text-sm"
              value={worksheet.notes}
              onChange={(event) =>
                setWorksheet((prev) => ({ ...prev, notes: event.target.value }))
              }
              placeholder="Drivers, tickets, prior carrier, important underwriting details..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={savingWorksheet}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {savingWorksheet ? "Saving..." : "Save Worksheet"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  emptyLabel,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  emptyLabel: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">
        {label}
      </label>
      <select
        className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option || emptyLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

function BuildReviewPanel({
  review,
  onClose,
  onSave,
}: {
  review: BuildReview;
  onClose: () => void;
  onSave: (id: number, patch: Partial<BuildReview>) => Promise<void>;
}) {
  const [draft, setDraft] = useState<BuildReview>(review);
  const [saving, setSaving] = useState(false);

  function updateDraft(field: keyof BuildReview, value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  async function saveChanges() {
    setSaving(true);
    try {
      await onSave(review.id, {
        name: draft.name,
        email: draft.email,
        phone: draft.phone,
        zip: draft.zip,
        dob: draft.dob,
        year: draft.year,
        make: draft.make,
        model: draft.model,
        vin: draft.vin,
        mileage: draft.mileage,
        annualMileage: draft.annualMileage,
        titleStatus: draft.titleStatus,
        vehicleUse: draft.vehicleUse,
        partsList: draft.partsList,
        partsValue: draft.partsValue,
        professionalInstallStatus: draft.professionalInstallStatus,
        installerInfo: draft.installerInfo,
        documentation: draft.documentation,
        tierInterest: draft.tierInterest,
        deductible: draft.deductible,
        drivingHistory: draft.drivingHistory,
        claimHistory: draft.claimHistory,
        discountNotes: draft.discountNotes,
        autoInsuranceReview: draft.autoInsuranceReview,
        activityNote: "Build review intake updated",
      } as Partial<BuildReview>);
      alert("Build review saved.");
    } finally {
      setSaving(false);
    }
  }

  const details = [
    ["VIN", draft.vin],
    ["Current mileage", draft.mileage],
    ["Annual mileage", draft.annualMileage],
    ["Title status", draft.titleStatus],
    ["Vehicle use", draft.vehicleUse],
    ["Parts value", draft.partsValue],
    ["Install status", draft.professionalInstallStatus],
    ["Documentation", draft.documentation],
    ["Tier interest", draft.tierInterest],
    ["Deductible", draft.deductible],
    ["Driving history", draft.drivingHistory],
    ["Claim history", draft.claimHistory],
    ["Auto review requested", normalizeAutoInterest(draft.autoInsuranceReview)],
  ];

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="flex w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">Build Review Intake</h2>
            <p className="text-xs text-slate-500">
              {draft.name} - {vehicleLabel(draft)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4 text-sm">
          <section>
            <h3 className="font-semibold">Contact</h3>
            <div className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
              <BuildInput label="Name" value={draft.name} onChange={(value) => updateDraft("name", value)} />
              <BuildInput label="Email" value={draft.email} onChange={(value) => updateDraft("email", value)} />
              <BuildInput label="Phone" value={draft.phone} onChange={(value) => updateDraft("phone", value)} />
              <BuildInput label="ZIP" value={draft.zip} onChange={(value) => updateDraft("zip", value)} />
              <BuildInput label="DOB" value={draft.dob} onChange={(value) => updateDraft("dob", value)} />
            </div>
          </section>

          <section>
            <h3 className="font-semibold">Vehicle</h3>
            <div className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
              <BuildInput label="Year" value={draft.year} onChange={(value) => updateDraft("year", value)} />
              <BuildInput label="Make" value={draft.make} onChange={(value) => updateDraft("make", value)} />
              <BuildInput label="Model" value={draft.model} onChange={(value) => updateDraft("model", value)} />
            </div>
          </section>

          <section>
            <h3 className="font-semibold">Review Details</h3>
            <div className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
              {details.map(([label, value]) => (
                <BuildInput
                  key={label}
                  label={label}
                  value={value || ""}
                  onChange={(next) => {
                    const fieldByLabel: Record<string, keyof BuildReview> = {
                      VIN: "vin",
                      "Current mileage": "mileage",
                      "Annual mileage": "annualMileage",
                      "Title status": "titleStatus",
                      "Vehicle use": "vehicleUse",
                      "Parts value": "partsValue",
                      "Install status": "professionalInstallStatus",
                      Documentation: "documentation",
                      "Tier interest": "tierInterest",
                      Deductible: "deductible",
                      "Driving history": "drivingHistory",
                      "Claim history": "claimHistory",
                      "Auto review requested": "autoInsuranceReview",
                    };
                    const field = fieldByLabel[label];
                    if (field) updateDraft(field, next);
                  }}
                />
              ))}
            </div>
          </section>

          <section>
            <h3 className="font-semibold">Parts List</h3>
            <textarea
              rows={5}
              className="mt-2 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-xs"
              value={draft.partsList || ""}
              onChange={(event) => updateDraft("partsList", event.target.value)}
            />
          </section>

          <section>
            <h3 className="font-semibold">Installer / Notes</h3>
            <textarea
              rows={4}
              className="mt-2 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-xs"
              value={draft.installerInfo || ""}
              onChange={(event) => updateDraft("installerInfo", event.target.value)}
            />
            <textarea
              rows={3}
              className="mt-2 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-xs"
              value={draft.discountNotes || ""}
              onChange={(event) => updateDraft("discountNotes", event.target.value)}
              placeholder="Discount notes"
            />
          </section>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={saveChanges}
            disabled={saving}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Intake"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BuildInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block rounded-lg border border-slate-200 bg-white p-3">
      <span className="block font-semibold text-slate-500">{label}</span>
      <input
        className="mt-1 w-full border-0 p-0 text-xs text-slate-900 outline-none"
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

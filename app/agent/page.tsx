"use client";

import React, { useEffect, useState, useMemo } from "react";

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
};

type ApiListResponse = {
  ok: boolean;
  rows?: Lead[];
  error?: string;
};

// tweak these to your actual agents
const AGENTS = ["", "Lewis", "Brandon", "Kelly"];

const STATUS_OPTIONS = [
  "",
  "New",
  "Attempted Contact",
  "In Progress",
  "Quoted",
  "Won",
  "Lost",
  "Do Not Contact",
];

type WorksheetState = {
  coveragePackage: string;
  liability: string;
  compDed: string;
  collDed: string;
  discounts: string[];
  notes: string;
};

type WorksheetsLoadResponse = {
  ok: boolean;
  worksheets?: Record<number, WorksheetState>;
  error?: string;
};

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
  "Military",
];

const BLANK_WORKSHEET: WorksheetState = {
  coveragePackage: "",
  liability: "",
  compDed: "",
  collDed: "",
  discounts: [],
  notes: "",
};

export default function AgentDashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  // search / filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [agentFilter, setAgentFilter] = useState<string>("");

  // worksheet state
  const [activeWorksheetLead, setActiveWorksheetLead] = useState<Lead | null>(
    null
  );
  const [worksheet, setWorksheet] = useState<WorksheetState>(BLANK_WORKSHEET);
  const [savingWorksheet, setSavingWorksheet] = useState(false);

  // cache: latest worksheet per leadId, hydrated from Google Sheets
  const [worksheetByLeadId, setWorksheetByLeadId] = useState<
    Record<number, WorksheetState>
  >({});

  async function loadLeads() {
    try {
      setLoading(true);
      setError(null);

      const [leadsRes, wsRes] = await Promise.all([
        fetch("/api/agent/leads", { cache: "no-store" }),
        fetch("/api/agent/worksheet/load", { cache: "no-store" }),
      ]);

      const leadsData: ApiListResponse = await leadsRes.json();
      const wsData: WorksheetsLoadResponse = await wsRes.json();

      if (!leadsData.ok || !leadsData.rows) {
        throw new Error(leadsData.error || "Failed to load leads");
      }

      if (!wsData.ok && wsData.error) {
        // Non-fatal: leads can still load even if worksheets fail
        console.error("Worksheet load error:", wsData.error);
      }

      setLeads(leadsData.rows);
      setWorksheetByLeadId(wsData.ok && wsData.worksheets ? wsData.worksheets : {});
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error loading leads");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateLead(id: number, patch: Partial<Lead>) {
    setSavingId(id);
    try {
      const res = await fetch("/api/agent/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, patch }),
      });
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || "Update failed");
      }
      // update local state
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === id
            ? {
                ...lead,
                ...patch,
              }
            : lead
        )
      );
    } catch (err: any) {
      console.error(err);
      alert(`Could not save changes: ${err.message || err}`);
    } finally {
      setSavingId(null);
    }
  }

  // derive filtered list
  const visibleLeads = useMemo(() => {
    const s = search.trim().toLowerCase();

    return leads.filter((lead) => {
      // status filter
      if (statusFilter && (lead.status || "") !== statusFilter) {
        return false;
      }
      // agent filter
      if (agentFilter && (lead.agent || "") !== agentFilter) {
        return false;
      }
      // text search
      if (s) {
        const vehicle = [lead.year, lead.make, lead.model]
          .filter(Boolean)
          .join(" ");
        const haystack = (
          [lead.name, lead.email, lead.phone, lead.zip, vehicle].join(" ") || ""
        ).toLowerCase();

        if (!haystack.includes(s)) {
          return false;
        }
      }

      return true;
    });
  }, [leads, search, statusFilter, agentFilter]);

  function openWorksheet(lead: Lead) {
    setActiveWorksheetLead(lead);
    const existing = worksheetByLeadId[lead.id];
    setWorksheet(existing || BLANK_WORKSHEET);
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
          ? prev.discounts.filter((d) => d !== discount)
          : [...prev.discounts, discount],
      };
    });
  }

  // keep cache in sync whenever worksheet changes for the active lead
  useEffect(() => {
    if (!activeWorksheetLead) return;
    setWorksheetByLeadId((prev) => ({
      ...prev,
      [activeWorksheetLead.id]: worksheet,
    }));
  }, [worksheet, activeWorksheetLead]);

  async function saveWorksheet() {
    if (!activeWorksheetLead) return;
    try {
      setSavingWorksheet(true);

      const vehicle = [
        activeWorksheetLead.year,
        activeWorksheetLead.make,
        activeWorksheetLead.model,
      ]
        .filter(Boolean)
        .join(" ");

      const payload = {
        // lead identifiers
        leadId: activeWorksheetLead.id,
        leadSheetRow: activeWorksheetLead.id, // matches row in Leads sheet
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
        // worksheet fields
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
      if (!data.ok) {
        throw new Error(data.error || "Failed to save worksheet");
      }

      // refresh worksheets so another browser / refresh sees latest
      try {
        const wsRes = await fetch("/api/agent/worksheet/load", {
          cache: "no-store",
        });
        const wsData: WorksheetsLoadResponse = await wsRes.json();
        if (wsData.ok && wsData.worksheets) {
          setWorksheetByLeadId(wsData.worksheets);
        }
      } catch (e) {
        console.error("Reloading worksheets after save failed:", e);
      }

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
      <div className="max-w-7xl mx-auto px-4 py-10">
        <header className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Agent Dashboard</h1>
            <p className="text-sm text-gray-600">
              View and manage quote leads synced from Google Sheets.
            </p>
          </div>
          <button
            onClick={loadLeads}
            className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium bg-white hover:bg-gray-50"
          >
            Refresh
          </button>
        </header>

        {/* Filters row with aligned label + inputs */}
        <section className="mb-6 flex flex-col gap-3 md:flex-row md:items-end">
          {/* Search with label for alignment */}
          <div className="flex-1 flex flex-col text-xs text-gray-600">
            <span className="mb-1">Search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone, ZIP, vehicle…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>

          {/* Status + Agent filters */}
          <div className="flex gap-3">
            <div className="flex flex-col text-xs text-gray-600">
              <span className="mb-1">Status</span>
              <select
                className="min-w-[150px] rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs shadow-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All statuses</option>
                {STATUS_OPTIONS.filter(Boolean).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col text-xs text-gray-600">
              <span className="mb-1">Agent</span>
              <select
                className="min-w-[150px] rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs shadow-sm"
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
              >
                <option value="">All agents</option>
                {AGENTS.filter(Boolean).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-gray-600">Loading leads…</div>
        ) : leads.length === 0 ? (
          <div className="text-sm text-gray-600">
            No leads found in the sheet yet.
          </div>
        ) : visibleLeads.length === 0 ? (
          <div className="text-sm text-gray-600">
            No leads match your current filters.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-3 py-2 font-semibold">When</th>
                  <th className="px-3 py-2 font-semibold">Name</th>
                  <th className="px-3 py-2 font-semibold">Vehicle</th>
                  <th className="px-3 py-2 font-semibold">Contact</th>
                  <th className="px-3 py-2 font-semibold">ZIP</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Agent</th>
                  <th className="px-3 py-2 font-semibold">Worksheet</th>
                </tr>
              </thead>
              <tbody>
                {visibleLeads.map((lead) => {
                  const vehicle = [lead.year, lead.make, lead.model]
                    .filter(Boolean)
                    .join(" ");
                  const disabled = savingId === lead.id;
                  const hasWorksheet = !!worksheetByLeadId[lead.id];

                  return (
                    <tr
                      key={lead.id}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                        {lead.when}
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-xs text-gray-500">
                          DOB: {lead.dob || "—"}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div>{vehicle || "—"}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-xs text-gray-700">
                          {lead.phone || "—"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {lead.email || ""}
                        </div>
                      </td>
                      <td className="px-3 py-2">{lead.zip}</td>
                      <td className="px-3 py-2">
                        <select
                          className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs"
                          value={lead.status || ""}
                          disabled={disabled}
                          onChange={(e) =>
                            updateLead(lead.id, { status: e.target.value })
                          }
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt || "—"}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs"
                          value={lead.agent || ""}
                          disabled={disabled}
                          onChange={(e) =>
                            updateLead(lead.id, { agent: e.target.value })
                          }
                        >
                          {AGENTS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt || "Unassigned"}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => openWorksheet(lead)}
                          className={`rounded-md border px-2 py-1 text-xs font-medium ${
                            hasWorksheet
                              ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800"
                              : "border-slate-300 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {hasWorksheet ? "Worksheet ✓" : "Worksheet"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-out worksheet panel */}
      {activeWorksheetLead && (
        <div className="fixed inset-0 z-40 flex">
          {/* overlay */}
          <div className="flex-1 bg-black/30" onClick={closeWorksheet} />
          {/* panel */}
          <div className="w-full max-w-md bg-white shadow-xl border-l border-slate-200 flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Quote Worksheet</h2>
                <p className="text-xs text-slate-500">
                  {activeWorksheetLead.name} • {activeWorksheetLead.zip} •{" "}
                  {[
                    activeWorksheetLead.year,
                    activeWorksheetLead.make,
                    activeWorksheetLead.model,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                </p>
              </div>
              <button
                type="button"
                onClick={closeWorksheet}
                className="rounded-full border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 text-sm">
              {/* Coverage package */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Coverage Package
                </label>
                <select
                  className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
                  value={worksheet.coveragePackage}
                  onChange={(e) =>
                    setWorksheet((prev) => ({
                      ...prev,
                      coveragePackage: e.target.value,
                    }))
                  }
                >
                  {COVERAGE_PACKAGES.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt || "Select package"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Liability limits */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Liability Limits
                </label>
                <select
                  className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
                  value={worksheet.liability}
                  onChange={(e) =>
                    setWorksheet((prev) => ({
                      ...prev,
                      liability: e.target.value,
                    }))
                  }
                >
                  {LIABILITY_LIMITS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt || "Select limits"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Deductibles */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Comp Deductible
                  </label>
                  <select
                    className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
                    value={worksheet.compDed}
                    onChange={(e) =>
                      setWorksheet((prev) => ({
                        ...prev,
                        compDed: e.target.value,
                      }))
                    }
                  >
                    {DEDUCTIBLE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt || "Select"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Collision Deductible
                  </label>
                  <select
                    className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
                    value={worksheet.collDed}
                    onChange={(e) =>
                      setWorksheet((prev) => ({
                        ...prev,
                        collDed: e.target.value,
                      }))
                    }
                  >
                    {DEDUCTIBLE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt || "Select"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Discounts checklist */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">
                  Discounts Applied
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {DISCOUNT_OPTIONS.map((disc) => {
                    const checked = worksheet.discounts.includes(disc);
                    return (
                      <label
                        key={disc}
                        className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="h-3 w-3"
                          checked={checked}
                          onChange={() => toggleDiscount(disc)}
                        />
                        <span>{disc}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Underwriting / Quote Notes
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm resize-y"
                  value={worksheet.notes}
                  onChange={(e) =>
                    setWorksheet((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Drivers, tickets, prior carrier, important underwriting details…"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 px-5 py-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeWorksheet}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={saveWorksheet}
                disabled={savingWorksheet}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {savingWorksheet ? "Saving…" : "Save Worksheet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

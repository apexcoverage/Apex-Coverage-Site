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

export default function AgentDashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  // NEW: search / filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [agentFilter, setAgentFilter] = useState<string>("");

  async function loadLeads() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/agent/leads", { cache: "no-store" });
      const data: ApiListResponse = await res.json();
      if (!data.ok || !data.rows) {
        throw new Error(data.error || "Failed to load leads");
      }
      setLeads(data.rows);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error loading leads");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
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

  // NEW: derive filtered list
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
                </tr>
              </thead>
              <tbody>
                {visibleLeads.map((lead) => {
                  const vehicle = [lead.year, lead.make, lead.model]
                    .filter(Boolean)
                    .join(" ");
                  const disabled = savingId === lead.id;
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

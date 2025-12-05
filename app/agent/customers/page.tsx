"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Lead = {
  id: number;
  name: string;
  email: string;
  phone: string;
  zip: string;
  dob: string;
  year: string;
  make: string;
  model: string;
  consent: string;
  agent?: string;
  policyNumber?: string;
  status?: string;
  when?: string;
};

type ApiListResponse = {
  ok: boolean;
  rows?: Lead[];
  error?: string;
};

const AGENTS = ["", "Lewis", "Brandon", "Kelly"];

export default function CustomersPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState<string>("");

  async function loadLeads() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/agent/leads", { cache: "no-store" });
      const data: ApiListResponse = await res.json();
      if (!data.ok || !data.rows) {
        throw new Error(data.error || "Failed to load customers");
      }
      setLeads(data.rows);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error loading customers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  const visibleCustomers = useMemo(() => {
    const s = search.trim().toLowerCase();

    return leads.filter((lead) => {
      if ((lead.status || "") !== "Won") return false;

      if (agentFilter && (lead.agent || "") !== agentFilter) return false;

      if (s) {
        const vehicle = [lead.year, lead.make, lead.model]
          .filter(Boolean)
          .join(" ");

        const haystack = (
          [lead.name, lead.email, lead.phone, lead.zip, vehicle].join(" ") || ""
        ).toLowerCase();

        if (!haystack.includes(s)) return false;
      }

      return true;
    });
  }, [leads, search, agentFilter]);

  return (
    <main className="min-h-screen bg-slate-50 text-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-10">
        
        {/* Header */}
        <header className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Customer List</h1>
            <p className="text-sm text-gray-600">
              These are leads that have been marked as <strong>Won</strong>.
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            
            <div className="inline-flex items-center rounded-full border border-gray-200 bg-white p-1 text-xs font-medium shadow-sm">
              <Link
                href="/agent"
                className="px-3 py-1.5 rounded-full text-slate-700 hover:bg-slate-100"
              >
                Leads
              </Link>
              <Link
                href="/agent/customers"
                className="px-3 py-1.5 rounded-full bg-slate-900 text-white shadow-sm"
              >
                Customers
              </Link>
            </div>

            <button
              onClick={loadLeads}
              className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium bg-white hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>
        </header>

        {/* Filters */}
        <section className="mb-6 flex flex-col gap-3 md:flex-row md:items-end">
          
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

          <div className="flex flex-col text-xs text-gray-600">
            <span className="mb-1">Agent</span>
            <select
              className="min-w-[150px] rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs shadow-sm"
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
            >
              <option value="">All agents</option>
              {AGENTS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt || "Unassigned"}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Table */}
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-gray-600">Loading customers…</div>
        ) : visibleCustomers.length === 0 ? (
          <div className="text-sm text-gray-600">
            No customers to show yet. Mark a lead as <strong>Won</strong> on the
            Agent Dashboard to see it here.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  {/* Removed When column */}
                  <th className="px-3 py-2 font-semibold">Name</th>
                  <th className="px-3 py-2 font-semibold">Vehicle</th>
                  <th className="px-3 py-2 font-semibold">Contact</th>
                  <th className="px-3 py-2 font-semibold">ZIP</th>
                  <th className="px-3 py-2 font-semibold">Agent</th>
                  <th className="px-3 py-2 font-semibold">Policy #</th>
                  {/* Removed Status column */}
                  <th className="px-3 py-2 font-semibold text-right">
                    Profile
                  </th>
                </tr>
              </thead>

              <tbody>
                {visibleCustomers.map((lead) => {
                  const vehicle = [lead.year, lead.make, lead.model]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <tr
                      key={lead.id}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      {/* Removed WHEN cell */}
                      
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

                      <td className="px-3 py-2">{lead.agent || "Unassigned"}</td>

                      <td className="px-3 py-2">
                        {lead.policyNumber || "—"}
                      </td>

                      {/* Removed STATUS cell */}

                      <td className="px-3 py-2 text-right">
                        <Link
                          href={`/agent/customers/${lead.id}`}
                          className="inline-flex items-center rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-gray-100"
                        >
                          View Profile
                        </Link>
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

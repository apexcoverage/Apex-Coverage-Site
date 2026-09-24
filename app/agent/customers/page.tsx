"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type AutoLead = {
  id: number;
  name: string;
  email: string;
  phone: string;
  zip: string;
  dob: string;
  year: string;
  make: string;
  model: string;
  agent?: string;
  policyNumber?: string;
  status?: string;
};

type BuildReview = {
  id: number;
  name: string;
  email: string;
  phone: string;
  zip: string;
  year: string;
  make: string;
  model: string;
  vin: string;
  tierInterest: string;
  deductible: string;
  partsValue: string;
  status?: string;
  agent?: string;
  autoInsuranceReview?: string;
};

type ApiListResponse<T> = {
  ok: boolean;
  rows?: T[];
  error?: string;
};

type CustomerRecord = {
  key: string;
  name: string;
  email: string;
  phone: string;
  zip: string;
  agent: string;
  autoLead?: AutoLead;
  buildReviews: BuildReview[];
  searchText: string;
};

const AGENTS = ["", "Lewis", "Brandon", "Kelly"];

function vehicleLabel(item: {
  year?: string;
  make?: string;
  model?: string;
}) {
  return [item.year, item.make, item.model].filter(Boolean).join(" ");
}

function recordKey(item: { email?: string; phone?: string; name?: string }) {
  const email = String(item.email || "").trim().toLowerCase();
  const phone = String(item.phone || "").replace(/\D/g, "");
  const name = String(item.name || "").trim().toLowerCase();
  return email || phone || name;
}

function isBuildCustomer(review: BuildReview) {
  return (review.status || "") === "Active";
}

function coverageLabel(record: CustomerRecord) {
  const hasAuto = !!record.autoLead;
  const hasBuild = record.buildReviews.length > 0;
  if (hasAuto && hasBuild) return "Both";
  if (hasBuild) return "Build Coverage";
  return "Auto Coverage";
}

function profileHref(record: CustomerRecord) {
  if (record.autoLead) return `/agent/customers/auto-${record.autoLead.id}`;
  const build = record.buildReviews[0];
  return build ? `/agent/customers/build-${build.id}` : "/agent/customers";
}

export default function CustomersPage() {
  const [autoLeads, setAutoLeads] = useState<AutoLead[]>([]);
  const [buildReviews, setBuildReviews] = useState<BuildReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState("");
  const [coverageFilter, setCoverageFilter] = useState("");

  async function loadCustomers() {
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
        throw new Error(leadsData.error || "Failed to load auto customers");
      }

      if (!buildData.ok || !buildData.rows) {
        throw new Error(buildData.error || "Failed to load build customers");
      }

      setAutoLeads(leadsData.rows);
      setBuildReviews(buildData.rows);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error loading customers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  const customers = useMemo<CustomerRecord[]>(() => {
    const map = new Map<string, CustomerRecord>();

    autoLeads
      .filter((lead) => (lead.status || "") === "Won")
      .forEach((lead) => {
        const key = recordKey(lead) || `auto-${lead.id}`;
        map.set(key, {
          key,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          zip: lead.zip,
          agent: lead.agent || "",
          autoLead: lead,
          buildReviews: [],
          searchText: "",
        });
      });

    buildReviews.filter(isBuildCustomer).forEach((review) => {
      const key = recordKey(review) || `build-${review.id}`;
      const existing = map.get(key);

      if (existing) {
        existing.buildReviews.push(review);
        if (!existing.agent) existing.agent = review.agent || "";
        return;
      }

      map.set(key, {
        key,
        name: review.name,
        email: review.email,
        phone: review.phone,
        zip: review.zip,
        agent: review.agent || "",
        buildReviews: [review],
        searchText: "",
      });
    });

    return Array.from(map.values()).map((record) => {
      const autoVehicle = record.autoLead ? vehicleLabel(record.autoLead) : "";
      const buildVehicles = record.buildReviews.map(vehicleLabel).join(" ");
      return {
        ...record,
        searchText: [
          record.name,
          record.email,
          record.phone,
          record.zip,
          record.agent,
          autoVehicle,
          buildVehicles,
          coverageLabel(record),
        ]
          .join(" ")
          .toLowerCase(),
      };
    });
  }, [autoLeads, buildReviews]);

  const visibleCustomers = useMemo(() => {
    const s = search.trim().toLowerCase();

    return customers.filter((record) => {
      if (agentFilter && record.agent !== agentFilter) return false;
      if (coverageFilter && coverageLabel(record) !== coverageFilter) return false;
      if (s && !record.searchText.includes(s)) return false;
      return true;
    });
  }, [customers, search, agentFilter, coverageFilter]);

  return (
    <main className="apex-agent-shell">
      <div className="apex-agent-container">
        <header className="apex-agent-hero mb-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="apex-agent-eyebrow">
              Apex Customer Center
            </p>
            <h1 className="apex-agent-title mt-2">Customer Coverage</h1>
            <p className="apex-agent-subtitle mt-3 text-sm">
              Customers are grouped by contact info so agents can see build
              coverage, auto coverage, or both in one row.
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <div className="apex-agent-nav">
              <Link
                href="/agent"
                className="apex-agent-nav-link"
              >
                Pipeline
              </Link>
              <Link
                href="/agent/customers"
                className="apex-agent-nav-link apex-agent-nav-link-active"
              >
                Customers
              </Link>
              <Link
                href="/agent/quotes"
                className="apex-agent-nav-link"
              >
                Quote Tool
              </Link>
            </div>

            <button
              onClick={loadCustomers}
              className="apex-agent-button-secondary px-4 py-2 text-sm"
            >
              Refresh
            </button>
          </div>
        </header>

        <section className="apex-agent-card mb-6 grid gap-3 p-4 md:grid-cols-[1fr_auto_auto] md:items-end">
          <div className="flex flex-col text-xs">
            <span className="mb-1">Search</span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, phone, ZIP, vehicle, coverage..."
              className="apex-agent-input px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col text-xs">
            <span className="mb-1">Coverage</span>
            <select
              className="apex-agent-input min-w-[170px] px-2 py-2 text-xs"
              value={coverageFilter}
              onChange={(event) => setCoverageFilter(event.target.value)}
            >
              <option value="">All coverage</option>
              <option value="Build Coverage">Build Coverage</option>
              <option value="Auto Coverage">Auto Coverage</option>
              <option value="Both">Both</option>
            </select>
          </div>

          <div className="flex flex-col text-xs">
            <span className="mb-1">Agent</span>
            <select
              className="apex-agent-input min-w-[150px] px-2 py-2 text-xs"
              value={agentFilter}
              onChange={(event) => setAgentFilter(event.target.value)}
            >
              <option value="">All agents</option>
              {AGENTS.filter(Boolean).map((agent) => (
                <option key={agent} value={agent}>
                  {agent}
                </option>
              ))}
            </select>
          </div>
        </section>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="apex-agent-soft-text text-sm">Loading customers...</div>
        ) : visibleCustomers.length === 0 ? (
          <div className="apex-agent-card p-6 text-sm text-blue-100">
            No customers match your current filters.
          </div>
        ) : (
          <div className="apex-agent-table overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="px-3 py-2 font-semibold">Customer</th>
                  <th className="px-3 py-2 font-semibold">Coverage</th>
                  <th className="px-3 py-2 font-semibold">Vehicles</th>
                  <th className="px-3 py-2 font-semibold">Build Status</th>
                  <th className="px-3 py-2 font-semibold">Auto Policy</th>
                  <th className="px-3 py-2 font-semibold">Agent</th>
                  <th className="px-3 py-2 font-semibold text-right">Profile</th>
                </tr>
              </thead>
              <tbody>
                {visibleCustomers.map((record) => {
                  const autoVehicle = record.autoLead
                    ? vehicleLabel(record.autoLead)
                    : "";
                  const buildVehicles = record.buildReviews
                    .map(vehicleLabel)
                    .filter(Boolean);
                  return (
                    <tr
                      key={record.key}
                      className="border-t border-slate-100 align-top hover:bg-blue-50/70"
                    >
                      <td className="px-3 py-3">
                        <div className="font-medium">{record.name || "-"}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          {record.phone || "-"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {record.email || ""}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <CoverageBadge label={coverageLabel(record)} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="space-y-1 text-xs text-gray-700">
                          {autoVehicle && <div>Auto: {autoVehicle}</div>}
                          {buildVehicles.map((vehicle) => (
                            <div key={vehicle}>Build: {vehicle}</div>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-700">
                        {record.buildReviews.length === 0
                          ? "-"
                          : record.buildReviews
                              .map((review) => review.status || "Build Review")
                              .join(", ")}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-700">
                        {record.autoLead?.policyNumber || "-"}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-700">
                        {record.agent || "Unassigned"}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Link
                          href={profileHref(record)}
                          className="inline-flex items-center rounded-lg border border-blue-200 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
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

function CoverageBadge({ label }: { label: string }) {
  const classes =
    label === "Both"
      ? "bg-blue-600 text-white shadow-sm"
      : label === "Build Coverage"
        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
        : "bg-slate-100 text-slate-700 ring-1 ring-slate-200";

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${classes}`}>
      {label}
    </span>
  );
}

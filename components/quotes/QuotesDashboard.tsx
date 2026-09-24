"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { EmployeeUser, SavedQuoteRecord } from "@/lib/quotes/types";

function quoteTypeLabel(type: string) {
  return type === "AUTO_INSURANCE"
    ? "Auto Coverage"
    : "Modified Vehicle Protection";
}

function vehicleLabel(quote: SavedQuoteRecord) {
  return [quote.vehicle.year, quote.vehicle.make, quote.vehicle.model, quote.vehicle.trim]
    .filter(Boolean)
    .join(" ");
}

export default function QuotesDashboard({
  currentUser,
}: {
  currentUser: EmployeeUser;
}) {
  const router = useRouter();
  const [quotes, setQuotes] = useState<SavedQuoteRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadQuotes() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/internal/quotes?search=${encodeURIComponent(search)}`,
        { cache: "no-store" }
      );
      if (res.status === 401) {
        router.push("/agent/quotes/login");
        return;
      }
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Could not load quotes.");
      setQuotes(data.quotes || []);
    } catch (err: any) {
      setError(err.message || "Could not load quotes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    await fetch("/api/internal/auth/logout", { method: "POST" });
    router.push("/agent/quotes/login");
    router.refresh();
  }

  const stats = useMemo(() => {
    return {
      total: quotes.length,
      needsReview: quotes.filter((quote) => quote.status === "NEEDS_REVIEW").length,
      approved: quotes.filter((quote) => quote.status === "APPROVED").length,
    };
  }, [quotes]);

  return (
    <main className="apex-agent-shell">
      <div className="apex-agent-container">
        <header className="apex-agent-hero mb-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="apex-agent-eyebrow">
              Apex Coverage Quote Tool
            </p>
            <h1 className="apex-agent-title mt-2">Internal Quoting</h1>
            <p className="apex-agent-subtitle mt-3 text-sm">
              Create guarded quote estimates, review AI output, and save quote history.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-blue-100">
              {currentUser.name} - {currentUser.role}
            </span>
            <button
              type="button"
              onClick={logout}
              className="apex-agent-button-secondary px-3 py-2 text-sm"
            >
              Sign Out
            </button>
          </div>
        </header>

        <section className="mb-6 grid gap-3 md:grid-cols-3">
          <div className="apex-agent-stat">
            <div className="apex-agent-stat-value">{stats.total}</div>
            <div className="apex-agent-stat-label">Recent Quotes</div>
          </div>
          <div className="apex-agent-stat">
            <div className="apex-agent-stat-value">{stats.needsReview}</div>
            <div className="apex-agent-stat-label">Needs Review</div>
          </div>
          <div className="apex-agent-stat">
            <div className="apex-agent-stat-value">{stats.approved}</div>
            <div className="apex-agent-stat-label">Approved</div>
          </div>
        </section>

        <section className="mb-6 grid gap-3 md:grid-cols-2">
          <Link
            href="/agent/quotes/new/auto"
            className="apex-agent-card p-5 transition hover:border-blue-300/60"
          >
            <div className="text-lg font-bold text-white">New Auto Coverage Quote</div>
            <p className="mt-2 text-sm text-blue-100/80">
              Driver, vehicle, coverage, incidents, mileage, and discount workflow.
            </p>
          </Link>
          <Link
            href="/agent/quotes/new/modified-vehicle"
            className="apex-agent-card p-5 transition hover:border-blue-300/60"
          >
            <div className="text-lg font-bold text-white">
              New Modified Vehicle Protection Quote
            </div>
            <p className="mt-2 text-sm text-blue-100/80">
              Build value, install type, tune status, deductible, tier, and documents.
            </p>
          </Link>
        </section>

        <section className="apex-agent-card mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <label className="flex-1 text-xs font-bold text-blue-100">
            Search Quotes
            <input
              className="apex-agent-input mt-1 px-3 py-2 text-sm"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") loadQuotes();
              }}
              placeholder="Quote ID, customer, vehicle, employee, status..."
            />
          </label>
          <button
            type="button"
            onClick={loadQuotes}
            className="apex-agent-button-secondary px-4 py-2 text-sm"
          >
            Search
          </button>
        </section>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="apex-agent-table overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="px-3 py-2 font-semibold">Quote</th>
                <th className="px-3 py-2 font-semibold">Customer</th>
                <th className="px-3 py-2 font-semibold">Vehicle</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Employee</th>
                <th className="px-3 py-2 font-semibold">Date Created</th>
                <th className="px-3 py-2 text-right font-semibold">Open</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-4 text-slate-500" colSpan={7}>
                    Loading quotes...
                  </td>
                </tr>
              ) : quotes.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-slate-500" colSpan={7}>
                    No saved quotes yet.
                  </td>
                </tr>
              ) : (
                quotes.map((quote) => (
                  <tr key={quote.quoteId} className="border-t border-slate-100 align-top hover:bg-blue-50/70">
                    <td className="px-3 py-3">
                      <div className="font-semibold">{quote.quoteId}</div>
                      <div className="text-xs text-slate-500">
                        {quoteTypeLabel(quote.quoteType)}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium">{quote.customer.name}</div>
                      <div className="text-xs text-slate-500">
                        {quote.customer.email || quote.customer.phone || "-"}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-700">
                      {vehicleLabel(quote) || "-"}
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        {quote.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-700">
                      {quote.employee.name}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-700">
                      {new Date(quote.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        href={`/agent/quotes/${quote.quoteId}`}
                        className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

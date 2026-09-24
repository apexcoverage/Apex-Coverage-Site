"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import type { QuoteStatus, SavedQuoteRecord } from "@/lib/quotes/types";

function quoteTypeLabel(type: string) {
  return type === "AUTO_INSURANCE"
    ? "Auto Coverage"
    : "Modified Vehicle Protection";
}

function editHref(quote: SavedQuoteRecord) {
  return quote.quoteType === "AUTO_INSURANCE"
    ? `/agent/quotes/new/auto?fromQuote=${quote.quoteId}`
    : `/agent/quotes/new/modified-vehicle?fromQuote=${quote.quoteId}`;
}

export default function QuoteReview({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [quote, setQuote] = useState<SavedQuoteRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function loadQuote() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/internal/quotes/${quoteId}`, {
        cache: "no-store",
      });
      if (res.status === 401) {
        router.push("/agent/quotes/login");
        return;
      }
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Could not load quote.");
      setQuote(data.quote);
    } catch (err: any) {
      setError(err.message || "Could not load quote.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteId]);

  async function updateStatus(status: QuoteStatus) {
    setBusy(status);
    setError("");
    try {
      const res = await fetch(`/api/internal/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Could not update quote.");
      setQuote(data.quote);
    } catch (err: any) {
      setError(err.message || "Could not update quote.");
    } finally {
      setBusy("");
    }
  }

  async function regenerate() {
    if (!quote) return;
    setBusy("REGENERATE");
    setError("");
    try {
      const res = await fetch("/api/internal/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteType: quote.quoteType,
          input: quote.input,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Could not regenerate quote.");
      router.push(`/agent/quotes/${data.quote.quoteId}`);
    } catch (err: any) {
      setError(err.message || "Could not regenerate quote.");
    } finally {
      setBusy("");
    }
  }

  const vehicleSummary = useMemo(() => {
    if (!quote) return "";
    return [quote.vehicle.year, quote.vehicle.make, quote.vehicle.model, quote.vehicle.trim]
      .filter(Boolean)
      .join(" ");
  }, [quote]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 text-sm text-slate-600">
        Loading quote...
      </main>
    );
  }

  if (!quote) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error || "Quote not found."}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link href="/agent/quotes" className="text-sm font-semibold text-[#cc0000]">
              Back to Quote Dashboard
            </Link>
            <h1 className="mt-2 text-3xl font-bold">{quote.quoteId}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {quoteTypeLabel(quote.quoteType)} - created by {quote.employee.name} on{" "}
              {new Date(quote.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={editHref(quote)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-100"
            >
              Edit Information
            </Link>
            <button
              type="button"
              disabled={!!busy}
              onClick={regenerate}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-60"
            >
              {busy === "REGENERATE" ? "Regenerating..." : "Regenerate Quote"}
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => updateStatus("SAVED")}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {busy === "SAVED" ? "Saving..." : "Save Quote"}
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => updateStatus("APPROVED")}
              className="rounded-lg bg-[#cc0000] px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {busy === "APPROVED" ? "Approving..." : "Approve Quote"}
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mb-5 grid gap-3 md:grid-cols-4">
          <SummaryBox label="Status" value={quote.status.replace(/_/g, " ")} />
          <SummaryBox label="Customer" value={quote.customer.name} />
          <SummaryBox label="Vehicle" value={vehicleSummary || "-"} />
          <SummaryBox label="Quote Type" value={quoteTypeLabel(quote.quoteType)} />
        </section>

        <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
          <section className="space-y-5">
            <Panel title="Customer Quote Text">
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">
                {quote.result.customer_quote_text}
              </p>
            </Panel>

            <Panel title="Coverage">
              <div className="grid gap-3 md:grid-cols-3">
                <KeyValue label="Type" value={quote.result.coverage.type} />
                <KeyValue label="Tier" value={quote.result.coverage.tier} />
                <KeyValue label="Deductible" value={quote.result.coverage.deductible} />
              </div>
              <TwoColumnLists
                leftTitle="Included"
                leftItems={quote.result.coverage.included_items}
                rightTitle="Not Included / Excluded"
                rightItems={quote.result.coverage.excluded_or_not_included}
              />
            </Panel>

            <Panel title="Pricing">
              <div className="grid gap-3 md:grid-cols-4">
                <KeyValue label="Monthly" value={quote.result.pricing.monthly_estimate} />
                <KeyValue label="Monthly Range" value={quote.result.pricing.monthly_range} />
                <KeyValue label="6 Months" value={quote.result.pricing.six_month_estimate} />
                <KeyValue label="Annual" value={quote.result.pricing.annual_estimate} />
              </div>
              <BulletList title="Pricing Notes" items={quote.result.pricing.pricing_notes} />
            </Panel>

            <Panel title="Underwriting">
              <div className="grid gap-3 md:grid-cols-2">
                <KeyValue label="Decision" value={quote.result.underwriting.decision} />
                <KeyValue label="Risk Score" value={quote.result.underwriting.risk_score} />
              </div>
              <TwoColumnLists
                leftTitle="Required Before Binding"
                leftItems={quote.result.underwriting.required_before_binding}
                rightTitle="Review Flags"
                rightItems={quote.result.underwriting.review_flags}
              />
            </Panel>
          </section>

          <aside className="space-y-5">
            <Panel title="Customer">
              <KeyValue label="Name" value={quote.result.customer.name || quote.customer.name} />
              <KeyValue label="ZIP" value={quote.result.customer.zip || quote.customer.zip} />
              <KeyValue label="Age" value={quote.result.customer.age} />
              <KeyValue label="DOB" value={quote.result.customer.dob} />
              <KeyValue label="Gender" value={quote.result.customer.gender} />
            </Panel>

            <Panel title="Vehicle">
              <KeyValue label="Year" value={quote.result.vehicle.year} />
              <KeyValue label="Make" value={quote.result.vehicle.make} />
              <KeyValue label="Model" value={quote.result.vehicle.model} />
              <KeyValue label="Trim" value={quote.result.vehicle.trim} />
              <KeyValue label="Summary" value={quote.result.vehicle.summary} />
            </Panel>

            <Panel title="Warnings and Missing Info">
              <BulletList title="Warnings" items={quote.result.warnings} />
              <BulletList title="Missing Information" items={quote.result.missing_information} />
            </Panel>

            <Panel title="Employee Notes">
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {quote.result.employee_notes || "No employee notes returned."}
              </p>
            </Panel>
          </aside>
        </div>
      </div>
    </main>
  );
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 font-semibold">{value || "-"}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-sm text-slate-900">{value || "-"}</div>
    </div>
  );
}

function BulletList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-1 text-sm text-slate-500">None listed.</p>
      ) : (
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TwoColumnLists({
  leftTitle,
  leftItems,
  rightTitle,
  rightItems,
}: {
  leftTitle: string;
  leftItems: string[];
  rightTitle: string;
  rightItems: string[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <BulletList title={leftTitle} items={leftItems} />
      <BulletList title={rightTitle} items={rightItems} />
    </div>
  );
}

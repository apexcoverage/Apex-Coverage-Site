"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { readJsonResponse } from "@/lib/quotes/apiClient";
import type { EmployeeUser } from "@/lib/quotes/types";
import type { RateConfig } from "@/lib/quotes/rateConfigStore";

type ApiResponse = {
  ok: boolean;
  config?: RateConfig;
  canManage?: boolean;
  error?: string;
};

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function cloneConfig(config: RateConfig): RateConfig {
  return JSON.parse(JSON.stringify(config));
}

export default function RateAdmin({ currentUser }: { currentUser: EmployeeUser }) {
  const router = useRouter();
  const [config, setConfig] = useState<RateConfig | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadConfig() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/internal/quote-rates", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/agent/quotes/login");
        return;
      }
      const data: ApiResponse = await readJsonResponse(res);
      if (!data.ok || !data.config) throw new Error(data.error || "Could not load rate matrix.");
      setConfig(data.config);
      setCanManage(!!data.canManage);
    } catch (err: any) {
      setError(err.message || "Could not load rate matrix.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateConfig(updater: (draft: RateConfig) => void) {
    setConfig((prev) => {
      if (!prev) return prev;
      const draft = cloneConfig(prev);
      updater(draft);
      return draft;
    });
  }

  async function saveConfig(reset = false) {
    if (!config) return;
    setSaving(reset ? "reset" : "save");
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/internal/quote-rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reset ? { reset: true } : { config }),
      });
      const data: ApiResponse = await readJsonResponse(res);
      if (!data.ok || !data.config) throw new Error(data.error || "Could not save rate matrix.");
      setConfig(data.config);
      setMessage(reset ? "Matrix reset to system defaults." : "Matrix version saved.");
    } catch (err: any) {
      setError(err.message || "Could not save rate matrix.");
    } finally {
      setSaving("");
    }
  }

  if (loading) {
    return (
      <main className="apex-agent-shell px-4 py-8 text-sm text-blue-100">
        Loading rate matrix...
      </main>
    );
  }

  if (!config) {
    return (
      <main className="apex-agent-shell px-4 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error || "Rate matrix could not be loaded."}
        </div>
      </main>
    );
  }

  return (
    <main className="apex-agent-shell">
      <div className="apex-agent-container">
        <header className="apex-agent-hero apex-agent-hero-compact mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link href="/agent/quotes" className="text-sm font-bold text-blue-200 hover:text-white">
              Back to Quote Dashboard
            </Link>
            <h1 className="apex-agent-title mt-3">Rate Matrix Admin</h1>
            <p className="apex-agent-subtitle mt-2 text-sm">
              Edit the active Apex quote matrix without changing code. Each saved quote keeps the matrix version used when it was generated.
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-blue-100/70">
              Signed in as {currentUser.name} - {currentUser.role}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!canManage || !!saving}
              onClick={() => saveConfig(false)}
              className="apex-agent-button-primary px-4 py-2 text-sm disabled:opacity-50"
            >
              {saving === "save" ? "Saving..." : "Save Matrix"}
            </button>
            <button
              type="button"
              disabled={!canManage || !!saving}
              onClick={() => saveConfig(true)}
              className="apex-agent-button-secondary px-4 py-2 text-sm disabled:opacity-50"
            >
              {saving === "reset" ? "Resetting..." : "Reset Defaults"}
            </button>
          </div>
        </header>

        {!canManage && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            You can view the matrix, but only manager/admin accounts can save changes.
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            {message}
          </div>
        )}

        <section className="grid gap-5 lg:grid-cols-2">
          <Panel title="Matrix Versions">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Auto Version"
                value={config.auto.version}
                onChange={(value) => updateConfig((draft) => { draft.auto.version = value; })}
                disabled={!canManage}
              />
              <TextField
                label="MVP Version"
                value={config.mvp.version}
                onChange={(value) => updateConfig((draft) => { draft.mvp.version = value; })}
                disabled={!canManage}
              />
              <TextField
                label="Auto Effective Date"
                type="date"
                value={config.auto.effectiveDate}
                onChange={(value) => updateConfig((draft) => { draft.auto.effectiveDate = value; })}
                disabled={!canManage}
              />
              <TextField
                label="MVP Effective Date"
                type="date"
                value={config.mvp.effectiveDate}
                onChange={(value) => updateConfig((draft) => { draft.mvp.effectiveDate = value; })}
                disabled={!canManage}
              />
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Last saved by {config.updatedBy || "System default"}
              {config.updatedAt ? ` on ${new Date(config.updatedAt).toLocaleString()}` : ""}.
            </p>
          </Panel>

          <Panel title="Auto Base Pricing">
            <div className="grid gap-4 md:grid-cols-3">
              <NumberField
                label="Liability Base Monthly"
                value={config.auto.liabilityBaseMonthly}
                onChange={(value) => updateConfig((draft) => { draft.auto.liabilityBaseMonthly = value; })}
                disabled={!canManage}
              />
              <NumberField
                label="Minimum Liability Monthly"
                value={config.auto.minimumLiabilityMonthly}
                onChange={(value) => updateConfig((draft) => { draft.auto.minimumLiabilityMonthly = value; })}
                disabled={!canManage}
              />
              <NumberField
                label="Max Discount"
                value={config.auto.maxDiscount}
                step="0.01"
                onChange={(value) => updateConfig((draft) => { draft.auto.maxDiscount = value; })}
                disabled={!canManage}
              />
            </div>
          </Panel>

          <Panel title="Auto Liability Limit Factors">
            <FactorGrid
              items={config.auto.liabilityLimitFactors}
              disabled={!canManage}
              onChange={(key, value) =>
                updateConfig((draft) => {
                  draft.auto.liabilityLimitFactors[key] = value;
                })
              }
            />
          </Panel>

          <Panel title="Auto Incident Timing Fade">
            <div className="space-y-3">
              {config.auto.incidentTimingFactors.map((band, index) => (
                <div key={band.label} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-4">
                  <TextField
                    label="Band"
                    value={band.label}
                    onChange={(value) => updateConfig((draft) => { draft.auto.incidentTimingFactors[index].label = value; })}
                    disabled={!canManage}
                  />
                  <NumberField
                    label="Min Months"
                    value={band.minMonths}
                    onChange={(value) => updateConfig((draft) => { draft.auto.incidentTimingFactors[index].minMonths = value; })}
                    disabled={!canManage}
                  />
                  <NumberField
                    label="Max Months"
                    value={band.maxMonths}
                    onChange={(value) => updateConfig((draft) => { draft.auto.incidentTimingFactors[index].maxMonths = value; })}
                    disabled={!canManage}
                  />
                  <NumberField
                    label="Impact Factor"
                    value={band.factor}
                    step="0.01"
                    onChange={(value) => updateConfig((draft) => { draft.auto.incidentTimingFactors[index].factor = value; })}
                    disabled={!canManage}
                  />
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="MVP Base Pricing">
            <div className="grid gap-4 md:grid-cols-3">
              <NumberField
                label="Base Rate Per $1,000"
                value={config.mvp.baseRatePerThousand}
                step="0.01"
                onChange={(value) => updateConfig((draft) => { draft.mvp.baseRatePerThousand = value; })}
                disabled={!canManage}
              />
              <NumberField
                label="Minimum Monthly"
                value={config.mvp.minimumMonthlyPremium}
                onChange={(value) => updateConfig((draft) => { draft.mvp.minimumMonthlyPremium = value; })}
                disabled={!canManage}
              />
              <NumberField
                label="Max Discount"
                value={config.mvp.maxDiscount}
                step="0.01"
                onChange={(value) => updateConfig((draft) => { draft.mvp.maxDiscount = value; })}
                disabled={!canManage}
              />
            </div>
          </Panel>

          <Panel title="MVP Deductible Factors">
            <FactorGrid
              items={config.mvp.deductibleFactors}
              disabled={!canManage}
              onChange={(key, value) =>
                updateConfig((draft) => {
                  draft.mvp.deductibleFactors[key as keyof typeof draft.mvp.deductibleFactors] = value;
                })
              }
            />
          </Panel>

          <Panel title="MVP Discounts">
            <FactorGrid
              items={config.mvp.discounts}
              disabled={!canManage}
              onChange={(key, value) =>
                updateConfig((draft) => {
                  draft.mvp.discounts[key] = value;
                })
              }
            />
          </Panel>

          <Panel title="MVP Review Thresholds">
            <FactorGrid
              items={config.mvp.manualReviewThresholds}
              disabled={!canManage}
              onChange={(key, value) =>
                updateConfig((draft) => {
                  draft.mvp.manualReviewThresholds[
                    key as keyof typeof draft.mvp.manualReviewThresholds
                  ] = value;
                })
              }
            />
          </Panel>
        </section>
      </div>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="apex-agent-card-light p-5">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  disabled,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        className="apex-agent-input mt-1 px-3 py-2 disabled:bg-slate-100"
        type={type}
        value={value || ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  disabled,
  step = "1",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  step?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        className="apex-agent-input mt-1 px-3 py-2 disabled:bg-slate-100"
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : 0}
        disabled={disabled}
        onChange={(event) => onChange(toNumber(event.target.value))}
      />
    </label>
  );
}

function FactorGrid({
  items,
  disabled,
  onChange,
}: {
  items: Record<string, number>;
  disabled?: boolean;
  onChange: (key: string, value: number) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {Object.entries(items).map(([key, value]) => (
        <NumberField
          key={key}
          label={key}
          value={value}
          step="0.01"
          disabled={disabled}
          onChange={(nextValue) => onChange(key, nextValue)}
        />
      ))}
    </div>
  );
}

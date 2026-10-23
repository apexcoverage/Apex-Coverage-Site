"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { coverageStage } from "@/lib/agentLifecycle";
import { cleanSetupDetails, setupMissingInformation, type SetupDetails } from "@/lib/agentOnboarding";

type Row = Record<string, unknown> & { id: number; status?: string };
type Setup = { source: Row; autos: Row[]; builds: Row[] };

function firstValue(...values: unknown[]) {
  return values.map((value) => String(value || "").trim()).find(Boolean) || "";
}

function field(label: string, key: keyof SetupDetails, value: SetupDetails, setValue: (key: keyof SetupDetails, next: string) => void, type = "text") {
  return <label key={key} className="space-y-1 text-sm font-medium text-slate-700">
    <span>{label}</span>
    <input type={type} value={value[key]} onChange={(event) => setValue(key, event.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900" />
  </label>;
}

export function CustomerSetup({ kind, id }: { kind: "auto" | "build"; id: number }) {
  const router = useRouter();
  const [setup, setSetup] = useState<Setup | null>(null);
  const [details, setDetails] = useState<SetupDetails>(() => cleanSetupDetails({}));
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/agent/onboarding?kind=${kind}&id=${id}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Could not load setup.");
      const next: Setup = { source: data.source, autos: data.autos || [], builds: data.builds || [] };
      setSetup(next);
      const auto = next.autos.find((row) => coverageStage("auto", row.status) === "onboarding") || next.autos[0];
      const build = next.builds.find((row) => coverageStage("build", row.status) === "onboarding") || next.builds[0];
      const selected = next.source;
      let vehicle: Record<string, unknown> = {};
      try { const parsed = JSON.parse(String(auto?.cardVehicles || "")); if (Array.isArray(parsed)) vehicle = parsed[0] || {}; } catch { /* No saved card vehicle. */ }
      setDetails(cleanSetupDetails({
        name: firstValue(selected?.name, auto?.name, build?.name),
        email: firstValue(selected?.email, auto?.email, build?.email),
        phone: firstValue(selected?.phone, auto?.phone, build?.phone),
        addressLine1: firstValue(selected?.addressLine1, auto?.addressLine1, build?.addressLine1),
        addressLine2: firstValue(selected?.addressLine2, auto?.addressLine2, build?.addressLine2),
        city: firstValue(selected?.city, auto?.city, build?.city),
        state: firstValue(selected?.state, auto?.state, build?.state),
        zip: firstValue(selected?.zip, auto?.zip, build?.zip),
        year: firstValue(kind === "auto" ? vehicle.year : build?.year, selected?.year),
        make: firstValue(kind === "auto" ? vehicle.make : build?.make, selected?.make),
        model: firstValue(kind === "auto" ? vehicle.model : build?.model, selected?.model),
        vin: firstValue(kind === "auto" ? vehicle.vin : build?.vin),
        coverage: firstValue(auto?.coverage), monthlyPremium: firstValue(auto?.monthlyPremium),
        tierInterest: firstValue(build?.tierInterest), partsValue: firstValue(build?.partsValue),
        deductible: firstValue(build?.deductible),
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load setup.");
    } finally {
      setLoading(false);
    }
  }, [kind, id]);

  useEffect(() => { void load(); }, [load]);

  function update(key: keyof SetupDetails, next: string) {
    setDetails((current) => ({ ...current, [key]: next }));
    setSaved("");
  }

  async function submit(action: "save" | "activate") {
    setError("");
    setSaved("");
    if (action === "activate") {
      const missing = setupMissingInformation(details);
      if (missing.length) { setError(`Complete: ${missing.join(", ")}.`); return; }
      if (!confirmed) { setError("Confirm Apex's binding requirements before activation."); return; }
    }
    setBusy(true);
    try {
      const response = await fetch("/api/agent/onboarding", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, kind, id, details, confirmed }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.missing?.length ? `${data.error} ${data.missing.join(", ")}.` : data.error || "Could not save setup.");
      if (action === "activate") {
        await load();
        router.refresh();
        setSaved(`${kind === "auto" ? "Auto" : "Modified vehicle"} coverage marked active. Open the customer profile to finish documents and billing.`);
      } else {
        setSaved("Setup saved. The customer is not active yet.");
        await load();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save setup.");
    } finally {
      setBusy(false);
    }
  }

  const auto = kind === "auto" ? setup?.source : setup?.autos.find((row) => coverageStage("auto", row.status) === "onboarding") || setup?.autos[0];
  const build = kind === "build" ? setup?.source : setup?.builds.find((row) => coverageStage("build", row.status) === "onboarding") || setup?.builds[0];
  const autoStage = auto ? coverageStage("auto", auto.status) : null;
  const buildStage = build ? coverageStage("build", build.status) : null;

  return <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 text-slate-900">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-widest text-blue-700">Customer setup</p><h1 className="mt-1 text-3xl font-bold">{details.name || "New customer"}</h1><p className="mt-2 text-sm text-slate-600">Save details as you gather them. Each product becomes active only after you confirm it.</p></div>
      <Link href="/agent" className="apex-agent-button-secondary px-4 py-2 text-sm">Back to pipeline</Link>
    </div>
    {error && <div role="alert" className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
    {saved && <div role="status" className="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-900">{saved}</div>}
    {loading ? <p>Loading customer setup...</p> : !setup ? <button type="button" onClick={() => void load()} className="apex-agent-button-secondary px-4 py-2">Retry</button> : <>
      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-slate-200 bg-white p-4"><h2 className="font-semibold">Auto coverage</h2><p className="mt-1 text-sm text-slate-600">{auto ? autoStage === "active" ? "Active customer" : autoStage === "onboarding" ? "In setup" : "Pipeline" : "Not requested"}</p></div>
        <div className="rounded-md border border-slate-200 bg-white p-4"><h2 className="font-semibold">Modified vehicle protection</h2><p className="mt-1 text-sm text-slate-600">{build ? buildStage === "active" ? "Active customer" : buildStage === "onboarding" ? "In setup" : "Pipeline" : "Not requested"}</p></div>
      </section>
      <section className="space-y-4 border-t border-slate-200 pt-5"><h2 className="text-xl font-bold">Customer and mailing address</h2><div className="grid gap-4 sm:grid-cols-2">{field("Customer name", "name", details, update)}{field("Email", "email", details, update, "email")}{field("Phone", "phone", details, update, "tel")}{field("Street address", "addressLine1", details, update)}{field("Address line 2", "addressLine2", details, update)}{field("City", "city", details, update)}{field("State (two letters)", "state", details, update)}{field("ZIP code", "zip", details, update)}</div></section>
      <section className="space-y-4 border-t border-slate-200 pt-5"><h2 className="text-xl font-bold">Vehicle</h2><div className="grid gap-4 sm:grid-cols-2">{field("Year", "year", details, update)}{field("Make", "make", details, update)}{field("Model", "model", details, update)}{field("VIN", "vin", details, update)}</div></section>
      {kind === "auto" && auto && <section className="space-y-4 border-t border-slate-200 pt-5"><h2 className="text-xl font-bold">Auto coverage</h2><div className="grid gap-4 sm:grid-cols-2">{field("Coverage", "coverage", details, update)}{field("Monthly premium", "monthlyPremium", details, update)}</div></section>}
      {kind === "build" && build && <section className="space-y-4 border-t border-slate-200 pt-5"><h2 className="text-xl font-bold">Modified vehicle protection</h2><div className="grid gap-4 sm:grid-cols-2">{field("Tier", "tierInterest", details, update)}{field("Parts value", "partsValue", details, update)}{field("Deductible", "deductible", details, update)}</div></section>}
      <section className="space-y-4 border-t border-slate-200 pt-5"><h2 className="text-xl font-bold">Review and activate</h2><p className="text-sm text-slate-600">Before marking coverage active, verify Apex's applicable binding requirements and the information above. This action does not charge the customer or send documents.</p><label className="flex gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>I have confirmed the applicable requirements with the customer and approve activation.</span></label><div className="flex flex-wrap gap-3">{(kind === "auto" ? autoStage : buildStage) === "onboarding" && <><button type="button" disabled={busy} onClick={() => void submit("save")} className="apex-agent-button-secondary px-4 py-2 text-sm">Save progress</button><button type="button" disabled={busy} onClick={() => void submit("activate")} className="apex-agent-button-primary px-4 py-2 text-sm">Mark {kind === "auto" ? "auto" : "build"} active</button></>}{kind === "auto" && buildStage === "onboarding" && <Link href={`/agent/onboarding/build-${build?.id}`} className="apex-agent-button-secondary px-4 py-2 text-sm">Set up build protection</Link>}{kind === "build" && autoStage === "onboarding" && <Link href={`/agent/onboarding/auto-${auto?.id}`} className="apex-agent-button-secondary px-4 py-2 text-sm">Set up auto coverage</Link>}{(autoStage === "active" || buildStage === "active") && <Link href="/agent/customers" className="apex-agent-button-secondary px-4 py-2 text-sm">Open customers</Link>}</div></section>
    </>}
  </main>;
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ANNUAL_MILEAGE_OPTIONS,
  DEDUCTIBLE_OPTIONS,
  EMPTY_MODIFIED_VEHICLE_QUOTE_INPUT,
  MODIFIED_TIER_OPTIONS,
  MODIFIED_VEHICLE_DISCOUNT_OPTIONS,
} from "@/lib/quotes/options";
import type {
  ModifiedVehicleProtectionQuoteInput,
  SavedQuoteRecord,
} from "@/lib/quotes/types";

type ApiQuoteResponse = {
  ok: boolean;
  quote?: SavedQuoteRecord;
  error?: string;
  missingInformation?: string[];
  warnings?: string[];
};

function cloneDefaultInput(): ModifiedVehicleProtectionQuoteInput {
  return {
    ...EMPTY_MODIFIED_VEHICLE_QUOTE_INPUT,
    vehicle: { ...EMPTY_MODIFIED_VEHICLE_QUOTE_INPUT.vehicle },
    modifications: { ...EMPTY_MODIFIED_VEHICLE_QUOTE_INPUT.modifications },
    coverage: {
      ...EMPTY_MODIFIED_VEHICLE_QUOTE_INPUT.coverage,
      discounts: [],
    },
    underwriting: { ...EMPTY_MODIFIED_VEHICLE_QUOTE_INPUT.underwriting },
  };
}

export default function ModifiedVehicleQuoteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [input, setInput] =
    useState<ModifiedVehicleProtectionQuoteInput>(cloneDefaultInput);
  const [missing, setMissing] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fromQuote = searchParams.get("fromQuote");
    if (!fromQuote) return;

    async function loadQuote() {
      const res = await fetch(`/api/internal/quotes/${fromQuote}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.ok && data.quote?.quoteType === "MODIFIED_VEHICLE_PROTECTION") {
        setInput(data.quote.input);
      }
    }

    loadQuote().catch(() => {
      setError("Could not load the quote for editing.");
    });
  }, [searchParams]);

  function updateRoot(
    field: keyof ModifiedVehicleProtectionQuoteInput,
    value: string
  ) {
    setInput((prev) => ({ ...prev, [field]: value }));
  }

  function updateVehicle(
    field: keyof ModifiedVehicleProtectionQuoteInput["vehicle"],
    value: string
  ) {
    setInput((prev) => ({
      ...prev,
      vehicle: { ...prev.vehicle, [field]: value },
    }));
  }

  function updateModification(
    field: keyof ModifiedVehicleProtectionQuoteInput["modifications"],
    value: string
  ) {
    setInput((prev) => ({
      ...prev,
      modifications: { ...prev.modifications, [field]: value },
    }));
  }

  function updateCoverage(
    field: keyof ModifiedVehicleProtectionQuoteInput["coverage"],
    value: string
  ) {
    setInput((prev) => ({
      ...prev,
      coverage: { ...prev.coverage, [field]: value },
    }));
  }

  function updateUnderwriting(
    field: keyof ModifiedVehicleProtectionQuoteInput["underwriting"],
    value: string
  ) {
    setInput((prev) => ({
      ...prev,
      underwriting: { ...prev.underwriting, [field]: value },
    }));
  }

  function toggleDiscount(discount: string) {
    setInput((prev) => ({
      ...prev,
      coverage: {
        ...prev.coverage,
        discounts: prev.coverage.discounts.includes(discount)
          ? prev.coverage.discounts.filter((item) => item !== discount)
          : [...prev.coverage.discounts, discount],
      },
    }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMissing([]);
    setWarnings([]);

    try {
      const res = await fetch("/api/internal/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteType: "MODIFIED_VEHICLE_PROTECTION",
          input,
        }),
      });
      const data: ApiQuoteResponse = await res.json();

      if (!data.ok) {
        setMissing(data.missingInformation || []);
        setWarnings(data.warnings || []);
        throw new Error(data.error || "Could not generate quote.");
      }

      router.push(`/agent/quotes/${data.quote?.quoteId}`);
    } catch (err: any) {
      setError(err.message || "Could not generate quote.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="apex-agent-shell">
      <form onSubmit={submit} className="apex-agent-container max-w-6xl">
        <header className="apex-agent-hero apex-agent-hero-compact mb-6">
          <Link href="/agent/quotes" className="text-sm font-bold text-blue-200 hover:text-white">
            Back to Quote Dashboard
          </Link>
          <h1 className="apex-agent-title mt-3">
            New Modified Vehicle Protection Quote
          </h1>
          <p className="apex-agent-subtitle mt-2 text-sm">
            Capture build, risk, documentation, and coverage details separately from auto coverage.
          </p>
        </header>

        <ErrorPanel error={error} missing={missing} warnings={warnings} />

        <section className="apex-agent-card-light p-5">
          <SectionTitle title="Customer / Driver" />
          <div className="grid gap-4 md:grid-cols-3">
            <TextField label="Customer Name" value={input.customerName} onChange={(value) => updateRoot("customerName", value)} />
            <TextField label="Customer Email" type="email" value={input.customerEmail} onChange={(value) => updateRoot("customerEmail", value)} />
            <TextField label="Customer Phone" value={input.customerPhone} onChange={(value) => updateRoot("customerPhone", value)} />
            <TextField label="ZIP Code*" value={input.zip} onChange={(value) => updateRoot("zip", value)} />
            <TextField label="Date of Birth" type="date" value={input.dob} onChange={(value) => updateRoot("dob", value)} />
            <TextField label="Age if DOB is not entered" type="number" value={input.age} onChange={(value) => updateRoot("age", value)} />
            <SelectField label="Gender*" value={input.gender} options={["", "Male", "Female"]} onChange={(value) => updateRoot("gender", value)} />
            <TextField label="Driving History*" value={input.drivingHistory} placeholder="Clean, accident, tickets..." onChange={(value) => updateRoot("drivingHistory", value)} />
            <SelectField label="Claim History*" value={input.claimHistory} options={["", "None", "Unknown", "Prior claim(s)"]} onChange={(value) => updateRoot("claimHistory", value)} />
            <SelectField label="Annual Mileage*" value={input.annualMileage} options={["", ...ANNUAL_MILEAGE_OPTIONS]} onChange={(value) => updateRoot("annualMileage", value)} />
          </div>
        </section>

        <section className="apex-agent-card-light mt-5 p-5">
          <SectionTitle title="Vehicle" />
          <div className="grid gap-4 md:grid-cols-4">
            <TextField label="Year*" type="number" value={input.vehicle.year} onChange={(value) => updateVehicle("year", value)} />
            <TextField label="Make*" value={input.vehicle.make} onChange={(value) => updateVehicle("make", value)} />
            <TextField label="Model*" value={input.vehicle.model} onChange={(value) => updateVehicle("model", value)} />
            <TextField label="Trim" value={input.vehicle.trim} onChange={(value) => updateVehicle("trim", value)} />
            <TextField label="Vehicle Mileage*" type="number" value={input.vehicle.vehicleMileage} onChange={(value) => updateVehicle("vehicleMileage", value)} />
            <SelectField label="Title Status*" value={input.vehicle.titleStatus} options={["", "Clean", "Rebuilt", "Salvage", "Unknown"]} onChange={(value) => updateVehicle("titleStatus", value)} />
            <SelectField label="Garage-Kept*" value={input.vehicle.garageKept} options={["", "Yes", "No"]} onChange={(value) => updateVehicle("garageKept", value)} />
          </div>
        </section>

        <section className="apex-agent-card-light mt-5 p-5">
          <SectionTitle title="Modifications / Parts" />
          <div className="grid gap-4 md:grid-cols-3">
            <TextField label="Parts Value*" type="number" value={input.modifications.partsValue} onChange={(value) => updateModification("partsValue", value)} />
            <TextField label="Labor Value" type="number" value={input.modifications.laborValue} onChange={(value) => updateModification("laborValue", value)} />
            {input.modifications.laborValue && (
              <SelectField label="Include Labor in Covered Value?*" value={input.modifications.includeLaborInCoveredValue} options={["", "Yes", "No", "Unknown"]} onChange={(value) => updateModification("includeLaborInCoveredValue", value)} />
            )}
            <SelectField label="Install Type*" value={input.modifications.installType} options={["", "Professional shop", "DIY", "Mixed professional and DIY", "Unknown"]} onChange={(value) => updateModification("installType", value)} />
            <SelectField label="Tune Required*" value={input.modifications.tuneRequired} options={["", "Yes", "No"]} onChange={(value) => updateModification("tuneRequired", value)} />
            <SelectField label="Safety-Related Mods Present" value={input.modifications.safetyRelatedModsPresent} options={["", "Yes", "No", "Unknown"]} onChange={(value) => updateModification("safetyRelatedModsPresent", value)} />
            <SelectField label="Performance Mods Present" value={input.modifications.performanceModsPresent} options={["", "Yes", "No", "Unknown"]} onChange={(value) => updateModification("performanceModsPresent", value)} />
          </div>
          <label className="mt-4 block text-sm">
            <span className="font-medium text-slate-700">Parts List</span>
            <textarea
              rows={5}
              className="apex-agent-input mt-1 px-3 py-2"
              value={input.modifications.partsList}
              onChange={(event) => updateModification("partsList", event.target.value)}
              placeholder="Coilovers, wheels, intake, exhaust, tune..."
            />
          </label>
        </section>

        <section className="apex-agent-card-light mt-5 p-5">
          <SectionTitle title="Coverage Selection" />
          <div className="grid gap-4 md:grid-cols-3">
            <SelectField label="Deductible*" value={input.coverage.deductible} options={["", ...DEDUCTIBLE_OPTIONS]} onChange={(value) => updateCoverage("deductible", value)} />
            <SelectField label="Requested Tier" value={input.coverage.requestedTier} options={MODIFIED_TIER_OPTIONS} onChange={(value) => updateCoverage("requestedTier", value)} />
            <SelectField label="Apply Discounts Now?*" value={input.coverage.applyDiscounts} options={["", "Yes", "No"]} onChange={(value) => updateCoverage("applyDiscounts", value)} />
          </div>

          {input.coverage.applyDiscounts === "Yes" && (
            <Checklist
              title="Discounts"
              options={MODIFIED_VEHICLE_DISCOUNT_OPTIONS}
              selected={input.coverage.discounts}
              onToggle={toggleDiscount}
            />
          )}
        </section>

        <section className="apex-agent-card-light mt-5 p-5">
          <SectionTitle title="Underwriting Questions" />
          <div className="grid gap-4 md:grid-cols-3">
            <SelectField label="VIN Available?" value={input.underwriting.vinAvailable} options={["", "Yes", "No"]} onChange={(value) => updateUnderwriting("vinAvailable", value)} />
            <SelectField label="Receipts Available?" value={input.underwriting.receiptsAvailable} options={["", "Yes", "No"]} onChange={(value) => updateUnderwriting("receiptsAvailable", value)} />
            <SelectField label="Photos Available?" value={input.underwriting.photosAvailable} options={["", "Yes", "No"]} onChange={(value) => updateUnderwriting("photosAvailable", value)} />
            <SelectField label="Tune Documentation Available?" value={input.underwriting.tuneDocumentationAvailable} options={["", "Yes", "No", "N/A"]} onChange={(value) => updateUnderwriting("tuneDocumentationAvailable", value)} />
            <SelectField label="Shop Invoices Available?" value={input.underwriting.shopInvoicesAvailable} options={["", "Yes", "No", "N/A"]} onChange={(value) => updateUnderwriting("shopInvoicesAvailable", value)} />
            <SelectField label="Rebuilt/Salvage Documentation?" value={input.underwriting.rebuiltSalvageDocumentationAvailable} options={["", "Yes", "No", "N/A"]} onChange={(value) => updateUnderwriting("rebuiltSalvageDocumentationAvailable", value)} />
            <SelectField label="Racing/Track/Drift Use?" value={input.underwriting.racingTrackDriftUse} options={["", "Yes", "No"]} onChange={(value) => updateUnderwriting("racingTrackDriftUse", value)} />
          </div>

          <label className="mt-4 block text-sm">
            <span className="font-medium text-slate-700">Other / Notes</span>
            <textarea
              rows={4}
              className="apex-agent-input mt-1 px-3 py-2"
              value={input.notes}
              onChange={(event) => updateRoot("notes", event.target.value)}
            />
          </label>
        </section>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link href="/agent/quotes" className="apex-agent-button-secondary px-4 py-2 text-center text-sm">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="apex-agent-button-primary px-5 py-2 text-sm disabled:opacity-60"
          >
            {loading ? "Generating..." : "Generate Quote"}
          </button>
        </div>
      </form>
    </main>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="mb-4 text-lg font-semibold">{title}</h2>;
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        className="apex-agent-input mt-1 px-3 py-2"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField({
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
    <label className="block text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <select
        className="apex-agent-input mt-1 px-3 py-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option || "empty"} value={option}>
            {option || "Select"}
          </option>
        ))}
      </select>
    </label>
  );
}

function Checklist({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="mt-4">
      <div className="mb-2 text-sm font-medium text-slate-700">{title}</div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => (
          <label
            key={option}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-blue-50"
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onToggle(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function ErrorPanel({
  error,
  missing,
  warnings,
}: {
  error: string;
  missing: string[];
  warnings: string[];
}) {
  if (!error && missing.length === 0 && warnings.length === 0) return null;

  return (
    <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      {error && <p className="font-semibold">{error}</p>}
      {missing.length > 0 && (
        <div className="mt-2">
          <p className="font-semibold">Additional information required:</p>
          <ul className="mt-1 list-disc pl-5">
            {missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="mt-2">
          <p className="font-semibold">Warnings:</p>
          <ul className="mt-1 list-disc pl-5">
            {warnings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

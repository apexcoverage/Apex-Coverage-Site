"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { readJsonResponse } from "@/lib/quotes/apiClient";
import {
  AUTO_DEDUCTIBLE_OPTIONS,
  AUTO_DISCOUNT_OPTIONS,
  AUTO_LIABILITY_LIMIT_OPTIONS,
  EMPTY_AUTO_INCIDENT,
  EMPTY_AUTO_QUOTE_INPUT,
  EMPTY_AUTO_VEHICLE,
} from "@/lib/quotes/options";
import type {
  AutoDrivingIncidentInput,
  AutoInsuranceQuoteInput,
  AutoQuoteVehicleInput,
  SavedQuoteRecord,
} from "@/lib/quotes/types";

type ApiQuoteResponse = {
  ok: boolean;
  quote?: SavedQuoteRecord;
  error?: string;
  missingInformation?: string[];
  warnings?: string[];
};

function cloneDefaultInput(): AutoInsuranceQuoteInput {
  return {
    ...EMPTY_AUTO_QUOTE_INPUT,
    vehicles: [{ ...EMPTY_AUTO_VEHICLE }],
    incidents: [],
    discounts: [],
  };
}

function normalizeLoadedInput(raw: AutoInsuranceQuoteInput): AutoInsuranceQuoteInput {
  return {
    ...cloneDefaultInput(),
    ...raw,
    incidents: Array.isArray(raw.incidents) ? raw.incidents : [],
    vehicles:
      Array.isArray(raw.vehicles) && raw.vehicles.length > 0
        ? raw.vehicles.map((vehicle) => ({
            ...EMPTY_AUTO_VEHICLE,
            ...vehicle,
            liabilityLimits:
              !vehicle.liabilityLimits || vehicle.liabilityLimits === "Standard limits"
                ? "State minimum"
                : vehicle.liabilityLimits,
          }))
        : [{ ...EMPTY_AUTO_VEHICLE }],
    discounts: Array.isArray(raw.discounts) ? raw.discounts : [],
  };
}

export default function AutoQuoteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [input, setInput] = useState<AutoInsuranceQuoteInput>(cloneDefaultInput);
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
      const data = await readJsonResponse(res);
      if (data.ok && data.quote?.quoteType === "AUTO_INSURANCE") {
        setInput(normalizeLoadedInput(data.quote.input));
      }
    }

    loadQuote().catch(() => {
      setError("Could not load the quote for editing.");
    });
  }, [searchParams]);

  function updateField(field: keyof AutoInsuranceQuoteInput, value: string) {
    setInput((prev) => ({ ...prev, [field]: value }));
  }

  function updateVehicle(
    index: number,
    field: keyof AutoQuoteVehicleInput,
    value: string
  ) {
    setInput((prev) => ({
      ...prev,
      vehicles: prev.vehicles.map((vehicle, vehicleIndex) => {
        if (vehicleIndex !== index) return vehicle;
        const next = { ...vehicle, [field]: value };
        if (field === "coverageType" && value === "Liability Only") {
          next.comprehensiveDeductible = "";
          next.collisionDeductible = "";
        }
        return next;
      }),
    }));
  }

  function updateIncident(
    index: number,
    field: keyof AutoDrivingIncidentInput,
    value: string
  ) {
    setInput((prev) => ({
      ...prev,
      incidents: prev.incidents.map((incident, incidentIndex) =>
        incidentIndex === index ? { ...incident, [field]: value } : incident
      ),
    }));
  }

  function toggleDiscount(discount: string) {
    setInput((prev) => ({
      ...prev,
      discounts: prev.discounts.includes(discount)
        ? prev.discounts.filter((item) => item !== discount)
        : [...prev.discounts, discount],
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
          quoteType: "AUTO_INSURANCE",
          input,
        }),
      });
      const data: ApiQuoteResponse = await readJsonResponse(res);

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
        <PageHeader
          title="New Auto Coverage Quote"
          description="Use the AUTO_V1.0 matrix for liability, full coverage, mileage, incident, deductible, and discount pricing."
        />

        <ErrorPanel error={error} missing={missing} warnings={warnings} />

        <section className="apex-agent-card-light p-5">
          <SectionTitle title="Customer and Driver" />
          <div className="grid gap-4 md:grid-cols-3">
            <TextField label="Customer Name" value={input.customerName} onChange={(value) => updateField("customerName", value)} />
            <TextField label="Customer Email" type="email" value={input.customerEmail} onChange={(value) => updateField("customerEmail", value)} />
            <TextField label="Customer Phone" value={input.customerPhone} onChange={(value) => updateField("customerPhone", value)} />
            <TextField label="ZIP Code*" value={input.zip} onChange={(value) => updateField("zip", value)} />
            <TextField label="Date of Birth" type="date" value={input.dob} onChange={(value) => updateField("dob", value)} />
            <TextField label="Age if DOB is not entered" type="number" value={input.age} onChange={(value) => updateField("age", value)} />
            <SelectField label="Gender*" value={input.gender} options={["", "Male", "Female"]} onChange={(value) => updateField("gender", value)} />
            <SelectField label="Driving Record*" value={input.drivingRecordStatus} options={["", "Clean", "Accident(s)/Ticket(s)"]} onChange={(value) => updateField("drivingRecordStatus", value)} />
          </div>

          {input.drivingRecordStatus === "Accident(s)/Ticket(s)" && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-semibold">Driving Incidents</h3>
                <button
                  type="button"
                  className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                  onClick={() =>
                    setInput((prev) => ({
                      ...prev,
                      incidents: [...prev.incidents, { ...EMPTY_AUTO_INCIDENT }],
                    }))
                  }
                >
                  Add Incident
                </button>
              </div>

              {input.incidents.length === 0 && (
                <p className="text-sm text-slate-600">
                  Add each accident, ticket, DUI, or major violation so the matrix can rate it and flag manual review when needed.
                </p>
              )}

              <div className="space-y-4">
                {input.incidents.map((incident, index) => (
                  <div key={index} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="font-semibold">Incident {index + 1}</h4>
                      <button
                        type="button"
                        className="text-xs font-semibold text-red-700"
                        onClick={() =>
                          setInput((prev) => ({
                            ...prev,
                            incidents: prev.incidents.filter((_, i) => i !== index),
                          }))
                        }
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-5">
                      <SelectField
                        label="Incident Type*"
                        value={incident.incidentType}
                        options={["", "Minor speeding ticket", "Major speeding/reckless violation", "Accident", "DUI / serious major violation", "Other"]}
                        onChange={(value) => updateIncident(index, "incidentType", value)}
                      />
                      <SelectField
                        label="Fault"
                        value={incident.atFault}
                        options={["", "At-fault", "Not-at-fault", "N/A"]}
                        onChange={(value) => updateIncident(index, "atFault", value)}
                      />
                      <TextField label="How Long Ago?*" value={incident.timing} placeholder="Example: 3 years ago" onChange={(value) => updateIncident(index, "timing", value)} />
                      <TextField label="Count" type="number" value={incident.count} onChange={(value) => updateIncident(index, "count", value)} />
                      <TextField label="Details" value={incident.details} onChange={(value) => updateIncident(index, "details", value)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="apex-agent-card-light mt-5 p-5">
          <div className="flex items-center justify-between gap-3">
            <SectionTitle title="Vehicle and Coverage" />
              <button
                type="button"
                className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
              onClick={() =>
                setInput((prev) => ({
                  ...prev,
                  vehicles: [...prev.vehicles, { ...EMPTY_AUTO_VEHICLE }],
                }))
              }
            >
              Add Vehicle
            </button>
          </div>

          <div className="space-y-5">
            {input.vehicles.map((vehicle, index) => (
              <div key={index} className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold">Vehicle {index + 1}</h3>
                  {input.vehicles.length > 1 && (
                    <button
                      type="button"
                      className="text-xs font-semibold text-red-700"
                      onClick={() =>
                        setInput((prev) => ({
                          ...prev,
                          vehicles: prev.vehicles.filter((_, i) => i !== index),
                        }))
                      }
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  <TextField label="Year*" type="number" value={vehicle.year} onChange={(value) => updateVehicle(index, "year", value)} />
                  <TextField label="Make*" value={vehicle.make} onChange={(value) => updateVehicle(index, "make", value)} />
                  <TextField label="Model*" value={vehicle.model} onChange={(value) => updateVehicle(index, "model", value)} />
                  <TextField label="Trim / Engine" value={vehicle.trimEngine} onChange={(value) => updateVehicle(index, "trimEngine", value)} />
                  <SelectField label="Coverage Type*" value={vehicle.coverageType} options={["", "Liability Only", "Full Coverage"]} onChange={(value) => updateVehicle(index, "coverageType", value)} />
                  <SelectField label="Liability Limits*" value={vehicle.liabilityLimits} options={["", ...AUTO_LIABILITY_LIMIT_OPTIONS]} onChange={(value) => updateVehicle(index, "liabilityLimits", value)} />
                  {vehicle.coverageType === "Full Coverage" && (
                    <>
                      <SelectField label="Comp Deductible*" value={vehicle.comprehensiveDeductible} options={["", ...AUTO_DEDUCTIBLE_OPTIONS]} onChange={(value) => updateVehicle(index, "comprehensiveDeductible", value)} />
                      <SelectField label="Collision Deductible*" value={vehicle.collisionDeductible} options={["", ...AUTO_DEDUCTIBLE_OPTIONS]} onChange={(value) => updateVehicle(index, "collisionDeductible", value)} />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="apex-agent-card-light mt-5 p-5">
          <SectionTitle title="Usage, Discounts, and Notes" />
          <div className="grid gap-4 md:grid-cols-3">
            <TextField label="Annual Mileage*" type="number" value={input.annualMileage} onChange={(value) => updateField("annualMileage", value)} />
            <SelectField label="Garaged Overnight" value={input.garagedOvernight} options={["", "Yes", "No"]} onChange={(value) => updateField("garagedOvernight", value)} />
          </div>

          <Checklist
            title="Discounts"
            options={AUTO_DISCOUNT_OPTIONS}
            selected={input.discounts}
            onToggle={toggleDiscount}
          />

          <label className="mt-4 block text-sm">
            <span className="font-medium text-slate-700">Other / Notes</span>
            <textarea
              rows={4}
              className="apex-agent-input mt-1 px-3 py-2"
              value={input.notes}
              onChange={(event) => updateField("notes", event.target.value)}
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

function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="apex-agent-hero apex-agent-hero-compact mb-6">
      <Link href="/agent/quotes" className="text-sm font-bold text-blue-200 hover:text-white">
        Back to Quote Dashboard
      </Link>
      <h1 className="apex-agent-title mt-3">{title}</h1>
      <p className="apex-agent-subtitle mt-2 text-sm">{description}</p>
    </header>
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

import Link from "next/link";
import React from "react";

export const metadata = {
  title: "Protection Tiers | Apex Coverage",
  description:
    "Compare Apex Modified Vehicle Protection tiers for street-driven enthusiast vehicles.",
};

const tiers = [
  {
    name: "Street Tier",
    label: "Mild builds",
    description:
      "For daily-driven enthusiast vehicles with basic upgrades and clean documentation.",
    examples: ["Wheels and tires", "Mild suspension", "Intake and exhaust", "Audio or lighting", "Appearance upgrades"],
  },
  {
    name: "Street+ Tier",
    label: "Deeper street builds",
    description:
      "For vehicles with meaningful performance, appearance, audio, or drivability upgrades that still maintain street use.",
    examples: ["Coilovers", "Brake upgrades", "ECU tune", "Larger audio systems", "Moderate performance packages"],
  },
  {
    name: "Apex Build Tier",
    label: "Higher-value builds",
    description:
      "For higher-value, higher-complexity, or heavily modified vehicles reviewed case by case.",
    examples: ["Forced induction", "Engine or transmission upgrades", "Widebody work", "High-end interior", "Complex multi-system builds"],
  },
];

const coveredCategories = [
  "Performance parts",
  "Suspension and braking",
  "Exterior and wheels",
  "Interior and electronics",
  "Audio and security",
  "Supporting documentation",
];

const examples = [
  "Daily-driven WRX with coilovers, wheels, intake, exhaust, and upgraded brakes",
  "Weekend Mustang GT with supercharger kit, supporting fuel upgrades, and tune",
  "Show-focused Corvette with widebody kit, forged wheels, aero, audio, and lighting",
];

export default function TiersPage() {
  return (
    <main className="min-h-screen bg-[#f4f8ff] text-slate-950">
      <section className="relative isolate overflow-hidden bg-[#031326] text-white">
        <img
          src="/brand/apex-city-build.png"
          alt="Modified performance vehicle at sunset"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#020914] via-[#031326]/88 to-[#031326]/45" />
        <div className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
          <p className="text-xs font-black uppercase tracking-[0.34em] text-blue-300">
            Protection tiers
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black leading-[0.98] tracking-tight md:text-7xl">
            Three starting points. Every build still gets reviewed.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-50/90">
            These tiers help customers understand where their vehicle may fit.
            Final eligibility, pricing, deductible, and covered parts depend on
            the actual vehicle, parts list, documentation, mileage, claim
            history, and risk review.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-5 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,.08)]"
            >
              <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                {tier.label}
              </div>
              <h2 className="mt-3 text-3xl font-black">{tier.name}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{tier.description}</p>
              <div className="mt-6">
                <h3 className="font-black">Common examples</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {tier.examples.map((example) => (
                    <li key={example} className="rounded-xl bg-[#eef6ff] px-3 py-2">
                      {example}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
              What can be reviewed
            </p>
            <h2 className="mt-3 text-3xl font-black md:text-5xl">
              Coverage starts with the parts and records.
            </h2>
            <p className="mt-4 text-slate-600">
              Apex reviews documented parts and upgrades as part of the build
              profile. Approval depends on documentation, installation quality,
              vehicle use, risk, and final terms.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {coveredCategories.map((category) => (
              <div
                key={category}
                className="rounded-2xl border border-slate-200 bg-[#f4f8ff] px-4 py-5 text-sm font-black text-slate-800"
              >
                {category}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,.12)]">
          <div className="grid lg:grid-cols-2">
            <img
              src="/brand/apex-build-review-garage.png"
              alt="Build documentation and performance parts in a garage"
              className="h-full min-h-[360px] w-full object-cover"
            />
            <div className="p-6 md:p-10">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
                Example build profiles
              </p>
              <h2 className="mt-3 text-3xl font-black">
                The tier is a starting point, not a shortcut.
              </h2>
              <div className="mt-6 space-y-3">
                {examples.map((example) => (
                  <div
                    key={example}
                    className="rounded-2xl border border-slate-200 bg-[#f4f8ff] p-4 text-sm leading-6 text-slate-700"
                  >
                    {example}
                  </div>
                ))}
              </div>
              <Link
                href="/build-review"
                className="mt-7 inline-flex rounded-lg bg-blue-600 px-6 py-4 text-sm font-black text-white hover:bg-blue-500"
              >
                Protect My Build
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

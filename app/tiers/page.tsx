import React from "react";

export const metadata = {
  title: "Protection Tiers | Apex Coverage",
  description: "Compare Apex Modified Vehicle Protection tiers for street-driven enthusiast vehicles.",
};

const tiers = [
  {
    name: "Street Tier",
    label: "Mild builds",
    description: "For daily-driven enthusiast vehicles with basic, professionally installed upgrades and clean documentation.",
    examples: ["Wheels and tires", "Suspension refresh or mild lowering", "Intake and exhaust", "Basic audio or lighting", "Appearance upgrades"],
    fit: "Best for customers who want protection without turning the car into a high-risk build.",
  },
  {
    name: "Street+ Tier",
    label: "Deeper street builds",
    description: "For vehicles with more meaningful performance, appearance, audio, or drivability upgrades that still maintain street use.",
    examples: ["Coilovers or air suspension", "Brake upgrades", "ECU tune", "Larger audio systems", "Moderate performance packages"],
    fit: "Best for customers with more money in the build and stronger documentation.",
  },
  {
    name: "Apex Build Tier",
    label: "Higher-value builds",
    description: "For higher-value, higher-complexity, or heavily modified vehicles reviewed case by case.",
    examples: ["Turbo or supercharger kits", "Engine or transmission upgrades", "Widebody or custom body work", "High-end audio/interior", "Complex multi-system builds"],
    fit: "Best for serious enthusiasts who need a custom review instead of a generic option.",
  },
];

export default function TiersPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="relative overflow-hidden border-b">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: "linear-gradient(135deg, rgba(204,0,0,.10), transparent)" }}
        />
        <div className="relative max-w-7xl mx-auto px-4 py-16">
          <span className="text-sm tracking-wide text-[#cc0000] font-semibold">PROTECTION TIERS</span>
          <h1 className="mt-2 text-4xl md:text-5xl font-bold max-w-3xl">
            Three starting points. Every build still gets reviewed.
          </h1>
          <p className="mt-4 text-gray-600 max-w-3xl">
            These tiers help customers understand where their vehicle may fit. Final eligibility, pricing, deductible, and covered parts depend on the actual vehicle, parts list, documentation, mileage, claim history, and risk review.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div key={tier.name} className="border rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="text-sm font-semibold text-[#cc0000]">{tier.label}</div>
              <h2 className="mt-2 text-2xl font-bold">{tier.name}</h2>
              <p className="mt-3 text-sm text-gray-600">{tier.description}</p>
              <div className="mt-5">
                <h3 className="font-semibold">Common examples</h3>
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  {tier.examples.map((example) => (
                    <li key={example}>✔️ {example}</li>
                  ))}
                </ul>
              </div>
              <p className="mt-5 text-sm text-gray-600 border-t pt-4">{tier.fit}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 border-y">
        <div className="max-w-7xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-3xl font-bold">Salvage and rebuilt title review</h2>
            <p className="mt-3 text-gray-600">
              Salvage and rebuilt vehicles may still apply, but they should not be priced like clean-title vehicles. They may require stricter documentation, inspection, a higher deductible, and a higher premium.
            </p>
          </div>
          <div className="bg-white border rounded-2xl p-6">
            <h3 className="font-semibold">Possible extra requirements</h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li>✔️ Photos and repair history</li>
              <li>✔️ Current mileage and title documentation</li>
              <li>✔️ Professional inspection or shop review</li>
              <li>✔️ Higher deductible or surcharge</li>
              <li>✔️ Specific exclusions for prior structural, electrical, or mechanical issues</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="rounded-2xl border bg-[#cc0000]/5 p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold">Not sure which tier fits?</h2>
            <p className="mt-2 text-sm text-gray-600">
              Start the build review. Apex can sort the vehicle into the right tier after reviewing the build, documentation, and deductible preference.
            </p>
          </div>
          <a href="/build-review" className="inline-flex items-center gap-2 bg-[#cc0000] text-white px-5 py-3 rounded-md font-semibold hover:bg-red-700 transition">
            Start Build Review
          </a>
        </div>
      </section>
    </main>
  );
}

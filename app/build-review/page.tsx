import Link from "next/link";
import React from "react";
import BuildReviewForm from "@/components/BuildReviewForm";

export const metadata = {
  title: "Protect My Build | Apex Coverage",
  description:
    "Request an Apex Modified Vehicle Protection review for eligible aftermarket parts, modifications, and street-driven builds.",
};

const benefits = [
  {
    title: "Protect more than stock",
    body:
      "Your wheels, suspension, turbo kit, audio, body work, interior, tune, and other upgrades may represent thousands of dollars beyond factory equipment.",
  },
  {
    title: "Built for real enthusiasts",
    body:
      "Apex reviews the actual vehicle, how it is used, what was added, what it is worth, and what documentation is available.",
  },
  {
    title: "DIY builds can be reviewed",
    body:
      "Shop labor is helpful, but it is not the only path. Receipts, photos, part details, maintenance records, and clear documentation can all support the review.",
  },
];

const process = [
  "Tell us about the vehicle and the parts you want reviewed.",
  "Choose the tier, deductible, and coverage goals you want Apex to consider.",
  "An agent reviews eligibility, documentation, risk, and possible pricing.",
  "If the build qualifies, Apex walks you through the offer before anything starts.",
];

const reviewFactors = [
  "Approximate value of parts",
  "Vehicle year, make, model, VIN, mileage, and title status",
  "How the vehicle is used and stored",
  "Receipts, photos, install details, and maintenance records",
  "Driving history, claim history, deductible preference, and location",
];

export default function BuildReviewPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(204,0,0,.10), transparent, rgba(204,0,0,.08))",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 py-16 grid lg:grid-cols-[1.05fr_.95fr] gap-10 items-start">
          <div>
            <span className="text-sm tracking-wide text-[#cc0000] font-semibold">
              APEX MODIFIED VEHICLE PROTECTION
            </span>
            <h1 className="mt-2 text-4xl md:text-5xl font-bold leading-tight">
              You built more than a car. Protect more than the factory equipment.
            </h1>
            <p className="mt-5 text-lg text-gray-700 max-w-2xl">
              Apex Coverage helps street-driven enthusiasts protect eligible
              aftermarket parts that standard auto coverage may not fully value.
              Start with a free build review so an Apex agent can understand the
              vehicle, the parts, the documentation, and the right protection fit.
            </p>

            <div className="mt-8 grid sm:grid-cols-3 gap-3">
              {benefits.map((item) => (
                <div key={item.title} className="rounded-xl border bg-white/80 p-4 shadow-sm">
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="mt-2 text-sm text-gray-600">{item.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid md:grid-cols-2 gap-5">
              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <h2 className="text-xl font-bold">What does it cost?</h2>
                <p className="mt-3 text-sm text-gray-700">
                  The build review is free. If your vehicle qualifies, your
                  monthly cost is based on the vehicle, parts value, deductible,
                  location, use, driving history, claim history, and available
                  documentation. Lower part values and higher deductibles
                  generally cost less; higher-value or higher-risk builds cost
                  more. You will see the price before choosing to move forward.
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <h2 className="text-xl font-bold">Can my vehicle qualify?</h2>
                <p className="mt-3 text-sm text-gray-700">
                  Any vehicle can be submitted for review. Clean title, rebuilt
                  title, mild build, heavy build, shop-built, DIY, daily driver,
                  weekend car, and show-focused vehicles can all be considered.
                  Final eligibility depends on the review and available program
                  rules.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border bg-gray-50 p-5">
              <h2 className="text-xl font-bold">How the build review works</h2>
              <ol className="mt-4 space-y-3 text-sm text-gray-700">
                {process.map((item, index) => (
                  <li key={item} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#cc0000] text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-8 rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold">What Apex looks at</h2>
              <div className="mt-4 grid sm:grid-cols-2 gap-2 text-sm text-gray-700">
                {reviewFactors.map((item) => (
                  <div key={item} className="rounded-lg bg-gray-50 px-3 py-2">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-6 text-xs text-gray-500 max-w-2xl">
              Submitting a request does not bind coverage or guarantee approval.
              Covered parts, exclusions, deductible, pricing, and final terms are
              determined after review. Want the shorter ad form instead?{" "}
              <Link className="font-semibold text-[#cc0000] underline" href="/protect-more-than-stock">
                Start here
              </Link>
              .
            </p>
          </div>

          <div className="relative lg:sticky lg:top-28">
            <div className="absolute -inset-4 bg-[#cc0000]/10 blur-2xl rounded-3xl" aria-hidden />
            <BuildReviewForm />
          </div>
        </div>
      </section>
    </main>
  );
}

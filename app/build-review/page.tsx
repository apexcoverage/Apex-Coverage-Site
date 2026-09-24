import Link from "next/link";
import React from "react";
import BuildReviewForm from "@/components/BuildReviewForm";

export const metadata = {
  title: "Protect My Build | Apex Coverage",
  description:
    "Request an Apex Modified Vehicle Protection review for eligible aftermarket parts, modifications, and street-driven builds.",
};

const valueProps = [
  "DIY and shop-built vehicles can be reviewed",
  "Clean, rebuilt, salvage, mild, and serious builds can apply",
  "Apex reviews parts value, documentation, mileage, use, and risk",
];

const costCards = [
  {
    title: "The review is free",
    body:
      "Start with the vehicle and parts. If the build qualifies, Apex shows available options before anything starts.",
  },
  {
    title: "Pricing depends on the build",
    body:
      "Vehicle, ZIP code, title status, mileage, parts value, deductible, use, driving history, and documentation all matter.",
  },
  {
    title: "All vehicles can be submitted",
    body:
      "Apex can review daily drivers, weekend builds, show cars, higher-value builds, and vehicles with DIY-installed parts.",
  },
];

const reviewFactors = [
  "Parts list and approximate value",
  "Receipts, photos, invoices, and install notes",
  "Current mileage and annual mileage",
  "Title status and vehicle use",
  "Driving history and claim history",
  "Preferred deductible and tier interest",
];

export default function BuildReviewPage() {
  return (
    <main className="min-h-screen bg-[#f4f8ff] text-slate-950">
      <section className="relative isolate overflow-hidden bg-[#031326] text-white">
        <img
          src="/brand/apex-build-review-garage.png"
          alt="Modified vehicle in a modern garage with build documentation"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#020914] via-[#031326]/90 to-[#031326]/55" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[.95fr_1.05fr] lg:items-start lg:py-20">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.34em] text-blue-300">
              Apex Modified Vehicle Protection
            </p>
            <h1 className="mt-4 text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
              You built more than a car.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-50/90">
              Protect more than the factory equipment. Apex reviews eligible
              aftermarket parts, documentation, vehicle use, and risk so an
              agent can help you find a realistic path forward.
            </p>

            <div className="mt-8 grid gap-3">
              {valueProps.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold backdrop-blur"
                >
                  {item}
                </div>
              ))}
            </div>

            <p className="mt-6 text-sm text-blue-50/75">
              Looking for the shorter ad form instead?{" "}
              <Link className="font-black text-blue-300 underline" href="/protect-more-than-stock">
                Start here
              </Link>
              .
            </p>
          </div>

          <div className="relative lg:sticky lg:top-28">
            <BuildReviewForm />
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <div className="grid gap-5 md:grid-cols-3">
            {costCards.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,.08)]"
              >
                <h2 className="text-xl font-black">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#04152a] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-300">
              What Apex looks at
            </p>
            <h2 className="mt-3 text-3xl font-black md:text-5xl">
              Better documents create a cleaner review.
            </h2>
            <p className="mt-5 text-blue-50/75">
              Missing paperwork does not always end the conversation, but good
              documentation helps Apex understand the build faster and more
              accurately.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {reviewFactors.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-blue-400/20 bg-white/[0.06] px-4 py-4 text-sm font-bold backdrop-blur"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

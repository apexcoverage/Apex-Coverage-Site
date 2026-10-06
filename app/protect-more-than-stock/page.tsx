import Link from "next/link";
import React from "react";
import AdLeadForm from "@/components/AdLeadForm";

export const metadata = {
  title: "Protect More Than Stock | Apex Coverage",
  description:
    "Apex Coverage helps drivers protect eligible aftermarket parts, DIY builds, and modified vehicles with a simple build-focused review.",
};

const heroPoints = [
  "Aftermarket parts can be reviewed for protection",
  "DIY and shop-built vehicles can both be considered",
  "Plans can start as low as $15/month",
];

const buildTiers = [
  {
    name: "Street Tier",
    label: "Mild street builds",
    body:
      "For daily-driven cars with documented upgrades that make the vehicle feel like yours without turning it into a full build project.",
    examples: ["Wheels and tires", "Mild suspension", "Intake and exhaust", "Lighting or appearance upgrades"],
  },
  {
    name: "Street+ Tier",
    label: "Deeper enthusiast builds",
    body:
      "For cars with more meaningful performance, appearance, audio, or drivability upgrades that deserve a closer review.",
    examples: ["Coilovers", "Brake upgrades", "ECU tune", "Larger audio systems"],
  },
  {
    name: "Apex Build Tier",
    label: "Higher-value custom builds",
    body:
      "For higher-value, higher-complexity, or heavily modified vehicles where the build itself needs a more detailed look.",
    examples: ["Forced induction", "Engine or transmission upgrades", "Widebody work", "Complex multi-system builds"],
  },
];

const coverageExamples = [
  "Performance parts",
  "Suspension and braking",
  "Exterior and wheels",
  "Interior and electronics",
  "Audio and security",
  "Documented DIY upgrades",
];

const pricingFactors = [
  "Vehicle year, make, model, mileage, and title status",
  "Total documented parts value and build complexity",
  "Selected deductible and protection tier",
  "Driving use, annual mileage, storage, and claim history",
];

const processSteps = [
  {
    step: "1",
    title: "Tell us about your build",
    body:
      "Start with the basics: your vehicle, ZIP code, contact info, and a rough idea of the parts value.",
  },
  {
    step: "2",
    title: "Apex reviews the modifications",
    body:
      "A real agent looks at the build, asks for the right documentation, and explains what can be considered.",
  },
  {
    step: "3",
    title: "Get protection built around your car",
    body:
      "You review the path forward, ask questions, and decide whether the protection makes sense for the vehicle.",
  },
];

const trustItems = [
  "Human follow-up from an Apex agent",
  "Clear documentation guidance",
  "DIY and shop-built vehicles can be reviewed",
  "Traditional auto coverage is available as a separate option",
];

export default function ProtectMoreThanStockPage() {
  return (
    <main className="min-h-screen bg-[#f4f8ff] text-slate-950">
      <section className="relative isolate overflow-hidden bg-[#031326] text-white">
        <img
          src="/brand/apex-hero-road.png"
          alt="Blue modified performance car driving at dusk"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#020914] via-[#031326]/90 to-[#031326]/38" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-36 bg-gradient-to-t from-[#031326] to-transparent" />

        <div className="mx-auto max-w-7xl px-4 py-16 lg:py-24">
          <div className="max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.34em] text-blue-300">
              Modified vehicle protection
            </p>
            <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
              You built more than a car. Protect more than stock.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-50/90">
              Apex Coverage protects eligible aftermarket parts that traditional
              auto coverage may not fully value. Built for daily drivers,
              weekend cars, DIY builds, and enthusiast vehicles that deserve a
              closer look.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#start-quote"
                className="inline-flex justify-center rounded-lg bg-blue-600 px-6 py-4 text-sm font-black text-white shadow-[0_18px_45px_rgba(37,99,235,.35)] hover:bg-blue-500"
              >
                See If My Build Qualifies
              </a>
              <Link
                href="/build-review"
                className="inline-flex justify-center rounded-lg border border-white/25 bg-white/10 px-6 py-4 text-sm font-black text-white backdrop-blur hover:bg-white/15"
              >
                Protect My Build
              </Link>
            </div>

            <div className="mt-9 grid gap-3 md:grid-cols-3">
              {heroPoints.map((point) => (
                <div
                  key={point}
                  className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 text-sm font-black text-blue-50 backdrop-blur"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#031326] text-white">
        <div className="mx-auto max-w-7xl px-4 pb-16">
          <div className="rounded-3xl border border-blue-400/25 bg-white/[0.07] p-6 shadow-2xl backdrop-blur md:p-8">
            <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-300">
                  Built different. Covered different.
                </p>
                <h2 className="mt-3 text-3xl font-black md:text-5xl">
                  Your build should feel recognizable on the page.
                </h2>
              </div>
              <p className="text-base leading-7 text-blue-50/80">
                Apex does not treat every modified car like the same generic
                sedan. These are the real Apex tier starting points already used
                on the site. Final fit depends on the vehicle, documentation,
                parts value, deductible, and review.
              </p>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {buildTiers.map((tier) => (
                <article
                  key={tier.name}
                  className="rounded-2xl border border-blue-300/20 bg-[#061d39]/80 p-5"
                >
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">
                    {tier.label}
                  </div>
                  <h3 className="mt-3 text-2xl font-black">{tier.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-blue-50/78">
                    {tier.body}
                  </p>
                  <div className="mt-5 grid gap-2">
                    {tier.examples.map((example) => (
                      <div
                        key={example}
                        className="rounded-xl bg-blue-500/14 px-3 py-2 text-sm font-bold text-blue-50"
                      >
                        {example}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
              What happens when something breaks?
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight md:text-5xl">
              Protection is easier to trust when you can picture the claim.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600">
              Say a Mustang has a documented supercharger package, supporting
              fuel upgrades, and related parts worth about $9,000. With Apex,
              those approved modifications can be reviewed as part of the build
              profile instead of being treated like invisible extras.
            </p>
            <p className="mt-4 text-sm leading-6 text-slate-500">
              Coverage, eligibility, valuation, deductibles, exclusions, and
              claim handling are controlled by the final policy terms. Apex will
              not promise a payout before the vehicle, documents, and claim are
              reviewed.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-[#f4f8ff] shadow-[0_24px_70px_rgba(15,23,42,.12)]">
            <img
              src="/brand/apex-city-build.png"
              alt="Modified performance car overlooking a city"
              className="h-72 w-full object-cover"
            />
            <div className="p-6 md:p-8">
              <h3 className="text-xl font-black">What can be reviewed?</h3>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {coverageExamples.map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f4f8ff]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 lg:grid-cols-[1fr_1fr] lg:items-start">
          <div className="rounded-3xl bg-[#031326] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,.18)] md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-300">
              Pricing clarity
            </p>
            <h2 className="mt-3 text-3xl font-black md:text-5xl">
              Plans can start as low as $15/month.
            </h2>
            <p className="mt-5 text-base leading-7 text-blue-50/82">
              Final pricing depends on the actual build. Think of the starting
              point as a low-friction way to begin the conversation, then Apex
              reviews the vehicle and parts before giving guidance.
            </p>
            <div className="mt-7 grid gap-3">
              {pricingFactors.map((factor) => (
                <div
                  key={factor}
                  className="rounded-2xl border border-blue-300/20 bg-white/[0.08] px-4 py-3 text-sm font-bold text-blue-50"
                >
                  {factor}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,.08)] md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
              Trust before the form
            </p>
            <h2 className="mt-3 text-3xl font-black md:text-5xl">
              You should know what happens after you submit.
            </h2>
            <div className="mt-7 grid gap-4">
              {trustItems.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl bg-[#eef6ff] px-4 py-4 text-sm font-black text-slate-800"
                >
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm leading-6 text-slate-600">
              Apex may ask for photos, receipts, VIN, mileage, installed parts
              details, and other documentation before anything can be finalized.
              The goal is to make the review clear instead of making you guess.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
              Simple process. Real guidance.
            </p>
            <h2 className="mt-3 text-3xl font-black md:text-5xl">
              How Apex gets from interest to options.
            </h2>
          </div>

          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {processSteps.map((item) => (
              <article
                key={item.step}
                className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-[0_18px_50px_rgba(15,23,42,.08)]"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-xl font-black text-white shadow-lg shadow-blue-600/25">
                  {item.step}
                </div>
                <h3 className="mt-5 text-xl font-black">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="start-quote" className="relative isolate overflow-hidden bg-[#031326] text-white">
        <img
          src="/brand/apex-build-review-garage.png"
          alt="Build documentation and performance parts in a garage"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#020914] via-[#031326]/92 to-[#031326]/62" />

        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-300">
              Start the conversation
            </p>
            <h2 className="mt-3 text-4xl font-black leading-tight md:text-6xl">
              Tell us what you drive. Apex will tell you what comes next.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-blue-50/85">
              Use the quick form if you want an Apex agent to reach out. Keep it
              flexible and tell us whether you want modified vehicle protection,
              standard auto coverage, or both.
            </p>

            <div className="mt-8 rounded-3xl border border-blue-300/20 bg-white/[0.08] p-5 backdrop-blur">
              <h3 className="text-lg font-black">Ready for a full build review?</h3>
              <p className="mt-2 text-sm leading-6 text-blue-50/80">
                If you already have your parts list, photos, receipts, and build
                details ready, skip the short lead form and go straight to the
                full review.
              </p>
              <Link
                href="/build-review"
                className="mt-5 inline-flex rounded-lg bg-blue-600 px-6 py-4 text-sm font-black text-white hover:bg-blue-500"
              >
                Protect My Build
              </Link>
            </div>
          </div>

          <AdLeadForm />
        </div>
      </section>
    </main>
  );
}

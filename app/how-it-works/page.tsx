import Link from "next/link";
import React from "react";

export const metadata = {
  title: "How It Works | Apex Coverage",
  description:
    "How Apex Modified Vehicle Protection reviews modified street-driven vehicles.",
};

const steps = [
  {
    title: "Start with the vehicle",
    body: "Apex reviews the year, make, model, VIN, mileage, ZIP code, title status, annual mileage, and how the vehicle is used.",
  },
  {
    title: "Document the build",
    body: "Customers provide parts lists, receipts, photos, mileage at installation, and installer details. Better documentation creates a cleaner review.",
  },
  {
    title: "Review the risk",
    body: "Apex looks at vehicle value, part value, driving history, claim history, modification level, annual mileage, title status, and deductible preference.",
  },
  {
    title: "Choose the right fit",
    body: "Eligible customers are matched with a tier and deductible structure that fits the build and the documentation available.",
  },
  {
    title: "Upload documents with an agent",
    body: "During a live call, an Apex agent can send a document upload link so customers can upload records while the conversation is happening.",
  },
  {
    title: "Keep records current",
    body: "As new parts are added, customers should keep receipts, photos, installer invoices, and mileage records updated.",
  },
];

const checklist = [
  "VIN, year, make, model, and trim",
  "Current mileage and mileage at install",
  "ZIP code and regular garaging area",
  "Annual mileage and vehicle use",
  "Receipts and invoices",
  "Photos of installed parts",
  "Installer or shop details",
  "Parts list and estimated parts value",
  "Driving history and claim history",
  "Preferred deductible",
];

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-[#f4f8ff] text-slate-950">
      <section className="relative isolate overflow-hidden bg-[#031326] text-white">
        <img
          src="/brand/apex-build-review-garage.png"
          alt="Modified vehicle documentation in a modern garage"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#020914] via-[#031326]/88 to-[#031326]/55" />
        <div className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
          <p className="text-xs font-black uppercase tracking-[0.34em] text-blue-300">
            How it works
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black leading-[0.98] tracking-tight md:text-7xl">
            A cleaner process for modified street cars.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-50/90">
            Apex Modified Vehicle Protection is built around documentation and
            risk review. Two cars with the same year, make, and model can have
            completely different profiles once the parts and use are reviewed.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/build-review"
              className="rounded-lg bg-blue-600 px-6 py-4 text-center text-sm font-black text-white hover:bg-blue-500"
            >
              Protect My Build
            </Link>
            <Link
              href="/tiers"
              className="rounded-lg border border-white/25 bg-white/10 px-6 py-4 text-center text-sm font-black text-white backdrop-blur hover:bg-white/15"
            >
              Compare Tiers
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-5 lg:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,.08)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-lg font-black text-white">
                {index + 1}
              </div>
              <h2 className="mt-5 text-xl font-black">{step.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-2 md:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
              Bring this to the call
            </p>
            <h2 className="mt-3 text-3xl font-black md:text-5xl">
              The stronger the records, the faster the review.
            </h2>
            <p className="mt-4 text-slate-600">
              Missing information does not always mean a customer is rejected,
              but it can affect eligibility, pricing, deductible, and exclusions.
            </p>
            <Link
              href="/document-upload"
              className="mt-6 inline-flex rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-black hover:bg-slate-50"
            >
              Upload Documents With an Agent
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {checklist.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-[#f4f8ff] px-4 py-4 text-sm font-bold text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#04152a] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-black">Important coverage clarity</h2>
            <p className="mt-4 leading-7 text-blue-50/75">
              Apex Modified Vehicle Protection is not a blanket promise that
              every part, vehicle, incident, or repair will be covered.
              Protection depends on review, approval, documentation, final
              terms, deductibles, exclusions, and keeping the build profile current.
            </p>
          </div>
          <div className="rounded-3xl border border-white/15 bg-white/[0.06] p-6">
            <h3 className="font-black">Helpful links</h3>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold">
              <Link href="/legal" className="underline hover:text-white">
                Legal Clarity
              </Link>
              <Link href="/privacy" className="underline hover:text-white">
                Privacy
              </Link>
              <Link href="/terms" className="underline hover:text-white">
                Terms
              </Link>
              <Link href="/status" className="underline hover:text-white">
                Check Status
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

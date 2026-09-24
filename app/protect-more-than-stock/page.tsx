import Link from "next/link";
import React from "react";
import AdLeadForm from "@/components/AdLeadForm";

export const metadata = {
  title: "Protect More Than Stock | Apex Coverage",
  description:
    "A simple Apex Coverage landing page for drivers who want eligible aftermarket parts reviewed for protection.",
};

const points = [
  "Aftermarket parts can be reviewed for protection",
  "DIY and shop-built vehicles can both be considered",
  "A real Apex agent follows up and explains the next step",
];

const trustItems = [
  "No pressure",
  "No spam",
  "Human support",
  "Build friendly",
];

export default function ProtectMoreThanStockPage() {
  return (
    <main className="min-h-screen bg-[#031326] text-white">
      <section className="relative isolate overflow-hidden">
        <img
          src="/brand/apex-hero-road.png"
          alt="Blue modified performance car driving at dusk"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#020914] via-[#031326]/88 to-[#031326]/45" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-20">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.34em] text-blue-300">
              Modified vehicle protection
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
              You built more than a car. Protect more than stock.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-50/90">
              Apex Coverage protects eligible aftermarket parts that traditional
              auto coverage may not fully value. Tell us what you drive, what
              you added, and how to reach you.
            </p>

            <div className="mt-8 grid gap-3">
              {points.map((point) => (
                <div
                  key={point}
                  className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold backdrop-blur"
                >
                  {point}
                </div>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {trustItems.map((item) => (
                <div
                  key={item}
                  className="rounded-xl bg-blue-600/20 px-3 py-3 text-center text-xs font-black text-blue-100"
                >
                  {item}
                </div>
              ))}
            </div>

            <p className="mt-6 text-sm text-blue-50/75">
              Ready for the full review?{" "}
              <Link href="/build-review" className="font-black text-blue-300 underline">
                Protect My Build
              </Link>
              .
            </p>
          </div>

          <AdLeadForm />
        </div>
      </section>
    </main>
  );
}

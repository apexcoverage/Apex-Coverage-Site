import Link from "next/link";
import React from "react";
import AdLeadForm from "@/components/AdLeadForm";

export const metadata = {
  title: "Protect More Than Stock | Apex Coverage",
  description:
    "A simple Apex Coverage landing page for drivers who want eligible aftermarket parts reviewed for protection.",
};

const points = [
  "Wheels, suspension, power adders, audio, body work, lighting, interior, and more can be reviewed.",
  "DIY and shop-built vehicles can both be considered.",
  "The review is free, and an Apex agent will explain available options before anything starts.",
];

export default function ProtectMoreThanStockPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(204,0,0,.12), rgba(255,255,255,.95) 42%, rgba(0,0,0,.06))",
          }}
        />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <div className="inline-flex rounded-full bg-[#cc0000]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#cc0000]">
              Modified Vehicle Protection
            </div>

            <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
              You built more than a car. Protect more than the factory equipment.
            </h1>

            <p className="mt-5 max-w-2xl text-lg text-gray-700">
              Apex Coverage protects eligible aftermarket parts that traditional
              auto coverage may not fully value. Tell us what you drive, what
              you added, and how to reach you.
            </p>

            <div className="mt-8 grid gap-3">
              {points.map((point) => (
                <div key={point} className="rounded-xl border bg-white/80 p-4 text-sm text-gray-700 shadow-sm">
                  {point}
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl bg-black p-5 text-white">
              <h2 className="text-xl font-bold">What happens next?</h2>
              <p className="mt-2 text-sm text-gray-300">
                An Apex agent contacts you, confirms the build details, and
                helps decide whether you should complete the full build review.
                No long form. No pressure.
              </p>
            </div>

            <p className="mt-5 text-xs text-gray-500">
              Already ready for the full review?{" "}
              <Link href="/build-review" className="font-semibold text-[#cc0000] underline">
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

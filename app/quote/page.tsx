import Link from "next/link";
import React from "react";
import QuoteForm from "@/components/QuoteForm";

export const metadata = {
  title: "Auto Coverage Review | Apex Coverage",
  description: "Request an auto coverage review from Apex Coverage.",
};

const benefits = [
  "No obligation",
  "Clear guidance before you buy",
  "Real human follow-up",
  "Build review available if your vehicle is modified",
];

export default function QuotePage() {
  return (
    <main className="min-h-screen bg-[#f4f8ff] text-slate-950">
      <section className="relative isolate overflow-hidden bg-[#031326] text-white">
        <img
          src="/brand/apex-city-build.png"
          alt="Modified vehicle overlooking a city"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#020914] via-[#031326]/88 to-[#031326]/50" />

        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 md:items-start lg:py-20">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.34em] text-blue-300">
              Auto coverage review
            </p>
            <h1 className="mt-4 text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
              Coverage for the way you actually drive.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-50/90">
              Fill out a few details and an Apex agent will follow up with
              available coverage options. If your vehicle is modified, we can
              also help you start a build review.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {benefits.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold backdrop-blur"
                >
                  {item}
                </div>
              ))}
            </div>
            <Link
              href="/build-review"
              className="mt-8 inline-flex rounded-lg border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur hover:bg-white/15"
            >
              Looking for Modified Vehicle Protection?
            </Link>
          </div>

          <div className="relative">
            <QuoteForm />
          </div>
        </div>
      </section>
    </main>
  );
}

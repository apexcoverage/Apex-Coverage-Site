import React from "react";
import ClaimForm from "@/components/ClaimForm";

export const metadata = {
  title: "File a Claim | Apex Coverage",
  description: "Report a claim to Apex Coverage.",
};

const support = [
  "Quick intake",
  "Human help when you need it",
  "Support for build and auto coverage customers",
];

export default function ClaimsPage() {
  return (
    <main className="min-h-screen bg-[#f4f8ff] text-slate-950">
      <section className="relative isolate overflow-hidden bg-[#031326] text-white">
        <img
          src="/brand/apex-build-review-garage.png"
          alt="Modified vehicle in a modern garage"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#020914] via-[#031326]/88 to-[#031326]/55" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 md:items-start lg:py-20">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.34em] text-blue-300">
              Claims support
            </p>
            <h1 className="mt-4 text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
              File a claim with Apex.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-50/90">
              Tell us what happened. Apex will guide you through next steps and
              help coordinate the resolution.
            </p>
            <div className="mt-8 grid gap-3">
              {support.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold backdrop-blur"
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-blue-50/90 backdrop-blur">
              <b>Emergency?</b> Call{" "}
              <a className="font-black underline" href="tel:+18443982739">
                844-398-2739
              </a>.
            </div>
          </div>

          <div className="relative">
            <ClaimForm />
          </div>
        </div>
      </section>
    </main>
  );
}

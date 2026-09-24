import Link from "next/link";
import React from "react";

export const metadata = {
  title: "About | Apex Coverage",
  description:
    "Apex Coverage helps drivers document, review, and protect modified vehicles with human support and clear coverage guidance.",
  openGraph: {
    title: "About Apex Coverage",
    description:
      "A modern coverage company built for people who love what they drive.",
    url: "https://www.driveapexcoverage.com/about",
    siteName: "Apex Coverage",
  },
};

const values = [
  { t: "Clarity over jargon", d: "Plain-English coverage guidance before you buy." },
  { t: "Build-first review", d: "Your parts, records, mileage, title, and use all matter." },
  { t: "Human support", d: "Agents who can walk through the build with you." },
  { t: "Privacy by default", d: "Your data is respected. We do not sell your information." },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f4f8ff] text-slate-950">
      <section className="relative isolate overflow-hidden bg-[#031326] text-white">
        <img
          src="/brand/apex-city-build.png"
          alt="Modified vehicle with city skyline"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#020914] via-[#031326]/88 to-[#031326]/55" />
        <div className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
          <p className="text-xs font-black uppercase tracking-[0.34em] text-blue-300">
            About Apex Coverage
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black leading-[0.98] tracking-tight md:text-7xl">
            Coverage for people who love what they drive.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-50/90">
            Apex Coverage gives enthusiast drivers a better way to document,
            review, and protect modified vehicles. No mystery process. No
            generic runaround. Just human guidance built around the vehicle and
            the build.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
              Our mission
            </p>
            <h2 className="mt-3 text-3xl font-black md:text-5xl">
              Make coverage clearer for real drivers.
            </h2>
            <p className="mt-4 text-slate-600">
              We are building a smoother, more human process for drivers who
              put real time and money into their cars.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {values.map((value) => (
              <div
                key={value.t}
                className="rounded-3xl border border-slate-200 bg-[#f4f8ff] p-5"
              >
                <div className="font-black">{value.t}</div>
                <div className="mt-2 text-sm leading-6 text-slate-600">{value.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,.12)]">
          <div className="grid md:grid-cols-2">
            <img
              src="/brand/apex-build-review-garage.png"
              alt="Build records and modified vehicle in a garage"
              className="h-full min-h-[340px] w-full object-cover"
            />
            <div className="p-6 md:p-10">
              <h2 className="text-3xl font-black">What we are building</h2>
              <p className="mt-4 leading-7 text-slate-600">
                Apex began with a simple idea: people deserve a smoother way to
                protect vehicles they care about. Standard coverage conversations
                often miss what makes a modified car valuable, so Apex built a
                review process around the actual build.
              </p>
              <div className="mt-6 grid gap-3 text-sm font-bold text-slate-700">
                <div className="rounded-2xl bg-[#eef6ff] px-4 py-3">Build-first review process</div>
                <div className="rounded-2xl bg-[#eef6ff] px-4 py-3">Agent-assisted document upload</div>
                <div className="rounded-2xl bg-[#eef6ff] px-4 py-3">Status lookup for customer requests</div>
                <div className="rounded-2xl bg-[#eef6ff] px-4 py-3">Human claims and customer support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#04152a] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-14 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-black">How to reach us</h2>
            <p className="mt-3 text-blue-50/75">
              Phone: 844-398-2739 | Email: support@driveapexcoverage.com | Richmond, VA
            </p>
          </div>
          <Link
            href="/protect-more-than-stock"
            className="rounded-lg bg-blue-600 px-6 py-4 text-center text-sm font-black text-white hover:bg-blue-500"
          >
            Get My Quote
          </Link>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "Apex Coverage",
            url: "https://www.driveapexcoverage.com/about",
            areaServed: "US-VA",
            telephone: "844-398-2739",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Richmond",
              addressRegion: "VA",
              postalCode: "23219",
              addressCountry: "US",
            },
          }),
        }}
      />
    </main>
  );
}

'use client';

import Link from 'next/link';
import React, { useState } from 'react';

export default function ApexCoverageSite() {
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  function FAQItem({ i, q, a }: { i: number; q: string; a: string }) {
    const open = faqOpen === i;

    return (
      <div className="border-b border-gray-200">
        <button
          onClick={() => setFaqOpen(open ? null : i)}
          className="w-full py-4 text-left flex items-center justify-between gap-4"
          aria-expanded={open}
        >
          <span className="font-semibold">{q}</span>
          <span className="text-[#cc0000]">{open ? '▲' : '▼'}</span>
        </button>

        {open && <p className="pb-4 text-gray-600">{a}</p>}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(135deg, rgba(204,0,0,.10), transparent, rgba(204,0,0,.10))',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="inline-flex items-center rounded-full border border-[#cc0000]/20 bg-[#cc0000]/5 px-3 py-1 text-sm font-semibold text-[#cc0000]">
              Built for street-driven enthusiasts
            </p>

            <h1 className="mt-5 text-4xl md:text-6xl font-bold leading-tight">
              Protect the car you built.
              <br />
              <span className="text-[#cc0000]">Not just the car you bought.</span>
            </h1>

            <p className="mt-5 text-lg text-gray-600 max-w-prose">
              Apex Modified Vehicle Protection is designed for drivers who invest in
              professionally installed aftermarket parts and want a smarter way to protect
              their build.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/build-review"
                className="inline-flex items-center gap-2 bg-[#cc0000] text-white px-5 py-3 rounded-md font-semibold hover:bg-red-700 transition"
              >
                Start Build Review
              </Link>

              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-md border font-semibold hover:bg-gray-50 transition"
              >
                How It Works
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-gray-600">
              <span>🧾 Receipts reviewed</span>
              <span>🔧 Professional installs</span>
              <span>🚗 Street-driven builds</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-[#cc0000]/10 blur-2xl rounded-3xl" aria-hidden />

            <div className="relative bg-white border rounded-2xl shadow-xl p-6 md:p-8">
              <div className="text-sm font-semibold text-[#cc0000]">Apex Build Profile</div>

              <h2 className="mt-2 text-2xl font-bold">
                Your protection starts with your actual build.
              </h2>

              <p className="mt-3 text-gray-600">
                Submit your vehicle, mileage, VIN, parts list, receipts, install records,
                and photos. Apex reviews the build and matches it to the right protection tier.
              </p>

              <div className="mt-6 space-y-4">
                {[
                  {
                    title: 'Document your parts',
                    body: 'Upload or list receipts, install mileage, photos, and shop information.',
                  },
                  {
                    title: 'Review the risk',
                    body: 'We look at the vehicle, modification level, driver profile, and deductible choice.',
                  },
                  {
                    title: 'Get a custom plan',
                    body: 'Your plan is built around approved parts, professional installation, and street use.',
                  },
                ].map((item, index) => (
                  <div key={item.title} className="flex gap-3">
                    <div className="h-7 w-7 shrink-0 rounded-full bg-[#cc0000] text-white flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold">{item.title}</div>
                      <div className="text-sm text-gray-600">{item.body}</div>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/build-review"
                className="mt-7 inline-flex w-full justify-center items-center bg-[#cc0000] text-white px-5 py-3 rounded-md font-semibold hover:bg-red-700 transition"
              >
                Begin My Build Review
              </Link>

              <p className="mt-3 text-xs text-gray-500">
                Eligibility, pricing, deductibles, covered parts, and claims are subject to
                review and final approval.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Icons Strip */}
      <section className="border-t bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm text-gray-600">
          <div>🔧 Modified-friendly</div>
          <div>🧾 Documentation-based</div>
          <div>🛠️ Shop install required</div>
          <div>🚗 Auto insurance available</div>
        </div>
      </section>

      {/* What We Protect */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold">
              Protection for professionally installed aftermarket parts
            </h2>

            <p className="mt-3 text-gray-600">
              Most traditional auto insurance policies are not built around enthusiast vehicles.
              Apex is designed to review the actual parts on your car and create a protection
              option based on your build.
            </p>

            <ul className="mt-6 space-y-3">
              {[
                {
                  t: 'Performance parts',
                  d: 'Intake, exhaust, cooling, fueling, forced induction, tuning-related supporting parts, and more.',
                },
                {
                  t: 'Suspension and handling',
                  d: 'Coilovers, lowering kits, control arms, bushings, sway bars, brake upgrades, and related components.',
                },
                {
                  t: 'Exterior and appearance',
                  d: 'Wheels, body kits, aero, lighting, wraps, paint protection, and other approved cosmetic upgrades.',
                },
                {
                  t: 'Interior and electronics',
                  d: 'Audio, gauges, seats, infotainment, security, and other documented upgrades.',
                },
                {
                  t: 'Factory parts also considered',
                  d: 'Coverage can include approved factory parts depending on vehicle, mileage, condition, and plan terms.',
                },
              ].map((x) => (
                <li key={x.t} className="flex items-start gap-3">
                  <div className="mt-0.5">✔️</div>
                  <div>
                    <div className="font-medium">{x.t}</div>
                    <div className="text-gray-600 text-sm">{x.d}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                title: 'Street Tier',
                body: 'For daily-driven cars with mild, documented modifications.',
              },
              {
                title: 'Street+ Tier',
                body: 'For more involved builds with added performance, suspension, or appearance upgrades.',
              },
              {
                title: 'Apex Build Tier',
                body: 'For higher-value or higher-risk builds that need deeper review.',
              },
              {
                title: 'Auto Insurance Add-On',
                body: 'Traditional auto insurance is still available as a separate service.',
              },
            ].map((c) => (
              <div key={c.title} className="border rounded-xl p-5 hover:shadow-md transition">
                <div className="font-semibold">{c.title}</div>
                <div className="mt-2 text-sm text-gray-600">{c.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Preview */}
      <section className="bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold">
              How Apex Modified Vehicle Protection works
            </h2>

            <p className="mt-3 text-gray-600">
              We do not treat every car the same. Your vehicle, driver profile, mileage,
              ZIP code, parts list, claim history, documentation, and deductible choice all
              help determine eligibility and pricing.
            </p>
          </div>

          <div className="mt-8 grid md:grid-cols-4 gap-5">
            {[
              {
                step: '01',
                title: 'Submit your build',
                body: 'Tell us about your vehicle, parts, mileage, install history, and documentation.',
              },
              {
                step: '02',
                title: 'Apex reviews it',
                body: 'We review your risk profile, professional installation records, and parts list.',
              },
              {
                step: '03',
                title: 'Choose your plan',
                body: 'Pick a deductible and review the tier that fits your vehicle and build.',
              },
              {
                step: '04',
                title: 'Use support when needed',
                body: 'Approved claims may be handled by direct-to-shop payment or reimbursement.',
              },
            ].map((item) => (
              <div key={item.step} className="bg-white border rounded-xl p-5">
                <div className="text-[#cc0000] font-bold">{item.step}</div>
                <div className="mt-2 font-semibold">{item.title}</div>
                <div className="mt-2 text-sm text-gray-600">{item.body}</div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-md border font-semibold hover:bg-white transition"
            >
              View Full Process
            </Link>
          </div>
        </div>
      </section>

      {/* Auto Insurance Secondary Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="relative border rounded-2xl p-6 md:p-8 bg-white overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(120deg, rgba(204,0,0,.08), transparent, rgba(204,0,0,.08))',
            }}
          />

          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-sm font-semibold text-[#cc0000]">Still available</p>

              <h2 className="mt-2 text-3xl font-bold">
                Need traditional auto insurance too?
              </h2>

              <p className="mt-3 text-gray-600">
                Apex still helps drivers review auto insurance options. We are simply making
                modified vehicle protection the main focus for enthusiasts who need more than
                a standard policy conversation.
              </p>
            </div>

            <div className="md:text-right">
              <Link
                href="/quote"
                className="inline-flex items-center gap-2 bg-black text-white px-5 py-3 rounded-md font-semibold hover:bg-gray-800 transition"
              >
                Start Auto Insurance Quote
              </Link>

              <p className="mt-3 text-xs text-gray-500">
                Auto insurance quote requests use a separate form and intake flow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold">Built for people who care about their cars</h2>

          <div className="mt-6 grid md:grid-cols-3 gap-6">
            {[
              'Finally, a company that understands modified cars.',
              'The build review made way more sense than a generic quote form.',
              'I like that auto insurance is still available, but the focus is on enthusiasts.',
            ].map((t, i) => (
              <div key={i} className="bg-white border rounded-xl p-5">
                <div>★★★★★</div>
                <p className="mt-3 text-gray-700">“{t}”</p>
                <div className="mt-4 text-sm text-gray-500">— Apex customer</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold">FAQs</h2>

          <div className="mt-4">
            <FAQItem
              i={0}
              q="Is this the same as auto insurance?"
              a="No. Auto insurance is still available through Apex as a separate service. Apex Modified Vehicle Protection is focused on approved parts, documentation, professional installation, and repair support for eligible street-driven vehicles."
            />

            <FAQItem
              i={1}
              q="Do you cover any modification?"
              a="Parts must be documented, professionally installed, and approved as part of the build review. Undocumented parts and non-professional installations are not eligible."
            />

            <FAQItem
              i={2}
              q="What documents do I need?"
              a="You should be ready to provide receipts, photos, VIN, mileage, installation records, and shop information. The more complete your documentation is, the easier it is to review your build."
            />

            <FAQItem
              i={3}
              q="Can salvage or rebuilt title vehicles apply?"
              a="Yes, but they require stricter review and may have higher pricing, different deductibles, inspection requirements, or limited eligibility."
            />

            <FAQItem
              i={4}
              q="How are prices determined?"
              a="Pricing is risk-based. We consider the vehicle, driver profile, ZIP code, mileage, parts list, driving history, claim history, possible discounts, and deductible choice."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative">
        <div className="absolute inset-0 bg-[#cc0000]/5 -z-10" />

        <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold">Ready to protect your build?</h3>
            <p className="mt-1 text-gray-600">
              Start with a build review and let Apex evaluate your vehicle the right way.
            </p>
          </div>

          <Link
            href="/build-review"
            className="inline-flex items-center gap-2 bg-[#cc0000] text-white px-5 py-3 rounded-md font-semibold hover:bg-red-700"
          >
            Start Build Review
          </Link>
        </div>
      </section>
    </main>
  );
}

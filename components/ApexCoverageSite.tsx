'use client';

import Link from 'next/link';
import React, { useState } from 'react';

const quickProof = [
  'Receipts and invoices reviewed',
  'Professional and DIY installs considered',
  'Street, weekend, show, and mixed-use builds',
];

const coverageCategories = [
  {
    title: 'Performance parts',
    body: 'Intake, exhaust, cooling, fueling, forced induction, tuning-related supporting parts, and more.',
  },
  {
    title: 'Suspension and handling',
    body: 'Coilovers, lowering kits, control arms, bushings, sway bars, brake upgrades, and related components.',
  },
  {
    title: 'Exterior and appearance',
    body: 'Wheels, aero, body kits, lighting, wraps, paint protection, and other cosmetic upgrades.',
  },
  {
    title: 'Interior and electronics',
    body: 'Audio, gauges, seats, infotainment, security, and other documented upgrades.',
  },
  {
    title: 'Factory parts also considered',
    body: 'OEM or factory parts can be included when they help complete the documented build.',
  },
];

const tierCards = [
  {
    title: 'Street Tier',
    body: 'For daily-driven enthusiast cars with mild modifications.',
  },
  {
    title: 'Street+ Tier',
    body: 'For more involved builds with performance, suspension, appearance, or audio upgrades.',
  },
  {
    title: 'Apex Build Tier',
    body: 'For higher-value or higher-complexity builds that need a deeper review.',
  },
  {
    title: 'Salvage/Rebuilt Review',
    body: 'Rebuilt or salvage-title vehicles can still be reviewed with stricter documentation.',
  },
];

const processSteps = [
  {
    step: '01',
    title: 'Submit your build',
    body: 'Tell us about your vehicle, parts, mileage, install history, and documentation.',
  },
  {
    step: '02',
    title: 'Apex reviews it',
    body: 'We review the build, documentation, driver profile, title status, and vehicle use.',
  },
  {
    step: '03',
    title: 'Choose your fit',
    body: 'Review the tier, deductible, and next steps that make sense for your vehicle.',
  },
  {
    step: '04',
    title: 'Keep support close',
    body: 'Use Apex for updates, claims support, coverage changes, and documentation help.',
  },
];

const testimonials = [
  'Finally, a company that understands modified cars.',
  'The claims process was quick and easy to follow.',
  'I appreciate the peace of mind knowing my build has been reviewed.',
];

const faqs = [
  {
    q: 'Is this the same as standard auto coverage?',
    a: 'No. Standard auto coverage review is available separately. Apex Modified Vehicle Protection is focused on approved parts, documentation, installation quality, and repair support for eligible modified vehicles.',
  },
  {
    q: 'Do you cover any modification?',
    a: 'Every build is reviewed. Parts must be documented, installation details must be reviewed, and some parts or uses may be excluded.',
  },
  {
    q: 'What documents do I need?',
    a: 'Receipts, photos, VIN, mileage, installation records, and shop information are the most helpful. The more complete your documentation is, the smoother the review.',
  },
  {
    q: 'Can salvage or rebuilt title vehicles apply?',
    a: 'Yes, but they require stricter review and may have higher pricing, different deductibles, inspection requirements, or limited eligibility.',
  },
  {
    q: 'How are prices determined?',
    a: 'Pricing is risk-based. We consider the vehicle, driver profile, ZIP code, mileage, parts list, driving history, claim history, possible discounts, and deductible choice.',
  },
];

export default function ApexCoverageSite() {
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  return (
    <main className="min-h-screen bg-white text-gray-900">
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
              Built for enthusiasts
            </p>

            <h1 className="mt-5 text-4xl md:text-6xl font-bold leading-tight">
              Protect the car you built.
              <br />
              <span className="text-[#cc0000]">Not just the car you bought.</span>
            </h1>

            <p className="mt-5 text-lg text-gray-600 max-w-prose">
              Apex Modified Vehicle Protection is designed for drivers who invest
              in building their car the way they want and need a smarter way to
              document, review, and protect that build.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/build-review"
                className="inline-flex items-center gap-2 bg-[#cc0000] text-white px-5 py-3 rounded-md font-semibold hover:bg-red-700 transition"
              >
                Protect My Build
              </Link>

              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-md border font-semibold hover:bg-gray-50 transition"
              >
                How It Works
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-gray-600">
              {quickProof.map((item) => (
                <span key={item}>- {item}</span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="relative bg-white border rounded-2xl shadow-xl p-6 md:p-8">
              <div className="text-sm font-semibold text-[#cc0000]">
                Apex Build Profile
              </div>

              <h2 className="mt-2 text-2xl font-bold">
                Your protection starts with your actual build.
              </h2>

              <p className="mt-3 text-gray-600">
                Submit your vehicle, mileage, VIN, parts list, receipts, install
                records, and photos. Apex reviews the build and matches it to the
                right protection tier.
              </p>

              <div className="mt-6 space-y-4">
                {[
                  {
                    title: 'Document your parts',
                    body: 'List receipts, install mileage, photos, and shop information.',
                  },
                  {
                    title: 'Review the risk',
                    body: 'We look at the vehicle, modification level, driver profile, and deductible choice.',
                  },
                  {
                    title: 'Get a custom fit',
                    body: 'Your plan is built around approved parts, installation details, and real street use.',
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
                Protect My Build
              </Link>

              <p className="mt-3 text-xs text-gray-500">
                Eligibility, pricing, deductibles, covered parts, and claims are
                subject to review and final approval.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm text-gray-600">
          <div>Modified-friendly review</div>
          <div>Documentation-based</div>
          <div>DIY installs considered</div>
          <div>Auto coverage reviews available</div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold">
              Custom protection your build deserves
            </h2>

            <p className="mt-3 text-gray-600">
              Most standard auto coverage is not built around enthusiast
              vehicles. Apex reviews the actual parts on your car and creates a
              protection option based on your build.
            </p>

            <ul className="mt-6 space-y-3">
              {coverageCategories.map((item) => (
                <li key={item.title} className="flex items-start gap-3">
                  <div className="mt-0.5 text-[#cc0000] font-bold">+</div>
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-gray-600 text-sm">{item.body}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {tierCards.map((card) => (
              <div key={card.title} className="border rounded-xl p-5 hover:shadow-md transition">
                <div className="font-semibold">{card.title}</div>
                <div className="mt-2 text-sm text-gray-600">{card.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold">
              How Apex Modified Vehicle Protection works
            </h2>

            <p className="mt-3 text-gray-600">
              Every car and every build is different. Your vehicle, driver
              profile, mileage, ZIP code, parts list, claim history,
              documentation, and deductible choice all help us provide the
              coverage and peace of mind your build deserves.
            </p>
          </div>

          <div className="mt-8 grid md:grid-cols-4 gap-5">
            {processSteps.map((item) => (
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

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="relative border rounded-2xl p-6 md:p-8 bg-white overflow-hidden">
          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-sm font-semibold text-[#cc0000]">Still available</p>

              <h2 className="mt-2 text-3xl font-bold">
                Need a standard auto coverage review too?
              </h2>

              <p className="mt-3 text-gray-600">
                Apex can still help drivers review standard auto coverage
                options. Ask an agent how auto coverage can work alongside
                modified vehicle protection.
              </p>
            </div>

            <div className="md:text-right">
              <Link
                href="/quote"
                className="inline-flex items-center gap-2 bg-black text-white px-5 py-3 rounded-md font-semibold hover:bg-gray-800 transition"
              >
                Start Auto Coverage Review
              </Link>

              <p className="mt-3 text-xs text-gray-500">
                Auto coverage requests are handled case by case.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold">Built for people who care about their cars</h2>

          <div className="mt-6 grid md:grid-cols-3 gap-6">
            {testimonials.map((text) => (
              <div key={text} className="bg-white border rounded-xl p-5">
                <div className="text-[#cc0000] font-semibold">Five-star experience</div>
                <p className="mt-3 text-gray-700">"{text}"</p>
                <div className="mt-4 text-sm text-gray-500">Apex customer</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold">FAQs</h2>

          <div className="mt-4">
            {faqs.map((item, index) => {
              const open = faqOpen === index;
              return (
                <div key={item.q} className="border-b border-gray-200">
                  <button
                    onClick={() => setFaqOpen(open ? null : index)}
                    className="w-full py-4 text-left flex items-center justify-between gap-4"
                    aria-expanded={open}
                  >
                    <span className="font-semibold">{item.q}</span>
                    <span className="text-[#cc0000]">{open ? 'Close' : 'Open'}</span>
                  </button>

                  {open && <p className="pb-4 text-gray-600">{item.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

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
            Protect My Build
          </Link>
        </div>
      </section>
    </main>
  );
}

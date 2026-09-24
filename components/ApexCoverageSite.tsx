'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import AdLeadForm from './AdLeadForm';

const proofPoints = [
  'Modified build friendly',
  'Fast human follow-up',
  'Daily drivers and weekend builds',
];

const testimonials = [
  {
    name: 'Marcus T.',
    vehicle: 'Subaru WRX',
    quote:
      'Finally, a coverage company that understands modified cars and does not make the process feel impossible.',
  },
  {
    name: 'Sarah K.',
    vehicle: 'Mustang GT',
    quote:
      'Apex helped me understand what documents mattered and what my options looked like before moving forward.',
  },
  {
    name: 'Daniel R.',
    vehicle: 'Toyota GR Corolla',
    quote:
      'Fast, clear, and built for people who actually care about the car in the driveway.',
  },
];

const whyCards = [
  {
    title: 'Coverage that fits you',
    body:
      'Apex looks at your car, driving style, goals, and build instead of forcing every driver into the same box.',
  },
  {
    title: 'Protection for modified vehicles',
    body:
      'Aftermarket parts, DIY work, shop installs, documentation, and build value can all be reviewed by a real team.',
  },
  {
    title: 'Fast, human service',
    body:
      'Lead forms are routed to Apex agents so customers can get guidance without digging through generic portals.',
  },
];

const steps = [
  {
    step: '1',
    title: 'Tell us about the vehicle',
    body: 'Share quick details about the car, the build, and what kind of coverage conversation you want.',
  },
  {
    step: '2',
    title: 'Apex reviews the fit',
    body: 'An agent reviews the vehicle, build details, ZIP code, documentation, and coverage goals.',
  },
  {
    step: '3',
    title: 'Review and get covered',
    body: 'See your options, ask questions, and choose the path that makes sense for the car.',
  },
];

const cultureItems = [
  'Daily drivers',
  'Performance vehicles',
  'Custom and modified cars',
];

const faqs = [
  {
    q: 'Can Apex help with modified vehicles?',
    a: 'Yes. Apex Modified Vehicle Protection starts with a build review so eligible aftermarket parts and documentation can be evaluated.',
  },
  {
    q: 'Do I have to commit right away?',
    a: 'No. The review starts the conversation. An Apex agent walks through options before you decide what to do next.',
  },
  {
    q: 'Can DIY parts be reviewed?',
    a: 'Yes. DIY builds can be reviewed when the customer has clear part details, photos, receipts, and install notes.',
  },
  {
    q: 'Can I talk to a real person?',
    a: 'Yes. Apex is built around human follow-up, not a faceless quote wall.',
  },
];

export default function ApexCoverageSite() {
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  return (
    <main className="min-h-screen bg-[#f4f8ff] text-slate-950">
      <section className="relative isolate overflow-hidden bg-[#031326] text-white">
        <img
          src="/brand/apex-hero-road.png"
          alt="Blue modified performance car driving through a wet mountain road"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#020914] via-[#041a33]/85 to-[#061a31]/40" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-[#031326] to-transparent" />

        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:py-24">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-blue-300">
              Coverage built for real drivers
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
              Protect the car you actually drive.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-50/90">
              Apex Coverage helps daily drivers, enthusiasts, and modified
              vehicle owners get clearer guidance, smarter protection options,
              and human support without the generic runaround.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/protect-more-than-stock"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-4 text-sm font-extrabold text-white shadow-[0_18px_45px_rgba(37,99,235,.35)] transition hover:bg-blue-500"
              >
                Get My Free Quote
              </Link>
              <Link
                href="/build-review"
                className="inline-flex items-center justify-center rounded-lg border border-white/25 bg-white/10 px-6 py-4 text-sm font-extrabold text-white backdrop-blur transition hover:bg-white/15"
              >
                Protect My Build
              </Link>
            </div>

            <p className="mt-4 text-sm font-semibold text-white/85">
              No pressure. No spam. Real human support.
            </p>

            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              {proofPoints.map((point) => (
                <div
                  key={point}
                  className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white shadow-lg backdrop-blur"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:pl-6">
            <AdLeadForm />
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-blue-600">
                Real drivers. Real experiences.
              </p>
              <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
                Drivers trust Apex for clear guidance and custom-fit coverage.
              </h2>
            </div>
            <div className="rounded-2xl bg-[#eef6ff] px-5 py-4 text-sm text-slate-700">
              <div className="font-black text-amber-500">5 stars</div>
              <div className="mt-1 font-black text-slate-950">4.8 out of 5</div>
              <div>from Apex customers and prospects</div>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {testimonials.map((item) => (
              <article
                key={item.name}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,.08)]"
              >
                <div className="font-black text-amber-500">5 stars</div>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  "{item.quote}"
                </p>
                <div className="mt-5 text-sm font-black text-slate-950">
                  {item.name}
                </div>
                <div className="text-xs font-semibold text-slate-500">
                  {item.vehicle}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#04152a] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,.35),transparent_38%),linear-gradient(180deg,rgba(2,6,23,.15),rgba(2,6,23,.9))]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-blue-300">
              Why choose Apex Coverage
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
              Built around drivers like you.
            </h2>
          </div>
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {whyCards.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-blue-400/25 bg-white/[0.06] p-6 shadow-2xl backdrop-blur"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black">
                  +
                </div>
                <h3 className="text-xl font-black">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-blue-50/80">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f4f8ff]">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-blue-600">
              A simple process. Real results.
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
              How Apex Coverage works.
            </h2>
          </div>

          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {steps.map((item) => (
              <div
                key={item.step}
                className="relative rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-[0_18px_50px_rgba(15,23,42,.08)]"
              >
                <div className="mx-auto -mt-11 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-black text-white shadow-xl shadow-blue-600/25">
                  {item.step}
                </div>
                <h3 className="mt-5 text-lg font-black">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,.12)]">
            <div className="grid lg:grid-cols-2">
              <img
                src="/brand/apex-city-build.png"
                alt="Modified performance car overlooking a city at sunset"
                className="h-full min-h-[360px] w-full object-cover"
              />
              <div className="p-6 md:p-10">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-blue-600">
                  For enthusiasts. For daily drivers. For you.
                </p>
                <h2 className="mt-3 text-3xl font-black leading-tight md:text-5xl">
                  Not just coverage. Coverage built around your car culture.
                </h2>
                <p className="mt-5 text-base leading-7 text-slate-600">
                  Whether you drive a daily commuter, a high-performance vehicle,
                  or a fully customized build, Apex gives you options, guidance,
                  and support from people who understand why the car matters.
                </p>
                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  {cultureItems.map((item) => (
                    <div
                      key={item}
                      className="rounded-xl bg-[#eef6ff] px-4 py-3 text-sm font-black text-blue-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>
                <Link
                  href="/protect-more-than-stock"
                  className="mt-8 inline-flex rounded-lg bg-blue-600 px-6 py-4 text-sm font-extrabold text-white hover:bg-blue-500"
                >
                  Start My Quote
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[.75fr_1.25fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-blue-600">
              Questions? We have answers.
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
              Frequently asked questions
            </h2>
            <p className="mt-4 text-slate-600">
              Still have questions? Our team is here to help you find the right
              direction.
            </p>
          </div>
          <div className="space-y-3">
            {faqs.map((item, index) => {
              const open = faqOpen === index;
              return (
                <div
                  key={item.q}
                  className="rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setFaqOpen(open ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-black"
                    aria-expanded={open}
                  >
                    <span>{item.q}</span>
                    <span className="text-xl text-blue-600">{open ? '-' : '+'}</span>
                  </button>
                  {open && (
                    <p className="px-5 pb-5 text-sm leading-6 text-slate-600">
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-[#031326] text-white">
        <img
          src="/brand/apex-hero-road.png"
          alt="Blue modified performance car on a wet road"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#020914] via-[#031326]/85 to-[#031326]/45" />
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-14 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-blue-300">
              Better coverage. A brighter road ahead.
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-black md:text-5xl">
              Ready to see what better coverage looks like?
            </h2>
            <p className="mt-4 max-w-xl text-blue-50/85">
              Start your quote today and get coverage guidance tailored to your
              car, your budget, and your lifestyle.
            </p>
          </div>
          <Link
            href="/protect-more-than-stock"
            className="inline-flex justify-center rounded-lg bg-blue-600 px-8 py-4 text-sm font-extrabold text-white hover:bg-blue-500"
          >
            Get My Quote
          </Link>
        </div>
      </section>
    </main>
  );
}

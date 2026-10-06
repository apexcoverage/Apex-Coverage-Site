'use client';

import React, { useState } from 'react';
import ConsentDisclosure from './ConsentDisclosure';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const defaultGoogleAdsId = "AW-18491289640";
const defaultAdLeadConversionSendTo =
  "AW-18491289640/GZzFCJq50Y4dEKjgqvFE";
const googleAdsId =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ||
  process.env.NEXT_PUBLIC_GOOGLE_ADS_AD_LEAD_SEND_TO?.split("/")[0] ||
  defaultGoogleAdsId;
const adLeadConversionLabel =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_AD_LEAD_CONVERSION_LABEL;
const adLeadConversionSendTo =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_AD_LEAD_SEND_TO ||
  (googleAdsId && adLeadConversionLabel
    ? `${googleAdsId}/${adLeadConversionLabel}`
    : defaultAdLeadConversionSendTo);

function trackAdLandingLeadSubmit() {
  if (
    typeof window === 'undefined' ||
    typeof window.gtag !== 'function' ||
    !adLeadConversionSendTo
  ) {
    return;
  }

  window.gtag('event', 'conversion', {
    send_to: adLeadConversionSendTo,
    value: 1.0,
    currency: 'USD',
  });
}

export default function AdLeadForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set('consent', formData.get('consent') === 'on' ? 'true' : 'false');

    try {
      setStatus('submitting');
      setError('');

      const res = await fetch('/api/ad-lead', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data?.ok !== true) {
        throw new Error(data?.error || 'Submission failed.');
      }

      trackAdLandingLeadSubmit();
      setStatus('success');
      form.reset();
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Submission failed.');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900 shadow-2xl">
        <h2 className="text-2xl font-black">Apex received your info.</h2>
        <p className="mt-2 text-sm leading-6">
          An Apex agent will reach out, confirm what you are interested in, and
          explain the next step for your vehicle.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-5 rounded-lg bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-500"
        >
          Submit Another Vehicle
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-white/70 bg-white p-6 text-slate-950 shadow-[0_28px_80px_rgba(2,6,23,.28)]">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
        Takes about 60 seconds
      </p>
      <h2 className="mt-2 text-2xl font-black leading-tight">
        Start your Apex quote conversation.
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        No long application. Tell us what you drive, what you are interested in,
        and how to reach you.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Full name
          <input name="name" required className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-blue-500 focus:bg-white" placeholder="Jane Driver" />
        </label>
        <label className="text-sm">
          Phone
          <input name="phone" required className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-blue-500 focus:bg-white" placeholder="(555) 555-5555" />
        </label>
        <label className="text-sm">
          Email
          <input name="email" type="email" required className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-blue-500 focus:bg-white" placeholder="jane@example.com" />
        </label>
        <label className="text-sm">
          ZIP code
          <input name="zip" required pattern="\d{5}" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-blue-500 focus:bg-white" placeholder="23219" />
        </label>
        <label className="text-sm">
          Year
          <input name="year" required className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-blue-500 focus:bg-white" placeholder="2020" />
        </label>
        <label className="text-sm">
          Make
          <input name="make" required className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-blue-500 focus:bg-white" placeholder="Toyota" />
        </label>
        <label className="text-sm sm:col-span-2">
          Model
          <input name="model" required className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-blue-500 focus:bg-white" placeholder="Supra" />
        </label>
        <label className="text-sm sm:col-span-2">
          Approximate value of parts
          <select name="partsValue" required className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-blue-500 focus:bg-white">
            <option value="">Select one</option>
            <option value="under-2500">Under $2,500</option>
            <option value="2500-5000">$2,500-$5,000</option>
            <option value="5000-10000">$5,000-$10,000</option>
            <option value="10000-25000">$10,000-$25,000</option>
            <option value="25000-plus">$25,000+</option>
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          What do you want to talk about?
          <select name="interest" required className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-blue-500 focus:bg-white">
            <option value="">Select one</option>
            <option value="Modified vehicle protection">Protecting aftermarket parts</option>
            <option value="Auto coverage review">Standard auto coverage review</option>
            <option value="Both build and auto coverage">Both build and auto coverage</option>
          </select>
        </label>
      </div>

      <label className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-600">
        <input name="consent" type="checkbox" required className="mt-1" />
        <ConsentDisclosure />
      </label>

      {status === 'error' && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        disabled={status === 'submitting'}
        className="mt-5 w-full rounded-xl bg-blue-600 py-3.5 font-black text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500 disabled:opacity-50"
      >
        {status === 'submitting' ? 'Sending...' : 'Start My Quote'}
      </button>
      <p className="mt-3 text-center text-[11px] font-semibold text-slate-500">
        After you submit, a real Apex agent reviews the request and follows up.
      </p>
    </form>
  );
}

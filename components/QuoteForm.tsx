'use client';

import React, { useState } from 'react';
import ConsentDisclosure from './ConsentDisclosure';

export default function QuoteForm() {
  const [consent, setConsent] = useState(false);
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  async function onSubmitQuote(e: React.FormEvent) {
    e.preventDefault();
    const formEl = e.target as HTMLFormElement;

    if (!consent) {
      alert('Please accept the consent notice to proceed.');
      return;
    }

    const fd = new FormData(formEl);
    fd.set('consent', consent ? 'true' : 'false');

    try {
      setFormStatus('submitting');
      const res = await fetch('/api/lead', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || data?.ok !== true) {
        throw new Error(data?.error || 'Upstream error');
      }

      setFormStatus('success');
      formEl.reset();
      setConsent(false);
    } catch (err) {
      console.error(err);
      setFormStatus('error');
    }
  }

  if (formStatus === 'success') {
    return (
      <div className="relative rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center shadow-2xl">
        <h3 className="mb-2 text-2xl font-black text-emerald-800">
          Coverage Review Submitted
        </h3>
        <p className="mb-6 text-emerald-900">
          Thanks for reaching out. An Apex Coverage agent will contact you soon
          to review your options.
        </p>
        <button
          onClick={() => setFormStatus('idle')}
          className="rounded-lg bg-blue-600 px-6 py-3 font-black text-white hover:bg-blue-500"
        >
          Start Another Review
        </button>
      </div>
    );
  }

  return (
    <div className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_28px_80px_rgba(2,6,23,.18)]">
      <h3 className="mb-1 text-2xl font-black">Start an auto coverage review</h3>
      <p className="mb-4 text-sm leading-6 text-slate-600">
        Takes less than 60 seconds. An Apex agent will follow up.
      </p>

      {formStatus === 'error' && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          We could not submit your coverage request. Please try again in a moment or email{' '}
          <a className="underline" href="mailto:support@driveapexcoverage.com">
            support@driveapexcoverage.com
          </a>.
        </div>
      )}

      <form onSubmit={onSubmitQuote} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-sm">Full name</label>
          <input name="name" required className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-blue-500 focus:bg-white" placeholder="Jane Driver" />
        </div>
        <div>
          <label className="text-sm">Email</label>
          <input type="email" name="email" required className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-blue-500 focus:bg-white" placeholder="jane@example.com" />
        </div>
        <div>
          <label className="text-sm">Phone</label>
          <input name="phone" required className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-blue-500 focus:bg-white" placeholder="844-398-2739" />
        </div>
        <div>
          <label className="text-sm">ZIP</label>
          <input name="zip" pattern="\d{5}" required className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-blue-500 focus:bg-white" placeholder="23219" />
        </div>
        <div>
          <label className="text-sm">Date of birth</label>
          <input type="date" name="dob" required className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-blue-500 focus:bg-white" />
        </div>
        <div>
          <label className="text-sm">Vehicle year</label>
          <input name="year" required className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-blue-500 focus:bg-white" placeholder="2022" />
        </div>
        <div>
          <label className="text-sm">Make</label>
          <input name="make" required className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-blue-500 focus:bg-white" placeholder="Toyota" />
        </div>
        <div>
          <label className="text-sm">Model</label>
          <input name="model" required className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-blue-500 focus:bg-white" placeholder="Camry" />
        </div>
        <div className="sm:col-span-2">
          <label className="inline-flex items-start gap-2 text-xs leading-5 text-slate-600">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1"
            />
            <ConsentDisclosure />
          </label>
        </div>
        <div className="sm:col-span-2">
          <button
            className="w-full rounded-xl bg-blue-600 py-3.5 font-black text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500 disabled:opacity-50"
            disabled={formStatus === 'submitting'}
          >
            {formStatus === 'submitting' ? 'Submitting...' : 'Request Coverage Review'}
          </button>
        </div>
        <p className="sm:col-span-2 text-[11px] text-slate-500">
          This is a request for review only. Final pricing and eligibility depend
          on approval and available options.
        </p>
      </form>
    </div>
  );
}

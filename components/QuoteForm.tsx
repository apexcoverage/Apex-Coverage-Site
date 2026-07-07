'use client';

import React, { useState } from 'react';

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
      <div className="relative bg-white border rounded-2xl shadow-xl p-6 text-center">
        <h3 className="text-2xl font-semibold text-green-700 mb-2">
          Coverage Review Submitted
        </h3>
        <p className="text-gray-700 mb-6">
          Thanks for reaching out. An Apex Coverage agent will contact you soon
          to review your options.
        </p>
        <button
          onClick={() => setFormStatus('idle')}
          className="bg-red-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-red-700"
        >
          Start Another Review
        </button>
      </div>
    );
  }

  return (
    <div className="relative bg-white border rounded-2xl shadow-xl p-6">
      <h3 className="text-xl font-semibold mb-1">Start an auto coverage review</h3>
      <p className="text-sm text-gray-600 mb-4">
        Takes less than 60 seconds. An Apex agent will follow up.
      </p>

      {formStatus === 'error' && (
        <div className="mb-3 rounded-md bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
          We could not submit your coverage request. Please try again in a moment or email{' '}
          <a className="underline" href="mailto:support@driveapexcoverage.com">
            support@driveapexcoverage.com
          </a>.
        </div>
      )}

      <form onSubmit={onSubmitQuote} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-sm">Full name</label>
          <input name="name" required className="w-full mt-1 border rounded-md px-3 py-2" placeholder="Jane Driver" />
        </div>
        <div>
          <label className="text-sm">Email</label>
          <input type="email" name="email" required className="w-full mt-1 border rounded-md px-3 py-2" placeholder="jane@example.com" />
        </div>
        <div>
          <label className="text-sm">Phone</label>
          <input name="phone" required className="w-full mt-1 border rounded-md px-3 py-2" placeholder="(540) 699-0505" />
        </div>
        <div>
          <label className="text-sm">ZIP</label>
          <input name="zip" pattern="\d{5}" required className="w-full mt-1 border rounded-md px-3 py-2" placeholder="23219" />
        </div>
        <div>
          <label className="text-sm">Date of birth</label>
          <input type="date" name="dob" required className="w-full mt-1 border rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="text-sm">Vehicle year</label>
          <input name="year" required className="w-full mt-1 border rounded-md px-3 py-2" placeholder="2022" />
        </div>
        <div>
          <label className="text-sm">Make</label>
          <input name="make" required className="w-full mt-1 border rounded-md px-3 py-2" placeholder="Toyota" />
        </div>
        <div>
          <label className="text-sm">Model</label>
          <input name="model" required className="w-full mt-1 border rounded-md px-3 py-2" placeholder="Camry" />
        </div>
        <div className="sm:col-span-2">
          <label className="inline-flex items-start gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1"
            />
            <span>
              By submitting, you consent to be contacted by Apex Coverage via
              phone, email, or text regarding your coverage request. Consent is
              not required for purchase.
            </span>
          </label>
        </div>
        <div className="sm:col-span-2">
          <button
            className="w-full bg-[#cc0000] hover:bg-red-700 text-white font-semibold py-2.5 rounded-md disabled:opacity-50"
            disabled={formStatus === 'submitting'}
          >
            {formStatus === 'submitting' ? 'Submitting...' : 'Request Coverage Review'}
          </button>
        </div>
        <p className="sm:col-span-2 text-[11px] text-gray-500">
          This is a request for review only. Final pricing and eligibility depend
          on approval and available options.
        </p>
      </form>
    </div>
  );
}

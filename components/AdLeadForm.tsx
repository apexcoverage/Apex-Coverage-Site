'use client';

import React, { useState } from 'react';

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

      setStatus('success');
      form.reset();
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Submission failed.');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border bg-green-50 p-6 text-green-800 shadow-sm">
        <h2 className="text-2xl font-bold">You are on the list.</h2>
        <p className="mt-2 text-sm">
          Apex received your information. An agent will reach out to learn more
          about the build and the protection you want.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-5 rounded-md bg-[#cc0000] px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Submit Another Vehicle
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border bg-white p-5 shadow-xl">
      <h2 className="text-2xl font-bold">Get contacted by Apex</h2>
      <p className="mt-2 text-sm text-gray-600">
        No long application. Tell us what you drive and what you added.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Full name
          <input name="name" required className="mt-1 w-full rounded-md border px-3 py-2" placeholder="Jane Driver" />
        </label>
        <label className="text-sm">
          Phone
          <input name="phone" required className="mt-1 w-full rounded-md border px-3 py-2" placeholder="(540) 699-0505" />
        </label>
        <label className="text-sm">
          Email
          <input name="email" type="email" required className="mt-1 w-full rounded-md border px-3 py-2" placeholder="jane@example.com" />
        </label>
        <label className="text-sm">
          ZIP code
          <input name="zip" required pattern="\d{5}" className="mt-1 w-full rounded-md border px-3 py-2" placeholder="23219" />
        </label>
        <label className="text-sm">
          Year
          <input name="year" required className="mt-1 w-full rounded-md border px-3 py-2" placeholder="2020" />
        </label>
        <label className="text-sm">
          Make
          <input name="make" required className="mt-1 w-full rounded-md border px-3 py-2" placeholder="Toyota" />
        </label>
        <label className="text-sm sm:col-span-2">
          Model
          <input name="model" required className="mt-1 w-full rounded-md border px-3 py-2" placeholder="Supra" />
        </label>
        <label className="text-sm sm:col-span-2">
          Approximate value of parts
          <select name="partsValue" required className="mt-1 w-full rounded-md border px-3 py-2">
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
          <select name="interest" required className="mt-1 w-full rounded-md border px-3 py-2">
            <option value="">Select one</option>
            <option value="Modified vehicle protection">Protecting aftermarket parts</option>
            <option value="Auto coverage review">Standard auto coverage review</option>
            <option value="Both build and auto coverage">Both build and auto coverage</option>
          </select>
        </label>
      </div>

      <label className="mt-4 flex items-start gap-2 text-xs text-gray-600">
        <input name="consent" type="checkbox" required className="mt-1" />
        <span>
          I consent to be contacted by Apex Coverage by phone, email, or text
          about my request. Consent is not required for purchase.
        </span>
      </label>

      {status === 'error' && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        disabled={status === 'submitting'}
        className="mt-5 w-full rounded-md bg-[#cc0000] py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
      >
        {status === 'submitting' ? 'Sending...' : 'Have Apex Contact Me'}
      </button>
    </form>
  );
}

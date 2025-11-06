'use client';
import React, { useState } from 'react';

export default function ClaimForm() {
  const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);

    // track source + type on the record (helps in Sheets)
    fd.set('type', 'claim');
    fd.set('source', typeof window !== 'undefined' ? window.location.pathname : '/claims');

    try {
      setFormStatus('submitting');
      const res = await fetch('/api/claim', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || data?.ok !== true) throw new Error(data?.error || 'Upstream error');
      setFormStatus('success');
      form.reset();
    } catch (err) {
      console.error(err);
      setFormStatus('error');
    }
  }

  if (formStatus === 'success') {
    return (
      <div className="bg-white border rounded-2xl shadow-xl p-6 text-center">
        <h3 className="text-2xl font-semibold text-green-700 mb-2">Claim Submitted</h3>
        <p className="text-gray-700 mb-6">
          Thanks. A claims specialist will contact you shortly with next steps.
          If this is an emergency, please also call us at <a className="underline" href="tel:+15406990505">(540) 699-0505</a>.
        </p>
        <a href="/" className="inline-flex items-center gap-2 bg-[#cc0000] text-white px-5 py-2 rounded-md font-semibold hover:bg-red-700">
          Back to home
        </a>
      </div>
    );
  }

  return (
    <div className="relative bg-white border rounded-2xl shadow-xl p-6">
      {formStatus === 'error' && (
        <div className="mb-3 rounded-md bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
          We couldn’t submit your claim. Please try again or email{" "}
          <a className="underline" href="mailto:support@driveapexcoverage.com">support@driveapexcoverage.com</a>.
        </div>
      )}

      <h3 className="text-xl font-semibold mb-1">Start a claim</h3>
      <p className="text-sm text-gray-600 mb-4">Tell us what happened. This takes about 1–2 minutes.</p>

      <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Contact */}
        <div className="sm:col-span-2"><label className="text-sm">Full name</label>
          <input name="name" required className="w-full mt-1 border rounded-md px-3 py-2" placeholder="Jane Driver" />
        </div>
        <div><label className="text-sm">Email</label>
          <input type="email" name="email" required className="w-full mt-1 border rounded-md px-3 py-2" placeholder="jane@example.com" />
        </div>
        <div><label className="text-sm">Phone</label>
          <input name="phone" required className="w-full mt-1 border rounded-md px-3 py-2" placeholder="(540) 699-0505" />
        </div>

        {/* Policy & incident */}
        <div><label className="text-sm">Policy # (if known)</label>
          <input name="policy" className="w-full mt-1 border rounded-md px-3 py-2" placeholder="ABC-123456" />
        </div>
        <div><label className="text-sm">Date of loss</label>
          <input type="date" name="dateOfLoss" required className="w-full mt-1 border rounded-md px-3 py-2" />
        </div>
        <div><label className="text-sm">Time of loss</label>
          <input type="time" name="timeOfLoss" className="w-full mt-1 border rounded-md px-3 py-2" />
        </div>
        <div><label className="text-sm">Location (City/ZIP)</label>
          <input name="location" className="w-full mt-1 border rounded-md px-3 py-2" placeholder="Richmond, 23219" />
        </div>

        {/* Vehicle + Loss type */}
        <div><label className="text-sm">Vehicle year</label>
          <input name="year" className="w-full mt-1 border rounded-md px-3 py-2" placeholder="2021" />
        </div>
        <div><label className="text-sm">Make</label>
          <input name="make" className="w-full mt-1 border rounded-md px-3 py-2" placeholder="Toyota" />
        </div>
        <div><label className="text-sm">Model</label>
          <input name="model" className="w-full mt-1 border rounded-md px-3 py-2" placeholder="Camry" />
        </div>
        <div>
          <label className="text-sm">Type of loss</label>
          <select name="lossType" className="w-full mt-1 border rounded-md px-3 py-2">
            <option value="">Select…</option>
            <option>Collision</option>
            <option>Comprehensive (theft/weather/vandalism)</option>
            <option>Glass-only</option>
            <option>Uninsured/Underinsured motorist</option>
            <option>Other</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm">Brief description</label>
          <textarea name="description" rows={4} className="w-full mt-1 border rounded-md px-3 py-2"
            placeholder="Tell us what happened (who, what, where)…" />
        </div>

        <div>
          <label className="text-sm">Police report?</label>
          <select name="policeReport" className="w-full mt-1 border rounded-md px-3 py-2">
            <option value="">Select…</option>
            <option>Yes</option>
            <option>No</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm">Photo links (optional)</label>
          <textarea name="photoUrls" rows={2} className="w-full mt-1 border rounded-md px-3 py-2"
            placeholder="Paste any image links (Google Drive, iCloud, etc.)" />
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm">Preferred contact</label>
          <select name="preferredContact" className="w-full mt-1 border rounded-md px-3 py-2">
            <option>Email</option>
            <option>Phone</option>
            <option>Text</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <button
            className="w-full bg-[#cc0000] hover:bg-red-700 text-white font-semibold py-2.5 rounded-md disabled:opacity-50"
            disabled={formStatus === 'submitting'}
          >
            {formStatus === 'submitting' ? 'Submitting…' : 'Submit claim'}
          </button>
        </div>
        <p className="sm:col-span-2 text-[11px] text-gray-500">
          Submitting a claim starts our support process but is not an admission of fault.
        </p>
      </form>
    </div>
  );
}

"use client";

import React, { useState } from "react";

export default function ClaimForm() {
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ ok?: boolean; error?: string }>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setStatus({});

    const form = e.currentTarget;
    const fd = new FormData(form);

    fd.set("type", "claim");
    fd.set("source", "website-claim");

    try {
      const res = await fetch("/api/claims", { method: "POST", body: fd });
      const raw = await res.text();
      let data: any = null;

      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }

      const ok = data?.ok === true;
      if (!res.ok || !ok) {
        const msg =
          (data && (data.error || data.raw)) ||
          raw ||
          res.statusText ||
          "Could not submit claim";
        throw new Error(msg);
      }

      setStatus({ ok: true });
      form.reset();
    } catch (err: any) {
      setStatus({ ok: false, error: String(err?.message || err) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative z-10 space-y-4 rounded-3xl border border-slate-200 bg-white p-6 text-slate-950 shadow-[0_28px_80px_rgba(2,6,23,.18)]"
    >
      <h2 className="mb-1 text-2xl font-black">
        Submit your claim
      </h2>
      <p className="mb-4 text-sm leading-6 text-slate-600">
        Provide the key details and Apex will follow up with next steps.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input name="name" type="text" required placeholder="Full Name" className="rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-blue-500 focus:bg-white" />
        <input name="email" type="email" required placeholder="Email Address" className="rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-blue-500 focus:bg-white" />
        <input name="phone" type="tel" required placeholder="Phone Number" className="rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-blue-500 focus:bg-white" />
        <input name="policy" type="text" placeholder="Policy Number" className="rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-blue-500 focus:bg-white" />
        <input name="dateOfLoss" type="date" required className="rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-blue-500 focus:bg-white" />
        <input name="timeOfLoss" type="time" required className="rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-blue-500 focus:bg-white" />
        <input name="location" type="text" placeholder="Location of incident" className="rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-blue-500 focus:bg-white md:col-span-2" />
        <input name="year" type="text" placeholder="Vehicle Year" className="rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-blue-500 focus:bg-white" />
        <input name="make" type="text" placeholder="Vehicle Make" className="rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-blue-500 focus:bg-white" />
        <input name="model" type="text" placeholder="Vehicle Model" className="rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-blue-500 focus:bg-white" />
        <input name="lossType" type="text" placeholder="Type of Loss (Collision, Theft, etc.)" className="rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-blue-500 focus:bg-white md:col-span-2" />
      </div>

      <textarea name="description" placeholder="Describe what happened" rows={4} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-blue-500 focus:bg-white" />
      <input name="policeReport" type="text" placeholder="Police Report # (if applicable)" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-blue-500 focus:bg-white" />
      <input name="photoUrls" type="text" placeholder="Link to photos (optional)" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-blue-500 focus:bg-white" />
      <select name="preferredContact" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-blue-500 focus:bg-white">
        <option value="">Preferred Contact Method</option>
        <option value="email">Email</option>
        <option value="phone">Phone</option>
        <option value="text">Text</option>
      </select>

      <input type="hidden" name="type" value="claim" />
      <input type="hidden" name="source" value="website-claim" />

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-blue-600 py-3.5 font-black text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500 disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit Claim"}
      </button>

      {status.ok && (
        <p className="text-center text-sm text-emerald-700">
          Claim submitted successfully. A representative will reach out soon.
        </p>
      )}
      {status.ok === false && (
        <p className="text-center text-sm text-red-600">
          {status.error || "An error occurred while submitting your claim."}
        </p>
      )}
    </form>
  );
}

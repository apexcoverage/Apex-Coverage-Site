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

  // Ensure correct routing flags
  fd.set("type", "claim");
  fd.set("source", "website-claim");

  try {
    const res = await fetch("/api/claims", { method: "POST", body: fd });

    // Read as text first to avoid "Unexpected end of JSON input"
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
      className="relative z-10 bg-white rounded-2xl shadow-lg p-6 space-y-4"
    >
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Submit your claim
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          name="name"
          type="text"
          required
          placeholder="Full Name"
          className="border border-gray-300 rounded-md p-2"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="Email Address"
          className="border border-gray-300 rounded-md p-2"
        />
        <input
          name="phone"
          type="tel"
          required
          placeholder="Phone Number"
          className="border border-gray-300 rounded-md p-2"
        />
        <input
          name="policy"
          type="text"
          placeholder="Policy Number"
          className="border border-gray-300 rounded-md p-2"
        />
        <input
          name="dateOfLoss"
          type="date"
          required
          className="border border-gray-300 rounded-md p-2"
        />
        <input
          name="timeOfLoss"
          type="time"
          required
          className="border border-gray-300 rounded-md p-2"
        />
        <input
          name="location"
          type="text"
          placeholder="Location of incident"
          className="border border-gray-300 rounded-md p-2 md:col-span-2"
        />
        <input
          name="year"
          type="text"
          placeholder="Vehicle Year"
          className="border border-gray-300 rounded-md p-2"
        />
        <input
          name="make"
          type="text"
          placeholder="Vehicle Make"
          className="border border-gray-300 rounded-md p-2"
        />
        <input
          name="model"
          type="text"
          placeholder="Vehicle Model"
          className="border border-gray-300 rounded-md p-2"
        />
        <input
          name="lossType"
          type="text"
          placeholder="Type of Loss (Collision, Theft, etc.)"
          className="border border-gray-300 rounded-md p-2 md:col-span-2"
        />
      </div>

      <textarea
        name="description"
        placeholder="Describe what happened"
        rows={4}
        className="border border-gray-300 rounded-md p-2 w-full"
      />
      <input
        name="policeReport"
        type="text"
        placeholder="Police Report # (if applicable)"
        className="border border-gray-300 rounded-md p-2 w-full"
      />
      <input
        name="photoUrls"
        type="text"
        placeholder="Link to Photos (optional)"
        className="border border-gray-300 rounded-md p-2 w-full"
      />
      <select
        name="preferredContact"
        className="border border-gray-300 rounded-md p-2 w-full"
      >
        <option value="">Preferred Contact Method</option>
        <option value="email">Email</option>
        <option value="phone">Phone</option>
        <option value="text">Text</option>
      </select>

      {/* Hidden fields ensure correct routing */}
      <input type="hidden" name="type" value="claim" />
      <input type="hidden" name="source" value="website-claim" />

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#cc0000] text-white font-semibold py-2 rounded-md hover:bg-[#b00000] disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit Claim"}
      </button>

      {status.ok && (
        <p className="text-green-600 text-sm text-center">
          ✅ Claim submitted successfully! A representative will reach out soon.
        </p>
      )}
      {status.ok === false && (
        <p className="text-red-600 text-sm text-center">
          ❌ {status.error || "An error occurred while submitting your claim."}
        </p>
      )}
    </form>
  );
}

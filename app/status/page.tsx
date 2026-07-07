"use client";

import React, { useState } from "react";

type StatusRow = {
  type: string;
  received: string;
  status: string;
  vehicle: string;
  nextStep: string;
};

export default function StatusPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<StatusRow[]>([]);
  const [searched, setSearched] = useState(false);

  async function checkStatus(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setRows([]);
    setSearched(false);

    try {
      const res = await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone }),
      });

      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "Could not check status.");
      }

      setRows(Array.isArray(data.rows) ? data.rows : []);
      setSearched(true);
    } catch (err: any) {
      setError(err.message || "Could not check status.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="relative overflow-hidden border-b">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: "linear-gradient(135deg, rgba(204,0,0,.10), transparent)" }}
        />
        <div className="relative max-w-7xl mx-auto px-4 py-16">
          <span className="text-sm tracking-wide text-[#cc0000] font-semibold">
            REQUEST STATUS
          </span>
          <h1 className="mt-2 text-4xl md:text-5xl font-bold max-w-3xl">
            Check your Apex Coverage status.
          </h1>
          <p className="mt-4 text-gray-600 max-w-3xl">
            Enter the email or phone number used for your build review or auto
            coverage request. If we find a match, we will show the latest status
            available from Apex.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-12">
        <form onSubmit={checkStatus} className="border rounded-2xl p-6 shadow-sm bg-white">
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-sm">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full border rounded-md px-3 py-2"
                placeholder="jane@example.com"
              />
            </label>
            <label className="text-sm">
              Phone
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="mt-1 w-full border rounded-md px-3 py-2"
                placeholder="(540) 699-0505"
              />
            </label>
          </div>

          <button
            disabled={loading}
            className="mt-5 w-full bg-[#cc0000] hover:bg-red-700 text-white font-semibold py-2.5 rounded-md disabled:opacity-50"
          >
            {loading ? "Checking..." : "Check Status"}
          </button>

          <p className="mt-3 text-xs text-gray-500">
            Status lookup is informational only. For urgent updates, call Apex at
            (540) 699-0505.
          </p>
        </form>

        {error && (
          <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {searched && rows.length === 0 && (
          <div className="mt-6 rounded-2xl border bg-gray-50 p-6 text-sm text-gray-700">
            We could not find a matching request. Check that the email or phone
            matches what you submitted, or contact Apex for help.
          </div>
        )}

        {rows.length > 0 && (
          <div className="mt-6 space-y-4">
            {rows.map((row, index) => (
              <div key={`${row.type}-${index}`} className="rounded-2xl border p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-[#cc0000]">{row.type}</div>
                    <h2 className="mt-1 text-xl font-bold">{row.vehicle}</h2>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
                    {row.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-600">{row.nextStep}</p>
                {row.received && (
                  <p className="mt-2 text-xs text-gray-500">Received: {row.received}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

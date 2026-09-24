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
    <main className="min-h-screen bg-[#f4f8ff] text-slate-950">
      <section className="relative isolate overflow-hidden bg-[#031326] text-white">
        <img
          src="/brand/apex-hero-road.png"
          alt="Blue modified vehicle on a mountain road"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#020914] via-[#031326]/88 to-[#031326]/45" />
        <div className="relative mx-auto max-w-7xl px-4 py-16">
          <p className="text-xs font-black uppercase tracking-[0.34em] text-blue-300">
            Request status
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.98] tracking-tight md:text-7xl">
            Check your Apex Coverage status.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-50/90">
            Enter the email or phone number used for your build review or auto
            coverage request. If we find a match, we will show the latest status
            available from Apex.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <form
          onSubmit={checkStatus}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.12)]"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-blue-500 focus:bg-white"
                placeholder="jane@example.com"
              />
            </label>
            <label className="text-sm font-bold">
              Phone
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-blue-500 focus:bg-white"
                placeholder="844-398-2739"
              />
            </label>
          </div>

          <button
            disabled={loading}
            className="mt-5 w-full rounded-xl bg-blue-600 py-3.5 font-black text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? "Checking..." : "Check Status"}
          </button>

          <p className="mt-3 text-xs text-slate-500">
            Status lookup is informational only. For urgent updates, call Apex at
            844-398-2739.
          </p>
        </form>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {searched && rows.length === 0 && (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
            We could not find a matching request. Check that the email or phone
            matches what you submitted, or contact Apex for help.
          </div>
        )}

        {rows.length > 0 && (
          <div className="mt-6 space-y-4">
            {rows.map((row, index) => (
              <div
                key={`${row.type}-${index}`}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
                      {row.type}
                    </div>
                    <h2 className="mt-1 text-xl font-black">{row.vehicle}</h2>
                  </div>
                  <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-sm font-black text-blue-700">
                    {row.status}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{row.nextStep}</p>
                {row.received && (
                  <p className="mt-2 text-xs text-slate-500">Received: {row.received}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

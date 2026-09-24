"use client";

import React, { useState } from "react";

export default function DocumentUploadPage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function submitUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      setStatus("submitting");
      setError("");

      const res = await fetch("/api/document-upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "Upload failed.");
      }

      setStatus("success");
      form.reset();
    } catch (err: any) {
      setStatus("error");
      setError(err.message || "Upload failed.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f8ff] text-slate-950">
      <section className="relative isolate overflow-hidden bg-[#031326] text-white">
        <img
          src="/brand/apex-build-review-garage.png"
          alt="Build documents and modified vehicle in garage"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#020914] via-[#031326]/88 to-[#031326]/55" />
        <div className="relative mx-auto max-w-7xl px-4 py-16">
          <p className="text-xs font-black uppercase tracking-[0.34em] text-blue-300">
            Agent-assisted document upload
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black leading-[0.98] tracking-tight md:text-7xl">
            Send build documents while you are speaking with Apex.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-50/90">
            Use this page when an Apex agent asks for receipts, photos,
            invoices, or records during a coverage call.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        {status === "success" ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900 shadow-sm">
            <h2 className="text-2xl font-black">Documents received</h2>
            <p className="mt-2 leading-6">
              Thanks. Let your Apex agent know the upload is complete so they can
              continue the review.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-5 rounded-lg bg-blue-600 px-5 py-3 font-black text-white hover:bg-blue-500"
            >
              Upload More Documents
            </button>
          </div>
        ) : (
          <form
            onSubmit={submitUpload}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.12)]"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold">
                Full name
                <input name="name" required className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-blue-500 focus:bg-white" />
              </label>
              <label className="text-sm font-bold">
                Email
                <input name="email" type="email" required className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-blue-500 focus:bg-white" />
              </label>
              <label className="text-sm font-bold">
                Phone
                <input name="phone" required className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-blue-500 focus:bg-white" />
              </label>
              <label className="text-sm font-bold">
                Vehicle
                <input name="vehicle" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-blue-500 focus:bg-white" placeholder="2021 Subaru WRX" />
              </label>
              <label className="text-sm font-bold">
                Upload code or agent name
                <input name="uploadCode" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-blue-500 focus:bg-white" placeholder="Optional" />
              </label>
              <label className="text-sm font-bold">
                What are you sending?
                <select name="purpose" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-blue-500 focus:bg-white">
                  <option value="build-docs">Build receipts / photos</option>
                  <option value="install-records">Installer records</option>
                  <option value="title-mileage">Title or mileage documents</option>
                  <option value="claim-docs">Claim documents</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>

            <label className="mt-4 block text-sm font-bold">
              Upload files
              <input
                name="files"
                type="file"
                multiple
                required
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-blue-500 focus:bg-white"
              />
            </label>

            <label className="mt-4 block text-sm font-bold">
              Notes for your agent
              <textarea name="notes" rows={4} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none focus:border-blue-500 focus:bg-white" />
            </label>

            <p className="mt-3 text-xs text-slate-500">
              Keep each submission under 8 MB total. If you have more files,
              submit them in smaller batches or ask your agent for help.
            </p>

            {status === "error" && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              disabled={status === "submitting"}
              className="mt-5 w-full rounded-xl bg-blue-600 py-3.5 font-black text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500 disabled:opacity-50"
            >
              {status === "submitting" ? "Uploading..." : "Send Documents to Apex"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

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
    <main className="min-h-screen bg-white text-gray-900">
      <section className="relative overflow-hidden border-b">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: "linear-gradient(135deg, rgba(204,0,0,.10), transparent)" }}
        />
        <div className="relative max-w-7xl mx-auto px-4 py-16">
          <span className="text-sm tracking-wide text-[#cc0000] font-semibold">
            AGENT-ASSISTED DOCUMENT UPLOAD
          </span>
          <h1 className="mt-2 text-4xl md:text-5xl font-bold max-w-3xl">
            Send build documents while you are speaking with Apex.
          </h1>
          <p className="mt-4 text-gray-600 max-w-3xl">
            Use this page when an Apex agent asks for receipts, photos, invoices,
            or records during a coverage call. Your upload will be sent to Apex
            and logged for follow-up.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-12">
        {status === "success" ? (
          <div className="rounded-2xl border bg-green-50 p-6 text-green-800">
            <h2 className="text-2xl font-bold">Documents received</h2>
            <p className="mt-2">
              Thanks. Let your Apex agent know the upload is complete so they can
              continue the review.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-5 rounded-md bg-[#cc0000] px-5 py-2 font-semibold text-white hover:bg-red-700"
            >
              Upload More Documents
            </button>
          </div>
        ) : (
          <form onSubmit={submitUpload} className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="text-sm">
                Full name
                <input name="name" required className="mt-1 w-full rounded-md border px-3 py-2" />
              </label>
              <label className="text-sm">
                Email
                <input name="email" type="email" required className="mt-1 w-full rounded-md border px-3 py-2" />
              </label>
              <label className="text-sm">
                Phone
                <input name="phone" required className="mt-1 w-full rounded-md border px-3 py-2" />
              </label>
              <label className="text-sm">
                Vehicle
                <input name="vehicle" className="mt-1 w-full rounded-md border px-3 py-2" placeholder="2021 Subaru WRX" />
              </label>
              <label className="text-sm">
                Upload code or agent name
                <input name="uploadCode" className="mt-1 w-full rounded-md border px-3 py-2" placeholder="Optional" />
              </label>
              <label className="text-sm">
                What are you sending?
                <select name="purpose" className="mt-1 w-full rounded-md border px-3 py-2">
                  <option value="build-docs">Build receipts / photos</option>
                  <option value="install-records">Installer records</option>
                  <option value="title-mileage">Title or mileage documents</option>
                  <option value="claim-docs">Claim documents</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>

            <label className="mt-4 block text-sm">
              Upload files
              <input
                name="files"
                type="file"
                multiple
                required
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                className="mt-1 w-full rounded-md border px-3 py-2"
              />
            </label>

            <label className="mt-4 block text-sm">
              Notes for your agent
              <textarea name="notes" rows={4} className="mt-1 w-full rounded-md border px-3 py-2" />
            </label>

            <p className="mt-3 text-xs text-gray-500">
              Keep each submission under 8 MB total. If you have more files,
              submit them in smaller batches or ask your agent for help.
            </p>

            {status === "error" && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              disabled={status === "submitting"}
              className="mt-5 w-full rounded-md bg-[#cc0000] py-2.5 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {status === "submitting" ? "Uploading..." : "Send Documents to Apex"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

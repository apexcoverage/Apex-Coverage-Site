import React from "react";
import ClaimForm from "@/components/ClaimForm";

export const metadata = {
  title: "File a Claim | Apex Coverage",
  description: "Report an auto claim to Apex Coverage.",
};

export default function ClaimsPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(204,0,0,.08), transparent, rgba(204,0,0,.08))",
          }}
        />
        <div className="max-w-7xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              File a claim
            </h1>
            <p className="mt-4 text-gray-600 max-w-prose">
              Tell us what happened. We’ll guide you through next steps and coordinate
              with a resolution with you.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-gray-600">
              <li>✔️ Quick intake</li>
              <li>✔️ Human help when you need it</li>
              <li>✔️ We understand these things happen</li>
            </ul>
            <div className="mt-6 text-sm text-gray-600">
              <b>Emergency?</b> Call <a className="underline" href="tel:+15406990505">(540) 699-0505</a>.
            </div>
          </div>

          {/* Form */}
          <div className="relative">
            <div className="absolute -inset-4 bg-[#cc0000]/10 blur-2xl rounded-3xl" aria-hidden />
            <ClaimForm />
          </div>
        </div>
      </section>
    </main>
  );
}

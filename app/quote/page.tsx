// app/quote/page.tsx
import React from "react";
import QuoteForm from "@/components/QuoteForm";

export const metadata = {
  title: "Get a Quote | Apex Coverage",
  description: "Request a quick auto insurance quote from Apex Coverage.",
};

export default function QuotePage() {
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
              Let’s get you covered.
            </h1>
            <p className="mt-4 text-gray-600 max-w-prose">
              Fill out a few details and a licensed agent will follow up with your options.
              It takes less than a minute.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-gray-600">
              <li>✔️ No obligation</li>
              <li>✔️ Clear pricing before you buy</li>
              <li>✔️ Help from real humans</li>
            </ul>
          </div>

          {/* Quote form */}
          <div className="relative">
            <div className="absolute -inset-4 bg-[#cc0000]/10 blur-2xl rounded-3xl" aria-hidden />
            <QuoteForm />
          </div>
        </div>
      </section>
    </main>
  );
}

import React from "react";
import BuildReviewForm from "@/components/BuildReviewForm";

export const metadata = {
  title: "Start Build Review | Apex Coverage",
  description: "Request an Apex Modified Vehicle Protection review for your professionally modified street-driven vehicle.",
};

export default function BuildReviewPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(204,0,0,.10), transparent, rgba(204,0,0,.08))",
          }}
        />
        <div className="max-w-7xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10 items-start">
          <div>
            <span className="text-sm tracking-wide text-[#cc0000] font-semibold">
              APEX MODIFIED VEHICLE PROTECTION
            </span>
            <h1 className="mt-2 text-4xl md:text-5xl font-bold leading-tight">
              Start your build review.
            </h1>
            <p className="mt-4 text-gray-600 max-w-prose">
              This intake is for professionally installed aftermarket parts and street-driven enthusiast vehicles. The form is split into sections so customers are not hit with one long wall of questions.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-gray-600">
              <li>✔️ Contact and driver profile</li>
              <li>✔️ Vehicle, VIN, mileage, title status, and use</li>
              <li>✔️ Parts list, professional install details, receipts, and photos</li>
              <li>✔️ Deductible preference, tier interest, driving history, and claims history</li>
            </ul>
            <p className="mt-6 text-xs text-gray-500 max-w-prose">
              Submitting a request does not guarantee approval. Eligibility, pricing, deductible, covered parts, exclusions, and terms are determined after review.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-[#cc0000]/10 blur-2xl rounded-3xl" aria-hidden />
            <BuildReviewForm />
          </div>
        </div>
      </section>
    </main>
  );
}

import React from "react";

export const metadata = {
  title: "How It Works | Apex Coverage",
  description: "How Apex Modified Vehicle Protection reviews professionally modified street-driven vehicles.",
};

const steps = [
  {
    title: "1. Start with the vehicle",
    body: "Apex reviews the year, make, model, VIN, mileage, ZIP code, title status, annual mileage, and how the vehicle is used. A daily-driven car, weekend build, and rebuilt-title project should not be priced the same.",
  },
  {
    title: "2. Document the build",
    body: "Customers provide the parts list, receipts, photos, mileage at installation, and professional installer details. Undocumented parts and non-professional installs may be excluded from eligibility.",
  },
  {
    title: "3. Review the risk",
    body: "Apex looks at vehicle value, part value, driving history, claim history, modification level, annual mileage, title status, and deductible preference before preparing options.",
  },
  {
    title: "4. Choose the right fit",
    body: "Eligible customers are matched with a tier and deductible structure that fits the build. The goal is not a one-size-fits-all quote. It is a build-based review.",
  },
  {
    title: "5. Keep records current",
    body: "As new parts are added, customers should keep receipts, photos, installer invoices, and mileage records updated so the approved build profile stays accurate.",
  },
  {
    title: "6. File a claim when needed",
    body: "Depending on the situation and final terms, eligible claims may be handled through direct-to-shop payment or reimbursement after documentation, deductible, and review requirements are satisfied.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="relative overflow-hidden border-b">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: "linear-gradient(135deg, rgba(204,0,0,.10), transparent)" }}
        />
        <div className="relative max-w-7xl mx-auto px-4 py-16">
          <span className="text-sm tracking-wide text-[#cc0000] font-semibold">HOW IT WORKS</span>
          <h1 className="mt-2 text-4xl md:text-5xl font-bold max-w-3xl">
            A cleaner process for reviewing modified street cars.
          </h1>
          <p className="mt-4 text-gray-600 max-w-3xl">
            Apex Modified Vehicle Protection is built around documentation and risk review. A clean, professionally installed build should be treated differently than an undocumented or poorly installed one.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/build-review" className="inline-flex items-center gap-2 bg-[#cc0000] text-white px-5 py-3 rounded-md font-semibold hover:bg-red-700 transition">
              Start Build Review
            </a>
            <a href="/tiers" className="inline-flex items-center gap-2 px-5 py-3 rounded-md border font-semibold hover:bg-gray-50 transition">
              Compare Tiers
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div key={step.title} className="border rounded-2xl p-6 bg-white shadow-sm">
              <h2 className="text-xl font-semibold">{step.title}</h2>
              <p className="mt-3 text-sm text-gray-600">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 border-y">
        <div className="max-w-7xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-3xl font-bold">What Apex needs to review</h2>
            <p className="mt-3 text-gray-600">
              The more complete the documentation, the cleaner the review. Missing information does not always mean a customer is rejected, but it can affect eligibility, pricing, deductible, and exclusions.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            {[
              "VIN, year, make, model, and trim",
              "Current mileage and mileage at install",
              "ZIP code and regular garaging area",
              "Annual mileage and vehicle use",
              "Receipts and invoices",
              "Photos of installed parts",
              "Professional installer details",
              "Parts list and estimated parts value",
              "Driving history and claim history",
              "Preferred deductible",
            ].map((item) => (
              <div key={item} className="bg-white border rounded-xl p-4">✔️ {item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="border rounded-2xl p-6">
            <h2 className="text-2xl font-bold">What may be excluded</h2>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li>• Undocumented parts</li>
              <li>• Parts not installed by a professional</li>
              <li>• Pre-existing issues</li>
              <li>• Failures caused by neglect, abuse, racing, drifting, or improper installation</li>
              <li>• Unsupported or incompatible parts</li>
              <li>• Build changes that were not reported or approved</li>
            </ul>
          </div>
          <div className="border rounded-2xl p-6 bg-[#cc0000]/5">
            <h2 className="text-2xl font-bold">Why the process matters</h2>
            <p className="mt-4 text-sm text-gray-700">
              Modified vehicles are not generic. Two cars with the same year, make, and model can have completely different risk profiles based on installed parts, labor quality, mileage, use, storage, and claim history. Apex reviews the actual build so pricing and eligibility can reflect the actual vehicle.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

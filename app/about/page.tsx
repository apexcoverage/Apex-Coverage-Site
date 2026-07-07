import Link from "next/link";
import React from "react";

export const metadata = {
  title: "About | Apex Coverage",
  description:
    "Apex Coverage helps drivers document, review, and protect modified vehicles with human support and clear coverage guidance.",
  openGraph: {
    title: "About Apex Coverage",
    description:
      "A modern coverage company built for people who love what they drive.",
    url: "https://www.driveapexcoverage.com/about",
    siteName: "Apex Coverage",
  },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(120deg, rgba(204,0,0,.08), transparent, rgba(204,0,0,.12))",
          }}
        />
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
          <span className="text-sm tracking-wide text-[#cc0000] font-semibold">
            ABOUT APEX COVERAGE
          </span>
          <h1 className="mt-2 text-4xl md:text-5xl font-bold leading-tight">
            Coverage for people who actually love what they drive.
          </h1>
          <p className="mt-4 max-w-3xl text-gray-600">
            We started Apex Coverage to give enthusiast drivers a better way to
            document, review, and protect modified vehicles. No runaround. No
            mystery process. Just human guidance built around the vehicle you
            actually own and the build you actually care about.
          </p>
        </div>
      </section>

      <section className="border-t bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-14 grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <h2 className="text-2xl font-bold">Our mission</h2>
            <p className="mt-3 text-gray-600">
              Make modified vehicle protection clearer, more human, and more
              practical for drivers who put real time and money into their cars.
            </p>
          </div>
          <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
            {[
              { t: "Clarity over jargon", d: "Plain-English coverage guidance before you buy." },
              { t: "Build-first review", d: "Your parts, records, mileage, title, and use all matter." },
              { t: "Human support", d: "Agents who can walk through the build with you." },
              { t: "Privacy by default", d: "Your data is respected. We do not sell your information." },
            ].map((value) => (
              <div key={value.t} className="border rounded-xl p-5 bg-white">
                <div className="font-semibold">{value.t}</div>
                <div className="text-sm text-gray-600 mt-1">{value.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-2xl font-bold">Our story</h2>
            <p className="mt-3 text-gray-600">
              Apex Coverage began with a simple idea: people deserve a smoother
              way to protect vehicles they care about. Standard coverage
              conversations often miss what makes a modified car valuable, so
              Apex built a review process around the actual build.
            </p>
            <p className="mt-3 text-gray-600">
              Today, we serve people who drive, not just commute, with build
              reviews, standard auto coverage reviews, claims support, and help
              keeping records current.
            </p>
          </div>
          <div className="bg-gray-50 border rounded-2xl p-6">
            <h3 className="font-semibold">What we are building</h3>
            <ul className="mt-3 space-y-3 text-sm text-gray-700">
              <li>- A build-first review process</li>
              <li>- Agent-assisted document upload during coverage calls</li>
              <li>- Status lookup for build and auto coverage requests</li>
              <li>- Human claims and customer support</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-bold">How to reach us</h2>
            <p className="mt-3 text-gray-600">
              We are here to help with build reviews, coverage questions,
              documents, claims, and next steps.
            </p>
          </div>
          <div className="border rounded-2xl p-6 bg-white">
            <div className="text-sm text-gray-600">
              <div><b>Phone:</b> (540) 699-0505</div>
              <div className="mt-1"><b>Email:</b> support@driveapexcoverage.com</div>
              <div className="mt-1"><b>Address:</b> Richmond, VA</div>
            </div>
            <Link
              href="/build-review"
              className="mt-5 inline-flex items-center gap-2 bg-[#cc0000] text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-red-700"
            >
              Protect My Build
            </Link>
          </div>
        </div>
      </section>

      <section className="relative">
        <div className="absolute inset-0 bg-[#cc0000]/5 -z-10" />
        <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <h3 className="text-2xl font-bold">Ready to get covered?</h3>
          <Link
            href="/build-review"
            className="inline-flex items-center gap-2 bg-[#cc0000] text-white px-5 py-3 rounded-md font-semibold hover:bg-red-700"
          >
            Protect My Build
          </Link>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "Apex Coverage",
            url: "https://www.driveapexcoverage.com/about",
            areaServed: "US-VA",
            telephone: "(540) 699-0505",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Richmond",
              addressRegion: "VA",
              postalCode: "23219",
              addressCountry: "US",
            },
          }),
        }}
      />
    </main>
  );
}

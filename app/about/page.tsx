// app/about/page.tsx
import React from "react";

export const metadata = {
  title: "About | Apex Coverage",
  description:
    "Apex Coverage is a modern, customer-first agency built with the focus of providing coverage to real drivers. Learn our story, values, and how we can serve you.",
  openGraph: {
    title: "About Apex Coverage",
    description:
      "A modern, customer-first agency built for those who drive, not just commute.",
    url: "https://www.driveapexcoverage.com/about",
    siteName: "Apex Coverage",
  },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-[#cc0000] mb-4">
          About Apex Coverage
        </h1>
        <p className="text-gray-700">
          We started Apex Coverage to make getting auto coverage simple,
          transparent, and human — for people who love to drive.
        </p>
      </section>
    </main>
  );
}

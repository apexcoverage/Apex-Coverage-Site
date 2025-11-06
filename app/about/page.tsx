// app/about/page.tsx
export const metadata = {
  title: 'About | Apex Coverage',
  description:
    'Apex Coverage is a modern, customer-first auto insurance agency built for real drivers. Learn our story, values, and how we serve Virginia.',
  openGraph: {
    title: 'About Apex Coverage',
    description:
      'A modern, customer-first auto insurance agency built for real drivers.',
    url: 'https://www.driveapexcoverage.com/about',
    siteName: 'Apex Coverage',
  },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(120deg, rgba(204,0,0,.08), transparent, rgba(204,0,0,.12))',
          }}
        />
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
          <span className="text-sm tracking-wide text-[#cc0000] font-semibold">
            ABOUT APEX COVERAGE
          </span>
          <h1 className="mt-2 text-4xl md:text-5xl font-bold leading-tight">
            Insurance for people who actually love to drive.
          </h1>
          <p className="mt-4 max-w-3xl text-gray-600">
            We started Apex Coverage to make getting auto insurance fast,
            transparent, and human. No runaround. No mystery pricing. Just
            guidance that helps you protect what you’ve built—your car, your
            budget, and your peace of mind.
          </p>
        </div>
      </section>

      {/* Mission / Values */}
      <section className="border-t bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-14 grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <h2 className="text-2xl font-bold">Our mission</h2>
            <p className="mt-3 text-gray-600">
              Make quality auto coverage simple and attainable—without the
              pressure or jargon.
            </p>
          </div>
          <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
            {[
              { t: 'Clarity over jargon', d: 'Plain-English options before you buy.' },
              { t: 'Human support', d: 'Licensed agents who explain, not upsell.' },
              { t: 'Speed with care', d: 'Fast quotes, thoughtful coverage fit.' },
              { t: 'Privacy by default', d: 'Your data is encrypted and respected.' },
            ].map((v) => (
              <div key={v.t} className="border rounded-xl p-5 bg-white">
                <div className="font-semibold">{v.t}</div>
                <div className="text-sm text-gray-600 mt-1">{v.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-2xl font-bold">Our story</h2>
            <p className="mt-3 text-gray-600">
              Apex Coverage began with a simple idea: people deserve a smoother
              way to get insured—especially drivers who care about their cars.
              We blend modern online tools with licensed, local expertise so you
              can compare options and bind coverage without the headache.
            </p>
            <p className="mt-3 text-gray-600">
              Today we serve drivers across Virginia with quick quotes, flexible
              billing, and help when it matters most.
            </p>
          </div>
          <div className="bg-gray-50 border rounded-2xl p-6">
            <h3 className="font-semibold">Milestones</h3>
            <ul className="mt-3 space-y-3 text-sm text-gray-700">
              <li>✔️ 2025 — Launched Apex Coverage in Virginia</li>
              <li>✔️ Built a 60-second quote request with instant follow-up</li>
              <li>✔️ Added paperless billing and digital ID cards</li>
              <li>✔️ 24/7 claims support via carrier partners</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Where we operate */}
      <section className="border-t bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-bold">Where we operate</h2>
            <p className="mt-3 text-gray-600">
              We’re currently assisting drivers across <b>Virginia</b>. More
              states are on our roadmap. If you’re nearby and curious, reach out—we’ll
              keep you posted.
            </p>
          </div>
          <div className="border rounded-2xl p-6 bg-white">
            <div className="text-sm text-gray-600">
              <div><b>Phone:</b> (540) 699-0505</div>
              <div className="mt-1"><b>Email:</b> support@driveapexcoverage.com</div>
              <div className="mt-1"><b>Address:</b> Richmond, VA</div>
            </div>
            <a
              href="/#quote"
              className="mt-5 inline-flex items-center gap-2 bg-[#cc0000] text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-red-700"
            >
              Start a quote
            </a>
          </div>
        </div>
      </section>

      {/* Leadership (placeholder cards) */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold">Leadership</h2>
        <p className="mt-3 text-gray-600">
          Experienced operators and licensed agents focused on service and outcomes.
        </p>
        <div className="mt-6 grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[
            { name: 'Michael Boggs', role: 'Founder & Licensed Agent', img: '/team/michael.jpg' },
          ].map((p) => (
            <div key={p.name} className="border rounded-2xl p-5">
              <div className="h-32 bg-gray-100 rounded-lg mb-4 overflow-hidden">
                {/* Replace with <img src={p.img} .../> when you have photos */}
              </div>
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm text-gray-600">{p.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative">
        <div className="absolute inset-0 bg-[#cc0000]/5 -z-10" />
        <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <h3 className="text-2xl font-bold">Ready to get covered?</h3>
          <a
            href="/#quote"
            className="inline-flex items-center gap-2 bg-[#cc0000] text-white px-5 py-3 rounded-md font-semibold hover:bg-red-700"
          >
            Start my quote
          </a>
        </div>
      </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'InsuranceAgency',
            name: 'Apex Coverage',
            url: 'https://www.driveapexcoverage.com/about',
            areaServed: 'US-VA',
            telephone: '(540) 699-0505',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Richmond',
              addressRegion: 'VA',
              postalCode: '23219',
              addressCountry: 'US',
            },
          }),
        }}
      />
    </main>
  );
}

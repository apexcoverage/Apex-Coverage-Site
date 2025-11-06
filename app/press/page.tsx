export const metadata = { title: 'Press | Apex Coverage' };

export default function PressPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold">Press & Media</h1>
        <p className="mt-3 text-gray-600">
          For media inquiries, email <a className="underline" href="mailto:press@driveapexcoverage.com">press@driveapexcoverage.com</a>.
        </p>

        <h2 className="mt-8 text-2xl font-semibold">Brand Assets</h2>
        <div className="mt-3 space-x-3">
          <a className="underline" href="/brand/apex-logo.svg" download>Logo (SVG)</a>
          <a className="underline" href="/brand/apex-logo.png" download>Logo (PNG)</a>
        </div>

        <h2 className="mt-8 text-2xl font-semibold">Boilerplate</h2>
        <p className="mt-2 text-gray-700 text-sm">
          Apex Coverage is a modern, customer-first auto insurance agency serving Virginia.
          We make coverage fast, transparent, and human for people who love to drive.
        </p>
      </section>
    </main>
  );
}

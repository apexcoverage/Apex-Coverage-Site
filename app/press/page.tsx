export const metadata = { title: 'Press | Apex Coverage' };

export default function PressPage() {
  return (
    <main className="min-h-screen bg-[#f4f8ff] text-slate-950">
      <section className="relative isolate overflow-hidden bg-[#031326] text-white">
        <img
          src="/brand/apex-hero-road.png"
          alt="Blue modified performance vehicle on a mountain road"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#020914] via-[#031326]/88 to-[#031326]/55" />
        <div className="mx-auto max-w-5xl px-4 py-16">
          <p className="text-xs font-black uppercase tracking-[0.34em] text-blue-300">
            Press and media
          </p>
          <h1 className="mt-4 text-5xl font-black leading-tight">
            Apex Coverage brand resources.
          </h1>
          <p className="mt-5 max-w-2xl text-blue-50/85">
            For media inquiries, email{" "}
            <a className="font-black underline" href="mailto:press@driveapexcoverage.com">
              press@driveapexcoverage.com
            </a>.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">Brand Assets</h2>
            <div className="mt-4">
              <a className="font-bold text-blue-700 underline" href="/brand/apex-logo.svg" download>
                Logo SVG
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">Boilerplate</h2>
            <p className="mt-4 text-sm leading-6 text-slate-700">
              Apex Coverage is a modern, customer-first company serving those
              who drive, not just commute. We make coverage guidance fast,
              transparent, and human for people who love to drive.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

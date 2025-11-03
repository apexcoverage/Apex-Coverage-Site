'use client';
import React, { useState } from 'react';

export default function ApexCoverageSite() {
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [consent, setConsent] = useState(false);

  function FAQItem({ i, q, a }: { i: number; q: string; a: string }) {
    const open = faqOpen === i;
    return (
      <div style={{ borderBottom: '1px solid #e5e7eb' }}>
        <button
          onClick={() => setFaqOpen(open ? null : i)}
          style={{ width: '100%', padding: '16px 0', textAlign: 'left' }}
          aria-expanded={open}
        >
          <span style={{ fontWeight: 600 }}>{q}</span>
          <span style={{ float: 'right' }}>{open ? '▲' : '▼'}</span>
        </button>
        {open && <p style={{ paddingBottom: 16, color: '#4b5563' }}>{a}</p>}
      </div>
    );
  }

  function onSubmitQuote(e: React.FormEvent) {
    e.preventDefault();
    const form = new FormData(e.target as HTMLFormElement);
    if (!consent) {
      alert('Please accept the consent notice to proceed.');
      return;
    }
    const payload = Object.fromEntries(form.entries());
    console.log('Quote form submitted:', payload);
    alert('Thanks! We received your info. A certified agent will follow up shortly.');
    (e.target as HTMLFormElement).reset();
    setConsent(false);
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Top bar */}
      <div className="bg-black text-white text-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>Call for a FREE quote • Apex Coverage</span>
          </div>
          <a href="tel:+15551234567" className="hover:opacity-90">
            (540) 699-0505
          </a>
        </div>
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
        <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded" style={{ background: '#cc0000' }} />
            <span className="font-semibold tracking-tight">
              Apex <span style={{ color: '#cc0000' }}>Coverage</span>
            </span>
          </div>
          <ul className="hidden md:flex items-center gap-6 text-sm">
            <li><a href="#coverages" className="hover:text-[#cc0000]">Coverages</a></li>
            <li><a href="#why" className="hover:text-[#cc0000]">Why Apex</a></li>
            <li><a href="#reviews" className="hover:text-[#cc0000]">Reviews</a></li>
            <li><a href="#faq" className="hover:text-[#cc0000]">FAQ</a></li>
          </ul>
          <a href="#quote" className="inline-flex items-center gap-2 bg-[#cc0000] text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-red-700 transition">
            Get a Quote
          </a>
        </nav>
      </header>

      {/* Hero + Quote Card */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(135deg, rgba(204,0,0,.10), transparent, rgba(204,0,0,.10))'
        }}/>
        <div className="max-w-7xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Insurance built for real drivers.<br/>
              <span className="text-[#cc0000]">Protect what you build.</span>
            </h1>
            <p className="mt-4 text-gray-600 max-w-prose">
              Simple, reliable auto coverage — customized for your car, your drive, and your budget. For those who drive, not just commute.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#quote" className="inline-flex items-center gap-2 bg-[#cc0000] text-white px-5 py-3 rounded-md font-semibold hover:bg-red-700 transition">
                Start my quote
              </a>
              <a href="#why" className="inline-flex items-center gap-2 px-5 py-3 rounded-md border font-semibold hover:bg-gray-50 transition">
                How it works
              </a>
            </div>
            <div className="mt-6 flex items-center gap-6 text-sm text-gray-600">
              <span>🛡️ 24/7 Claims</span>
              <span>💳 Flexible billing</span>
              <span>🔒 Secure & private</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-[#cc0000]/10 blur-2xl rounded-3xl" aria-hidden />
            <div className="relative bg-white border rounded-2xl shadow-xl p-6" id="quote">
              <h3 className="text-xl font-semibold mb-1">Get your quick quote</h3>
              <p className="text-sm text-gray-600 mb-4">Takes less than 60 seconds. A certified agent will follow up.</p>

              <form onSubmit={onSubmitQuote} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-sm">Full name</label>
                  <input name="name" required className="w-full mt-1 border rounded-md px-3 py-2" placeholder="Jane Driver" />
                </div>
                <div>
                  <label className="text-sm">Email</label>
                  <input type="email" name="email" required className="w-full mt-1 border rounded-md px-3 py-2" placeholder="jane@example.com" />
                </div>
                <div>
                  <label className="text-sm">Phone</label>
                  <input name="phone" required className="w-full mt-1 border rounded-md px-3 py-2" placeholder="(540) 699-0505" />
                </div>
                <div>
                  <label className="text-sm">ZIP</label>
                  <input name="zip" pattern="\d{5}" required className="w-full mt-1 border rounded-md px-3 py-2" placeholder="23219" />
                </div>
                <div>
                  <label className="text-sm">Date of birth</label>
                  <input type="date" name="dob" required className="w-full mt-1 border rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm">Vehicle year</label>
                  <input name="year" required className="w-full mt-1 border rounded-md px-3 py-2" placeholder="2022" />
                </div>
                <div>
                  <label className="text-sm">Make</label>
                  <input name="make" required className="w-full mt-1 border rounded-md px-3 py-2" placeholder="Toyota" />
                </div>
                <div>
                  <label className="text-sm">Model</label>
                  <input name="model" required className="w-full mt-1 border rounded-md px-3 py-2" placeholder="Camry" />
                </div>
                <div className="sm:col-span-2">
                  <label className="inline-flex items-start gap-2 text-xs text-gray-600">
                    <input type="checkbox" checked={consent} onChange={(e)=>setConsent(e.target.checked)} className="mt-1" />
                    <span>By submitting, you consent to be contacted by Apex Coverage via phone, email, or text regarding your quote request. Consent not required for purchase.</span>
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <button className="w-full bg-[#cc0000] hover:bg-red-700 text-white font-semibold py-2.5 rounded-md">See my estimate</button>
                </div>
                <p className="sm:col-span-2 text-[11px] text-gray-500">This is an estimate only. Final premium is dependent on underwriting approval.</p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Icons Strip */}
      <section className="border-t bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm text-gray-600">
          <div>⏱️ 24/7 Claims</div>
          <div>🛡️ A+ Support</div>
          <div>🚗 Enthusiast-friendly</div>
          <div>✨ Fast online service</div>
        </div>
      </section>

      {/* Coverages */}
      <section id="coverages" className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold">Coverage that fits your life</h2>
            <p className="mt-3 text-gray-600">Choose your protection level and fine-tune deductibles. We’ll help you balance price and protection in plain English.</p>
            <ul className="mt-6 space-y-3">
              {[
                { t: 'Liability', d: 'Meets state requirements and protects you from at-fault damages.' },
                { t: 'Comprehensive', d: 'Theft, weather, vandalism, glass — the unexpected stuff.' },
                { t: 'Collision', d: 'Your car vs. another object — with your deductible choice.' },
                { t: 'UM/UIM', d: 'If the other driver doesn’t have enough coverage, you still do.' },
                { t: 'Medical Payments', d: 'Helps with medical costs regardless of fault.' },
              ].map((x) => (
                <li key={x.t} className="flex items-start gap-3">
                  <div className="mt-0.5">✔️</div>
                  <div>
                    <div className="font-medium">{x.t}</div>
                    <div className="text-gray-600 text-sm">{x.d}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: 'Customizable limits', body: 'Dial in limits and deductibles that match your budget.' },
              { title: 'Flexible billing', body: 'Monthly, pay-in-full, or autopay with reminders.' },
              { title: 'Multi-car savings', body: 'Add vehicles or drivers and stack discounts.' },
              { title: 'Fast documents', body: 'Instant proof of insurance and digital ID cards.' },
            ].map((c) => (
              <div key={c.title} className="border rounded-xl p-5 hover:shadow-md transition">
                <div className="mt-2 font-semibold">{c.title}</div>
                <div className="text-sm text-gray-600">{c.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Apex */}
      <section id="why" className="bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold">
              Why choose <span className="text-[#cc0000]">Apex</span>?
            </h2>
            <p className="mt-3 text-gray-600">
              We pair modern online convenience with real humans. No gimmicks. No surprises. Just coverage that works when you need it.
            </p>
            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              {[
                { t: 'Certified agents', s: 'Talk to experts who explain, not upsell.' },
                { t: 'Clear pricing', s: 'Transparent options before you buy.' },
                { t: 'Claims help', s: 'Guidance from first call to settlement.' },
                { t: 'Data privacy', s: 'Your info stays secure and encrypted.' },
              ].map((x) => (
                <div key={x.t} className="flex items-start gap-3">
                  <div className="mt-0.5">🛡️</div>
                  <div>
                    <div className="font-medium">{x.t}</div>
                    <div className="text-sm text-gray-600">{x.s}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative border rounded-2xl p-6 bg-white">
            <div className="absolute -inset-2 rounded-2xl" style={{
              backgroundImage: 'linear-gradient(120deg, rgba(204,0,0,.12), transparent, rgba(204,0,0,.12))'
            }}/>
            <h3 className="font-semibold">Switch & save in minutes</h3>
            <p className="text-sm text-gray-600">Have a policy already? We’ll review it and show you options side-by-side.</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>✔️ Cancel-safe onboarding</li>
              <li>✔️ No hidden fees</li>
              <li>✔️ Digital ID cards</li>
            </ul>
            <a href="#quote" className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#cc0000] text-white font-semibold hover:bg-red-700">
              Start my quote
            </a>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold">What drivers say</h2>
        <div className="mt-6 grid md:grid-cols-3 gap-6">
          {['Straightforward and fast.', 'I was surprised how affordable it was.', 'Switched and saved $28/mo.'].map((t, i) => (
            <div key={i} className="border rounded-xl p-5">
              <div>★★★★★</div>
              <p className="mt-3 text-gray-700">“{t}”</p>
              <div className="mt-4 text-sm text-gray-500">— Verified customer</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold">FAQs</h2>
          <div className="mt-4">
            <FAQItem i={0} q="How fast can I get coverage?" a="In most cases, digital ID cards are available immediately after binding and payment." />
            <FAQItem i={1} q="Do you cover modified or performance cars?" a="Yes. We’ll review your build list and work with your enthusiast needs." />
            <FAQItem i={2} q="Can I change my deductibles later?" a="Absolutely. Adjustments can be made at renewal or mid-term in most cases." />
            <FAQItem i={3} q="How do claims work?" a="Report a claim 24/7. We coordinate with the carrier and keep you updated from start to finish." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative">
        <div className="absolute inset-0 bg-[#cc0000]/5 -z-10" />
        <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <h3 className="text-2xl font-bold">Ready to get covered?</h3>
          <a href="#quote" className="inline-flex items-center gap-2 bg-[#cc0000] text-white px-5 py-3 rounded-md font-semibold hover:bg-red-700">
            Start my quote
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded" style={{ background: '#cc0000' }} />
              <span className="font-semibold text-white">Apex Coverage</span>
            </div>
            <p className="mt-3 text-sm">For those who drive, not just commute.</p>
          </div>
          <div>
            <div className="font-semibold text-white">Company</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li><a href="#">About</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Press</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-white">Support</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li><a href="#">Make a claim</a></li>
              <li><a href="#">Billing</a></li>
              <li><a href="#">Help center</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-white">Contact</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li>(540) 699-0505</li>
              <li>support@driveapexcoverage.com</li>
              <li>571 Rolling St, Richmond, VA</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-6 text-xs text-gray-400">
            © {new Date().getFullYear()} Apex Coverage. All rights reserved. Policy forms and rates subject final approval. This site provides general info and is not a binding offer of insurance. <a href="#" className="underline">Privacy</a> • <a href="#" className="underline">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}




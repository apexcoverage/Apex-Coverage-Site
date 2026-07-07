'use client';

import React, { useRef, useState } from 'react';

const steps = ['Contact', 'Vehicle', 'Build', 'Coverage', 'Submit'];

export default function BuildReviewForm() {
  const [step, setStep] = useState(0);
  const [consent, setConsent] = useState(false);
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const formRef = useRef<HTMLFormElement | null>(null);

  function validateCurrentStep() {
    const form = formRef.current;
    if (!form) return false;
    const currentPanel = form.querySelector(`[data-step="${step}"]`);
    if (!currentPanel) return false;

    const fields = currentPanel.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      'input, select, textarea'
    );

    for (const field of Array.from(fields)) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return false;
      }
    }

    return true;
  }

  function goNext() {
    if (!validateCurrentStep()) return;
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function goBack() {
    setStep((current) => Math.max(current - 1, 0));
  }

  async function onSubmitBuildReview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;

    if (!consent) {
      alert('Please accept the consent notice before submitting.');
      return;
    }

    const fd = new FormData(formEl);
    fd.set('type', 'build-review');
    fd.set('consent', consent ? 'true' : 'false');

    try {
      setFormStatus('submitting');
      const res = await fetch('/api/build-review', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || data?.ok !== true) throw new Error(data?.error || 'Upstream error');

      setFormStatus('success');
      formEl.reset();
      setConsent(false);
      setStep(0);
    } catch (err) {
      console.error(err);
      setFormStatus('error');
    }
  }

  if (formStatus === 'success') {
    return (
      <div className="relative bg-white border rounded-2xl shadow-xl p-6 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold">
          OK
        </div>
        <h3 className="mt-4 text-2xl font-semibold text-green-700">Build Review Submitted</h3>
        <p className="mt-2 text-gray-700">
          Thanks. Apex will review the vehicle, documented parts, deductible preference,
          coverage goals, and risk details before following up.
        </p>
        <button
          onClick={() => setFormStatus('idle')}
          className="mt-6 bg-[#cc0000] text-white px-6 py-2 rounded-md font-semibold hover:bg-red-700"
        >
          Start Another Build Review
        </button>
      </div>
    );
  }

  return (
    <div className="relative bg-white border rounded-2xl shadow-xl p-6">
      <div className="flex items-center justify-between gap-2 mb-5">
        {steps.map((label, index) => (
          <div key={label} className="flex-1">
            <div
              className={`h-2 rounded-full ${index <= step ? 'bg-[#cc0000]' : 'bg-gray-200'}`}
              aria-hidden
            />
            <div className={`mt-1 text-[11px] ${index === step ? 'font-semibold text-[#cc0000]' : 'text-gray-500'}`}>
              {label}
            </div>
          </div>
        ))}
      </div>

      <h3 className="text-xl font-semibold mb-1">Start your build review</h3>
      <p className="text-sm text-gray-600 mb-4">
        Step {step + 1} of {steps.length}: fill out one section at a time, then submit on the last step.
      </p>

      {formStatus === 'error' && (
        <div className="mb-3 rounded-md bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
          We could not submit your build review. Please try again in a moment or email{' '}
          <a className="underline" href="mailto:support@driveapexcoverage.com">
            support@driveapexcoverage.com
          </a>.
        </div>
      )}

      <form ref={formRef} onSubmit={onSubmitBuildReview}>
        <section data-step="0" className={step === 0 ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'hidden'}>
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
            <label className="text-sm">ZIP code</label>
            <input name="zip" pattern="\d{5}" required className="w-full mt-1 border rounded-md px-3 py-2" placeholder="23219" />
          </div>
          <div>
            <label className="text-sm">Date of birth</label>
            <input type="date" name="dob" required className="w-full mt-1 border rounded-md px-3 py-2" />
          </div>
        </section>

        <section data-step="1" className={step === 1 ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'hidden'}>
          <div>
            <label className="text-sm">Vehicle year</label>
            <input name="year" required className="w-full mt-1 border rounded-md px-3 py-2" placeholder="2022" />
          </div>
          <div>
            <label className="text-sm">Make</label>
            <input name="make" required className="w-full mt-1 border rounded-md px-3 py-2" placeholder="Subaru" />
          </div>
          <div>
            <label className="text-sm">Model</label>
            <input name="model" required className="w-full mt-1 border rounded-md px-3 py-2" placeholder="WRX" />
          </div>
          <div>
            <label className="text-sm">VIN</label>
            <input name="vin" required className="w-full mt-1 border rounded-md px-3 py-2" placeholder="17-character VIN" />
          </div>
          <div>
            <label className="text-sm">Current mileage</label>
            <input name="mileage" required className="w-full mt-1 border rounded-md px-3 py-2" placeholder="48,000" />
          </div>
          <div>
            <label className="text-sm">Estimated annual mileage</label>
            <select name="annualMileage" required className="w-full mt-1 border rounded-md px-3 py-2">
              <option value="">Select one</option>
              <option value="under-5000">Under 5,000 miles</option>
              <option value="5000-10000">5,000-10,000 miles</option>
              <option value="10000-15000">10,000-15,000 miles</option>
              <option value="15000-plus">15,000+ miles</option>
            </select>
          </div>
          <div>
            <label className="text-sm">Title status</label>
            <select name="titleStatus" required className="w-full mt-1 border rounded-md px-3 py-2">
              <option value="">Select one</option>
              <option value="clean">Clean title</option>
              <option value="rebuilt">Rebuilt title</option>
              <option value="salvage">Salvage title</option>
              <option value="not-sure">Not sure</option>
            </select>
          </div>
          <div>
            <label className="text-sm">How is it used?</label>
            <select name="vehicleUse" required className="w-full mt-1 border rounded-md px-3 py-2">
              <option value="">Select one</option>
              <option value="daily-driver">Daily driver</option>
              <option value="weekend-car">Weekend car</option>
              <option value="show-car">Show car / meets</option>
              <option value="mixed-use">Mixed use</option>
            </select>
          </div>
        </section>

        <section data-step="2" className={step === 2 ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'hidden'}>
          <div className="sm:col-span-2">
            <label className="text-sm">Parts or build list</label>
            <textarea
              name="partsList"
              required
              rows={5}
              className="w-full mt-1 border rounded-md px-3 py-2"
              placeholder="Example: coilovers, wheels/tires, intake, exhaust, tune, turbo kit, upgraded brakes, audio, body kit..."
            />
          </div>
          <div>
            <label className="text-sm">Estimated value of parts</label>
            <select name="partsValue" required className="w-full mt-1 border rounded-md px-3 py-2">
              <option value="">Select one</option>
              <option value="under-2500">Under $2,500</option>
              <option value="2500-5000">$2,500-$5,000</option>
              <option value="5000-10000">$5,000-$10,000</option>
              <option value="10000-25000">$10,000-$25,000</option>
              <option value="25000-plus">$25,000+</option>
            </select>
          </div>
          <div>
            <label className="text-sm">Install status</label>
            <select name="professionalInstallStatus" required className="w-full mt-1 border rounded-md px-3 py-2">
              <option value="">Select one</option>
              <option value="all-professional">All listed parts were professionally installed</option>
              <option value="mostly-professional">Mostly professional, some details need review</option>
              <option value="not-sure">Not sure</option>
              <option value="diy">Some DIY installs</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm">Shop / installer names</label>
            <textarea
              name="installerInfo"
              rows={3}
              className="w-full mt-1 border rounded-md px-3 py-2"
              placeholder="List the shops or installers used, if known."
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm">Documentation available</label>
            <div className="mt-2 grid sm:grid-cols-2 gap-2 text-sm text-gray-700">
              {['Receipts', 'Photos', 'VIN', 'Mileage at install', 'Installer invoice', 'Maintenance records', 'Still gathering docs'].map((item) => (
                <label key={item} className="inline-flex items-center gap-2 border rounded-md px-3 py-2">
                  <input type="checkbox" name="documentation" value={item} />
                  {item}
                </label>
              ))}
            </div>
          </div>
        </section>

        <section data-step="3" className={step === 3 ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'hidden'}>
          <div>
            <label className="text-sm">Tier you are interested in</label>
            <select name="tierInterest" required className="w-full mt-1 border rounded-md px-3 py-2">
              <option value="">Select one</option>
              <option value="street">Street Tier</option>
              <option value="street-plus">Street+ Tier</option>
              <option value="apex-build">Apex Build Tier</option>
              <option value="not-sure">Not sure yet</option>
            </select>
          </div>
          <div>
            <label className="text-sm">Preferred deductible</label>
            <select name="deductible" required className="w-full mt-1 border rounded-md px-3 py-2">
              <option value="">Select one</option>
              <option value="250">$250</option>
              <option value="500">$500</option>
              <option value="1000">$1,000</option>
              <option value="2500">$2,500</option>
              <option value="custom">Custom / higher deductible</option>
            </select>
          </div>
          <div>
            <label className="text-sm">Driving history</label>
            <select name="drivingHistory" required className="w-full mt-1 border rounded-md px-3 py-2">
              <option value="">Select one</option>
              <option value="clean">Clean record</option>
              <option value="minor">Minor violations</option>
              <option value="accident">Recent accident or claim</option>
              <option value="multiple">Multiple incidents</option>
              <option value="prefer-discuss">Prefer to discuss</option>
            </select>
          </div>
          <div>
            <label className="text-sm">Past claim history</label>
            <select name="claimHistory" required className="w-full mt-1 border rounded-md px-3 py-2">
              <option value="">Select one</option>
              <option value="none">No recent claims</option>
              <option value="one">One recent claim</option>
              <option value="multiple">Multiple recent claims</option>
              <option value="not-sure">Not sure</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm">Possible discounts / notes</label>
            <textarea
              name="discountNotes"
              rows={3}
              className="w-full mt-1 border rounded-md px-3 py-2"
              placeholder="Example: garage kept, low mileage, anti-theft, multi-vehicle, preferred shop, current Apex customer..."
            />
          </div>
          <div className="sm:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="autoInsuranceReview" value="yes" />
              I would also like Apex to review my standard auto coverage options.
            </label>
          </div>
        </section>

        <section data-step="4" className={step === 4 ? 'grid grid-cols-1 gap-3' : 'hidden'}>
          <div className="rounded-xl border bg-gray-50 p-4">
            <h4 className="font-semibold">Before you submit</h4>
            <p className="mt-2 text-sm text-gray-600">
              Apex will use this information to review eligibility, documentation,
              risk, deductible preference, and possible tier fit. Submitting this
              form does not guarantee approval or final pricing.
            </p>
            <ul className="mt-3 space-y-1 text-sm text-gray-700">
              <li>- Documented parts are easier to review.</li>
              <li>- Salvage or rebuilt vehicles may require stricter review and higher pricing.</li>
              <li>- Undocumented parts may be excluded.</li>
              <li>- If an agent asks for receipts or photos during a call, use the document upload link they provide.</li>
            </ul>
          </div>
          <label className="inline-flex items-start gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1"
            />
            <span>
              By submitting, you consent to be contacted by Apex Coverage via
              phone, email, or text regarding your build review. Consent is not
              required for purchase.
            </span>
          </label>
        </section>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0 || formStatus === 'submitting'}
            className="px-4 py-2 rounded-md border font-semibold disabled:opacity-40"
          >
            Back
          </button>

          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="ml-auto bg-[#cc0000] hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-md"
            >
              Next
            </button>
          ) : (
            <button
              className="ml-auto bg-[#cc0000] hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-md disabled:opacity-50"
              disabled={formStatus === 'submitting'}
            >
              {formStatus === 'submitting' ? 'Submitting...' : 'Submit my build review'}
            </button>
          )}
        </div>

        <p className="mt-4 text-[11px] text-gray-500">
          Apex Modified Vehicle Protection is subject to review, documentation,
          eligibility, deductible selection, and final terms. Standard auto
          coverage is available separately.
        </p>
      </form>
    </div>
  );
}

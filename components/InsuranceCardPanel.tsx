"use client";

import { useEffect, useMemo, useState } from "react";
import {
  insuranceCardMissingFields,
  parseCardVehicles,
  type InsuranceCardPolicy,
} from "@/lib/insuranceCards";

function displayDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value || "-";
  const [year, month, day] = value.split("-");
  return `${month}/${day}/${year}`;
}

export function InsuranceCardPanel({
  policy,
  onEdit,
}: {
  policy: InsuranceCardPolicy;
  onEdit: () => void;
}) {
  const [verified, setVerified] = useState(false);
  const missing = useMemo(() => insuranceCardMissingFields(policy), [policy]);
  const vehicles = useMemo(() => parseCardVehicles(policy), [policy]);

  useEffect(() => setVerified(false), [policy]);

  return (
    <section className="card" id="insurance-cards">
      <div className="card-header card-header-with-actions">
        <div>
          <h2>Auto Insurance Cards</h2>
          <p className="subtitle">Create one printable card for each insured vehicle.</p>
        </div>
        <button type="button" className="btn-secondary" onClick={onEdit}>
          Edit Card Details
        </button>
      </div>
      <div className="card-body">
        {missing.length ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-semibold">Complete these items from the issued auto policy:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {missing.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <p className="mt-3">New York and California require state-specific card formats. Use the approved insurer card for those states.</p>
          </div>
        ) : (
          <>
            <label className="mb-4 flex items-start gap-3 text-sm leading-6 text-slate-700">
              <input
                className="mt-1"
                type="checkbox"
                checked={verified}
                onChange={(event) => setVerified(event.target.checked)}
              />
              <span>I verified the insurer, NAIC number, policy period, and each VIN against the issued auto policy.</span>
            </label>
            <button type="button" className="btn-primary" disabled={!verified} onClick={() => window.print()}>
              Print Insurance Cards / Save PDF
            </button>
            {verified && (
              <div className="apex-card-print mt-6">
                {vehicles.map((vehicle, index) => (
                  <div className="apex-insurance-card" key={`${vehicle.vin}-${index}`}>
                    <div className="apex-insurance-card-header">
                      <div>
                        <div className="apex-insurance-card-eyebrow">{policy.policyState} AUTO INSURANCE</div>
                        <strong>Insurance Identification Card</strong>
                      </div>
                      <img src="/Apex_Shield_Email.png" alt="Apex Coverage shield" />
                    </div>
                    <div className="apex-insurance-card-grid">
                      <div><span>Insured</span><strong>{policy.name}</strong></div>
                      <div><span>Policy number</span><strong>{policy.policyNumber}</strong></div>
                      <div><span>Effective</span><strong>{displayDate(policy.effectiveDate)}</strong></div>
                      <div><span>Expires</span><strong>{displayDate(policy.expirationDate)}</strong></div>
                      <div><span>Year / Make / Model</span><strong>{vehicle.year} {vehicle.make} {vehicle.model}</strong></div>
                      <div><span>VIN</span><strong className="apex-card-vin">{vehicle.vin}</strong></div>
                    </div>
                    <div className="apex-insurance-card-footer">
                      <div><b>Issuing insurer:</b> {policy.issuerName} &nbsp; <b>NAIC:</b> {policy.issuerNaic}<br />{policy.issuerAddress}</div>
                      <div className="apex-insurance-card-phone">844-398-2739</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <style jsx global>{`
        .apex-card-print { display: flex; flex-wrap: wrap; gap: 18px; }
        .apex-insurance-card { box-sizing: border-box; width: min(100%, 7.25in); min-height: 3.15in; border: 2px solid #0b3269; border-radius: 7px; background: #fff; color: #10213d; padding: 16px 19px; font-family: Arial, sans-serif; break-inside: avoid; }
        .apex-insurance-card-header { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding-bottom: 9px; border-bottom: 2px solid #1677ff; }
        .apex-insurance-card-header strong { display: block; font-size: 18px; line-height: 1.2; }
        .apex-insurance-card-header img { width: 43px; height: 43px; object-fit: contain; }
        .apex-insurance-card-eyebrow { color: #125eb9; font-size: 10px; font-weight: 800; letter-spacing: .12em; }
        .apex-insurance-card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; padding: 12px 0; }
        .apex-insurance-card-grid span { display: block; color: #516174; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }
        .apex-insurance-card-grid strong { display: block; margin-top: 3px; font-size: 13px; overflow-wrap: anywhere; }
        .apex-card-vin { letter-spacing: .05em; }
        .apex-insurance-card-footer { display: flex; justify-content: space-between; align-items: flex-end; gap: 10px; padding-top: 9px; border-top: 1px solid #cbd5e1; font-size: 10px; line-height: 1.4; }
        .apex-insurance-card-phone { font-size: 13px; font-weight: 800; white-space: nowrap; }
        @media print {
          @page { size: letter portrait; margin: .45in; }
          body * { visibility: hidden !important; }
          .apex-card-print, .apex-card-print * { visibility: visible !important; }
          .apex-card-print { display: block; position: absolute; top: 0; left: 0; width: 100%; margin: 0 !important; }
          .apex-insurance-card { width: 7.25in; min-height: 3.15in; margin: 0 0 .25in 0; box-shadow: none; page-break-inside: avoid; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </section>
  );
}

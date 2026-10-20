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
  onEditContact,
}: {
  policy: InsuranceCardPolicy;
  onEdit: () => void;
  onEditContact: () => void;
}) {
  const [verified, setVerified] = useState(false);
  const [copies, setCopies] = useState(1);
  const missing = useMemo(() => insuranceCardMissingFields(policy), [policy]);
  const vehicles = useMemo(() => parseCardVehicles(policy), [policy]);
  const cardSheets = useMemo(() => {
    const cards = vehicles.flatMap((vehicle) => Array.from({ length: copies }, () => vehicle));
    return Array.from({ length: Math.ceil(cards.length / 4) }, (_, index) => cards.slice(index * 4, index * 4 + 4));
  }, [vehicles, copies]);

  useEffect(() => setVerified(false), [policy]);

  return (
    <section className="card" id="insurance-cards">
      <div className="card-header card-header-with-actions">
        <div>
          <h2>Internal Auto Card Drafts</h2>
          <p className="subtitle">Review one draft for each vehicle. These are not proof of insurance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={onEditContact}>Edit Mailing Address</button>
          <button type="button" className="btn-secondary" onClick={onEdit}>Edit Policy &amp; Vehicles</button>
        </div>
      </div>
      <div className="card-body">
        <p className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm font-bold text-red-900">
          Internal draft only. Do not give these cards to customers or law enforcement.
        </p>
        {missing.length ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-semibold">Complete these items from the issued auto policy:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {missing.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <p className="mt-3">The issuing insurer and policy details must be checked against an actual auto policy before any official card is issued.</p>
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
              <span>I understand this is an internal draft, not valid proof of insurance.</span>
            </label>
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                Copies per vehicle
                <select
                  className="rounded border border-slate-300 bg-white px-3 py-2"
                  value={copies}
                  onChange={(event) => setCopies(Number(event.target.value))}
                >
                  <option value={1}>1 copy</option>
                  <option value={2}>2 copies</option>
                  <option value={4}>4 copies</option>
                </select>
              </label>
              <button type="button" className="btn-primary" disabled={!verified} onClick={() => window.print()}>
                Print Internal Draft / Save PDF
              </button>
            </div>
            {verified && (
              <div className="apex-card-print mt-6">
                {cardSheets.map((sheet, sheetIndex) => (
                  <div className="apex-card-sheet" key={sheetIndex}>
                    {sheet.map((vehicle, cardIndex) => (
                      <div className="apex-insurance-card" key={`${vehicle.vin}-${sheetIndex}-${cardIndex}`}>
                        <div className="apex-insurance-card-header">
                          <div>
                            <div className="apex-insurance-card-eyebrow">{policy.state?.toUpperCase()} AUTO POLICY DATA REVIEW</div>
                            <strong>Apex Coverage</strong>
                          </div>
                          <img src="/Apex_Shield_Email.png" alt="Apex Coverage shield" />
                        </div>
                        <div className="apex-insurance-card-grid">
                          <div><span>Covered</span><strong>{policy.name}</strong></div>
                          <div><span>Policy number</span><strong>{policy.policyNumber}</strong></div>
                          <div><span>Effective</span><strong>{displayDate(policy.effectiveDate)}</strong></div>
                          <div><span>Expires</span><strong>{displayDate(policy.expirationDate)}</strong></div>
                          <div><span>Year / Make / Model</span><strong>{vehicle.year} {vehicle.make} {vehicle.model}</strong></div>
                          <div><span>VIN</span><strong className="apex-card-vin">{vehicle.vin}</strong></div>
                          <div className="apex-insurance-card-address"><span>Covered mailing address</span><strong>{[policy.addressLine1, policy.addressLine2, [policy.city, policy.state?.toUpperCase()].filter(Boolean).join(", ") + ` ${policy.zip}`].filter(Boolean).join(", ")}</strong></div>
                        </div>
                        <div className="apex-insurance-card-footer">
                          <div><b>Apex Coverage</b> &nbsp; <b>NAIC:</b> {policy.issuerNaic}<br />Richmond, VA</div>
                          <div className="apex-insurance-card-phone">844-398-2739</div>
                        </div>
                        <div className="apex-insurance-card-warning">INTERNAL DRAFT - NOT VALID PROOF OF INSURANCE</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <style jsx global>{`
        .apex-card-print { display: flex; flex-direction: column; gap: 20px; }
        .apex-card-sheet { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; width: min(100%, 10.2in); }
        .apex-insurance-card { box-sizing: border-box; display: flex; flex-direction: column; width: 100%; min-width: 0; min-height: 3.75in; border: 2px solid #0b3269; border-radius: 7px; background: #fff; color: #10213d; padding: 12px 14px; font-family: Arial, sans-serif; break-inside: avoid; }
        .apex-insurance-card-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding-bottom: 8px; border-bottom: 2px solid #1677ff; }
        .apex-insurance-card-header strong { display: block; font-size: 16px; line-height: 1.2; }
        .apex-insurance-card-header img { width: 36px; height: 36px; object-fit: contain; }
        .apex-insurance-card-eyebrow { color: #125eb9; font-size: 9px; font-weight: 800; letter-spacing: .08em; }
        .apex-insurance-card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; padding: 10px 0; }
        .apex-insurance-card-grid span { display: block; color: #516174; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; }
        .apex-insurance-card-grid strong { display: block; margin-top: 2px; font-size: 11px; overflow-wrap: anywhere; }
        .apex-insurance-card-address { grid-column: 1 / -1; }
        .apex-card-vin { letter-spacing: .03em; }
        .apex-insurance-card-footer { display: flex; justify-content: space-between; align-items: flex-end; gap: 8px; padding-top: 7px; border-top: 1px solid #cbd5e1; font-size: 9px; line-height: 1.3; }
        .apex-insurance-card-phone { font-size: 11px; font-weight: 800; white-space: nowrap; }
        .apex-insurance-card-warning { margin-top: auto; padding-top: 8px; color: #b91c1c; text-align: center; font-size: 9px; font-weight: 900; letter-spacing: .04em; }
        @media (max-width: 720px) { .apex-card-sheet { grid-template-columns: 1fr; } }
        @media print {
          @page { size: letter landscape; margin: .35in; }
          body * { visibility: hidden !important; }
          .apex-card-print, .apex-card-print * { visibility: visible !important; }
          .apex-card-print { display: block; position: absolute; top: 0; left: 0; width: 10.2in; margin: 0 !important; }
          .apex-card-sheet { display: grid; grid-template-columns: repeat(2, 5in); grid-template-rows: repeat(2, 3.75in); gap: .2in; width: 10.2in; height: 7.7in; margin: 0; break-after: page; page-break-after: always; }
          .apex-card-sheet:last-child { break-after: auto; page-break-after: auto; }
          .apex-insurance-card { width: 5in; height: 3.75in; min-height: 0; box-shadow: none; page-break-inside: avoid; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </section>
  );
}

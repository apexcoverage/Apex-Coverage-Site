import PizZip from "pizzip";

export type CoverageDocumentType = "auto" | "build";

export type AutoCoverageDocumentData = {
  type: "auto";
  customerName?: string;
  email?: string;
  phone?: string;
  zip?: string;
  agent?: string;
  policyNumber?: string;
  mailingAddress?: string;
  effectiveDate?: string;
  policyPeriodStart?: string;
  policyPeriodEnd?: string;
  status?: string;
  coverage?: string;
  deductibles?: string;
  discounts?: string;
  renewalDate?: string;
  monthlyPremium?: string;
  vehicles?: string[] | string;
  generatedAt?: string;
};

export type BuildProtectionDocumentData = {
  type: "build";
  customerName?: string;
  email?: string;
  phone?: string;
  zip?: string;
  agent?: string;
  planNumber?: string;
  status?: string;
  year?: string;
  make?: string;
  model?: string;
  vin?: string;
  mileage?: string;
  annualMileage?: string;
  titleStatus?: string;
  vehicleUse?: string;
  partsList?: string;
  partsValue?: string;
  installStatus?: string;
  installerInfo?: string;
  documentation?: string;
  tierInterest?: string;
  deductible?: string;
  drivingHistory?: string;
  claimHistory?: string;
  discountNotes?: string;
  generatedAt?: string;
};

export type CoverageDocumentData =
  | AutoCoverageDocumentData
  | BuildProtectionDocumentData;

const BRAND_RED = "CC0000";
const BRAND_DARK = "111827";
const BRAND_MID = "374151";
const BRAND_LIGHT = "F3F4F6";
const BORDER = "D1D5DB";
const TEXT_MUTED = "6B7280";

function clean(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function escapeXml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizeList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => clean(item)).filter(Boolean);
  }

  return clean(value)
    .split(/\r?\n|[|;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeDiscounts(value: unknown): string[] {
  return clean(value)
    .split(/\r?\n|[|,;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeVehicleLines(value: unknown): string[] {
  return normalizeList(value);
}

function formatDate(value?: string) {
  const text = clean(value);
  if (!text) return "Pending confirmation";

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatCurrency(value?: string) {
  const text = clean(value);
  if (!text) return "Pending confirmation";

  const amount = Number(text.replace(/[$,\s]/g, ""));
  if (!Number.isFinite(amount)) return text;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function splitLinesForRun(text: string) {
  return text.split(/\r?\n/);
}

function run(
  text: string,
  options: {
    bold?: boolean;
    italic?: boolean;
    color?: string;
    size?: number;
    caps?: boolean;
  } = {}
) {
  const props = [
    '<w:rFonts w:ascii="Aptos" w:hAnsi="Aptos" w:cs="Aptos"/>',
    options.bold ? "<w:b/>" : "",
    options.italic ? "<w:i/>" : "",
    options.caps ? "<w:caps/>" : "",
    options.color ? `<w:color w:val="${options.color}"/>` : "",
    options.size ? `<w:sz w:val="${options.size}"/>` : "",
    options.size ? `<w:szCs w:val="${options.size}"/>` : "",
  ]
    .filter(Boolean)
    .join("");

  const lines = splitLinesForRun(text);
  const body = lines
    .map((line, index) => {
      const br = index === 0 ? "" : "<w:br/>";
      return `${br}<w:t xml:space="preserve">${escapeXml(line)}</w:t>`;
    })
    .join("");

  return `<w:r><w:rPr>${props}</w:rPr>${body}</w:r>`;
}

function paragraph(
  content: string,
  options: {
    style?: string;
    align?: "left" | "center" | "right";
    bold?: boolean;
    italic?: boolean;
    color?: string;
    size?: number;
    before?: number;
    after?: number;
    spacing?: number;
    keepNext?: boolean;
    caps?: boolean;
  } = {}
) {
  const pPr = [
    options.style ? `<w:pStyle w:val="${options.style}"/>` : "",
    options.align ? `<w:jc w:val="${options.align}"/>` : "",
    options.keepNext ? "<w:keepNext/>" : "",
    `<w:spacing w:before="${options.before ?? 0}" w:after="${
      options.after ?? 120
    }" w:line="${options.spacing ?? 276}" w:lineRule="auto"/>`,
  ]
    .filter(Boolean)
    .join("");

  return `<w:p><w:pPr>${pPr}</w:pPr>${run(content, options)}</w:p>`;
}

function mixedParagraph(
  pieces: Array<{
    text: string;
    bold?: boolean;
    italic?: boolean;
    color?: string;
    size?: number;
  }>,
  options: { before?: number; after?: number; spacing?: number } = {}
) {
  const pPr = `<w:spacing w:before="${options.before ?? 0}" w:after="${
    options.after ?? 120
  }" w:line="${options.spacing ?? 276}" w:lineRule="auto"/>`;
  return `<w:p><w:pPr>${pPr}</w:pPr>${pieces
    .map((piece) => run(piece.text, piece))
    .join("")}</w:p>`;
}

function heading(text: string) {
  return paragraph(text, {
    bold: true,
    color: BRAND_DARK,
    size: 26,
    before: 280,
    after: 90,
    keepNext: true,
  });
}

function subheading(text: string) {
  return paragraph(text, {
    bold: true,
    color: BRAND_MID,
    size: 22,
    before: 160,
    after: 70,
    keepNext: true,
  });
}

function pageBreak() {
  return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
}

function cell(
  content: string,
  options: {
    width?: number;
    fill?: string;
    color?: string;
    bold?: boolean;
    align?: "left" | "center" | "right";
    size?: number;
  } = {}
) {
  const width = options.width ?? 2600;
  const fill = options.fill ? `<w:shd w:fill="${options.fill}"/>` : "";
  const color = options.color || BRAND_DARK;
  const cellParagraph = paragraph(content, {
    bold: options.bold,
    color,
    size: options.size ?? 20,
    align: options.align,
    after: 0,
    spacing: 240,
  });

  return `<w:tc>
    <w:tcPr>
      <w:tcW w:w="${width}" w:type="dxa"/>
      <w:tcMar>
        <w:top w:w="120" w:type="dxa"/>
        <w:left w:w="140" w:type="dxa"/>
        <w:bottom w:w="120" w:type="dxa"/>
        <w:right w:w="140" w:type="dxa"/>
      </w:tcMar>
      <w:vAlign w:val="center"/>
      ${fill}
      <w:tcBorders>
        <w:top w:val="single" w:sz="6" w:space="0" w:color="${BORDER}"/>
        <w:left w:val="single" w:sz="6" w:space="0" w:color="${BORDER}"/>
        <w:bottom w:val="single" w:sz="6" w:space="0" w:color="${BORDER}"/>
        <w:right w:val="single" w:sz="6" w:space="0" w:color="${BORDER}"/>
      </w:tcBorders>
    </w:tcPr>
    ${cellParagraph}
  </w:tc>`;
}

function table(
  rows: string[][],
  options: {
    widths?: number[];
    header?: boolean;
    compact?: boolean;
  } = {}
) {
  const widths = options.widths || rows[0]?.map(() => Math.floor(10080 / rows[0].length)) || [];
  const body = rows
    .map((row, rowIndex) => {
      const isHeader = options.header && rowIndex === 0;
      return `<w:tr>${row
        .map((value, index) =>
          cell(value, {
            width: widths[index],
            fill: isHeader ? BRAND_DARK : rowIndex % 2 === 0 ? "FFFFFF" : "F9FAFB",
            color: isHeader ? "FFFFFF" : BRAND_DARK,
            bold: isHeader || index === 0,
            size: options.compact ? 18 : 20,
          })
        )
        .join("")}</w:tr>`;
    })
    .join("");

  return `<w:tbl>
    <w:tblPr>
      <w:tblW w:w="10080" w:type="dxa"/>
      <w:tblLayout w:type="fixed"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="6" w:space="0" w:color="${BORDER}"/>
        <w:left w:val="single" w:sz="6" w:space="0" w:color="${BORDER}"/>
        <w:bottom w:val="single" w:sz="6" w:space="0" w:color="${BORDER}"/>
        <w:right w:val="single" w:sz="6" w:space="0" w:color="${BORDER}"/>
        <w:insideH w:val="single" w:sz="6" w:space="0" w:color="${BORDER}"/>
        <w:insideV w:val="single" w:sz="6" w:space="0" w:color="${BORDER}"/>
      </w:tblBorders>
    </w:tblPr>
    ${body}
  </w:tbl>
  ${paragraph("", { after: 80 })}`;
}

function twoColumnFacts(rows: Array<[string, string]>) {
  const pairedRows: string[][] = [];
  for (let index = 0; index < rows.length; index += 2) {
    const left = rows[index];
    const right = rows[index + 1] || ["", ""];
    pairedRows.push([left[0], left[1], right[0], right[1]]);
  }

  return table(pairedRows, {
    widths: [2200, 2840, 2200, 2840],
    compact: true,
  });
}

function sectionText(title: string, body: string) {
  return `${subheading(title)}${paragraph(body, {
    color: BRAND_MID,
    size: 20,
    after: 130,
  })}`;
}

function bulletList(items: string[]) {
  return items
    .map((item) =>
      mixedParagraph(
        [
          { text: "- ", color: BRAND_RED, bold: true },
          { text: item, color: BRAND_MID },
        ],
        { after: 60 }
      )
    )
    .join("");
}

function makeDocumentNumber(prefix: string, value?: string) {
  const seed = clean(value, "PENDING").replace(/[^A-Za-z0-9-]/g, "");
  return `${prefix}-${seed || "PENDING"}`;
}

function coverBlock(title: string, subtitle: string, rows: Array<[string, string]>) {
  return `
    ${paragraph("APEX COVERAGE", {
      bold: true,
      color: BRAND_RED,
      size: 22,
      caps: true,
      after: 40,
    })}
    ${paragraph(title, {
      style: "Title",
      bold: true,
      color: BRAND_DARK,
      size: 42,
      after: 100,
    })}
    ${paragraph(subtitle, {
      color: BRAND_MID,
      size: 22,
      after: 260,
    })}
    ${twoColumnFacts(rows)}
  `;
}

function contactRows(input: CoverageDocumentData): Array<[string, string]> {
  return [
    ["Customer", clean(input.customerName, "Customer name pending")],
    ["Email", clean(input.email, "Not on file")],
    ["Phone", clean(input.phone, "Not on file")],
    ["ZIP", clean(input.zip, "Not on file")],
    ["Apex agent", clean(input.agent, "Unassigned")],
    ["Generated", formatDate(input.generatedAt)],
  ];
}

function autoVehicleRows(input: AutoCoverageDocumentData) {
  const vehicles = normalizeVehicleLines(input.vehicles);
  if (!vehicles.length) return [["1", "Vehicle schedule pending"]];
  return vehicles.map((vehicle, index) => [String(index + 1), vehicle]);
}

function buildPartsRows(input: BuildProtectionDocumentData) {
  const parts = normalizeList(input.partsList);
  if (!parts.length) return [["Pending", "Parts schedule will be completed during review."]];
  return parts.map((part, index) => [String(index + 1), part]);
}

function parseAutoVehicleLine(line: string) {
  const trimmed = clean(line);
  if (!trimmed) {
    return {
      vin: "",
      year: "",
      make: "",
      model: "",
      vehicle: "Vehicle schedule pending",
    };
  }

  const parts = trimmed.split(/\s+/);
  const first = parts[0] || "";
  const second = parts[1] || "";
  const looksLikeVin =
    /^[A-HJ-NPR-Z0-9]{11,17}$/i.test(first) ||
    /^[A-HJ-NPR-Z0-9-]{11,20}$/i.test(first);
  const yearIndex = looksLikeVin ? 1 : 0;
  const looksLikeYear = /^\d{4}$/.test(parts[yearIndex] || "");

  if (looksLikeVin) {
    return {
      vin: first,
      year: looksLikeYear ? second : "",
      make: parts[2] || "",
      model: parts.slice(3).join(" "),
      vehicle: trimmed,
    };
  }

  if (looksLikeYear) {
    return {
      vin: "",
      year: parts[0] || "",
      make: parts[1] || "",
      model: parts.slice(2).join(" "),
      vehicle: trimmed,
    };
  }

  return {
    vin: "",
    year: "",
    make: parts[0] || "",
    model: parts.slice(1).join(" "),
    vehicle: trimmed,
  };
}

function autoVehicleDeclarationRows(input: AutoCoverageDocumentData) {
  const vehicles = normalizeVehicleLines(input.vehicles);
  if (!vehicles.length) {
    return [["1", "Pending", "Pending", "Pending", "Vehicle schedule pending"]];
  }

  return vehicles.map((vehicle, index) => {
    const parsed = parseAutoVehicleLine(vehicle);
    return [
      String(index + 1),
      clean(parsed.vin, "Not on file"),
      clean(parsed.year, "-"),
      clean(parsed.make, "-"),
      clean(parsed.model || parsed.vehicle, "-"),
    ];
  });
}

function compDeductible(value?: string) {
  const text = clean(value);
  if (!text) return "$500";
  const match = text.match(/comp(?:rehensive)?[^$0-9]*([$]?\d[\d,]*)/i);
  return match?.[1] || "$500";
}

function collisionDeductible(value?: string) {
  const text = clean(value);
  if (!text) return "$1,000";
  const match = text.match(/coll(?:ision)?[^$0-9]*([$]?\d[\d,]*)/i);
  return match?.[1] || "$1,000";
}

function autoCoverageScheduleRows(input: AutoCoverageDocumentData) {
  return [
    ["Coverage Type", "Limits", "Deductible", "Premium Allocation"],
    ["Bodily Injury Liability", "$50,000", "N/A", "26%"],
    ["Property Damage Liability", "$25,000", "N/A", "13%"],
    ["Medical Payments", "$1,000", "N/A", "1%"],
    ["Uncovered / Undercovered Motorist", "$25,000", "N/A", "9%"],
    ["Comprehensive", "Cash Value Less Deductible", compDeductible(input.deductibles), "25%"],
    ["Collision", "Cash Value Less Deductible", collisionDeductible(input.deductibles), "26%"],
  ];
}

function policySection(title: string, paragraphs: string[]) {
  return `${heading(title)}${paragraphs
    .map((text) =>
      paragraph(text, {
        color: BRAND_MID,
        size: 20,
        after: 110,
      })
    )
    .join("")}`;
}

function autoDocumentBody(input: AutoCoverageDocumentData) {
  const policyNumber = clean(input.policyNumber, "Pending");
  const discounts = normalizeDiscounts(input.discounts);
  const effectiveDate = clean(
    input.effectiveDate || input.policyPeriodStart,
    "Pending confirmation"
  );
  const periodStart = clean(input.policyPeriodStart || input.effectiveDate, "Pending confirmation");
  const periodEnd = clean(input.policyPeriodEnd || input.renewalDate, "Pending confirmation");
  const mailingAddress = clean(
    input.mailingAddress,
    input.zip ? `ZIP ${input.zip}` : "Pending confirmation"
  );
  const titleRows: Array<[string, string]> = [
    ["Document", makeDocumentNumber("APX-AUTO", policyNumber)],
    ["Policy number", policyNumber],
    ["Named covered", clean(input.customerName, "Customer name pending")],
    ["Total premium", formatCurrency(input.monthlyPremium)],
    ["Effective date", effectiveDate],
  ];

  return `
    ${coverBlock(
      "Auto Coverage Declarations And Policy Packet",
      "For those who drive, not just commute. This packet contains the declarations page, coverage schedule, policy terms, claims instructions, and Apex contact information for the auto coverage record shown below.",
      titleRows
    )}
    ${heading("Declarations Page")}
    ${twoColumnFacts([
      ["Named Covered", clean(input.customerName, "Customer name pending")],
      ["Mailing Address", mailingAddress],
      ["Policy Number", policyNumber],
      ["Effective Date", effectiveDate],
      [
        "Policy Period",
        `From ${periodStart} to ${periodEnd}, 12:01 A.M. local time at the named address.`,
      ],
      ["Apex Contact", "844-398-2739"],
    ])}
    ${heading("Covered Auto Schedule")}
    ${table([["#", "VIN", "Year", "Make", "Model"], ...autoVehicleDeclarationRows(input)], {
      header: true,
      widths: [700, 2500, 1100, 1900, 3880],
    })}
    ${heading("Coverage Schedule")}
    ${table(autoCoverageScheduleRows(input), {
      header: true,
      widths: [3100, 3100, 1900, 1980],
    })}
    ${heading("Premium And Discounts")}
    ${table(
      [
        ["Item", "Recorded detail"],
        ["Total Premium", formatCurrency(input.monthlyPremium)],
        ["Deductibles Recorded", clean(input.deductibles, "See coverage schedule")],
        ["Coverage Selection", clean(input.coverage, "See coverage schedule")],
        ["Policy Discounts", discounts.length ? discounts.join("\n") : "No discounts recorded."],
      ],
      { header: true, widths: [2700, 7380] }
    )}
    ${pageBreak()}
    ${policySection(
      "Section I Coverage Agreement",
      [
        "Apex Coverage agrees to provide the coverages shown on the Declarations Page in consideration of the required premium and subject to the terms, conditions, limitations, and exclusions contained in this packet and any final written coverage documents.",
        "Coverage applies only to the specific coverages, limits, deductibles, covered autos, named covered, and policy period shown on the Declarations Page or later written endorsement.",
      ]
    )}
    ${policySection(
      "Section II Definitions",
      [
        '"You" and "your" mean the Named Covered shown on the Declarations Page and, when applicable, a spouse residing in the same household.',
        '"Covered Auto" means the vehicle or vehicles described on the Declarations Page, including an eligible replacement auto, additional auto, or temporary substitute auto when accepted under the applicable coverage rules.',
        '"Bodily injury" means bodily harm, sickness, disease, or death sustained by a person.',
        '"Property damage" means physical injury to, destruction of, or loss of use of tangible property.',
      ]
    )}
    ${policySection(
      "Section III Liability Coverage",
      [
        "Subject to the terms and exclusions of this packet, liability coverage applies to covered damages for bodily injury or property damage for which a covered person becomes legally responsible because of an auto accident involving a Covered Auto.",
        "Apex or the applicable carrier may investigate, negotiate, defend, and settle covered claims or suits. The duty to defend ends when the applicable limit of liability has been exhausted by payment of judgments or settlements.",
        "Liability coverage does not apply to intentional acts, property owned by or transported by a covered person, use for hire or delivery, racing, speed contests, organized competitive driving, or other excluded uses.",
      ]
    )}
    ${policySection(
      "Section IV Medical Payments Coverage",
      [
        "Subject to the terms and exclusions of this packet, medical payments coverage applies to reasonable and necessary medical or funeral expenses incurred because of bodily injury caused by an auto accident and sustained while occupying or being struck by a Covered Auto.",
        "This coverage does not apply to injury sustained while occupying a vehicle with fewer than four wheels, while using a vehicle as a public or livery conveyance, or during employment when workers compensation or similar benefits are available.",
      ]
    )}
    ${policySection(
      "Section V Uncovered Or Undercovered Motorist Coverage",
      [
        "Subject to the terms and exclusions of this packet, uncovered or undercovered motorist coverage applies when a covered person is legally entitled to recover compensatory damages from the owner or operator of an uncovered, undercovered, or hit-and-run vehicle.",
        "The legal entitlement to recover damages may be established by agreement with Apex or the applicable carrier, or by judgment entered by a court with proper authority.",
      ]
    )}
    ${policySection(
      "Section VI Comprehensive Coverage",
      [
        "Subject to the terms and exclusions of this packet, comprehensive coverage applies to direct and accidental loss to a Covered Auto other than collision, including fire, theft, vandalism, glass breakage, contact with a bird or animal, weather-related events, falling objects, explosion, and other covered causes of loss.",
        "For each covered comprehensive loss, the deductible shown on the Declarations Page applies separately to each vehicle and each occurrence.",
      ]
    )}
    ${policySection(
      "Section VII Collision Coverage",
      [
        "Subject to the terms and exclusions of this packet, collision coverage applies to direct and accidental loss to a Covered Auto caused by collision with another object, upset, or overturn.",
        "For each covered collision loss, the deductible shown on the Declarations Page applies separately to each vehicle and each occurrence.",
      ]
    )}
    ${pageBreak()}
    ${policySection(
      "Section VIII Duties After An Accident Or Loss",
      [
        "You must notify Apex promptly of how, when, and where the accident or loss occurred. Notice should be provided as soon as practical after the event giving rise to the claim.",
        "You must cooperate fully in the investigation, adjustment, settlement, or defense of any claim. This includes providing access to records, witnesses, photos, estimates, statements, and other relevant information requested.",
        "You must promptly forward every notice, demand, summons, lawsuit, or other legal paper received in connection with any claim or suit.",
        "Upon request, you must submit to examination under oath and sign the transcript as often as reasonably required.",
        "Failure to comply with required duties may result in partial or total denial of coverage to the extent permitted by applicable law.",
      ]
    )}
    ${policySection(
      "Section IX Exclusions",
      [
        "Coverage does not apply to intentional, willful, or deliberate acts that result in or are intended to result in injury, property damage, or loss.",
        "Coverage does not apply to illegal activities, use of a Covered Auto in the commission of an illegal act, racing, speed contests, organized competitive driving, use for hire, delivery for compensation, or other excluded uses.",
        "Coverage does not apply to normal wear and tear, gradual deterioration, corrosion, rust, freezing, mechanical breakdown, electrical failure, defects in materials or workmanship, or confiscation, seizure, impoundment, destruction, or requisition by government authority.",
      ]
    )}
    ${policySection(
      "Section X General Conditions",
      [
        "No change, modification, or waiver of any term or condition is valid unless made by written endorsement or updated written coverage document issued by Apex or the applicable carrier.",
        "No interest in this coverage may be assigned, transferred, or otherwise conveyed without prior written consent. Any attempted transfer without consent is void.",
        "The Named Covered may request cancellation by written notice. Apex or the applicable carrier may cancel or decline renewal only in accordance with applicable law and required notice.",
        "Renewal is subject to review, continued eligibility, payment status, claim history, vehicle use, and applicable program rules.",
        "A claim filed within the first six months after the effective date or reinstatement may be subject to additional eligibility and documentation review. Any deductible adjustment, surcharge, or claim limitation will apply only to the extent permitted by applicable law and final written terms.",
      ]
    )}
    ${policySection(
      "Section XI Important Notices",
      [
        "This packet is prepared from information available in the Apex customer record. Final coverage terms, carrier documents, endorsements, invoices, state notices, and written amendments control if there is any conflict.",
        "For customer care, call 844-398-2739 or email support@driveapexcoverage.com. For claim-specific support, email claims@driveapexcoverage.com.",
      ]
    )}
    ${heading("Service And Claims Instructions")}
    ${bulletList([
      "Keep this packet with your current coverage records.",
      "Contact Apex before changing vehicles, drivers, garaging address, payment method, or coverage selections.",
      "Report claims as soon as practical and preserve photos, police reports, repair estimates, and related records.",
      "Call Apex at 844-398-2739 or email support@driveapexcoverage.com for customer care.",
      "For claim-specific support, email claims@driveapexcoverage.com.",
    ])}
  `;
}

function buildDocumentBody(input: BuildProtectionDocumentData) {
  const planNumber = clean(input.planNumber, "Pending");
  const vehicle = [input.year, input.make, input.model]
    .map((item) => clean(item))
    .filter(Boolean)
    .join(" ");
  const titleRows: Array<[string, string]> = [
    ["Document", makeDocumentNumber("APX-MVP", planNumber)],
    ["Protection plan", planNumber],
    ["Customer", clean(input.customerName, "Customer name pending")],
    ["Vehicle", clean(vehicle, "Vehicle pending")],
    ["Parts value", clean(input.partsValue, "Pending confirmation")],
  ];

  return `
    ${coverBlock(
      "Modified Vehicle Protection Packet",
      "This packet contains the approved build profile, documented parts schedule, deductible selection, claims instructions, and customer responsibilities for Apex Modified Vehicle Protection.",
      titleRows
    )}
    ${heading("Customer And Service Information")}
    ${twoColumnFacts(contactRows(input))}
    ${heading("Vehicle And Build Profile")}
    ${twoColumnFacts([
      ["Vehicle", clean(vehicle, "Vehicle pending")],
      ["VIN", clean(input.vin, "Not on file")],
      ["Current mileage", clean(input.mileage, "Not on file")],
      ["Annual mileage", clean(input.annualMileage, "Not on file")],
      ["Title status", clean(input.titleStatus, "Not on file")],
      ["Vehicle use", clean(input.vehicleUse, "Not on file")],
      ["Tier interest", clean(input.tierInterest, "Pending confirmation")],
      ["Deductible", clean(input.deductible, "Pending confirmation")],
    ])}
    ${heading("Covered Build Schedule")}
    ${table([["#", "Documented part or upgrade"], ...buildPartsRows(input)], {
      header: true,
      widths: [900, 9180],
    })}
    ${heading("Documentation And Installation")}
    ${table(
      [
        ["Item", "Recorded detail"],
        ["Documented parts value", clean(input.partsValue, "Pending confirmation")],
        ["Install status", clean(input.installStatus, "Pending confirmation")],
        ["Installer information", clean(input.installerInfo, "Not on file")],
        ["Documentation", clean(input.documentation, "Pending confirmation")],
        ["Discount notes", clean(input.discountNotes, "No discount notes recorded.")],
      ],
      { header: true, widths: [2700, 7380] }
    )}
    ${pageBreak()}
    ${heading("Protection Terms Summary")}
    ${sectionText(
      "What This Packet Does",
      "This packet summarizes the build information currently recorded by Apex. It helps the customer and agent review the vehicle, documented parts, estimated build value, deductible preference, and supporting records before final terms are issued."
    )}
    ${sectionText(
      "What Must Stay Current",
      "The customer should keep receipts, photos, mileage records, invoices, installer details, and new part updates current with Apex. Newly added parts may need review before they are included in the approved build profile."
    )}
    ${sectionText(
      "Important Protection Note",
      "Apex Modified Vehicle Protection is subject to review, approval, documentation, deductibles, exclusions, claim facts, and final written terms. Undocumented parts, undisclosed modifications, racing use, illegal use, wear and tear, and prior damage may be excluded."
    )}
    ${heading("Driving And Claim History")}
    ${twoColumnFacts([
      ["Driving history", clean(input.drivingHistory, "Not on file")],
      ["Claim history", clean(input.claimHistory, "Not on file")],
      ["Claims support", "claims@driveapexcoverage.com"],
      ["Customer care", "844-398-2739"],
    ])}
    ${heading("Customer Responsibilities")}
    ${bulletList([
      "Keep receipts, photos, invoices, mileage records, and installer details current with Apex.",
      "Contact Apex before adding major parts, changing vehicle use, racing, tracking, selling, or transferring the vehicle.",
      "Report claims as soon as practical and preserve damaged parts until Apex or the applicable administrator confirms next steps.",
      "Call Apex at 844-398-2739 or email support@driveapexcoverage.com for customer care.",
      "For claim-specific support, email claims@driveapexcoverage.com.",
    ])}
  `;
}

function documentXml(input: CoverageDocumentData) {
  const body = input.type === "auto" ? autoDocumentBody(input) : buildDocumentBody(input);

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
    <w:body>
      ${body}
      <w:sectPr>
        <w:headerReference w:type="default" r:id="rIdHeader1"/>
        <w:footerReference w:type="default" r:id="rIdFooter1"/>
        <w:pgSz w:w="12240" w:h="15840"/>
        <w:pgMar w:top="720" w:right="1080" w:bottom="720" w:left="1080" w:header="360" w:footer="360" w:gutter="0"/>
        <w:cols w:space="720"/>
        <w:docGrid w:linePitch="360"/>
      </w:sectPr>
    </w:body>
  </w:document>`;
}

function headerXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    ${paragraph("APEX COVERAGE", {
      bold: true,
      color: BRAND_RED,
      size: 18,
      after: 0,
      spacing: 220,
    })}
  </w:hdr>`;
}

function footerXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    ${paragraph(
      "Apex Coverage | 844-398-2739 | support@driveapexcoverage.com | driveapexcoverage.com",
      {
        color: TEXT_MUTED,
        size: 16,
        align: "center",
        after: 0,
        spacing: 220,
      }
    )}
  </w:ftr>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
      <w:name w:val="Normal"/>
      <w:qFormat/>
      <w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr>
      <w:rPr>
        <w:rFonts w:ascii="Aptos" w:hAnsi="Aptos" w:cs="Aptos"/>
        <w:sz w:val="20"/>
        <w:szCs w:val="20"/>
        <w:color w:val="${BRAND_DARK}"/>
      </w:rPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="Title">
      <w:name w:val="Title"/>
      <w:qFormat/>
      <w:pPr><w:spacing w:after="120"/></w:pPr>
      <w:rPr>
        <w:rFonts w:ascii="Aptos Display" w:hAnsi="Aptos Display" w:cs="Aptos"/>
        <w:b/>
        <w:sz w:val="42"/>
        <w:szCs w:val="42"/>
        <w:color w:val="${BRAND_DARK}"/>
      </w:rPr>
    </w:style>
  </w:styles>`;
}

function settingsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:zoom w:percent="100"/>
    <w:defaultTabStop w:val="720"/>
  </w:settings>`;
}

function contentTypesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
    <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
    <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
    <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
    <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
    <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
    <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  </Types>`;
}

function rootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
    <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
    <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
  </Relationships>`;
}

function documentRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
    <Relationship Id="rIdSettings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
    <Relationship Id="rIdHeader1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
    <Relationship Id="rIdFooter1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
  </Relationships>`;
}

function appXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
    <Application>Apex Coverage</Application>
    <DocSecurity>0</DocSecurity>
    <ScaleCrop>false</ScaleCrop>
    <Company>Apex Coverage</Company>
    <LinksUpToDate>false</LinksUpToDate>
    <SharedDoc>false</SharedDoc>
    <HyperlinksChanged>false</HyperlinksChanged>
    <AppVersion>1.0</AppVersion>
  </Properties>`;
}

function coreXml(input: CoverageDocumentData) {
  const title =
    input.type === "auto"
      ? "Apex Auto Coverage Packet"
      : "Apex Modified Vehicle Protection Packet";
  const now = new Date().toISOString();

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>Apex Coverage</dc:creator>
    <cp:lastModifiedBy>Apex Coverage</cp:lastModifiedBy>
    <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
    <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
  </cp:coreProperties>`;
}

export function buildCoverageDocumentBuffer(input: CoverageDocumentData): Buffer {
  const documentInput = {
    ...input,
    generatedAt: input.generatedAt || new Date().toISOString(),
  } as CoverageDocumentData;
  const zip = new PizZip();

  zip.file("[Content_Types].xml", contentTypesXml());
  zip.folder("_rels")?.file(".rels", rootRelsXml());
  zip.folder("docProps")?.file("core.xml", coreXml(documentInput));
  zip.folder("docProps")?.file("app.xml", appXml());

  const word = zip.folder("word");
  word?.file("document.xml", documentXml(documentInput));
  word?.file("styles.xml", stylesXml());
  word?.file("settings.xml", settingsXml());
  word?.file("header1.xml", headerXml());
  word?.file("footer1.xml", footerXml());
  word?.folder("_rels")?.file("document.xml.rels", documentRelsXml());

  return zip.generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });
}

export function getCoverageDocumentFilename(input: CoverageDocumentData) {
  const name = clean(input.customerName, "customer")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = input.type === "auto" ? "auto-coverage-packet" : "build-protection-packet";
  return `${name || "customer"}-${suffix}.docx`;
}

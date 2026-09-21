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

function autoDocumentBody(input: AutoCoverageDocumentData) {
  const policyNumber = clean(input.policyNumber, "Pending");
  const discounts = normalizeDiscounts(input.discounts);
  const titleRows: Array<[string, string]> = [
    ["Document", makeDocumentNumber("APX-AUTO", policyNumber)],
    ["Policy number", policyNumber],
    ["Customer", clean(input.customerName, "Customer name pending")],
    ["Status", clean(input.status, "Pending")],
    ["Monthly premium", formatCurrency(input.monthlyPremium)],
    ["Renewal date", formatDate(input.renewalDate)],
  ];

  return `
    ${coverBlock(
      "Auto Coverage Packet",
      "A customer-facing summary of the auto coverage record, vehicle schedule, billing status, and service instructions currently recorded by Apex.",
      titleRows
    )}
    ${heading("Customer And Service Information")}
    ${twoColumnFacts(contactRows(input))}
    ${heading("Vehicle Schedule")}
    ${table([["#", "Covered vehicle"], ...autoVehicleRows(input)], {
      header: true,
      widths: [900, 9180],
    })}
    ${heading("Coverage Summary")}
    ${table(
      [
        ["Item", "Recorded detail"],
        ["Coverage selected", clean(input.coverage, "Pending confirmation")],
        ["Deductibles", clean(input.deductibles, "Pending confirmation")],
        [
          "Premium",
          `${formatCurrency(input.monthlyPremium)} monthly unless updated by Apex or the carrier.`,
        ],
        [
          "Discounts",
          discounts.length ? discounts.join("\n") : "No discounts recorded yet.",
        ],
      ],
      { header: true, widths: [2700, 7380] }
    )}
    ${sectionText(
      "Important Coverage Note",
      "This packet summarizes information currently recorded by Apex. It is not a replacement for the final carrier coverage contract, declarations, endorsements, invoices, exclusions, or state-specific notices. If any item conflicts with final carrier documents, the final carrier documents control."
    )}
    ${pageBreak()}
    ${heading("Service And Claims Instructions")}
    ${bulletList([
      "Keep this packet with your current coverage records.",
      "Contact Apex before changing vehicles, drivers, garaging address, payment method, or coverage selections.",
      "Report claims as soon as practical and preserve photos, police reports, repair estimates, and related records.",
      "Call Apex at 844-398-2739 or email support@driveapexcoverage.com for customer care.",
      "For claim-specific support, email claims@driveapexcoverage.com.",
    ])}
    ${heading("Agent Review Checklist")}
    ${table(
      [
        ["Review item", "Status"],
        ["Customer contact information reviewed", "Pending agent confirmation"],
        ["Vehicle schedule reviewed", "Pending agent confirmation"],
        ["Premium and billing setup reviewed", "Pending agent confirmation"],
        ["Final carrier documents delivered or scheduled", "Pending agent confirmation"],
      ],
      { header: true, widths: [6000, 4080] }
    )}
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
    ["Status", clean(input.status, "Pending")],
    ["Vehicle", clean(vehicle, "Vehicle pending")],
    ["Parts value", clean(input.partsValue, "Pending confirmation")],
  ];

  return `
    ${coverBlock(
      "Modified Vehicle Protection Packet",
      "A customer-facing summary of the approved build profile, documented parts, deductible preference, and customer responsibilities for Apex Modified Vehicle Protection.",
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
    ${heading("Agent Review Checklist")}
    ${table(
      [
        ["Review item", "Status"],
        ["Vehicle identity reviewed", "Pending agent confirmation"],
        ["Parts schedule reviewed", "Pending agent confirmation"],
        ["Receipts/photos/documentation reviewed", "Pending agent confirmation"],
        ["Tier and deductible reviewed with customer", "Pending agent confirmation"],
        ["Final protection terms delivered or scheduled", "Pending agent confirmation"],
      ],
      { header: true, widths: [6000, 4080] }
    )}
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

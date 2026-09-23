import PizZip from "pizzip";
import {
  buildCoverageDocumentBuffer,
  getCoverageDocumentFilename,
  type CoverageDocumentData,
} from "./coverageDocumentBuilder";

type PdfTextLine = {
  text: string;
  heading?: boolean;
};

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_X = 54;
const MARGIN_TOP = 54;
const MARGIN_BOTTOM = 54;
const BODY_SIZE = 10;
const HEADING_SIZE = 12;
const BODY_LINE_HEIGHT = 14;
const HEADING_LINE_HEIGHT = 17;
const TEXT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function normalizePdfText(value: string) {
  return value
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/•/g, "-")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function escapePdfString(value: string) {
  return normalizePdfText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function stripXmlText(block: string) {
  const tokens = block.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>|<w:br\/>/g);
  let text = "";

  for (const token of tokens) {
    if (token[0] === "<w:br/>") {
      text += "\n";
    } else {
      text += decodeXml(token[1] || "");
    }
  }

  return normalizePdfText(text);
}

function looksLikeHeading(text: string) {
  if (/^Section [IVX]+ /i.test(text)) return true;
  if (/^(Declarations Page|Covered Auto Schedule|Coverage Schedule|Premium And Discounts)$/i.test(text)) {
    return true;
  }
  if (/^(Your Contact And Plan Information|Vehicle And Build Profile|Covered Build Schedule)$/i.test(text)) {
    return true;
  }
  if (/^(Documentation And Protection Details|Driving And Claim History|Service And Claims Instructions)$/i.test(text)) {
    return true;
  }
  return /^Packet Details$/i.test(text);
}

function extractCoverageLinesFromDocx(input: CoverageDocumentData) {
  const docx = buildCoverageDocumentBuffer(input);
  const zip = new PizZip(docx);
  const documentXml = zip.file("word/document.xml")?.asText() || "";
  const bodyMatch = documentXml.match(/<w:body>([\s\S]*?)<w:sectPr>/);
  const body = bodyMatch?.[1] || documentXml;
  const blockRegex = /<w:tbl>[\s\S]*?<\/w:tbl>|<w:p>[\s\S]*?<\/w:p>/g;
  const lines: PdfTextLine[] = [];

  for (const blockMatch of body.matchAll(blockRegex)) {
    const block = blockMatch[0];

    if (block.startsWith("<w:tbl>")) {
      const tableRows = [...block.matchAll(/<w:tr>[\s\S]*?<\/w:tr>/g)]
        .map((rowMatch) => {
          const cells = [...rowMatch[0].matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)]
            .map((cellMatch) => stripXmlText(cellMatch[0]))
            .filter(Boolean);
          return cells.join("  |  ");
        })
        .filter(Boolean);

      if (tableRows.length) {
        lines.push({ text: "" });
        tableRows.forEach((row, index) =>
          lines.push({ text: row, heading: index === 0 })
        );
        lines.push({ text: "" });
      }
      continue;
    }

    const text = stripXmlText(block);
    if (text) {
      lines.push({ text, heading: looksLikeHeading(text) });
    }

    if (block.includes('w:type="page"')) {
      lines.push({ text: "" });
    }
  }

  return lines;
}

function wrapText(text: string, maxChars: number) {
  const words = normalizePdfText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (word.length > maxChars) {
      if (current) {
        lines.push(current);
        current = "";
      }
      for (let index = 0; index < word.length; index += maxChars) {
        lines.push(word.slice(index, index + maxChars));
      }
      continue;
    }

    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function maxCharsForSize(size: number) {
  return Math.max(34, Math.floor(TEXT_WIDTH / (size * 0.52)));
}

function drawText(text: string, x: number, y: number, size: number, bold = false) {
  const font = bold ? "F2" : "F1";
  return `BT /${font} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${escapePdfString(text)}) Tj ET`;
}

function buildPageStreams(lines: PdfTextLine[]) {
  const pages: string[][] = [];
  let ops: string[] = [];
  let y = PAGE_HEIGHT - MARGIN_TOP;

  function finishPage() {
    const pageNumber = pages.length + 1;
    ops.push(drawText(`Apex Coverage | 844-398-2739 | Page ${pageNumber}`, MARGIN_X, 28, 8));
    pages.push(ops);
    ops = [];
    y = PAGE_HEIGHT - MARGIN_TOP;
  }

  function ensureSpace(height: number) {
    if (y - height < MARGIN_BOTTOM) {
      finishPage();
    }
  }

  for (const line of lines) {
    if (!line.text) {
      y -= 8;
      if (y < MARGIN_BOTTOM) finishPage();
      continue;
    }

    const size = line.heading ? HEADING_SIZE : BODY_SIZE;
    const lineHeight = line.heading ? HEADING_LINE_HEIGHT : BODY_LINE_HEIGHT;
    const wrapped = wrapText(line.text, maxCharsForSize(size));

    ensureSpace(wrapped.length * lineHeight + (line.heading ? 6 : 0));

    for (const text of wrapped) {
      ops.push(drawText(text, MARGIN_X, y, size, line.heading));
      y -= lineHeight;
    }

    if (line.heading) y -= 4;
  }

  if (ops.length) finishPage();
  return pages;
}

function buildPdf(objects: string[]) {
  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = Buffer.byteLength(pdf, "latin1");
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += "0000000000 65535 f \n";

  for (let index = 1; index < objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}

export function buildCoveragePdfBuffer(input: CoverageDocumentData): Buffer {
  const lines = extractCoverageLinesFromDocx(input);
  const pageStreams = buildPageStreams(lines);
  const objects = ["", "<< /Type /Catalog /Pages 2 0 R >>", ""];

  const regularFontRef = objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const boldFontRef = objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const pageRefs: string[] = [];

  for (const streamLines of pageStreams) {
    const stream = streamLines.join("\n");
    const contentRef = objects.push(
      `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`
    );
    const pageRef = objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${regularFontRef} 0 R /F2 ${boldFontRef} 0 R >> >> /Contents ${contentRef} 0 R >>`
    );
    pageRefs.push(`${pageRef} 0 R`);
  }

  objects[2] = `<< /Type /Pages /Kids [${pageRefs.join(" ")}] /Count ${pageRefs.length} >>`;

  return buildPdf(objects);
}

export function getCoveragePdfFilename(input: CoverageDocumentData) {
  return getCoverageDocumentFilename(input).replace(/\.docx$/i, ".pdf");
}

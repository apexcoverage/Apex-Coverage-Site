import { NextResponse } from "next/server";
import { agentConvertCoveragePdf } from "@/lib/agentAppsScript";
import {
  buildCoverageDocumentBuffer,
  getCoverageDocumentFilename,
  type CoverageDocumentData,
} from "@/lib/coverageDocumentBuilder";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const input = (await req.json().catch(() => null)) as CoverageDocumentData | null;
    if (!input || (input.type !== "auto" && input.type !== "build")) {
      return NextResponse.json({ error: "Choose a valid document type." }, { status: 400 });
    }

    const filename = getCoverageDocumentFilename(input).replace(/\.docx$/i, ".pdf");
    const docxBase64 = buildCoverageDocumentBuffer(input).toString("base64");
    const converted = await agentConvertCoveragePdf({ filename, docxBase64 });
    const pdf = Buffer.from(converted.pdfBase64 || "", "base64");
    if (pdf.subarray(0, 5).toString() !== "%PDF-") {
      throw new Error("The document converter returned an invalid PDF.");
    }

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Could not preview the coverage PDF." },
      { status: 500 }
    );
  }
}

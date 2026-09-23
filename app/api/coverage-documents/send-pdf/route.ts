import { NextResponse } from "next/server";
import { agentSendCoveragePdf } from "@/lib/agentAppsScript";
import {
  buildCoveragePdfBuffer,
  getCoveragePdfFilename,
} from "@/lib/coveragePdfBuilder";
import type { CoverageDocumentData } from "@/lib/coverageDocumentBuilder";

export const runtime = "nodejs";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

function isEmail(value: unknown) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as CoverageDocumentData | null;

    if (!body || (body.type !== "auto" && body.type !== "build")) {
      return badRequest("Missing or invalid document type.");
    }

    if (!isEmail(body.email)) {
      return badRequest("Customer email is required before sending a PDF packet.");
    }

    const pdfBuffer = buildCoveragePdfBuffer(body);
    const filename = getCoveragePdfFilename(body);

    await agentSendCoveragePdf({
      to: String(body.email).trim(),
      customerName: String(body.customerName || "Customer").trim(),
      documentType: body.type,
      filename,
      pdfBase64: pdfBuffer.toString("base64"),
    });

    return NextResponse.json({
      ok: true,
      to: String(body.email).trim(),
      filename,
    });
  } catch (err: any) {
    const message = String(err?.message || err || "");
    const appScriptMissingAction = /unknown action/i.test(message);

    console.error("[/api/coverage-documents/send-pdf] Error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: appScriptMissingAction
          ? "Apps Script needs the sendcoveragepdf action before PDF packets can be emailed."
          : err?.message || "Failed to send coverage PDF",
      },
      { status: 500 }
    );
  }
}

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

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function formatVehicle(input: CoverageDocumentData) {
  if (input.type === "auto") {
    if (Array.isArray(input.vehicles)) {
      return input.vehicles.map((vehicle) => clean(vehicle)).filter(Boolean).join("; ");
    }
    return clean(input.vehicles);
  }

  return [input.year, input.make, input.model].map(clean).filter(Boolean).join(" ");
}

function buildEmailSummary(input: CoverageDocumentData) {
  const effectiveDate = clean(input.effectiveDate || input.policyPeriodStart || "");

  if (input.type === "auto") {
    return {
      policyNumber: clean(input.policyNumber) || "Pending confirmation",
      effectiveDate: effectiveDate || "Pending confirmation",
      vehicles: formatVehicle(input) || "Vehicle schedule on file",
      coverage: clean(input.coverage) || "Auto coverage",
      deductibles: clean(input.deductibles) || "See attached policy documents",
    };
  }

  return {
    policyNumber: clean(input.planNumber) || "Pending confirmation",
    effectiveDate: effectiveDate || "Pending confirmation",
    vehicles: formatVehicle(input) || "Vehicle profile on file",
    coverage: "Modified Vehicle Protection",
    deductibles: clean(input.deductible) || "See attached protection packet",
  };
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
      summary: buildEmailSummary(body),
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

import { NextResponse } from "next/server";
import {
  buildCoverageDocumentBuffer,
  getCoverageDocumentFilename,
} from "@/lib/coverageDocumentBuilder";

export const runtime = "nodejs";

function safeString(value: unknown): string {
  return String(value ?? "").trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      policyNumber,
      renewalDate,
      startDate,
      endDate,
      totalPremium,
      discounts,
      vehicles,
      coverage,
      deductibles,
      status,
      email,
      phone,
      zip,
      agent,
    } = body || {};

    const documentData = {
      type: "auto" as const,
      customerName: safeString(name),
      email: safeString(email),
      phone: safeString(phone),
      zip: safeString(zip),
      agent: safeString(agent),
      policyNumber: safeString(policyNumber),
      status: safeString(status) || "Active",
      coverage: safeString(coverage),
      deductibles: safeString(deductibles),
      discounts: safeString(discounts),
      renewalDate: safeString(renewalDate || endDate || startDate),
      monthlyPremium: safeString(totalPremium),
      vehicles,
    };

    const buffer = buildCoverageDocumentBuffer(documentData);
    const filename = getCoverageDocumentFilename(documentData);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error("[/api/declarations/generate] Error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to generate declaration" },
      { status: 500 }
    );
  }
}

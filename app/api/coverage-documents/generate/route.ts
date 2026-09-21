import { NextResponse } from "next/server";
import {
  buildCoverageDocumentBuffer,
  getCoverageDocumentFilename,
  type CoverageDocumentData,
} from "@/lib/coverageDocumentBuilder";

export const runtime = "nodejs";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as CoverageDocumentData | null;

    if (!body || (body.type !== "auto" && body.type !== "build")) {
      return badRequest("Missing or invalid document type.");
    }

    const buffer = buildCoverageDocumentBuffer(body);
    const filename = getCoverageDocumentFilename(body);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error("[/api/coverage-documents/generate] Error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to generate coverage document" },
      { status: 500 }
    );
  }
}

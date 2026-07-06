import { NextResponse } from "next/server";
import {
  agentCreateAutoFromBuild,
  agentCreateBuildFromAuto,
} from "@/lib/agentAppsScript";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const direction = String(body?.direction || "");

    if (direction === "build-from-auto") {
      const autoLeadId = Number(body?.autoLeadId);

      if (!autoLeadId) {
        return NextResponse.json(
          { ok: false, error: "Missing autoLeadId" },
          { status: 400 }
        );
      }

      const data = await agentCreateBuildFromAuto(autoLeadId);
      return NextResponse.json(data);
    }

    if (direction === "auto-from-build") {
      const buildReviewId = Number(body?.buildReviewId);

      if (!buildReviewId) {
        return NextResponse.json(
          { ok: false, error: "Missing buildReviewId" },
          { status: 400 }
        );
      }

      const data = await agentCreateAutoFromBuild(buildReviewId);
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { ok: false, error: "Unknown cross-coverage direction" },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

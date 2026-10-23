import { NextResponse } from "next/server";
import { requireEmployeeApi } from "@/lib/internalAuth";
import {
  agentDeleteBuildReview,
  agentListBuildReviews,
  agentUpdateBuildReview,
} from "@/lib/agentAppsScript";

export async function GET(req: Request) {
  const denied = await requireEmployeeApi(req);
  if (denied) return denied;
  try {
    const data = await agentListBuildReviews();
    return NextResponse.json({ ok: true, rows: data.rows || [] });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const denied = await requireEmployeeApi(req);
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => ({}));
    const { id, patch } = body || {};

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Missing id" },
        { status: 400 }
      );
    }

    if (!patch || typeof patch !== "object") {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid patch" },
        { status: 400 }
      );
    }

    if (patch.vin !== undefined && !/^[A-HJ-NPR-Z0-9]{17}$/.test(String(patch.vin).trim().toUpperCase())) {
      return NextResponse.json({ ok: false, error: "A valid 17-character VIN is required for the covered build." }, { status: 400 });
    }
    if ([patch.addressLine1, patch.addressLine2, patch.city, patch.state].some((value) => value !== undefined) &&
        (!String(patch.addressLine1 || "").trim() || !String(patch.city || "").trim() || !/^[A-Z]{2}$/.test(String(patch.state || "").trim().toUpperCase()) || !/^\d{5}(?:-\d{4})?$/.test(String(patch.zip || "").trim()))) {
      return NextResponse.json({ ok: false, error: "A complete mailing address requires street, city, two-letter state, and ZIP." }, { status: 400 });
    }

    await agentUpdateBuildReview(Number(id), patch);

    return NextResponse.json({ ok: true, id, patch });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const denied = await requireEmployeeApi(req);
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => ({}));
    const { id, confirmHardDelete } = body || {};

    if (process.env.ALLOW_AGENT_HARD_DELETE !== "true") {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Hard delete is disabled. Archive the build review instead so related records stay linked.",
        },
        { status: 403 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Missing id" },
        { status: 400 }
      );
    }

    if (confirmHardDelete !== true) {
      return NextResponse.json(
        { ok: false, error: "Hard delete requires confirmHardDelete=true" },
        { status: 400 }
      );
    }

    await agentDeleteBuildReview(Number(id));

    return NextResponse.json({ ok: true, id });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

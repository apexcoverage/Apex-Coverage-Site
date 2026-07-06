import { NextResponse } from "next/server";
import {
  agentListBuildReviews,
  agentUpdateBuildReview,
} from "@/lib/agentAppsScript";

export async function GET() {
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

    await agentUpdateBuildReview(Number(id), patch);

    return NextResponse.json({ ok: true, id, patch });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

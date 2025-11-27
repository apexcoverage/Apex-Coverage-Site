import { NextResponse } from "next/server";

const AGENT_URL =
  process.env.APPSCRIPT_AGENT_WEBHOOK_URL ||
  process.env.APPSCRIPT_WEBHOOK_URL;

const AGENT_SECRET =
  process.env.AGENT_BACKEND_SECRET ||
  process.env.AGENT_SECRET;

type WorksheetState = {
  coveragePackage: string;
  liability: string;
  compDed: string;
  collDed: string;
  discounts: string[];
  notes: string;
};

async function callAgentLoadWorksheets(): Promise<
  Record<number, WorksheetState>
> {
  if (!AGENT_URL || !AGENT_SECRET) {
    throw new Error(
      "Missing Apps Script env vars. Need APPSCRIPT_AGENT_WEBHOOK_URL or APPSCRIPT_WEBHOOK_URL, and AGENT_BACKEND_SECRET or AGENT_SECRET."
    );
  }

  const body = {
    agent: 1,
    secret: AGENT_SECRET,
    action: "loadworksheets",
  };

  const res = await fetch(AGENT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error("Bad JSON from Apps Script (loadworksheets): " + text);
  }

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || text || res.statusText || "Upstream error");
  }

  const raw = data.worksheets || {};
  const normalized: Record<number, WorksheetState> = {};

  Object.keys(raw).forEach((key) => {
    const id = Number(key);
    if (!id) return;

    const w = raw[key] || {};
    normalized[id] = {
      coveragePackage: String(w.coveragePackage || ""),
      liability: String(w.liability || ""),
      compDed: String(w.compDed || ""),
      collDed: String(w.collDed || ""),
      discounts: Array.isArray(w.discounts)
        ? w.discounts.map((d: any) => String(d || ""))
        : String(w.discounts || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
      notes: String(w.notes || ""),
    };
  });

  return normalized;
}

export async function GET() {
  try {
    const worksheets = await callAgentLoadWorksheets();
    return NextResponse.json({ ok: true, worksheets });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

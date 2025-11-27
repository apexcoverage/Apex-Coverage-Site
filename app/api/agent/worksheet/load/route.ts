import { NextResponse } from "next/server";

const AGENT_URL =
  process.env.APPSCRIPT_AGENT_WEBHOOK_URL ||
  process.env.APPSCRIPT_WEBHOOK_URL;

const AGENT_SECRET =
  process.env.AGENT_BACKEND_SECRET || process.env.AGENT_SECRET;

async function callAgentLoadWorksheet(leadId: number) {
  if (!AGENT_URL || !AGENT_SECRET) {
    throw new Error(
      "Missing Apps Script env vars. Need APPSCRIPT_AGENT_WEBHOOK_URL or APPSCRIPT_WEBHOOK_URL, and AGENT_BACKEND_SECRET or AGENT_SECRET."
    );
  }

  const body = {
    agent: 1,
    secret: AGENT_SECRET,
    action: "loadworksheet",
    leadId,
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
    throw new Error("Bad JSON from Apps Script (loadworksheet): " + text);
  }

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || text || res.statusText || "Upstream error");
  }

  return data;
}

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => ({} as any));
    const leadId = Number(payload.leadId);

    if (!leadId || Number.isNaN(leadId)) {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid leadId" },
        { status: 400 }
      );
    }

    const data = await callAgentLoadWorksheet(leadId);
    const ws = data.worksheet || null;

    if (!ws) {
      return NextResponse.json({ ok: true, worksheet: null });
    }

    // Normalize to the WorksheetState shape the UI expects
    const normalized = {
      coveragePackage: ws.coveragePackage || "",
      liability: ws.liability || "",
      compDed: ws.compDed || "",
      collDed: ws.collDed || "",
      discounts: Array.isArray(ws.discounts) ? ws.discounts : [],
      notes: ws.notes || "",
    };

    return NextResponse.json({ ok: true, worksheet: normalized });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

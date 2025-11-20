import { NextResponse } from "next/server";

// Try new names first, then fall back to your older ones
const AGENT_URL =
  process.env.APPSCRIPT_AGENT_WEBHOOK_URL ||
  process.env.APPSCRIPT_WEBHOOK_URL;

const AGENT_SECRET =
  process.env.AGENT_BACKEND_SECRET ||
  process.env.AGENT_SECRET;

// Helper to call Apps Script via GET (list leads)
async function callAgentListLeads() {
  if (!AGENT_URL || !AGENT_SECRET) {
    throw new Error(
      "Missing Apps Script env vars. Need APPSCRIPT_AGENT_WEBHOOK_URL or APPSCRIPT_WEBHOOK_URL, and AGENT_BACKEND_SECRET or AGENT_SECRET."
    );
  }

  const url = new URL(AGENT_URL);
  url.searchParams.set("agent", "1");
  url.searchParams.set("secret", AGENT_SECRET);
  url.searchParams.set("action", "listLeads");

  const res = await fetch(url.toString(), { method: "GET" });
  const text = await res.text();

  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error("Bad JSON from Apps Script (GET): " + text);
  }

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || text || res.statusText || "Upstream error");
  }

  return data;
}

// Helper to call Apps Script via POST (update lead)
async function callAgentUpdateLead(id: number, patch: Record<string, any>) {
  if (!AGENT_URL || !AGENT_SECRET) {
    throw new Error(
      "Missing Apps Script env vars. Need APPSCRIPT_AGENT_WEBHOOK_URL or APPSCRIPT_WEBHOOK_URL, and AGENT_BACKEND_SECRET or AGENT_SECRET."
    );
  }

  const payload = {
    agent: 1,
    secret: AGENT_SECRET,
    action: "updatelead",
    id,
    patch,
  };

  const res = await fetch(AGENT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error("Bad JSON from Apps Script (POST): " + text);
  }

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || text || res.statusText || "Upstream error");
  }

  return data;
}

// GET /api/agent/leads  -> list leads for dashboard
export async function GET() {
  try {
    const data = await callAgentListLeads();
    return NextResponse.json({ ok: true, rows: data.rows || [] });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

// POST /api/agent/leads  -> update lead status
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id, status } = body || {};

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Missing id" },
        { status: 400 }
      );
    }

    await callAgentUpdateLead(Number(id), { status: status || "" });

    return NextResponse.json({ ok: true, id, status: status || "" });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

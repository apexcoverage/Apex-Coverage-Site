import { NextResponse } from "next/server";

const AGENT_URL =
  process.env.APPSCRIPT_AGENT_WEBHOOK_URL ||
  process.env.APPSCRIPT_WEBHOOK_URL;

const AGENT_SECRET =
  process.env.AGENT_BACKEND_SECRET ||
  process.env.AGENT_SECRET;

async function callAgentListPayments(leadId: number) {
  if (!AGENT_URL || !AGENT_SECRET) {
    throw new Error(
      "Missing Apps Script env vars. Need APPSCRIPT_AGENT_WEBHOOK_URL or APPSCRIPT_WEBHOOK_URL, and AGENT_BACKEND_SECRET or AGENT_SECRET."
    );
  }

  const url = new URL(AGENT_URL);
  url.searchParams.set("agent", "1");
  url.searchParams.set("secret", AGENT_SECRET);
  url.searchParams.set("action", "listpayments");
  url.searchParams.set("leadId", String(leadId));

  const res = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
  });

  const text = await res.text();

  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error("Bad JSON from Apps Script (GET listpayments): " + text);
  }

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || text || res.statusText || "Upstream error");
  }

  return data;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const leadIdRaw = searchParams.get("leadId");

    if (!leadIdRaw) {
      return NextResponse.json(
        { ok: false, error: "Missing leadId" },
        { status: 400 }
      );
    }

    const leadId = Number(leadIdRaw);

    if (!Number.isFinite(leadId) || leadId < 2) {
      return NextResponse.json(
        { ok: false, error: "Invalid leadId" },
        { status: 400 }
      );
    }

    const data = await callAgentListPayments(leadId);

    return NextResponse.json({
      ok: true,
      rows: Array.isArray(data.rows) ? data.rows : [],
    });
  } catch (err: any) {
    console.error("[/api/agent/payments] Error:", err);
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
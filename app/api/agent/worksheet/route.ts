import { NextResponse } from "next/server";

const AGENT_URL =
  process.env.APPSCRIPT_AGENT_WEBHOOK_URL ||
  process.env.APPSCRIPT_WEBHOOK_URL;

const AGENT_SECRET =
  process.env.AGENT_BACKEND_SECRET ||
  process.env.AGENT_SECRET;

async function callAgentSaveWorksheet(payload: any) {
  if (!AGENT_URL || !AGENT_SECRET) {
    throw new Error(
      "Missing Apps Script env vars. Need APPSCRIPT_AGENT_WEBHOOK_URL or APPSCRIPT_WEBHOOK_URL, and AGENT_BACKEND_SECRET or AGENT_SECRET."
    );
  }

  // Wrap the payload in the agent envelope so Apps Script treats it as an agent request
  const body = {
    agent: 1,
    secret: AGENT_SECRET,
    action: "saveworksheet",
    ...payload,
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
    throw new Error("Bad JSON from Apps Script (worksheet): " + text);
  }

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || text || res.statusText || "Upstream error");
  }

  return data;
}

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => ({}));

    if (!payload || !payload.leadId) {
      return NextResponse.json(
        { ok: false, error: "Missing leadId in worksheet payload" },
        { status: 400 }
      );
    }

    await callAgentSaveWorksheet(payload);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

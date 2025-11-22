import { NextResponse } from "next/server";

// Same environment variable logic as /api/agent/leads
const AGENT_URL =
  process.env.APPSCRIPT_AGENT_WEBHOOK_URL ||
  process.env.APPSCRIPT_WEBHOOK_URL;

const AGENT_SECRET =
  process.env.AGENT_BACKEND_SECRET ||
  process.env.AGENT_SECRET;

// POST /api/agent/worksheet
// Accepts worksheet payload and relays it to Apps Script (action: saveworksheet)
export async function POST(req: Request) {
  try {
    if (!AGENT_URL || !AGENT_SECRET) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing Apps Script env vars (APPSCRIPT_AGENT_WEBHOOK_URL / AGENT_SECRET)",
        },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));

    // Build payload for Apps Script
    const payload = {
      agent: 1,                 // tells Apps Script “this is an agent request”
      secret: AGENT_SECRET,     // authorization
      action: "saveworksheet",  // NEW action added to Apps Script
      ...body,                  // pass full worksheet data
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
      throw new Error("Bad JSON from Apps Script: " + text);
    }

    if (!res.ok || !data?.ok) {
      throw new Error(data?.error || "Upstream error");
    }

    return NextResponse.json({ ok: true, saved: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

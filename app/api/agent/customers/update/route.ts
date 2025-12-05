import { NextResponse } from "next/server";

// Reuse the same env var pattern as /api/agent/leads
const AGENT_URL =
  process.env.APPSCRIPT_AGENT_WEBHOOK_URL ||
  process.env.APPSCRIPT_WEBHOOK_URL;

const AGENT_SECRET =
  process.env.AGENT_BACKEND_SECRET || process.env.AGENT_SECRET;

if (!AGENT_URL) {
  console.warn(
    "Missing AGENT_URL. Set APPSCRIPT_AGENT_WEBHOOK_URL or APPSCRIPT_WEBHOOK_URL in your env."
  );
}

if (!AGENT_SECRET) {
  console.warn(
    "Missing AGENT_SECRET. Set AGENT_BACKEND_SECRET or AGENT_SECRET in your env."
  );
}

export async function POST(req: Request) {
  try {
    if (!AGENT_URL || !AGENT_SECRET) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Server is missing Apps Script configuration. Check AGENT URL / SECRET env vars.",
        },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const {
      id,
      name,
      email,
      phone,
      zip,
      dob,
      agent,
      policyNumber, // optional
    } = body || {};

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Missing id for customer update." },
        { status: 400 }
      );
    }

    const payload = {
      action: "updateCustomer", // <- matches doPost in Apps Script
      secret: AGENT_SECRET,
      id,
      name,
      email,
      phone,
      zip,
      dob,
      agent,
      policyNumber,
    };

    const res = await fetch(AGENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const text = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!res.ok || data.ok === false) {
      console.error("Apps Script updateCustomer failed:", data);
      return NextResponse.json(
        {
          ok: false,
          error:
            data.error ||
            `Apps Script HTTP ${res.status} when updating customer.`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error("Customer update API error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error in update API." },
      { status: 500 }
    );
  }
}

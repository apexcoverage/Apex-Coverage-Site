import { NextResponse } from "next/server";

// Reuse the same env vars pattern as your /api/agent/leads route
const AGENT_URL =
  process.env.APPSCRIPT_AGENT_WEBHOOK_URL ||
  process.env.APPSCRIPT_WEBHOOK_URL;

const AGENT_SECRET =
  process.env.AGENT_BACKEND_SECRET ||
  process.env.AGENT_SECRET;

if (!AGENT_URL) {
  console.warn(
    "[/api/agent/customers/update] Missing APPSCRIPT_AGENT_WEBHOOK_URL or APPSCRIPT_WEBHOOK_URL"
  );
}

if (!AGENT_SECRET) {
  console.warn(
    "[/api/agent/customers/update] Missing AGENT_BACKEND_SECRET or AGENT_SECRET"
  );
}

export async function POST(req: Request) {
  try {
    if (!AGENT_URL || !AGENT_SECRET) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Server is missing Apps Script env vars. Check APPSCRIPT_AGENT_WEBHOOK_URL / AGENT_BACKEND_SECRET.",
        },
        { status: 500 }
      );
    }

    const body = await req.json();

    const {
      id,
      name,
      email,
      phone,
      zip,
      dob,
      agent,
      policyNumber,
      coverage,
      deductibles,
      discounts,
      renewalDate,
      vehicles,
      status,
    } = body || {};

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Missing lead id" },
        { status: 400 }
      );
    }

    // Build patch object – only include fields that were actually sent
    const patch: Record<string, any> = {};

    if (name !== undefined) patch.name = name;
    if (email !== undefined) patch.email = email;
    if (phone !== undefined) patch.phone = phone;
    if (zip !== undefined) patch.zip = zip;
    if (dob !== undefined) patch.dob = dob;
    if (agent !== undefined) patch.agent = agent;

    // Policy-related fields – these map to the columns we added in code.gs
    if (policyNumber !== undefined) patch.policyNumber = policyNumber;
    if (coverage !== undefined) patch.coverage = coverage;
    if (deductibles !== undefined) patch.deductibles = deductibles;
    if (discounts !== undefined) {
      // store discounts as comma-separated string if array
      patch.discounts = Array.isArray(discounts)
        ? discounts.join(", ")
        : discounts;
    }
    if (renewalDate !== undefined) patch.renewalDate = renewalDate;

    if (vehicles !== undefined) {
      // For now: store vehicles as JSON string; Apps Script just treats as text
      patch.vehicles = Array.isArray(vehicles)
        ? JSON.stringify(vehicles)
        : String(vehicles);
    }

    if (status !== undefined) patch.status = status;

    const payload = {
      action: "updateLead", // lowercased in Apps Script -> "updatelead"
      secret: AGENT_SECRET,
      id,
      patch,
    };

    const res = await fetch(AGENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: res.ok, raw: text };
    }

    if (!res.ok || data.ok === false) {
      return NextResponse.json(
        {
          ok: false,
          error: data.error || "Apps Script update failed",
          raw: data,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error("[/api/agent/customers/update] Error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

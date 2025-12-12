import { NextResponse } from "next/server";

// Reuse the same env var pattern as /api/agent/leads
const AGENT_URL =
  process.env.APPSCRIPT_AGENT_WEBHOOK_URL || process.env.APPSCRIPT_WEBHOOK_URL;

const AGENT_SECRET =
  process.env.AGENT_BACKEND_SECRET || process.env.AGENT_SECRET;

export async function POST(req: Request) {
  try {
    if (!AGENT_URL || !AGENT_SECRET) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Server is missing Apps Script configuration. Check APPSCRIPT_AGENT_WEBHOOK_URL / AGENT_BACKEND_SECRET.",
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

      // policy fields
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

    if (policyNumber !== undefined) patch.policyNumber = policyNumber;
    if (coverage !== undefined) patch.coverage = coverage;
    if (deductibles !== undefined) patch.deductibles = deductibles;

    if (discounts !== undefined) {
      patch.discounts = Array.isArray(discounts) ? discounts.join(", ") : discounts;
    }

    if (renewalDate !== undefined) patch.renewalDate = renewalDate;

    if (vehicles !== undefined) {
      patch.vehicles = Array.isArray(vehicles) ? JSON.stringify(vehicles) : String(vehicles);
    }

    if (status !== undefined) patch.status = status;

    // IMPORTANT: use updateLead so Apps Script routes to agentUpdateLead_
    const payload = {
      action: "updateLead",
      secret: AGENT_SECRET,
      id,
      patch,
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

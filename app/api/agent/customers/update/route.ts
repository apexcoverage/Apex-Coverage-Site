import { NextResponse } from "next/server";
import { agentUpdateLead } from "@/lib/agentAppsScript";

export async function POST(req: Request) {
  try {
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

    // Policy-related fields
    if (policyNumber !== undefined) patch.policyNumber = policyNumber;
    if (coverage !== undefined) patch.coverage = coverage;
    if (deductibles !== undefined) patch.deductibles = deductibles;

    if (discounts !== undefined) {
      patch.discounts = Array.isArray(discounts)
        ? discounts.join(", ")
        : discounts;
    }

    if (renewalDate !== undefined) patch.renewalDate = renewalDate;

    if (vehicles !== undefined) {
      // Store as text. Your Apps Script treats it as text in the sheet.
      patch.vehicles = Array.isArray(vehicles)
        ? JSON.stringify(vehicles)
        : String(vehicles);
    }

    if (status !== undefined) patch.status = status;

    await agentUpdateLead(Number(id), patch);

    return NextResponse.json({ ok: true, id, patch });
  } catch (err: any) {
    console.error("[/api/agent/customers/update] Error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

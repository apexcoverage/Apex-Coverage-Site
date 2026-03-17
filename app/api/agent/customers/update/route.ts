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
      monthlyPremium,
      status,
    } = body || {};

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Missing lead id" },
        { status: 400 }
      );
    }

    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId < 2) {
      return NextResponse.json(
        { ok: false, error: "Invalid lead id" },
        { status: 400 }
      );
    }

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
      patch.discounts = Array.isArray(discounts)
        ? discounts.join(", ")
        : discounts;
    }

    if (renewalDate !== undefined) patch.renewalDate = renewalDate;

    if (vehicles !== undefined) {
      patch.vehicles = Array.isArray(vehicles)
        ? vehicles.join("\n")
        : String(vehicles);
    }

    if (monthlyPremium !== undefined) {
      patch.monthlyPremium =
        monthlyPremium === null || monthlyPremium === ""
          ? ""
          : String(monthlyPremium).trim();
    }

    if (status !== undefined) patch.status = status;

    await agentUpdateLead(numericId, patch);

    return NextResponse.json({ ok: true, id: numericId, patch });
  } catch (err: any) {
    console.error("[/api/agent/customers/update] Error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

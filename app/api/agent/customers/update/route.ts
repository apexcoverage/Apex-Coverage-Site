import { NextResponse } from "next/server";
import { requireEmployeeApi } from "@/lib/internalAuth";
import { agentUpdateLead } from "@/lib/agentAppsScript";
import { policyPeriodIsTooShort } from "@/lib/insuranceCards";

export async function POST(req: Request) {
  const denied = await requireEmployeeApi(req);
  if (denied) return denied;
  try {
    const body = await req.json();

    const {
      id,
      name,
      email,
      phone,
      zip,
      addressLine1,
      addressLine2,
      city,
      state,
      dob,
      agent,
      policyNumber,
      coverage,
      deductibles,
      discounts,
      renewalDate,
      vehicles,
      monthlyPremium,
      policyState,
      issuerName,
      issuerNaic,
      issuerAddress,
      effectiveDate,
      expirationDate,
      cardVehicles,
      activityNote,
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

    if (state !== undefined && !/^[A-Z]{2}$/.test(String(state).trim().toUpperCase())) {
      return NextResponse.json({ ok: false, error: "State must be a two-letter abbreviation." }, { status: 400 });
    }
    if ([addressLine1, addressLine2, city, state].some((value) => value !== undefined) &&
        (!String(addressLine1 || "").trim() || !String(city || "").trim() || !/^[A-Z]{2}$/.test(String(state || "").trim().toUpperCase()) || !/^\d{5}(?:-\d{4})?$/.test(String(zip || "").trim()))) {
      return NextResponse.json({ ok: false, error: "A complete mailing address requires street, city, two-letter state, and ZIP." }, { status: 400 });
    }
    if (cardVehicles !== undefined) {
      let vehicles: Array<{ vin?: unknown }>;
      try {
        vehicles = JSON.parse(String(cardVehicles));
      } catch {
        return NextResponse.json({ ok: false, error: "Invalid vehicle schedule." }, { status: 400 });
      }
      if (!Array.isArray(vehicles) || !vehicles.length || vehicles.some((vehicle) => !/^[A-HJ-NPR-Z0-9]{17}$/.test(String(vehicle.vin || "").trim().toUpperCase()))) {
        return NextResponse.json({ ok: false, error: "Each covered vehicle needs a valid 17-character VIN." }, { status: 400 });
      }
    }
    if (effectiveDate !== undefined && expirationDate !== undefined &&
        policyPeriodIsTooShort(String(effectiveDate), String(expirationDate))) {
      return NextResponse.json({ ok: false, error: "The saved auto policy period must be at least 28 days." }, { status: 400 });
    }

    const patch: Record<string, any> = {};

    if (name !== undefined) patch.name = name;
    if (email !== undefined) patch.email = email;
    if (phone !== undefined) patch.phone = phone;
    if (zip !== undefined) patch.zip = zip;
    if (addressLine1 !== undefined) patch.addressLine1 = String(addressLine1).trim();
    if (addressLine2 !== undefined) patch.addressLine2 = String(addressLine2).trim();
    if (city !== undefined) patch.city = String(city).trim();
    if (state !== undefined) patch.state = String(state).trim().toUpperCase();
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
    if (policyState !== undefined) patch.policyState = String(policyState).trim().toUpperCase();
    if (issuerName !== undefined) patch.issuerName = String(issuerName).trim();
    if (issuerNaic !== undefined) patch.issuerNaic = String(issuerNaic).trim();
    if (issuerAddress !== undefined) patch.issuerAddress = String(issuerAddress).trim();
    if (effectiveDate !== undefined) patch.effectiveDate = String(effectiveDate).trim();
    if (expirationDate !== undefined) patch.expirationDate = String(expirationDate).trim();
    if (cardVehicles !== undefined) patch.cardVehicles = String(cardVehicles);

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

    if (activityNote !== undefined) {
      patch.activityNote =
        activityNote === null || activityNote === ""
          ? ""
          : String(activityNote).trim();
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

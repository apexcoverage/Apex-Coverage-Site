import { NextResponse } from "next/server";
import { agentListLeads, agentUpdateLead } from "@/lib/agentAppsScript";

export const runtime = "nodejs";

type LeadRow = {
  id: number;
  email?: string;
  phone?: string;
  year?: string;
  make?: string;
  model?: string;
};

function clean(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function sameLead(row: LeadRow, lead: { email: string; phone: string; year: string; make: string; model: string }) {
  const rowEmail = normalizeEmail(row.email || "");
  const rowPhone = normalizePhone(row.phone || "");

  if (lead.email && rowEmail === lead.email) return true;
  if (lead.phone && rowPhone === lead.phone) return true;

  return (
    String(row.year || "").trim() === lead.year &&
    String(row.make || "").trim().toLowerCase() === lead.make.toLowerCase() &&
    String(row.model || "").trim().toLowerCase() === lead.model.toLowerCase()
  );
}

async function appendAdDetailsToLatestLead(details: {
  email: string;
  phone: string;
  year: string;
  make: string;
  model: string;
  partsValue: string;
  interest: string;
}) {
  try {
    const data = await agentListLeads();
    const rows = Array.isArray(data.rows) ? (data.rows as LeadRow[]) : [];
    const newestFirst = [...rows].sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    const match = newestFirst.find((row) => sameLead(row, details));

    if (!match?.id) return;

    const vehicle = [details.year, details.make, details.model].filter(Boolean).join(" ");
    const note = [
      "Ad landing page lead",
      vehicle ? `Vehicle: ${vehicle}` : "",
      details.partsValue ? `Parts value: ${details.partsValue}` : "",
      details.interest ? `Interest: ${details.interest}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    await agentUpdateLead(match.id, {
      coverage: details.interest || "Modified vehicle protection",
      vehicles: vehicle,
      discounts: details.partsValue ? `Approximate parts value: ${details.partsValue}` : "",
      activityNote: note,
    });
  } catch (err) {
    console.error("Could not append ad lead details", err);
  }
}

export async function POST(req: Request) {
  try {
    const gasWebAppUrl = process.env.GAS_WEBAPP_URL;

    if (!gasWebAppUrl) {
      return NextResponse.json(
        { ok: false, error: "Missing GAS_WEBAPP_URL" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const name = clean(formData.get("name"));
    const email = clean(formData.get("email"));
    const phone = clean(formData.get("phone"));
    const zip = clean(formData.get("zip"));
    const year = clean(formData.get("year"));
    const make = clean(formData.get("make"));
    const model = clean(formData.get("model"));
    const partsValue = clean(formData.get("partsValue"));
    const interest = clean(formData.get("interest"));
    const consent = clean(formData.get("consent"));

    if (!name || !email || !phone || !zip || !year || !make || !model || !partsValue || !interest) {
      return NextResponse.json(
        { ok: false, error: "Please complete all required fields." },
        { status: 400 }
      );
    }

    if (consent !== "true") {
      return NextResponse.json(
        { ok: false, error: "Consent is required before submitting." },
        { status: 400 }
      );
    }

    const payload = new URLSearchParams();
    payload.set("type", "insurance_quote");
    payload.set("name", name);
    payload.set("email", email);
    payload.set("phone", phone);
    payload.set("zip", zip);
    payload.set("year", year);
    payload.set("make", make);
    payload.set("model", model);
    payload.set("consent", "true");
    payload.set("source", "ad-landing-protect-more-than-stock");

    const upstream = await fetch(gasWebAppUrl, {
      method: "POST",
      body: payload,
      cache: "no-store",
    });

    const text = await upstream.text();
    let data: any = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { ok: false, error: text || "Invalid Apps Script response." };
    }

    if (!upstream.ok || data?.ok !== true) {
      return NextResponse.json(
        { ok: false, error: data?.error || text || "Lead submission was rejected." },
        { status: 502 }
      );
    }

    await appendAdDetailsToLatestLead({
      email: normalizeEmail(email),
      phone: normalizePhone(phone),
      year,
      make,
      model,
      partsValue,
      interest,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

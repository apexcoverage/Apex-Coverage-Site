import { NextResponse } from "next/server";
import { agentListBuildReviews, agentListLeads } from "@/lib/agentAppsScript";

type AutoLead = {
  id: number;
  when?: string;
  name?: string;
  email?: string;
  phone?: string;
  year?: string;
  make?: string;
  model?: string;
  status?: string;
};

type BuildReview = {
  id: number;
  when?: string;
  name?: string;
  email?: string;
  phone?: string;
  year?: string;
  make?: string;
  model?: string;
  status?: string;
};

function normalizeEmail(value: string) {
  return String(value || "").trim().toLowerCase();
}

function normalizePhone(value: string) {
  return String(value || "").replace(/\D/g, "");
}

function vehicleLabel(item: { year?: string; make?: string; model?: string }) {
  return [item.year, item.make, item.model].filter(Boolean).join(" ");
}

function nextStepFor(kind: "build" | "auto", status?: string) {
  const normalized = String(status || "").trim().toLowerCase();

  if (!normalized || normalized === "new" || normalized === "new build review") {
    return "Received. An Apex agent will review the request.";
  }

  if (normalized.includes("docs")) {
    return "Documents are needed. Please watch for a message from your Apex agent.";
  }

  if (normalized.includes("review") || normalized.includes("progress")) {
    return "Under review. Apex is checking details and next steps.";
  }

  if (normalized === "quoted" || normalized === "approved") {
    return "Ready for agent follow-up.";
  }

  if (normalized === "won" || normalized === "active") {
    return kind === "build"
      ? "Build coverage is active."
      : "Auto coverage is active.";
  }

  if (normalized === "lost" || normalized === "rejected") {
    return "This request is not currently active. Contact Apex if you need help.";
  }

  return "Contact Apex for the latest details.";
}

function matches(
  row: { email?: string; phone?: string },
  email: string,
  phone: string
) {
  const rowEmail = normalizeEmail(row.email || "");
  const rowPhone = normalizePhone(row.phone || "");
  return Boolean((email && rowEmail === email) || (phone && rowPhone === phone));
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body?.email || "");
    const phone = normalizePhone(body?.phone || "");

    if (!email && !phone) {
      return NextResponse.json(
        { ok: false, error: "Enter the email or phone used for the request." },
        { status: 400 }
      );
    }

    const [autoData, buildData] = await Promise.all([
      agentListLeads(),
      agentListBuildReviews(),
    ]);

    const autoRows = Array.isArray(autoData.rows)
      ? (autoData.rows as AutoLead[])
      : [];
    const buildRows = Array.isArray(buildData.rows)
      ? (buildData.rows as BuildReview[])
      : [];

    const autoMatches = autoRows
      .filter((row) => matches(row, email, phone))
      .map((row) => ({
        type: "Auto Coverage",
        received: row.when || "",
        status: row.status || "Received",
        vehicle: vehicleLabel(row) || "Vehicle not listed",
        nextStep: nextStepFor("auto", row.status),
      }));

    const buildMatches = buildRows
      .filter((row) => matches(row, email, phone))
      .map((row) => ({
        type: "Build Coverage",
        received: row.when || "",
        status: row.status || "Received",
        vehicle: vehicleLabel(row) || "Vehicle not listed",
        nextStep: nextStepFor("build", row.status),
      }));

    return NextResponse.json({
      ok: true,
      rows: [...buildMatches, ...autoMatches],
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

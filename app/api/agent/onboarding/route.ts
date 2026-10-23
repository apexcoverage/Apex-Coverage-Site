import { NextResponse } from "next/server";
import { requireEmployeeApi } from "@/lib/internalAuth";
import { coverageStage, sameContact } from "@/lib/agentLifecycle";
import { autoPolicyNumber, cleanSetupDetails, setupMissingInformation } from "@/lib/agentOnboarding";
import { agentListBuildReviews, agentListLeads, agentUpdateBuildReview, agentUpdateLead } from "@/lib/agentAppsScript";

export const runtime = "nodejs";

type Row = Record<string, unknown> & { id: number; email?: string; phone?: string; status?: string };

function parseSelection(kind: unknown, id: unknown): { kind: "auto" | "build"; id: number } | null {
  const rowId = Number(id);
  return (kind === "auto" || kind === "build") && Number.isInteger(rowId) && rowId >= 2
    ? { kind, id: rowId } : null;
}

async function findSetup(kind: "auto" | "build", id: number) {
  const [autoResult, buildResult] = await Promise.all([agentListLeads(), agentListBuildReviews()]);
  const autos = (autoResult.rows || []) as Row[];
  const builds = (buildResult.rows || []) as Row[];
  const source = (kind === "auto" ? autos : builds).find((row) => Number(row.id) === id);
  if (!source) return null;
  const linkedAutos = autos.filter((row) => sameContact(row, source));
  const linkedBuilds = builds.filter((row) => sameContact(row, source));
  if (kind === "auto" && !linkedAutos.some((row) => row.id === id)) linkedAutos.push(source);
  if (kind === "build" && !linkedBuilds.some((row) => row.id === id)) linkedBuilds.push(source);
  return { source, autos: linkedAutos, builds: linkedBuilds };
}

export async function GET(request: Request) {
  const denied = await requireEmployeeApi(request);
  if (denied) return denied;
  const url = new URL(request.url);
  const selection = parseSelection(url.searchParams.get("kind"), url.searchParams.get("id"));
  if (!selection) return NextResponse.json({ ok: false, error: "Select a valid customer setup." }, { status: 400 });
  try {
    const setup = await findSetup(selection.kind, selection.id);
    if (!setup) return NextResponse.json({ ok: false, error: "Request not found." }, { status: 404 });
    return NextResponse.json({ ok: true, ...setup });
  } catch {
    return NextResponse.json({ ok: false, error: "Customer setup is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const denied = await requireEmployeeApi(request);
  if (denied) return denied;
  const body = await request.json().catch(() => ({}));
  const selection = parseSelection(body.kind, body.id);
  if (!selection) return NextResponse.json({ ok: false, error: "Select a valid pipeline request." }, { status: 400 });
  const action = body.action || "begin";
  if (!["begin", "save", "activate"].includes(action)) {
    return NextResponse.json({ ok: false, error: "Unknown setup action." }, { status: 400 });
  }
  try {
    const setup = await findSetup(selection.kind, selection.id);
    if (!setup) return NextResponse.json({ ok: false, error: "Request not found." }, { status: 404 });
    if (coverageStage(selection.kind, setup.source.status) === "closed") {
      return NextResponse.json({ ok: false, error: "Reopen this request before starting customer setup." }, { status: 409 });
    }
    if (action === "begin") {
      const auto = selection.kind === "auto" ? setup.source : setup.autos
        .filter((row) => coverageStage("auto", row.status) === "pipeline")
        .sort((a, b) => Number(b.id) - Number(a.id))[0];
      const build = selection.kind === "build" ? setup.source : setup.builds
        .filter((row) => coverageStage("build", row.status) === "pipeline")
        .sort((a, b) => Number(b.id) - Number(a.id))[0];
      if (auto && coverageStage("auto", auto.status) === "pipeline") {
        await agentUpdateLead(Number(auto.id), { status: "Onboarding", activityNote: "Customer setup started" });
      }
      if (build && coverageStage("build", build.status) === "pipeline") {
        await agentUpdateBuildReview(Number(build.id), { status: "Onboarding", activityNote: "Customer setup started" });
      }
      return NextResponse.json({ ok: true, path: `/agent/onboarding/${selection.kind}-${selection.id}` });
    }

    const details = cleanSetupDetails(body.details);
    if (action === "activate") {
      const missing = setupMissingInformation(details);
      if (missing.length) return NextResponse.json({ ok: false, error: "Complete the required customer and vehicle details.", missing }, { status: 400 });
      if (body.confirmed !== true) return NextResponse.json({ ok: false, error: "Confirm that Apex's binding requirements have been met before activation." }, { status: 400 });
    }
    const shared = {
      name: details.name, email: details.email, phone: details.phone,
      addressLine1: details.addressLine1, addressLine2: details.addressLine2,
      city: details.city, state: details.state, zip: details.zip,
    };
    const auto = selection.kind === "auto" && coverageStage("auto", setup.source.status) === "onboarding" ? setup.source : undefined;
    const build = selection.kind === "build" && coverageStage("build", setup.source.status) === "onboarding" ? setup.source : undefined;
    if (!auto && !build) {
      return NextResponse.json({ ok: false, error: "No product is currently in customer setup." }, { status: 409 });
    }
    if (auto) {
      const cardVehicle = { year: details.year, make: details.make, model: details.model, vin: details.vin };
      let cardVehicles: unknown[] = [];
      try { const parsed = JSON.parse(String(auto.cardVehicles || "")); if (Array.isArray(parsed)) cardVehicles = parsed; } catch { /* No saved card vehicles yet. */ }
      if (cardVehicles.length) cardVehicles[0] = { ...(cardVehicles[0] as object), ...cardVehicle };
      else cardVehicles = [cardVehicle];
      const patch: Record<string, unknown> = {
        ...shared, year: details.year, make: details.make, model: details.model,
        coverage: details.coverage, monthlyPremium: details.monthlyPremium,
        cardVehicles: JSON.stringify(cardVehicles),
        activityNote: action === "activate" ? "Auto coverage activated after agent confirmation" : "Auto customer setup saved",
      };
      if (action === "activate") {
        patch.status = "Won";
        patch.policyNumber = String(auto.policyNumber || "") || autoPolicyNumber(Number(auto.id));
        patch.policyState = details.state;
      }
      await agentUpdateLead(Number(auto.id), patch);
    }
    if (build) {
      const patch: Record<string, unknown> = {
        ...shared, year: details.year, make: details.make, model: details.model, vin: details.vin,
        tierInterest: details.tierInterest, partsValue: details.partsValue, deductible: details.deductible,
        activityNote: action === "activate" ? "Build protection activated after agent confirmation" : "Build customer setup saved",
      };
      if (action === "activate") patch.status = "Active";
      await agentUpdateBuildReview(Number(build.id), patch);
    }
    return NextResponse.json({ ok: true, activated: action === "activate", path: action === "activate" ? "/agent/customers" : undefined });
  } catch {
    return NextResponse.json({ ok: false, error: "Customer setup could not be saved. Refresh to check whether any changes were applied." }, { status: 503 });
  }
}

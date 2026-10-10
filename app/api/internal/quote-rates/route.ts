import { NextRequest, NextResponse } from "next/server";
import { getEmployeeSessionFromRequest } from "@/lib/internalAuth";
import {
  getActiveRateConfig,
  resetActiveRateConfig,
  updateActiveRateConfig,
} from "@/lib/quotes/rateConfigStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function canManageRates(role: string) {
  return role === "MANAGER" || role === "ADMIN";
}

export async function GET(request: NextRequest) {
  const session = getEmployeeSessionFromRequest(request);
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Not signed in." },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    config: getActiveRateConfig(),
    canManage: canManageRates(session.user.role),
  });
}

export async function PUT(request: NextRequest) {
  const session = getEmployeeSessionFromRequest(request);
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Not signed in." },
      { status: 401 }
    );
  }

  if (!canManageRates(session.user.role)) {
    return NextResponse.json(
      { ok: false, error: "Manager or admin access is required." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const reset = body?.reset === true;
  const config = reset
    ? resetActiveRateConfig(session.user)
    : updateActiveRateConfig(body?.config || {}, session.user);

  return NextResponse.json({ ok: true, config });
}

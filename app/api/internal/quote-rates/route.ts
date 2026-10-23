import { NextRequest, NextResponse } from "next/server";
import { getEmployeeSessionFromRequest } from "@/lib/internalAuth";
import { getPersistentRateConfig, savePersistentRateConfig } from "@/lib/quotes/persistentRateConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function canManageRates(role: string) {
  return role === "MANAGER" || role === "ADMIN";
}

export async function GET(request: NextRequest) {
  const session = await getEmployeeSessionFromRequest(request);
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Not signed in." },
      { status: 401 }
    );
  }

  try {
    return NextResponse.json({ ok: true, config: await getPersistentRateConfig(), canManage: canManageRates(session.user.role) });
  } catch {
    return NextResponse.json({ ok: false, error: "Rate matrix is temporarily unavailable." }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getEmployeeSessionFromRequest(request);
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
  try {
    const config = await savePersistentRateConfig(body?.config || {}, session.user, reset);
    return NextResponse.json({ ok: true, config });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Could not save rate matrix." }, { status: 400 });
  }
}

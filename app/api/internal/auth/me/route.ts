import { NextRequest, NextResponse } from "next/server";
import { getEmployeeSessionFromRequest } from "@/lib/internalAuth";

export async function GET(request: NextRequest) {
  const session = getEmployeeSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Not signed in." },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true, user: session.user });
}

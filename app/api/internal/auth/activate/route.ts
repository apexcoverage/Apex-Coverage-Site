import { NextRequest, NextResponse } from "next/server";
import { activateEmployeeInvite, employeeDatabaseConfigured } from "@/lib/employeeStore";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!employeeDatabaseConfigured()) return NextResponse.json({ ok: false, error: "Employee account setup is unavailable." }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const token = String(body.token || "");
  const password = String(body.password || "");
  if (!token || password.length < 12 || password.length > 128) {
    return NextResponse.json({ ok: false, error: "Use a password of 12 to 128 characters." }, { status: 400 });
  }
  try {
    const activated = await activateEmployeeInvite(token, password);
    return NextResponse.json({ ok: activated, error: activated ? undefined : "This setup link has expired or was already used." }, { status: activated ? 200 : 400 });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not finish account setup." }, { status: 503 });
  }
}

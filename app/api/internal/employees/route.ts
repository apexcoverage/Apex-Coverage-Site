import { NextRequest, NextResponse } from "next/server";
import { getEmployeeSessionFromRequest } from "@/lib/internalAuth";
import { employeeDatabaseConfigured, inviteEmployee, listEmployees, resetEmployeePassword, updateEmployee } from "@/lib/employeeStore";
import type { EmployeeRole } from "@/lib/quotes/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function admin(request: NextRequest) {
  const session = await getEmployeeSessionFromRequest(request);
  if (!session) return { error: NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 }) };
  if (session.user.role !== "ADMIN") return { error: NextResponse.json({ ok: false, error: "Admin access required." }, { status: 403 }) };
  if (!employeeDatabaseConfigured()) return { error: NextResponse.json({ ok: false, error: "Connect DATABASE_URL in Vercel before managing employees." }, { status: 503 }) };
  return { session };
}

function validRole(value: unknown): value is EmployeeRole {
  return value === "EMPLOYEE" || value === "MANAGER" || value === "ADMIN";
}

export async function GET(request: NextRequest) {
  const access = await admin(request);
  if (access.error) return access.error;
  try {
    return NextResponse.json({ ok: true, employees: await listEmployees() });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not load employee accounts." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const access = await admin(request);
  if (access.error) return access.error;
  const body = await request.json().catch(() => ({}));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email || "")) || !String(body.name || "").trim() || !validRole(body.role)) {
    return NextResponse.json({ ok: false, error: "Enter a name, valid email, and role." }, { status: 400 });
  }
  try {
    const token = await inviteEmployee({ email: body.email, name: body.name, role: body.role }, access.session!.user.email);
    return NextResponse.json({ ok: true, setupPath: `/employee-sign-in/activate?token=${encodeURIComponent(token)}` });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Could not invite employee." }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const access = await admin(request);
  if (access.error) return access.error;
  const body = await request.json().catch(() => ({}));
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ ok: false, error: "Employee ID required." }, { status: 400 });
  if (body.action === "reset") {
    try {
      const token = await resetEmployeePassword(id, access.session!.user.email);
      return NextResponse.json({ ok: true, setupPath: `/employee-sign-in/activate?token=${encodeURIComponent(token)}` });
    } catch (error) {
      return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Could not reset account." }, { status: 400 });
    }
  }
  const role = body.role;
  if (role !== undefined && !validRole(role)) return NextResponse.json({ ok: false, error: "Invalid role." }, { status: 400 });
  if (body.active !== undefined && typeof body.active !== "boolean") return NextResponse.json({ ok: false, error: "Invalid account status." }, { status: 400 });
  const employees = await listEmployees();
  const target = employees.find((employee) => employee.id === id);
  if (!target) return NextResponse.json({ ok: false, error: "Employee not found." }, { status: 404 });
  if (target.email === access.session!.user.email && (body.active === false || (role && role !== "ADMIN"))) {
    return NextResponse.json({ ok: false, error: "You cannot remove your own admin access." }, { status: 400 });
  }
  await updateEmployee(id, { role, active: body.active }, access.session!.user.email);
  return NextResponse.json({ ok: true });
}

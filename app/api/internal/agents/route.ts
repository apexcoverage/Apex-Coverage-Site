import { NextResponse } from "next/server";
import { getEmployeeSessionFromRequest } from "@/lib/internalAuth";
import { employeeDatabaseConfigured, listEmployees } from "@/lib/employeeStore";

export async function GET(request: Request) {
  const session = await getEmployeeSessionFromRequest(request);
  if (!session) return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
  if (!employeeDatabaseConfigured()) return NextResponse.json({ ok: true, names: [session.user.name] });
  try {
    const employees = await listEmployees();
    return NextResponse.json({ ok: true, names: employees.filter((employee) => employee.active).map((employee) => employee.name) });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not load employee names." }, { status: 503 });
  }
}

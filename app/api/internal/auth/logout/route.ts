import { NextResponse } from "next/server";
import { clearEmployeeSessionCookie } from "@/lib/internalAuth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearEmployeeSessionCookie(response);
  return response;
}

import { NextRequest, NextResponse } from "next/server";
import { clearEmployeeSessionCookie } from "@/lib/internalAuth";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  await clearEmployeeSessionCookie(response, request);
  return response;
}

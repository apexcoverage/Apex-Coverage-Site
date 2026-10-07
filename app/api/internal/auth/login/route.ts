import { NextRequest, NextResponse } from "next/server";
import {
  setEmployeeSessionCookie,
  verifyEmployeeCredentials,
} from "@/lib/internalAuth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = String(body?.email || "");
  const password = String(body?.password || "");

  const user = verifyEmployeeCredentials(email, password);

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Invalid employee email or password." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true, user });
  try {
    setEmployeeSessionCookie(response, user);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Employee login is missing required server authentication settings.",
      },
      { status: 500 }
    );
  }
  return response;
}

import { NextRequest, NextResponse } from "next/server";
import {
  setEmployeeSessionCookie,
  signInEmployee,
} from "@/lib/internalAuth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = String(body?.email || "");
  const password = String(body?.password || "");
  const remember = body?.remember === true;

  let signedIn;
  try {
    signedIn = await signInEmployee(email, password, remember);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Employee sign-in is temporarily unavailable. Please try again." },
      { status: 503 }
    );
  }

  if (!signedIn) {
    return NextResponse.json(
      { ok: false, error: "Invalid employee email or password." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true, user: signedIn.user });
  try {
    setEmployeeSessionCookie(response, signedIn);
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

import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import type { EmployeeRole, EmployeeUser } from "./quotes/types";

export const INTERNAL_SESSION_COOKIE = "apex_internal_session";

type EmployeeAccount = EmployeeUser & {
  password?: string;
  passwordHash?: string;
};

export type EmployeeSession = {
  user: EmployeeUser;
  expiresAt: number;
};

function getAuthSecret() {
  const secret = process.env.APEX_INTERNAL_AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV !== "production") return "apex-local-dev-session-secret";
  return "";
}

function normalizeRole(value: unknown): EmployeeRole {
  return value === "MANAGER" || value === "ADMIN" ? value : "EMPLOYEE";
}

function getEmployeeAccounts(): EmployeeAccount[] {
  const raw = process.env.APEX_EMPLOYEES_JSON;

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => ({
            email: String(item?.email || "").trim().toLowerCase(),
            name: String(item?.name || "").trim(),
            role: normalizeRole(item?.role),
            password: item?.password ? String(item.password) : undefined,
            passwordHash: item?.passwordHash
              ? String(item.passwordHash)
              : undefined,
          }))
          .filter((item) => item.email && item.name);
      }
    } catch {
      return [];
    }
  }

  if (process.env.NODE_ENV !== "production") {
    return [
      {
        email: "admin@driveapexcoverage.com",
        name: "Apex Admin",
        role: "ADMIN",
        password: "apex-demo-quote",
      },
    ];
  }

  return [];
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function constantTimeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function verifyEmployeeCredentials(email: string, password: string) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const account = getEmployeeAccounts().find(
    (item) => item.email === normalizedEmail
  );

  if (!account) return null;

  const suppliedHash = sha256(password || "");
  const configuredHash = account.passwordHash
    ? account.passwordHash.replace(/^sha256:/i, "")
    : sha256(account.password || "");

  if (!configuredHash || !constantTimeEqual(suppliedHash, configuredHash)) {
    return null;
  }

  return {
    email: account.email,
    name: account.name,
    role: account.role,
  } satisfies EmployeeUser;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string) {
  const secret = getAuthSecret();
  if (!secret) throw new Error("APEX_INTERNAL_AUTH_SECRET is not configured.");
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createEmployeeSessionCookie(user: EmployeeUser) {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 12;
  const payload = base64UrlEncode(JSON.stringify({ user, expiresAt }));
  return `${payload}.${signPayload(payload)}`;
}

export function verifyEmployeeSessionCookie(value?: string | null) {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;

  let expectedSignature = "";
  try {
    expectedSignature = signPayload(payload);
  } catch {
    return null;
  }

  if (!constantTimeEqual(signature, expectedSignature)) return null;

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as EmployeeSession;
    if (!parsed?.user?.email || !parsed?.user?.name) return null;
    if (!parsed.expiresAt || parsed.expiresAt < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getEmployeeSessionFromRequest(request: NextRequest) {
  return verifyEmployeeSessionCookie(
    request.cookies.get(INTERNAL_SESSION_COOKIE)?.value
  );
}

export function getEmployeeSessionFromCookies() {
  return verifyEmployeeSessionCookie(cookies().get(INTERNAL_SESSION_COOKIE)?.value);
}

export function requireEmployeeSession(nextPath = "/agent/quotes") {
  const session = getEmployeeSessionFromCookies();
  if (!session) {
    redirect(`/agent/quotes/login?next=${encodeURIComponent(nextPath)}`);
  }
  return session;
}

export function setEmployeeSessionCookie(
  response: NextResponse,
  user: EmployeeUser
) {
  response.cookies.set(INTERNAL_SESSION_COOKIE, createEmployeeSessionCookie(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export function clearEmployeeSessionCookie(response: NextResponse) {
  response.cookies.set(INTERNAL_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

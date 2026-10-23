import crypto from "crypto";
import { neon } from "@neondatabase/serverless";
import type { EmployeeRole, EmployeeUser } from "./quotes/types";

type AccountRow = {
  id: string;
  email: string;
  name: string;
  role: EmployeeRole;
  password_hash: string;
  active: boolean;
  created_at: string;
};

type BootstrapAccount = EmployeeUser & { password?: string; passwordHash?: string };

let schemaReady: Promise<void> | null = null;

function database() {
  const url = process.env.DATABASE_URL;
  return url ? neon(url) : null;
}

export function employeeDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function digest(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function hashEmployeePassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  if (stored.startsWith("scrypt:")) {
    const [, salt, expected] = stored.split(":");
    if (!salt || !expected) return false;
    return safeEqual(crypto.scryptSync(password, salt, 64).toString("hex"), expected);
  }
  if (stored.startsWith("sha256:")) return safeEqual(digest(password), stored.slice(7));
  return false;
}

export async function ensureEmployeeSchema(bootstrap: BootstrapAccount[] = []) {
  const sql = database();
  if (!sql) throw new Error("DATABASE_URL is not configured.");
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql.query(`CREATE TABLE IF NOT EXISTS apex_employees (
        id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
        role TEXT NOT NULL, password_hash TEXT NOT NULL, active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
      await sql.query(`CREATE TABLE IF NOT EXISTS apex_employee_sessions (
        token_hash TEXT PRIMARY KEY, employee_id TEXT NOT NULL REFERENCES apex_employees(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
      await sql.query(`CREATE TABLE IF NOT EXISTS apex_employee_invites (
        token_hash TEXT PRIMARY KEY, employee_id TEXT NOT NULL REFERENCES apex_employees(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ
      )`);
      await sql.query(`CREATE TABLE IF NOT EXISTS apex_employee_audit (
        id TEXT PRIMARY KEY, actor_email TEXT NOT NULL, employee_id TEXT NOT NULL,
        action TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
  for (const account of bootstrap) {
    const email = account.email.trim().toLowerCase();
    if (!email || !account.name || (!account.password && !account.passwordHash)) continue;
    const hash = account.password
      ? hashEmployeePassword(account.password)
      : `sha256:${String(account.passwordHash).replace(/^sha256:/i, "")}`;
    await sql.query(
      `INSERT INTO apex_employees (id, email, name, role, password_hash)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING`,
      [crypto.randomUUID(), email, account.name, account.role, hash]
    );
  }
}

export async function authenticateEmployee(email: string, password: string, bootstrap: BootstrapAccount[]) {
  await ensureEmployeeSchema(bootstrap);
  const sql = database()!;
  const rows = await sql.query(
    "SELECT * FROM apex_employees WHERE email = $1 AND active = TRUE LIMIT 1",
    [email.trim().toLowerCase()]
  ) as AccountRow[];
  const account = rows[0];
  if (!account || !verifyPassword(password, account.password_hash)) return null;
  if (account.password_hash.startsWith("sha256:")) {
    await sql.query("UPDATE apex_employees SET password_hash = $1, updated_at = NOW() WHERE id = $2", [hashEmployeePassword(password), account.id]);
  }
  return { id: account.id, email: account.email, name: account.name, role: account.role };
}

export async function createEmployeeSession(employeeId: string, remember: boolean) {
  await ensureEmployeeSchema();
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + (remember ? 30 : 1) * 24 * 60 * 60 * 1000);
  await database()!.query(
    "INSERT INTO apex_employee_sessions (token_hash, employee_id, expires_at) VALUES ($1, $2, $3)",
    [digest(token), employeeId, expiresAt.toISOString()]
  );
  return { token, expiresAt };
}

export async function resolveEmployeeSession(token: string) {
  await ensureEmployeeSchema();
  const rows = await database()!.query(
    `SELECT e.id, e.email, e.name, e.role, s.expires_at
     FROM apex_employee_sessions s JOIN apex_employees e ON e.id = s.employee_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW() AND e.active = TRUE LIMIT 1`,
    [digest(token)]
  ) as Array<{ id: string; email: string; name: string; role: EmployeeRole; expires_at: string }>;
  const row = rows[0];
  return row ? { user: { email: row.email, name: row.name, role: row.role }, expiresAt: new Date(row.expires_at).getTime() } : null;
}

export async function revokeEmployeeSession(token: string) {
  await ensureEmployeeSchema();
  await database()!.query("DELETE FROM apex_employee_sessions WHERE token_hash = $1", [digest(token)]);
}

export async function listEmployees() {
  await ensureEmployeeSchema();
  return await database()!.query(
    "SELECT id, email, name, role, active, created_at FROM apex_employees ORDER BY created_at, name"
  ) as Array<Omit<AccountRow, "password_hash">>;
}

export async function inviteEmployee(input: { email: string; name: string; role: EmployeeRole }, actorEmail: string) {
  await ensureEmployeeSchema();
  const sql = database()!;
  const email = input.email.trim().toLowerCase();
  const existing = await sql.query("SELECT id, active FROM apex_employees WHERE email = $1 LIMIT 1", [email]) as Array<{ id: string; active: boolean }>;
  if (existing[0]?.active) throw new Error("An active account already uses this email.");
  const id = existing[0]?.id || crypto.randomUUID();
  if (existing[0]) {
    await sql.query("UPDATE apex_employees SET name = $1, role = $2, active = FALSE, updated_at = NOW() WHERE id = $3", [input.name.trim(), input.role, id]);
    await sql.query("DELETE FROM apex_employee_sessions WHERE employee_id = $1", [id]);
  } else {
    await sql.query(
      "INSERT INTO apex_employees (id, email, name, role, password_hash, active) VALUES ($1, $2, $3, $4, $5, FALSE)",
      [id, email, input.name.trim(), input.role, "pending"]
    );
  }
  await sql.query("DELETE FROM apex_employee_invites WHERE employee_id = $1", [id]);
  const token = crypto.randomBytes(32).toString("base64url");
  await sql.query(
    "INSERT INTO apex_employee_invites (token_hash, employee_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL '24 hours')",
    [digest(token), id]
  );
  await sql.query("INSERT INTO apex_employee_audit (id, actor_email, employee_id, action) VALUES ($1, $2, $3, $4)",
    [crypto.randomUUID(), actorEmail, id, existing[0] ? "INVITE_REISSUED" : "INVITED"]);
  return token;
}

export async function activateEmployeeInvite(token: string, password: string) {
  await ensureEmployeeSchema();
  const sql = database()!;
  const rows = await sql.query(
    "UPDATE apex_employee_invites SET used_at = NOW() WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW() RETURNING employee_id",
    [digest(token)]
  ) as Array<{ employee_id: string }>;
  if (!rows[0]) return false;
  await sql.query("UPDATE apex_employees SET password_hash = $1, active = TRUE, updated_at = NOW() WHERE id = $2", [hashEmployeePassword(password), rows[0].employee_id]);
  await sql.query("DELETE FROM apex_employee_sessions WHERE employee_id = $1", [rows[0].employee_id]);
  return true;
}

export async function resetEmployeePassword(id: string, actorEmail: string) {
  await ensureEmployeeSchema();
  const sql = database()!;
  const rows = await sql.query("SELECT id FROM apex_employees WHERE id = $1 AND active = TRUE LIMIT 1", [id]) as Array<{ id: string }>;
  if (!rows[0]) throw new Error("Active employee account not found.");
  await sql.query("DELETE FROM apex_employee_sessions WHERE employee_id = $1", [id]);
  await sql.query("DELETE FROM apex_employee_invites WHERE employee_id = $1", [id]);
  const token = crypto.randomBytes(32).toString("base64url");
  await sql.query("INSERT INTO apex_employee_invites (token_hash, employee_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL '24 hours')", [digest(token), id]);
  await sql.query("INSERT INTO apex_employee_audit (id, actor_email, employee_id, action) VALUES ($1, $2, $3, $4)",
    [crypto.randomUUID(), actorEmail, id, "PASSWORD_RESET_ISSUED"]);
  return token;
}

export async function updateEmployee(id: string, patch: { name?: string; role?: EmployeeRole; active?: boolean }, actorEmail: string) {
  await ensureEmployeeSchema();
  const sql = database()!;
  const rows = await sql.query("SELECT id, name, role, active FROM apex_employees WHERE id = $1 LIMIT 1", [id]) as Array<{ id: string; name: string; role: EmployeeRole; active: boolean }>;
  if (!rows[0]) return false;
  await sql.query(
    "UPDATE apex_employees SET name = $1, role = $2, active = $3, updated_at = NOW() WHERE id = $4",
    [patch.name?.trim() || rows[0].name, patch.role || rows[0].role, patch.active ?? rows[0].active, id]
  );
  if (patch.active === false || patch.role) {
    await sql.query("DELETE FROM apex_employee_sessions WHERE employee_id = $1", [id]);
  }
  await sql.query("INSERT INTO apex_employee_audit (id, actor_email, employee_id, action) VALUES ($1, $2, $3, $4)",
    [crypto.randomUUID(), actorEmail, id, patch.active === false ? "DEACTIVATED" : patch.active === true ? "REACTIVATED" : patch.role ? "ROLE_CHANGED" : "UPDATED"]);
  return true;
}

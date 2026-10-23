import { neon } from "@neondatabase/serverless";
import { getActiveRateConfig, getDefaultRateConfig, mergeRateConfig, resetActiveRateConfig, updateActiveRateConfig, type RateConfig } from "./rateConfigStore";
import type { EmployeeUser } from "./types";

let schemaReady: Promise<void> | null = null;

function database() {
  return process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
}

async function ensureSchema() {
  const sql = database();
  if (!sql) return;
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql.query(`CREATE TABLE IF NOT EXISTS apex_rate_config (
        id TEXT PRIMARY KEY, revision INTEGER NOT NULL, config JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
      await sql.query(`CREATE TABLE IF NOT EXISTS apex_rate_history (
        revision INTEGER PRIMARY KEY, config JSONB NOT NULL,
        updated_by TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
      await sql.query("CREATE SEQUENCE IF NOT EXISTS apex_rate_revision_seq");
    })().catch((error) => { schemaReady = null; throw error; });
  }
  await schemaReady;
}

function validShape(expected: unknown, value: unknown): boolean {
  if (typeof expected === "number") return typeof value === "number" && Number.isFinite(value) && value >= 0;
  if (typeof expected === "string") return typeof value === "string" && value.length <= 500;
  if (typeof expected === "boolean") return typeof value === "boolean";
  if (Array.isArray(expected)) return Array.isArray(value) && value.length === expected.length &&
    expected.every((item, index) => validShape(item, value[index]));
  if (!expected || typeof expected !== "object" || !value || typeof value !== "object" || Array.isArray(value)) return false;
  const template = expected as Record<string, unknown>;
  const candidate = value as Record<string, unknown>;
  return Object.keys(candidate).every((key) => key in template) &&
    Object.keys(template).every((key) => validShape(template[key], candidate[key]));
}

export function validRateConfig(value: unknown): value is RateConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const source = value as Record<string, unknown>;
  const defaults = getDefaultRateConfig();
  return validShape(defaults.auto, source.auto) && validShape(defaults.mvp, source.mvp) &&
    String((source.auto as RateConfig["auto"]).version || "").trim().length > 0 &&
    String((source.mvp as RateConfig["mvp"]).version || "").trim().length > 0;
}

export async function getPersistentRateConfig(): Promise<RateConfig> {
  const sql = database();
  if (!sql) return getActiveRateConfig();
  await ensureSchema();
  const rows = await sql.query("SELECT config FROM apex_rate_config WHERE id = 'active' LIMIT 1") as Array<{ config: Partial<RateConfig> }>;
  return rows[0] ? mergeRateConfig(rows[0].config) : getDefaultRateConfig();
}

export async function savePersistentRateConfig(nextConfig: unknown, user: EmployeeUser, reset: boolean) {
  if (!reset && !validRateConfig(nextConfig)) throw new Error("Rate matrix fields must keep their expected types and valid nonnegative values.");
  const sql = database();
  if (!sql) return reset ? resetActiveRateConfig(user) : updateActiveRateConfig(nextConfig as Partial<RateConfig>, user);
  await ensureSchema();
  const source = reset ? getDefaultRateConfig() : mergeRateConfig(nextConfig as RateConfig);
  const revisionRows = await sql.query("SELECT nextval('apex_rate_revision_seq') AS revision") as Array<{ revision: string }>;
  const revision = Number(revisionRows[0].revision);
  const next: RateConfig = {
    ...source,
    auto: { ...source.auto, version: `${String(source.auto.version).replace(/-r\d+$/, "")}-r${revision}` },
    mvp: { ...source.mvp, version: `${String(source.mvp.version).replace(/-r\d+$/, "")}-r${revision}` },
    updatedAt: new Date().toISOString(), updatedBy: user.name || user.email,
  };
  await sql.query("INSERT INTO apex_rate_history (revision, config, updated_by) VALUES ($1, $2::jsonb, $3)", [revision, JSON.stringify(next), user.email]);
  await sql.query(`INSERT INTO apex_rate_config (id, revision, config) VALUES ('active', $1, $2::jsonb)
    ON CONFLICT (id) DO UPDATE SET revision = EXCLUDED.revision, config = EXCLUDED.config, updated_at = NOW()`,
    [revision, JSON.stringify(next)]);
  return next;
}

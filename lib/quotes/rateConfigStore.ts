import fs from "fs";
import os from "os";
import path from "path";
import {
  AUTO_RATE_TABLE,
  MVP_RATE_TABLE,
} from "./rateTables";
import type { EmployeeUser } from "./types";

export type RateConfig = {
  auto: typeof AUTO_RATE_TABLE;
  mvp: typeof MVP_RATE_TABLE;
  updatedAt: string;
  updatedBy: string;
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function deepMerge<T>(base: T, override: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return override === undefined ? base : (override as T);
  }

  const next: Record<string, unknown> = { ...base };
  Object.entries(override).forEach(([key, value]) => {
    if (isPlainObject(next[key]) && isPlainObject(value)) {
      next[key] = deepMerge(next[key], value);
      return;
    }
    if (value !== undefined) next[key] = value;
  });

  return next as T;
}

function rateConfigPath() {
  const configured = process.env.APEX_RATE_CONFIG_PATH;
  const configPath =
    configured ||
    (process.env.VERCEL || process.env.NODE_ENV === "production"
      ? path.join(os.tmpdir(), "apex-rate-config.json")
      : path.join(process.cwd(), ".data", "apex-rate-config.json"));
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  return configPath;
}

export function getDefaultRateConfig(): RateConfig {
  return {
    auto: clone(AUTO_RATE_TABLE),
    mvp: clone(MVP_RATE_TABLE),
    updatedAt: "",
    updatedBy: "System default",
  };
}

export function getActiveRateConfig(): RateConfig {
  const defaults = getDefaultRateConfig();
  const file = rateConfigPath();

  if (!fs.existsSync(file)) return defaults;

  try {
    const saved = JSON.parse(fs.readFileSync(file, "utf8"));
    return {
      auto: deepMerge(defaults.auto, saved?.auto),
      mvp: deepMerge(defaults.mvp, saved?.mvp),
      updatedAt: String(saved?.updatedAt || ""),
      updatedBy: String(saved?.updatedBy || "Unknown"),
    };
  } catch {
    return defaults;
  }
}

export function updateActiveRateConfig(
  nextConfig: Partial<RateConfig>,
  user: EmployeeUser
) {
  const defaults = getDefaultRateConfig();
  const current = getActiveRateConfig();
  const next: RateConfig = {
    auto: deepMerge(defaults.auto, deepMerge(current.auto, nextConfig.auto)),
    mvp: deepMerge(defaults.mvp, deepMerge(current.mvp, nextConfig.mvp)),
    updatedAt: new Date().toISOString(),
    updatedBy: user.name || user.email,
  };

  fs.writeFileSync(rateConfigPath(), JSON.stringify(next, null, 2));
  return next;
}

export function resetActiveRateConfig(user: EmployeeUser) {
  const next = {
    ...getDefaultRateConfig(),
    updatedAt: new Date().toISOString(),
    updatedBy: user.name || user.email,
  };
  fs.writeFileSync(rateConfigPath(), JSON.stringify(next, null, 2));
  return next;
}

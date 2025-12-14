// lib/agentAppsScript.ts
import "server-only";

const AGENT_URL =
  process.env.APPSCRIPT_AGENT_WEBHOOK_URL ||
  process.env.APPSCRIPT_WEBHOOK_URL;

const AGENT_SECRET =
  process.env.AGENT_BACKEND_SECRET ||
  process.env.AGENT_SECRET;

function assertAgentEnv() {
  if (!AGENT_URL || !AGENT_SECRET) {
    throw new Error(
      "Missing Apps Script env vars. Need APPSCRIPT_AGENT_WEBHOOK_URL or APPSCRIPT_WEBHOOK_URL, and AGENT_BACKEND_SECRET or AGENT_SECRET."
    );
  }
}

export async function agentListLeads() {
  assertAgentEnv();

  const url = new URL(AGENT_URL!);
  url.searchParams.set("agent", "1");
  url.searchParams.set("secret", AGENT_SECRET!);
  url.searchParams.set("action", "listLeads");

  const res = await fetch(url.toString(), { method: "GET" });
  const text = await res.text();

  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error("Bad JSON from Apps Script (GET): " + text);
  }

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || text || res.statusText || "Upstream error");
  }

  return data;
}

export async function agentUpdateLead(id: number, patch: Record<string, any>) {
  assertAgentEnv();

  const payload = {
    agent: 1,
    secret: AGENT_SECRET!,
    action: "updatelead",
    id,
    patch,
  };

  const res = await fetch(AGENT_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error("Bad JSON from Apps Script (POST): " + text);
  }

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || text || res.statusText || "Upstream error");
  }

  return data;
}

export function getStripeModeFromSecretKey(secretKey: string) {
  // Stripe test keys start with "sk_test_"
  return secretKey?.startsWith("sk_test_") ? "test" : "live";
}

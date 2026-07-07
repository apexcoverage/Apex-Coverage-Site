// lib/agentAppsScript.ts
import "server-only";

const AGENT_URL =
  process.env.APPSCRIPT_AGENT_WEBHOOK_URL ||
  process.env.APPSCRIPT_AGENT_URL ||
  process.env.APPSCRIPT_WEBHOOK_URL;

const AGENT_SECRET =
  process.env.AGENT_BACKEND_SECRET ||
  process.env.AGENT_SECRET;

function assertAgentEnv() {
  if (!AGENT_URL || !AGENT_SECRET) {
    throw new Error(
      "Missing Apps Script env vars. Need APPSCRIPT_AGENT_WEBHOOK_URL, APPSCRIPT_AGENT_URL, or APPSCRIPT_WEBHOOK_URL, and AGENT_BACKEND_SECRET or AGENT_SECRET."
    );
  }
}

async function parseAgentResponse(res: Response, label: string) {
  const text = await res.text();

  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Bad JSON from Apps Script (${label}): ${text}`);
  }

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || text || res.statusText || "Upstream error");
  }

  return data;
}

async function getAgentAction(action: string, params?: Record<string, string>) {
  assertAgentEnv();

  const url = new URL(AGENT_URL!);
  url.searchParams.set("agent", "1");
  url.searchParams.set("secret", AGENT_SECRET!);
  url.searchParams.set("action", action);

  Object.entries(params || {}).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
  return parseAgentResponse(res, `GET ${action}`);
}

async function postAgentAction(action: string, payload: Record<string, any>) {
  assertAgentEnv();

  const body = {
    agent: 1,
    secret: AGENT_SECRET!,
    action,
    ...payload,
  };

  const res = await fetch(AGENT_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return parseAgentResponse(res, `POST ${action}`);
}

export async function agentListLeads() {
  return getAgentAction("listLeads");
}

export async function agentListBuildReviews() {
  return getAgentAction("listBuildReviews");
}

export async function agentUpdateLead(id: number, patch: Record<string, any>) {
  return postAgentAction("updatelead", { id, patch });
}

export async function agentDeleteLead(id: number) {
  return postAgentAction("deletelead", { id });
}

export async function agentUpdateBuildReview(
  id: number,
  patch: Record<string, any>
) {
  return postAgentAction("updatebuildreview", { id, patch });
}

export async function agentDeleteBuildReview(id: number) {
  return postAgentAction("deletebuildreview", { id });
}

export async function agentCreateBuildFromAuto(autoLeadId: number) {
  return postAgentAction("createbuildfromauto", { autoLeadId });
}

export async function agentCreateAutoFromBuild(buildReviewId: number) {
  return postAgentAction("createautofrombuild", { buildReviewId });
}

export function getStripeModeFromSecretKey(secretKey: string) {
  // Stripe test keys start with "sk_test_"
  return secretKey?.startsWith("sk_test_") ? "test" : "live";
}

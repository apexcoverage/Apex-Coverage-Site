// app/api/agent/leads/route.ts
import { NextResponse } from "next/server";

const AGENT_URL = process.env.APPSCRIPT_AGENT_URL!;
const AGENT_SECRET = process.env.APPSCRIPT_AGENT_SECRET!;

export async function GET() {
  if (!AGENT_URL || !AGENT_SECRET) {
    return NextResponse.json({ ok:false, error:"Missing env vars" }, { status:500 });
  }
  const url = `${AGENT_URL}?agent=1&secret=${encodeURIComponent(AGENT_SECRET)}&action=listLeads`;
  const r = await fetch(url, { cache: "no-store" });
  const text = await r.text();
  let data: any; try { data = JSON.parse(text); } catch { data = { ok:false, raw:text }; }
  if (!r.ok || data?.ok !== true) {
    return NextResponse.json({ ok:false, error:data?.error || r.statusText }, { status:502 });
  }
  return NextResponse.json(data);
}

// app/api/agent/update/route.ts
import { NextResponse } from "next/server";

const AGENT_URL = process.env.APPSCRIPT_AGENT_URL!;
const AGENT_SECRET = process.env.APPSCRIPT_AGENT_SECRET!;

export async function POST(req: Request) {
  try {
    if (!AGENT_URL || !AGENT_SECRET) {
      return NextResponse.json({ ok:false, error:"Missing env vars" }, { status:500 });
    }
    const { id, patch } = await req.json(); // id = row number from listLeads, patch = fields to update
    if (!id || typeof id !== "number" || !patch || typeof patch !== "object") {
      return NextResponse.json({ ok:false, error:"Bad input" }, { status:400 });
    }

    const body = {
      agent: 1,
      secret: AGENT_SECRET,
      action: "updateLead",
      id,
      patch
    };

    const upstream = await fetch(AGENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const text = await upstream.text();
    let data: any; try { data = JSON.parse(text); } catch { data = { ok:false, raw:text }; }
    if (!upstream.ok || data?.ok !== true) {
      return NextResponse.json({ ok:false, error: data?.error || upstream.statusText }, { status:502 });
    }
    return NextResponse.json({ ok:true });
  } catch (err: any) {
    return NextResponse.json({ ok:false, error: String(err) }, { status:500 });
  }
}

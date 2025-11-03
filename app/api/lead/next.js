// app/api/lead/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Read form or JSON coming from the client
    const contentType = req.headers.get("content-type") || "";
    let payload: Record<string, any> = {};

    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else {
      const fd = await req.formData();
      payload = Object.fromEntries(fd.entries());
    }

    // Forward to Google Apps Script (stored in env)
    const url = process.env.GAS_WEBAPP_URL; // e.g. https://script.google.com/macros/s/AKfy.../exec
    if (!url) return NextResponse.json({ ok: false, error: "Missing GAS_WEBAPP_URL" }, { status: 500 });

    // Send as form-encoded to avoid preflight on GAS side (it accepts both)
    const form = new URLSearchParams();
    for (const [k, v] of Object.entries(payload)) form.append(k, String(v ?? ""));

    const res = await fetch(url, { method: "POST", body: form });
    const text = await res.text();

    if (!res.ok) return NextResponse.json({ ok: false, error: text || `Upstream ${res.status}` }, { status: 502 });

    // Try to parse GAS JSON; fall back to text
    let data: any = {};
    try { data = JSON.parse(text); } catch { data = { ok: true, raw: text }; }

    return NextResponse.json({ ok: true, upstream: data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}

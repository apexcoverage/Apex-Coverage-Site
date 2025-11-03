// app/api/lead/route.ts
import { NextResponse } from "next/server";

// If you prefer Node (not Edge) runtime:
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Accept either JSON or FormData from the browser
    const ct = req.headers.get("content-type") || "";
    let payload: Record<string, any> = {};

    if (ct.includes("application/json")) {
      payload = await req.json();
    } else {
      const fd = await req.formData();
      payload = Object.fromEntries(fd.entries());
    }

    const gasURL = process.env.GAS_WEBAPP_URL; // set in Vercel Project → Settings → Environment Variables
    if (!gasURL) {
      return NextResponse.json(
        { ok: false, error: "Missing GAS_WEBAPP_URL env var" },
        { status: 500 }
      );
    }

    // Forward to Google Apps Script as form-encoded (GAS-friendly, no CORS issues server-to-server)
    const form = new URLSearchParams();
    for (const [k, v] of Object.entries(payload)) form.append(k, String(v ?? ""));

    const upstream = await fetch(gasURL, { method: "POST", body: form });
    const text = await upstream.text();

    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, error: text || `Upstream ${upstream.status}` },
        { status: 502 }
      );
    }

    let data: any;
    try { data = JSON.parse(text); } catch { data = { ok: true, raw: text }; }

    return NextResponse.json({ ok: true, upstream: data });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

// Optional: reject non-POST quickly
export async function GET() {
  return NextResponse.json({ ok: false, error: "Method Not Allowed" }, { status: 405 });
}

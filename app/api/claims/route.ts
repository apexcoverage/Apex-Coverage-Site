// app/api/claim/route.ts
import { NextResponse } from "next/server";

const APPSCRIPT_WEBHOOK_URL = process.env.APPSCRIPT_WEBHOOK_URL;

export async function GET() {
  // simple health check
  return NextResponse.json({
    ok: true,
    hasWebhook: Boolean(APPSCRIPT_WEBHOOK_URL),
  });
}

export async function POST(req: Request) {
  try {
    if (!APPSCRIPT_WEBHOOK_URL) {
      return NextResponse.json(
        { ok: false, error: "Missing APPSCRIPT_WEBHOOK_URL env var" },
        { status: 500 }
      );
    }

    let payload: Record<string, any> = {};
    const ct = req.headers.get("content-type") || "";

    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      for (const [k, v] of form.entries()) {
        payload[k] = typeof v === "string" ? v : "";
      }
    } else {
      const body = await req.json().catch(() => ({}));
      payload = typeof body === "object" && body ? body : {};
    }

    // Guarantee claim routing
    payload.type = "claim";
    payload.source = payload.source || "website-claim";

    const upstream = await fetch(APPSCRIPT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const upstreamText = await upstream.text();
    let upstreamJson: any = null;
    try {
      upstreamJson = upstreamText ? JSON.parse(upstreamText) : null;
    } catch {
      upstreamJson = null;
    }

    if (!upstream.ok || upstreamJson?.ok !== true) {
      // Bubble actual upstream message (raw text if not JSON)
      const msg =
        (upstreamJson && (upstreamJson.error || upstreamJson.raw)) ||
        upstreamText ||
        upstream.statusText ||
        "Upstream error";
      return NextResponse.json({ ok: false, error: msg }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

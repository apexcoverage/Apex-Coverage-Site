// app/api/claims/route.ts
import { NextResponse } from "next/server";

const APPSCRIPT_WEBHOOK_URL = process.env.APPSCRIPT_WEBHOOK_URL;

export async function GET() {
  // health check (no cache so you always see current env state)
  return NextResponse.json(
    { ok: true, hasWebhook: Boolean(APPSCRIPT_WEBHOOK_URL) },
    { headers: { "Cache-Control": "no-store" } }
  );
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
      // accept JSON or x-www-form-urlencoded posted as JSON upstream
      const body = await req.json().catch(() => ({}));
      payload = typeof body === "object" && body ? body : {};
    }

    // Guarantee correct routing to the claims branch in Apps Script
    payload.type = "claim";
    payload.source = payload.source || "website-claim";

    const upstream = await fetch(APPSCRIPT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const upstreamText = await upstream.text();
    let upstreamJson: any = null;
    try {
      upstreamJson = upstreamText ? JSON.parse(upstreamText) : null;
    } catch {
      upstreamJson = null;
    }

    if (!upstream.ok || upstreamJson?.ok !== true) {
      // Show status code + helpful snippet of upstream body
      const msg =
        (upstreamJson && (upstreamJson.error || upstreamJson.raw)) ||
        (upstreamText ? upstreamText.slice(0, 500) : "") ||
        upstream.statusText ||
        "Upstream error";
      return NextResponse.json(
        { ok: false, error: `AppsScript ${upstream.status}: ${msg}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}


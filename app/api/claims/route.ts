// app/api/claim/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';        // ensure Node runtime (not Edge)
export const dynamic = 'force-dynamic'; // don't cache this route

const APPSCRIPT_WEBHOOK_URL = process.env.APPSCRIPT_WEBHOOK_URL;

// Small helper to parse possibly-non-JSON responses safely
function tryParseJSON(text: string) {
  try { return JSON.parse(text); } catch { return null; }
}

export async function GET() {
  // simple health check to confirm the API route is deployed
  return NextResponse.json({
    ok: true,
    hasWebhookUrl: Boolean(APPSCRIPT_WEBHOOK_URL),
  });
}

export async function POST(req: Request) {
  try {
    if (!APPSCRIPT_WEBHOOK_URL) {
      return NextResponse.json(
        { ok: false, error: 'Missing APPSCRIPT_WEBHOOK_URL env var (Vercel Project → Settings → Environment Variables → Production).' },
        { status: 500 }
      );
    }

    // Convert multipart form to JSON for Apps Script
    const form = await req.formData();
    const payload: Record<string, any> = {};
    for (const [k, v] of form.entries()) {
      payload[k] = typeof v === 'string' ? v : '';
    }
    // Ensure type flag
    if (!payload.type) payload.type = 'claim';

    // Add a short timeout so we don’t hang forever
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s

    const upstream = await fetch(APPSCRIPT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'ApexCoverage/claim-api' },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: controller.signal,
    }).catch((err) => {
      throw new Error('Fetch to Apps Script failed: ' + String(err));
    });
    clearTimeout(timeout);

    const bodyText = await upstream.text();
    const maybeJson = tryParseJSON(bodyText);

    if (!upstream.ok || !maybeJson || maybeJson.ok !== true) {
      // Bubble up details so you can see what’s wrong in the browser console
      return NextResponse.json(
        {
          ok: false,
          error: maybeJson?.error || upstream.statusText || 'Unknown upstream error',
          upstreamStatus: upstream.status,
          upstreamBody: maybeJson ?? bodyText, // shows raw text if not JSON
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}

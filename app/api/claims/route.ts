import { NextResponse } from 'next/server';

const APPSCRIPT_WEBHOOK_URL = process.env.APPSCRIPT_WEBHOOK_URL!; // same script as leads

export async function POST(req: Request) {
  try {
    // Convert incoming multipart form → forward as JSON (Apps Script accepts both)
    const form = await req.formData();
    const payload: Record<string, any> = {};
    for (const [k, v] of form.entries()) {
      payload[k] = typeof v === 'string' ? v : ''; // no file upload passthrough here
    }

    // Ensure type flag
    payload.type = payload.type || 'claim';

    const upstream = await fetch(APPSCRIPT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // server-to-server; no CORS needed
    });

    const text = await upstream.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { ok:false, raw:text }; }

    if (!upstream.ok || data?.ok !== true) {
      return NextResponse.json({ ok:false, error: data?.error || upstream.statusText }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok:false, error: String(err) }, { status: 500 });
  }
}

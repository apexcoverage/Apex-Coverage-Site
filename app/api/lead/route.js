// app/api/lead/route.js
export const runtime = 'nodejs';

export async function POST(req) {
  try {
    // Accept JSON or FormData from the browser
    const ct = req.headers.get('content-type') || '';
    let payload = {};
    if (ct.includes('application/json')) {
      payload = await req.json();
    } else {
      const fd = await req.formData();
      payload = Object.fromEntries(fd.entries());
    }

    const gasURL = process.env.GAS_WEBAPP_URL; // set in Vercel Project → Settings → Environment Variables
    if (!gasURL) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing GAS_WEBAPP_URL' }), { status: 500 });
    }

    // Forward to Apps Script as form-encoded (GAS-friendly)
    const form = new URLSearchParams();
    for (const [k, v] of Object.entries(payload)) form.append(k, String(v ?? ''));

    const upstream = await fetch(gasURL, { method: 'POST', body: form });
    const text = await upstream.text();
    if (!upstream.ok) {
      return new Response(JSON.stringify({ ok: false, error: text || `Upstream ${upstream.status}` }), { status: 502 });
    }

    let data;
    try { data = JSON.parse(text); } catch { data = { ok: true, raw: text }; }
    return new Response(JSON.stringify({ ok: true, upstream: data }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err?.message || err) }), { status: 500 });
  }
}

export async function GET() {
  // 405 on GET, helps you confirm the route exists
  return new Response(JSON.stringify({ ok: false, error: 'Method Not Allowed' }), { status: 405 });
}

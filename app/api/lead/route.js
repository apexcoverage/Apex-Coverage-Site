// app/api/lead/route.js
export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const ct = req.headers.get('content-type') || '';
    let payload = {};
    if (ct.includes('application/json')) {
      payload = await req.json();
    } else {
      const fd = await req.formData();
      payload = Object.fromEntries(fd.entries());
    }

    const url = process.env.GAS_WEBAPP_URL;
    if (!url) return new Response(JSON.stringify({ ok:false, error:'Missing GAS_WEBAPP_URL' }), { status: 500 });

    const form = new URLSearchParams();
    for (const [k, v] of Object.entries(payload)) form.append(k, String(v ?? ''));

    const upstream = await fetch(url, { method: 'POST', body: form });
    const text = await upstream.text();
    if (!upstream.ok) return new Response(JSON.stringify({ ok:false, error:text || `Upstream ${upstream.status}` }), { status: 502 });

    let data; try { data = JSON.parse(text); } catch { data = { ok: true, raw: text }; }
    return new Response(JSON.stringify({ ok:true, upstream:data }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ ok:false, error:String(err?.message || err) }), { status: 500 });
  }
}

export async function GET() {
  // should 405 so you can confirm the route exists
  return new Response(JSON.stringify({ ok:false, error:'Method Not Allowed' }), { status: 405 });
}

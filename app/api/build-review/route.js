// app/api/build-review/route.js
export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const ct = req.headers.get('content-type') || '';
    const form = new URLSearchParams();

    if (ct.includes('application/json')) {
      const payload = await req.json();
      for (const [k, v] of Object.entries(payload || {})) {
        if (Array.isArray(v)) {
          for (const item of v) form.append(k, String(item ?? ''));
        } else {
          form.append(k, String(v ?? ''));
        }
      }
    } else {
      const fd = await req.formData();
      for (const [k, v] of fd.entries()) {
        form.append(k, String(v ?? ''));
      }
    }

    form.set('type', 'build-review');

    const url = process.env.GAS_WEBAPP_URL;
    if (!url) return new Response(JSON.stringify({ ok:false, error:'Missing GAS_WEBAPP_URL' }), { status: 500 });

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
  return new Response(JSON.stringify({ ok:false, error:'Method Not Allowed' }), { status: 405 });
}

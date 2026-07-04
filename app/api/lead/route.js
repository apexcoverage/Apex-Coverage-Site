// app/api/lead/route.js

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let payload = {};

    if (contentType.includes('application/json')) {
      payload = await req.json();
    } else {
      const formData = await req.formData();
      payload = Object.fromEntries(formData.entries());
    }

    const gasWebAppUrl = process.env.GAS_WEBAPP_URL;

    if (!gasWebAppUrl) {
      return Response.json(
        {
          ok: false,
          error: 'Missing GAS_WEBAPP_URL',
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Explicitly identify this submission as an auto insurance quote.
     *
     * This prevents the website from relying on the Apps Script
     * "anything that is not a claim becomes a lead" fallback forever.
     *
     * The current Code.gs will still send this to Leads because
     * insurance_quote is not a claim. We will later make Code.gs
     * explicitly recognize this type.
     */
    const form = new URLSearchParams();

    form.set('type', 'insurance_quote');

    for (const [key, value] of Object.entries(payload)) {
      if (key === 'type') continue;

      form.append(key, String(value ?? ''));
    }

    const upstream = await fetch(gasWebAppUrl, {
      method: 'POST',
      body: form,
      cache: 'no-store',
    });

    const text = await upstream.text();

    if (!upstream.ok) {
      console.error('Google Apps Script HTTP error:', {
        status: upstream.status,
        response: text,
      });

      return Response.json(
        {
          ok: false,
          error: text || `Google Apps Script returned HTTP ${upstream.status}`,
        },
        {
          status: 502,
        }
      );
    }

    let data;

    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('Invalid Google Apps Script response:', {
        response: text,
        error: parseError,
      });

      return Response.json(
        {
          ok: false,
          error: 'Google Apps Script returned an invalid response.',
        },
        {
          status: 502,
        }
      );
    }

    /*
     * Apps Script may return HTTP 200 while its JSON body says ok:false.
     * Do not tell the customer the submission succeeded in that case.
     */
    if (data?.ok !== true) {
      console.error('Google Apps Script rejected insurance quote:', data);

      return Response.json(
        {
          ok: false,
          error: data?.error || 'Insurance quote submission was rejected.',
          upstream: data,
        },
        {
          status: 502,
        }
      );
    }

    return Response.json(
      {
        ok: true,
        upstream: data,
      },
      {
        status: 200,
      }
    );
  } catch (err) {
    console.error('Insurance quote API error:', err);

    return Response.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred while submitting the insurance quote.',
      },
      {
        status: 500,
      }
    );
  }
}

export async function GET() {
  return Response.json(
    {
      ok: false,
      error: 'Method Not Allowed',
    },
    {
      status: 405,
    }
  );
}

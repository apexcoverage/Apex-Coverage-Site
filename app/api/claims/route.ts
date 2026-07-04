// app/api/claims/route.ts

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const gasWebAppUrl = process.env.GAS_WEBAPP_URL;

  return NextResponse.json(
    {
      ok: true,
      hasWebhook: Boolean(gasWebAppUrl),
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}

export async function POST(req: Request) {
  try {
    const gasWebAppUrl = process.env.GAS_WEBAPP_URL;

    if (!gasWebAppUrl) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing GAS_WEBAPP_URL env var',
        },
        {
          status: 500,
        }
      );
    }

    const contentType = req.headers.get('content-type') || '';

    let payload: Record<string, unknown> = {};

    /*
     * Accept JSON.
     */
    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({}));

      payload =
        typeof body === 'object' && body !== null
          ? (body as Record<string, unknown>)
          : {};
    }

    /*
     * Accept multipart FormData.
     */
    else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();

      for (const [key, value] of formData.entries()) {
        /*
         * The current claim backend stores photo URLs,
         * not uploaded file contents.
         *
         * Actual File objects are intentionally ignored here
         * until we review the claims form and upload process.
         */
        if (typeof value !== 'string') {
          continue;
        }

        if (payload[key] === undefined) {
          payload[key] = value;
          continue;
        }

        /*
         * Preserve repeated form fields.
         */
        const existing = payload[key];

        if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          payload[key] = [existing, value];
        }
      }
    }

    /*
     * Accept standard URL-encoded form submissions.
     */
    else if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text();
      const params = new URLSearchParams(text);

      for (const [key, value] of params.entries()) {
        if (payload[key] === undefined) {
          payload[key] = value;
          continue;
        }

        const existing = payload[key];

        if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          payload[key] = [existing, value];
        }
      }
    }

    /*
     * Explicit claim routing.
     *
     * Do not trust a customer-supplied type value.
     */
    payload.type = 'claim';

    if (!payload.source) {
      payload.source = 'website-claim';
    }

    /*
     * Apps Script expects simple values.
     * Convert arrays into comma-separated strings.
     */
    const normalizedPayload: Record<string, string> = {};

    for (const [key, value] of Object.entries(payload)) {
      if (Array.isArray(value)) {
        normalizedPayload[key] = value
          .map((item) => String(item ?? '').trim())
          .filter(Boolean)
          .join(', ');

        continue;
      }

      normalizedPayload[key] = String(value ?? '');
    }

    const upstream = await fetch(gasWebAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(normalizedPayload),
      cache: 'no-store',
    });

    const upstreamText = await upstream.text();

    let upstreamJson: {
      ok?: boolean;
      type?: string;
      error?: string;
      raw?: string;
    } | null = null;

    try {
      upstreamJson = upstreamText
        ? JSON.parse(upstreamText)
        : null;
    } catch (parseError) {
      console.error('Invalid Google Apps Script claim response:', {
        response: upstreamText,
        error: parseError,
      });

      return NextResponse.json(
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
     * Google Apps Script may return HTTP 200 while
     * its JSON body says ok:false.
     */
    if (!upstream.ok || upstreamJson?.ok !== true) {
      const message =
        upstreamJson?.error ||
        upstreamJson?.raw ||
        upstreamText.slice(0, 500) ||
        upstream.statusText ||
        'Google Apps Script rejected the claim.';

      console.error('Google Apps Script claim error:', {
        status: upstream.status,
        response: upstreamJson,
      });

      return NextResponse.json(
        {
          ok: false,
          error: `AppsScript ${upstream.status}: ${message}`,
        },
        {
          status: 502,
        }
      );
    }

    /*
     * The Apps Script claims branch returns type:"claim".
     *
     * Refuse to show success if the submission somehow
     * reached the wrong backend flow.
     */
    if (upstreamJson?.type !== 'claim') {
      console.error('Claim was routed incorrectly:', upstreamJson);

      return NextResponse.json(
        {
          ok: false,
          error:
            'Claim reached the backend but was not routed as a claim.',
        },
        {
          status: 502,
        }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        upstream: upstreamJson,
      },
      {
        status: 200,
      }
    );
  } catch (err: unknown) {
    console.error('Claims API error:', err);

    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred while submitting the claim.',
      },
      {
        status: 500,
      }
    );
  }
}

// app/api/build-review/route.js

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let payload = {};

    if (contentType.includes('application/json')) {
      payload = await req.json();
    } else {
      const formData = await req.formData();

      /*
       * Build the payload manually so repeated form values
       * are preserved instead of silently overwritten.
       */
      for (const [key, value] of formData.entries()) {
        const stringValue = String(value ?? '');

        if (payload[key] === undefined) {
          payload[key] = stringValue;
          continue;
        }

        if (Array.isArray(payload[key])) {
          payload[key].push(stringValue);
          continue;
        }

        payload[key] = [payload[key], stringValue];
      }
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

    const form = new URLSearchParams();

    /*
     * Explicitly identify this submission as a build review.
     *
     * Code.gs will be updated to route this exact type
     * into the Build Reviews sheet.
     */
    form.set('type', 'build-review');

    for (const [key, value] of Object.entries(payload || {})) {
      if (key === 'type') continue;

      /*
       * Apps Script currently reads e.parameter.
       *
       * e.parameter only gives us the first value for repeated keys,
       * so arrays are stored as one comma-separated value.
       */
      if (Array.isArray(value)) {
        form.set(
          key,
          value
            .map((item) => String(item ?? '').trim())
            .filter(Boolean)
            .join(', ')
        );

        continue;
      }

      form.set(key, String(value ?? ''));
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
          error:
            text ||
            `Google Apps Script returned HTTP ${upstream.status}`,
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
     * Apps Script can return HTTP 200 with ok:false in the JSON body.
     * Do not tell the customer their build review succeeded
     * when the backend actually rejected it.
     */
    if (data?.ok !== true) {
      console.error('Google Apps Script rejected build review:', data);

      return Response.json(
        {
          ok: false,
          error: data?.error || 'Build review submission was rejected.',
          upstream: data,
        },
        {
          status: 502,
        }
      );
    }

    /*
     * Verify that Apps Script says it actually handled
     * this submission as a build review.
     *
     * Once Code.gs is corrected, it will return:
     *
     * {
     *   ok: true,
     *   type: "build-review"
     * }
     *
     * This check prevents an accidental insurance lead
     * from appearing as a successful build review.
     */
    if (data?.type !== 'build-review') {
      console.error('Build review was routed incorrectly:', data);

      return Response.json(
        {
          ok: false,
          error:
            'Build review reached the backend but was not routed as a build review.',
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
    console.error('Build review API error:', err);

    return Response.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred while submitting the build review.',
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

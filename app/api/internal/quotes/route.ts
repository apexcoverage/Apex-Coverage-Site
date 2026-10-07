import { NextRequest, NextResponse } from "next/server";
import { getEmployeeSessionFromRequest } from "@/lib/internalAuth";
import { generateQuoteFromMatrix } from "@/lib/quotes/pricing";
import {
  createSavedQuote,
  listQuotes,
} from "@/lib/quotes/quoteStore";
import type {
  QuoteType,
} from "@/lib/quotes/types";
import { validateQuoteInput } from "@/lib/quotes/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isQuoteType(value: unknown): value is QuoteType {
  return value === "AUTO_INSURANCE" || value === "MODIFIED_VEHICLE_PROTECTION";
}

export async function GET(request: NextRequest) {
  const session = getEmployeeSessionFromRequest(request);
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Not signed in." },
      { status: 401 }
    );
  }

  const search = request.nextUrl.searchParams.get("search") || "";
  return NextResponse.json({ ok: true, quotes: listQuotes(search) });
}

export async function POST(request: NextRequest) {
  const session = getEmployeeSessionFromRequest(request);
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Not signed in." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const quoteType = body?.quoteType;

  if (!isQuoteType(quoteType)) {
    return NextResponse.json(
      { ok: false, error: "Invalid quote type." },
      { status: 400 }
    );
  }

  const validation = validateQuoteInput(quoteType, body?.input || {});

  if (!validation.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "Additional information required before this quote can be generated.",
        missingInformation: validation.missing,
        warnings: validation.warnings,
      },
      { status: 400 }
    );
  }

  try {
    const generated = generateQuoteFromMatrix(
      quoteType,
      validation.normalizedInput
    );

    const quote = createSavedQuote({
      quoteType,
      employee: session.user,
      input: validation.normalizedInput,
      result: {
        ...generated.result,
        warnings: [
          ...validation.pricingContext.warnings,
          ...generated.pricingContext.warnings,
          ...generated.result.warnings,
        ],
      },
      status: generated.status,
    });

    return NextResponse.json({ ok: true, quote });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err?.message ||
          "Matrix quote generation failed. Please try again or review the input.",
      },
      { status: 503 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getEmployeeSessionFromRequest } from "@/lib/internalAuth";
import { generateQuoteWithOpenAI } from "@/lib/quotes/openaiQuoteService";
import {
  calculateAutoInsuranceQuote,
  calculateModifiedVehicleProtectionQuote,
} from "@/lib/quotes/pricing";
import {
  createSavedQuote,
  listQuotes,
} from "@/lib/quotes/quoteStore";
import type {
  AutoInsuranceQuoteInput,
  ModifiedVehicleProtectionQuoteInput,
  QuotePricingContext,
  QuoteType,
} from "@/lib/quotes/types";
import { validateQuoteInput } from "@/lib/quotes/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isQuoteType(value: unknown): value is QuoteType {
  return value === "AUTO_INSURANCE" || value === "MODIFIED_VEHICLE_PROTECTION";
}

function mergePricingContext(
  validationContext: QuotePricingContext,
  serviceContext: QuotePricingContext
): QuotePricingContext {
  return {
    deterministicPricingAvailable:
      validationContext.deterministicPricingAvailable ||
      serviceContext.deterministicPricingAvailable,
    totalDeclaredBuildValue:
      validationContext.totalDeclaredBuildValue ??
      serviceContext.totalDeclaredBuildValue ??
      null,
    notes: [...validationContext.notes, ...serviceContext.notes],
    warnings: [...validationContext.warnings, ...serviceContext.warnings],
  };
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

  const servicePricingContext =
    quoteType === "AUTO_INSURANCE"
      ? calculateAutoInsuranceQuote(
          validation.normalizedInput as AutoInsuranceQuoteInput
        )
      : calculateModifiedVehicleProtectionQuote(
          validation.normalizedInput as ModifiedVehicleProtectionQuoteInput
        );

  const pricingContext = mergePricingContext(
    validation.pricingContext,
    servicePricingContext
  );

  try {
    const result = await generateQuoteWithOpenAI({
      quoteType,
      input: validation.normalizedInput,
      pricingContext,
    });

    const status =
      result.status === "estimate" && result.warnings.length === 0
        ? "GENERATED"
        : "NEEDS_REVIEW";

    const quote = createSavedQuote({
      quoteType,
      employee: session.user,
      input: validation.normalizedInput,
      result: {
        ...result,
        warnings: [...pricingContext.warnings, ...result.warnings],
      },
      status,
    });

    return NextResponse.json({ ok: true, quote });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err?.message ||
          "Quote generation failed. Please try again or review the input.",
      },
      { status: 503 }
    );
  }
}

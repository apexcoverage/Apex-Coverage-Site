import { NextRequest, NextResponse } from "next/server";
import { getEmployeeSessionFromRequest } from "@/lib/internalAuth";
import {
  getQuoteByQuoteId,
  updateQuoteStatus,
} from "@/lib/quotes/quoteStore";
import type { QuoteStatus } from "@/lib/quotes/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = new Set<QuoteStatus>([
  "GENERATED",
  "NEEDS_REVIEW",
  "SAVED",
  "APPROVED",
  "ARCHIVED",
]);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getEmployeeSessionFromRequest(request);
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Not signed in." },
      { status: 401 }
    );
  }

  const quote = getQuoteByQuoteId(params.id);
  if (!quote) {
    return NextResponse.json(
      { ok: false, error: "Quote not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, quote });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getEmployeeSessionFromRequest(request);
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Not signed in." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const status = String(body?.status || "") as QuoteStatus;

  if (!ALLOWED_STATUSES.has(status)) {
    return NextResponse.json(
      { ok: false, error: "Invalid quote status." },
      { status: 400 }
    );
  }

  const quote = updateQuoteStatus(params.id, status);
  if (!quote) {
    return NextResponse.json(
      { ok: false, error: "Quote not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, quote });
}

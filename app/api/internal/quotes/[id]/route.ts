import { NextRequest, NextResponse } from "next/server";
import { getEmployeeSessionFromRequest } from "@/lib/internalAuth";
import {
  getQuoteByQuoteId,
  updateQuoteReviewStatus,
} from "@/lib/quotes/quoteStore";
import type { QuoteReviewAction, QuoteStatus } from "@/lib/quotes/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = new Set<QuoteStatus>([
  "GENERATED",
  "NEEDS_REVIEW",
  "SAVED",
  "APPROVED",
  "DECLINED",
  "ARCHIVED",
]);

function canApproveOrDecline(role: string) {
  return role === "MANAGER" || role === "ADMIN";
}

function actionForStatus(status: QuoteStatus): QuoteReviewAction {
  if (status === "NEEDS_REVIEW") return "REQUESTED_REVIEW";
  if (status === "APPROVED") return "APPROVED_REVIEW";
  if (status === "DECLINED") return "DECLINED_REVIEW";
  return "STATUS_CHANGED";
}

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
  const note = String(body?.note || "").trim();

  if (!ALLOWED_STATUSES.has(status)) {
    return NextResponse.json(
      { ok: false, error: "Invalid quote status." },
      { status: 400 }
    );
  }

  if ((status === "APPROVED" || status === "DECLINED") && !canApproveOrDecline(session.user.role)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Manager or admin approval is required for this action.",
      },
      { status: 403 }
    );
  }

  const quote = updateQuoteReviewStatus({
    quoteId: params.id,
    status,
    reviewer: session.user,
    note,
    action: actionForStatus(status),
  });
  if (!quote) {
    return NextResponse.json(
      { ok: false, error: "Quote not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, quote });
}

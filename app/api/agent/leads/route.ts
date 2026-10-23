import { NextResponse } from "next/server";
import {
  agentDeleteLead,
  agentListLeads,
  agentUpdateLead,
} from "@/lib/agentAppsScript";
import { requireEmployeeApi } from "@/lib/internalAuth";

// GET /api/agent/leads  -> list leads for dashboard
export async function GET(req: Request) {
  const denied = await requireEmployeeApi(req);
  if (denied) return denied;
  try {
    const data = await agentListLeads();
    return NextResponse.json({ ok: true, rows: data.rows || [] });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

// POST /api/agent/leads  -> update lead (status, agent, etc.)
export async function POST(req: Request) {
  const denied = await requireEmployeeApi(req);
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => ({}));
    const { id, patch } = body || {};

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Missing id" },
        { status: 400 }
      );
    }

    if (!patch || typeof patch !== "object") {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid patch" },
        { status: 400 }
      );
    }

    await agentUpdateLead(Number(id), patch);

    return NextResponse.json({ ok: true, id, patch });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const denied = await requireEmployeeApi(req);
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => ({}));
    const { id, confirmHardDelete } = body || {};

    if (process.env.ALLOW_AGENT_HARD_DELETE !== "true") {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Hard delete is disabled. Archive the lead instead so worksheet and payment records stay linked.",
        },
        { status: 403 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Missing id" },
        { status: 400 }
      );
    }

    if (confirmHardDelete !== true) {
      return NextResponse.json(
        { ok: false, error: "Hard delete requires confirmHardDelete=true" },
        { status: 400 }
      );
    }

    await agentDeleteLead(Number(id));

    return NextResponse.json({ ok: true, id });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

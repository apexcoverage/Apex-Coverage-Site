import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_TOTAL_BYTES = 8 * 1024 * 1024;

type UploadFile = {
  name: string;
  type: string;
  size: number;
  base64: string;
};

async function fileToPayload(file: File): Promise<UploadFile> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return {
    name: file.name,
    type: file.type || "application/octet-stream",
    size: file.size,
    base64: buffer.toString("base64"),
  };
}

export async function POST(req: Request) {
  try {
    const gasWebAppUrl = process.env.GAS_WEBAPP_URL;

    if (!gasWebAppUrl) {
      return NextResponse.json(
        { ok: false, error: "Missing GAS_WEBAPP_URL" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const files = formData
      .getAll("files")
      .filter((value): value is File => typeof value !== "string");

    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

    if (files.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Attach at least one document or photo." },
        { status: 400 }
      );
    }

    if (totalBytes > MAX_TOTAL_BYTES) {
      return NextResponse.json(
        { ok: false, error: "Uploads must be 8 MB or less per submission." },
        { status: 400 }
      );
    }

    const payload = {
      type: "document-upload",
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      vehicle: String(formData.get("vehicle") || ""),
      uploadCode: String(formData.get("uploadCode") || ""),
      purpose: String(formData.get("purpose") || ""),
      notes: String(formData.get("notes") || ""),
      files: await Promise.all(files.map(fileToPayload)),
    };

    const upstream = await fetch(gasWebAppUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const text = await upstream.text();
    let data: any = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { ok: false, error: text || "Invalid document upload response." };
    }

    if (!upstream.ok || data?.ok !== true) {
      return NextResponse.json(
        {
          ok: false,
          error: data?.error || text || "Document upload was rejected.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

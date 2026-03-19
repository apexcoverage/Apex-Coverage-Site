import { NextResponse } from "next/server";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      policyNumber,
      startDate,
      endDate,
      totalPremium,
      vehicles,
      discounts,
    } = body;

    // Load template file
    const filePath = path.resolve(
      "./templates/Uploaded Policy Declarations Page.docx"
    );
    const content = fs.readFileSync(filePath, "binary");

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Replace placeholders
    doc.render({
      Name: name,
      "Policy Number": policyNumber,
      "Start Date": startDate,
      Date: startDate,
      "Total Premium": totalPremium,
      "Discount #1": discounts || "",
    });

    const buffer = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename=declaration.docx`,
      },
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}

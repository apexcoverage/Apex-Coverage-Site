import { NextResponse } from "next/server";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import fs from "fs";
import path from "path";

type VehicleTemplateData = {
  vin1: string;
  year1: string;
  make1: string;
  model1: string;
  vin2: string;
  year2: string;
  make2: string;
  model2: string;
};

function safeString(value: unknown): string {
  return String(value ?? "").trim();
}

function parseVehicleLine(line: string) {
  const trimmed = safeString(line);
  if (!trimmed) {
    return {
      vin: "",
      year: "",
      make: "",
      model: "",
    };
  }

  const parts = trimmed.split(/\s+/);

  let vin = "";
  let year = "";
  let make = "";
  let model = "";

  if (parts.length >= 4) {
    const first = parts[0];
    const second = parts[1];

    const looksLikeVin =
      /^[A-HJ-NPR-Z0-9]{11,17}$/i.test(first) ||
      /^[A-HJ-NPR-Z0-9-]{11,20}$/i.test(first);

    const looksLikeYear = /^\d{4}$/.test(looksLikeVin ? second : first);

    if (looksLikeVin) {
      vin = first;
      year = looksLikeYear ? second : "";
      make = parts[2] || "";
      model = parts.slice(3).join(" ");
    } else {
      year = looksLikeYear ? first : "";
      make = parts[1] || "";
      model = parts.slice(2).join(" ");
    }
  } else if (parts.length === 3) {
    if (/^\d{4}$/.test(parts[0])) {
      year = parts[0];
      make = parts[1];
      model = parts[2];
    } else {
      make = parts[0];
      model = `${parts[1]} ${parts[2]}`.trim();
    }
  } else if (parts.length === 2) {
    make = parts[0];
    model = parts[1];
  } else if (parts.length === 1) {
    model = parts[0];
  }

  return {
    vin,
    year,
    make,
    model,
  };
}

function buildVehicleTemplateData(vehicles: unknown): VehicleTemplateData {
  const lines = Array.isArray(vehicles)
    ? vehicles.map((v) => safeString(v)).filter(Boolean)
    : safeString(vehicles)
        .split(/\r?\n/)
        .map((v) => safeString(v))
        .filter(Boolean);

  const first = parseVehicleLine(lines[0] || "");
  const second = parseVehicleLine(lines[1] || "");

  return {
    vin1: first.vin,
    year1: first.year,
    make1: first.make,
    model1: first.model,
    vin2: second.vin,
    year2: second.year,
    make2: second.make,
    model2: second.model,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      policyNumber,
      startDate,
      endDate,
      totalPremium,
      discounts,
      discount1,
      discount2,
      discount3,
      discount4,
      discount5,
      vehicles,
    } = body || {};

    const filePath = path.resolve(
      "./templates/Uploaded Policy Declarations Page.docx"
    );
    const content = fs.readFileSync(filePath, "binary");

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    const vehicleData = buildVehicleTemplateData(vehicles);

    doc.render({
      name: safeString(name),
      policyNumber: safeString(policyNumber),
      startDate: safeString(startDate),
      endDate: safeString(endDate),
      totalPremium: safeString(totalPremium),
      discounts: safeString(discounts),
      discount1: safeString(discount1),
      discount2: safeString(discount2),
      discount3: safeString(discount3),
      discount4: safeString(discount4),
      discount5: safeString(discount5),
      vin1: vehicleData.vin1,
      year1: vehicleData.year1,
      make1: vehicleData.make1,
      model1: vehicleData.model1,
      vin2: vehicleData.vin2,
      year2: vehicleData.year2,
      make2: vehicleData.make2,
      model2: vehicleData.model2,
    });

    const buffer = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": 'attachment; filename="declaration.docx"',
      },
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to generate declaration" },
      { status: 500 }
    );
  }
}

export type InsuranceCardVehicle = {
  year: string;
  make: string;
  model: string;
  vin: string;
};

export type InsuranceCardPolicy = {
  status?: string;
  name?: string;
  policyNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  issuerNaic?: string;
  effectiveDate?: string;
  expirationDate?: string;
  cardVehicles?: string;
  vehicles?: string;
  year?: string;
  make?: string;
  model?: string;
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

export function parseCardVehicles(policy: InsuranceCardPolicy): InsuranceCardVehicle[] {
  const structured: InsuranceCardVehicle[] = [];
  try {
    const parsed = JSON.parse(clean(policy.cardVehicles) || "[]");
    if (Array.isArray(parsed)) {
      structured.push(...parsed.map((vehicle) => ({
        year: clean(vehicle?.year),
        make: clean(vehicle?.make),
        model: clean(vehicle?.model),
        vin: clean(vehicle?.vin).toUpperCase(),
      })));
    }
  } catch {
    // Older policies do not have a structured vehicle schedule yet.
  }

  const rawVehicles = clean(policy.vehicles);
  let lines: string[] = [];
  try {
    const parsed = JSON.parse(rawVehicles);
    if (Array.isArray(parsed)) {
      lines = parsed.map((vehicle) => typeof vehicle === "string"
        ? vehicle
        : [vehicle?.vin, vehicle?.year, vehicle?.make, vehicle?.model].filter(Boolean).join(" "));
    }
  } catch {
    lines = rawVehicles.split(/\r?\n|;|,\s*(?=(?:19|20)\d{2}\b)/);
  }

  const legacy = lines.map((line) => {
    const vin = line.match(/\b[A-HJ-NPR-Z0-9]{17}\b/i)?.[0]?.toUpperCase() || "";
    const withoutVin = line.replace(vin, "").replace(/\bVIN\s*[:#-]?/i, "").replace(/^\s*(?:\d+[.)-]|[-*])\s*/, "").replace(/[,|]/g, " ").trim();
    const yearMatch = withoutVin.match(/\b(?:19|20)\d{2}\b/);
    const parts = yearMatch ? withoutVin.slice((yearMatch.index || 0) + 4).trim().split(/\s+/) : [];
    return { year: yearMatch?.[0] || "", make: parts[0] || "", model: parts.slice(1).join(" "), vin };
  }).filter((vehicle) => vehicle.year || vehicle.make || vehicle.model || vehicle.vin);

  const result = [...structured];
  for (const vehicle of legacy) {
    const match = result.find((saved) =>
      (vehicle.vin && saved.vin && vehicle.vin === saved.vin) ||
      (vehicle.year === saved.year && vehicle.make.toLowerCase() === saved.make.toLowerCase() &&
        Boolean(vehicle.model && saved.model) &&
        (vehicle.model.toLowerCase() === saved.model.toLowerCase() ||
          vehicle.model.toLowerCase().startsWith(`${saved.model.toLowerCase()} `) ||
          saved.model.toLowerCase().startsWith(`${vehicle.model.toLowerCase()} `)))
    );
    if (match) {
      if (!match.vin) match.vin = vehicle.vin;
    } else {
      result.push(vehicle);
    }
  }

  if (result.length) return result;
  return [{
    year: clean(policy.year),
    make: clean(policy.make),
    model: clean(policy.model),
    vin: "",
  }];
}

export function defaultCardCopies(vehicleCount: number) {
  return vehicleCount <= 1 ? 4 : vehicleCount === 2 ? 2 : 1;
}

export function groupCardSheets(vehicles: InsuranceCardVehicle[], copies: number) {
  const cards = vehicles.flatMap((vehicle) => Array.from({ length: copies }, () => vehicle));
  return Array.from({ length: Math.ceil(cards.length / 4) }, (_, index) => cards.slice(index * 4, index * 4 + 4));
}

function validDate(value: unknown) {
  const text = clean(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const date = new Date(`${text}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
}

export function suggestedMonthlyExpiration(effectiveDate: string) {
  if (!validDate(effectiveDate)) return "";
  const [year, month, day] = effectiveDate.split("-").map(Number);
  const lastDayOfNextMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, lastDayOfNextMonth))).toISOString().slice(0, 10);
}

export function policyPeriodIsTooShort(effectiveDate: string, expirationDate: string) {
  if (!validDate(effectiveDate) || !validDate(expirationDate)) return false;
  const days = (Date.parse(`${expirationDate}T12:00:00Z`) - Date.parse(`${effectiveDate}T12:00:00Z`)) / 86400000;
  return days < 28;
}

export function insuranceCardMissingFields(policy: InsuranceCardPolicy) {
  const missing: string[] = [];
  if (clean(policy.status).toLowerCase() !== "won") missing.push("Active auto policy status");
  if (!clean(policy.name)) missing.push("Covered name");
  if (!clean(policy.policyNumber)) missing.push("Policy number");
  if (!clean(policy.addressLine1) || !clean(policy.city) || !/^\d{5}(?:-\d{4})?$/.test(clean(policy.zip))) {
    missing.push("Covered mailing address (street, city, and ZIP)");
  }
  if (!/^[A-Z]{2}$/.test(clean(policy.state).toUpperCase())) missing.push("Two-letter mailing state");
  if (!/^\d{5}$/.test(clean(policy.issuerNaic))) missing.push("Five-digit insurer NAIC number");
  if (clean(policy.issuerNaic) === "14282") {
    missing.push("Correct insurer NAIC number (14282 belongs to another insurer)");
  }
  if (!validDate(policy.effectiveDate)) missing.push("Policy effective date");
  if (!validDate(policy.expirationDate)) missing.push("Policy expiration date");

  if (validDate(policy.effectiveDate) && validDate(policy.expirationDate)) {
    if (clean(policy.expirationDate) <= clean(policy.effectiveDate)) {
      missing.push("Expiration date after effective date");
    }
    if (policyPeriodIsTooShort(clean(policy.effectiveDate), clean(policy.expirationDate))) {
      missing.push("Monthly policy end date (the saved period is under 28 days)");
    }
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    if (today < clean(policy.effectiveDate) || today > clean(policy.expirationDate)) {
      missing.push("Current policy period");
    }
  }

  parseCardVehicles(policy).forEach((vehicle, index) => {
    const label = `Vehicle ${index + 1}`;
    if (!/^\d{4}$/.test(vehicle.year) || !vehicle.make || !vehicle.model) {
      missing.push(`${label} year, make, and model`);
    }
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vehicle.vin)) {
      missing.push(`${label} 17-character VIN`);
    }
  });

  return missing;
}

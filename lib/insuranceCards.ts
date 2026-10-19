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
  policyState?: string;
  issuerName?: string;
  issuerNaic?: string;
  issuerAddress?: string;
  effectiveDate?: string;
  expirationDate?: string;
  cardVehicles?: string;
  year?: string;
  make?: string;
  model?: string;
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

export function parseCardVehicles(policy: InsuranceCardPolicy): InsuranceCardVehicle[] {
  try {
    const parsed = JSON.parse(clean(policy.cardVehicles) || "[]");
    if (Array.isArray(parsed) && parsed.length) {
      return parsed.map((vehicle) => ({
        year: clean(vehicle?.year),
        make: clean(vehicle?.make),
        model: clean(vehicle?.model),
        vin: clean(vehicle?.vin).toUpperCase(),
      }));
    }
  } catch {
    // Older policies do not have a structured vehicle schedule yet.
  }

  return [{
    year: clean(policy.year),
    make: clean(policy.make),
    model: clean(policy.model),
    vin: "",
  }];
}

function validDate(value: unknown) {
  const text = clean(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const date = new Date(`${text}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
}

export function insuranceCardMissingFields(policy: InsuranceCardPolicy) {
  const missing: string[] = [];
  if (clean(policy.status).toLowerCase() !== "won") missing.push("Active auto policy status");
  if (!clean(policy.name)) missing.push("Insured name");
  if (!clean(policy.policyNumber)) missing.push("Policy number");
  if (!/^[A-Z]{2}$/.test(clean(policy.policyState).toUpperCase())) missing.push("Two-letter policy state");
  if (!clean(policy.issuerName)) missing.push("Issuing insurer legal name");
  if (!/^\d{5}$/.test(clean(policy.issuerNaic))) missing.push("Five-digit insurer NAIC number");
  if (clean(policy.issuerNaic) === "14282") {
    missing.push("Correct insurer NAIC number (14282 belongs to another insurer)");
  }
  if (!clean(policy.issuerAddress)) missing.push("Issuing insurer address");
  if (!validDate(policy.effectiveDate)) missing.push("Policy effective date");
  if (!validDate(policy.expirationDate)) missing.push("Policy expiration date");

  if (validDate(policy.effectiveDate) && validDate(policy.expirationDate)) {
    if (clean(policy.expirationDate) <= clean(policy.effectiveDate)) {
      missing.push("Expiration date after effective date");
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

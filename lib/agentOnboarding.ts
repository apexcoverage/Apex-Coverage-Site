export type SetupKind = "auto" | "build";

export type SetupDetails = {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  year: string;
  make: string;
  model: string;
  vin: string;
  coverage: string;
  monthlyPremium: string;
  tierInterest: string;
  partsValue: string;
  deductible: string;
};

export function cleanSetupDetails(input: unknown): SetupDetails {
  const source = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const read = (key: keyof SetupDetails) => String(source[key] ?? "").trim().slice(0, 500);
  return {
    name: read("name"), email: read("email"), phone: read("phone"),
    addressLine1: read("addressLine1"), addressLine2: read("addressLine2"),
    city: read("city"), state: read("state").toUpperCase(), zip: read("zip"),
    year: read("year"), make: read("make"), model: read("model"), vin: read("vin").toUpperCase(),
    coverage: read("coverage"), monthlyPremium: read("monthlyPremium"),
    tierInterest: read("tierInterest"), partsValue: read("partsValue"), deductible: read("deductible"),
  };
}

export function setupMissingInformation(details: SetupDetails) {
  const missing: string[] = [];
  if (!details.name) missing.push("Customer name");
  if (!details.addressLine1) missing.push("Mailing street address");
  if (!details.city) missing.push("Mailing city");
  if (!/^[A-Z]{2}$/.test(details.state)) missing.push("Two-letter state");
  if (!/^\d{5}(?:-\d{4})?$/.test(details.zip)) missing.push("Mailing ZIP code");
  if (!details.year || !details.make || !details.model) missing.push("Vehicle year, make, and model");
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(details.vin)) missing.push("Valid 17-character VIN");
  return missing;
}

export function autoPolicyNumber(id: number, now = new Date()) {
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const year = String(now.getUTCFullYear()).slice(-2);
  return `APX-321326${month}${year}-${String(id).padStart(2, "0")}`;
}

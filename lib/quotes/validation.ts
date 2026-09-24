import type {
  AutoInsuranceQuoteInput,
  ModifiedVehicleProtectionQuoteInput,
  QuoteInput,
  QuotePricingContext,
  QuoteType,
  QuoteValidationResult,
  StructuredQuoteResult,
} from "./types";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function asList(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => clean(item)).filter(Boolean)
    : [];
}

export function parseCurrency(value: string) {
  const numeric = clean(value).replace(/[^0-9.]/g, "");
  if (!numeric) return null;
  const parsed = Number(numeric);
  return Number.isFinite(parsed) ? parsed : null;
}

export function calculateAgeFromDob(dob: string, now = new Date()) {
  const raw = clean(dob);
  if (!raw) return "";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";

  let age = now.getFullYear() - parsed.getFullYear();
  const monthDelta = now.getMonth() - parsed.getMonth();
  const beforeBirthday =
    monthDelta < 0 || (monthDelta === 0 && now.getDate() < parsed.getDate());

  if (beforeBirthday) age -= 1;
  return age >= 0 && age < 120 ? String(age) : "";
}

function normalizeAutoInput(input: Partial<AutoInsuranceQuoteInput>) {
  const vehicles = Array.isArray(input.vehicles) && input.vehicles.length > 0
    ? input.vehicles
    : [];

  return {
    customerName: clean(input.customerName),
    customerEmail: clean(input.customerEmail),
    customerPhone: clean(input.customerPhone),
    zip: clean(input.zip),
    dob: clean(input.dob),
    age: clean(input.age) || calculateAgeFromDob(clean(input.dob)),
    gender: clean(input.gender),
    drivingRecordStatus: clean(input.drivingRecordStatus),
    incidentType: clean(input.incidentType),
    incidentTiming: clean(input.incidentTiming),
    incidentDetails: clean(input.incidentDetails),
    vehicles: vehicles.map((vehicle) => ({
      year: clean(vehicle?.year),
      make: clean(vehicle?.make),
      model: clean(vehicle?.model),
      trimEngine: clean(vehicle?.trimEngine),
      coverageType: clean(vehicle?.coverageType),
      comprehensiveDeductible: clean(vehicle?.comprehensiveDeductible),
      collisionDeductible: clean(vehicle?.collisionDeductible),
    })),
    annualMileage: clean(input.annualMileage),
    garagedOvernight: clean(input.garagedOvernight),
    discounts: asList(input.discounts),
    notes: clean(input.notes),
  } satisfies AutoInsuranceQuoteInput;
}

function normalizeModifiedVehicleInput(
  input: Partial<ModifiedVehicleProtectionQuoteInput>
) {
  return {
    customerName: clean(input.customerName),
    customerEmail: clean(input.customerEmail),
    customerPhone: clean(input.customerPhone),
    zip: clean(input.zip),
    dob: clean(input.dob),
    age: clean(input.age) || calculateAgeFromDob(clean(input.dob)),
    gender: clean(input.gender),
    drivingHistory: clean(input.drivingHistory),
    claimHistory: clean(input.claimHistory),
    annualMileage: clean(input.annualMileage),
    vehicle: {
      year: clean(input.vehicle?.year),
      make: clean(input.vehicle?.make),
      model: clean(input.vehicle?.model),
      trim: clean(input.vehicle?.trim),
      vehicleMileage: clean(input.vehicle?.vehicleMileage),
      titleStatus: clean(input.vehicle?.titleStatus),
      garageKept: clean(input.vehicle?.garageKept),
    },
    modifications: {
      partsList: clean(input.modifications?.partsList),
      partsValue: clean(input.modifications?.partsValue),
      laborValue: clean(input.modifications?.laborValue),
      includeLaborInCoveredValue: clean(
        input.modifications?.includeLaborInCoveredValue
      ),
      installType: clean(input.modifications?.installType),
      tuneRequired: clean(input.modifications?.tuneRequired),
      safetyRelatedModsPresent: clean(
        input.modifications?.safetyRelatedModsPresent
      ),
      performanceModsPresent: clean(
        input.modifications?.performanceModsPresent
      ),
    },
    coverage: {
      deductible: clean(input.coverage?.deductible),
      requestedTier: clean(input.coverage?.requestedTier) || "Let system recommend",
      applyDiscounts: clean(input.coverage?.applyDiscounts),
      discounts: asList(input.coverage?.discounts),
    },
    underwriting: {
      vinAvailable: clean(input.underwriting?.vinAvailable),
      receiptsAvailable: clean(input.underwriting?.receiptsAvailable),
      photosAvailable: clean(input.underwriting?.photosAvailable),
      tuneDocumentationAvailable: clean(
        input.underwriting?.tuneDocumentationAvailable
      ),
      shopInvoicesAvailable: clean(input.underwriting?.shopInvoicesAvailable),
      rebuiltSalvageDocumentationAvailable: clean(
        input.underwriting?.rebuiltSalvageDocumentationAvailable
      ),
      racingTrackDriftUse: clean(input.underwriting?.racingTrackDriftUse),
    },
    notes: clean(input.notes),
  } satisfies ModifiedVehicleProtectionQuoteInput;
}

function addMissing(missing: string[], value: string, label: string) {
  if (!value) missing.push(label);
}

function buildAutoPricingContext(input: AutoInsuranceQuoteInput) {
  const warnings: string[] = [];

  input.vehicles.forEach((vehicle, index) => {
    const label = input.vehicles.length > 1 ? `Vehicle ${index + 1}` : "Vehicle";
    if (
      vehicle.coverageType === "Liability Only" &&
      (vehicle.comprehensiveDeductible || vehicle.collisionDeductible)
    ) {
      warnings.push(
        `${label}: liability-only coverage ignores comprehensive and collision deductibles.`
      );
    }
  });

  return {
    deterministicPricingAvailable: false,
    notes: [
      "Auto coverage pricing is currently an AI-assisted planning estimate because no Apex rate table or carrier rating engine was supplied.",
      "Carrier-issued premiums should be connected later through calculateAutoInsuranceQuote().",
    ],
    warnings,
  } satisfies QuotePricingContext;
}

function buildModifiedVehiclePricingContext(
  input: ModifiedVehicleProtectionQuoteInput
) {
  const partsValue = parseCurrency(input.modifications.partsValue);
  const laborValue = parseCurrency(input.modifications.laborValue);
  const includeLabor = input.modifications.includeLaborInCoveredValue === "Yes";
  const totalDeclaredBuildValue =
    partsValue === null
      ? null
      : partsValue + (includeLabor && laborValue ? laborValue : 0);

  const warnings: string[] = [];
  if (input.underwriting.racingTrackDriftUse === "Yes") {
    warnings.push("Racing, track, drift, autocross, or timed-event use requires employee review before binding.");
  }
  if (["Rebuilt", "Salvage"].includes(input.vehicle.titleStatus)) {
    warnings.push("Rebuilt or salvage title requires documentation before binding.");
  }

  return {
    deterministicPricingAvailable: false,
    totalDeclaredBuildValue,
    notes: [
      "Modified Vehicle Protection pricing is currently judgment-based from the supplied Apex workflow, not a formal rate table.",
      "The app deterministically calculates total declared build value when parts and covered labor are supplied.",
      "Formal pricing can later be connected through calculateModifiedVehicleProtectionQuote().",
    ],
    warnings,
  } satisfies QuotePricingContext;
}

function validateAuto(input: Partial<AutoInsuranceQuoteInput>) {
  const normalizedInput = normalizeAutoInput(input);
  const missing: string[] = [];

  addMissing(missing, normalizedInput.zip, "ZIP code");
  if (!normalizedInput.age && !normalizedInput.dob) {
    missing.push("Driver age or date of birth");
  }
  addMissing(missing, normalizedInput.gender, "Gender");
  addMissing(missing, normalizedInput.drivingRecordStatus, "Driving record");

  if (normalizedInput.drivingRecordStatus === "Accident(s)/Ticket(s)") {
    addMissing(missing, normalizedInput.incidentType, "Incident type");
    addMissing(missing, normalizedInput.incidentTiming, "How long ago the incident occurred");
  }

  if (normalizedInput.vehicles.length === 0) {
    missing.push("At least one vehicle");
  }

  normalizedInput.vehicles.forEach((vehicle, index) => {
    const prefix = normalizedInput.vehicles.length > 1 ? `Vehicle ${index + 1} ` : "";
    addMissing(missing, vehicle.year, `${prefix}year`);
    addMissing(missing, vehicle.make, `${prefix}make`);
    addMissing(missing, vehicle.model, `${prefix}model`);
    addMissing(missing, vehicle.coverageType, `${prefix}coverage type`);

    if (vehicle.coverageType === "Full Coverage") {
      addMissing(missing, vehicle.comprehensiveDeductible, `${prefix}comprehensive deductible`);
      addMissing(missing, vehicle.collisionDeductible, `${prefix}collision deductible`);
    }
  });

  const pricingContext = buildAutoPricingContext(normalizedInput);

  return {
    ok: missing.length === 0,
    missing,
    warnings: pricingContext.warnings,
    normalizedInput,
    pricingContext,
  } satisfies QuoteValidationResult;
}

function validateModifiedVehicle(
  input: Partial<ModifiedVehicleProtectionQuoteInput>
) {
  const normalizedInput = normalizeModifiedVehicleInput(input);
  const missing: string[] = [];

  addMissing(missing, normalizedInput.zip, "ZIP code");
  if (!normalizedInput.age && !normalizedInput.dob) {
    missing.push("Age or date of birth");
  }
  addMissing(missing, normalizedInput.gender, "Gender");
  addMissing(missing, normalizedInput.drivingHistory, "Driving history");
  addMissing(missing, normalizedInput.claimHistory, "Claim history or Unknown");
  addMissing(missing, normalizedInput.annualMileage, "Annual mileage");
  addMissing(missing, normalizedInput.vehicle.year, "Vehicle year");
  addMissing(missing, normalizedInput.vehicle.make, "Vehicle make");
  addMissing(missing, normalizedInput.vehicle.model, "Vehicle model");
  addMissing(missing, normalizedInput.vehicle.vehicleMileage, "Vehicle mileage");
  addMissing(missing, normalizedInput.vehicle.titleStatus, "Title status");
  addMissing(missing, normalizedInput.vehicle.garageKept, "Garage-kept status");
  addMissing(missing, normalizedInput.modifications.partsValue, "Parts/build value");
  addMissing(missing, normalizedInput.modifications.installType, "Install type");
  addMissing(missing, normalizedInput.modifications.tuneRequired, "Tune required");
  addMissing(missing, normalizedInput.coverage.deductible, "Deductible");
  addMissing(missing, normalizedInput.coverage.applyDiscounts, "Apply discounts now?");

  if (
    normalizedInput.modifications.laborValue &&
    !normalizedInput.modifications.includeLaborInCoveredValue
  ) {
    missing.push("Whether labor should be included in covered value");
  }

  const pricingContext = buildModifiedVehiclePricingContext(normalizedInput);

  return {
    ok: missing.length === 0,
    missing,
    warnings: pricingContext.warnings,
    normalizedInput,
    pricingContext,
  } satisfies QuoteValidationResult;
}

export function validateQuoteInput(
  quoteType: QuoteType,
  input: Partial<QuoteInput>
) {
  return quoteType === "AUTO_INSURANCE"
    ? validateAuto(input as Partial<AutoInsuranceQuoteInput>)
    : validateModifiedVehicle(
        input as Partial<ModifiedVehicleProtectionQuoteInput>
      );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function stringArray(value: unknown) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function validateStructuredQuoteResult(
  value: unknown,
  expectedQuoteType: QuoteType
): StructuredQuoteResult {
  if (!isObject(value)) {
    throw new Error("OpenAI response was not a structured object.");
  }

  if (value.quote_type !== expectedQuoteType) {
    throw new Error("OpenAI response used the wrong quote type.");
  }

  const requiredObjects = [
    "customer",
    "vehicle",
    "coverage",
    "pricing",
    "underwriting",
  ];
  requiredObjects.forEach((key) => {
    if (!isObject(value[key])) {
      throw new Error(`OpenAI response is missing ${key}.`);
    }
  });

  ["warnings", "missing_information"].forEach((key) => {
    if (!stringArray(value[key])) {
      throw new Error(`OpenAI response has an invalid ${key} list.`);
    }
  });

  if (typeof value.customer_quote_text !== "string") {
    throw new Error("OpenAI response is missing customer quote text.");
  }

  return value as StructuredQuoteResult;
}

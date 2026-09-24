import test from "node:test";
import assert from "node:assert/strict";
import { calculateModifiedVehicleProtectionQuote } from "../lib/quotes/pricing";
import { structuredQuoteResultJsonSchema } from "../lib/quotes/resultSchema";
import type {
  AutoInsuranceQuoteInput,
  ModifiedVehicleProtectionQuoteInput,
  QuoteType,
  StructuredQuoteResult,
} from "../lib/quotes/types";
import {
  validateQuoteInput,
  validateStructuredQuoteResult,
} from "../lib/quotes/validation";

function validAutoInput(): AutoInsuranceQuoteInput {
  return {
    customerName: "Taylor Jordan",
    customerEmail: "taylor@example.com",
    customerPhone: "555-0100",
    zip: "92692",
    dob: "2006-12-11",
    age: "",
    gender: "Male",
    drivingRecordStatus: "Clean",
    incidentType: "",
    incidentTiming: "",
    incidentDetails: "",
    vehicles: [
      {
        year: "2001",
        make: "Ford",
        model: "Explorer Sport",
        trimEngine: "",
        coverageType: "Liability Only",
        comprehensiveDeductible: "",
        collisionDeductible: "",
      },
    ],
    annualMileage: "",
    garagedOvernight: "",
    discounts: ["Military"],
    notes: "",
  };
}

function validModifiedInput(): ModifiedVehicleProtectionQuoteInput {
  return {
    customerName: "Jordan Lee",
    customerEmail: "jordan@example.com",
    customerPhone: "555-0101",
    zip: "22551",
    dob: "1999-12-18",
    age: "",
    gender: "Male",
    drivingHistory: "Clean",
    claimHistory: "None",
    annualMileage: "Under 5,000",
    vehicle: {
      year: "2013",
      make: "Nissan",
      model: "370Z",
      trim: "NISMO",
      vehicleMileage: "130000",
      titleStatus: "Clean",
      garageKept: "Yes",
    },
    modifications: {
      partsList: "Coilovers, wheels, intake, exhaust, tune",
      partsValue: "16682",
      laborValue: "10290",
      includeLaborInCoveredValue: "Yes",
      installType: "Mixed professional and DIY",
      tuneRequired: "Yes",
      safetyRelatedModsPresent: "Yes",
      performanceModsPresent: "Yes",
    },
    coverage: {
      deductible: "1000",
      requestedTier: "Let system recommend",
      applyDiscounts: "No",
      discounts: [],
    },
    underwriting: {
      vinAvailable: "No",
      receiptsAvailable: "Yes",
      photosAvailable: "Yes",
      tuneDocumentationAvailable: "Yes",
      shopInvoicesAvailable: "Yes",
      rebuiltSalvageDocumentationAvailable: "N/A",
      racingTrackDriftUse: "No",
    },
    notes: "",
  };
}

function resultFor(type: QuoteType): StructuredQuoteResult {
  return {
    quote_type: type,
    status: "estimate",
    customer: {
      name: "Taylor Jordan",
      zip: "92692",
      age: "19",
      dob: "2006-12-11",
      gender: "Male",
    },
    vehicle: {
      year: "2001",
      make: "Ford",
      model: "Explorer Sport",
      trim: "",
      summary: "2001 Ford Explorer Sport",
    },
    coverage: {
      type: "Liability Only",
      tier: "",
      deductible: "",
      included_items: ["Liability coverage"],
      excluded_or_not_included: ["Comprehensive", "Collision"],
    },
    pricing: {
      pricing_available: true,
      monthly_estimate: "$145",
      monthly_range: "$130-$165",
      six_month_estimate: "$870",
      annual_estimate: "$1,740",
      pricing_notes: ["Planning estimate only."],
    },
    underwriting: {
      decision: "Employee review required before presentation.",
      risk_score: "Not formalized",
      required_before_binding: [],
      review_flags: [],
    },
    warnings: [],
    missing_information: [],
    employee_notes: "Review before sharing.",
    customer_quote_text: "Apex quote estimate.",
  };
}

test("auto quote validation requires the minimum workflow fields", () => {
  const result = validateQuoteInput("AUTO_INSURANCE", {
    ...validAutoInput(),
    zip: "",
    vehicles: [{ ...validAutoInput().vehicles[0], model: "" }],
  });

  assert.equal(result.ok, false);
  assert.ok(result.missing.includes("ZIP code"));
  assert.ok(result.missing.includes("model"));
});

test("auto quote validation requires deductibles only for full coverage", () => {
  const input = validAutoInput();
  input.vehicles[0].coverageType = "Full Coverage";

  const result = validateQuoteInput("AUTO_INSURANCE", input);
  assert.equal(result.ok, false);
  assert.ok(result.missing.includes("comprehensive deductible"));
  assert.ok(result.missing.includes("collision deductible"));
});

test("auto quote validation flags liability deductibles instead of pricing them", () => {
  const input = validAutoInput();
  input.vehicles[0].comprehensiveDeductible = "1000";

  const result = validateQuoteInput("AUTO_INSURANCE", input);
  assert.equal(result.ok, true);
  assert.equal(result.warnings.length, 1);
});

test("modified vehicle validation requires build-specific minimum fields", () => {
  const input = validModifiedInput();
  input.vehicle.vehicleMileage = "";
  input.modifications.tuneRequired = "";

  const result = validateQuoteInput("MODIFIED_VEHICLE_PROTECTION", input);
  assert.equal(result.ok, false);
  assert.ok(result.missing.includes("Vehicle mileage"));
  assert.ok(result.missing.includes("Tune required"));
});

test("modified vehicle pricing placeholder calculates declared build value only", () => {
  const result = calculateModifiedVehicleProtectionQuote(validModifiedInput());

  assert.equal(result.deterministicPricingAvailable, false);
  assert.equal(result.totalDeclaredBuildValue, 26972);
});

test("structured quote validation prevents quote type bleed-over", () => {
  assert.throws(() =>
    validateStructuredQuoteResult(
      resultFor("AUTO_INSURANCE"),
      "MODIFIED_VEHICLE_PROTECTION"
    )
  );
});

test("structured quote schema includes the expected top-level contract", () => {
  assert.equal(structuredQuoteResultJsonSchema.type, "object");
  assert.ok(structuredQuoteResultJsonSchema.required.includes("quote_type"));
  assert.ok(structuredQuoteResultJsonSchema.required.includes("pricing"));
  assert.ok(structuredQuoteResultJsonSchema.required.includes("customer_quote_text"));
});

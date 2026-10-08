import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateAutoInsuranceQuote,
  calculateModifiedVehicleProtectionQuote,
} from "../lib/quotes/pricing";
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
import { lookupZipRisk } from "../lib/quotes/zipRisk";
import { lookupVehicleRisk } from "../lib/quotes/vehicleRisk";

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
    incidents: [],
    vehicles: [
      {
        year: "2001",
        make: "Ford",
        model: "Explorer Sport",
        trimEngine: "",
        coverageType: "Liability Only",
        liabilityLimits: "State minimum",
        comprehensiveDeductible: "",
        collisionDeductible: "",
      },
    ],
    annualMileage: "12000",
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
      components: [
        {
          name: "Coilovers",
          category: "Suspension",
          declaredValue: "2500",
          trackExposed: "No",
        },
        {
          name: "Wheels",
          category: "Wheels",
          declaredValue: "3000",
          trackExposed: "No",
        },
      ],
    },
    coverage: {
      deductible: "500",
      vehicleUsage: "Weekend / recreational",
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
      trackEventsPerYear: "",
      competitiveRacing: "No",
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

test("auto matrix calculates a deterministic monthly premium", () => {
  const result = calculateAutoInsuranceQuote(validAutoInput());

  assert.equal(result.pricingContext.deterministicPricingAvailable, true);
  assert.equal(result.result.rate_version, "AUTO_V1.0");
  assert.equal(result.result.pricing.pricing_available, true);
  assert.match(result.result.pricing.monthly_estimate, /^\$\d+\/month$/);
  assert.ok(result.result.rating_details?.factors.some((factor) => factor.label === "ZIP band"));
  assert.ok(result.result.rating_details?.factors.some((factor) => factor.label === "Minimum liability"));
});

test("auto liability coverage has a 25 dollar monthly floor", () => {
  const input = validAutoInput();
  input.zip = "99801";
  input.dob = "";
  input.age = "45";
  input.gender = "Female";
  input.annualMileage = "3000";
  input.discounts = [];
  input.vehicles = [
    {
      year: "2004",
      make: "Audi",
      model: "TT",
      trimEngine: "Quattro",
      coverageType: "Liability Only",
      liabilityLimits: "State minimum",
      comprehensiveDeductible: "",
      collisionDeductible: "",
    },
  ];

  const result = calculateAutoInsuranceQuote(input);

  assert.equal(result.result.pricing.monthly_estimate, "$25/month");
});

test("auto liability limit options increase liability pricing", () => {
  const stateMinimum = validAutoInput();
  stateMinimum.discounts = [];
  const higherLimit = validAutoInput();
  higherLimit.discounts = [];
  higherLimit.vehicles[0].liabilityLimits = "250/500/250";

  const stateMinimumResult = calculateAutoInsuranceQuote(stateMinimum);
  const higherLimitResult = calculateAutoInsuranceQuote(higherLimit);
  const stateMinimumMonthly = Number(
    stateMinimumResult.result.pricing.monthly_estimate.replace(/[^0-9]/g, "")
  );
  const higherLimitMonthly = Number(
    higherLimitResult.result.pricing.monthly_estimate.replace(/[^0-9]/g, "")
  );
  const limitFactor = higherLimitResult.result.rating_details?.line_items
    .flatMap((item) => item.details)
    .find((detail) => detail.label === "Liability limit factor");

  assert.equal(limitFactor?.value, "1.3x");
  assert.ok(higherLimitMonthly > stateMinimumMonthly);
});

test("multiple-incident formula is order independent and flags heavy histories", () => {
  const first = validAutoInput();
  first.drivingRecordStatus = "Accident(s)/Ticket(s)";
  first.incidents = [
    {
      incidentType: "Minor speeding ticket",
      atFault: "N/A",
      timing: "1 year ago",
      count: "1",
      details: "",
    },
    {
      incidentType: "Accident",
      atFault: "At-fault",
      timing: "2 years ago",
      count: "1",
      details: "",
    },
    {
      incidentType: "Accident",
      atFault: "At-fault",
      timing: "4 years ago",
      count: "1",
      details: "",
    },
  ];
  const second = {
    ...first,
    incidents: [...first.incidents].reverse(),
  };

  const firstResult = calculateAutoInsuranceQuote(first);
  const secondResult = calculateAutoInsuranceQuote(second);

  assert.equal(firstResult.result.pricing.monthly_estimate, secondResult.result.pricing.monthly_estimate);
  assert.ok(
    firstResult.result.underwriting.review_flags.some((flag) =>
      flag.includes("3 chargeable incidents")
    )
  );
});

test("ZIP risk lookup uses exact ZIPs before prefix fallback", () => {
  const exact = lookupZipRisk("92692");
  const prefix = lookupZipRisk("92699");
  const fallback = lookupZipRisk("");

  assert.equal(exact.matchType, "exact");
  assert.equal(exact.bucket, "Very High");
  assert.equal(prefix.matchType, "prefix");
  assert.equal(prefix.bucket, "Very High");
  assert.equal(fallback.matchType, "default");
  assert.equal(fallback.bucket, "Average");
});

test("vehicle risk lookup uses sourced HLDI model factors", () => {
  const regularVehicle = lookupVehicleRisk({
    year: "2013",
    make: "Nissan",
    model: "370Z",
    trimEngine: "NISMO",
    coverageType: "Full Coverage",
    liabilityLimits: "State minimum",
    comprehensiveDeductible: "500",
    collisionDeductible: "1000",
  });
  const highRiskVehicle = lookupVehicleRisk({
    year: "2024",
    make: "Lamborghini",
    model: "Huracan",
    trimEngine: "",
    coverageType: "Full Coverage",
    liabilityLimits: "State minimum",
    comprehensiveDeductible: "500",
    collisionDeductible: "500",
  });

  assert.equal(regularVehicle.matchType, "model");
  assert.match(regularVehicle.sourceVehicle, /Nissan 370Z/);
  assert.ok(regularVehicle.collisionFactor > 1);
  assert.equal(highRiskVehicle.matchType, "model");
  assert.ok(highRiskVehicle.reviewFlags.length > 0);
});

test("modified vehicle matrix prices component rows and applies the floor", () => {
  const result = calculateModifiedVehicleProtectionQuote(validModifiedInput());

  assert.equal(result.pricingContext.deterministicPricingAvailable, true);
  assert.equal(result.pricingContext.totalDeclaredBuildValue, 5500);
  assert.equal(result.result.rate_version, "MVP_V1.0");
  assert.equal(result.result.coverage.tier, "Street Plus");
  assert.match(result.result.pricing.monthly_estimate, /^\$\d+\/month$/);
});

test("modified vehicle matrix applies deductible factors before the floor", () => {
  const standard = calculateModifiedVehicleProtectionQuote(validModifiedInput());
  const higherDeductibleInput = validModifiedInput();
  higherDeductibleInput.coverage.deductible = "2500";

  const higherDeductible = calculateModifiedVehicleProtectionQuote(higherDeductibleInput);
  const standardMonthly = Number(
    standard.result.pricing.monthly_estimate.replace(/[^0-9]/g, "")
  );
  const higherDeductibleMonthly = Number(
    higherDeductible.result.pricing.monthly_estimate.replace(/[^0-9]/g, "")
  );
  const deductibleFactor = higherDeductible.result.rating_details?.factors.find(
    (factor) => factor.label === "Deductible factor"
  );

  assert.equal(deductibleFactor?.value, "0.75x");
  assert.ok(higherDeductibleMonthly < standardMonthly);
  assert.ok(
    higherDeductible.result.pricing.pricing_notes.some((note) =>
      note.includes("Deductible adjustment")
    )
  );
});

test("modified vehicle discounts stack but cap at 25 percent", () => {
  const input = validModifiedInput();
  input.coverage.applyDiscounts = "Yes";
  input.coverage.discounts = [
    "Military",
    "Garage-kept",
    "Anti-theft",
    "Clean driving history",
    "No prior claims",
    "Low mileage",
  ];

  const result = calculateModifiedVehicleProtectionQuote(input);
  const allowedDiscount = result.result.rating_details?.factors.find(
    (factor) => factor.label === "Allowed discounts"
  );

  assert.equal(allowedDiscount?.value, "25%");
  assert.ok(result.result.warnings.includes("MVP discount cap applied at 25%."));
});

test("modified vehicle rebuilt titles and safety mods require manager approval", () => {
  const input = validModifiedInput();
  input.vehicle.titleStatus = "Rebuilt";
  input.modifications.safetyRelatedModsPresent = "Yes";

  const result = calculateModifiedVehicleProtectionQuote(input);

  assert.equal(result.status, "NEEDS_REVIEW");
  assert.ok(
    result.result.underwriting.review_flags.some((flag) =>
      flag.includes("Rebuilt title")
    )
  );
  assert.ok(
    result.result.underwriting.review_flags.some((flag) =>
      flag.includes("Safety-related modifications")
    )
  );
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

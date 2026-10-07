import type {
  AutoDrivingIncidentInput,
  AutoInsuranceQuoteInput,
  AutoQuoteVehicleInput,
  ModifiedVehicleComponentInput,
  ModifiedVehicleProtectionQuoteInput,
  QuotePricingContext,
  QuoteRatingDetail,
  QuoteRatingLineItem,
  QuoteStatus,
  QuoteType,
  StructuredQuoteResult,
} from "./types";
import { AUTO_RATE_TABLE, MVP_RATE_TABLE } from "./rateTables";
import { parseCurrency } from "./validation";

type MatrixQuoteOutput = {
  result: StructuredQuoteResult;
  pricingContext: QuotePricingContext;
  status: QuoteStatus;
};

function money(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function moneyWithCents(value: number) {
  return `$${value.toFixed(2)}`;
}

function numeric(value: string) {
  const parsed = Number(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function factorLabel(value: number) {
  return `${value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}x`;
}

function percentLabel(value: number) {
  return `${Math.round(value * 100)}%`;
}

function detail(label: string, value: string): QuoteRatingDetail {
  return { label, value };
}

function vehicleSummary(vehicle: {
  year?: string;
  make?: string;
  model?: string;
  trimEngine?: string;
  trim?: string;
}) {
  return [vehicle.year, vehicle.make, vehicle.model, vehicle.trimEngine || vehicle.trim]
    .filter(Boolean)
    .join(" ");
}

function ageFactor(ageValue: string) {
  const age = numeric(ageValue);
  const band = AUTO_RATE_TABLE.ageFactors.find(
    (item) => age >= item.min && age <= item.max
  );
  return {
    age,
    label: band?.label || "Unknown age",
    factor: band?.factor || 1,
  };
}

function mileageFactor(mileageValue: string) {
  const mileage = numeric(mileageValue);
  const band = AUTO_RATE_TABLE.mileageFactors.find(
    (item) => mileage >= item.min && mileage <= item.max
  );
  return {
    mileage,
    label: band?.label || "10,001-15,000",
    factor: band?.factor || 1,
  };
}

function classifyIncident(incident: AutoDrivingIncidentInput | {
  incidentType: string;
  atFault?: string;
  timing: string;
  details?: string;
}) {
  const type = String(incident.incidentType || "").toLowerCase();
  const atFault = String(incident.atFault || "").toLowerCase();
  const combined = `${type} ${atFault}`;

  if (combined.includes("dui")) return "dui";
  if (combined.includes("major") || combined.includes("reckless")) {
    return "majorViolation";
  }
  if (combined.includes("not") && combined.includes("fault")) {
    return "notAtFaultAccident";
  }
  if (combined.includes("accident") && combined.includes("fault")) {
    return "atFaultAccident";
  }
  if (combined.includes("ticket") || combined.includes("speed")) {
    return "minorSpeeding";
  }
  if (!type) return "clean";
  return "unclassified";
}

function expandedIncidents(input: AutoInsuranceQuoteInput) {
  if (input.incidents.length > 0) {
    return input.incidents.flatMap((incident) => {
      const count = Math.max(1, Math.round(numeric(incident.count || "1")));
      return Array.from({ length: count }, () => incident);
    });
  }

  if (input.drivingRecordStatus === "Accident(s)/Ticket(s)") {
    return [
      {
        incidentType: input.incidentType,
        atFault: "",
        timing: input.incidentTiming,
        details: input.incidentDetails,
      },
    ];
  }

  return [];
}

function drivingHistoryFactor(input: AutoInsuranceQuoteInput) {
  const incidents = expandedIncidents(input);
  const manualReviewReasons: string[] = [];
  const lineItems: QuoteRatingLineItem[] = [];

  if (input.drivingRecordStatus === "Clean" || incidents.length === 0) {
    return {
      factor: 1,
      manualReviewReasons,
      lineItems: [
        {
          label: "Driving history",
          value: "Clean record",
          details: [detail("Factor", factorLabel(1))],
        },
      ],
    };
  }

  const impacts = incidents.map((incident, index) => {
    const key = classifyIncident(incident);
    const config = AUTO_RATE_TABLE.drivingHistory[key as keyof typeof AUTO_RATE_TABLE.drivingHistory];
    if (config.manualReview) {
      manualReviewReasons.push(
        key === "dui"
          ? "DUI / serious major violation"
          : "Major or unclassified driving-history event"
      );
    }
    lineItems.push({
      label: `Incident ${index + 1}`,
      value: incident.incidentType || "Unclassified incident",
      details: [
        detail("Timing", incident.timing || "Not supplied"),
        detail("Classification", key),
        detail("Base factor", factorLabel(config.factor)),
      ],
    });
    return Math.max(0, config.factor - 1);
  });

  const totalImpact = impacts.reduce((sum, impact, index) => {
    return sum + impact * (index === 0 ? 1 : AUTO_RATE_TABLE.additionalIncidentImpactFactor);
  }, 0);
  const uncappedFactor = 1 + totalImpact;
  const cappedFactor = Math.min(
    uncappedFactor,
    AUTO_RATE_TABLE.maxAutomatedDrivingHistoryFactor
  );

  if (uncappedFactor > AUTO_RATE_TABLE.maxAutomatedDrivingHistoryFactor) {
    manualReviewReasons.push("Driving-history factor exceeded automated cap");
  }

  lineItems.push({
    label: "Driving-history factor",
    value: factorLabel(cappedFactor),
    details: [
      detail("Uncapped factor", factorLabel(uncappedFactor)),
      detail("Automated cap", factorLabel(AUTO_RATE_TABLE.maxAutomatedDrivingHistoryFactor)),
      detail("Additional incident impact", `${Math.round(AUTO_RATE_TABLE.additionalIncidentImpactFactor * 100)}% of normal impact`),
    ],
  });

  return {
    factor: cappedFactor,
    manualReviewReasons: [...new Set(manualReviewReasons)],
    lineItems,
  };
}

function deductibleFactor(value: string) {
  const key = String(numeric(value));
  return AUTO_RATE_TABLE.deductibleFactors[key as keyof typeof AUTO_RATE_TABLE.deductibleFactors] ?? 1;
}

function autoDiscounts(discounts: string[]) {
  const discountLines: QuoteRatingDetail[] = [];
  let requested = 0;

  discounts.forEach((discount) => {
    const amount = AUTO_RATE_TABLE.discounts[discount] || 0;
    if (amount > 0) {
      requested += amount;
      discountLines.push(detail(discount, percentLabel(amount)));
    } else {
      discountLines.push(detail(discount, "Not rated in AUTO_V1.0"));
    }
  });

  const allowed = Math.min(requested, AUTO_RATE_TABLE.maxDiscount);
  return {
    requested,
    allowed,
    capped: requested > allowed,
    lines: discountLines,
  };
}

function calculateVehiclePremium(args: {
  vehicle: AutoQuoteVehicleInput;
  liabilityBeforeCoverage: number;
}) {
  const fullCoverage = args.vehicle.coverageType === "Full Coverage";
  const compFactor = fullCoverage
    ? deductibleFactor(args.vehicle.comprehensiveDeductible)
    : 0;
  const collisionFactor = fullCoverage
    ? deductibleFactor(args.vehicle.collisionDeductible)
    : 0;
  const compPremium = fullCoverage
    ? AUTO_RATE_TABLE.compBaseMonthly *
      AUTO_RATE_TABLE.temporaryVehicleFactors.comprehensive *
      compFactor
    : 0;
  const collisionPremium = fullCoverage
    ? AUTO_RATE_TABLE.collisionBaseMonthly *
      AUTO_RATE_TABLE.temporaryVehicleFactors.collision *
      collisionFactor
    : 0;
  const gross = args.liabilityBeforeCoverage + compPremium + collisionPremium;

  return {
    liability: args.liabilityBeforeCoverage,
    compPremium,
    collisionPremium,
    gross,
    lineItem: {
      label: vehicleSummary(args.vehicle) || "Vehicle",
      value: money(gross),
      details: [
        detail("Coverage", args.vehicle.coverageType),
        detail("Liability limits", args.vehicle.liabilityLimits || "Standard limits"),
        detail("Liability premium", moneyWithCents(args.liabilityBeforeCoverage)),
        detail("Comprehensive", fullCoverage ? moneyWithCents(compPremium) : "Not included"),
        detail("Collision", fullCoverage ? moneyWithCents(collisionPremium) : "Not included"),
        detail("Comp deductible factor", fullCoverage ? factorLabel(compFactor) : "N/A"),
        detail("Collision deductible factor", fullCoverage ? factorLabel(collisionFactor) : "N/A"),
      ],
    } satisfies QuoteRatingLineItem,
  };
}

export function calculateAutoInsuranceQuote(
  input: AutoInsuranceQuoteInput
): MatrixQuoteOutput {
  const age = ageFactor(input.age);
  const mileage = mileageFactor(input.annualMileage);
  const genderFactor =
    AUTO_RATE_TABLE.genderFactors[
      input.gender as keyof typeof AUTO_RATE_TABLE.genderFactors
    ] || 1;
  const zipFactor = AUTO_RATE_TABLE.zipFactors.Average;
  const driving = drivingHistoryFactor(input);
  const manualReviewReasons = [...driving.manualReviewReasons];

  const liabilityBeforeCoverage =
    AUTO_RATE_TABLE.liabilityBaseMonthly *
    zipFactor *
    AUTO_RATE_TABLE.temporaryVehicleFactors.liability *
    age.factor *
    genderFactor *
    driving.factor *
    mileage.factor;

  const vehicles = input.vehicles.map((vehicle) =>
    calculateVehiclePremium({ vehicle, liabilityBeforeCoverage })
  );
  const grossPremium = vehicles.reduce((sum, vehicle) => sum + vehicle.gross, 0);
  const discounts = autoDiscounts(input.discounts);
  const finalMonthly = grossPremium * (1 - discounts.allowed);
  const warnings: string[] = [];

  if (discounts.capped) {
    warnings.push("Auto discount cap applied at 25%.");
  }

  input.vehicles.forEach((vehicle, index) => {
    const label = input.vehicles.length > 1 ? `Vehicle ${index + 1}` : "Vehicle";
    if (
      vehicle.coverageType === "Liability Only" &&
      (vehicle.comprehensiveDeductible || vehicle.collisionDeductible)
    ) {
      warnings.push(`${label}: liability-only coverage ignores comprehensive and collision deductibles.`);
    }
  });

  const status = manualReviewReasons.length > 0 ? "NEEDS_REVIEW" : "GENERATED";
  const primaryVehicle = input.vehicles[0] || {
    year: "",
    make: "",
    model: "",
    trimEngine: "",
    coverageType: "",
    liabilityLimits: "",
    comprehensiveDeductible: "",
    collisionDeductible: "",
  };
  const reviewFlags = manualReviewReasons;
  const pricingNotes = [
    `Gross premium before discounts: ${money(grossPremium)}/month.`,
    `Allowed discount: ${percentLabel(discounts.allowed)}${discounts.capped ? " after 25% cap" : ""}.`,
    "ZIP factor is currently Average = 1.00 until the ZIP table is added.",
    "Vehicle factors are currently 1.00 until the vehicle rating table is added.",
    "Liability-limit factors are not finalized; standard limits are treated as baseline.",
  ];

  const result: StructuredQuoteResult = {
    quote_type: "AUTO_INSURANCE",
    status: status === "NEEDS_REVIEW" ? "needs_review" : "estimate",
    rate_version: AUTO_RATE_TABLE.version,
    customer: {
      name: input.customerName,
      zip: input.zip,
      age: input.age,
      dob: input.dob,
      gender: input.gender,
    },
    vehicle: {
      year: primaryVehicle.year,
      make: primaryVehicle.make,
      model: primaryVehicle.model,
      trim: primaryVehicle.trimEngine,
      summary: input.vehicles.map(vehicleSummary).filter(Boolean).join("; "),
    },
    coverage: {
      type: input.vehicles.map((vehicle) => vehicle.coverageType).join("; "),
      tier: "Auto Coverage",
      deductible: input.vehicles
        .map((vehicle) =>
          vehicle.coverageType === "Full Coverage"
            ? `Comp ${vehicle.comprehensiveDeductible || "N/A"} / Collision ${vehicle.collisionDeductible || "N/A"}`
            : "N/A"
        )
        .join("; "),
      included_items: input.vehicles.flatMap((vehicle) =>
        vehicle.coverageType === "Full Coverage"
          ? ["Liability", "Comprehensive", "Collision"]
          : ["Liability"]
      ),
      excluded_or_not_included: input.vehicles.some(
        (vehicle) => vehicle.coverageType === "Liability Only"
      )
        ? ["Comprehensive and collision are not included on liability-only vehicles."]
        : [],
    },
    pricing: {
      pricing_available: true,
      monthly_estimate: `${money(finalMonthly)}/month`,
      monthly_range: `${money(finalMonthly * 0.95)}-${money(finalMonthly * 1.05)}/month`,
      six_month_estimate: money(finalMonthly * 6),
      annual_estimate: money(finalMonthly * 12),
      pricing_notes: pricingNotes,
    },
    underwriting: {
      decision:
        status === "NEEDS_REVIEW"
          ? "Manager Approval Required"
          : "V1 matrix estimate generated for employee review.",
      risk_score: `Driving factor ${factorLabel(driving.factor)}`,
      required_before_binding:
        status === "NEEDS_REVIEW"
          ? ["Manager review and approval before presenting as bindable."]
          : ["Confirm final eligibility, state compliance, and binding requirements."],
      review_flags: reviewFlags,
    },
    warnings,
    missing_information: [],
    employee_notes:
      "AUTO_V1.0 uses Apex internal matrix pricing. ZIP, vehicle, liability-limit, and final multiple-incident refinements still need production datasets/calibration.",
    customer_quote_text:
      `Apex Auto Coverage estimate for ${vehicleSummary(primaryVehicle) || "the listed vehicle"}: ${money(finalMonthly)}/month. This is an internal V1 estimate and must be reviewed before binding.`,
    rating_details: {
      rate_version: AUTO_RATE_TABLE.version,
      factors: [
        detail("Base liability", moneyWithCents(AUTO_RATE_TABLE.liabilityBaseMonthly)),
        detail("ZIP band", `${AUTO_RATE_TABLE.temporaryZipBand} (${factorLabel(zipFactor)})`),
        detail("Vehicle factor", factorLabel(AUTO_RATE_TABLE.temporaryVehicleFactors.liability)),
        detail("Age band", `${age.label} (${factorLabel(age.factor)})`),
        detail("Gender factor", factorLabel(genderFactor)),
        detail("Driving-history factor", factorLabel(driving.factor)),
        detail("Mileage band", `${mileage.label} (${factorLabel(mileage.factor)})`),
        detail("Gross premium", moneyWithCents(grossPremium)),
        detail("Requested discounts", percentLabel(discounts.requested)),
        detail("Allowed discounts", percentLabel(discounts.allowed)),
        detail("Final monthly premium", moneyWithCents(finalMonthly)),
      ],
      line_items: [
        ...driving.lineItems,
        ...vehicles.map((vehicle) => vehicle.lineItem),
        {
          label: "Discounts",
          value: percentLabel(discounts.allowed),
          details: discounts.lines.length > 0 ? discounts.lines : [detail("Discounts", "None")],
        },
      ],
      manual_review_reasons: manualReviewReasons,
      audit_notes: pricingNotes,
    },
  };

  return {
    result,
    status,
    pricingContext: {
      deterministicPricingAvailable: true,
      notes: pricingNotes,
      warnings,
    },
  };
}

function componentConfig(component: ModifiedVehicleComponentInput) {
  return (
    MVP_RATE_TABLE.componentCategories[component.category] ||
    MVP_RATE_TABLE.componentCategories["Custom/unclassifiable fabrication"]
  );
}

function mvpUsageFactor(input: ModifiedVehicleProtectionQuoteInput, component: ModifiedVehicleComponentInput) {
  const hasTrackUse = input.underwriting.racingTrackDriftUse === "Yes";
  if (hasTrackUse && component.trackExposed === "Yes") {
    return {
      label: "Track-exposed component",
      factor: MVP_RATE_TABLE.usageFactors["Track-exposed component"],
    };
  }

  const usage = input.coverage.vehicleUsage || "Regular street use";
  return {
    label: usage,
    factor: MVP_RATE_TABLE.usageFactors[usage] || 1,
  };
}

function mvpTier(args: {
  input: ModifiedVehicleProtectionQuoteInput;
  totalDeclaredValue: number;
  components: ModifiedVehicleComponentInput[];
}) {
  const categories = args.components.map((component) => component.category);
  const hasApexCategory = categories.some((category) =>
    [
      "Forced induction",
      "Transmission/drivetrain",
      "Built engine/forged internals",
      "Carbon fiber components",
      "Custom/unclassifiable fabrication",
    ].includes(category)
  );

  if (
    args.input.underwriting.racingTrackDriftUse === "Yes" ||
    args.input.underwriting.competitiveRacing === "Yes" ||
    hasApexCategory ||
    args.totalDeclaredValue > MVP_RATE_TABLE.apexValueThreshold
  ) {
    return "Apex";
  }

  if (
    args.totalDeclaredValue > MVP_RATE_TABLE.streetPlusValueThreshold ||
    categories.some((category) =>
      ["Suspension", "Brakes", "Conventional aero/body parts"].includes(category)
    )
  ) {
    return "Street Plus";
  }

  return "Street";
}

function requiredMvpDocuments(input: ModifiedVehicleProtectionQuoteInput) {
  const required = ["VIN", "Receipts/invoices for covered components", "Photos of installed parts", "Odometer photo"];
  if (input.modifications.tuneRequired === "Yes") required.push("Tune documentation");
  if (["Professional shop", "Mixed professional and DIY"].includes(input.modifications.installType)) {
    required.push("Shop install documentation or invoices");
  }
  if (["Rebuilt", "Salvage"].includes(input.vehicle.titleStatus)) {
    required.push("Rebuilt/salvage title documentation");
  }
  if (input.underwriting.racingTrackDriftUse !== "No") {
    required.push("Use disclosure and manager review for track/drift/autocross exposure");
  }
  return required;
}

export function calculateModifiedVehicleProtectionQuote(
  input: ModifiedVehicleProtectionQuoteInput
): MatrixQuoteOutput {
  const components = input.modifications.components.filter(
    (component) => component.name || component.category || component.declaredValue
  );
  const manualReviewReasons: string[] = [];
  const lineItems: QuoteRatingLineItem[] = [];
  let rawPremium = 0;
  let totalDeclaredValue = 0;
  const categoryTotals = new Map<string, number>();

  components.forEach((component) => {
    const value = parseCurrency(component.declaredValue) || 0;
    const config = componentConfig(component);
    const usage = mvpUsageFactor(input, component);
    const componentPremium =
      (value / 1000) *
      MVP_RATE_TABLE.baseRatePerThousand *
      config.multiplier *
      usage.factor;

    rawPremium += componentPremium;
    totalDeclaredValue += value;
    categoryTotals.set(component.category, (categoryTotals.get(component.category) || 0) + value);

    lineItems.push({
      label: component.name || component.category || "Covered component",
      value: `${moneyWithCents(componentPremium)}/month`,
      details: [
        detail("Category", component.category || "Unclassified"),
        detail("Declared value", moneyWithCents(value)),
        detail("Risk level", config.risk),
        detail("Component multiplier", factorLabel(config.multiplier)),
        detail("Usage modifier", `${usage.label} (${factorLabel(usage.factor)})`),
      ],
    });

    if (value > MVP_RATE_TABLE.manualReviewThresholds.singleComponentValue) {
      manualReviewReasons.push(`Single component over $7,500: ${component.name || component.category}`);
    }
    if (component.category === "Custom/unclassifiable fabrication") {
      manualReviewReasons.push("Custom/unclassifiable fabrication");
    }
  });

  if (totalDeclaredValue > MVP_RATE_TABLE.manualReviewThresholds.totalDeclaredValue) {
    manualReviewReasons.push("Total declared aftermarket value over $15,000");
  }

  const trackEvents = numeric(input.underwriting.trackEventsPerYear);
  if (trackEvents > MVP_RATE_TABLE.manualReviewThresholds.trackEventsPerYear) {
    manualReviewReasons.push("Track events over 6 per year");
  }
  if (input.underwriting.competitiveRacing === "Yes") {
    manualReviewReasons.push("Competitive racing exposure");
  }

  const builtEngineValue = categoryTotals.get("Built engine/forged internals") || 0;
  if (builtEngineValue > MVP_RATE_TABLE.manualReviewThresholds.veryHighComponentValue) {
    manualReviewReasons.push("Built engine/forged internals over $5,000");
  }

  const drivetrainValue = categoryTotals.get("Transmission/drivetrain") || 0;
  if (drivetrainValue > MVP_RATE_TABLE.manualReviewThresholds.veryHighComponentValue) {
    manualReviewReasons.push("Built transmission/drivetrain over $5,000");
  }

  const forcedInductionValue = categoryTotals.get("Forced induction") || 0;
  if (forcedInductionValue > MVP_RATE_TABLE.manualReviewThresholds.forcedInductionValue) {
    manualReviewReasons.push("Forced induction over $7,500");
  }

  const carbonValue = categoryTotals.get("Carbon fiber components") || 0;
  if (carbonValue > MVP_RATE_TABLE.manualReviewThresholds.carbonFiberValue) {
    manualReviewReasons.push("Carbon fiber over $7,500");
  }

  const veryHighRiskSystems = [
    builtEngineValue > 0,
    drivetrainValue > 0,
    forcedInductionValue > 0,
  ].filter(Boolean).length;
  if (veryHighRiskSystems >= 2) {
    manualReviewReasons.push("Multiple very-high-risk systems");
  }

  const finalMonthly = Math.max(MVP_RATE_TABLE.minimumMonthlyPremium, rawPremium);
  if (finalMonthly > MVP_RATE_TABLE.manualReviewThresholds.monthlyPremium) {
    manualReviewReasons.push("Calculated MVP premium over $150/month");
  }

  const uniqueManualReviewReasons = [...new Set(manualReviewReasons)];
  const tier = mvpTier({ input, totalDeclaredValue, components });
  const status = uniqueManualReviewReasons.length > 0 ? "NEEDS_REVIEW" : "GENERATED";
  const summary = vehicleSummary(input.vehicle);
  const pricingNotes = [
    `Raw component premium: ${moneyWithCents(rawPremium)}/month.`,
    `Minimum MVP premium: ${moneyWithCents(MVP_RATE_TABLE.minimumMonthlyPremium)}/month.`,
    rawPremium < MVP_RATE_TABLE.minimumMonthlyPremium
      ? "Minimum premium adjustment applied."
      : "Minimum premium adjustment not needed.",
    "MVP protects declared aftermarket components selected for coverage; it does not insure the underlying/base vehicle.",
    "MVP deductible rate adjustments are not finalized in V1.",
  ];

  const result: StructuredQuoteResult = {
    quote_type: "MODIFIED_VEHICLE_PROTECTION",
    status: status === "NEEDS_REVIEW" ? "needs_review" : "estimate",
    rate_version: MVP_RATE_TABLE.version,
    customer: {
      name: input.customerName,
      zip: input.zip,
      age: input.age,
      dob: input.dob,
      gender: input.gender,
    },
    vehicle: {
      year: input.vehicle.year,
      make: input.vehicle.make,
      model: input.vehicle.model,
      trim: input.vehicle.trim,
      summary,
    },
    coverage: {
      type: "Modified Vehicle Protection",
      tier,
      deductible: input.coverage.deductible ? `$${input.coverage.deductible}` : "$500",
      included_items: components.map((component) =>
        `${component.name || component.category} (${money(parseCurrency(component.declaredValue) || 0)})`
      ),
      excluded_or_not_included: [
        "Underlying/base vehicle is not insured by MVP.",
        "Undeclared or unapproved parts are not included.",
      ],
    },
    pricing: {
      pricing_available: true,
      monthly_estimate: `${money(finalMonthly)}/month`,
      monthly_range: `${money(finalMonthly * 0.95)}-${money(finalMonthly * 1.05)}/month`,
      six_month_estimate: money(finalMonthly * 6),
      annual_estimate: money(finalMonthly * 12),
      pricing_notes: pricingNotes,
    },
    underwriting: {
      decision:
        status === "NEEDS_REVIEW"
          ? "Manager Approval Required"
          : "V1 matrix estimate generated for employee review.",
      risk_score: `${tier} / ${status === "NEEDS_REVIEW" ? "Manual Review" : "Standard Review"}`,
      required_before_binding: requiredMvpDocuments(input),
      review_flags: uniqueManualReviewReasons,
    },
    warnings:
      status === "NEEDS_REVIEW"
        ? ["Manual-review triggers cannot be overridden by agents."]
        : [],
    missing_information: [],
    employee_notes:
      "MVP_V1.0 prices covered components individually using declared value, component risk, and usage. Manager approval is required for any manual-review trigger.",
    customer_quote_text:
      `Apex Modified Vehicle Protection estimate for ${summary || "the listed vehicle"}: ${money(finalMonthly)}/month, ${tier} tier. Final eligibility depends on documentation and review.`,
    rating_details: {
      rate_version: MVP_RATE_TABLE.version,
      factors: [
        detail("Base rate", `${moneyWithCents(MVP_RATE_TABLE.baseRatePerThousand)} per $1,000`),
        detail("Total declared aftermarket value", moneyWithCents(totalDeclaredValue)),
        detail("Raw premium", moneyWithCents(rawPremium)),
        detail("Final monthly premium", moneyWithCents(finalMonthly)),
        detail("Tier", tier),
        detail("Vehicle usage", input.coverage.vehicleUsage || "Not supplied"),
        detail("Track events/year", input.underwriting.trackEventsPerYear || "0"),
      ],
      line_items: lineItems,
      manual_review_reasons: uniqueManualReviewReasons,
      audit_notes: pricingNotes,
    },
  };

  return {
    result,
    status,
    pricingContext: {
      deterministicPricingAvailable: true,
      totalDeclaredBuildValue: totalDeclaredValue,
      notes: pricingNotes,
      warnings: result.warnings,
    },
  };
}

export function generateQuoteFromMatrix(
  quoteType: QuoteType,
  input: AutoInsuranceQuoteInput | ModifiedVehicleProtectionQuoteInput
) {
  return quoteType === "AUTO_INSURANCE"
    ? calculateAutoInsuranceQuote(input as AutoInsuranceQuoteInput)
    : calculateModifiedVehicleProtectionQuote(input as ModifiedVehicleProtectionQuoteInput);
}

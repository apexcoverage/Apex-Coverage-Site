export type QuoteType = "AUTO_INSURANCE" | "MODIFIED_VEHICLE_PROTECTION";

export type QuoteStatus =
  | "GENERATED"
  | "NEEDS_REVIEW"
  | "SAVED"
  | "APPROVED"
  | "ARCHIVED";

export type EmployeeRole = "EMPLOYEE" | "MANAGER" | "ADMIN";

export type EmployeeUser = {
  email: string;
  name: string;
  role: EmployeeRole;
};

export type AutoQuoteVehicleInput = {
  year: string;
  make: string;
  model: string;
  trimEngine: string;
  coverageType: string;
  comprehensiveDeductible: string;
  collisionDeductible: string;
};

export type AutoInsuranceQuoteInput = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  zip: string;
  dob: string;
  age: string;
  gender: string;
  drivingRecordStatus: string;
  incidentType: string;
  incidentTiming: string;
  incidentDetails: string;
  vehicles: AutoQuoteVehicleInput[];
  annualMileage: string;
  garagedOvernight: string;
  discounts: string[];
  notes: string;
};

export type ModifiedVehicleProtectionQuoteInput = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  zip: string;
  dob: string;
  age: string;
  gender: string;
  drivingHistory: string;
  claimHistory: string;
  annualMileage: string;
  vehicle: {
    year: string;
    make: string;
    model: string;
    trim: string;
    vehicleMileage: string;
    titleStatus: string;
    garageKept: string;
  };
  modifications: {
    partsList: string;
    partsValue: string;
    laborValue: string;
    includeLaborInCoveredValue: string;
    installType: string;
    tuneRequired: string;
    safetyRelatedModsPresent: string;
    performanceModsPresent: string;
  };
  coverage: {
    deductible: string;
    requestedTier: string;
    applyDiscounts: string;
    discounts: string[];
  };
  underwriting: {
    vinAvailable: string;
    receiptsAvailable: string;
    photosAvailable: string;
    tuneDocumentationAvailable: string;
    shopInvoicesAvailable: string;
    rebuiltSalvageDocumentationAvailable: string;
    racingTrackDriftUse: string;
  };
  notes: string;
};

export type QuoteInput =
  | AutoInsuranceQuoteInput
  | ModifiedVehicleProtectionQuoteInput;

export type QuotePricingContext = {
  deterministicPricingAvailable: boolean;
  totalDeclaredBuildValue?: number | null;
  notes: string[];
  warnings: string[];
};

export type StructuredQuoteResult = {
  quote_type: QuoteType;
  status: "estimate" | "needs_review" | "missing_information" | "error";
  customer: {
    name: string;
    zip: string;
    age: string;
    dob: string;
    gender: string;
  };
  vehicle: {
    year: string;
    make: string;
    model: string;
    trim: string;
    summary: string;
  };
  coverage: {
    type: string;
    tier: string;
    deductible: string;
    included_items: string[];
    excluded_or_not_included: string[];
  };
  pricing: {
    pricing_available: boolean;
    monthly_estimate: string;
    monthly_range: string;
    six_month_estimate: string;
    annual_estimate: string;
    pricing_notes: string[];
  };
  underwriting: {
    decision: string;
    risk_score: string;
    required_before_binding: string[];
    review_flags: string[];
  };
  warnings: string[];
  missing_information: string[];
  employee_notes: string;
  customer_quote_text: string;
};

export type SavedQuoteRecord = {
  id: string;
  quoteId: string;
  quoteType: QuoteType;
  status: QuoteStatus;
  employee: EmployeeUser;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    zip: string;
  };
  vehicle: {
    id: string;
    year: string;
    make: string;
    model: string;
    trim: string;
    vin: string;
    mileage: string;
    titleStatus: string;
  };
  input: QuoteInput;
  result: StructuredQuoteResult;
};

export type QuoteValidationResult = {
  ok: boolean;
  missing: string[];
  warnings: string[];
  normalizedInput: QuoteInput;
  pricingContext: QuotePricingContext;
};

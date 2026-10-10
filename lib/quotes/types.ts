export type QuoteType = "AUTO_INSURANCE" | "MODIFIED_VEHICLE_PROTECTION";

export type QuoteStatus =
  | "GENERATED"
  | "NEEDS_REVIEW"
  | "SAVED"
  | "APPROVED"
  | "DECLINED"
  | "ARCHIVED";

export type EmployeeRole = "EMPLOYEE" | "MANAGER" | "ADMIN";

export type EmployeeUser = {
  email: string;
  name: string;
  role: EmployeeRole;
};

export type QuoteReviewAction =
  | "REQUESTED_REVIEW"
  | "APPROVED_REVIEW"
  | "DECLINED_REVIEW"
  | "STATUS_CHANGED";

export type QuoteReviewEvent = {
  id: string;
  action: QuoteReviewAction;
  status: QuoteStatus;
  note: string;
  reviewer: EmployeeUser;
  createdAt: string;
};

export type AutoQuoteVehicleInput = {
  year: string;
  make: string;
  model: string;
  trimEngine: string;
  titleStatus: string;
  coverageType: string;
  liabilityLimits: string;
  comprehensiveDeductible: string;
  collisionDeductible: string;
};

export type AutoDrivingIncidentInput = {
  incidentType: string;
  atFault: string;
  timing: string;
  count: string;
  details: string;
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
  incidents: AutoDrivingIncidentInput[];
  vehicles: AutoQuoteVehicleInput[];
  annualMileage: string;
  garagedOvernight: string;
  discounts: string[];
  notes: string;
};

export type ModifiedVehicleComponentInput = {
  name: string;
  category: string;
  declaredValue: string;
  trackExposed: string;
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
    components: ModifiedVehicleComponentInput[];
  };
  coverage: {
    deductible: string;
    vehicleUsage: string;
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
    trackEventsPerYear: string;
    competitiveRacing: string;
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

export type QuoteRatingDetail = {
  label: string;
  value: string;
};

export type QuoteRatingLineItem = {
  label: string;
  value: string;
  details: QuoteRatingDetail[];
};

export type StructuredQuoteResult = {
  quote_type: QuoteType;
  status: "estimate" | "needs_review" | "missing_information" | "error";
  rate_version?: string;
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
  rating_details?: {
    rate_version: string;
    factors: QuoteRatingDetail[];
    line_items: QuoteRatingLineItem[];
    manual_review_reasons: string[];
    audit_notes: string[];
  };
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
  reviewEvents: QuoteReviewEvent[];
};

export type QuoteValidationResult = {
  ok: boolean;
  missing: string[];
  warnings: string[];
  normalizedInput: QuoteInput;
  pricingContext: QuotePricingContext;
};

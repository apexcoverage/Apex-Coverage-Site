import type {
  AutoInsuranceQuoteInput,
  AutoQuoteVehicleInput,
  ModifiedVehicleProtectionQuoteInput,
} from "./types";

export const AUTO_DISCOUNT_OPTIONS = [
  "Military",
  "Claims-Free",
  "Safe Driver",
  "Multi-Car",
  "Garaged Overnight",
  "Low Mileage",
  "Anti-Theft / Security System",
  "Safety Equipment",
  "Paperless Billing",
  "Automatic Payment",
  "Multi-Policy / Bundle",
  "Paid in Full",
  "Defensive Driving",
  "Telematics / Safe Driving Program",
];

export const MODIFIED_VEHICLE_DISCOUNT_OPTIONS = [
  "Garage-kept",
  "Anti-theft",
  "Military",
  "Clean driving history",
  "No prior claims",
  "Low mileage",
  "Professional installation",
];

export const DEDUCTIBLE_OPTIONS = ["250", "500", "1000", "1500", "2500"];

export const MODIFIED_TIER_OPTIONS = [
  "Let system recommend",
  "Street Tier",
  "Street+ Tier",
  "Apex Build Tier",
];

export const ANNUAL_MILEAGE_OPTIONS = [
  "Under 5,000",
  "5,000-10,000",
  "10,001-15,000",
  "Over 15,000",
  "Exact mileage entered in notes",
];

export const EMPTY_AUTO_VEHICLE: AutoQuoteVehicleInput = {
  year: "",
  make: "",
  model: "",
  trimEngine: "",
  coverageType: "",
  comprehensiveDeductible: "",
  collisionDeductible: "",
};

export const EMPTY_AUTO_QUOTE_INPUT: AutoInsuranceQuoteInput = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  zip: "",
  dob: "",
  age: "",
  gender: "",
  drivingRecordStatus: "",
  incidentType: "",
  incidentTiming: "",
  incidentDetails: "",
  vehicles: [{ ...EMPTY_AUTO_VEHICLE }],
  annualMileage: "",
  garagedOvernight: "",
  discounts: [],
  notes: "",
};

export const EMPTY_MODIFIED_VEHICLE_QUOTE_INPUT: ModifiedVehicleProtectionQuoteInput = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  zip: "",
  dob: "",
  age: "",
  gender: "",
  drivingHistory: "",
  claimHistory: "",
  annualMileage: "",
  vehicle: {
    year: "",
    make: "",
    model: "",
    trim: "",
    vehicleMileage: "",
    titleStatus: "",
    garageKept: "",
  },
  modifications: {
    partsList: "",
    partsValue: "",
    laborValue: "",
    includeLaborInCoveredValue: "",
    installType: "",
    tuneRequired: "",
    safetyRelatedModsPresent: "",
    performanceModsPresent: "",
  },
  coverage: {
    deductible: "",
    requestedTier: "Let system recommend",
    applyDiscounts: "",
    discounts: [],
  },
  underwriting: {
    vinAvailable: "",
    receiptsAvailable: "",
    photosAvailable: "",
    tuneDocumentationAvailable: "",
    shopInvoicesAvailable: "",
    rebuiltSalvageDocumentationAvailable: "",
    racingTrackDriftUse: "",
  },
  notes: "",
};

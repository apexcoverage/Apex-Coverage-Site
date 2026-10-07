import type {
  AutoInsuranceQuoteInput,
  AutoDrivingIncidentInput,
  AutoQuoteVehicleInput,
  ModifiedVehicleComponentInput,
  ModifiedVehicleProtectionQuoteInput,
} from "./types";

export const AUTO_DISCOUNT_OPTIONS = [
  "Military",
  "Safe Driver",
  "Multi-Car",
  "Anti-Theft / Security System",
  "Paperless Billing",
  "Automatic Payment",
  "Paid in Full",
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

export const AUTO_DEDUCTIBLE_OPTIONS = ["250", "500", "1000", "2000"];

export const MVP_DEDUCTIBLE_OPTIONS = ["500", "1000", "1500", "2500"];

export const MODIFIED_TIER_OPTIONS = [
  "Let system recommend",
  "Street",
  "Street Plus",
  "Apex",
];

export const MVP_COMPONENT_CATEGORY_OPTIONS = [
  "Wheels",
  "Basic exhaust",
  "Suspension",
  "Brakes",
  "Conventional aero/body parts",
  "Carbon fiber components",
  "Forced induction",
  "Transmission/drivetrain",
  "Built engine/forged internals",
  "Custom/unclassifiable fabrication",
];

export const MVP_USAGE_OPTIONS = [
  "Show / <=2,000 miles annually",
  "Weekend / recreational",
  "Regular street use",
  "Daily use",
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
  liabilityLimits: "Standard limits",
  comprehensiveDeductible: "",
  collisionDeductible: "",
};

export const EMPTY_AUTO_INCIDENT: AutoDrivingIncidentInput = {
  incidentType: "",
  atFault: "",
  timing: "",
  count: "1",
  details: "",
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
  incidents: [],
  vehicles: [{ ...EMPTY_AUTO_VEHICLE }],
  annualMileage: "",
  garagedOvernight: "",
  discounts: [],
  notes: "",
};

export const EMPTY_MVP_COMPONENT: ModifiedVehicleComponentInput = {
  name: "",
  category: "",
  declaredValue: "",
  trackExposed: "No",
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
    components: [{ ...EMPTY_MVP_COMPONENT }],
  },
  coverage: {
    deductible: "",
    vehicleUsage: "",
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
    trackEventsPerYear: "",
    competitiveRacing: "",
  },
  notes: "",
};

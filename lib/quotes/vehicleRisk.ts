import type { AutoQuoteVehicleInput, QuoteRatingDetail } from "./types";
import {
  VEHICLE_RISK_CLASS_AVERAGES,
  VEHICLE_RISK_DATA_VERSION,
  VEHICLE_RISK_METHOD,
  VEHICLE_RISK_RECORDS,
  type VehicleRiskClassAverage,
  type VehicleRiskRecord,
} from "./vehicleRiskData";

export type VehicleRiskLookupResult = {
  matchType: "model" | "class-average" | "default";
  sourceVehicle: string;
  yearRange: string;
  classText: string;
  sizeText: string;
  liabilityFactor: number;
  collisionFactor: number;
  comprehensiveFactor: number;
  matchScore: number;
  reviewFlags: string[];
  details: QuoteRatingDetail[];
};

type CandidateScore = {
  record: VehicleRiskRecord;
  score: number;
};

const HIGH_FACTOR_REVIEW_THRESHOLD = 2.5;
const VEHICLE_RECORDS_BY_MAKE = new Map<string, VehicleRiskRecord[]>();

for (const record of VEHICLE_RISK_RECORDS) {
  const makeToken = normalize(record.key || record.vehicle).split(" ")[0];
  if (!makeToken) continue;
  const current = VEHICLE_RECORDS_BY_MAKE.get(makeToken) || [];
  current.push(record);
  VEHICLE_RECORDS_BY_MAKE.set(makeToken, current);
}

const MAKE_ALIASES: Record<string, string[]> = {
  chevrolet: ["chevrolet", "chevy"],
  ford: ["ford"],
  gmc: ["gmc"],
  ram: ["ram", "dodge ram"],
  dodge: ["dodge"],
  toyota: ["toyota"],
  honda: ["honda"],
  nissan: ["nissan"],
  hyundai: ["hyundai"],
  kia: ["kia"],
  subaru: ["subaru"],
  volkswagen: ["volkswagen", "vw"],
  mercedes: ["mercedes", "mercedes benz", "mercedes-benz"],
  bmw: ["bmw"],
  lexus: ["lexus"],
  acura: ["acura"],
  infiniti: ["infiniti"],
  audi: ["audi"],
  cadillac: ["cadillac"],
  lincoln: ["lincoln"],
  tesla: ["tesla"],
  jeep: ["jeep"],
  mazda: ["mazda"],
  mitsubishi: ["mitsubishi"],
  porsche: ["porsche"],
};

const MODEL_ALIASES: Record<string, string[]> = {
  f150: ["f150", "f 150", "f-150"],
  f250: ["f250", "f 250", "f-250"],
  f350: ["f350", "f 350", "f-350"],
  silverado: ["silverado"],
  sierra: ["sierra"],
  "3 series": ["3 series", "330", "328", "335", "340"],
  "5 series": ["5 series", "530", "540", "550"],
  "7 series": ["7 series", "740", "750", "760"],
  "c class": ["c class", "c300", "c 300", "c43", "c 43", "c63", "c 63"],
  "e class": ["e class", "e350", "e 350", "e450", "e 450", "e63", "e 63"],
  "s class": ["s class", "s500", "s 500", "s580", "s 580"],
  brz: ["brz", "br z"],
  wrx: ["wrx", "sti", "st i"],
  "mx 5": ["mx5", "mx 5", "miata"],
  "370z": ["370z", "370 z"],
  "350z": ["350z", "350 z"],
};

const SPORTS_MODELS = [
  "mustang",
  "camaro",
  "corvette",
  "challenger",
  "charger",
  "supra",
  "brz",
  "gr86",
  "frs",
  "miata",
  "mx 5",
  "370z",
  "350z",
  "z",
  "wrx",
  "sti",
  "gtr",
  "gt r",
  "911",
  "cayman",
  "boxster",
];

const PICKUP_MODELS = [
  "f 150",
  "f 250",
  "f 350",
  "silverado",
  "sierra",
  "ram",
  "tundra",
  "tacoma",
  "ranger",
  "colorado",
  "canyon",
  "frontier",
  "titan",
  "ridgeline",
  "gladiator",
];

const SUV_MODELS = [
  "explorer",
  "expedition",
  "escape",
  "edge",
  "bronco",
  "tahoe",
  "suburban",
  "traverse",
  "equinox",
  "yukon",
  "terrain",
  "pilot",
  "cr v",
  "hr v",
  "rav4",
  "highlander",
  "4runner",
  "sequoia",
  "pathfinder",
  "rogue",
  "murano",
  "telluride",
  "sorento",
  "sportage",
  "palisade",
  "santa fe",
  "tucson",
  "wrangler",
  "cherokee",
  "grand cherokee",
  "compass",
  "outback",
  "forester",
  "ascent",
  "model y",
  "model x",
];

const MINIVAN_MODELS = ["sienna", "odyssey", "pacifica", "caravan", "sedona", "carnival", "quest"];

const LUXURY_MAKES = [
  "acura",
  "audi",
  "bmw",
  "cadillac",
  "genesis",
  "infiniti",
  "jaguar",
  "lexus",
  "lincoln",
  "mercedes",
  "porsche",
  "volvo",
];

const EXOTIC_MAKES = [
  "aston martin",
  "bentley",
  "ferrari",
  "lamborghini",
  "mclaren",
  "maserati",
  "rolls royce",
];

function normalize(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/mercedes[-\s]+benz/g, "mercedes")
    .replace(/\bchevy\b/g, "chevrolet")
    .replace(/\bvw\b/g, "volkswagen")
    .replace(/([a-z])(\d)/g, "$1 $2")
    .replace(/(\d)([a-z])/g, "$1 $2")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(2dr|4dr|door|doors|sedan|coupe|convertible|wagon|hatchback|crew|cab|supercab|ext)\b/g, " ")
    .replace(/\b(fwd|rwd|awd|4wd|2wd)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value: string) {
  return normalize(value).replace(/\s+/g, "");
}

function tokenSet(value: string) {
  return new Set(normalize(value).split(" ").filter((token) => token.length > 0));
}

function numeric(value: string) {
  const parsed = Number(String(value || "").replace(/[^0-9]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function displayFactor(value: number) {
  return `${value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}x`;
}

function detail(label: string, value: string): QuoteRatingDetail {
  return { label, value };
}

function aliasesForMake(make: string) {
  const normalizedMake = normalize(make);
  return MAKE_ALIASES[normalizedMake] || [normalizedMake];
}

function recordsForMake(make: string) {
  const records = new Map<VehicleRiskRecord, VehicleRiskRecord>();
  aliasesForMake(make).forEach((alias) => {
    const firstToken = normalize(alias).split(" ")[0];
    (VEHICLE_RECORDS_BY_MAKE.get(firstToken) || []).forEach((record) => {
      records.set(record, record);
    });
  });
  return records.size > 0 ? [...records.values()] : VEHICLE_RISK_RECORDS;
}

function modelAliases(model: string) {
  const normalizedModel = normalize(model);
  const aliases = new Set([normalizedModel]);
  Object.entries(MODEL_ALIASES).forEach(([canonical, values]) => {
    if (values.some((value) => normalize(value) === normalizedModel || compact(value) === compact(normalizedModel))) {
      aliases.add(canonical);
      values.forEach((value) => aliases.add(normalize(value)));
    }
  });
  return [...aliases].filter(Boolean);
}

function yearDistance(record: { yearStart: number; yearEnd: number }, year: number | null) {
  if (!year) return 0;
  if (year >= record.yearStart && year <= record.yearEnd) return 0;
  if (year < record.yearStart) return record.yearStart - year;
  return year - record.yearEnd;
}

function yearScore(record: VehicleRiskRecord, year: number | null) {
  if (!year) return 8;
  const distance = yearDistance(record, year);
  if (distance === 0) return 24;
  if (distance <= 3) return 14;
  if (distance <= 8) return 8;
  return 2;
}

function scoreRecord(record: VehicleRiskRecord, vehicle: AutoQuoteVehicleInput, year: number | null): number {
  const haystack = normalize(record.key || record.vehicle);
  const haystackCompact = compact(haystack);
  const makeAliases = aliasesForMake(vehicle.make);
  const modelValues = modelAliases(vehicle.model);
  const trim = normalize(vehicle.trimEngine);

  const makeMatch = makeAliases.some((make) => {
    const normalizedMake = normalize(make);
    return haystack.includes(normalizedMake) || haystackCompact.includes(compact(normalizedMake));
  });
  if (!makeMatch) return 0;

  const modelMatch = modelValues.some((model) => {
    const normalizedModel = normalize(model);
    return haystack.includes(normalizedModel) || haystackCompact.includes(compact(normalizedModel));
  });
  if (!modelMatch) return 0;

  let score = 55 + yearScore(record, year);
  const modelTokens = [...tokenSet(vehicle.model)];
  const recordTokens = tokenSet(haystack);
  const matchedModelTokens = modelTokens.filter((token) => recordTokens.has(token)).length;
  score += Math.min(18, matchedModelTokens * 6);

  if (trim) {
    const trimTokens = [...tokenSet(trim)].filter((token) => token.length > 1);
    score += Math.min(10, trimTokens.filter((token) => recordTokens.has(token)).length * 4);
  }

  if (haystack === normalize([vehicle.make, vehicle.model, vehicle.trimEngine].filter(Boolean).join(" "))) {
    score += 15;
  }

  return score;
}

function bestModelMatch(vehicle: AutoQuoteVehicleInput): CandidateScore | null {
  const year = numeric(vehicle.year);
  let best: CandidateScore | null = null;

  for (const record of recordsForMake(vehicle.make)) {
    const score = scoreRecord(record, vehicle, year);
    if (score < 65) continue;
    if (!best || score > best.score || (score === best.score && yearDistance(record, year) < yearDistance(best.record, year))) {
      best = { record, score };
    }
  }

  return best;
}

function includesAny(value: string, terms: string[]) {
  const normalizedValue = normalize(value);
  return terms.some((term) => normalizedValue.includes(normalize(term)));
}

function fallbackClass(vehicle: AutoQuoteVehicleInput) {
  const make = normalize(vehicle.make);
  const combined = normalize([vehicle.make, vehicle.model, vehicle.trimEngine].filter(Boolean).join(" "));
  const luxury = LUXURY_MAKES.includes(make) || EXOTIC_MAKES.some((item) => combined.includes(normalize(item)));

  if (EXOTIC_MAKES.some((item) => combined.includes(normalize(item)))) {
    return { classId: 3, sizeId: 5, label: "Very large luxury car" };
  }

  if (includesAny(combined, PICKUP_MODELS)) {
    const veryLarge = /\b(250|2500|350|3500|450|4500|550|5500)\b/.test(combined);
    return { classId: 6, sizeId: veryLarge ? 5 : 4, label: veryLarge ? "Very large pickup" : "Large pickup" };
  }

  if (includesAny(combined, SPORTS_MODELS)) {
    return { classId: luxury ? 3 : 4, sizeId: 3, label: luxury ? "Midsize luxury car" : "Midsize sports car" };
  }

  if (includesAny(combined, MINIVAN_MODELS)) {
    return { classId: 5, sizeId: 4, label: "Large minivan" };
  }

  if (includesAny(combined, SUV_MODELS) || /\b(suv|crossover)\b/.test(combined)) {
    return { classId: luxury ? 14 : 8, sizeId: 3, label: luxury ? "Midsize luxury SUV" : "Midsize SUV" };
  }

  if (luxury) {
    return { classId: 3, sizeId: 3, label: "Midsize luxury car" };
  }

  return { classId: 2, sizeId: 3, label: "Midsize four-door car" };
}

function findClassAverage(vehicle: AutoQuoteVehicleInput): VehicleRiskClassAverage | undefined {
  const year = numeric(vehicle.year);
  const fallback = fallbackClass(vehicle);
  const matches = VEHICLE_RISK_CLASS_AVERAGES.filter((item) => {
    return item.classId === fallback.classId && item.sizeId === fallback.sizeId;
  });

  if (matches.length === 0) return undefined;

  return matches.sort((a, b) => {
    return yearDistance(a, year) - yearDistance(b, year);
  })[0];
}

function factorOrAverage(value: number | null, average: number | null | undefined) {
  return value || average || 1;
}

function reviewFlagsFor(result: VehicleRiskLookupResult) {
  const flags = [...result.reviewFlags];
  const maxFactor = Math.max(result.liabilityFactor, result.collisionFactor, result.comprehensiveFactor);

  if (maxFactor >= HIGH_FACTOR_REVIEW_THRESHOLD) {
    flags.push("Vehicle has a very high sourced HLDI loss factor; manager review recommended.");
  }

  return [...new Set(flags)];
}

export function lookupVehicleRisk(vehicle: AutoQuoteVehicleInput): VehicleRiskLookupResult {
  const match = bestModelMatch(vehicle);
  const classAverage = findClassAverage(vehicle);
  const averageLabel = classAverage ? `${classAverage.sizeText} ${classAverage.classText}`.trim() : "Neutral average";

  if (match) {
    const record = match.record;
    const result: VehicleRiskLookupResult = {
      matchType: "model",
      sourceVehicle: record.vehicle,
      yearRange: record.yearRange,
      classText: record.classText,
      sizeText: record.sizeText,
      liabilityFactor: factorOrAverage(record.liabilityFactor, classAverage?.liabilityFactor),
      collisionFactor: factorOrAverage(record.collisionFactor, classAverage?.collisionFactor),
      comprehensiveFactor: factorOrAverage(record.comprehensiveFactor, classAverage?.comprehensiveFactor),
      matchScore: match.score,
      reviewFlags: [],
      details: [
        detail("Source", "HLDI make/model insurance-loss data"),
        detail("Matched vehicle", record.vehicle),
        detail("HLDI year range", record.yearRange),
        detail("Vehicle class", `${record.sizeText} ${record.classText}`.trim()),
        detail("Liability factor", displayFactor(factorOrAverage(record.liabilityFactor, classAverage?.liabilityFactor))),
        detail("Collision factor", displayFactor(factorOrAverage(record.collisionFactor, classAverage?.collisionFactor))),
        detail("Comprehensive factor", displayFactor(factorOrAverage(record.comprehensiveFactor, classAverage?.comprehensiveFactor))),
      ],
    };
    return { ...result, reviewFlags: reviewFlagsFor(result) };
  }

  if (classAverage) {
    const result: VehicleRiskLookupResult = {
      matchType: "class-average",
      sourceVehicle: averageLabel,
      yearRange: classAverage.yearRange,
      classText: classAverage.classText,
      sizeText: classAverage.sizeText,
      liabilityFactor: classAverage.liabilityFactor || 1,
      collisionFactor: classAverage.collisionFactor || 1,
      comprehensiveFactor: classAverage.comprehensiveFactor || 1,
      matchScore: 0,
      reviewFlags: ["Vehicle did not match a sourced HLDI make/model row; HLDI class-average fallback used."],
      details: [
        detail("Source", "HLDI class-average fallback"),
        detail("Fallback class", averageLabel),
        detail("HLDI year range", classAverage.yearRange),
        detail("Liability factor", displayFactor(classAverage.liabilityFactor || 1)),
        detail("Collision factor", displayFactor(classAverage.collisionFactor || 1)),
        detail("Comprehensive factor", displayFactor(classAverage.comprehensiveFactor || 1)),
      ],
    };
    return { ...result, reviewFlags: reviewFlagsFor(result) };
  }

  const result: VehicleRiskLookupResult = {
    matchType: "default",
    sourceVehicle: "Neutral vehicle factor",
    yearRange: "Not matched",
    classText: "Unknown",
    sizeText: "Unknown",
    liabilityFactor: 1,
    collisionFactor: 1,
    comprehensiveFactor: 1,
    matchScore: 0,
    reviewFlags: ["Vehicle did not match HLDI model data or a supported fallback class; neutral factor requires review."],
    details: [
      detail("Source", "Neutral fallback"),
      detail("Liability factor", "1x"),
      detail("Collision factor", "1x"),
      detail("Comprehensive factor", "1x"),
    ],
  };
  return { ...result, reviewFlags: reviewFlagsFor(result) };
}

export { VEHICLE_RISK_DATA_VERSION, VEHICLE_RISK_METHOD };

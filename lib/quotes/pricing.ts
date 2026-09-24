import type {
  AutoInsuranceQuoteInput,
  ModifiedVehicleProtectionQuoteInput,
  QuotePricingContext,
} from "./types";
import { parseCurrency } from "./validation";

export function calculateAutoInsuranceQuote(
  _input: AutoInsuranceQuoteInput
): QuotePricingContext {
  return {
    deterministicPricingAvailable: false,
    notes: [
      "No Apex auto coverage rate table, carrier API, or comparative rater has been supplied yet.",
      "This placeholder keeps pricing isolated so a carrier integration can replace AI-assisted estimating later.",
    ],
    warnings: [],
  };
}

export function calculateModifiedVehicleProtectionQuote(
  input: ModifiedVehicleProtectionQuoteInput
): QuotePricingContext {
  const partsValue = parseCurrency(input.modifications.partsValue);
  const laborValue = parseCurrency(input.modifications.laborValue);
  const includeLabor = input.modifications.includeLaborInCoveredValue === "Yes";

  return {
    deterministicPricingAvailable: false,
    totalDeclaredBuildValue:
      partsValue === null
        ? null
        : partsValue + (includeLabor && laborValue ? laborValue : 0),
    notes: [
      "No formal Apex Modified Vehicle Protection rate table has been supplied yet.",
      "Only total declared build value is calculated deterministically in this MVP.",
    ],
    warnings: [],
  };
}

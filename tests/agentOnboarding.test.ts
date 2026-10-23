import test from "node:test";
import assert from "node:assert/strict";
import { cleanSetupDetails, setupMissingInformation, autoPolicyNumber } from "../lib/agentOnboarding";
import { coverageStage, sameContact } from "../lib/agentLifecycle";
import { getDefaultRateConfig } from "../lib/quotes/rateConfigStore";
import { validRateConfig } from "../lib/quotes/persistentRateConfig";

test("onboarding is not an active customer", () => {
  assert.equal(coverageStage("auto", "Onboarding"), "onboarding");
  assert.equal(coverageStage("build", "Onboarding"), "onboarding");
  assert.equal(coverageStage("auto", "Won"), "active");
  assert.equal(coverageStage("build", "Active"), "active");
});

test("activation requires mailing address and VIN", () => {
  const empty = cleanSetupDetails({ name: "Alex", year: "2020", make: "Ford", model: "Mustang" });
  assert.ok(setupMissingInformation(empty).includes("Mailing street address"));
  assert.ok(setupMissingInformation(empty).includes("Valid 17-character VIN"));
  const complete = cleanSetupDetails({ ...empty, addressLine1: "100 Main St", city: "Richmond", state: "va", zip: "23220", vin: "1FA6P8CF0R5000000" });
  assert.deepEqual(setupMissingInformation(complete), []);
  assert.equal(complete.state, "VA");
});

test("matching prefers email when both records have one", () => {
  assert.equal(sameContact({ email: "one@example.com", phone: "5551112222" }, { email: "two@example.com", phone: "5551112222" }), false);
  assert.equal(sameContact({ email: "ONE@example.com" }, { email: "one@example.com" }), true);
});

test("existing auto policy number format is preserved", () => {
  assert.equal(autoPolicyNumber(9, new Date("2026-10-20T12:00:00Z")), "APX-3213261026-09");
});

test("rate edits reject malformed factors", () => {
  const config = getDefaultRateConfig();
  assert.equal(validRateConfig(config), true);
  assert.equal(validRateConfig({ ...config, auto: { ...config.auto, minimumLiabilityMonthly: -1 } }), false);
  assert.equal(validRateConfig({ ...config, auto: { ...config.auto, liabilityBaseMonthly: "many" } }), false);
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  insuranceCardMissingFields,
  parseCardVehicles,
  type InsuranceCardPolicy,
} from "../lib/insuranceCards";

function policy(): InsuranceCardPolicy {
  const today = new Date();
  const start = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
  const end = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
  const date = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  return {
    status: "Won",
    name: "Test Driver",
    policyNumber: "TEST-001",
    policyState: "VA",
    issuerName: "Example Insurer",
    issuerNaic: "12345",
    issuerAddress: "123 Main Street, Richmond, VA",
    effectiveDate: date(start),
    expirationDate: date(end),
    cardVehicles: JSON.stringify([{ year: "2024", make: "Ford", model: "Ranger", vin: "1FTER4EH1RLE00001" }]),
  };
}

test("accepts a complete card record for a supported state", () => {
  assert.deepEqual(insuranceCardMissingFields(policy()), []);
});

test("blocks the insurer identity and NAIC number supplied for Apex", () => {
  const record = { ...policy(), issuerName: "Apex Coverage", issuerNaic: "14282" };
  const missing = insuranceCardMissingFields(record);
  assert(missing.some((item) => item.includes("insurer identity")));
  assert(missing.some((item) => item.includes("14282")));
});

test("requires VINs and a current period", () => {
  const record = { ...policy(), expirationDate: "2020-01-01", cardVehicles: "[]" };
  const missing = insuranceCardMissingFields(record);
  assert(missing.some((item) => item.includes("Current policy period")));
  assert(missing.some((item) => item.includes("17-character VIN")));
});

test("does not print a generic card for states requiring approved formats", () => {
  assert(insuranceCardMissingFields({ ...policy(), policyState: "NY" }).some((item) => item.includes("state")));
});

test("parses separate insured vehicles", () => {
  const record = policy();
  assert.equal(parseCardVehicles(record).length, 1);
  assert.equal(parseCardVehicles(record)[0].vin, "1FTER4EH1RLE00001");
});

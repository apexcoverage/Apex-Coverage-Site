import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultCardCopies,
  groupCardSheets,
  insuranceCardMissingFields,
  policyPeriodIsTooShort,
  parseCardVehicles,
  serializeCardVehicles,
  suggestedMonthlyExpiration,
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
    addressLine1: "123 Main Street",
    city: "Richmond",
    state: "VA",
    zip: "23220",
    issuerNaic: "12345",
    effectiveDate: date(start),
    expirationDate: date(end),
    cardVehicles: JSON.stringify([{ year: "2024", make: "Ford", model: "Ranger", vin: "1FTER4EH1RLE00001" }]),
  };
}

test("accepts a complete card record for a supported state", () => {
  assert.deepEqual(insuranceCardMissingFields(policy()), []);
});

test("blocks the incorrect NAIC number previously supplied for Apex", () => {
  const record = { ...policy(), issuerNaic: "14282" };
  const missing = insuranceCardMissingFields(record);
  assert(missing.some((item) => item.includes("14282")));
});

test("requires VINs and a current period", () => {
  const record = { ...policy(), expirationDate: "2020-01-01", cardVehicles: "[]" };
  const missing = insuranceCardMissingFields(record);
  assert(missing.some((item) => item.includes("Current policy period")));
  assert(missing.some((item) => item.includes("17-character VIN")));
});

test("blocks a one-day policy period", () => {
  const record = { ...policy(), effectiveDate: "2026-10-20", expirationDate: "2026-10-21" };
  assert.equal(policyPeriodIsTooShort(record.effectiveDate, record.expirationDate), true);
  assert(insuranceCardMissingFields(record).some((item) => item.includes("under 28 days")));
});

test("suggests the next monthly date with a month-end clamp", () => {
  assert.equal(suggestedMonthlyExpiration("2026-01-31"), "2026-02-28");
  assert.equal(suggestedMonthlyExpiration("2026-12-15"), "2027-01-15");
  assert.equal(suggestedMonthlyExpiration("invalid"), "");
});

test("allows state data in a clearly marked internal draft", () => {
  assert.deepEqual(insuranceCardMissingFields({ ...policy(), state: "NY" }), []);
});

test("requires a complete covered mailing address", () => {
  const missing = insuranceCardMissingFields({ ...policy(), addressLine1: "", state: "" });
  assert(missing.some((item) => item.includes("mailing address")));
  assert(missing.some((item) => item.includes("mailing state")));
});

test("parses separate insured vehicles", () => {
  const record = policy();
  assert.equal(parseCardVehicles(record).length, 1);
  assert.equal(parseCardVehicles(record)[0].vin, "1FTER4EH1RLE00001");
});

test("pulls additional vehicles from the older vehicle schedule", () => {
  const record = {
    ...policy(),
    vehicles: "2024 Ford Ranger\n2021 Honda Civic 2HGFC2F59MH000001",
  };
  const vehicles = parseCardVehicles(record);
  assert.equal(vehicles.length, 2);
  assert.equal(vehicles[0].vin, "1FTER4EH1RLE00001");
  assert.equal(vehicles[1].model, "Civic");
  assert.equal(vehicles[1].vin, "2HGFC2F59MH000001");
  assert.deepEqual(insuranceCardMissingFields(record), []);
});

test("does not invent a third vehicle when two schedules describe the same two cars differently", () => {
  const record = {
    ...policy(),
    cardVehicles: JSON.stringify([
      { year: "2024", make: "Ford", model: "Ranger XLT", vin: "1FTER4EH1RLE00001" },
      { year: "2021", make: "Honda", model: "Civic Sport", vin: "2HGFC2F59MH000001" },
    ]),
    vehicles: "2024 Ford Ranger pickup\n2021 Honda Civic hatchback",
  };
  assert.deepEqual(parseCardVehicles(record).map((vehicle) => vehicle.vin), [
    "1FTER4EH1RLE00001", "2HGFC2F59MH000001",
  ]);
});

test("a saved two-vehicle card schedule does not import a stale third legacy line", () => {
  const record = {
    ...policy(),
    cardVehicles: JSON.stringify([
      { year: "2024", make: "Ford", model: "Ranger", vin: "1FTER4EH1RLE00001" },
      { year: "2021", make: "Honda", model: "Civic", vin: "2HGFC2F59MH000001" },
    ]),
    vehicles: "2024 Ford Ranger\n2021 Honda Civic\n2019 Toyota Camry",
  };
  assert.equal(parseCardVehicles(record).length, 2);
});

test("deduplicates a legacy description without dropping distinct VINs", () => {
  const record = {
    ...policy(),
    vehicles: "2024 Ford Ranger\n2024 Ford Ranger XLT\n2021 Honda Civic 2HGFC2F59MH000001",
  };
  assert.equal(parseCardVehicles(record).length, 2);
  assert.equal(parseCardVehicles({ ...record, vehicles: "2024 Ford Ranger 1FTER4EH1RLE00001\n2024 Ford Ranger 1FTER4EH1RLE00002" }).length, 2);
});

test("serializing the edited schedule removes a deleted vehicle from the older field", () => {
  const saved = parseCardVehicles({
    ...policy(),
    vehicles: "2024 Ford Ranger\n2021 Honda Civic 2HGFC2F59MH000001",
  });
  const remaining = saved.slice(0, 1);
  const reloaded = parseCardVehicles({
    ...policy(),
    cardVehicles: JSON.stringify(remaining),
    vehicles: serializeCardVehicles(remaining),
  });
  assert.equal(reloaded.length, 1);
  assert.equal(reloaded[0].make, "Ford");
});

test("keeps four total cards on one sheet for a two-vehicle policy", () => {
  const vehicles = parseCardVehicles({ ...policy(), vehicles: "2024 Ford Ranger; 2021 Honda Civic 2HGFC2F59MH000001" });
  const sheets = groupCardSheets(vehicles, defaultCardCopies(vehicles.length));
  assert.equal(sheets.length, 1);
  assert.equal(sheets[0].length, 4);
  assert.deepEqual(sheets[0].map((vehicle) => vehicle.make), ["Ford", "Ford", "Honda", "Honda"]);
});

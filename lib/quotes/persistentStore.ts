import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";
import { createSavedQuote, getQuoteByQuoteId, listQuotes, updateQuoteReviewStatus } from "./quoteStore";
import type { EmployeeUser, QuoteInput, QuoteReviewAction, QuoteReviewEvent, QuoteStatus, QuoteType, SavedQuoteRecord, StructuredQuoteResult } from "./types";

let schemaReady: Promise<void> | null = null;

function database() {
  return process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
}

async function ensureSchema() {
  const sql = database();
  if (!sql) return;
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql.query("CREATE SEQUENCE IF NOT EXISTS apex_quote_number_seq");
      await sql.query(`CREATE TABLE IF NOT EXISTS apex_quotes (
        quote_id TEXT PRIMARY KEY, record JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
    })().catch((error) => { schemaReady = null; throw error; });
  }
  await schemaReady;
}

function vehicleFromInput(quoteType: QuoteType, input: QuoteInput) {
  if (quoteType === "AUTO_INSURANCE" && "vehicles" in input) {
    const vehicle = input.vehicles[0];
    return { year: vehicle?.year || "", make: vehicle?.make || "", model: vehicle?.model || "", trim: vehicle?.trimEngine || "", vin: "", mileage: "", titleStatus: vehicle?.titleStatus || "" };
  }
  if ("vehicle" in input) {
    return { year: input.vehicle.year, make: input.vehicle.make, model: input.vehicle.model, trim: input.vehicle.trim, vin: "", mileage: input.vehicle.vehicleMileage, titleStatus: input.vehicle.titleStatus };
  }
  return { year: "", make: "", model: "", trim: "", vin: "", mileage: "", titleStatus: "" };
}

export async function listStoredQuotes(search = "") {
  const sql = database();
  if (!sql) return listQuotes(search);
  await ensureSchema();
  const rows = await sql.query("SELECT record FROM apex_quotes ORDER BY created_at DESC LIMIT 200") as Array<{ record: SavedQuoteRecord }>;
  const normalized = search.trim().toLowerCase();
  return rows.map((row) => row.record).filter((quote) => !normalized || JSON.stringify(quote).toLowerCase().includes(normalized));
}

export async function getStoredQuote(quoteId: string) {
  const sql = database();
  if (!sql) return getQuoteByQuoteId(quoteId);
  await ensureSchema();
  const rows = await sql.query("SELECT record FROM apex_quotes WHERE quote_id = $1 LIMIT 1", [quoteId]) as Array<{ record: SavedQuoteRecord }>;
  return rows[0]?.record || null;
}

export async function createStoredQuote(args: { quoteType: QuoteType; employee: EmployeeUser; input: QuoteInput; result: StructuredQuoteResult; status?: QuoteStatus }) {
  const sql = database();
  if (!sql) return createSavedQuote(args);
  await ensureSchema();
  const numbers = await sql.query("SELECT nextval('apex_quote_number_seq') AS number") as Array<{ number: string }>;
  const now = new Date().toISOString();
  const record: SavedQuoteRecord = {
    id: randomUUID(), quoteId: `APX-${new Date().getUTCFullYear()}-${String(numbers[0].number).padStart(6, "0")}`,
    quoteType: args.quoteType, status: args.status || "GENERATED", employee: args.employee,
    createdAt: now, updatedAt: now,
    customer: { id: randomUUID(), name: args.input.customerName || "Unnamed Prospect", email: args.input.customerEmail || "", phone: args.input.customerPhone || "", zip: args.input.zip || "" },
    vehicle: { id: randomUUID(), ...vehicleFromInput(args.quoteType, args.input) },
    input: args.input, result: args.result, reviewEvents: [],
  };
  await sql.query("INSERT INTO apex_quotes (quote_id, record) VALUES ($1, $2::jsonb)", [record.quoteId, JSON.stringify(record)]);
  return record;
}

export async function updateStoredQuoteReview(args: { quoteId: string; status: QuoteStatus; reviewer: EmployeeUser; note?: string; action?: QuoteReviewAction }) {
  const sql = database();
  if (!sql) return updateQuoteReviewStatus(args);
  await ensureSchema();
  const now = new Date().toISOString();
  const event: QuoteReviewEvent = {
    id: randomUUID(), action: args.action || "STATUS_CHANGED", status: args.status,
    note: String(args.note || "").trim().slice(0, 2000), reviewer: args.reviewer, createdAt: now,
  };
  const rows = await sql.query(`UPDATE apex_quotes SET
    record = jsonb_set(jsonb_set(jsonb_set(record, '{status}', to_jsonb($2::text)), '{updatedAt}', to_jsonb($3::text)),
      '{reviewEvents}', COALESCE(record->'reviewEvents', '[]'::jsonb) || $4::jsonb),
    updated_at = NOW() WHERE quote_id = $1 RETURNING record`,
    [args.quoteId, args.status, now, JSON.stringify([event])]) as Array<{ record: SavedQuoteRecord }>;
  return rows[0]?.record || null;
}

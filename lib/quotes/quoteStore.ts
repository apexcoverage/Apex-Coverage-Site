import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type {
  EmployeeUser,
  QuoteInput,
  QuoteStatus,
  QuoteType,
  SavedQuoteRecord,
  StructuredQuoteResult,
} from "./types";

type DatabaseSync = any;

type QuoteRow = {
  id: string;
  quote_id: string;
  quote_type: QuoteType;
  status: QuoteStatus;
  employee_email: string;
  employee_name: string;
  employee_role: string;
  created_at: string;
  updated_at: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_zip: string;
  vehicle_id: string;
  vehicle_year: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_trim: string;
  vehicle_vin: string;
  vehicle_mileage: string;
  vehicle_title_status: string;
  input_json: string;
  result_json: string;
};

let db: DatabaseSync | null | undefined;

function getDataDir() {
  const configured = process.env.APEX_QUOTE_DB_PATH;
  const dbPath = configured || path.join(process.cwd(), ".data", "apex-quotes.sqlite");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  return dbPath;
}

function loadSqlite() {
  if (db !== undefined) return db;

  try {
    const requireFunc = eval("require") as NodeRequire;
    const sqlite = requireFunc("node:sqlite");
    db = new sqlite.DatabaseSync(getDataDir());
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        zip TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        year TEXT NOT NULL,
        make TEXT NOT NULL,
        model TEXT NOT NULL,
        trim TEXT NOT NULL,
        vin TEXT NOT NULL,
        mileage TEXT NOT NULL,
        title_status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS quotes (
        id TEXT PRIMARY KEY,
        quote_id TEXT NOT NULL UNIQUE,
        quote_type TEXT NOT NULL,
        status TEXT NOT NULL,
        employee_email TEXT NOT NULL,
        employee_name TEXT NOT NULL,
        employee_role TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        vehicle_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS quote_inputs (
        id TEXT PRIMARY KEY,
        quote_id TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS quote_results (
        id TEXT PRIMARY KEY,
        quote_id TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    return db;
  } catch {
    db = null;
    return null;
  }
}

function jsonStorePath() {
  const sqlitePath = getDataDir();
  return sqlitePath.replace(/\.sqlite$/i, ".json");
}

function readJsonStore() {
  const file = jsonStorePath();
  if (!fs.existsSync(file)) return [] as SavedQuoteRecord[];
  const raw = fs.readFileSync(file, "utf8");
  return raw ? (JSON.parse(raw) as SavedQuoteRecord[]) : [];
}

function writeJsonStore(records: SavedQuoteRecord[]) {
  const file = jsonStorePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(records, null, 2));
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function firstAutoVehicle(input: QuoteInput) {
  if ("vehicles" in input) return input.vehicles[0];
  return null;
}

function customerFromInput(input: QuoteInput) {
  return {
    name: clean(input.customerName) || "Unnamed Prospect",
    email: clean(input.customerEmail),
    phone: clean(input.customerPhone),
    zip: clean(input.zip),
  };
}

function vehicleFromInput(quoteType: QuoteType, input: QuoteInput) {
  if (quoteType === "AUTO_INSURANCE") {
    const vehicle = firstAutoVehicle(input);
    return {
      year: clean(vehicle?.year),
      make: clean(vehicle?.make),
      model: clean(vehicle?.model),
      trim: clean(vehicle?.trimEngine),
      vin: "",
      mileage: "",
      titleStatus: "",
    };
  }

  if ("vehicle" in input) {
    return {
      year: clean(input.vehicle.year),
      make: clean(input.vehicle.make),
      model: clean(input.vehicle.model),
      trim: clean(input.vehicle.trim),
      vin: "",
      mileage: clean(input.vehicle.vehicleMileage),
      titleStatus: clean(input.vehicle.titleStatus),
    };
  }

  return {
    year: "",
    make: "",
    model: "",
    trim: "",
    vin: "",
    mileage: "",
    titleStatus: "",
  };
}

function makeQuoteId(existingCount: number, date = new Date()) {
  const year = date.getFullYear();
  return `APX-${year}-${String(existingCount + 1).padStart(6, "0")}`;
}

function rowToRecord(row: QuoteRow): SavedQuoteRecord {
  return {
    id: row.id,
    quoteId: row.quote_id,
    quoteType: row.quote_type,
    status: row.status,
    employee: {
      email: row.employee_email,
      name: row.employee_name,
      role: row.employee_role as EmployeeUser["role"],
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    customer: {
      id: row.customer_id,
      name: row.customer_name,
      email: row.customer_email,
      phone: row.customer_phone,
      zip: row.customer_zip,
    },
    vehicle: {
      id: row.vehicle_id,
      year: row.vehicle_year,
      make: row.vehicle_make,
      model: row.vehicle_model,
      trim: row.vehicle_trim,
      vin: row.vehicle_vin,
      mileage: row.vehicle_mileage,
      titleStatus: row.vehicle_title_status,
    },
    input: JSON.parse(row.input_json),
    result: JSON.parse(row.result_json),
  };
}

export function listQuotes(search = "") {
  const sqlite = loadSqlite();
  const normalizedSearch = search.trim().toLowerCase();

  if (!sqlite) {
    return readJsonStore()
      .filter((quote) =>
        normalizedSearch ? JSON.stringify(quote).toLowerCase().includes(normalizedSearch) : true
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const rows = sqlite
    .prepare(
      `
      SELECT
        q.id, q.quote_id, q.quote_type, q.status, q.employee_email,
        q.employee_name, q.employee_role, q.created_at, q.updated_at,
        c.id AS customer_id, c.name AS customer_name, c.email AS customer_email,
        c.phone AS customer_phone, c.zip AS customer_zip,
        v.id AS vehicle_id, v.year AS vehicle_year, v.make AS vehicle_make,
        v.model AS vehicle_model, v.trim AS vehicle_trim, v.vin AS vehicle_vin,
        v.mileage AS vehicle_mileage, v.title_status AS vehicle_title_status,
        qi.payload_json AS input_json, qr.payload_json AS result_json
      FROM quotes q
      JOIN customers c ON c.id = q.customer_id
      JOIN vehicles v ON v.id = q.vehicle_id
      JOIN quote_inputs qi ON qi.quote_id = q.id
      JOIN quote_results qr ON qr.quote_id = q.id
      ORDER BY q.created_at DESC
      LIMIT 200
    `
    )
    .all() as QuoteRow[];

  return rows
    .map(rowToRecord)
    .filter((quote) =>
      normalizedSearch ? JSON.stringify(quote).toLowerCase().includes(normalizedSearch) : true
    );
}

export function getQuoteByQuoteId(quoteId: string) {
  const sqlite = loadSqlite();

  if (!sqlite) {
    return readJsonStore().find((quote) => quote.quoteId === quoteId) || null;
  }

  const row = sqlite
    .prepare(
      `
      SELECT
        q.id, q.quote_id, q.quote_type, q.status, q.employee_email,
        q.employee_name, q.employee_role, q.created_at, q.updated_at,
        c.id AS customer_id, c.name AS customer_name, c.email AS customer_email,
        c.phone AS customer_phone, c.zip AS customer_zip,
        v.id AS vehicle_id, v.year AS vehicle_year, v.make AS vehicle_make,
        v.model AS vehicle_model, v.trim AS vehicle_trim, v.vin AS vehicle_vin,
        v.mileage AS vehicle_mileage, v.title_status AS vehicle_title_status,
        qi.payload_json AS input_json, qr.payload_json AS result_json
      FROM quotes q
      JOIN customers c ON c.id = q.customer_id
      JOIN vehicles v ON v.id = q.vehicle_id
      JOIN quote_inputs qi ON qi.quote_id = q.id
      JOIN quote_results qr ON qr.quote_id = q.id
      WHERE q.quote_id = ?
      LIMIT 1
    `
    )
    .get(quoteId) as QuoteRow | undefined;

  return row ? rowToRecord(row) : null;
}

export function createSavedQuote(args: {
  quoteType: QuoteType;
  employee: EmployeeUser;
  input: QuoteInput;
  result: StructuredQuoteResult;
  status?: QuoteStatus;
}) {
  const sqlite = loadSqlite();
  const now = new Date().toISOString();
  const customer = customerFromInput(args.input);
  const vehicle = vehicleFromInput(args.quoteType, args.input);
  const existingCount = listQuotes().filter((quote) =>
    quote.quoteId.startsWith(`APX-${new Date().getFullYear()}-`)
  ).length;

  const record: SavedQuoteRecord = {
    id: randomUUID(),
    quoteId: makeQuoteId(existingCount),
    quoteType: args.quoteType,
    status: args.status || "GENERATED",
    employee: args.employee,
    createdAt: now,
    updatedAt: now,
    customer: {
      id: randomUUID(),
      ...customer,
    },
    vehicle: {
      id: randomUUID(),
      ...vehicle,
    },
    input: args.input,
    result: args.result,
  };

  if (!sqlite) {
    const records = readJsonStore();
    records.push(record);
    writeJsonStore(records);
    return record;
  }

  sqlite.exec("BEGIN");
  try {
    sqlite
      .prepare(
        "INSERT OR IGNORE INTO users (id, email, name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .run(randomUUID(), args.employee.email, args.employee.name, args.employee.role, now, now);

    sqlite
      .prepare(
        "INSERT INTO customers (id, name, email, phone, zip, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .run(
        record.customer.id,
        record.customer.name,
        record.customer.email,
        record.customer.phone,
        record.customer.zip,
        now,
        now
      );

    sqlite
      .prepare(
        "INSERT INTO vehicles (id, customer_id, year, make, model, trim, vin, mileage, title_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .run(
        record.vehicle.id,
        record.customer.id,
        record.vehicle.year,
        record.vehicle.make,
        record.vehicle.model,
        record.vehicle.trim,
        record.vehicle.vin,
        record.vehicle.mileage,
        record.vehicle.titleStatus,
        now,
        now
      );

    sqlite
      .prepare(
        "INSERT INTO quotes (id, quote_id, quote_type, status, employee_email, employee_name, employee_role, customer_id, vehicle_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .run(
        record.id,
        record.quoteId,
        record.quoteType,
        record.status,
        record.employee.email,
        record.employee.name,
        record.employee.role,
        record.customer.id,
        record.vehicle.id,
        now,
        now
      );

    sqlite
      .prepare(
        "INSERT INTO quote_inputs (id, quote_id, payload_json, created_at) VALUES (?, ?, ?, ?)"
      )
      .run(randomUUID(), record.id, JSON.stringify(record.input), now);

    sqlite
      .prepare(
        "INSERT INTO quote_results (id, quote_id, payload_json, created_at) VALUES (?, ?, ?, ?)"
      )
      .run(randomUUID(), record.id, JSON.stringify(record.result), now);

    sqlite.exec("COMMIT");
    return record;
  } catch (err) {
    sqlite.exec("ROLLBACK");
    throw err;
  }
}

export function updateQuoteStatus(quoteId: string, status: QuoteStatus) {
  const sqlite = loadSqlite();
  const now = new Date().toISOString();

  if (!sqlite) {
    const records = readJsonStore();
    const next = records.map((quote) =>
      quote.quoteId === quoteId ? { ...quote, status, updatedAt: now } : quote
    );
    writeJsonStore(next);
    return next.find((quote) => quote.quoteId === quoteId) || null;
  }

  sqlite
    .prepare("UPDATE quotes SET status = ?, updated_at = ? WHERE quote_id = ?")
    .run(status, now, quoteId);

  return getQuoteByQuoteId(quoteId);
}

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

class Sheet {
  constructor(rows) {
    this.rows = rows;
  }
  getLastRow() {
    return this.rows.length;
  }
  getLastColumn() {
    return this.rows[0]?.length || 0;
  }
  getDataRange() {
    return { getValues: () => this.rows.map((row) => [...row]) };
  }
  getRange(row, column, height = 1, width = 1) {
    return {
      getValues: () => this.rows.slice(row - 1, row - 1 + height).map((values) => values.slice(column - 1, column - 1 + width)),
      setValue: (value) => {
        this.rows[row - 1] ||= [];
        this.rows[row - 1][column - 1] = value;
      },
    };
  }
  appendRow(row) {
    this.rows.push(row);
  }
}

test("active build customers are suppressed across older lead rows", () => {
  const sent = [];
  const sheets = {
    Leads: new Sheet([["Timestamp", "Name", "Email", "Phone", "ZIP", "DOB", "Year", "Make", "Model", "Consent", "Status"]]),
    "Build Reviews": new Sheet([["Email", "Status"], ["customer@example.com", "Active"]]),
  };
  const context = vm.createContext({
    SpreadsheetApp: { getActive: () => ({ getSheetByName: (name) => sheets[name], insertSheet: (name) => (sheets[name] = new Sheet([])) }) },
    GmailApp: { sendEmail: (...args) => sent.push(args) },
    Utilities: { formatDate: () => "2026/10/19" },
    Logger: { log: () => {} },
  });
  const source = fs.readFileSync(path.join(__dirname, "..", "apps-script", "FollowUps.gs"), "utf8");
  vm.runInContext(source, context);
  const when = vm.runInContext("new Date('2026-10-15T12:00:00Z')", context);
  sheets.Leads.rows.push([when, "Customer", "customer@example.com", "", "12345", "", "2024", "Ford", "Ranger", "Yes", "New"]);
  vm.runInContext("runDailyFollowups()", context);
  assert.equal(sent.length, 0);
  assert.equal(sheets.Leads.rows[1][10], "New");
  assert(sheets.Leads.rows[1].includes("Stopped"));
  const preview = vm.runInContext("renderFollowup_('D3', { name: 'Preview', vehicle: '2024 Ford Ranger' })", context);
  assert.match(preview.subject, /improve your quote/);
  assert.match(preview.html, /Apex_Shield_Email\.png/);
});

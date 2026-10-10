/** === Apex Coverage: Webhook + Styled Emails (with GmailApp + text fallback) === **/

/** ---- CONFIG ---- **/
const SHEET_NAME  = 'Leads';   // tab where lead submissions are stored
const CLAIMS_TAB  = 'Claims';  // tab where claim submissions are stored
const BUILD_REVIEWS_TAB = 'Build Reviews'; // tab where modified vehicle protection intakes are stored
const DOCUMENT_UPLOADS_TAB = 'Document Uploads'; // tab where agent-assisted customer uploads are stored
const LOG_SHEET   = 'Logs';    // optional log tab (auto-created if missing)
const PAYMENTS_TAB = 'Payments'; // persistent Stripe payment / billing history
const BUILD_REVIEW_FIX_VERSION = '2026-07-07-public-site-v1';

// Email branding / routing (LEADS / QUOTES)
const BRAND            = 'Apex Coverage';
const NOTIFY_TO        = 'quotes@driveapexcoverage.com';   // internal alerts (leads)
const REPLY_TO         = 'quotes@driveapexcoverage.com';   // replies go here (leads)
const QUOTES_FROM_EMAIL = 'quotes@driveapexcoverage.com';  // must be a verified Gmail send-as alias
const QUOTES_FROM_NAME = 'Apex Coverage Reviews';          // display name for lead emails
const SITE_URL         = 'https://www.driveapexcoverage.com';
const DOCUMENT_UPLOAD_NOTIFY_TO = 'support@driveapexcoverage.com';
const SUPPORT_FROM_EMAIL = 'support@driveapexcoverage.com'; // must be a verified Gmail send-as alias

// ---- CLAIMS-ONLY ROUTING ----
const CLAIMS_FROM_NAME = 'Apex Coverage Claims';           // display name for claim emails
const CLAIMS_NOTIFY_TO = 'claims@driveapexcoverage.com';   // internal claims inbox
const CLAIMS_REPLY_TO  = 'claims@driveapexcoverage.com';   // customer replies for claims
const CLAIMS_FROM_EMAIL = 'claims@driveapexcoverage.com';  // must be a verified Gmail send-as alias
const CLAIMS_BCC       = 'claims@driveapexcoverage.com';   // optional audit copy

/** ---- AGENT DASHBOARD API (secure, JSON over GET/POST) ---- **/
const AGENT_SECRET       = '1qaz2wsx3edc!QAZ@WSX#EDC'; // <<< CHANGE THIS
const AGENT_LEADS_SHEET  = SHEET_NAME; // reuse Leads
const WORKSHEETS_TAB     = 'Worksheets'; // new tab for agent worksheets

/** ---- UTIL ---- **/
function respond(obj) {
  const out = ContentService.createTextOutput(JSON.stringify(obj));
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}
function agentError_(msg, code) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok:false, error: msg, code: code || 400 }))
    .setMimeType(ContentService.MimeType.JSON);
}
function logRow(msg, data) {
  try {
    const ss = SpreadsheetApp.getActive();
    const s = ss.getSheetByName(LOG_SHEET) || ss.insertSheet(LOG_SHEET);
    s.appendRow([new Date(), msg, JSON.stringify(data || {})]);
  } catch (e) {
    Logger.log('logRow failed: ' + e);
  }
}
function nowEtString_() {
  return Utilities.formatDate(new Date(), "America/New_York", "yyyy-MM-dd h:mm a");
}
function nowEtIsoString_() {
  return Utilities.formatDate(new Date(), "America/New_York", "yyyy-MM-dd'T'HH:mm:ss");
}
function safeString_(v) {
  return v == null ? "" : String(v);
}
function normalizeHeader_(v) {
  return String(v || "").trim().toLowerCase();
}
function apexNormalizeStatus_(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}
function apexIsClosedLeadStatus_(status) {
  var normalized = apexNormalizeStatus_(status);
  return [
    "won",
    "active",
    "customer",
    "activecustomer",
    "converted",
    "bound",
    "policyactive",
    "deleted",
    "duplicate",
    "lost",
    "notinterested"
  ].indexOf(normalized) !== -1;
}
function apexShouldSendLeadFollowUp_(leadOrStatus) {
  if (typeof leadOrStatus === "string") {
    return !apexIsClosedLeadStatus_(leadOrStatus);
  }

  var lead = leadOrStatus || {};
  var status = lead.status || lead.Status || lead.leadStatus || lead["Lead Status"];
  var followUpStatus =
    lead.followUpStatus ||
    lead["Follow Up Status"] ||
    lead.followupStatus ||
    lead["Follow-Up Status"];
  var suppressed =
    lead.followUpSuppressed ||
    lead["Follow Up Suppressed"] ||
    lead.followupSuppressed ||
    lead["Follow-Up Suppressed"];

  if (apexIsClosedLeadStatus_(status)) return false;
  if (apexNormalizeStatus_(followUpStatus) === "stopped") return false;
  if (String(suppressed || "").trim().toLowerCase() === "yes") return false;
  if (String(suppressed || "").trim().toLowerCase() === "true") return false;
  return true;
}
function apexApplyLeadFollowUpSuppression_(sheet, rowNumber, status, ensureCol1) {
  if (!sheet || !rowNumber || !apexIsClosedLeadStatus_(status)) return;

  var ensure =
    ensureCol1 ||
    function (displayName) {
      var lastCol = sheet.getLastColumn();
      var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      var normalized = headers.map(function (header) {
        return String(header || "").trim().toLowerCase();
      });
      var idx0 = normalized.indexOf(String(displayName || "").trim().toLowerCase());
      if (idx0 === -1) {
        sheet.getRange(1, lastCol + 1).setValue(displayName);
        return lastCol + 1;
      }
      return idx0 + 1;
    };

  var stoppedAt = nowEtString_();
  var stopReason = "Stopped because lead status changed to " + String(status || "");
  sheet.getRange(rowNumber, ensure("Follow Up Status")).setValue("Stopped");
  sheet.getRange(rowNumber, ensure("Follow Up Suppressed")).setValue("Yes");
  sheet.getRange(rowNumber, ensure("Follow Up Stop Reason")).setValue(stopReason);
  sheet.getRange(rowNumber, ensure("Follow Up Stopped At")).setValue(stoppedAt);
  sheet.getRange(rowNumber, ensure("Next Follow Up")).setValue("");
  sheet.getRange(rowNumber, ensure("Next Follow Up At")).setValue("");
}
function parseUrlEncodedBody_(contents) {
  var out = {};
  String(contents || '').split('&').forEach(function (pair) {
    if (!pair) return;
    var idx = pair.indexOf('=');
    var rawKey = idx >= 0 ? pair.slice(0, idx) : pair;
    var rawValue = idx >= 0 ? pair.slice(idx + 1) : '';
    var key = decodeURIComponent(String(rawKey || '').replace(/\+/g, ' '));
    var value = decodeURIComponent(String(rawValue || '').replace(/\+/g, ' '));

    if (!key) return;

    if (out[key] === undefined) {
      out[key] = value;
      return;
    }

    if (Array.isArray(out[key])) {
      out[key].push(value);
      return;
    }

    out[key] = [out[key], value];
  });
  return out;
}
function formatAmountForDisplay_(amount, currency) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return safeString_(amount);
  const curr = safeString_(currency || "usd").toUpperCase();
  return n + " " + curr;
}

/** One-time helper (optional) to verify GmailApp sends as this user */
function authorizeEmail() {
  GmailApp.sendEmail(REPLY_TO, 'Apex Coverage test', 'If you got this, GmailApp is authorized.');
}

/** Helper to verify the deployed account can send from the required aliases */
function listAuthorizedSenderAliases() {
  const aliases = GmailApp.getAliases();
  logRow('authorizedSenderAliases', { aliases: aliases });
  return aliases;
}

/** ---- EMAIL TEMPLATE HELPERS ---- **/
function esc(s) {
  return String(s || '').replace(/[&<>"']/g, function (m) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
  });
}

/**
 * Apex Coverage - redesigned email templates + preview sender
 *
 * Replace the existing email helper functions in Code.gs with this section:
 * - customerEmailHTML
 * - internalEmailHTML
 * - claimInternalHTML
 * - claimCustomerHTML
 * - buildReviewInternalHTML
 * - buildReviewCustomerHTML
 *
 * Keep sendCoveragePdf.gs, but update it to call apexPolicyDocumentsEmailHTML_.
 * Use sendApexEmailPreviewSet("you@example.com") to send review previews.
 */

function apexEmailConfig_() {
  return {
    brand: typeof BRAND !== 'undefined' ? BRAND : 'Apex Coverage',
    siteUrl: typeof SITE_URL !== 'undefined'
      ? SITE_URL
      : 'https://www.driveapexcoverage.com',
    logoUrl: 'https://www.driveapexcoverage.com/Apex_Shield_Email.png',
    supportEmail: 'support@driveapexcoverage.com',
    supportPhone: '844-398-2739',
    legalName: 'Apex Pro Services d/b/a Apex Coverage'
  };
}

function apexSafeString_(value) {
  return value == null ? '' : String(value);
}

function apexHtmlEsc_(value) {
  return apexSafeString_(value).replace(/[&<>"']/g, function (m) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
  });
}

function apexDisplay_(value, fallback) {
  var text = apexSafeString_(value).trim();
  return text || fallback || '-';
}

function apexEmailRows_(rows) {
  return rows.map(function (row) {
    return ''
      + '<tr>'
      + '<td style="padding:10px 0;border-bottom:1px solid #e7eef8;color:#64748b;font-size:13px;font-weight:700;width:38%;">'
      + apexHtmlEsc_(row[0])
      + '</td>'
      + '<td style="padding:10px 0;border-bottom:1px solid #e7eef8;color:#0f172a;font-size:14px;font-weight:700;">'
      + apexHtmlEsc_(apexDisplay_(row[1], row[2] || '-'))
      + '</td>'
      + '</tr>';
  }).join('');
}

function apexBulletList_(items) {
  return ''
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">'
    + items.map(function (item) {
      return ''
        + '<tr>'
        + '<td width="24" valign="top" style="padding:5px 0;color:#2563eb;font-size:16px;font-weight:900;">&#8226;</td>'
        + '<td style="padding:5px 0;color:#334155;font-size:14px;line-height:1.55;">'
        + apexHtmlEsc_(item)
        + '</td>'
        + '</tr>';
    }).join('')
    + '</table>';
}

function apexPanel_(title, html) {
  return ''
    + '<div style="margin-top:18px;border:1px solid #dbeafe;background:#f8fbff;border-radius:16px;padding:18px;">'
    + '<div style="font-size:13px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#2563eb;margin-bottom:10px;">'
    + apexHtmlEsc_(title)
    + '</div>'
    + html
    + '</div>';
}

function apexEmailShell_(args) {
  var cfg = apexEmailConfig_();
  var title = apexDisplay_(args.title, cfg.brand);
  var preheader = apexDisplay_(args.preheader, title);
  var eyebrow = apexDisplay_(args.eyebrow, cfg.brand);
  var intro = apexDisplay_(args.intro, '');
  var bodyHtml = args.bodyHtml || '';
  var ctaLabel = apexDisplay_(args.ctaLabel, '');
  var ctaUrl = apexDisplay_(args.ctaUrl, '');
  var footerNote = apexDisplay_(args.footerNote, 'You received this email because you contacted Apex Coverage or have an active relationship with our team.');

  var ctaHtml = '';
  if (ctaLabel && ctaUrl) {
    ctaHtml = ''
      + '<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:22px;">'
      + '<tr><td style="border-radius:999px;background:#0b63ff;">'
      + '<a href="' + apexHtmlEsc_(ctaUrl) + '" style="display:inline-block;padding:13px 22px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:900;">'
      + apexHtmlEsc_(ctaLabel)
      + '</a>'
      + '</td></tr>'
      + '</table>';
  }

  return ''
    + '<!doctype html>'
    + '<html><body style="margin:0;padding:0;background:#eef5ff;">'
    + '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">'
    + apexHtmlEsc_(preheader)
    + '</div>'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef5ff;margin:0;padding:28px 12px;">'
    + '<tr><td align="center">'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;border-collapse:separate;border-spacing:0;background:#ffffff;border-radius:22px;overflow:hidden;box-shadow:0 18px 50px rgba(15,23,42,.16);">'
    + '<tr><td style="background:linear-gradient(135deg,#071225 0%,#0b2b55 58%,#0b63ff 100%);padding:28px 26px 30px;">'
    + '<div style="color:#93c5fd;font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;margin-bottom:10px;">'
    + apexHtmlEsc_(eyebrow)
    + '</div>'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>'
    + '<td valign="top" style="padding-right:18px;">'
    + '<h1 style="margin:0;color:#ffffff;font-family:Segoe UI,Roboto,Arial,sans-serif;font-size:30px;line-height:1.08;font-weight:900;">'
    + apexHtmlEsc_(title)
    + '</h1>'
    + (intro ? '<p style="margin:14px 0 0;color:#dbeafe;font-family:Segoe UI,Roboto,Arial,sans-serif;font-size:15px;line-height:1.6;">' + apexHtmlEsc_(intro) + '</p>' : '')
    + '<p style="margin:16px 0 0;color:#bfdbfe;font-family:Segoe UI,Roboto,Arial,sans-serif;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;">'
    + apexHtmlEsc_(cfg.supportPhone)
    + '</p>'
    + '</td>'
    + '<td width="68" valign="top" align="right" style="padding:2px 0 0 14px;">'
    + '<img src="' + apexHtmlEsc_(cfg.logoUrl) + '" alt="Apex Coverage" width="58" style="display:block;width:58px;max-width:58px;height:auto;border:0;outline:none;text-decoration:none;" />'
    + '</td>'
    + '</tr></table>'
    + '</td></tr>'
    + '<tr><td style="padding:28px 26px;font-family:Segoe UI,Roboto,Arial,sans-serif;color:#0f172a;">'
    + bodyHtml
    + ctaHtml
    + '</td></tr>'
    + '<tr><td style="padding:22px 26px;background:#f8fbff;border-top:1px solid #dbeafe;font-family:Segoe UI,Roboto,Arial,sans-serif;">'
    + '<p style="margin:0;color:#475569;font-size:13px;line-height:1.6;">'
    + apexHtmlEsc_(footerNote)
    + '</p>'
    + '<p style="margin:12px 0 0;color:#64748b;font-size:12px;line-height:1.6;">'
    + apexHtmlEsc_(cfg.legalName) + '<br/>'
    + '<a href="mailto:' + apexHtmlEsc_(cfg.supportEmail) + '" style="color:#2563eb;text-decoration:none;">' + apexHtmlEsc_(cfg.supportEmail) + '</a>'
    + ' &nbsp;|&nbsp; '
    + '<a href="' + apexHtmlEsc_(cfg.siteUrl) + '" style="color:#2563eb;text-decoration:none;">driveapexcoverage.com</a>'
    + '</p>'
    + '</td></tr>'
    + '</table>'
    + '</td></tr>'
    + '</table>'
    + '</body></html>';
}

function customerEmailHTML(args) {
  var cfg = apexEmailConfig_();
  var name = apexDisplay_(args.name, 'there');
  var vehicle = apexDisplay_(args.vehicle, 'Vehicle not provided');
  var rows = [
    ['Name', name],
    ['Email', args.email],
    ['Phone', args.phone, 'Not provided'],
    ['ZIP Code', args.zip, 'Not provided'],
    ['Vehicle', vehicle]
  ];

  var body = ''
    + '<p style="margin:0;color:#334155;font-size:15px;line-height:1.65;">'
    + 'Hi ' + apexHtmlEsc_(name) + ', we received your auto coverage request. An Apex Coverage agent will review the information and follow up to confirm details, answer questions, and help you understand your options.'
    + '</p>'
    + apexPanel_('Request summary', '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + apexEmailRows_(rows) + '</table>')
    + apexPanel_('What happens next', apexBulletList_([
      'We review your vehicle and contact details.',
      'An agent reaches out if anything needs clarification.',
      'You get clear next steps before making any coverage decision.'
    ]))
    + '<p style="margin:18px 0 0;color:#475569;font-size:14px;line-height:1.6;">'
    + 'Need to update something? Reply to this email and we will take care of it.'
    + '</p>';

  return apexEmailShell_({
    eyebrow: 'Auto coverage request',
    title: 'We received your request.',
    preheader: 'Apex Coverage received your auto coverage request.',
    intro: 'Real support, clear guidance, and coverage built around how you drive.',
    bodyHtml: body,
    ctaLabel: 'Visit Apex Coverage',
    ctaUrl: cfg.siteUrl
  });
}

function internalEmailHTML(args) {
  var cfg = apexEmailConfig_();
  var rows = [
    ['Name', args.name],
    ['Email', args.email, 'None'],
    ['Phone', args.phone, 'None'],
    ['ZIP', args.zip, 'None'],
    ['DOB', args.dob, 'None'],
    ['Vehicle', args.vehicle, 'Unspecified'],
    ['Consent', args.consent, 'false'],
    ['Received', args.when]
  ];

  var body = ''
    + apexPanel_('Lead details', '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + apexEmailRows_(rows) + '</table>')
    + apexPanel_('Recommended next actions', apexBulletList_([
      'Contact the prospect and verify the vehicle details.',
      'Confirm desired coverage, timing, and any build-related needs.',
      'Document the conversation in the agent dashboard.'
    ]));

  return apexEmailShell_({
    eyebrow: 'Internal lead alert',
    title: 'New auto coverage lead',
    preheader: 'A new auto coverage lead was submitted.',
    intro: 'A new lead is ready for agent follow-up.',
    bodyHtml: body,
    ctaLabel: 'Open Apex dashboard',
    ctaUrl: cfg.siteUrl + '/agent',
    footerNote: 'Internal Apex Coverage notification. Do not forward outside the company.'
  });
}

function claimInternalHTML(c) {
  var cfg = apexEmailConfig_();
  var rows = [
    ['Name', c.name],
    ['Email', c.email, 'None'],
    ['Phone', c.phone, 'None'],
    ['Policy #', c.policy, 'Unknown'],
    ['Date/Time of Loss', apexDisplay_(c.dateOfLoss, '') + ' ' + apexDisplay_(c.timeOfLoss, '')],
    ['Location', c.location, 'Not provided'],
    ['Vehicle', c.vehicle, 'Unspecified'],
    ['Loss Type', c.lossType],
    ['Police Report', c.policeReport],
    ['Preferred Contact', c.preferredContact],
    ['Photos/Links', c.photoUrls, 'None'],
    ['Description', c.description],
    ['Source', c.source],
    ['Received', c.whenStr]
  ];

  return apexEmailShell_({
    eyebrow: 'Internal claims alert',
    title: 'New claim submitted',
    preheader: 'A new claim has been submitted.',
    intro: 'Review the claim details and contact the customer with next steps.',
    bodyHtml: apexPanel_('Claim details', '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + apexEmailRows_(rows) + '</table>'),
    ctaLabel: 'Open Apex dashboard',
    ctaUrl: cfg.siteUrl + '/agent',
    footerNote: 'Internal Apex Coverage claims notification. Do not forward outside the company.'
  });
}

function claimCustomerHTML(c) {
  var cfg = apexEmailConfig_();
  var rows = [
    ['Policy #', c.policy, 'Unknown'],
    ['Date/Time', apexDisplay_(c.dateOfLoss, '') + ' ' + apexDisplay_(c.timeOfLoss, '')],
    ['Location', c.location, 'Not provided'],
    ['Vehicle', c.vehicle, 'Unspecified'],
    ['Loss Type', c.lossType]
  ];

  var body = ''
    + '<p style="margin:0;color:#334155;font-size:15px;line-height:1.65;">'
    + 'Hi ' + apexHtmlEsc_(apexDisplay_(c.name, 'there')) + ', we received your claim information. A claims specialist will review the submission and contact you with next steps.'
    + '</p>'
    + apexPanel_('Claim summary', '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + apexEmailRows_(rows) + '</table>')
    + apexPanel_('Helpful next step', apexBulletList_([
      'Keep photos of the damage available if it is safe to take them.',
      'Have the police report number ready if one was filed.',
      'Let us know where the vehicle is currently located.'
    ]))
    + '<p style="margin:18px 0 0;color:#475569;font-size:14px;line-height:1.6;">'
    + 'If this needs urgent attention, call us at ' + apexHtmlEsc_(cfg.supportPhone) + '.'
    + '</p>';

  return apexEmailShell_({
    eyebrow: 'Claim received',
    title: 'Your claim is in.',
    preheader: 'Apex Coverage received your claim information.',
    intro: 'Our team will review the details and contact you with next steps.',
    bodyHtml: body,
    ctaLabel: 'Visit Apex Coverage',
    ctaUrl: cfg.siteUrl
  });
}

function buildReviewInternalHTML(b) {
  var cfg = apexEmailConfig_();
  var rows = [
    ['Name', b.name],
    ['Email', b.email, 'None'],
    ['Phone', b.phone, 'None'],
    ['ZIP / DOB', apexDisplay_(b.zip, '-') + ' / ' + apexDisplay_(b.dob, '-')],
    ['Vehicle', b.vehicle],
    ['VIN', b.vin],
    ['Mileage / Annual', apexDisplay_(b.mileage, '-') + ' / ' + apexDisplay_(b.annualMileage, '-')],
    ['Title / Use', apexDisplay_(b.titleStatus, '-') + ' / ' + apexDisplay_(b.vehicleUse, '-')],
    ['Tier / Deductible', apexDisplay_(b.tierInterest, '-') + ' / ' + apexDisplay_(b.deductible, '-')],
    ['Parts Value', b.partsValue],
    ['Install Status', b.professionalInstallStatus],
    ['Documentation', b.documentation, 'None selected'],
    ['Driving / Claim History', apexDisplay_(b.drivingHistory, '-') + ' / ' + apexDisplay_(b.claimHistory, '-')],
    ['Auto Coverage Review', b.autoInsuranceReview, 'No'],
    ['Parts List', b.partsList],
    ['Installer Info', b.installerInfo],
    ['Discount Notes', b.discountNotes]
  ];

  var body = ''
    + apexPanel_('Build review details', '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + apexEmailRows_(rows) + '</table>')
    + apexPanel_('Agent checklist', apexBulletList_([
      'Review declared parts value and documentation.',
      'Confirm VIN, current mileage, title status, and vehicle use.',
      'Request missing receipts, photos, or install details before binding.'
    ]));

  return apexEmailShell_({
    eyebrow: 'Internal build alert',
    title: 'New Modified Vehicle Protection review',
    preheader: 'A new build review was submitted.',
    intro: 'A modified vehicle intake is ready for review.',
    bodyHtml: body,
    ctaLabel: 'Open Apex dashboard',
    ctaUrl: cfg.siteUrl + '/agent',
    footerNote: 'Internal Apex Coverage build review notification. Do not forward outside the company.'
  });
}

function buildReviewCustomerHTML(b) {
  var cfg = apexEmailConfig_();
  var rows = [
    ['Vehicle', b.vehicle, 'Unspecified'],
    ['VIN', b.vin, 'Not provided'],
    ['Tier Interest', b.tierInterest, 'Not sure'],
    ['Deductible', b.deductible, 'Not sure'],
    ['Documentation', b.documentation, 'None selected']
  ];

  var body = ''
    + '<p style="margin:0;color:#334155;font-size:15px;line-height:1.65;">'
    + 'Hi ' + apexHtmlEsc_(apexDisplay_(b.name, 'there')) + ', we received your Modified Vehicle Protection build review. Our team will review the vehicle, parts, documentation, and risk details before following up.'
    + '</p>'
    + apexPanel_('Build review summary', '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + apexEmailRows_(rows) + '</table>')
    + apexPanel_('Helpful next step', apexBulletList_([
      'Keep receipts, invoices, and photos ready.',
      'Have VIN and current mileage available.',
      'If any details change, reply to this email and we will update the review.'
    ]))
    + '<p style="margin:18px 0 0;color:#475569;font-size:14px;line-height:1.6;">'
    + 'Questions? Reply to this email or call us at ' + apexHtmlEsc_(cfg.supportPhone) + '.'
    + '</p>';

  return apexEmailShell_({
    eyebrow: 'Build review received',
    title: 'We have your build review.',
    preheader: 'Apex Coverage received your Modified Vehicle Protection review.',
    intro: 'We will review your vehicle and follow up with clear next steps.',
    bodyHtml: body,
    ctaLabel: 'Visit Apex Coverage',
    ctaUrl: cfg.siteUrl
  });
}

function apexLeadFollowUpHTML_(lead) {
  var cfg = apexEmailConfig_();
  var name = apexDisplay_(lead && (lead.name || lead.Name), 'there');
  var vehicle = apexDisplay_(
    lead && (lead.vehicle || lead.Vehicle || [lead.year, lead.make, lead.model].filter(Boolean).join(' ')),
    'your vehicle'
  );
  var rows = [
    ['Name', name],
    ['Vehicle', vehicle],
    ['ZIP', lead && (lead.zip || lead.ZIP), 'Not provided'],
    ['Phone', lead && (lead.phone || lead.Phone), 'Not provided'],
    ['Email', lead && (lead.email || lead.Email), 'Not provided']
  ];

  var body = ''
    + '<p style="margin:0;color:#334155;font-size:15px;line-height:1.65;">'
    + 'Hi ' + apexHtmlEsc_(name) + ', we wanted to follow up on your Apex Coverage request. If you still want help reviewing coverage options for ' + apexHtmlEsc_(vehicle) + ', reply to this email or call us at ' + apexHtmlEsc_(cfg.supportPhone) + '.'
    + '</p>'
    + apexPanel_('Request on file', '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + apexEmailRows_(rows) + '</table>')
    + apexPanel_('What we can help with', apexBulletList_([
      'Review coverage options based on the vehicle and your goals.',
      'Answer questions about auto coverage or Modified Vehicle Protection.',
      'Help you understand next steps before making a decision.'
    ]))
    + '<p style="margin:18px 0 0;color:#475569;font-size:14px;line-height:1.6;">'
    + 'If you are already covered with Apex, you can ignore this email.'
    + '</p>';

  return apexEmailShell_({
    eyebrow: 'Apex Coverage follow-up',
    title: 'Still want help with coverage?',
    preheader: 'A quick follow-up from Apex Coverage.',
    intro: 'No pressure. Just real help from the Apex team.',
    bodyHtml: body,
    ctaLabel: 'Visit Apex Coverage',
    ctaUrl: cfg.siteUrl,
    footerNote: 'You received this email because you requested coverage information from Apex Coverage. If you are already an active customer, no action is needed.'
  });
}

function apexPolicyDocumentsEmailHTML_(args) {
  args = args || {};
  var documentType = apexSafeString_(args.documentType).toLowerCase();
  var documentLabelCheck = apexSafeString_(args.documentLabel).toLowerCase();
  if (
    documentType === 'build' ||
    documentType === 'mvp' ||
    documentLabelCheck.indexOf('modified') !== -1 ||
    documentLabelCheck.indexOf('protection') !== -1
  ) {
    return apexModifiedVehicleProtectionDocumentsEmailHTML_(args);
  }

  var cfg = apexEmailConfig_();
  var name = apexDisplay_(args.name, 'Customer');
  var summary = args.summary || {};
  var documentLabel = apexDisplay_(args.documentLabel, 'policy documents');
  var rows = [
    ['Policy / Plan Number', summary.policyNumber, 'Pending confirmation'],
    ['Effective Date', summary.effectiveDate, 'Pending confirmation'],
    ['Vehicle(s)', summary.vehicles, 'Vehicle schedule on file'],
    ['Coverage', summary.coverage, 'Coverage on file'],
    ['Deductibles', summary.deductibles, 'See attached documents']
  ];

  var body = ''
    + '<p style="margin:0;color:#334155;font-size:15px;line-height:1.65;">'
    + 'Hi ' + apexHtmlEsc_(name) + ', welcome to Apex Coverage. Your coverage documents are attached to this email for your records.'
    + '</p>'
    + apexPanel_('Coverage summary', '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + apexEmailRows_(rows) + '</table>')
    + apexPanel_('Attached', apexBulletList_([
      'Your official ' + documentLabel + '.',
      'Declarations page and coverage details.',
      'Proof of coverage for your records.'
    ]))
    + '<p style="margin:18px 0 0;color:#475569;font-size:14px;line-height:1.6;">'
    + 'If you need to make updates, add a vehicle, or have questions, simply reply to this email. For immediate assistance, call ' + apexHtmlEsc_(cfg.supportPhone) + '.'
    + '</p>';

  return apexEmailShell_({
    eyebrow: 'Coverage documents',
    title: 'Your coverage is active.',
    preheader: 'Your Apex Coverage documents are attached.',
    intro: 'Your policy documents and proof of coverage are attached.',
    bodyHtml: body,
    ctaLabel: 'Visit Apex Coverage',
    ctaUrl: cfg.siteUrl
  });
}

function apexModifiedVehicleProtectionDocumentsEmailHTML_(args) {
  args = args || {};
  var cfg = apexEmailConfig_();
  var name = apexDisplay_(args.name, 'Customer');
  var summary = args.summary || {};
  var coveredBuildValue = summary.coveredBuildValue || summary.declaredValue || summary.partsValue || summary.buildValue;
  var rows = [
    ['Plan Number', summary.policyNumber, 'Pending confirmation'],
    ['Effective Date', summary.effectiveDate, 'Pending confirmation'],
    ['Covered Vehicle', summary.vehicles, 'Vehicle schedule on file'],
    ['Protection', summary.coverage, 'Modified Vehicle Protection'],
    ['Covered Build Value', coveredBuildValue, 'See attached documents'],
    ['Deductible', summary.deductibles, 'See attached documents']
  ];

  var body = ''
    + '<p style="margin:0;color:#334155;font-size:15px;line-height:1.65;">'
    + 'Hi ' + apexHtmlEsc_(name) + ', welcome to Apex Coverage. Your Modified Vehicle Protection documents are attached to this email for your records.'
    + '</p>'
    + apexPanel_('Protection summary', '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + apexEmailRows_(rows) + '</table>')
    + apexPanel_('Attached', apexBulletList_([
      'Your official Modified Vehicle Protection packet.',
      'Covered build schedule and plan details.',
      'Proof of protection for your records.'
    ]))
    + '<p style="margin:18px 0 0;color:#475569;font-size:14px;line-height:1.6;">'
    + 'If you need to update build details, add documentation, or ask a coverage question, simply reply to this email. For immediate assistance, call ' + apexHtmlEsc_(cfg.supportPhone) + '.'
    + '</p>';

  return apexEmailShell_({
    eyebrow: 'Modified Vehicle Protection',
    title: 'Your protection documents are ready.',
    preheader: 'Your Apex Modified Vehicle Protection documents are attached.',
    intro: 'Your plan documents, covered build details, and proof of protection are attached.',
    bodyHtml: body,
    ctaLabel: 'Visit Apex Coverage',
    ctaUrl: cfg.siteUrl
  });
}

function apexPreviewText_(title) {
  var cfg = apexEmailConfig_();
  return title + '\n\nThis is a preview of the redesigned Apex Coverage email template.\n\n' +
    'Apex Coverage\n' + cfg.supportEmail + '\n' + cfg.siteUrl + '\n';
}

function sendApexEmailPreviewSet(to) {
  var recipient = apexSafeString_(to).trim();
  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    throw new Error('Pass a valid review email address, for example sendApexEmailPreviewSet("name@example.com").');
  }

  var cfg = apexEmailConfig_();
  var previewTimestamp = typeof nowEtString_ === 'function'
    ? nowEtString_()
    : new Date().toLocaleString();
  var sampleQuote = {
    name: 'Jordan Miles',
    email: 'jordan@example.com',
    phone: '844-398-2739',
    zip: '23220',
    dob: '01/15/1998',
    vehicle: '2024 Ford Mustang GT',
    consent: 'true',
    when: previewTimestamp
  };
  var sampleClaim = {
    name: 'Jordan Miles',
    email: 'jordan@example.com',
    phone: '844-398-2739',
    policy: 'APX-3213260326-09',
    dateOfLoss: '09/24/2026',
    timeOfLoss: '8:45 AM',
    location: 'Richmond, VA',
    vehicle: '2024 Ford Mustang GT',
    lossType: 'Collision',
    policeReport: 'Pending',
    preferredContact: 'Phone',
    photoUrls: 'Photos uploaded',
    description: 'Customer reported front bumper and wheel damage.',
    source: 'Website',
    whenStr: previewTimestamp
  };
  var sampleBuild = {
    name: 'Jordan Miles',
    email: 'jordan@example.com',
    phone: '844-398-2739',
    zip: '23220',
    dob: '01/15/1998',
    vehicle: '2024 Ford Mustang GT',
    vin: '1FA6P8CF0R5000000',
    mileage: '12,400',
    annualMileage: 'Under 5,000',
    titleStatus: 'Clean',
    vehicleUse: 'Street driven',
    tierInterest: 'Apex Build Tier',
    deductible: '$1,000',
    partsValue: '$18,500',
    professionalInstallStatus: 'Mixed professional and DIY',
    documentation: 'Receipts, photos, invoices',
    drivingHistory: 'Clean',
    claimHistory: 'None',
    autoInsuranceReview: 'Yes',
    partsList: 'Wheels, suspension, exhaust, tune',
    installerInfo: 'Apex Performance Garage',
    discountNotes: 'Garage-kept, anti-theft'
  };
  var samplePolicy = {
    name: 'Jordan Miles',
    documentType: 'auto',
    documentLabel: 'auto coverage packet',
    summary: {
      policyNumber: 'APX-3213260326-09',
      effectiveDate: '09/24/2026',
      vehicles: '2024 Ford Mustang GT',
      coverage: 'Full Coverage',
      deductibles: 'Comp 500 / Collision 1000'
    }
  };
  var sampleMvpPolicy = {
    name: 'Jordan Miles',
    documentType: 'build',
    documentLabel: 'Modified Vehicle Protection packet',
    summary: {
      policyNumber: 'MVP-3213260326-09',
      effectiveDate: '09/24/2026',
      vehicles: '2024 Ford Mustang GT',
      coverage: 'Apex Build Tier',
      coveredBuildValue: '$18,500',
      deductibles: '$1,000'
    }
  };

  var previews = [
    ['Auto coverage customer confirmation', customerEmailHTML(sampleQuote)],
    ['Auto coverage internal lead alert', internalEmailHTML(sampleQuote)],
    ['Claim customer confirmation', claimCustomerHTML(sampleClaim)],
    ['Claim internal alert', claimInternalHTML(sampleClaim)],
    ['Build review customer confirmation', buildReviewCustomerHTML(sampleBuild)],
    ['Build review internal alert', buildReviewInternalHTML(sampleBuild)],
    ['Auto policy documents customer email', apexPolicyDocumentsEmailHTML_(samplePolicy)],
    ['Modified Vehicle Protection documents customer email', apexPolicyDocumentsEmailHTML_(sampleMvpPolicy)]
  ];

  previews.forEach(function (preview) {
    GmailApp.sendEmail(recipient, '[Apex Email Preview] ' + preview[0], apexPreviewText_(preview[0]), {
      htmlBody: preview[1],
      replyTo: cfg.supportEmail,
      name: 'Apex Coverage Preview'
    });
  });

  return { ok: true, to: recipient, sent: previews.length };
}

/** ===================== AGENT API HELPERS ===================== **/

function agentAppendActivityLog_(sheet, id, message, ensureCol1) {
  if (!sheet || !id || id < 2 || !message) return;

  var activityCol1 = ensureCol1("Activity Log");
  var existing = String(sheet.getRange(id, activityCol1).getValue() || "").trim();
  var nextLine = nowEtString_() + " - " + String(message).trim();
  var combined = existing ? (nextLine + "\n" + existing) : nextLine;

  sheet.getRange(id, activityCol1).setValue(combined);
}

function getPaymentsSheet_() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(PAYMENTS_TAB) || ss.insertSheet(PAYMENTS_TAB);

  if (sh.getLastRow() === 0) {
    sh.appendRow([
      "Timestamp",
      "Lead ID",
      "Customer Name",
      "Stripe Customer ID",
      "Stripe Subscription ID",
      "Stripe Invoice ID",
      "Stripe Payment Intent ID",
      "Amount",
      "Currency",
      "Method",
      "Status",
      "Receipt URL",
      "Event Type"
    ]);
  }

  return sh;
}

function agentAppendPaymentHistory_(entry) {
  var sh = getPaymentsSheet_();

  sh.appendRow([
    entry.timestamp || nowEtIsoString_(),
    entry.leadId || "",
    entry.customerName || "",
    entry.stripeCustomerId || "",
    entry.stripeSubscriptionId || "",
    entry.stripeInvoiceId || "",
    entry.stripePaymentIntentId || "",
    entry.amount || "",
    entry.currency || "",
    entry.method || "",
    entry.status || "",
    entry.receiptUrl || "",
    entry.eventType || ""
  ]);

  return { ok: true };
}

function agentListPaymentsForLead_(leadId) {
  if (!leadId && leadId !== 0) {
    return { ok: false, error: "Missing leadId", rows: [] };
  }

  var sh = SpreadsheetApp.getActive().getSheetByName(PAYMENTS_TAB);
  if (!sh || sh.getLastRow() < 2) {
    return { ok: true, rows: [] };
  }

  var vals = sh.getDataRange().getValues();
  var target = String(leadId);
  var rows = [];

  for (var r = vals.length - 1; r >= 1; r--) {
    var row = vals[r];
    if (String(row[1]) !== target) continue;

    rows.push({
      timestamp: safeString_(row[0]),
      leadId: safeString_(row[1]),
      customerName: safeString_(row[2]),
      stripeCustomerId: safeString_(row[3]),
      stripeSubscriptionId: safeString_(row[4]),
      stripeInvoiceId: safeString_(row[5]),
      stripePaymentIntentId: safeString_(row[6]),
      amount: safeString_(row[7]),
      currency: safeString_(row[8]),
      method: safeString_(row[9]),
      status: safeString_(row[10]),
      receiptUrl: safeString_(row[11]),
      eventType: safeString_(row[12])
    });
  }

  return { ok: true, rows: rows };
}

// ✅ UPDATED: includes Policy + Coverage / Deductibles / Discounts / Renewal Date / Vehicles support
// ✅ UPDATED: includes Stripe billing fields (via stripe.gs helpers)
// ✅ UPDATED: includes Monthly Premium
// ✅ UPDATED: includes Activity Log
function agentListLeads_() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(AGENT_LEADS_SHEET);
  if (!sh) return { ok: true, rows: [] };

  const lastCol = sh.getLastColumn();
  if (lastCol < 1) return { ok: true, rows: [] };

  const headerRange = sh.getRange(1, 1, 1, lastCol);
  let headerRaw = headerRange.getValues()[0];

  const norm = (v) => String(v || "").trim().toLowerCase();
  let headerNorm = headerRaw.map(norm);

  const ensureCol = (displayName) => {
    const key = norm(displayName);
    let idx = headerNorm.indexOf(key);
    if (idx === -1) {
      sh.getRange(1, sh.getLastColumn() + 1).setValue(displayName);

      const newLastCol = sh.getLastColumn();
      headerRaw = sh.getRange(1, 1, 1, newLastCol).getValues()[0];
      headerNorm = headerRaw.map(norm);
      idx = headerNorm.indexOf(key);
    }
    return idx;
  };

  const statusCol = ensureCol("Status");
  const agentCol = ensureCol("Agent");
  const policyCol = ensureCol("Policy Number");

  const coverageCol = ensureCol("Coverage");
  const deductiblesCol = ensureCol("Deductibles");
  const discountsCol = ensureCol("Discounts");
  const renewalDateCol = ensureCol("Renewal Date");
  const vehiclesCol = ensureCol("Vehicles");
  const monthlyPremiumCol = ensureCol("Monthly Premium");
  const activityLogCol = ensureCol("Activity Log");

  const stripeCustomerIdCol = ensureCol("Stripe Customer ID");
  const stripeSubscriptionIdCol = ensureCol("Stripe Subscription ID");
  const billingStatusCol = ensureCol("Billing Status");
  const lastInvoiceStatusCol = ensureCol("Last Invoice Status");
  const lastPaymentDateCol = ensureCol("Last Payment Date");
  const stripeModeCol = ensureCol("Stripe Mode");

  const vals = sh.getDataRange().getValues();
  if (vals.length < 2) return { ok: true, rows: [] };

  const rows = [];
  for (let r = 2; r <= vals.length; r++) {
    const row = vals[r - 1];
    rows.push({
      id: r,
      when:
        row[0] instanceof Date
          ? Utilities.formatDate(row[0], "America/New_York", "yyyy-MM-dd HH:mm")
          : String(row[0] || ""),
      name: String(row[1] || ""),
      email: String(row[2] || ""),
      phone: String(row[3] || ""),
      zip: String(row[4] || ""),
      dob: String(row[5] || ""),
      year: String(row[6] || ""),
      make: String(row[7] || ""),
      model: String(row[8] || ""),
      consent: String(row[9] || ""),

      status: String(row[statusCol] || ""),
      agent: String(row[agentCol] || ""),
      policyNumber: String(row[policyCol] || ""),

      coverage: String(row[coverageCol] || ""),
      deductibles: String(row[deductiblesCol] || ""),
      discounts: String(row[discountsCol] || ""),
      renewalDate: String(row[renewalDateCol] || ""),
      vehicles: String(row[vehiclesCol] || ""),
      monthlyPremium: String(row[monthlyPremiumCol] || ""),
      activityLog: String(row[activityLogCol] || ""),

      stripeCustomerId: String(row[stripeCustomerIdCol] || ""),
      stripeSubscriptionId: String(row[stripeSubscriptionIdCol] || ""),
      billingStatus: String(row[billingStatusCol] || ""),
      lastInvoiceStatus: String(row[lastInvoiceStatusCol] || ""),
      lastPaymentDate: String(row[lastPaymentDateCol] || ""),
      stripeMode: String(row[stripeModeCol] || ""),
    });
  }

  return { ok: true, rows };
}

// ✅ UPDATED: writes Policy + Coverage / Deductibles / Discounts / Renewal Date / Vehicles if provided
// ✅ UPDATED: writes Monthly Premium
// ✅ UPDATED: delegates Stripe billing fields to stripe.gs
// ✅ UPDATED: writes Activity Log when activityNote provided in patch
function agentUpdateLead_(id, patch) {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(AGENT_LEADS_SHEET);
  if (!sh) return { ok: false, error: "Missing Leads sheet" };
  if (!id || id < 2) return { ok: false, error: "Invalid id" };

  const lastCol = sh.getLastColumn();
  if (lastCol < 1) return { ok: false, error: "Leads sheet has no columns" };

  const headerRange = sh.getRange(1, 1, 1, lastCol);
  let headerRaw = headerRange.getValues()[0];

  const norm = (v) => String(v || "").trim().toLowerCase();
  let headerNorm = headerRaw.map(norm);

  const ensureCol1 = (displayName) => {
    const key = norm(displayName);
    let idx0 = headerNorm.indexOf(key);
    if (idx0 === -1) {
      sh.getRange(1, sh.getLastColumn() + 1).setValue(displayName);

      const newLastCol = sh.getLastColumn();
      headerRaw = sh.getRange(1, 1, 1, newLastCol).getValues()[0];
      headerNorm = headerRaw.map(norm);
      idx0 = headerNorm.indexOf(key);
    }
    return idx0 + 1;
  };

  const statusCol1 = ensureCol1("Status");
  const agentCol1 = ensureCol1("Agent");
  const policyCol1 = ensureCol1("Policy Number");

  const coverageCol1 = ensureCol1("Coverage");
  const deductiblesCol1 = ensureCol1("Deductibles");
  const discountsCol1 = ensureCol1("Discounts");
  const renewalDateCol1 = ensureCol1("Renewal Date");
  const vehiclesCol1 = ensureCol1("Vehicles");
  const monthlyPremiumCol1 = ensureCol1("Monthly Premium");

  const map = {
    name: 2,
    email: 3,
    phone: 4,
    zip: 5,
    dob: 6,
    year: 7,
    make: 8,
    model: 9,
    consent: 10,

    status: statusCol1,
    agent: agentCol1,
    policynumber: policyCol1,
    coverage: coverageCol1,
    deductibles: deductiblesCol1,
    discounts: discountsCol1,
    renewaldate: renewalDateCol1,
    vehicles: vehiclesCol1,
    monthlypremium: monthlyPremiumCol1,
  };

  Object.keys(patch || {}).forEach(function (k) {
    const key = norm(k);
    const col = map[key];
    if (col) sh.getRange(id, col).setValue(patch[k]);
  });

  if (
    patch &&
    Object.prototype.hasOwnProperty.call(patch, "status")
  ) {
    apexApplyLeadFollowUpSuppression_(sh, id, patch.status, ensureCol1);
  }

  try {
    if (stripePatchHasKeys_ && stripeApplyPatch_ && stripePatchHasKeys_(patch)) {
      stripeApplyPatch_(sh, id, patch, ensureCol1);
    }
  } catch (e) {
    logRow("stripeApplyPatchError", { id: id, err: String(e), patch: patch });
  }

  if (patch && patch.activityNote) {
    agentAppendActivityLog_(sh, id, patch.activityNote, ensureCol1);
  }

  logRow("agentUpdateLead", { id: id, patch: patch });

  return { ok: true };
}

function agentDeleteLead_(id) {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(AGENT_LEADS_SHEET);
  if (!sh) return { ok: false, error: "Missing Leads sheet" };
  if (!id || id < 2) return { ok: false, error: "Invalid id" };
  if (id > sh.getLastRow()) return { ok: false, error: "Lead row not found" };

  sh.deleteRow(Number(id));
  logRow("agentDeleteLead", { id: id });
  return { ok: true };
}

function agentListBuildReviews_() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(BUILD_REVIEWS_TAB);
  if (!sh) return { ok: true, rows: [] };

  let lastCol = sh.getLastColumn();
  if (lastCol < 1) return { ok: true, rows: [] };

  let headerRaw = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  const norm = (v) => String(v || "").trim().toLowerCase();
  let headerNorm = headerRaw.map(norm);

  const ensureCol = (displayName) => {
    const key = norm(displayName);
    let idx = headerNorm.indexOf(key);
    if (idx === -1) {
      sh.getRange(1, sh.getLastColumn() + 1).setValue(displayName);
      lastCol = sh.getLastColumn();
      headerRaw = sh.getRange(1, 1, 1, lastCol).getValues()[0];
      headerNorm = headerRaw.map(norm);
      idx = headerNorm.indexOf(key);
    }
    return idx;
  };

  const colAny = (names) => {
    for (var i = 0; i < names.length; i++) {
      var idx = headerNorm.indexOf(norm(names[i]));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const statusCol = ensureCol("Status");
  const agentCol = ensureCol("Agent");
  const activityLogCol = ensureCol("Activity Log");

  const idx = {
    timestamp: colAny(["Timestamp"]),
    submissionType: colAny(["Submission Type"]),
    name: colAny(["Name"]),
    email: colAny(["Email"]),
    phone: colAny(["Phone"]),
    zip: colAny(["ZIP"]),
    dob: colAny(["DOB"]),
    year: colAny(["Vehicle Year", "Year"]),
    make: colAny(["Make"]),
    model: colAny(["Model"]),
    vin: colAny(["VIN"]),
    mileage: colAny(["Current Mileage", "Mileage"]),
    annualMileage: colAny(["Annual Mileage"]),
    titleStatus: colAny(["Title Status"]),
    vehicleUse: colAny(["Vehicle Use"]),
    partsList: colAny(["Parts List"]),
    partsValue: colAny(["Parts Value", "Estimated Parts Value"]),
    professionalInstallStatus: colAny(["Professional Install Status"]),
    installerInfo: colAny(["Shop / Installer Info", "Installer Info"]),
    documentation: colAny(["Documentation", "Documentation Available"]),
    tierInterest: colAny(["Tier Interest"]),
    deductible: colAny(["Preferred Deductible", "Deductible"]),
    drivingHistory: colAny(["Driving History"]),
    claimHistory: colAny(["Claim History"]),
    discountNotes: colAny(["Discount Notes"]),
    autoInsuranceReview: colAny(["Auto Coverage Review", "Auto Insurance Review"]),
    consent: colAny(["Consent"]),
    source: colAny(["Source"])
  };

  const vals = sh.getDataRange().getValues();
  if (vals.length < 2) return { ok: true, rows: [] };

  const read = (row, key) => {
    const col = idx[key];
    return col === -1 ? "" : safeString_(row[col]);
  };

  const rows = [];
  for (let r = 2; r <= vals.length; r++) {
    const row = vals[r - 1];
    const name = read(row, "name");
    const email = read(row, "email");
    const vin = read(row, "vin");
    const partsList = read(row, "partsList");

    if (!name && !email && !vin && !partsList) continue;

    rows.push({
      id: r,
      when:
        idx.timestamp !== -1 && row[idx.timestamp] instanceof Date
          ? Utilities.formatDate(row[idx.timestamp], "America/New_York", "yyyy-MM-dd HH:mm")
          : read(row, "timestamp"),
      submissionType: read(row, "submissionType") || "build-review",
      name: name,
      email: email,
      phone: read(row, "phone"),
      zip: read(row, "zip"),
      dob: read(row, "dob"),
      year: read(row, "year"),
      make: read(row, "make"),
      model: read(row, "model"),
      vin: vin,
      mileage: read(row, "mileage"),
      annualMileage: read(row, "annualMileage"),
      titleStatus: read(row, "titleStatus"),
      vehicleUse: read(row, "vehicleUse"),
      partsList: partsList,
      partsValue: read(row, "partsValue"),
      professionalInstallStatus: read(row, "professionalInstallStatus"),
      installerInfo: read(row, "installerInfo"),
      documentation: read(row, "documentation"),
      tierInterest: read(row, "tierInterest"),
      deductible: read(row, "deductible"),
      drivingHistory: read(row, "drivingHistory"),
      claimHistory: read(row, "claimHistory"),
      discountNotes: read(row, "discountNotes"),
      autoInsuranceReview: read(row, "autoInsuranceReview"),
      consent: read(row, "consent"),
      status: safeString_(row[statusCol]),
      agent: safeString_(row[agentCol]),
      source: read(row, "source"),
      activityLog: safeString_(row[activityLogCol])
    });
  }

  return { ok: true, rows: rows };
}

function agentUpdateBuildReview_(id, patch) {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(BUILD_REVIEWS_TAB);
  if (!sh) return { ok: false, error: "Missing Build Reviews sheet" };
  if (!id || id < 2) return { ok: false, error: "Invalid id" };

  const lastCol = sh.getLastColumn();
  if (lastCol < 1) return { ok: false, error: "Build Reviews sheet has no columns" };

  let headerRaw = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  const norm = (v) => String(v || "").trim().toLowerCase();
  let headerNorm = headerRaw.map(norm);

  const ensureCol1 = (displayName) => {
    const key = norm(displayName);
    let idx0 = headerNorm.indexOf(key);
    if (idx0 === -1) {
      sh.getRange(1, sh.getLastColumn() + 1).setValue(displayName);
      const newLastCol = sh.getLastColumn();
      headerRaw = sh.getRange(1, 1, 1, newLastCol).getValues()[0];
      headerNorm = headerRaw.map(norm);
      idx0 = headerNorm.indexOf(key);
    }
    return idx0 + 1;
  };
  const ensureCol1Any = (displayName, aliases) => {
    for (var aliasIdx = 0; aliasIdx < aliases.length; aliasIdx++) {
      var foundIdx0 = headerNorm.indexOf(norm(aliases[aliasIdx]));
      if (foundIdx0 !== -1) return foundIdx0 + 1;
    }
    return ensureCol1(displayName);
  };

  const map = {
    status: ensureCol1("Status"),
    agent: ensureCol1("Agent"),
    name: ensureCol1("Name"),
    email: ensureCol1("Email"),
    phone: ensureCol1("Phone"),
    zip: ensureCol1("ZIP"),
    dob: ensureCol1("DOB"),
    year: ensureCol1("Vehicle Year"),
    vehicleyear: ensureCol1("Vehicle Year"),
    make: ensureCol1("Make"),
    model: ensureCol1("Model"),
    vin: ensureCol1("VIN"),
    mileage: ensureCol1("Current Mileage"),
    currentmileage: ensureCol1("Current Mileage"),
    annualmileage: ensureCol1("Annual Mileage"),
    titlestatus: ensureCol1("Title Status"),
    vehicleuse: ensureCol1("Vehicle Use"),
    partslist: ensureCol1("Parts List"),
    partsvalue: ensureCol1("Parts Value"),
    professionalinstallstatus: ensureCol1("Professional Install Status"),
    installerinfo: ensureCol1("Shop / Installer Info"),
    shopinstallerinfo: ensureCol1("Shop / Installer Info"),
    documentation: ensureCol1("Documentation"),
    tierinterest: ensureCol1("Tier Interest"),
    deductible: ensureCol1("Preferred Deductible"),
    preferreddeductible: ensureCol1("Preferred Deductible"),
    drivinghistory: ensureCol1("Driving History"),
    claimhistory: ensureCol1("Claim History"),
    discountnotes: ensureCol1("Discount Notes"),
    autoinsurancereview: ensureCol1Any("Auto Coverage Review", ["Auto Coverage Review", "Auto Insurance Review"]),
    autocoveragereview: ensureCol1Any("Auto Coverage Review", ["Auto Coverage Review", "Auto Insurance Review"]),
    consent: ensureCol1("Consent"),
    source: ensureCol1("Source")
  };

  Object.keys(patch || {}).forEach(function (k) {
    const key = norm(k);
    const col = map[key];
    if (col) sh.getRange(id, col).setValue(patch[k]);
  });

  if (patch && patch.activityNote) {
    agentAppendActivityLog_(sh, id, patch.activityNote, ensureCol1);
  }

  logRow("agentUpdateBuildReview", { id: id, patch: patch });

  return { ok: true };
}

function agentDeleteBuildReview_(id) {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(BUILD_REVIEWS_TAB);
  if (!sh) return { ok: false, error: "Missing Build Reviews sheet" };
  if (!id || id < 2) return { ok: false, error: "Invalid id" };
  if (id > sh.getLastRow()) return { ok: false, error: "Build review row not found" };

  sh.deleteRow(Number(id));
  logRow("agentDeleteBuildReview", { id: id });
  return { ok: true };
}

function agentGeneratePolicyNumber_(id) {
  var now = new Date();
  var mm = Utilities.formatDate(now, "America/New_York", "MM");
  var yy = Utilities.formatDate(now, "America/New_York", "yy");
  var formattedId = String(id || "").padStart(2, "0");
  return "APX-321326" + mm + yy + "-" + formattedId;
}

function agentCreateBuildFromAuto_(autoLeadId) {
  var leadId = Number(autoLeadId);
  if (!leadId || leadId < 2) return { ok: false, error: "Invalid autoLeadId" };

  var leadsOut = agentListLeads_();
  if (!leadsOut.ok) return leadsOut;

  var lead = null;
  for (var i = 0; i < leadsOut.rows.length; i++) {
    if (Number(leadsOut.rows[i].id) === leadId) {
      lead = leadsOut.rows[i];
      break;
    }
  }

  if (!lead) return { ok: false, error: "Auto lead not found" };

  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(BUILD_REVIEWS_TAB) || ss.insertSheet(BUILD_REVIEWS_TAB);
  var headers = [
    "Timestamp",
    "Submission Type",
    "Name",
    "Email",
    "Phone",
    "ZIP",
    "DOB",
    "Vehicle Year",
    "Make",
    "Model",
    "VIN",
    "Current Mileage",
    "Annual Mileage",
    "Title Status",
    "Vehicle Use",
    "Parts List",
    "Parts Value",
    "Professional Install Status",
    "Shop / Installer Info",
    "Documentation",
    "Tier Interest",
    "Preferred Deductible",
    "Driving History",
    "Claim History",
    "Discount Notes",
    "Auto Coverage Review",
    "Consent",
    "Status",
    "Agent",
    "Source",
    "Activity Log"
  ];

  if (sh.getLastRow() === 0) {
    sh.appendRow(headers);
  } else {
    var existingHeaders = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function (h) {
      return String(h || "").trim();
    });
    headers.forEach(function (header) {
      if (existingHeaders.indexOf(header) === -1) {
        sh.getRange(1, sh.getLastColumn() + 1).setValue(header);
        existingHeaders.push(header);
      }
    });
  }

  var liveHeaders = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function (h) {
    return String(h || "").trim();
  });

  var valuesByHeader = {
    "Timestamp": new Date(),
    "Submission Type": "agent-created-build",
    "Name": lead.name || "",
    "Email": lead.email || "",
    "Phone": lead.phone || "",
    "ZIP": lead.zip || "",
    "DOB": lead.dob || "",
    "Vehicle Year": lead.year || "",
    "Make": lead.make || "",
    "Model": lead.model || "",
    "Auto Coverage Review": "yes",
    "Auto Insurance Review": "yes",
    "Consent": lead.consent || "",
    "Status": "Active",
    "Agent": lead.agent || "",
    "Source": "agent-dashboard-auto-to-build",
    "Activity Log": nowEtString_() + " - Build coverage customer created by agent from auto review"
  };

  sh.appendRow(liveHeaders.map(function (header) {
    return Object.prototype.hasOwnProperty.call(valuesByHeader, header)
      ? valuesByHeader[header]
      : "";
  }));

  var newId = sh.getLastRow();
  agentAppendActivityLog_(
    SpreadsheetApp.getActive().getSheetByName(AGENT_LEADS_SHEET),
    leadId,
    "Build coverage customer added from auto review",
    function (displayName) {
      var leadSheet = SpreadsheetApp.getActive().getSheetByName(AGENT_LEADS_SHEET);
      var headerRaw = leadSheet.getRange(1, 1, 1, leadSheet.getLastColumn()).getValues()[0];
      var headerNorm = headerRaw.map(function (h) { return String(h || "").trim().toLowerCase(); });
      var key = String(displayName || "").trim().toLowerCase();
      var idx0 = headerNorm.indexOf(key);
      if (idx0 === -1) {
        leadSheet.getRange(1, leadSheet.getLastColumn() + 1).setValue(displayName);
        return leadSheet.getLastColumn();
      }
      return idx0 + 1;
    }
  );

  logRow("agentCreateBuildFromAuto", { autoLeadId: leadId, buildReviewId: newId });
  return { ok: true, id: newId };
}

function agentCreateAutoFromBuild_(buildReviewId) {
  var reviewId = Number(buildReviewId);
  if (!reviewId || reviewId < 2) return { ok: false, error: "Invalid buildReviewId" };

  var buildOut = agentListBuildReviews_();
  if (!buildOut.ok) return buildOut;

  var review = null;
  for (var i = 0; i < buildOut.rows.length; i++) {
    if (Number(buildOut.rows[i].id) === reviewId) {
      review = buildOut.rows[i];
      break;
    }
  }

  if (!review) return { ok: false, error: "Build review not found" };

  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(AGENT_LEADS_SHEET) || ss.insertSheet(AGENT_LEADS_SHEET);
  sh.appendRow([
    new Date(),
    review.name || "",
    review.email || "",
    review.phone || "",
    review.zip || "",
    review.dob || "",
    review.year || "",
    review.make || "",
    review.model || "",
    review.consent || ""
  ]);

  var newId = sh.getLastRow();
  agentUpdateLead_(newId, {
    status: "Won",
    agent: review.agent || "",
    policyNumber: agentGeneratePolicyNumber_(newId),
    vehicles: [review.year, review.make, review.model].filter(Boolean).join(" "),
    activityNote: "Auto coverage customer created by agent from build review"
  });

  agentUpdateBuildReview_(reviewId, {
    autoInsuranceReview: "yes",
    activityNote: "Auto coverage customer added from build review"
  });

  logRow("agentCreateAutoFromBuild", { buildReviewId: reviewId, autoLeadId: newId });
  return { ok: true, id: newId };
}

/** NEW: save worksheet into Worksheets tab **/
function agentSaveWorksheet_(payload) {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(WORKSHEETS_TAB) || ss.insertSheet(WORKSHEETS_TAB);

  if (sh.getLastRow() === 0) {
    sh.appendRow([
      'Timestamp',
      'Lead Sheet Row',
      'Lead Id',
      'Agent',
      'Status',
      'Name',
      'Email',
      'Phone',
      'ZIP',
      'DOB',
      'Year',
      'Make',
      'Model',
      'Vehicle',
      'Coverage Package',
      'Liability',
      'Comp Ded',
      'Coll Ded',
      'Discounts',
      'Notes'
    ]);
  }

  const discountsJoined = (payload.discounts || []).join(', ');

  sh.appendRow([
    new Date(),
    payload.leadSheetRow || payload.leadId || '',
    payload.leadId || '',
    payload.agent || '',
    payload.status || '',
    payload.name || '',
    payload.email || '',
    payload.phone || '',
    payload.zip || '',
    payload.dob || '',
    payload.year || '',
    payload.make || '',
    payload.model || '',
    payload.vehicle || '',
    payload.coveragePackage || '',
    payload.liability || '',
    payload.compDed || '',
    payload.collDed || '',
    discountsJoined,
    payload.notes || ''
  ]);

  logRow('worksheetSaved', { leadId: payload.leadId, row: sh.getLastRow() });
  return { ok: true };
}

/** NEW: load latest worksheet for a lead from Worksheets tab **/
function agentLoadWorksheet_(leadId) {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(WORKSHEETS_TAB);
  if (!sh) {
    return { ok: true, worksheet: null };
  }

  if (!leadId && leadId !== 0) {
    return { ok: false, error: 'Missing leadId' };
  }

  const vals = sh.getDataRange().getValues();
  if (vals.length < 2) {
    return { ok: true, worksheet: null };
  }

  const targetId = String(leadId);
  let found = null;

  for (let r = vals.length - 1; r >= 1; r--) {
    const row = vals[r];
    const rowLeadId = row[2];

    if (String(rowLeadId) === targetId) {
      const discountsRaw = row[18] || '';
      const discountsArr = String(discountsRaw)
        .split(/\s*,\s*/)
        .filter(function (s) { return s; });

      found = {
        leadId: rowLeadId,
        agent: row[3] || '',
        status: row[4] || '',
        name: row[5] || '',
        email: row[6] || '',
        phone: row[7] || '',
        zip: row[8] || '',
        dob: row[9] || '',
        year: row[10] || '',
        make: row[11] || '',
        model: row[12] || '',
        vehicle: row[13] || '',
        coveragePackage: row[14] || '',
        liability: row[15] || '',
        compDed: row[16] || '',
        collDed: row[17] || '',
        discounts: discountsArr,
        notes: row[19] || ''
      };
      break;
    }
  }

  logRow('worksheetLoaded', { leadId: leadId, found: !!found });
  return { ok: true, worksheet: found };
}

/**
 * Apex Coverage - PDF packet email support
 *
 * Paste this into Code.gs, then add "sendcoveragepdf" to the secure agent
 * action list inside doPost and route it to agentSendCoveragePdf_(body).
 */

function coveragePdfEmailHtml_(args) {
  if (typeof apexPolicyDocumentsEmailHTML_ === 'function') {
    return apexPolicyDocumentsEmailHTML_(args);
  }

  args = args || {};
  var name = args.name || 'Customer';
  var summary = args.summary || {};
  var documentType = String(args.documentType || '').toLowerCase();
  var documentLabel = String(args.documentLabel || '');
  var isBuildDocument = documentType === 'build' || /modified|protection/i.test(documentLabel);
  var siteUrl = typeof SITE_URL !== 'undefined'
    ? SITE_URL
    : 'https://www.driveapexcoverage.com';
  var supportEmail = 'support@driveapexcoverage.com';
  var supportPhone = '844-398-2739';
  var logoUrl = 'https://www.driveapexcoverage.com/Apex_Shield_Email.png';
  var headline = isBuildDocument
    ? 'Your protection documents are ready.'
    : 'Your coverage is active.';
  var eyebrow = isBuildDocument
    ? 'Modified Vehicle Protection'
    : 'Coverage documents';
  var intro = isBuildDocument
    ? 'Your plan documents, covered build details, and proof of protection are attached.'
    : 'Your policy documents and proof of coverage are attached.';
  var summaryTitle = isBuildDocument ? 'Protection summary' : 'Coverage summary';
  var numberLabel = isBuildDocument ? 'Plan Number' : 'Policy / Plan Number';
  var coverageLabel = isBuildDocument ? 'Protection' : 'Coverage';
  var coverageFallback = isBuildDocument ? 'Modified Vehicle Protection' : 'Coverage on file';

  return ''
    + '<div style="font-family:Segoe UI,Roboto,Arial,sans-serif;line-height:1.6;color:#0f172a;background:#eef5ff;padding:28px 12px;">'
    + '<div style="max-width:680px;margin:auto;background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 18px 50px rgba(15,23,42,.16);">'
    + '<div style="background:linear-gradient(135deg,#071225 0%,#0b2b55 58%,#0b63ff 100%);padding:28px 26px 30px;">'
    + '<div style="color:#93c5fd;font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;margin-bottom:10px;">' + esc(eyebrow) + '</div>'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>'
    + '<td valign="top" style="padding-right:18px;">'
    + '<h1 style="margin:0;color:#ffffff;font-size:30px;line-height:1.08;font-weight:900;">' + esc(headline) + '</h1>'
    + '<p style="margin:14px 0 0;color:#dbeafe;font-size:15px;line-height:1.6;">' + esc(intro) + '</p>'
    + '<p style="margin:16px 0 0;color:#bfdbfe;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;">' + esc(supportPhone) + '</p>'
    + '</td>'
    + '<td width="68" valign="top" align="right" style="padding:2px 0 0 14px;">'
    + '<img src="' + esc(logoUrl) + '" alt="Apex Coverage" width="58" style="display:block;width:58px;max-width:58px;height:auto;border:0;" />'
    + '</td>'
    + '</tr></table>'
    + '</div>'
    + '<div style="padding:28px 26px;">'
    + '<p style="margin:0;color:#334155;font-size:15px;line-height:1.65;">Hi ' + esc(name) + ', welcome to Apex Coverage. ' + esc(intro) + '</p>'
    + '<div style="margin-top:18px;border:1px solid #dbeafe;background:#f8fbff;border-radius:16px;padding:18px;">'
    + '<div style="font-size:13px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#2563eb;margin-bottom:10px;">' + esc(summaryTitle) + '</div>'
    + '<table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;font-size:14px;">'
    + '<tr><td style="padding:10px 0;border-bottom:1px solid #e7eef8;color:#64748b;font-weight:700;width:38%;">' + esc(numberLabel) + '</td><td style="padding:10px 0;border-bottom:1px solid #e7eef8;color:#0f172a;font-weight:700;">' + esc(summary.policyNumber || 'Pending confirmation') + '</td></tr>'
    + '<tr><td style="padding:10px 0;border-bottom:1px solid #e7eef8;color:#64748b;font-weight:700;">Effective Date</td><td style="padding:10px 0;border-bottom:1px solid #e7eef8;color:#0f172a;font-weight:700;">' + esc(summary.effectiveDate || 'Pending confirmation') + '</td></tr>'
    + '<tr><td style="padding:10px 0;border-bottom:1px solid #e7eef8;color:#64748b;font-weight:700;">Vehicle(s)</td><td style="padding:10px 0;border-bottom:1px solid #e7eef8;color:#0f172a;font-weight:700;">' + esc(summary.vehicles || 'Vehicle schedule on file') + '</td></tr>'
    + '<tr><td style="padding:10px 0;border-bottom:1px solid #e7eef8;color:#64748b;font-weight:700;">' + esc(coverageLabel) + '</td><td style="padding:10px 0;border-bottom:1px solid #e7eef8;color:#0f172a;font-weight:700;">' + esc(summary.coverage || coverageFallback) + '</td></tr>'
    + (isBuildDocument ? '<tr><td style="padding:10px 0;border-bottom:1px solid #e7eef8;color:#64748b;font-weight:700;">Covered Build Value</td><td style="padding:10px 0;border-bottom:1px solid #e7eef8;color:#0f172a;font-weight:700;">' + esc(summary.coveredBuildValue || summary.declaredValue || summary.partsValue || summary.buildValue || 'See attached documents') + '</td></tr>' : '')
    + '<tr><td style="padding:10px 0;color:#64748b;font-weight:700;">Deductibles</td><td style="padding:10px 0;color:#0f172a;font-weight:700;">' + esc(summary.deductibles || 'See attached documents') + '</td></tr>'
    + '</table>'
    + '</div>'
    + '<p style="margin:18px 0 0;color:#475569;font-size:14px;line-height:1.6;">If you need to make updates, add a vehicle, or have questions, simply reply to this email. For immediate assistance, call ' + esc(supportPhone) + '.</p>'
    + '<p style="margin:18px 0 0;color:#475569;font-size:14px;line-height:1.6;">We appreciate the opportunity to protect what matters to you.</p>'
    + '</div>'
    + '<div style="padding:22px 26px;background:#f8fbff;border-top:1px solid #dbeafe;">'
    + '<p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">Apex Pro Services d/b/a Apex Coverage<br/>'
    + '<a href="mailto:' + esc(supportEmail) + '" style="color:#2563eb;text-decoration:none;">' + esc(supportEmail) + '</a>'
    + ' &nbsp;|&nbsp; '
    + '<a href="' + esc(siteUrl) + '" style="color:#2563eb;text-decoration:none;">driveapexcoverage.com</a></p>'
    + '</div>'
    + '</div>';
}

function agentSendCoveragePdf_(body) {
  var to = safeString_(body.to).trim();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { ok: false, error: 'Missing or invalid customer email.' };
  }

  var pdfBase64 = safeString_(body.pdfBase64);
  if (!pdfBase64) {
    return { ok: false, error: 'Missing PDF attachment data.' };
  }

  var filename = safeString_(body.filename) || 'apex-coverage-packet.pdf';
  if (!/\.pdf$/i.test(filename)) filename += '.pdf';

  var documentType = safeString_(body.documentType).toLowerCase();
  var summary = body.summary || {};
  var isBuildDocument = documentType === 'build';
  var documentLabel = documentType === 'build'
    ? 'Modified Vehicle Protection packet'
    : 'auto coverage packet';
  var customerName = safeString_(body.customerName) || 'Customer';
  var supportEmail = 'support@driveapexcoverage.com';
  var supportPhone = '844-398-2739';
  var subject = isBuildDocument
    ? 'Your Apex Modified Vehicle Protection documents'
    : 'Your Apex Coverage policy documents';
  var welcomeLine = isBuildDocument
    ? 'Welcome to Apex Coverage - your Modified Vehicle Protection plan is now active.'
    : 'Welcome to Apex Coverage - your policy is now active.';
  var attachedLine = isBuildDocument
    ? 'Attached to this email, you will find your official Modified Vehicle Protection documents, including your covered build details and proof of protection.'
    : 'Attached to this email, you will find your official policy documents, including your declarations page and proof of coverage.';
  var summaryHeading = isBuildDocument
    ? 'Here is a quick summary of your protection:'
    : 'Here is a quick summary of your coverage:';
  var numberLabel = isBuildDocument ? 'Plan Number' : 'Policy Number';
  var coverageLabel = isBuildDocument ? 'Protection' : 'Coverage';
  var coverageFallback = isBuildDocument ? 'Modified Vehicle Protection' : 'Coverage on file';
  var text =
    'Hi ' + customerName + ',\n\n' +
    welcomeLine + '\n\n' +
    attachedLine + '\n\n' +
    summaryHeading + '\n\n' +
    numberLabel + ': ' + safeString_(summary.policyNumber || 'Pending confirmation') + '\n' +
    'Effective Date: ' + safeString_(summary.effectiveDate || 'Pending confirmation') + '\n' +
    'Vehicle(s): ' + safeString_(summary.vehicles || 'Vehicle schedule on file') + '\n' +
    coverageLabel + ': ' + safeString_(summary.coverage || coverageFallback) + '\n' +
    (isBuildDocument ? 'Covered Build Value: ' + safeString_(summary.coveredBuildValue || summary.declaredValue || summary.partsValue || summary.buildValue || 'See attached documents') + '\n' : '') +
    'Deductibles: ' + safeString_(summary.deductibles || 'See attached policy documents') + '\n\n' +
    'If you need to make any updates, add a vehicle, or have questions about your coverage, you can simply reply to this email and we will take care of it.\n\n' +
    'For immediate assistance, you can also call us at ' + supportPhone + '.\n\n' +
    'We appreciate the opportunity to protect what matters to you.\n\n' +
    '- The Apex Coverage Team\n' +
    supportEmail + '\n' +
    (typeof SITE_URL !== 'undefined' ? SITE_URL : 'https://www.driveapexcoverage.com') + '\n';

  var blob = Utilities.newBlob(
    Utilities.base64Decode(pdfBase64),
    'application/pdf',
    filename
  );

  var emailOptions = {
    htmlBody: coveragePdfEmailHtml_({
      name: customerName,
      documentType: documentType,
      documentLabel: documentLabel,
      summary: summary
    }),
    attachments: [blob],
    replyTo: supportEmail,
    name: 'Apex Coverage Support',
    from: supportEmail
  };

  if (typeof NOTIFY_TO !== 'undefined' && NOTIFY_TO) {
    emailOptions.bcc = NOTIFY_TO;
  }

  GmailApp.sendEmail(to, subject, text, emailOptions);

  logRow('coveragePdfEmailSent', {
    to: to,
    filename: filename,
    documentType: documentType
  });

  return { ok: true, to: to, filename: filename };
}

/**
 * Required doPost edits:
 *
 * 1. Add this action to the secure agent action list:
 *    action === 'sendcoveragepdf'
 *
 * 2. Add this dispatch inside the secure agent block:
 *
 *    if (action === 'sendcoveragepdf') {
 *      var resPdf = agentSendCoveragePdf_(body);
 *      return ContentService.createTextOutput(JSON.stringify(resPdf))
 *        .setMimeType(ContentService.MimeType.JSON);
 *    }
 */

/** Health check + Agent GET **/
function doGet(e) {
  if (e && e.parameter && e.parameter.agent == '1') {
    if (e.parameter.secret !== AGENT_SECRET) {
      return agentError_('Unauthorized', 401);
    }
    const action = (e.parameter.action || '').toLowerCase();
    if (action === 'listleads') {
      const out = agentListLeads_();
      return ContentService.createTextOutput(JSON.stringify(out))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (action === 'listbuildreviews') {
      const outBuildReviews = agentListBuildReviews_();
      return ContentService.createTextOutput(JSON.stringify(outBuildReviews))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (action === 'listpayments') {
      var leadId = e.parameter.leadId;
      var outPayments = agentListPaymentsForLead_(leadId);
      return ContentService.createTextOutput(JSON.stringify(outPayments))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return agentError_('Unknown action', 400);
  }
  return respond({
    ok: true,
    msg: 'GET alive',
    version: BUILD_REVIEW_FIX_VERSION
  });
}

/** Agent POST wrapper + public webhook handoff **/
function doPost(e) {
  const postType = e && e.postData ? String(e.postData.type || '') : '';
  const postContents = e && e.postData ? String(e.postData.contents || '') : '';
  const firstPostChar = postContents.trim().charAt(0);

  if (
    postType.indexOf('application/json') !== -1 &&
    (firstPostChar === '{' || firstPostChar === '[') &&
    e &&
    e.postData &&
    typeof e.postData.contents === 'string' &&
    e.postData.contents.trim()
  ) {
    try {
      var body = JSON.parse(e.postData.contents || '{}');
      var action = String(body.action || '').toLowerCase();

      if (
        action === 'updatelead' ||
        action === 'updatebuildreview' ||
        action === 'deletelead' ||
        action === 'deletebuildreview' ||
        action === 'createbuildfromauto' ||
        action === 'createautofrombuild' ||
        action === 'saveworksheet' ||
        action === 'loadworksheet' ||
        action === 'updatecustomer' ||
        action === 'appendpaymenthistory' ||
        action === 'sendcoveragepdf'
      ) {
        if (body.secret !== AGENT_SECRET) {
          return agentError_('Unauthorized', 401);
        }

        if (action === 'updatelead') {
          var id = Number(body.id);
          var patch = body.patch || {};
          var resUpdate = agentUpdateLead_(id, patch);
          return ContentService.createTextOutput(JSON.stringify(resUpdate))
            .setMimeType(ContentService.MimeType.JSON);
        }

        if (action === 'updatebuildreview') {
          var buildReviewId = Number(body.id);
          var buildReviewPatch = body.patch || {};
          var resBuildReviewUpdate = agentUpdateBuildReview_(buildReviewId, buildReviewPatch);
          return ContentService.createTextOutput(JSON.stringify(resBuildReviewUpdate))
            .setMimeType(ContentService.MimeType.JSON);
        }

        if (action === 'deletelead') {
          var deleteLeadId = Number(body.id);
          var resDeleteLead = agentDeleteLead_(deleteLeadId);
          return ContentService.createTextOutput(JSON.stringify(resDeleteLead))
            .setMimeType(ContentService.MimeType.JSON);
        }

        if (action === 'deletebuildreview') {
          var deleteBuildReviewId = Number(body.id);
          var resDeleteBuildReview = agentDeleteBuildReview_(deleteBuildReviewId);
          return ContentService.createTextOutput(JSON.stringify(resDeleteBuildReview))
            .setMimeType(ContentService.MimeType.JSON);
        }

        if (action === 'createbuildfromauto') {
          var resCreateBuild = agentCreateBuildFromAuto_(body.autoLeadId);
          return ContentService.createTextOutput(JSON.stringify(resCreateBuild))
            .setMimeType(ContentService.MimeType.JSON);
        }

        if (action === 'createautofrombuild') {
          var resCreateAuto = agentCreateAutoFromBuild_(body.buildReviewId);
          return ContentService.createTextOutput(JSON.stringify(resCreateAuto))
            .setMimeType(ContentService.MimeType.JSON);
        }

        if (action === 'updatecustomer') {
          var resCust = handleUpdateCustomer(body);
          return ContentService.createTextOutput(JSON.stringify(resCust))
            .setMimeType(ContentService.MimeType.JSON);
        }

        if (action === 'saveworksheet') {
          var resWs = agentSaveWorksheet_(body);
          return ContentService.createTextOutput(JSON.stringify(resWs))
            .setMimeType(ContentService.MimeType.JSON);
        }

        if (action === 'loadworksheet') {
          var leadId = body.leadId;
          var resLoad = agentLoadWorksheet_(leadId);
          return ContentService.createTextOutput(JSON.stringify(resLoad))
            .setMimeType(ContentService.MimeType.JSON);
        }

        if (action === 'appendpaymenthistory') {
          var resPayment = agentAppendPaymentHistory_(body);
          return ContentService.createTextOutput(JSON.stringify(resPayment))
            .setMimeType(ContentService.MimeType.JSON);
        }

        if (action === 'sendcoveragepdf') {
          var resPdf = agentSendCoveragePdf_(body);
          return ContentService.createTextOutput(JSON.stringify(resPdf))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
    } catch (err) {
      logRow('agentJsonParseFail', { err: String(err) });
    }
  }

  return handlePublicPost_(e);
}

/** ===== Your original public webhook logic (moved here unchanged) ===== **/
function handlePublicPost_(e) {
  try {
    const ss = SpreadsheetApp.getActive();
    if (!e) return respond({ ok:false, error: 'No event payload' });

    var data = {};
    var postType = e.postData ? String(e.postData.type || '') : '';
    var postContents = e.postData ? String(e.postData.contents || '') : '';
    var firstPostChar = postContents.trim().charAt(0);

    logRow('publicPostReceived', {
      version: BUILD_REVIEW_FIX_VERSION,
      contentType: postType,
      bodyPrefix: postContents.slice(0, 40)
    });

    if (
      e.postData &&
      postType.indexOf('application/json') !== -1 &&
      (firstPostChar === '{' || firstPostChar === '[')
    ) {
      data = JSON.parse(e.postData.contents || '{}');
    } else if (postContents && postContents.indexOf('=') !== -1) {
      data = parseUrlEncodedBody_(postContents);
    } else {
      data = e.parameter || {};
    }
    const get = function (k) { return ((data[k] != null ? data[k] : '') + '').trim(); };
    const params = (e && e.parameters) ? e.parameters : {};
    const getList = function (k) {
      if (Array.isArray(data[k])) {
        return data[k]
          .map(function (v) { return String(v || '').trim(); })
          .filter(Boolean);
      }
      if (params[k] && params[k].length) {
        return params[k]
          .map(function (v) { return String(v || '').trim(); })
          .filter(Boolean);
      }
      var one = get(k);
      return one ? [one] : [];
    };

    const rawType = (get('type') || '').toLowerCase();
    var type = rawType.replace(/_/g, '-');

    if (type === 'buildreview') type = 'build-review';
    if (type === 'insurance-quote' || type === 'insurancequote') type = 'insurance_quote';

    const looksLikeBuildReview =
      !type &&
      (
        !!get('vin') ||
        !!get('partsList') ||
        !!get('partsValue') ||
        !!get('professionalInstallStatus') ||
        !!get('tierInterest') ||
        !!get('deductible') ||
        !!get('annualMileage') ||
        !!get('titleStatus') ||
        !!get('vehicleUse')
      );

    if (looksLikeBuildReview) {
      type = 'build-review';
      logRow('buildReviewTypeInferred', {
        note: 'No type was provided, but build-review-specific fields were present.',
        name: get('name'),
        email: get('email')
      });
    }

    /** ===================== DOCUMENT UPLOAD FLOW ===================== **/
    if (type === 'document-upload') {
      const when = new Date();
      const whenStr = nowEtString_();

      const name = get('name') || 'Customer';
      const email = get('email');
      const phone = get('phone');
      const vehicle = get('vehicle');
      const uploadCode = get('uploadCode');
      const purpose = get('purpose');
      const notes = get('notes');
      const files = Array.isArray(data.files) ? data.files : [];

      if (!email && !phone) {
        return respond({
          ok: false,
          type: 'document-upload',
          error: 'Email or phone is required for document uploads.'
        });
      }

      if (!files.length) {
        return respond({
          ok: false,
          type: 'document-upload',
          error: 'At least one file is required.'
        });
      }

      const attachments = [];
      const fileNames = [];
      files.forEach(function (file) {
        try {
          const fileName = String(file.name || 'upload');
          const mimeType = String(file.type || 'application/octet-stream');
          const encoded = String(file.base64 || '');

          if (!encoded) return;

          attachments.push(
            Utilities.newBlob(
              Utilities.base64Decode(encoded),
              mimeType,
              fileName
            )
          );
          fileNames.push(fileName);
        } catch (fileErr) {
          logRow('documentUploadFileDecodeError', {
            file: file && file.name ? file.name : '',
            err: String(fileErr)
          });
        }
      });

      if (!attachments.length) {
        return respond({
          ok: false,
          type: 'document-upload',
          error: 'Uploaded files could not be processed.'
        });
      }

      const uploadHeaders = [
        'Timestamp',
        'Submission Type',
        'Name',
        'Email',
        'Phone',
        'Vehicle',
        'Upload Code / Agent',
        'Purpose',
        'File Names',
        'Notes',
        'Status',
        'Source',
        'Activity Log'
      ];

      const uploads = ss.getSheetByName(DOCUMENT_UPLOADS_TAB) || ss.insertSheet(DOCUMENT_UPLOADS_TAB);

      if (uploads.getLastRow() === 0) {
        uploads.appendRow(uploadHeaders);
      } else {
        const existingUploadHeaders = uploads
          .getRange(1, 1, 1, uploads.getLastColumn())
          .getValues()[0]
          .map(function (h) { return String(h || '').trim(); });

        uploadHeaders.forEach(function (header) {
          if (existingUploadHeaders.indexOf(header) === -1) {
            uploads
              .getRange(1, uploads.getLastColumn() + 1)
              .setValue(header);
            existingUploadHeaders.push(header);
          }
        });
      }

      const liveUploadHeaders = uploads
        .getRange(1, 1, 1, uploads.getLastColumn())
        .getValues()[0]
        .map(function (h) { return String(h || '').trim(); });

      const uploadValuesByHeader = {
        'Timestamp': when,
        'Submission Type': 'document-upload',
        'Name': name,
        'Email': email,
        'Phone': phone,
        'Vehicle': vehicle,
        'Upload Code / Agent': uploadCode,
        'Purpose': purpose,
        'File Names': fileNames.join(', '),
        'Notes': notes,
        'Status': 'Received',
        'Source': 'website-document-upload',
        'Activity Log': nowEtString_() + ' - Documents uploaded from website'
      };

      uploads.appendRow(
        liveUploadHeaders.map(function (header) {
          return Object.prototype.hasOwnProperty.call(uploadValuesByHeader, header)
            ? uploadValuesByHeader[header]
            : '';
        })
      );

      try {
        const subjectStaff = 'New document upload - ' + name + (vehicle ? ' - ' + vehicle : '');
        const textStaff =
          'New Document Upload\n' +
          'Name: ' + name + '\n' +
          'Email: ' + (email || '(none)') + '\n' +
          'Phone: ' + (phone || '(none)') + '\n' +
          'Vehicle: ' + (vehicle || '(not listed)') + '\n' +
          'Upload Code / Agent: ' + (uploadCode || '(none)') + '\n' +
          'Purpose: ' + (purpose || '(not listed)') + '\n' +
          'Files: ' + (fileNames.join(', ') || '(none)') + '\n' +
          'Notes: ' + (notes || '(none)') + '\n' +
          'Received: ' + whenStr + '\n';

        GmailApp.sendEmail(DOCUMENT_UPLOAD_NOTIFY_TO, subjectStaff, textStaff, {
          attachments: attachments,
          replyTo: email || REPLY_TO,
          from: QUOTES_FROM_EMAIL,
          name: QUOTES_FROM_NAME
        });
      } catch (uploadNotifyErr) {
        logRow('documentUploadNotifyEmailError', { err: String(uploadNotifyErr) });
        return respond({
          ok: false,
          type: 'document-upload',
          error: 'Upload was logged, but Apex could not be notified by email.'
        });
      }

      try {
        if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          const subjectCustomer = 'We received your documents - ' + BRAND;
          const textCustomer =
            'Thanks, ' + name + '. We received your Apex document upload.\n' +
            (vehicle ? 'Vehicle: ' + vehicle + '\n' : '') +
            'Files: ' + (fileNames.join(', ') || '(none)') + '\n' +
            'Your Apex agent can now continue the coverage review with these records.\n' +
            'Questions? Reply to this email or call 844-398-2739.\n' +
            '- ' + BRAND + '\n' +
            SITE_URL + '\n';

          GmailApp.sendEmail(email, subjectCustomer, textCustomer, {
            replyTo: REPLY_TO,
            from: QUOTES_FROM_EMAIL,
            name: QUOTES_FROM_NAME,
            bcc: DOCUMENT_UPLOAD_NOTIFY_TO
          });
        }
      } catch (uploadCustomerErr) {
        logRow('documentUploadCustomerEmailError', {
          to: email,
          err: String(uploadCustomerErr)
        });
      }

      logRow('documentUploadSaved', {
        name: name,
        email: email,
        phone: phone,
        vehicle: vehicle,
        files: fileNames,
        version: BUILD_REVIEW_FIX_VERSION
      });

      return respond({
        ok: true,
        type: 'document-upload',
        version: BUILD_REVIEW_FIX_VERSION
      });
    }

    /** ===================== BUILD REVIEW FLOW ===================== **/
    if (type === 'build-review') {
      const when = new Date();
      const whenStr = nowEtString_();

      const name = get('name') || 'Prospect';
      const email = get('email');
      const phone = get('phone');
      const zip = get('zip');
      const dob = get('dob');

      const year = get('year');
      const make = get('make');
      const model = get('model');
      const vehicle = [year, make, model].filter(Boolean).join(' ');

      const vin = get('vin');
      const mileage = get('mileage');
      const annualMileage = get('annualMileage');
      const titleStatus = get('titleStatus');
      const vehicleUse = get('vehicleUse');

      const partsList = get('partsList');
      const partsValue = get('partsValue');
      const professionalInstallStatus = get('professionalInstallStatus');
      const installerInfo = get('installerInfo');
      const documentation = getList('documentation').join(', ');

      const tierInterest = get('tierInterest');
      const deductible = get('deductible');
      const drivingHistory = get('drivingHistory');
      const claimHistory = get('claimHistory');
      const discountNotes = get('discountNotes');
      const autoInsuranceReview = get('autoInsuranceReview') || 'no';
      const consent = get('consent');
      const source = get('source') || 'website-build-review';

      const missingRequired = [];
      if (!name || name === 'Prospect') missingRequired.push('name');
      if (!email) missingRequired.push('email');
      if (!phone) missingRequired.push('phone');
      if (!zip) missingRequired.push('zip');
      if (!dob) missingRequired.push('dob');
      if (!year) missingRequired.push('year');
      if (!make) missingRequired.push('make');
      if (!model) missingRequired.push('model');
      if (!vin) missingRequired.push('vin');
      if (!mileage) missingRequired.push('mileage');
      if (!annualMileage) missingRequired.push('annualMileage');
      if (!titleStatus) missingRequired.push('titleStatus');
      if (!vehicleUse) missingRequired.push('vehicleUse');
      if (!partsList) missingRequired.push('partsList');
      if (!partsValue) missingRequired.push('partsValue');
      if (!professionalInstallStatus) missingRequired.push('professionalInstallStatus');
      if (!tierInterest) missingRequired.push('tierInterest');
      if (!deductible) missingRequired.push('deductible');
      if (!drivingHistory) missingRequired.push('drivingHistory');
      if (!claimHistory) missingRequired.push('claimHistory');
      if (consent !== 'true') missingRequired.push('consent');

      if (missingRequired.length) {
        logRow('buildReviewRejectedMissingFields', {
          missing: missingRequired,
          name: name,
          email: email,
          source: source
        });
        return respond({
          ok: false,
          type: 'build-review',
          error: 'Missing required build review fields: ' + missingRequired.join(', ')
        });
      }

      const buildHeaders = [
        'Timestamp',
        'Submission Type',
        'Name',
        'Email',
        'Phone',
        'ZIP',
        'DOB',
        'Vehicle Year',
        'Make',
        'Model',
        'VIN',
        'Current Mileage',
        'Annual Mileage',
        'Title Status',
        'Vehicle Use',
        'Parts List',
        'Parts Value',
        'Professional Install Status',
        'Shop / Installer Info',
        'Documentation',
        'Tier Interest',
        'Preferred Deductible',
        'Driving History',
        'Claim History',
        'Discount Notes',
        'Auto Coverage Review',
        'Consent',
        'Status',
        'Source',
        'Activity Log'
      ];

      const buildReviews = ss.getSheetByName(BUILD_REVIEWS_TAB) || ss.insertSheet(BUILD_REVIEWS_TAB);

      if (buildReviews.getLastRow() === 0) {
        buildReviews.appendRow(buildHeaders);
      } else {
        const existingHeaders = buildReviews
          .getRange(1, 1, 1, buildReviews.getLastColumn())
          .getValues()[0]
          .map(function (h) { return String(h || '').trim(); });

        buildHeaders.forEach(function (header) {
          if (existingHeaders.indexOf(header) === -1) {
            buildReviews
              .getRange(1, buildReviews.getLastColumn() + 1)
              .setValue(header);
            existingHeaders.push(header);
          }
        });
      }

      const liveBuildHeaders = buildReviews
        .getRange(1, 1, 1, buildReviews.getLastColumn())
        .getValues()[0]
        .map(function (h) { return String(h || '').trim(); });

      const buildValuesByHeader = {
        'Timestamp': when,
        'Submission Type': 'build-review',
        'Name': name,
        'Email': email,
        'Phone': phone,
        'ZIP': zip,
        'DOB': dob,
        'Vehicle Year': year,
        'Year': year,
        'Make': make,
        'Model': model,
        'VIN': vin,
        'Current Mileage': mileage,
        'Annual Mileage': annualMileage,
        'Title Status': titleStatus,
        'Vehicle Use': vehicleUse,
        'Parts List': partsList,
        'Parts Value': partsValue,
        'Estimated Parts Value': partsValue,
        'Professional Install Status': professionalInstallStatus,
        'Shop / Installer Info': installerInfo,
        'Installer Info': installerInfo,
        'Documentation': documentation,
        'Documentation Available': documentation,
        'Tier Interest': tierInterest,
        'Preferred Deductible': deductible,
        'Driving History': drivingHistory,
        'Claim History': claimHistory,
        'Discount Notes': discountNotes,
        'Auto Coverage Review': autoInsuranceReview,
        'Auto Insurance Review': autoInsuranceReview,
        'Consent': consent,
        'Source': source,
        'Status': 'New Build Review',
        'Agent': '',
        'Activity Log': nowEtString_() + ' - Build review submitted from website'
      };

      buildReviews.appendRow(
        liveBuildHeaders.map(function (header) {
          return Object.prototype.hasOwnProperty.call(buildValuesByHeader, header)
            ? buildValuesByHeader[header]
            : '';
        })
      );

      const b = {
        name: name,
        email: email,
        phone: phone,
        zip: zip,
        dob: dob,
        vehicle: vehicle,
        vin: vin,
        mileage: mileage,
        annualMileage: annualMileage,
        titleStatus: titleStatus,
        vehicleUse: vehicleUse,
        partsList: partsList,
        partsValue: partsValue,
        professionalInstallStatus: professionalInstallStatus,
        installerInfo: installerInfo,
        documentation: documentation,
        tierInterest: tierInterest,
        deductible: deductible,
        drivingHistory: drivingHistory,
        claimHistory: claimHistory,
        discountNotes: discountNotes,
        autoInsuranceReview: autoInsuranceReview,
        consent: consent,
        source: source,
        whenStr: whenStr
      };

      var buildNotifyOk = false;
      var buildCustomerOk = false;
      var buildErrs = [];

      try {
        const subjectStaff = `New Build Review - ${name}${vehicle ? ' - ' + vehicle : ''}`;
        const htmlStaff = buildReviewInternalHTML(b);
        const textStaff =
          `New Build Review\n` +
          `Name: ${name}\nEmail: ${email || '(none)'}\nPhone: ${phone || '(none)'}\n` +
          `ZIP: ${zip || '(none)'}  DOB: ${dob || '(none)'}\n` +
          `Vehicle: ${vehicle || '(unspecified)'}\nVIN: ${vin || '(none)'}\n` +
          `Mileage: ${mileage || '(none)'}  Annual: ${annualMileage || '(none)'}\n` +
          `Title: ${titleStatus || '(none)'}  Use: ${vehicleUse || '(none)'}\n` +
          `Tier: ${tierInterest || '(none)'}  Deductible: ${deductible || '(none)'}\n` +
          `Parts Value: ${partsValue || '(none)'}\n` +
          `Install Status: ${professionalInstallStatus || '(none)'}\n` +
          `Documentation: ${documentation || '(none)'}\n` +
          `Driving History: ${drivingHistory || '(none)'}\n` +
          `Claim History: ${claimHistory || '(none)'}\n` +
          `Auto Coverage Review: ${autoInsuranceReview}\n` +
          `Parts: ${partsList || '(none)'}\n` +
          `Installer: ${installerInfo || '(none)'}\n` +
          `Discount Notes: ${discountNotes || '(none)'}\n` +
          `Source: ${source}\nReceived: ${whenStr}\n`;

        GmailApp.sendEmail(NOTIFY_TO, subjectStaff, textStaff, {
          htmlBody: htmlStaff,
          replyTo: REPLY_TO,
          from: QUOTES_FROM_EMAIL,
          name: QUOTES_FROM_NAME
        });
        buildNotifyOk = true;
      } catch (errBuildStaff) {
        buildErrs.push('notify: ' + String(errBuildStaff));
        logRow('buildReviewNotifyEmailError', { err: String(errBuildStaff) });
      }

      try {
        if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          const subjectCust = `We received your build review - ${BRAND}`;
          const htmlCust = buildReviewCustomerHTML(b);
          const textCust =
            `Thanks, ${name}. We received your Apex Modified Vehicle Protection build review.\n` +
            `Vehicle: ${vehicle || '(unspecified)'}\n` +
            `VIN: ${vin || '(not provided)'}\n` +
            `Tier interest: ${tierInterest || '(not sure)'}\n` +
            `Deductible: ${deductible || '(not sure)'}\n` +
            `Documentation: ${documentation || '(none selected)'}\n\n` +
            `Please keep receipts, photos, installer invoices, VIN, and mileage-at-install records ready.\n` +
            `Questions? Reply to this email or call 844-398-2739.\n` +
            `- ${BRAND}\n${SITE_URL}\n`;

          GmailApp.sendEmail(email, subjectCust, textCust, {
            htmlBody: htmlCust,
            replyTo: REPLY_TO,
            from: QUOTES_FROM_EMAIL,
            name: QUOTES_FROM_NAME,
            bcc: NOTIFY_TO
          });
          buildCustomerOk = true;
          logRow('buildReviewCustomerEmailSent', { to: email, subject: subjectCust });
        } else {
          buildErrs.push('customer: invalid email');
          logRow('buildReviewCustomerEmailSkipped', { email: email });
        }
      } catch (errBuildCust) {
        buildErrs.push('customer: ' + String(errBuildCust));
        logRow('buildReviewCustomerEmailError', { to: email, err: String(errBuildCust) });
      }

      logRow('buildReviewSaved', {
        name: name,
        email: email,
        vehicle: vehicle,
        tierInterest: tierInterest,
        autoInsuranceReview: autoInsuranceReview,
        notifyOk: buildNotifyOk,
        customerOk: buildCustomerOk,
        errs: buildErrs
      });

      return respond({
        ok: true,
        type: 'build-review',
        version: BUILD_REVIEW_FIX_VERSION,
        notifyOk: buildNotifyOk,
        customerOk: buildCustomerOk,
        errs: buildErrs
      });
    }

    /** ===================== CLAIMS FLOW ===================== **/
    if (type === 'claim') {
      const when    = new Date();
      const whenStr = when.toLocaleString();

      const name    = get('name') || 'Customer';
      const email   = get('email');
      const phone   = get('phone');
      const policy  = get('policy');
      const dateOfLoss = get('dateOfLoss');
      const timeOfLoss = get('timeOfLoss');
      const location   = get('location');

      const year    = get('year');
      const make    = get('make');
      const model   = get('model');
      const vehicle = [year, make, model].filter(Boolean).join(' ');

      const lossType         = get('lossType');
      const description      = get('description');
      const policeReport     = get('policeReport');
      const photoUrls        = get('photoUrls');
      const preferredContact = get('preferredContact') || 'email';
      const source           = get('source');

      const claims = ss.getSheetByName(CLAIMS_TAB) || ss.insertSheet(CLAIMS_TAB);
      claims.appendRow([
        when, name, email, phone, policy,
        dateOfLoss, timeOfLoss, location,
        vehicle, lossType, description, policeReport, photoUrls,
        preferredContact, source
      ]);

      try {
        const c = { name, email, phone, policy, dateOfLoss, timeOfLoss, location, vehicle, lossType, policeReport, preferredContact, photoUrls, description, source, whenStr };
        const subjectStaff = `New Claim - ${name}${policy ? ' - ' + policy : ''}`;
        const htmlStaff = claimInternalHTML(c);
        const textStaff =
          `New Claim Submitted\n` +
          `Name: ${name}\nEmail: ${email || '(none)'}\nPhone: ${phone || '(none)'}\n` +
          `Policy: ${policy || '(unknown)'}\nDate/Time: ${dateOfLoss || ''} ${timeOfLoss || ''}\n` +
          `Location: ${location || '(not provided)'}\nVehicle: ${vehicle || '(unspecified)'}\n` +
          `Loss: ${lossType || ''}\nPolice Report: ${policeReport || ''}\n` +
          `Preferred Contact: ${preferredContact}\nPhotos: ${photoUrls || '(none)'}\n` +
          `Desc: ${description || ''}\nSource: ${source || ''}\nReceived: ${whenStr}\n`;
        GmailApp.sendEmail(CLAIMS_NOTIFY_TO, subjectStaff, textStaff, {
          htmlBody: htmlStaff,
          replyTo: CLAIMS_REPLY_TO,
          from: CLAIMS_FROM_EMAIL,
          name: CLAIMS_FROM_NAME,
          bcc: CLAIMS_BCC
        });
      } catch (errA) {
        logRow('claimNotifyEmailError', { err: String(errA) });
      }

      try {
        if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          const c = { name, policy, dateOfLoss, timeOfLoss, location, vehicle, lossType, preferredContact };
          const subjectCust = `We received your claim - ${BRAND}`;
          const htmlCust = claimCustomerHTML(c);
          const textCust =
            `Thanks, ${name}. Your claim is in.\n` +
            `We will contact you via ${c.preferredContact || 'email'} with next steps.\n` +
            `${policy ? 'Policy: ' + policy + '\n' : ''}` +
            `Date/Time: ${dateOfLoss || ''} ${timeOfLoss || ''}\n` +
            `Location: ${location || ''}\n` +
            `Vehicle: ${vehicle || ''}\n` +
            `Loss Type: ${lossType || ''}\n` +
            `If this needs urgent attention, call us at 844-398-2739.\n- ${BRAND}\n${SITE_URL}\n`;
          GmailApp.sendEmail(email, subjectCust, textCust, {
            htmlBody: htmlCust,
            replyTo: CLAIMS_REPLY_TO,
            from: CLAIMS_FROM_EMAIL,
            name: CLAIMS_FROM_NAME,
            bcc: CLAIMS_BCC
          });
          logRow('claimCustomerEmailSent', { to: email, subject: subjectCust });
        } else {
          logRow('claimCustomerEmailSkipped', { email: email });
        }
      } catch (errB) {
        logRow('claimCustomerEmailError', { err: String(errB) });
      }

      logRow('claimSaved', { name: name, policy: policy, dateOfLoss: dateOfLoss, lossType: lossType, source: source });
      return respond({ ok: true, type: 'claim', version: BUILD_REVIEW_FIX_VERSION });
    }

    /** ===================== AUTO COVERAGE REVIEW ROUTING ===================== **/
    // Explicitly accept the current auto coverage review type.
    // A blank type is temporarily accepted for older website/API versions during rollout.
    if (type && type !== 'insurance_quote') {
      logRow('unknownPublicSubmissionType', { type: type, raw: data });
      return respond({
        ok: false,
        type: type,
        error: 'Unknown public submission type: ' + type
      });
    }

    if (!type) {
      logRow('legacyInsuranceQuoteType', {
        note: 'Accepted a public submission with no type. Update the sender to use insurance_quote.',
        raw: data
      });
    }

    /** ===================== LEADS FLOW (AUTO COVERAGE) ===================== **/
    const leads = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    const when    = new Date();
    const whenStr = when.toLocaleString();
    const name    = get('name') || 'Prospect';
    const email   = get('email');
    const phone   = get('phone');
    const zip     = get('zip');
    const dob     = get('dob');
    const year    = get('year');
    const make    = get('make');
    const model   = get('model');
    const consent = get('consent');
    const vehicle = [year, make, model].filter(Boolean).join(' ');

    const hasAnyRealData =
      (name && name !== 'Prospect') ||
      !!email ||
      !!phone ||
      !!zip ||
      !!vehicle;

    if (!hasAnyRealData) {
      logRow('leadSkippedEmpty', { raw: data });
      return respond({ ok: false, error: 'Empty or test POST ignored (no lead created)' });
    }

    leads.appendRow([ when, name, email, phone, zip, dob, year, make, model, consent ]);

    var notifyOk = false, customerOk = false, errs = [];

    try {
      const subject1 = `New Auto Coverage Review - ${name}${zip ? ' - ' + zip : ''}`;
      const html1 = internalEmailHTML({ name: name, email: email, phone: phone, zip: zip, dob: dob, vehicle: vehicle, consent: consent, when: whenStr });
      const text1 =
        `New Auto Coverage Review\n` +
        `Name: ${name}\nEmail: ${email || '(none)'}\nPhone: ${phone || '(none)'}\n` +
        `ZIP: ${zip || '(none)'}  DOB: ${dob || '(none)'}\nVehicle: ${vehicle || '(unspecified)'}\n` +
        `Consent: ${consent || 'false'}\nReceived: ${whenStr}\n`;
      GmailApp.sendEmail(NOTIFY_TO, subject1, text1, {
        htmlBody: html1,
        replyTo: REPLY_TO,
        from: QUOTES_FROM_EMAIL,
        name: QUOTES_FROM_NAME
      });
      notifyOk = true;
    } catch (err1) {
      Logger.log('Notify email failed: ' + err1);
      errs.push('notify: ' + err1);
    }

    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      try {
        const subject2 = `We received your auto coverage review - ${BRAND}`;
        const html2 = customerEmailHTML({ name: name, email: email, phone: phone, zip: zip, vehicle: vehicle });
        const text2 =
          `Thanks, ${name}. We received your auto coverage review request.\n` +
          `${phone ? 'We will call you at ' + phone + '. ' : ''}` +
          `${zip ? '(ZIP ' + zip + ') ' : ''}\n` +
          `${vehicle ? 'Vehicle: ' + vehicle + '\n' : ''}\n` +
          `If anything looks off, reply to this email with corrections.\n- ${BRAND}\n${SITE_URL}\n`;
        GmailApp.sendEmail(email, subject2, text2, {
          htmlBody: html2,
          replyTo: REPLY_TO,
          from: QUOTES_FROM_EMAIL,
          name: QUOTES_FROM_NAME,
          bcc: NOTIFY_TO
        });
        customerOk = true;
        logRow('customerEmailSent', { to: email, subject: subject2 });
      } catch (err2) {
        Logger.log('Customer email failed: ' + err2);
        errs.push('customer: ' + err2);
        logRow('customerEmailError', { to: email, err: String(err2) });
      }
    } else {
      logRow('customerEmailSkipped', { email: email });
    }

    logRow('emails', { notifyOk: notifyOk, customerOk: customerOk, errs: errs });
    return respond({ ok: true, type: 'insurance_quote', version: BUILD_REVIEW_FIX_VERSION, notifyOk: notifyOk, customerOk: customerOk, errs: errs });

  } catch (err) {
    logRow('fatal', { err: String(err) });
    return respond({ ok:false, error: String(err) });
  }
}

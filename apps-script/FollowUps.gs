/** === Apex Coverage — Lead Follow-up Engine (Day 1/3/7/14) ===
 *  - Non-intrusive: does not touch your immediate confirmation logic
 *  - Reads from the "Leads" sheet you already populate
 *  - Records sends in a "Followups" tab to avoid duplicates
 *  - Skips when Status indicates conversion/opt-out or FU_Stop flag is set
 *  - Run on a daily time-based trigger (e.g., 10:00 AM America/New_York)
 */

/** ---- CONFIG ---- **/
const FU_LEADS_SHEET   = 'Leads';         // your existing leads tab
const FU_BUILD_SHEET   = 'Build Reviews';
const FU_LOG_SHEET     = 'Followups';     // created automatically
const FU_BRAND         = 'Apex Coverage';
const FU_FROM_NAME     = 'Apex Coverage Quotes';
const FU_SITE_URL      = 'https://www.driveapexcoverage.com';
const FU_REPLY_TO      = 'quotes@driveapexcoverage.com'; // reply-to for ALL follow-ups
const FU_SUPPORT_EMAIL = 'support@driveapexcoverage.com';
const FU_SUPPORT_PHONE = '844-398-2739';
const FU_LOGO_URL      = 'https://www.driveapexcoverage.com/Apex_Shield_Email.png';
const FU_TEMPLATE_VERSION = '2026-10-19-blue';

// Which offsets (in days) to send at, and which template key to use
const FU_STAGES = [
  { days: 1,  key: 'D1' },
  { days: 3,  key: 'D3' },
  { days: 7,  key: 'D7' },
  { days: 14, key: 'D14' },
];

// Column mapping for your Leads sheet (adjust if your order is different)
const COL = {
  TIMESTAMP: 1, // A: new Date() when you saved the lead
  NAME:      2, // B: name
  EMAIL:     3, // C: email
  PHONE:     4, // D: phone
  ZIP:       5, // E: zip
  DOB:       6, // F: dob
  YEAR:      7, // G: year
  MAKE:      8, // H: make
  MODEL:     9, // I: model
  CONSENT:   10 // J: consent
};

// Optional columns that, if present, can stop followups
const STOP_STATUS_HEADER = 'Status';                         // case-insensitive match
const STOP_FLAG_HEADERS  = [
  'FU_Stop',
  'Stop Followups',
  'Stop Follow-ups',
  'Follow Up Suppressed',
  'Follow-Up Suppressed',
  'Follow Up Status',
  'Follow-Up Status'
]; // any one of these; case-insensitive
const STOP_STATUSES = new Set([
  'bound','converted','sold','do not contact','opt-out','opt out','unsubscribed',
  'won','active','customer','active customer','policy active','closed - won',
  'closed - lost','closed won','closed lost','deleted','duplicate','lost',
  'not interested','do not email','dnc'
]);

/** ---- PUBLIC ENTRYPOINT (attach daily trigger to this) ---- **/
function runDailyFollowups() {
  const tz = 'America/New_York';
  Logger.log('Apex follow-ups version: ' + FU_TEMPLATE_VERSION);
  const ss = SpreadsheetApp.getActive();
  const leads = ss.getSheetByName(FU_LEADS_SHEET);
  if (!leads) {
    Logger.log('Followups: no Leads sheet found, nothing to do.');
    return;
  }
  const log = ss.getSheetByName(FU_LOG_SHEET) || ss.insertSheet(FU_LOG_SHEET);
  if (log.getLastRow() === 0) {
    log.appendRow(['When', 'Email', 'Stage', 'Name', 'Zip', 'Notes']);
  }

  const rows = leads.getDataRange().getValues();
  if (rows.length <= 1) return; // header-only sheet

  // Header map (case-insensitive lookup)
  const headers = rows[0].map(h => String(h || ''));
  const statusColIndex = findHeaderIndexCaseInsensitive_(headers, STOP_STATUS_HEADER); // 1-based or 0 if missing
  const stopFlagIndex  = findAnyHeaderCaseInsensitive_(headers, STOP_FLAG_HEADERS);    // 1-based or 0 if missing
  const followUpStatusIndex = findAnyHeaderCaseInsensitive_(headers, ['Follow Up Status', 'Follow-Up Status']);
  const followUpSuppressedIndex = findAnyHeaderCaseInsensitive_(headers, ['Follow Up Suppressed', 'Follow-Up Suppressed']);
  const stoppedEmails = new Set();
  rows.slice(1).forEach(function (row) {
    const email = String(row[COL.EMAIL - 1] || '').trim().toLowerCase();
    if (!email) return;
    const status = statusColIndex ? row[statusColIndex - 1] : '';
    const flag = stopFlagIndex ? row[stopFlagIndex - 1] : '';
    const followUpStatus = followUpStatusIndex ? row[followUpStatusIndex - 1] : '';
    const suppressed = followUpSuppressedIndex ? row[followUpSuppressedIndex - 1] : '';
    if (STOP_STATUSES.has(normalizeStopStatus_(status)) ||
        isTruthyStopValue_(flag) ||
        isTruthyStopValue_(followUpStatus) ||
        isTruthyStopValue_(suppressed)) {
      stoppedEmails.add(email);
    }
  });
  const builds = ss.getSheetByName(FU_BUILD_SHEET);
  if (builds && builds.getLastRow() > 1) {
    const buildRows = builds.getDataRange().getValues();
    const buildHeaders = buildRows[0].map(h => String(h || ''));
    const buildEmailIndex = findHeaderIndexCaseInsensitive_(buildHeaders, 'Email');
    const buildStatusIndex = findHeaderIndexCaseInsensitive_(buildHeaders, 'Status');
    if (buildEmailIndex && buildStatusIndex) {
      buildRows.slice(1).forEach(function (row) {
        const email = String(row[buildEmailIndex - 1] || '').trim().toLowerCase();
        const status = normalizeStopStatus_(row[buildStatusIndex - 1]);
        if (email && STOP_STATUSES.has(status)) stoppedEmails.add(email);
      });
    }
  }

  // Build a quick in-memory set of (email|stage) already sent
  const sentSet = buildSentSet_(log);

  // Iterate leads (skip header)
  for (let r = 2; r <= rows.length; r++) {
    const row = rows[r - 1];

    const when      = row[COL.TIMESTAMP - 1];
    const name      = String(row[COL.NAME - 1] || 'Prospect');
    const email     = String(row[COL.EMAIL - 1] || '');
    const phone     = String(row[COL.PHONE - 1] || '');
    const zip       = String(row[COL.ZIP - 1] || '');
    const year      = String(row[COL.YEAR - 1] || '');
    const make      = String(row[COL.MAKE - 1] || '');
    const model     = String(row[COL.MODEL - 1] || '');
    const consent   = String(row[COL.CONSENT - 1] || '');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue; // skip invalid
    if (!(when instanceof Date)) continue; // malformed timestamp row

    // ---- STOP LOGIC: status or flag ----
    const statusVal = statusColIndex ? String(row[statusColIndex - 1] || '').trim().toLowerCase() : '';
    const flagVal   = stopFlagIndex  ? String(row[stopFlagIndex - 1]  || '').trim().toLowerCase() : '';
    const followUpStatusVal = followUpStatusIndex ? String(row[followUpStatusIndex - 1] || '').trim().toLowerCase() : '';
    const followUpSuppressedVal = followUpSuppressedIndex ? String(row[followUpSuppressedIndex - 1] || '').trim().toLowerCase() : '';

    const flagged = isTruthyStopValue_(flagVal) || isTruthyStopValue_(followUpStatusVal) || isTruthyStopValue_(followUpSuppressedVal);
    const statusStops = STOP_STATUSES.has(normalizeStopStatus_(statusVal)) ||
      stoppedEmails.has(email.trim().toLowerCase());

    if (flagged || statusStops) {
      markFollowupsStopped_(leads, r, statusVal || followUpStatusVal || flagVal);
      // Log a skip once per run per lead (no stage)
      if (!sentSet.has(sentKey_(email, '-'))) {
        log.appendRow([
          new Date(), email, '-', name, zip,
          `SKIP: ${flagged ? 'flag=TRUE' : ''}${flagged && statusStops ? ' & ' : ''}${statusStops ? 'closed customer or matching email' : ''}; template=${FU_TEMPLATE_VERSION}`
        ]);
        sentSet.add(sentKey_(email, '-'));
      }
      continue;
    }

    // Lead age in whole days (local NY time)
    const ageDays = daysBetween_(when, new Date(), tz);

    // For each stage threshold, decide whether to send
    for (const stage of FU_STAGES) {
      if (ageDays < stage.days) continue; // not yet time
      const key = sentKey_(email, stage.key);
      if (sentSet.has(key)) continue;     // already sent previously

      // Send the stage email now
      try {
        const vehicle = [year, make, model].filter(Boolean).join(' ');
        const { subject, html, text } = renderFollowup_(stage.key, {
          name, email, phone, zip, vehicle
        });

        GmailApp.sendEmail(email, subject, text, {
          htmlBody: html,
          replyTo: FU_REPLY_TO,
          name: FU_BRAND
        });

        // Log it so we never resend
        log.appendRow([new Date(), email, stage.key, name, zip, `ageDays=${ageDays}; template=${FU_TEMPLATE_VERSION}`]);
        sentSet.add(key);
      } catch (err) {
        log.appendRow([new Date(), email, stage.key, name, zip, `ERROR: ${String(err)}`]);
      }
    }
  }
}

function diagnoseFollowupProject() {
  const triggers = ScriptApp.getProjectTriggers().map(function (trigger) {
    return {
      handler: trigger.getHandlerFunction(),
      event: String(trigger.getEventType()),
      id: trigger.getUniqueId()
    };
  });
  const details = {
    templateVersion: FU_TEMPLATE_VERSION,
    day3Subject: tplDay3_({ name: 'Preview', vehicle: 'sample vehicle' }).subject,
    triggers: triggers
  };
  Logger.log(JSON.stringify(details));
  return details;
}

/** ---- OPTIONAL: ad-hoc preview runner (does NOT write logs) ---- **/
function previewFollowupTo_(stageKey, toEmail) {
  const sample = {
    name: 'Jordan Driver',
    email: toEmail,
    phone: FU_SUPPORT_PHONE,
    zip: '23219',
    vehicle: '2020 Ford F-150'
  };
  const { subject, html, text } = renderFollowup_(stageKey, sample);
  GmailApp.sendEmail(toEmail, subject, text, {
    htmlBody: html,
    replyTo: FU_REPLY_TO,
    name: FU_BRAND
  });
  Logger.log(`Preview sent to ${toEmail} for stage ${stageKey}`);
}

/** ---- INTERNALS ---- **/
function buildSentSet_(logSheet) {
  const set = new Set();
  const vals = logSheet.getDataRange().getValues();
  for (let i = 2; i <= vals.length; i++) {
    const email = String(vals[i - 1][1] || '');
    const stage = String(vals[i - 1][2] || '');
    if (email && stage) set.add(sentKey_(email, stage));
  }
  return set;
}
function sentKey_(email, stage) {
  return `${email.toLowerCase()}|${stage}`;
}
function daysBetween_(start, end, tz) {
  if (!(start instanceof Date)) return 9999;
  const s = toMidnightLocal_(start, tz).getTime();
  const e = toMidnightLocal_(end, tz).getTime();
  return Math.floor((e - s) / 86400000);
}
function toMidnightLocal_(d, tz) {
  const fmt = Utilities.formatDate(d, tz, 'yyyy/MM/dd'); // strip time by re-parsing
  return new Date(fmt + ' 00:00:00');
}
function findHeaderIndexCaseInsensitive_(headers, name) {
  const n = String(name || '').trim().toLowerCase();
  for (let i = 0; i < headers.length; i++) {
    if (String(headers[i] || '').trim().toLowerCase() === n) return i + 1; // 1-based
  }
  return 0;
}
function findAnyHeaderCaseInsensitive_(headers, names) {
  const set = new Set((names || []).map(s => String(s || '').trim().toLowerCase()));
  for (let i = 0; i < headers.length; i++) {
    const h = String(headers[i] || '').trim().toLowerCase();
    if (set.has(h)) return i + 1;
  }
  return 0;
}
function normalizeStopStatus_(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}
function isTruthyStopValue_(value) {
  const normalized = normalizeStopStatus_(value);
  return ['true', 'yes', 'y', '1', 'stop', 'stopped', 'done', 'suppressed'].indexOf(normalized) !== -1;
}
function ensureHeaderColumn1_(sheet, displayName) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const wanted = String(displayName || '').trim().toLowerCase();
  for (let i = 0; i < headers.length; i++) {
    if (String(headers[i] || '').trim().toLowerCase() === wanted) return i + 1;
  }
  sheet.getRange(1, lastCol + 1).setValue(displayName);
  return lastCol + 1;
}
function markFollowupsStopped_(sheet, rowNumber, reason) {
  if (!sheet || !rowNumber) return;
  const stoppedAt = Utilities.formatDate(new Date(), 'America/New_York', 'yyyy-MM-dd h:mm a');
  const stopReason = 'Stopped by follow-up engine: ' + String(reason || 'closed lead/customer status');
  sheet.getRange(rowNumber, ensureHeaderColumn1_(sheet, 'Follow Up Status')).setValue('Stopped');
  sheet.getRange(rowNumber, ensureHeaderColumn1_(sheet, 'Follow Up Suppressed')).setValue('Yes');
  sheet.getRange(rowNumber, ensureHeaderColumn1_(sheet, 'Follow Up Stop Reason')).setValue(stopReason);
  sheet.getRange(rowNumber, ensureHeaderColumn1_(sheet, 'Follow Up Stopped At')).setValue(stoppedAt);
  sheet.getRange(rowNumber, ensureHeaderColumn1_(sheet, 'Next Follow Up')).setValue('');
  sheet.getRange(rowNumber, ensureHeaderColumn1_(sheet, 'Next Follow Up At')).setValue('');
}

/** ---- TEMPLATES (HTML + plaintext) ---- **/
function esc_(s) {
  return String(s || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function brandButton_(href, label, isSecondary) {
  const base = 'display:inline-block;text-decoration:none;padding:13px 18px;border-radius:12px;font-weight:800;font-size:14px;';
  if (isSecondary) {
    return `<a href="${href}" style="${base}border:1px solid #b9d5ff;color:#0b5cff;background:#ffffff;">${label}</a>`;
  }
  return `<a href="${href}" style="${base}background:#1677ff;color:#ffffff;box-shadow:0 12px 22px rgba(22,119,255,.24);">${label}</a>`;
}
function emailShell_(title, eyebrow, innerHtml) {
  return `
  <div style="margin:0;padding:28px;background:#eef5ff;font-family:Arial,'Segoe UI',Roboto,sans-serif;color:#10213d;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:22px;overflow:hidden;border:1px solid #d9e8ff;box-shadow:0 18px 44px rgba(10,38,86,.12);">
      <tr>
        <td style="padding:0;background:#071b3a;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:28px 28px 30px;background:linear-gradient(135deg,#06162f 0%,#0b3b84 62%,#1478ff 100%);">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;padding-right:18px;">
                      <div style="font-size:11px;letter-spacing:2.4px;text-transform:uppercase;color:#9fc8ff;font-weight:800;margin-bottom:8px;">${esc_(eyebrow || 'Apex Coverage')}</div>
                      <div style="font-size:28px;line-height:1.08;color:#ffffff;font-weight:900;margin:0;">${esc_(title || FU_BRAND)}</div>
                    </td>
                    <td style="vertical-align:middle;text-align:right;width:86px;">
                      <img src="${FU_LOGO_URL}" alt="Apex Coverage" width="68" style="width:68px;height:auto;display:inline-block;border:0;outline:none;text-decoration:none;">
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:30px 30px 26px;background:#ffffff;">
          ${innerHtml}
          <div style="margin-top:28px;padding-top:18px;border-top:1px solid #e5efff;font-size:13px;line-height:1.6;color:#5c6f8c;">
            Questions? Reply to this email, call <a href="tel:+18443982739" style="color:#0b5cff;text-decoration:none;font-weight:800;">${FU_SUPPORT_PHONE}</a>, or email <a href="mailto:${FU_SUPPORT_EMAIL}" style="color:#0b5cff;text-decoration:none;font-weight:800;">${FU_SUPPORT_EMAIL}</a>.<br>
            Apex Coverage | <a href="${FU_SITE_URL}" style="color:#0b5cff;text-decoration:none;font-weight:800;">driveapexcoverage.com</a>
          </div>
        </td>
      </tr>
    </table>
  </div>`;
}

// Stage renderers (your approved content)
function renderFollowup_(stageKey, ctx) {
  switch (stageKey) {
    case 'D1':  return tplDay1_(ctx);
    case 'D3':  return tplDay3_(ctx);
    case 'D7':  return tplDay7_(ctx);
    case 'D14': return tplDay14_(ctx);
    default:    return tplDay1_(ctx);
  }
}

function tplDay1_(c) {
  const subject = `Quick check-in on your quote - ${FU_BRAND}`;
  const vehicle = c.vehicle ? esc_(c.vehicle) : 'your vehicle';
  const html = emailShell_('Quick check-in on your quote', 'Your Apex quote is still open', `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#243a5e;">Hi <b>${esc_(c.name)}</b>, thanks again for requesting coverage information for <b>${vehicle}</b>.</p>
    <p style="margin:0 0 18px;font-size:16px;line-height:1.65;color:#243a5e;">If you want to move forward, we can usually finish the next step in just a few minutes. If anything changed, just reply and we will update the quote before you make a decision.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;border-collapse:separate;border-spacing:0;">
      <tr>
        <td style="padding:16px;border:1px solid #d9e8ff;background:#f5f9ff;border-radius:16px;">
          <div style="font-size:13px;text-transform:uppercase;letter-spacing:1.2px;color:#0b5cff;font-weight:900;margin-bottom:6px;">What happens next</div>
          <div style="font-size:15px;line-height:1.55;color:#243a5e;">Reply with questions, call us, or update your quote details. A real Apex team member will review the information before anything is finalized.</div>
        </td>
      </tr>
    </table>
    <div style="margin-top:22px;">
      ${brandButton_(FU_SITE_URL + '/quote', 'Update my quote', false)}
      <span style="display:inline-block;width:10px;"></span>
      ${brandButton_('tel:+18443982739', 'Call ' + FU_SUPPORT_PHONE, true)}
    </div>`);

  const text =
    `Quick check-in on your quote\n\n` +
    `Hi ${c.name}, thanks again for requesting a quote on your ${c.vehicle || 'vehicle'}.\n` +
    `If you would like to move forward, we can finish the next step in just a few minutes.\n\n` +
    `Reply here with any updates, or start a new quote if details have changed:\n${FU_SITE_URL}/quote\n\n` +
    `The Apex Coverage Team | ${FU_SUPPORT_PHONE} | quotes@driveapexcoverage.com\n`;

  return { subject, html, text };
}

function tplDay3_(c) {
  const subject = `A few ways to improve your quote - ${FU_BRAND}`;
  const vehicle = c.vehicle ? esc_(c.vehicle) : 'your vehicle';
  const html = emailShell_('A few ways to improve your quote', 'Still interested in coverage?', `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#243a5e;">Hi <b>${esc_(c.name)}</b>, we are still holding your quote information for <b>${vehicle}</b>.</p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#243a5e;">Before you decide, we can check for factors that may improve the quote or change the coverage options available to you.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-collapse:separate;border-spacing:0;">
      <tr>
        <td style="padding:16px;border:1px solid #d9e8ff;background:#f5f9ff;border-radius:16px;">
          <div style="font-size:13px;text-transform:uppercase;letter-spacing:1.2px;color:#0b5cff;font-weight:900;margin-bottom:10px;">Common items we can review</div>
          <div style="font-size:15px;line-height:1.75;color:#243a5e;">
            Multi-vehicle or bundle options<br>
            Safe driver, claims-free, or telematics details<br>
            Anti-theft, safety equipment, or garaging details<br>
            Autopay, paperless, or pay-in-full options
          </div>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 20px;font-size:16px;line-height:1.65;color:#243a5e;">If any of those apply, reply to this email and we will update the quote. Prefer a quick call? We can usually walk through it in about 10 minutes.</p>
    <div style="margin-top:22px;">
      ${brandButton_('tel:+18443982739', 'Call ' + FU_SUPPORT_PHONE, false)}
      <span style="display:inline-block;width:10px;"></span>
      ${brandButton_(FU_SITE_URL + '/quote', 'Update my details', true)}
    </div>`);

  const text =
    `A few ways to improve your quote\n\n` +
    `Hi ${c.name}, we are still holding your quote for the ${c.vehicle || 'vehicle'}.\n` +
    `Before you decide, here are common items we can review:\n` +
    `- Multi-vehicle or bundle options\n` +
    `- Safe driver, claims-free, or telematics details\n` +
    `- Anti-theft & safety equipment\n` +
    `- Pay-in-full or autopay\n` +
    `- Paperless billing\n\n` +
    `If any apply, reply to this email and we will update the quote.\n` +
    `Prefer a call? ${FU_SUPPORT_PHONE}\n\n` +
    `The Apex Coverage Team | quotes@driveapexcoverage.com | driveapexcoverage.com\n`;

  return { subject, html, text };
}

function tplDay7_(c) {
  const subject = `We are still holding your quote - ${FU_BRAND}`;
  const vehicle = c.vehicle ? esc_(c.vehicle) : 'your vehicle';
  const html = emailShell_('We are still holding your quote', 'One week follow-up', `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#243a5e;">Hi <b>${esc_(c.name)}</b>, it has been about a week since you requested a quote for <b>${vehicle}</b>.</p>
    <p style="margin:0 0 18px;font-size:16px;line-height:1.65;color:#243a5e;">Your information is still on file. If you are still comparing options, we can review the quote, answer questions, or update anything that has changed.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;border-collapse:separate;border-spacing:0;">
      <tr>
        <td style="padding:16px;border-left:4px solid #1677ff;background:#f5f9ff;border-radius:14px;">
          <div style="font-size:15px;line-height:1.65;color:#243a5e;">No pressure and no spam. The goal is simple: make sure the coverage fits your vehicle, budget, and actual driving situation before you move forward.</div>
        </td>
      </tr>
    </table>
    <div style="margin-top:22px;">
      ${brandButton_('tel:+18443982739', 'Talk to Apex', false)}
      <span style="display:inline-block;width:10px;"></span>
      ${brandButton_(FU_SITE_URL + '/quote', 'Update quote', true)}
    </div>`);

  const text =
    `We are still holding your quote\n\n` +
    `Hi ${c.name}, it has been about a week since you requested your quote for the ${c.vehicle || 'vehicle'}.\n` +
    `Your information is still on file. We can review the quote, answer questions, or update anything that changed.\n\n` +
    `Reply to this email or call us at ${FU_SUPPORT_PHONE}.\n\n` +
    `The Apex Coverage Team | quotes@driveapexcoverage.com | driveapexcoverage.com\n`;

  return { subject, html, text };
}

function tplDay14_(c) {
  const subject = `We are still here for you - ${FU_BRAND}`;
  const vehicle = c.vehicle ? esc_(c.vehicle) : 'your vehicle';
  const html = emailShell_('We are still here for you', 'Final quote follow-up', `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#243a5e;">Hi <b>${esc_(c.name)}</b>, we noticed you have not finished setting up coverage for <b>${vehicle}</b>. That is completely fine - life gets busy.</p>
    <p style="margin:0 0 18px;font-size:16px;line-height:1.65;color:#243a5e;">Your quote information is still on file, and our team can help you pick up where you left off if you still want to review options.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;border-collapse:separate;border-spacing:0;">
      <tr>
        <td style="padding:16px;border:1px solid #d9e8ff;background:#f5f9ff;border-radius:16px;">
          <div style="font-size:13px;text-transform:uppercase;letter-spacing:1.2px;color:#0b5cff;font-weight:900;margin-bottom:8px;">Quick reminder</div>
          <div style="font-size:15px;line-height:1.65;color:#243a5e;">Whether you bought a new vehicle, updated your build, moved, or simply want to double-check your options, Apex can help make the process clear and pressure-free.</div>
        </td>
      </tr>
    </table>
    <div style="margin-top:22px;">
      ${brandButton_(FU_SITE_URL + '/quote', 'Start my quote again', false)}
      <span style="display:inline-block;width:10px;"></span>
      ${brandButton_('tel:+18443982739', 'Call ' + FU_SUPPORT_PHONE, true)}
    </div>`);

  const text =
    `We are still here for you\n\n` +
    `Hi ${c.name}, we noticed you have not finished setting up coverage for ${c.vehicle || 'your vehicle'}.\n` +
    `Your quote information is still on file, and our team can help you pick up where you left off.\n\n` +
    `Start again: ${FU_SITE_URL}/quote\nCall us: ${FU_SUPPORT_PHONE}\n\n` +
    `The Apex Coverage Team | quotes@driveapexcoverage.com | driveapexcoverage.com\n`;

  return { subject, html, text };
}

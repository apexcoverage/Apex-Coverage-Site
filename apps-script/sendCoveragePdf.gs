/**
 * Apex Coverage - PDF packet email support
 *
 * Paste this into Code.gs, then add "sendcoveragepdf" to the secure agent
 * action list inside doPost and route it to agentSendCoveragePdf_(body).
 */

function coveragePdfEmailHtml_(args) {
  var name = args.name || 'Customer';
  var summary = args.summary || {};
  var siteUrl = typeof SITE_URL !== 'undefined'
    ? SITE_URL
    : 'https://www.driveapexcoverage.com';
  var supportEmail = typeof SUPPORT_FROM_EMAIL !== 'undefined'
    ? SUPPORT_FROM_EMAIL
    : 'support@driveapexcoverage.com';
  var supportPhone = '844-398-2739';

  return ''
    + '<div style="font-family:Segoe UI,Roboto,Arial,sans-serif;line-height:1.6;color:#222;background:#f7f7f7;padding:24px;">'
    + '<div style="max-width:640px;margin:auto;background:#fff;border:1px solid #eee;border-radius:12px;overflow:hidden;">'
    + '<div style="background:#cc0000;color:#fff;padding:18px 22px;font-weight:700;">Apex Coverage</div>'
    + '<div style="padding:24px;">'
    + '<p>Hi ' + esc(name) + ',</p>'
    + '<p>Welcome to Apex Coverage - your policy is now active.</p>'
    + '<p>Attached to this email, you will find your official policy documents, including your declarations page and proof of coverage.</p>'
    + '<p>Here is a quick summary of your coverage:</p>'
    + '<table cellpadding="6" cellspacing="0" width="100%" style="border-collapse:collapse;font-size:14px;">'
    + '<tr><td style="color:#555;width:150px;">Policy Number:</td><td><b>' + esc(summary.policyNumber || 'Pending confirmation') + '</b></td></tr>'
    + '<tr><td style="color:#555;">Effective Date:</td><td>' + esc(summary.effectiveDate || 'Pending confirmation') + '</td></tr>'
    + '<tr><td style="color:#555;">Vehicle(s):</td><td>' + esc(summary.vehicles || 'Vehicle schedule on file') + '</td></tr>'
    + '<tr><td style="color:#555;">Coverage:</td><td>' + esc(summary.coverage || 'Coverage on file') + '</td></tr>'
    + '<tr><td style="color:#555;">Deductibles:</td><td>' + esc(summary.deductibles || 'See attached policy documents') + '</td></tr>'
    + '</table>'
    + '<p>If you need to make any updates, add a vehicle, or have questions about your coverage, you can simply reply to this email and we will take care of it.</p>'
    + '<p>For immediate assistance, you can also call us at ' + esc(supportPhone) + '.</p>'
    + '<p>We appreciate the opportunity to protect what matters to you.</p>'
    + '<p style="margin-top:22px;">- The Apex Coverage Team<br/>'
    + '<a href="mailto:' + esc(supportEmail) + '">' + esc(supportEmail) + '</a><br/>'
    + '<a href="' + esc(siteUrl) + '">' + esc(siteUrl).replace(/^https?:\/\//, '') + '</a></p>'
    + '<p style="font-size:13px;color:#666;margin-top:24px;">Apex Coverage<br/>'
    + '<a href="' + esc(siteUrl) + '">' + esc(siteUrl) + '</a></p>'
    + '</div>'
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
  var documentLabel = documentType === 'build'
    ? 'Modified Vehicle Protection packet'
    : 'auto coverage packet';
  var customerName = safeString_(body.customerName) || 'Customer';
  var supportEmail = typeof SUPPORT_FROM_EMAIL !== 'undefined'
    ? SUPPORT_FROM_EMAIL
    : 'support@driveapexcoverage.com';
  var supportPhone = '844-398-2739';
  var subject = 'Your Apex Coverage policy documents';
  var text =
    'Hi ' + customerName + ',\n\n' +
    'Welcome to Apex Coverage - your policy is now active.\n\n' +
    'Attached to this email, you will find your official policy documents, including your declarations page and proof of coverage.\n\n' +
    'Here is a quick summary of your coverage:\n\n' +
    'Policy Number: ' + safeString_(summary.policyNumber || 'Pending confirmation') + '\n' +
    'Effective Date: ' + safeString_(summary.effectiveDate || 'Pending confirmation') + '\n' +
    'Vehicle(s): ' + safeString_(summary.vehicles || 'Vehicle schedule on file') + '\n' +
    'Coverage: ' + safeString_(summary.coverage || 'Coverage on file') + '\n' +
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

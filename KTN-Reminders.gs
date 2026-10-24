/**
 * KTN Class Reminders — free automatic email reminders ~1 hour before class.
 *
 * Add this as a NEW script file in the SAME Apps Script project as
 * KTN-DriveUploader.gs (it runs as ktndigitalonlineschool@gmail.com, so it can
 * send email). It reads the live student list from Firestore using a service
 * account, matches it to the weekly schedule below, and emails that grade's
 * parents about an hour before each class.
 *
 * ── ONE-TIME SETUP ───────────────────────────────────────────────────────
 * 1. Firebase console → Project settings (gear) → "Service accounts" tab →
 *    "Generate new private key" → a .json file downloads.
 * 2. Open that .json and copy two values into CONFIG below:
 *       "client_email"  → SERVICE_ACCOUNT_EMAIL
 *       "private_key"   → PRIVATE_KEY  (paste the whole value, keep the \n's)
 * 3. Set PROJECT_ID to your Firebase project id ("ktn-digital-school").
 * 4. Run  testReminders  once (Run ▸ testReminders). Approve permissions when
 *    asked. It logs who WOULD be emailed right now — nothing is sent.
 * 5. Run  installReminderTrigger  once. This makes it check every 30 minutes,
 *    forever. Done — no deployment needed for reminders.
 * ─────────────────────────────────────────────────────────────────────────
 */

var CONFIG = {
  PROJECT_ID: "ktn-digital-school",
  SERVICE_ACCOUNT_EMAIL: "PASTE-client_email-HERE",
  PRIVATE_KEY: "PASTE-private_key-HERE",   // -----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
  APP_URL: "https://ktn-digital-school.vercel.app",  // your live app URL
  TIMEZONE: "Asia/Seoul",                  // class times are in this zone
  LEAD_MINUTES: 60,                        // remind ~this long before class
  TEST_EMAIL: "saraswathi86@gmail.com",    // sendTestNow() mails ONLY this address
};

// Teachers who want their own reminder: "Name as in the schedule": "email".
// Leave empty to skip teacher emails. Parents are always emailed.
var TEACHER_EMAILS = {
  "Saraswathi": "saraswathi86@gmail.com",
};

// Weekly schedule: [grade, subject, teacher, day(Sun..Sat), start time].
// ⚠️ TRIAL MODE: only Grade 3 English is active. Un-comment the rest to go live
// for every class. Edit any row if a class time changes.
var SCHEDULE = [
  ["Grade 3", "English", "Saraswathi", "Mon", "7:40 PM"],
  // ["Grade 1", "English", "Tejaswi", "Thu", "6:00 PM"],
  // ["Grade 1", "Maths", "Sasikala", "Fri", "6:00 PM"],
  // ["Grade 2", "English", "Saisree", "Wed", "7:00 PM"],
  // ["Grade 2", "Maths", "Karpagam", "Thu", "7:00 PM"],
  // ["Grade 2", "EVS", "Susmita", "Mon", "7:30 PM"],
  // ["Grade 3", "Maths", "Nivedha", "Tue", "7:30 PM"],
  // ["Grade 3", "Science", "Vemula", "Sun", "7:00 PM"],
  // ["Grade 4", "English", "Ramya", "Wed", "8:00 PM"],
  // ["Grade 4", "Maths", "Yashi", "Tue", "5:00 PM"],
  // ["Grade 4", "Science", "Karpagam", "Mon", "7:30 PM"],
  // ["Grade 5", "English", "Divyanshi", "Mon", "7:30 PM"],
  // ["Grade 5", "Maths", "Yuthika", "Thu", "6:00 PM"],
  // ["Grade 5", "Science", "Sunitha Srinath", "Tue", "7:30 PM"],
  // ["Grade 6", "English", "Divyanshi", "Wed", "8:00 PM"],
  // ["Grade 6", "Maths", "KhilKhil Ghosal", "Tue", "7:30 PM"],
  // ["Grade 6", "Science", "Prajwala", "Thu", "8:00 PM"],
  // ["Grade 7", "English", "Sunitha Srinath", "Wed", "7:30 PM"],
  // ["Grade 7", "Social Science", "Susithra", "Thu", "7:30 PM"],
  // ["Grade 7", "Maths", "Kavi", "Tue", "7:30 PM"],
  // ["Grade 7", "Science", "Neetu Saini", "Fri", "6:00 PM"],
];

// ── Trigger installer (run once) ──────────────────────────────────────────
function installReminderTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "sendClassReminders") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("sendClassReminders").timeBased().everyMinutes(30).create();
  Logger.log("Reminder trigger installed — checks every 30 minutes.");
}

// ── The job that runs every 30 min ────────────────────────────────────────
function sendClassReminders() {
  var tz = CONFIG.TIMEZONE, now = new Date();
  var dow = Utilities.formatDate(now, tz, "EEE");          // Mon..Sun
  var today = Utilities.formatDate(now, tz, "yyyy-MM-dd");
  var props = PropertiesService.getScriptProperties();
  var token = getAccessToken_();
  var students = fsListAll_(token, "students");

  SCHEDULE.forEach(function (row) {
    var grade = row[0], subject = row[1], teacher = row[2], day = row[3], time = row[4];
    if (day !== dow) return;
    var mins = minutesUntil_(now, tz, time);
    // Send once in the 30-min window around LEAD_MINUTES before start.
    if (!(mins > CONFIG.LEAD_MINUTES - 15 && mins <= CONFIG.LEAD_MINUTES + 15)) return;
    var key = "sent:" + today + ":" + grade + ":" + subject;
    if (props.getProperty(key)) return;

    var emails = recipientsForGrade_(students, grade);
    if (TEACHER_EMAILS[teacher]) emails.push(TEACHER_EMAILS[teacher]);
    emails = dedupe_(emails);
    if (emails.length) sendReminderEmail_(emails, { grade: grade, subject: subject, teacher: teacher, time: time });
    props.setProperty(key, emails.length ? ("sent " + emails.length) : "no-recipients");
  });
}

// ── Test helpers ──────────────────────────────────────────────────────────
// Logs who would be emailed for every class today, ignoring the time window.
function testReminders() {
  var tz = CONFIG.TIMEZONE, now = new Date();
  var dow = Utilities.formatDate(now, tz, "EEE");
  var token = getAccessToken_();
  var students = fsListAll_(token, "students");
  Logger.log("Today is " + dow + ". Students read from Firestore: " + students.length);
  SCHEDULE.filter(function (r) { return r[3] === dow; }).forEach(function (r) {
    var emails = recipientsForGrade_(students, r[0]);
    Logger.log(r[0] + " · " + r[1] + " (" + r[4] + ") → " + emails.length + " parent email(s): " + emails.join(", "));
  });
}
// Force-send ONE real reminder now — ONLY to CONFIG.TEST_EMAIL, never parents.
// Use this to confirm emails actually arrive before going live.
function sendTestNow() {
  if (!CONFIG.TEST_EMAIL) { Logger.log("Set CONFIG.TEST_EMAIL first."); return; }
  sendReminderEmail_([CONFIG.TEST_EMAIL], { grade: "Grade 3", subject: "English", teacher: "Saraswathi", time: "soon (test)" });
  Logger.log("Test reminder sent only to " + CONFIG.TEST_EMAIL);
}

// ── Recipients ────────────────────────────────────────────────────────────
function recipientsForGrade_(students, grade) {
  var out = [];
  students.forEach(function (s) {
    var g = fv_(s.grade), email = fv_(s.email), status = String(fv_(s.status) || "").toLowerCase();
    if (g === grade && email && status !== "archived" && status !== "left") out.push(email);
  });
  return out;
}
function dedupe_(a) { var seen = {}, out = []; a.forEach(function (e) { e = String(e || "").trim(); if (e && !seen[e]) { seen[e] = 1; out.push(e); } }); return out; }

// ── Email ─────────────────────────────────────────────────────────────────
function sendReminderEmail_(emails, c) {
  var subject = "Reminder: " + c.subject + " (" + c.grade + ") starts at " + c.time;
  var inner =
    '<p>Dear Parent,</p>' +
    '<p>This is a friendly reminder that your child\'s <b>' + c.subject + '</b> class for <b>' + c.grade +
    '</b> starts at <b>' + c.time + '</b> today' + (c.teacher ? ' with <b>' + c.teacher + '</b>' : '') + '.</p>' +
    '<p>Please open the app a few minutes early to join:</p>' +
    '<p><a href="' + CONFIG.APP_URL + '" style="display:inline-block;background:#2F80ED;color:#fff;text-decoration:none;padding:11px 20px;border-radius:10px;font-weight:700">Open the KTN app</a></p>' +
    '<p style="margin-top:16px">See you in class!<br/>The KTN Team</p>';
  var body = "Reminder: " + c.subject + " for " + c.grade + " starts at " + c.time + " today. Open the app: " + CONFIG.APP_URL;
  // BCC everyone so recipients don't see each other's addresses.
  MailApp.sendEmail({
    to: "ktndigitalonlineschool@gmail.com",
    bcc: emails.join(","),
    subject: subject,
    htmlBody: shell_(inner),
    body: body,
    name: "KTN Digital Online School",
  });
}
function shell_(inner) {
  return '<div style="font-family:Arial,Helvetica,sans-serif;background:#f2f7fc;padding:24px">' +
    '<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4eaf5">' +
    '<div style="background:linear-gradient(135deg,#1B327E,#2F80ED);padding:22px 24px;color:#fff">' +
    '<div style="font-size:19px;font-weight:800">KTN Digital Online School</div>' +
    '<div style="font-size:12px;color:#FFD79A;font-weight:700;margin-top:4px">Education for Free! Education for All!</div></div>' +
    '<div style="padding:24px;color:#16233A;font-size:14px;line-height:1.6">' + inner + '</div>' +
    '<div style="padding:14px 24px;background:#f7fafe;color:#8b98ac;font-size:11px;text-align:center">Korea Tamil Nanbargal · Free Indian CBSE online school</div></div></div>';
}

// ── Time ──────────────────────────────────────────────────────────────────
function minutesUntil_(now, tz, timeStr) {
  var m = String(timeStr).match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return -9999;
  var hh = (parseInt(m[1], 10) % 12) + (/pm/i.test(m[3]) ? 12 : 0);
  var mm = parseInt(m[2], 10);
  var curH = parseInt(Utilities.formatDate(now, tz, "H"), 10);
  var curM = parseInt(Utilities.formatDate(now, tz, "m"), 10);
  return (hh * 60 + mm) - (curH * 60 + curM);
}

// ── Firestore (service-account REST read) ─────────────────────────────────
function getAccessToken_() {
  var now = Math.floor(Date.now() / 1000);
  var header = b64url_(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  var claim = b64url_(JSON.stringify({
    iss: CONFIG.SERVICE_ACCOUNT_EMAIL,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
  }));
  var toSign = header + "." + claim;
  var key = CONFIG.PRIVATE_KEY.replace(/\\n/g, "\n");
  var sig = Utilities.computeRsaSha256Signature(toSign, key);
  var jwt = toSign + "." + b64url_(sig);
  var res = UrlFetchApp.fetch("https://oauth2.googleapis.com/token", {
    method: "post",
    payload: { grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt },
    muteHttpExceptions: true,
  });
  var out = JSON.parse(res.getContentText());
  if (!out.access_token) throw new Error("Auth failed: " + res.getContentText());
  return out.access_token;
}
function fsListAll_(token, collection) {
  var base = "https://firestore.googleapis.com/v1/projects/" + CONFIG.PROJECT_ID +
    "/databases/(default)/documents/" + collection;
  var out = [], pageToken = "";
  do {
    var url = base + "?pageSize=300" + (pageToken ? "&pageToken=" + encodeURIComponent(pageToken) : "");
    var res = UrlFetchApp.fetch(url, { headers: { Authorization: "Bearer " + token }, muteHttpExceptions: true });
    var data = JSON.parse(res.getContentText());
    if (data.error) throw new Error("Firestore read failed: " + data.error.message);
    (data.documents || []).forEach(function (d) { out.push(d.fields || {}); });
    pageToken = data.nextPageToken || "";
  } while (pageToken);
  return out;
}
function fv_(f) {
  if (!f) return "";
  if (f.stringValue !== undefined) return f.stringValue;
  if (f.integerValue !== undefined) return f.integerValue;
  if (f.booleanValue !== undefined) return f.booleanValue;
  if (f.arrayValue !== undefined) return (f.arrayValue.values || []).map(fv_);
  return "";
}
function b64url_(data) {
  return Utilities.base64EncodeWebSafe(data).replace(/=+$/, "");
}

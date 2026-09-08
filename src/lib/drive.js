// Uploads files to the school's Google Drive via the Apps Script backend.
// If the endpoint isn't configured, hasDrive is false and the app falls back
// to paste-a-link. Files never touch Firebase, only the returned links do.

const ENDPOINT = import.meta.env.VITE_DRIVE_ENDPOINT;
const TOKEN = import.meta.env.VITE_DRIVE_TOKEN || "";

export const hasDrive = Boolean(ENDPOINT);

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// folder: e.g. "Grade 3" or "Submissions/Grade 3". Returns
// { fileId, name, viewUrl, openUrl, downloadUrl }.
export async function uploadToDrive(folder, file, nameOverride) {
  if (!hasDrive) throw new Error("Drive upload isn't set up yet.");
  const dataBase64 = await fileToBase64(file);
  const name = nameOverride || file.name;
  // text/plain avoids a CORS preflight to Apps Script
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "upload", token: TOKEN, folder, name, mime: file.type || "application/octet-stream", dataBase64 }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Upload failed");
  return json;
}

// Sends a short notification email to the school via the Apps Script backend.
// Best-effort: never blocks or breaks the form submission if it fails.
export async function notifySchool(subject, body) {
  if (!hasDrive) return false;
  try {
    await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "notify", token: TOKEN, subject, body }),
    });
    return true;
  } catch (e) { return false; }
}

// ---- Email via the Apps Script backend (school-controlled templates) ----
function appUrl() {
  return import.meta.env.VITE_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
}
async function sendMail(to, subject, body, html) {
  if (!hasDrive || !to) return false;
  try {
    await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "notify", token: TOKEN, to, subject, body, html }),
    });
    return true;
  } catch (e) { return false; }
}

function shell(inner) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;background:#f2f7fc;padding:24px">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4eaf5">
      <div style="background:linear-gradient(135deg,#1B327E,#2F80ED);padding:22px 24px;color:#fff">
        <div style="font-size:19px;font-weight:800">KTN Digital Online School</div>
        <div style="font-size:12px;color:#FFD79A;font-weight:700;margin-top:4px">Education for Free! Education for All!</div>
      </div>
      <div style="padding:24px;color:#16233A;font-size:14px;line-height:1.6">${inner}</div>
      <div style="padding:14px 24px;background:#f7fafe;color:#8b98ac;font-size:11px;text-align:center">Korea Tamil Nanbargal · Free Indian CBSE online school · Since 2019</div>
    </div>
  </div>`;
}

// Sent to a parent when their child is enrolled / invited.
export async function sendWelcomeMail({ toEmail, toName, rollNumber, grade }) {
  const name = toName || "Parent";
  const url = appUrl();
  const inner = `
    <p>Dear ${name},</p>
    <p><b>Thank you for choosing KTN Digital Online School.</b> We're delighted to welcome your child to our family. KTN is a completely free, volunteer-run Indian CBSE online school, and we're so happy to have you with us.</p>
    <div style="background:#EAF1FF;border-radius:12px;padding:14px 16px;margin:16px 0">
      <div style="font-weight:700;color:#1B327E;margin-bottom:6px">Your child's details</div>
      <div>Roll number: <b>${rollNumber || "-"}</b></div>
      <div>Class: <b>${grade || "-"}</b></div>
      <div>Sign-in email: <b>${toEmail}</b></div>
    </div>
    <div style="background:#FFF6E9;border:1px solid #F3E2C4;border-radius:12px;padding:14px 16px;margin:16px 0;color:#8A5A12">
      <b>📩 Please note:</b> A separate email titled <b>"Reset your password"</b> will arrive shortly with a secure link to set your password.
      If you don't see it in a few minutes, please <b>check your Spam / Junk folder</b> and mark it <b>"Not spam."</b>
    </div>
    <p>Once you've set your password, sign in any time here:</p>
    <p><a href="${url}" style="display:inline-block;background:#2F80ED;color:#fff;text-decoration:none;padding:11px 20px;border-radius:10px;font-weight:700">Open the KTN app</a></p>
    <p style="margin-top:18px">Warm regards,<br/>The KTN Team</p>`;
  return sendMail(toEmail, "Welcome to KTN Digital Online School 🎉", `Welcome to KTN Digital Online School. Roll number: ${rollNumber || "-"}, Class: ${grade || "-"}, Sign-in email: ${toEmail}. A separate "Reset your password" email will arrive shortly — please check your Spam folder if you don't see it. Sign in at ${url}`, shell(inner));
}

// Sent to an applicant when they submit the Apply form.
export async function sendApplicantConfirmation({ toEmail, toName, grade }) {
  const name = toName || "Parent";
  const inner = `
    <p>Dear ${name},</p>
    <p><b>Thank you for applying to KTN Digital Online School.</b> We've received your application${grade ? ` for <b>${grade}</b>` : ""}, and our volunteer team will review it carefully.</p>
    <p>We'll get back to you soon. If your child is accepted, you'll receive a welcome email with the next steps.</p>
    <p style="color:#6B7A90;font-size:13px">KTN is a completely free, community-run online school — there are no fees at any stage.</p>
    <p style="margin-top:18px">Warm regards,<br/>The KTN Team</p>`;
  return sendMail(toEmail, "We've received your application 🌸", `Thank you for applying to KTN Digital Online School. We've received your application${grade ? ` for ${grade}` : ""} and our team will review it. We'll get back to you soon.`, shell(inner));
}

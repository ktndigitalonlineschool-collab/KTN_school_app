// Optional custom welcome email (EmailJS) — free, no backend.
//
// If the three VITE_EMAILJS_* keys are set in .env, we send a branded welcome
// email that includes the student's roll number. This is SEPARATE from the
// secure "set your password" link, which Firebase sends on its own.
// If the keys are absent, hasEmail is false and only Firebase's email goes out.

import emailjs from "@emailjs/browser";

const SID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PK = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export const hasEmail = Boolean(SID && TID && PK);

export async function sendWelcomeEmail({ toEmail, toName, rollNumber, grade }) {
  if (!hasEmail) return false;
  const appUrl = import.meta.env.VITE_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
  await emailjs.send(SID, TID, {
    to_email: toEmail,
    to_name: toName || "Parent",
    roll_number: rollNumber || "",
    grade: grade || "",
    login_email: toEmail,
    app_url: appUrl,
    school_name: "KTN Digital Online School",
  }, { publicKey: PK });
  return true;
}

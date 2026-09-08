// Uploads files to the school's Google Drive via the Apps Script backend.
// If the endpoint isn't configured, hasDrive is false and the app falls back
// to paste-a-link. Files never touch Firebase — only the returned links do.

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

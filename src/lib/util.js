export function fmtDate(d) {
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return d;
  }
}

export function prefersReducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

// A class cancellation is active only on the day the teacher set it, then
// auto-clears (the join link returns) the next day.
export function classCancelledToday(cl) {
  if (!cl || !cl.cancelled) return false;
  const today = new Date().toISOString().slice(0, 10);
  return (cl.cancelledOn || "") === today;
}

// Roll numbers are whole numbers, but spreadsheets can store them as "19283.0".
// Strip a trailing ".0" (or ".00") so they always read cleanly.
export function normRoll(v) {
  if (v == null || v === "") return "";
  const s = String(v).trim();
  const m = s.match(/^(\d+)(?:\.0+)?$/);
  return m ? m[1] : s;
}

// Academic year label from a date, e.g. Jun 2026 -> "2026-27".
// Academic year is assumed to start in April (India/CBSE style).
export function academicYear(d = new Date()) {
  const y = d.getFullYear();
  const startYear = d.getMonth() >= 3 ? y : y - 1; // Apr..Dec -> this year; Jan..Mar -> previous
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

// Build the Drive folder path for a worksheet or a student submission.
// kind: "Assignments" | "Student Work". dateStr: due date "YYYY-MM-DD" (or blank -> today).
export function driveFolderPath(grade, subject, kind, dateStr) {
  const day = (dateStr && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) ? dateStr.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const safe = (s) => String(s || "").replace(/[\/\\]/g, "-").trim() || "General";
  return [academicYear(), safe(grade), safe(subject), kind, day].join("/");
}

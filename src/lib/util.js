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

// Builds and downloads a calendar (.ics) event for a weekly class so the
// phone's own calendar can remind the student (e.g. 15 min before).
export function addClassToCalendar({ subject, teacher, day, time, link }) {
  const DAY = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const parseT = (t) => {
    const m = (t || "").match(/(\d{1,2})[:.]?(\d{2})?\s*(am|pm|AM|PM)?/);
    if (!m) return null;
    let h = parseInt(m[1], 10); const min = m[2] ? parseInt(m[2], 10) : 0;
    const ap = (m[3] || "").toLowerCase();
    if (ap === "pm" && h < 12) h += 12; if (ap === "am" && h === 12) h = 0;
    return { h, min };
  };
  const first = (time || "").split(/[-–]/)[0].trim();
  const start = parseT(first); if (start == null) return;
  // next occurrence of that weekday
  const now = new Date();
  const target = DAY[day]; let d = new Date(now);
  let diff = (target - now.getDay() + 7) % 7;
  d.setDate(now.getDate() + diff); d.setHours(start.h, start.min, 0, 0);
  if (d < now) d.setDate(d.getDate() + 7);
  const end = new Date(d.getTime() + 60 * 60 * 1000);
  const fmt = (x) => x.getFullYear() + String(x.getMonth() + 1).padStart(2, "0") + String(x.getDate()).padStart(2, "0") + "T" + String(x.getHours()).padStart(2, "0") + String(x.getMinutes()).padStart(2, "0") + "00";
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//KTN//Class//EN",
    "BEGIN:VEVENT",
    "UID:" + Date.now() + "@ktn",
    "DTSTART:" + fmt(d), "DTEND:" + fmt(end),
    "RRULE:FREQ=WEEKLY",
    "SUMMARY:" + (subject || "KTN Class") + " — KTN",
    "DESCRIPTION:" + (teacher ? "Teacher: " + teacher + "\\n" : "") + (link ? "Join: " + link : ""),
    link ? "URL:" + link : "",
    "BEGIN:VALARM", "TRIGGER:-PT1H", "ACTION:DISPLAY", "DESCRIPTION:Class in 1 hour", "END:VALARM",
    "BEGIN:VALARM", "TRIGGER:-PT15M", "ACTION:DISPLAY", "DESCRIPTION:Class in 15 minutes", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = document.createElement("a"); a.href = url; a.download = (subject || "class").replace(/\s+/g, "-") + ".ics";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

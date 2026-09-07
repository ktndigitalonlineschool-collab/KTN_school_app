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

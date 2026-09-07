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

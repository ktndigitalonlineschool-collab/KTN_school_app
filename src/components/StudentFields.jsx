import { GRADES, GENDERS, EXTRA_CURRICULUM } from "../data/school";

export const EMPTY_STUDENT = {
  name: "", nationality: "", gender: GENDERS[0], dob: "", location: "",
  emergencyContact: "", postalAddress: "", grade: GRADES[0], extra: [],
  fatherName: "", motherName: "", mobile: "", email: "", comments: "",
};

function SubHead({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "18px 0 12px" }}>
      <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 13.5, color: "var(--azure)" }}>{children}</span>
      <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 2 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", display: "block", margin: "2px 0 6px" }}>{label}</label>
      {children}
    </div>
  );
}

// All student-information inputs, grouped into friendly sections.
export default function StudentFields({ form, setForm }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleExtra = (opt) =>
    setForm((f) => ({ ...f, extra: f.extra.includes(opt) ? f.extra.filter((x) => x !== opt) : [...f.extra, opt] }));

  return (
    <>
      <SubHead>👦 Student details</SubHead>
      <Field label="Full name *"><input className="input" value={form.name} onChange={set("name")} placeholder="Student's full name" /></Field>
      <Field label="Nationality"><input className="input" value={form.nationality} onChange={set("nationality")} placeholder="e.g. Indian" /></Field>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Gender"><select className="input" value={form.gender} onChange={set("gender")}>{GENDERS.map((g) => <option key={g}>{g}</option>)}</select></Field></div>
        <div style={{ flex: 1 }}><Field label="Date of birth"><input className="input" type="date" value={form.dob} onChange={set("dob")} /></Field></div>
      </div>
      <Field label="Present location / country"><input className="input" value={form.location} onChange={set("location")} placeholder="e.g. Seoul, South Korea" /></Field>

      <SubHead>📚 Class &amp; interests</SubHead>
      <Field label="Regular class *">
        <select className="input" value={form.grade} onChange={set("grade")}>
          {GRADES.map((g) => <option key={g}>{g}</option>)}
          <option value="Extra only">Special classes only (no regular grade)</option>
        </select>
      </Field>
      <Field label="Extra-curriculum (choose any)">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 6 }}>
          {EXTRA_CURRICULUM.map((opt) => {
            const on = form.extra.includes(opt);
            return (
              <button key={opt} type="button" onClick={() => toggleExtra(opt)}
                style={{ cursor: "pointer", borderRadius: 999, padding: "6px 11px", fontSize: 11.5, fontWeight: 700,
                  border: "1.5px solid " + (on ? "var(--azure)" : "var(--line)"), background: on ? "var(--azure)" : "#fff", color: on ? "#fff" : "var(--inkSoft)" }}>
                {on ? "✓ " : ""}{opt}
              </button>
            );
          })}
        </div>
      </Field>

      <SubHead>👨‍👩‍👧 Family &amp; contact</SubHead>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Father's full name"><input className="input" value={form.fatherName} onChange={set("fatherName")} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Mother's full name"><input className="input" value={form.motherName} onChange={set("motherName")} /></Field></div>
      </div>
      <Field label="Mobile number *"><input className="input" inputMode="tel" value={form.mobile} onChange={set("mobile")} placeholder="+82 10-0000-0000" /></Field>
      <Field label="Emergency contact number"><input className="input" inputMode="tel" value={form.emergencyContact} onChange={set("emergencyContact")} placeholder="+82 10-0000-0000" /></Field>
      <Field label="Email address *"><input className="input" type="email" value={form.email} onChange={set("email")} placeholder="you@email.com" /></Field>
      <Field label="Postal address"><textarea className="input" rows={2} style={{ resize: "vertical" }} value={form.postalAddress} onChange={set("postalAddress")} placeholder="Full postal address" /></Field>
      <Field label="Comments or suggestions"><textarea className="input" rows={2} style={{ resize: "vertical" }} value={form.comments} onChange={set("comments")} placeholder="Anything you'd like us to know (optional)" /></Field>
    </>
  );
}

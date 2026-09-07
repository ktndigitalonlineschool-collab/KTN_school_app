import { useState } from "react";
import Icon from "../data/icons.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import StudentFields, { EMPTY_STUDENT } from "../components/StudentFields.jsx";
import Mascot from "../components/Mascot.jsx";

// The single admission form. Collects the full registration up front so the
// student record is complete on Accept. (After login, a parent can update only
// a few contact fields; identity fields stay frozen.)
export default function Apply({ onSubmit }) {
  const [f, setF] = useState(EMPTY_STUDENT);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [lastName, setLastName] = useState("");

  async function submit() {
    const need = [];
    if (!f.name.trim()) need.push("full name");
    if (!f.gender) need.push("gender");
    if (!f.dob) need.push("date of birth");
    if (!f.grade) need.push("class");
    if (!f.mobile.trim()) need.push("mobile number");
    if (!f.email.trim()) need.push("email address");
    if (!f.fatherName.trim() && !f.motherName.trim()) need.push("a parent's name");
    if (need.length) { setErr("Please fill in: " + need.join(", ") + "."); return; }
    setErr(""); setBusy(true);
    try {
      await onSubmit({
        ...f,
        name: f.name.trim(),
        student: f.name.trim(),
        parent: (f.fatherName || f.motherName || "").trim(),
        phone: f.mobile.trim(),
        message: f.comments.trim(),
        date: new Date().toISOString(),
      });
      setLastName(f.name.trim());
      setF(EMPTY_STUDENT);
      setDone(true);
    } finally { setBusy(false); }
  }

  if (done) {
    return (
      <div style={{ paddingTop: 30, textAlign: "center" }}>
        <Mascot size={96} className="mascot-float" style={{ margin: "0 auto 12px" }} />
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 21, fontWeight: 800, color: "var(--ink)", margin: "0 0 8px" }}>Application received</h2>
        <p className="para" style={{ maxWidth: 300, margin: "0 auto 22px" }}>
          Thank you! Our volunteer team will review {lastName}'s application. Once accepted, you'll get an email with a link to set your password and sign in. Remember — KTN is completely free.
        </p>
        <button className="btnP" onClick={() => setDone(false)} style={{ margin: "0 auto" }}>Submit another application</button>
      </div>
    );
  }

  return (
    <>
      <SectionTitle eyebrow="Admissions" title="Apply — it's free" />
      <p className="para" style={{ margin: "-6px 0 12px" }}>
        Fill in your child's details to apply. Fields marked * are required. After the school accepts the application, you'll receive an email to set your password and access the portal.
      </p>
      <div className="card" style={{ padding: 16 }}>
        <StudentFields form={f} setForm={setF} />
        {err && <div style={{ color: "#FF6B5E", fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>{err}</div>}
        <p style={{ fontSize: 11.5, color: "var(--inkSoft)", lineHeight: 1.45, margin: "2px 0 12px" }}>
          By submitting, you agree we may contact you about admission. We only use this information to run the school.
        </p>
        <button className="btnP" onClick={submit} disabled={busy} style={{ width: "100%", justifyContent: "center", opacity: busy ? 0.7 : 1 }}>
          <Icon name="send" size={16} color="#fff" sw={2.4} /> {busy ? "Submitting…" : "Submit application"}
        </button>
      </div>
      <div style={{ height: 8 }} />
    </>
  );
}

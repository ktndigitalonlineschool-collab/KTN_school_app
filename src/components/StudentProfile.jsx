import { useState, useEffect } from "react";
import Icon from "../data/icons.jsx";
import ImagePicker from "./ImagePicker.jsx";
import { GENDERS, EXTRA_CURRICULUM } from "../data/school";
import { normRoll } from "../lib/util";
import * as store from "../lib/store";

const EDITABLE = ["name", "nationality", "gender", "dob", "location", "emergencyContact",
  "postalAddress", "extra", "fatherName", "motherName", "mobile", "email", "comments", "photo"];

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 2 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", display: "block", margin: "8px 0 6px" }}>{label}</label>
      {children}
    </div>
  );
}
function Locked({ label, value }) {
  return (
    <div style={{ flex: 1 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", display: "block", margin: "8px 0 6px" }}>{label} <span style={{ color: "var(--inkSoft)", fontWeight: 600 }}>· locked</span></label>
      <div className="input" style={{ background: "#F1F4F9", color: "var(--inkSoft)", display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name="lock" size={13} color="#9AA7BE" /> {value || "—"}
      </div>
    </div>
  );
}

export default function StudentProfile({ user }) {
  const [rec, setRec] = useState(undefined); // undefined = loading, null = none
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let live = true;
    store.getStudent(user.id).then((r) => { if (live) { setRec(r); if (r) setForm(r); } }).catch(() => setRec(null));
    return () => { live = false; };
  }, [user.id]);

  if (rec === undefined) return <div className="card" style={{ padding: 16, color: "var(--inkSoft)", fontSize: 13 }}>Loading your profile…</div>;
  if (!rec) return <div className="card" style={{ padding: 16, color: "var(--inkSoft)", fontSize: 13 }}>Your profile will appear here once your account is fully set up by the school.</div>;

  const frozen = rec.frozen === true;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleExtra = (opt) => setForm((f) => {
    const cur = Array.isArray(f.extra) ? f.extra : [];
    return { ...f, extra: cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt] };
  });

  async function save() {
    setBusy(true); setMsg("");
    try {
      const patch = {};
      EDITABLE.forEach((k) => { if (form[k] !== undefined) patch[k] = form[k]; });
      if (frozen) { delete patch.name; delete patch.dob; } // safety: never send locked identity when frozen
      await store.updateStudent(user.id, patch);
      setRec((r) => ({ ...r, ...patch }));
      setEditing(false); setMsg("Saved ✓"); setTimeout(() => setMsg(""), 2000);
    } catch (e) { setMsg(e.message || "Could not save."); }
    finally { setBusy(false); }
  }

  const photo = (editing ? form.photo : rec.photo) || "";
  const extra = Array.isArray((editing ? form : rec).extra) ? (editing ? form : rec).extra : [];

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {photo
          ? <img src={photo} alt={rec.name} style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
          : <div style={{ width: 60, height: 60, borderRadius: 18, background: "linear-gradient(140deg,#F5921E,#FBB03B)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 20, flexShrink: 0 }}>{(rec.name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("")}</div>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 16 }}>{rec.name}</div>
          <div style={{ fontSize: 12, color: "var(--inkSoft)" }}>Roll {normRoll(rec.rollNumber || rec.code)} · {rec.grade || "—"}</div>
        </div>
        {!editing && <button className="btnP" onClick={() => { setForm(rec); setEditing(true); }} style={{ padding: "8px 14px", fontSize: 13 }}><Icon name="edit" size={14} color="#fff" /> Edit</button>}
      </div>

      {msg && <div style={{ color: "#1E7A45", fontWeight: 700, fontSize: 13, marginTop: 10 }}>{msg}</div>}

      {editing && (
        <div style={{ marginTop: 12 }}>
          <Field label="Profile photo"><ImagePicker value={form.photo || ""} onChange={(v) => setForm((f) => ({ ...f, photo: v }))} /></Field>

          <div style={{ display: "flex", gap: 10 }}>
            <Locked label="Roll number" value={normRoll(rec.rollNumber || rec.code)} />
            <Locked label="Grade" value={rec.grade} />
          </div>

          {frozen
            ? <div style={{ display: "flex", gap: 10 }}><Locked label="Name" value={rec.name} /><Locked label="Date of birth" value={rec.dob} /></div>
            : (<>
                <Field label="Full name"><input className="input" value={form.name || ""} onChange={set("name")} /></Field>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}><Field label="Gender"><select className="input" value={form.gender || GENDERS[0]} onChange={set("gender")}>{GENDERS.map((g) => <option key={g}>{g}</option>)}</select></Field></div>
                  <div style={{ flex: 1 }}><Field label="Date of birth"><input className="input" type="date" value={form.dob || ""} onChange={set("dob")} /></Field></div>
                </div>
              </>)}
          {frozen && <Field label="Gender"><select className="input" value={form.gender || GENDERS[0]} onChange={set("gender")}>{GENDERS.map((g) => <option key={g}>{g}</option>)}</select></Field>}

          <Field label="Nationality"><input className="input" value={form.nationality || ""} onChange={set("nationality")} /></Field>
          <Field label="Present location / country"><input className="input" value={form.location || ""} onChange={set("location")} /></Field>

          <Field label="Extra-curriculum">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {EXTRA_CURRICULUM.map((opt) => {
                const on = extra.includes(opt);
                return <button key={opt} type="button" onClick={() => toggleExtra(opt)} style={{ cursor: "pointer", borderRadius: 999, padding: "6px 11px", fontSize: 11.5, fontWeight: 700, border: "1.5px solid " + (on ? "var(--azure)" : "var(--line)"), background: on ? "var(--azure)" : "#fff", color: on ? "#fff" : "var(--inkSoft)" }}>{on ? "✓ " : ""}{opt}</button>;
              })}
            </div>
          </Field>

          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}><Field label="Father's name"><input className="input" value={form.fatherName || ""} onChange={set("fatherName")} /></Field></div>
            <div style={{ flex: 1 }}><Field label="Mother's name"><input className="input" value={form.motherName || ""} onChange={set("motherName")} /></Field></div>
          </div>
          <Field label="Mobile"><input className="input" inputMode="tel" value={form.mobile || ""} onChange={set("mobile")} /></Field>
          <Field label="Emergency contact"><input className="input" inputMode="tel" value={form.emergencyContact || ""} onChange={set("emergencyContact")} /></Field>
          <Field label="Email"><input className="input" type="email" value={form.email || ""} onChange={set("email")} /></Field>
          <Field label="Postal address"><textarea className="input" rows={2} style={{ resize: "vertical" }} value={form.postalAddress || ""} onChange={set("postalAddress")} /></Field>
          <Field label="Comments"><textarea className="input" rows={2} style={{ resize: "vertical" }} value={form.comments || ""} onChange={set("comments")} /></Field>

          {frozen && <div style={{ fontSize: 11.5, color: "var(--inkSoft)", margin: "6px 2px 10px" }}>Your name and date of birth are locked by the school. Contact the school to change them.</div>}

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button className="btnP" onClick={save} disabled={busy} style={{ flex: 1, justifyContent: "center" }}>{busy ? "Saving…" : "Save changes"}</button>
            <button className="btnGhost" onClick={() => setEditing(false)} style={{ padding: "10px 16px", fontWeight: 600 }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

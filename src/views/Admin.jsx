import { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import Icon from "../data/icons.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import StudentFields, { EMPTY_STUDENT } from "../components/StudentFields.jsx";
import TeacherAssignments from "../components/TeacherAssignments.jsx";
import ImagePicker from "../components/ImagePicker.jsx";
import { GRADES, SUBJECTS_BY_GRADE, ALL_SUBJECTS, assignmentLabel, deriveAssignments, MARK_MAX, TERMS } from "../data/school";
import logo from "../assets/logo.png";
import { TT, DAYCOL, ROTATING, TEACH as TEACH_DEF, PRESS as PRESS_DEF, FOUNDERS as FOUNDERS_DEF, LEADER_MESSAGE as LEADER_DEF, MILESTONES as MILESTONES_DEF } from "../data/content";
import { TEACHERS as BUILTIN_TEACHERS } from "../data/teachers";
import { ROSTER, ROSTER_MAX_ROLL } from "../data/roster";
import { fmtDate } from "../lib/util";
import { hasFirebase } from "../lib/firebase";
import { createStudentAccount, createTeacherAccount, resetPassword } from "../lib/auth";
import { sendWelcomeEmail } from "../lib/email";
import * as store from "../lib/store";

const TABS = [
  ["approvals", "Approvals", "check"],
  ["students", "Students", "cap"],
  ["admissions", "Admissions", "send"],
  ["messages", "Messages", "mail"],
  ["teachers", "Teachers", "users"],
  ["profiles", "Profiles", "award"],
  ["notices", "Notices", "newspaper"],
  ["timetable", "Timetable", "calendar"],
  ["photos", "Photos", "spark"],
  ["content", "Content", "info"],
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Admin() {
  const [tab, setTab] = useState(hasFirebase ? "approvals" : "students");
  return (
    <>
      <SectionTitle eyebrow="Admin" title="Manage the school" />
      <div className="seg" style={{ marginBottom: 16 }}>
        {TABS.map(([k, label]) => (<button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{label}</button>))}
      </div>
      {tab === "approvals" && <Approvals />}
      {tab === "students" && <Students />}
      {tab === "admissions" && <Admissions />}
      {tab === "messages" && <Messages />}
      {tab === "teachers" && <Teachers />}
      {tab === "profiles" && <TeacherProfiles />}
      {tab === "notices" && <Notices />}
      {tab === "timetable" && <Timetable />}
      {tab === "photos" && <Photos />}
      {tab === "content" && <SiteContent />}
    </>
  );
}

/* ---------- Approvals (sign-ups awaiting a role) ---------- */
function Approvals() {
  const [list, setList] = useState(null);
  useEffect(() => { hasFirebase ? store.listPendingUsers().then(setList) : setList([]); }, []);

  if (!hasFirebase) {
    return <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--inkSoft)", fontSize: 14 }}>
      Sign-ups arrive here once the app is connected to Firebase (cloud mode).
    </div>;
  }
  if (list === null) return <p className="para">Loading…</p>;
  if (list.length === 0) return <div className="card" style={{ padding: 30, textAlign: "center" }}>
    <div style={{ margin: "0 auto 10px", width: 32 }}><Icon name="inbox" size={32} color="#52617A" /></div>
    <div style={{ fontSize: 14, color: "var(--inkSoft)" }}>No pending sign-ups. New registrations will appear here to approve.</div>
  </div>;

  return <>{list.map((p) => <ApprovalCard key={p.uid} pending={p} onDone={(uid) => setList((l) => l.filter((x) => x.uid !== uid))} />)}</>;
}
function ApprovalCard({ pending, onDone }) {
  const isStudent = pending.requestedRole === "student";
  const [roll, setRoll] = useState("");
  const [busy, setBusy] = useState(false);
  const pr = pending.profile || {};

  async function approve() {
    setBusy(true);
    try {
      if (isStudent) {
        await store.approveStudent(pending.uid, { ...pr, name: pending.name, email: pending.email, rollNumber: roll.trim(), grade: pr.grade || GRADES[0] });
      } else {
        await store.approveTeacher(pending.uid, { name: pending.name, assignments: pending.assignments || [] });
      }
      onDone(pending.uid);
    } finally { setBusy(false); }
  }
  async function reject() { setBusy(true); try { await store.rejectSignup(pending.uid); onDone(pending.uid); } finally { setBusy(false); } }

  return (
    <div className="card" style={{ padding: 15, marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="pillBadge" style={{ background: isStudent ? "var(--tintBlue)" : "#EAF7EF", color: isStudent ? "var(--azure)" : "#1E7A45" }}>
          <Icon name={isStudent ? "cap" : "users"} size={13} color={isStudent ? "#2F6BFF" : "#1E7A45"} sw={2.4} /> {isStudent ? "Student / Parent" : "Teacher"}
        </span>
        <span style={{ fontSize: 11.5, color: "var(--inkSoft)" }}>{pending.email}</span>
      </div>
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "var(--ink)", marginTop: 9 }}>{pending.name}</div>

      <div style={{ display: "grid", gap: 3, marginTop: 8, fontSize: 12.5, color: "var(--inkSoft)" }}>
        {isStudent ? (
          <>
            <div><b style={{ color: "var(--ink)" }}>Class:</b> {pr.grade}</div>
            {pr.gender && <div><b style={{ color: "var(--ink)" }}>Gender:</b> {pr.gender}{pr.dob ? ` · DOB ${pr.dob}` : ""}</div>}
            {pr.nationality && <div><b style={{ color: "var(--ink)" }}>Nationality:</b> {pr.nationality}</div>}
            {pr.location && <div><b style={{ color: "var(--ink)" }}>Location:</b> {pr.location}</div>}
            {(pr.fatherName || pr.motherName) && <div><b style={{ color: "var(--ink)" }}>Parents:</b> {[pr.fatherName, pr.motherName].filter(Boolean).join(" · ")}</div>}
            {pr.mobile && <div><b style={{ color: "var(--ink)" }}>Mobile:</b> {pr.mobile}</div>}
            {pr.emergencyContact && <div><b style={{ color: "var(--ink)" }}>Emergency:</b> {pr.emergencyContact}</div>}
            {pr.postalAddress && <div><b style={{ color: "var(--ink)" }}>Address:</b> {pr.postalAddress}</div>}
            {pr.extra && pr.extra.length > 0 && <div><b style={{ color: "var(--ink)" }}>Extra:</b> {pr.extra.join(", ")}</div>}
            {pr.comments && <div style={{ fontStyle: "italic" }}>“{pr.comments}”</div>}
          </>
        ) : (
          <div><b style={{ color: "var(--ink)" }}>Teaches:</b> {(pending.assignments || []).map(assignmentLabel).join(", ") || "—"}</div>
        )}
      </div>

      {isStudent && (
        <input className="input" placeholder="Assign roll number (e.g. 2026-031)" value={roll} onChange={(e) => setRoll(e.target.value)} style={{ marginTop: 12 }} />
      )}
      <div style={{ display: "flex", gap: 8, marginTop: isStudent ? 2 : 12 }}>
        <button className="btnP" onClick={approve} disabled={busy} style={{ flex: 1, justifyContent: "center", opacity: busy ? 0.7 : 1 }}>
          <Icon name="check" size={15} color="#fff" sw={2.5} /> Approve
        </button>
        <button className="btnGhost" onClick={reject} disabled={busy} style={{ padding: "10px 14px", color: "#FF6B5E", fontWeight: 700, fontSize: 13 }}>Reject</button>
      </div>
    </div>
  );
}

/* ---------- Students (full details) ---------- */
function Students() {
  const [list, setList] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_STUDENT });
  const [roll, setRoll] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);
  const [impBusy, setImpBusy] = useState(false);
  const [impMsg, setImpMsg] = useState("");
  const [q, setQ] = useState("");
  const [promoting, setPromoting] = useState(false);
  const [promoteMsg, setPromoteMsg] = useState("");
  const [confirmProm, setConfirmProm] = useState(false);
  const [csvMsg, setCsvMsg] = useState("");
  const [csvBusy, setCsvBusy] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");
  const csvRef = useRef(null);
  useEffect(() => { store.listStudents().then(setList); }, []);

  async function add() {
    setErr("");
    if (!form.name.trim() || !form.email.trim()) { setErr("Full name and email are required."); return; }
    if (hasFirebase && password.length < 6) { setErr("Enter a password of at least 6 characters for the login."); return; }
    setBusy(true);
    try {
      const profile = { ...form, name: form.name.trim(), email: form.email.trim(), rollNumber: roll.trim() };
      const rec = await store.addStudent(profile);
      if (hasFirebase) await createStudentAccount({ email: profile.email, password, studentId: rec.id, name: rec.name, grade: rec.grade });
      setList((l) => [...(l || []), rec]);
      setForm({ ...EMPTY_STUDENT }); setRoll(""); setPassword(""); setOpen(false);
    } catch (e) { setErr(e.message || "Could not add the student."); } finally { setBusy(false); }
  }
  async function remove(id) { await store.removeStudent(id); setList((l) => l.filter((s) => s.id !== id)); }
  async function assignGrade(id, grade) { await store.updateStudent(id, { grade }); setList((l) => l.map((s) => (s.id === id ? { ...s, grade } : s))); }
  async function doImport() {
    setImpBusy(true); setImpMsg("");
    try {
      const n = await store.importRoster(ROSTER);
      setImpMsg(n === 0 ? "All roster students are already imported." : `Imported ${n} students. New roll numbers will continue from ${ROSTER_MAX_ROLL + 1}.`);
      setList(await store.listStudents());
    } catch (e) { setImpMsg(e.message || "Import failed."); }
    finally { setImpBusy(false); }
  }
  async function promote() {
    setPromoting(true); setPromoteMsg("");
    try { const n = await store.promoteAll(); setPromoteMsg(`Promoted ${n} students. Grade 7 students are now marked as graduated.`); setList(await store.listStudents()); setConfirmProm(false); }
    catch (e) { setPromoteMsg(e.message || "Promotion failed."); }
    finally { setPromoting(false); }
  }
  async function toggleFreeze(s) { const frozen = !s.frozen; await store.updateStudent(s.id, { frozen }); setList((l) => l.map((x) => (x.id === s.id ? { ...x, frozen } : x))); }

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_STUDENT);
  function startEdit(s) {
    setEditId(s.id);
    setEditForm({
      name: s.name || "", nationality: s.nationality || "", gender: s.gender || EMPTY_STUDENT.gender, dob: s.dob || "",
      location: s.location || "", emergencyContact: s.emergencyContact || "", postalAddress: s.postalAddress || "",
      grade: s.grade || EMPTY_STUDENT.grade, extra: Array.isArray(s.extra) ? s.extra : (s.extra ? String(s.extra).split(/[;,]/).map((x) => x.trim()).filter(Boolean) : []),
      fatherName: s.fatherName || "", motherName: s.motherName || "", mobile: s.mobile || "", email: s.email || "", comments: s.comments || "",
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function saveEdit() {
    const patch = { ...editForm };
    await store.updateStudent(editId, patch);
    setList((l) => l.map((x) => (x.id === editId ? { ...x, ...patch } : x)));
    setEditId(null);
  }

  const [rcGrade, setRcGrade] = useState(GRADES[0]);
  const [rcBusy, setRcBusy] = useState(false);
  async function generateMarksheets() {
    setRcBusy(true);
    try {
      const studentsInGrade = (list || []).filter((s) => s.grade === rcGrade).sort((a, b) => (a.rollNumber || 0) - (b.rollNumber || 0));
      if (studentsInGrade.length === 0) { alert(`No students in ${rcGrade}.`); return; }
      const marksMap = await store.getGradeMarks(rcGrade);
      const logoUrl = (() => { try { return new URL(logo, window.location.href).href; } catch (e) { return logo; } })();
      const gl = (pct) => pct == null ? "" : pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B" : pct >= 60 ? "C" : pct >= 50 ? "D" : "E";
      const sheets = studentsInGrade.map((stu) => {
        const mine = marksMap[stu.id] || [];
        const byTS = {}; mine.forEach((m) => { (byTS[m.term] = byTS[m.term] || {})[m.subject] = m.score; });
        const subs = Array.from(new Set([...(SUBJECTS_BY_GRADE[rcGrade] || []), ...mine.map((m) => m.subject)]));
        const overall = (t) => { const e = subs.map((s) => (byTS[t] || {})[s]).filter((v) => v != null); return e.length ? Math.round((e.reduce((a, b) => a + b, 0) / (e.length * MARK_MAX)) * 100) : null; };
        const rows = subs.map((s) => { const a = (byTS["Sem 1"] || {})[s], b = (byTS["Sem 2"] || {})[s]; return `<tr><td>${s}</td><td class="c">${a != null ? a : "—"}</td><td class="c">${b != null ? b : "—"}</td></tr>`; }).join("");
        const o1 = overall("Sem 1"), o2 = overall("Sem 2");
        return `<div class="sheet"><div class="head"><img src="${logoUrl}"><div><h1>KTN Digital Online School</h1><div class="sub">Education for Free · Since 2019 — Report card</div></div></div>
          <div class="info"><div><b>Student:</b> ${stu.name}</div><div><b>Roll:</b> ${stu.rollNumber || stu.code || "—"}</div><div><b>Class:</b> ${stu.grade || "—"}</div></div>
          <table><thead><tr><th>Subject</th><th class="c">Sem 1 (/100)</th><th class="c">Sem 2 (/100)</th></tr></thead>
          <tbody>${rows}<tr class="tot"><td>Overall</td><td class="c">${o1 != null ? o1 + "% " + gl(o1) : "—"}</td><td class="c">${o2 != null ? o2 + "% " + gl(o2) : "—"}</td></tr></tbody></table></div>`;
      }).join('<div class="pb"></div>');
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>${rcGrade} report cards</title>
        <style>body{font-family:Arial,sans-serif;color:#16233A;margin:0}
        .sheet{padding:34px;max-width:640px;margin:0 auto}
        .pb{page-break-after:always}
        .head{display:flex;align-items:center;gap:14px;border-bottom:3px solid #2F6BFF;padding-bottom:14px}
        .head img{width:56px;height:56px;object-fit:contain} h1{font-size:20px;margin:0} .sub{color:#6B7A90;font-size:12px}
        .info{display:flex;gap:24px;margin:18px 0;font-size:13px} table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #E4EAF5;padding:9px 12px;font-size:13px} th{background:#EAF1FF;text-align:left}
        .c{text-align:center} .tot td{font-weight:bold;background:#FDF3E6}
        @media print{.noprint{display:none}}</style></head><body>
        <div class="noprint" style="text-align:center;padding:14px"><button onclick="window.print()" style="padding:10px 20px;font-size:14px;background:#2F6BFF;color:#fff;border:none;border-radius:8px;cursor:pointer">Save all as PDF / Print</button></div>
        ${sheets}</body></html>`;
      const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
      const w = window.open(url, "_blank");
      if (!w) { const a = document.createElement("a"); a.href = url; a.download = `${rcGrade}-report-cards.html`; document.body.appendChild(a); a.click(); a.remove(); }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } finally { setRcBusy(false); }
  }
  async function invite(s) {
    setInviteMsg("");
    if (!hasFirebase) { setInviteMsg("Connect Firebase to send login invites."); return; }
    if (!s.email) { setInviteMsg(`${s.name} has no email on file — add one (via the spreadsheet) first.`); return; }
    try {
      const rand = Math.random().toString(36).slice(2, 12) + "Aa1!";
      await createStudentAccount({ email: s.email, password: rand, studentId: s.id, name: s.name, grade: s.grade || "", rollNumber: s.rollNumber || s.code || "" });
      await resetPassword(s.email);
      try { await sendWelcomeEmail({ toEmail: s.email, toName: s.fatherName || s.name, rollNumber: s.rollNumber || s.code, grade: s.grade }); } catch { /* optional */ }
      setInviteMsg(`Set-password email sent to ${s.email} (roll ${s.rollNumber || s.code}).`);
    } catch (e) {
      if (String(e.code || "").includes("email-already-in-use")) { try { await resetPassword(s.email); setInviteMsg(`${s.email} already had an account — set-password link re-sent.`); } catch { setInviteMsg(`Couldn't email ${s.email}.`); } }
      else setInviteMsg(e.message || "Could not send invite.");
    }
  }

  async function downloadTemplate() {
    const all = await store.listStudents();
    const rows = all.map((s) => ({
      rollNumber: s.rollNumber || s.code || "", name: s.name || "",
      grade: GRADES.includes(s.grade) ? s.grade : "", nationality: s.nationality || "",
      gender: s.gender || "", dob: s.dob || "", location: s.location || "",
      emergencyContact: s.emergencyContact || "", postalAddress: s.postalAddress || "",
      extra: (s.extra || []).join("; "), fatherName: s.fatherName || "", motherName: s.motherName || "",
      mobile: s.mobile || "", email: s.email || "", comments: s.comments || "",
    }));
    const csv = "\ufeff" + Papa.unparse(rows, { columns: store.STUDENT_CSV_COLUMNS });
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a"); a.href = url; a.download = "ktn-students.csv"; a.click(); URL.revokeObjectURL(url);
  }
  function pickCsv() { csvRef.current && csvRef.current.click(); }
  function onCsv(e) {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    setCsvBusy(true); setCsvMsg("");
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async (res) => {
        try {
          const { updated, created, skipped } = await store.bulkUpsertStudents(res.data);
          setCsvMsg(`Done — ${updated} updated, ${created} added${skipped ? `, ${skipped} skipped (no roll number)` : ""}.`);
          setList(await store.listStudents());
        } catch (err) { setCsvMsg(err.message || "Import failed."); }
        finally { setCsvBusy(false); if (csvRef.current) csvRef.current.value = ""; }
      },
      error: () => { setCsvMsg("Could not read that file. Make sure it's a .csv."); setCsvBusy(false); },
    });
  }

  const ql = q.trim().toLowerCase();
  const match = (s) => !ql || (s.name || "").toLowerCase().includes(ql) || String(s.rollNumber || s.code || "").toLowerCase().includes(ql);
  const filtered = (list || []).filter(match);
  const graduated = filtered.filter((s) => s.grade === "Graduated");
  const special = filtered.filter((s) => s.grade === "Extra only");
  const unassigned = filtered.filter((s) => !s.grade || (!GRADES.includes(s.grade) && s.grade !== "Graduated" && s.grade !== "Extra only"));
  const byGrade = {};
  filtered.forEach((s) => { if (GRADES.includes(s.grade)) (byGrade[s.grade] = byGrade[s.grade] || []).push(s); });

  return (
    <>
      {editId && (
        <div className="card" style={{ padding: 16, marginBottom: 16, borderColor: "var(--azure)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>Edit student</div>
            <button className="btnGhost" onClick={() => setEditId(null)}><Icon name="x" size={16} color="#52617A" /></button>
          </div>
          <StudentFields form={editForm} setForm={setEditForm} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button className="btnP" onClick={saveEdit} style={{ flex: 1, justifyContent: "center" }}>Save changes</button>
            <button className="btnGhost" onClick={() => setEditId(null)} style={{ padding: "10px 16px", fontWeight: 600 }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 14, marginBottom: 16, background: "#FDF3E6", border: "none" }}>
        <div style={{ fontSize: 13, color: "#8A5A12", fontWeight: 700, marginBottom: 4 }}>Report cards (download all)</div>
        <div style={{ fontSize: 12, color: "#8A5A12", marginBottom: 10, lineHeight: 1.45 }}>
          Generate every student's marksheet for a whole class as one printable document — then Save as PDF or print.
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select className="input" value={rcGrade} onChange={(e) => setRcGrade(e.target.value)} style={{ margin: 0, width: 130 }}>
            {GRADES.map((g) => <option key={g}>{g}</option>)}
          </select>
          <button className="btnP" onClick={generateMarksheets} disabled={rcBusy} style={{ background: "#E8912A" }}>
            <Icon name="send" size={14} color="#fff" sw={2.3} style={{ transform: "rotate(90deg)" }} /> {rcBusy ? "Generating…" : "Generate marksheets"}
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 14, marginBottom: 16, background: "var(--tintBlue)", border: "none" }}>
        <div style={{ fontSize: 13, color: "var(--navy)", fontWeight: 700, marginBottom: 4 }}>Import existing students</div>
        <div style={{ fontSize: 12, color: "var(--navy)", marginBottom: 10, lineHeight: 1.45 }}>
          Adds your {ROSTER.length} current students with their roll numbers and a temporary password each (grade set later). Safe to click again — it skips anyone already added.
        </div>
        <button className="btnP" onClick={doImport} disabled={impBusy} style={{ justifyContent: "center" }}>
          <Icon name="plus" size={15} color="#fff" sw={2.5} /> {impBusy ? "Importing…" : `Import ${ROSTER.length} students`}
        </button>
        {impMsg && <div style={{ fontSize: 12.5, color: "#1E7A45", fontWeight: 700, marginTop: 8 }}>{impMsg}</div>}
      </div>

      <div className="card" style={{ padding: 14, marginBottom: 16, background: "#EAF7EF", border: "none" }}>
        <div style={{ fontSize: 13, color: "#1E7A45", fontWeight: 700, marginBottom: 4 }}>Update all student info (spreadsheet)</div>
        <div style={{ fontSize: 12, color: "#1E7A45", marginBottom: 10, lineHeight: 1.45 }}>
          Download a spreadsheet of every student, fill in the details in Excel or Google Sheets, then upload it back. Students are matched by <b>roll number</b>; blank cells are left unchanged.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btnGhost" onClick={downloadTemplate} style={{ color: "#1E7A45", fontWeight: 700, fontSize: 13, border: "1px solid #A9D8BC" }}>
            <Icon name="send" size={14} color="#1E7A45" sw={2.3} style={{ transform: "rotate(90deg)" }} /> Download spreadsheet
          </button>
          <input ref={csvRef} type="file" accept=".csv,text/csv" onChange={onCsv} style={{ display: "none" }} />
          <button className="btnP" onClick={pickCsv} disabled={csvBusy} style={{ background: "#1E9E5A" }}>
            <Icon name="plus" size={14} color="#fff" sw={2.4} /> {csvBusy ? "Updating…" : "Upload spreadsheet"}
          </button>
        </div>
        <div style={{ fontSize: 11, color: "#1E7A45", marginTop: 8, lineHeight: 1.4 }}>
          Grade must be written as “Grade 1” … “Grade 7”. Extra-curriculum: separate items with a semicolon (e.g. “Hindi Level 1; Drawing”).
        </div>
        {csvMsg && <div style={{ fontSize: 12.5, color: "#0F5C33", fontWeight: 700, marginTop: 8 }}>{csvMsg}</div>}
      </div>

      <div style={{ position: "relative", marginBottom: 12 }}>
        <input className="input" placeholder="Search by name or roll number…" value={q} onChange={(e) => setQ(e.target.value)} style={{ margin: 0, paddingLeft: 12 }} />
      </div>

      <div className="card" style={{ padding: 14, marginBottom: 16, background: "#FDEEDA", border: "none" }}>
        <div style={{ fontSize: 13, color: "#8A6A00", fontWeight: 700, marginBottom: 4 }}>New academic year</div>
        <div style={{ fontSize: 12, color: "#8A6A00", marginBottom: 10, lineHeight: 1.45 }}>Move every student up one grade (Grade 1→2 … Grade 6→7, Grade 7→Graduated). Do this once, at the start of a new year.</div>
        {!confirmProm ? (
          <button className="btnGhost" onClick={() => { setConfirmProm(true); setPromoteMsg(""); }} style={{ color: "#8A6A00", fontWeight: 700, fontSize: 13, border: "1px solid #E4C877" }}>Promote all students…</button>
        ) : (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12.5, color: "#8A6A00", fontWeight: 700 }}>Are you sure? This can't be undone easily.</span>
            <button className="btnP" onClick={promote} disabled={promoting} style={{ padding: "9px 14px" }}>{promoting ? "Promoting…" : "Yes, promote"}</button>
            <button className="btnGhost" onClick={() => setConfirmProm(false)} style={{ padding: "9px 12px" }}>Cancel</button>
          </div>
        )}
        {promoteMsg && <div style={{ fontSize: 12.5, color: "#1E7A45", fontWeight: 700, marginTop: 8 }}>{promoteMsg}</div>}
      </div>

      {!open ? (
        <button className="btnP" onClick={() => setOpen(true)} style={{ width: "100%", justifyContent: "center", marginBottom: 16 }}>
          <Icon name="plus" size={15} color="#fff" sw={2.5} /> Add a student
        </button>
      ) : (
        <div className="card" style={{ padding: 16, marginBottom: 16, borderColor: "var(--azure)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>New student</div>
            <button className="btnGhost" onClick={() => setOpen(false)}><Icon name="x" size={15} color="#52617A" /></button>
          </div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", display: "block", margin: "2px 0 6px" }}>Roll number</label>
          <input className="input" placeholder="e.g. 2026-031 (assigned on joining)" value={roll} onChange={(e) => setRoll(e.target.value)} />
          <StudentFields form={form} setForm={setForm} />
          {hasFirebase && (<>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", display: "block", margin: "2px 0 6px" }}>Temporary password (min 6 chars)</label>
            <input className="input" type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="For the parent's login" />
          </>)}
          {err && <div style={{ color: "#FF6B5E", fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>{err}</div>}
          <button className="btnP" onClick={add} disabled={busy} style={{ width: "100%", justifyContent: "center", opacity: busy ? 0.7 : 1 }}>{busy ? "Adding…" : "Add student"}</button>
        </div>
      )}

      {inviteMsg && <div className="card" style={{ padding: 12, marginBottom: 12, background: "#EAF7EF", border: "none", color: "#1E7A45", fontWeight: 700, fontSize: 12.5 }}>{inviteMsg}</div>}

      {list && unassigned.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h3 className="h2" style={{ marginBottom: 8 }}>Unassigned <span style={{ fontSize: 12, color: "var(--inkSoft)", fontWeight: 600 }}>· {unassigned.length} · set a grade for each</span></h3>
          {unassigned.map((s) => (
            <div key={s.id} className="card" style={{ padding: "10px 14px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{s.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--inkSoft)" }}>Roll {s.rollNumber || s.code}{s.tempPassword ? ` · temp pw: ${s.tempPassword}` : ""}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <select className="input" value="" onChange={(e) => e.target.value && assignGrade(s.id, e.target.value)} style={{ margin: 0, width: 110 }}>
                  <option value="">Set grade…</option>
                  {GRADES.map((g) => <option key={g}>{g}</option>)}
                  <option value="Extra only">Special classes only</option>
                </select>
                <button className="btnGhost" onClick={() => startEdit(s)} title="Edit student" style={{ padding: 7 }}><Icon name="edit" size={14} color="#2F6BFF" /></button>
                {hasFirebase && <button className="btnGhost" onClick={() => invite(s)} title="Send set-password email" style={{ padding: 7 }}><Icon name="mail" size={14} color="#2F6BFF" /></button>}
                <button className="btnGhost" onClick={() => remove(s.id)}><Icon name="trash" size={15} color="#FF6B5E" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {list === null ? <p className="para">Loading…</p> : GRADES.filter((g) => byGrade[g]).map((g) => (
        <div key={g} style={{ marginBottom: 16 }}>
          <h3 className="h2" style={{ marginBottom: 8 }}>{g} <span style={{ fontSize: 12, color: "var(--inkSoft)", fontWeight: 600 }}>· {byGrade[g].length}</span></h3>
          {byGrade[g].map((s) => (
            <div key={s.id} className="card" style={{ padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)" }}>{s.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--inkSoft)" }}>
                  {s.rollNumber ? <span>Roll {s.rollNumber} · </span> : null}
                  <b style={{ color: "var(--azure)" }}>{hasFirebase ? (s.email || s.code) : s.code}</b>
                  {s.frozen ? <span style={{ color: "#B76A0E", fontWeight: 700 }}> · locked</span> : null}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button className="btnGhost" onClick={() => startEdit(s)} title="Edit student" style={{ padding: 7 }}><Icon name="edit" size={14} color="#2F6BFF" /></button>
                {hasFirebase && <button className="btnGhost" onClick={() => invite(s)} title="Send set-password email" style={{ padding: 7 }}><Icon name="mail" size={14} color="#2F6BFF" /></button>}
                <button className="btnGhost" onClick={() => toggleFreeze(s)} title={s.frozen ? "Unlock details (allow parent to edit)" : "Lock details"} style={{ padding: 7 }}>
                  <Icon name="lock" size={14} color={s.frozen ? "#B76A0E" : "#9AA7BE"} />
                </button>
                <button className="btnGhost" onClick={() => remove(s.id)} aria-label="Remove"><Icon name="trash" size={15} color="#FF6B5E" /></button>
              </div>
            </div>
          ))}
        </div>
      ))}

      {list && special.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h3 className="h2" style={{ marginBottom: 8 }}>Special classes only <span style={{ fontSize: 12, color: "var(--inkSoft)", fontWeight: 600 }}>· {special.length} · no regular grade</span></h3>
          {special.map((s) => (
            <div key={s.id} className="card" style={{ padding: "10px 14px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{s.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--inkSoft)" }}>
                  Roll {s.rollNumber || s.code}{s.extra && s.extra.length ? " · " + (Array.isArray(s.extra) ? s.extra.join(", ") : s.extra) : ""}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <select className="input" value="" onChange={(e) => e.target.value && assignGrade(s.id, e.target.value)} style={{ margin: 0, width: 110 }}>
                  <option value="">Move to…</option>
                  {GRADES.map((g) => <option key={g}>{g}</option>)}
                </select>
                <button className="btnGhost" onClick={() => startEdit(s)} title="Edit student" style={{ padding: 7 }}><Icon name="edit" size={14} color="#2F6BFF" /></button>
                {hasFirebase && <button className="btnGhost" onClick={() => invite(s)} title="Send set-password email" style={{ padding: 7 }}><Icon name="mail" size={14} color="#2F6BFF" /></button>}
                <button className="btnGhost" onClick={() => remove(s.id)}><Icon name="trash" size={15} color="#FF6B5E" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {list && graduated.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <h3 className="h2" style={{ marginBottom: 8 }}>Graduated <span style={{ fontSize: 12, color: "var(--inkSoft)", fontWeight: 600 }}>· {graduated.length}</span></h3>
          {graduated.map((s) => (
            <div key={s.id} className="card" style={{ padding: "10px 14px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", opacity: 0.75 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{s.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--inkSoft)" }}>Roll {s.rollNumber || s.code} · alumnus</div>
              </div>
              <button className="btnGhost" onClick={() => remove(s.id)}><Icon name="trash" size={15} color="#FF6B5E" /></button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------- Admissions (public Apply form) ---------- */
function Admissions() {
  const [list, setList] = useState(null);
  const [msg, setMsg] = useState("");
  const [busyId, setBusyId] = useState(null);
  useEffect(() => { store.listApps().then(setList); }, []);
  async function clear() { await store.clearApps(); setList([]); }
  async function accept(a) {
    setBusyId(a.id); setMsg("");
    try {
      const roll = await store.getNextRoll();
      const rec = await store.addStudent({
        name: a.name || a.student, grade: a.grade || "", rollNumber: roll, code: roll, status: "enrolled", frozen: false,
        nationality: a.nationality || "", gender: a.gender || "", dob: a.dob || "",
        location: a.location || "", emergencyContact: a.emergencyContact || "", postalAddress: a.postalAddress || "",
        extra: a.extra || [], fatherName: a.fatherName || "", motherName: a.motherName || "",
        mobile: a.mobile || a.phone || "", email: a.email || "", comments: a.comments || a.message || "",
      });
      let note = `${a.student} enrolled as roll ${roll}.`;
      if (hasFirebase && a.email) {
        try {
          const rand = Math.random().toString(36).slice(2, 12) + "Aa1!";
          await createStudentAccount({ email: a.email, password: rand, studentId: rec.id, name: a.student, grade: a.grade || "", rollNumber: roll });
          await resetPassword(a.email);
          try { await sendWelcomeEmail({ toEmail: a.email, toName: a.parent || a.student, rollNumber: roll, grade: a.grade }); } catch { /* welcome email optional */ }
          note += ` A “set your password” email was sent to ${a.email}.`;
        } catch (e) {
          if (String(e.code || "").includes("email-already-in-use")) {
            try { await resetPassword(a.email); note += ` That email already had an account — a set-password link was re-sent to ${a.email}.`; } catch { note += ` (Enrolled; couldn't email ${a.email}.)`; }
          } else { note += ` (Enrolled, but the login couldn't be created: ${e.message || e.code}.)`; }
        }
      } else if (hasFirebase && !a.email) {
        note += ` No email on file — you can invite them later from the Students list.`;
      }
      await store.deleteApp(a.id);
      setMsg(note);
      setList((l) => l.filter((x) => x.id !== a.id));
    } catch (e) { setMsg(e.message || "Could not enrol."); }
    finally { setBusyId(null); }
  }
  async function decline(a) { await store.deleteApp(a.id); setList((l) => l.filter((x) => x.id !== a.id)); }

  if (list === null) return <p className="para">Loading…</p>;
  if (list.length === 0) return <>
    {msg && <div className="card" style={{ padding: 14, marginBottom: 12, background: "#EAF7EF", border: "none", color: "#1E7A45", fontWeight: 700, fontSize: 13 }}>{msg}</div>}
    <div className="card" style={{ padding: 30, textAlign: "center" }}>
      <div style={{ margin: "0 auto 10px", width: 32 }}><Icon name="inbox" size={32} color="#52617A" /></div>
      <div style={{ fontSize: 14, color: "var(--inkSoft)" }}>No admission requests yet. They arrive here from the public Apply form.</div>
    </div>
  </>;
  return (<>
    {msg && <div className="card" style={{ padding: 14, marginBottom: 12, background: "#EAF7EF", border: "none", color: "#1E7A45", fontWeight: 700, fontSize: 13 }}>{msg}</div>}
    {list.map((a) => (
      <div key={a.id} className="card" style={{ padding: 15, marginBottom: 11 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="pillBadge" style={{ background: "var(--tintBlue)", color: "var(--azure)" }}><Icon name="cap" size={13} color="#2F6BFF" sw={2.4} /> {a.grade}</span>
          <span style={{ fontSize: 11.5, color: "var(--inkSoft)", fontWeight: 600 }}>{fmtDate((a.date || "").slice(0, 10))}</span>
        </div>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "var(--ink)", marginTop: 9 }}>{a.student}</div>
        <div style={{ display: "grid", gap: 4, marginTop: 8, fontSize: 13, color: "var(--inkSoft)" }}>
          <div><b style={{ color: "var(--ink)" }}>Parent:</b> {a.parent}</div>
          {(a.gender || a.dob) && <div><b style={{ color: "var(--ink)" }}>Details:</b> {[a.gender, a.dob, a.nationality].filter(Boolean).join(" · ")}</div>}
          {a.phone && <div><b style={{ color: "var(--ink)" }}>Mobile:</b> {a.phone}</div>}
          {a.email && <div><b style={{ color: "var(--ink)" }}>Email:</b> {a.email}</div>}
          {a.extra && a.extra.length > 0 && <div><b style={{ color: "var(--ink)" }}>Extra:</b> {Array.isArray(a.extra) ? a.extra.join(", ") : a.extra}</div>}
          {a.postalAddress && <div><b style={{ color: "var(--ink)" }}>Address:</b> {a.postalAddress}</div>}
          {a.message && <div style={{ marginTop: 4, fontStyle: "italic" }}>“{a.message}”</div>}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="btnP" onClick={() => accept(a)} disabled={busyId === a.id} style={{ flex: 1, justifyContent: "center" }}>
            <Icon name="check" size={15} color="#fff" sw={2.5} /> {busyId === a.id ? "Enrolling…" : "Accept & enrol"}
          </button>
          <button className="btnGhost" onClick={() => decline(a)} style={{ padding: "10px 14px", color: "#FF6B5E", fontWeight: 700, fontSize: 13 }}>Decline</button>
        </div>
      </div>
    ))}
    <button className="btnGhost" onClick={clear} style={{ width: "100%", padding: 11, marginTop: 4, color: "#FF6B5E", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
      <Icon name="trash" size={15} color="#FF6B5E" /> Clear all requests
    </button>
  </>);
}

/* ---------- Messages (public Contact form) ---------- */
function Messages() {
  const [list, setList] = useState(null);
  useEffect(() => { store.listMessages().then(setList); }, []);
  async function clear() { await store.clearMessages(); setList([]); }
  if (list === null) return <p className="para">Loading…</p>;
  if (list.length === 0) return <div className="card" style={{ padding: 30, textAlign: "center" }}>
    <div style={{ margin: "0 auto 10px", width: 32 }}><Icon name="mail" size={32} color="#52617A" /></div>
    <div style={{ fontSize: 14, color: "var(--inkSoft)" }}>No messages yet. Notes from the Contact page appear here.</div>
  </div>;
  return (<>
    {list.map((m) => (
      <div key={m.id} className="card" style={{ padding: 15, marginBottom: 11 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{m.name}</div>
          <span style={{ fontSize: 11.5, color: "var(--inkSoft)" }}>{fmtDate((m.date || "").slice(0, 10))}</span>
        </div>
        {m.email && <div style={{ fontSize: 12, color: "var(--azure)", fontWeight: 600, marginTop: 2 }}>{m.email}</div>}
        <p className="para" style={{ margin: "8px 0 0", fontSize: 13 }}>{m.message}</p>
      </div>
    ))}
    <button className="btnGhost" onClick={clear} style={{ width: "100%", padding: 11, marginTop: 4, color: "#FF6B5E", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
      <Icon name="trash" size={15} color="#FF6B5E" /> Clear all messages
    </button>
  </>);
}

/* ---------- Teachers (staff accounts) ---------- */
function Teachers() {
  const [list, setList] = useState(null);
  const [form, setForm] = useState({ name: "", assignments: [], joined: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", assignments: [], joined: "" });
  useEffect(() => { store.listStaff().then(setList); }, []);

  function startEdit(s) {
    const asg = s.assignments && s.assignments.length ? s.assignments : (s.grades || []).map((g) => ({ subject: s.subject, grade: g }));
    setEditId(s.id); setEditForm({ name: s.name || "", assignments: asg, joined: s.joined || "" });
  }
  async function saveEdit(s) {
    const patch = { name: editForm.name.trim(), assignments: editForm.assignments, joined: editForm.joined.trim() };
    const { subject, grades } = deriveAssignments(editForm.assignments);
    const full = { ...patch, subject, grades };
    await store.updateStaff(s.id, full);
    if (s.uid) await store.updateUserDoc(s.uid, full);
    setList((l) => l.map((x) => (x.id === s.id ? { ...x, ...full } : x)));
    setEditId(null);
  }

  async function add() {
    setErr("");
    if (!form.name.trim() || form.assignments.length === 0) { setErr("Enter a name and add at least one class."); return; }
    if (hasFirebase && (!form.email.trim() || form.password.length < 6)) { setErr("Enter an email and a password of at least 6 characters for the teacher's login."); return; }
    setBusy(true);
    try {
      const rec = await store.addStaffFromAssignments({ name: form.name.trim(), assignments: form.assignments, joined: form.joined.trim() });
      if (hasFirebase) await createTeacherAccount({ email: form.email.trim(), password: form.password, staffId: rec.id, name: rec.name, assignments: form.assignments, joined: form.joined.trim() });
      setList((l) => [...(l || []), { ...rec, email: form.email.trim() }]);
      setForm({ name: "", assignments: [], joined: "", email: "", password: "" });
    } catch (e) { setErr(e.message || "Could not create the account."); } finally { setBusy(false); }
  }
  async function remove(id) { await store.removeStaff(id); setList((l) => l.filter((s) => s.id !== id)); }

  return (
    <>
      <div className="card" style={{ padding: 15, marginBottom: 16, borderColor: "var(--azure)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 10 }}>Add a teacher login</div>
        <input className="input" placeholder="Teacher's name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <TeacherAssignments value={form.assignments} onChange={(a) => setForm((f) => ({ ...f, assignments: a }))} />
        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", display: "block", margin: "2px 0 6px" }}>Joined KTN (year)</label>
        <input className="input" placeholder="e.g. 2019" inputMode="numeric" value={form.joined} onChange={(e) => setForm((f) => ({ ...f, joined: e.target.value.replace(/[^0-9]/g, "").slice(0, 4) }))} />
        {hasFirebase && (<>
          <input className="input" type="email" placeholder="Teacher's login email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <input className="input" type="text" placeholder="Temporary password (min 6 chars)" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
        </>)}
        {err && <div style={{ color: "#FF6B5E", fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>{err}</div>}
        <button className="btnP" onClick={add} disabled={busy} style={{ width: "100%", justifyContent: "center", opacity: busy ? 0.7 : 1 }}>
          <Icon name="plus" size={15} color="#fff" sw={2.5} /> {busy ? "Adding…" : "Add teacher"}
        </button>
      </div>
      {list === null ? <p className="para">Loading…</p> : (list || []).map((s) => {
        const asg = s.assignments && s.assignments.length ? s.assignments : (s.grades || []).map((g) => ({ subject: s.subject, grade: g }));
        if (editId === s.id) {
          return (
            <div key={s.id} className="card" style={{ padding: 15, marginBottom: 8, borderColor: "var(--azure)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 10 }}>Edit teacher</div>
              <input className="input" placeholder="Teacher's name" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
              <TeacherAssignments value={editForm.assignments} onChange={(a) => setEditForm((f) => ({ ...f, assignments: a }))} />
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", display: "block", margin: "2px 0 6px" }}>Joined KTN (year)</label>
              <input className="input" placeholder="e.g. 2019" inputMode="numeric" value={editForm.joined} onChange={(e) => setEditForm((f) => ({ ...f, joined: e.target.value.replace(/[^0-9]/g, "").slice(0, 4) }))} />
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btnP" onClick={() => saveEdit(s)} style={{ flex: 1, justifyContent: "center" }}>Save changes</button>
                <button className="btnGhost" onClick={() => setEditId(null)} style={{ padding: "10px 16px", fontWeight: 600 }}>Cancel</button>
              </div>
              <p style={{ fontSize: 11.5, color: "var(--inkSoft)", margin: "10px 2px 0" }}>Email/password aren't changed here — the teacher can reset their own password from the sign-in screen.</p>
            </div>
          );
        }
        return (
          <div key={s.id} className="card" style={{ padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)" }}>{s.name}{s.joined ? <span style={{ fontSize: 11, color: "var(--inkSoft)", fontWeight: 600 }}> · since {s.joined}</span> : ""}</div>
              <div style={{ fontSize: 11.5, color: "var(--inkSoft)" }}>
                <b style={{ color: "var(--azure)" }}>{hasFirebase ? (s.email || s.code) : s.code}</b>
                {asg.length ? " · " + asg.map(assignmentLabel).join(", ") : " · no classes set"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
              <button className="btnGhost" onClick={() => startEdit(s)} aria-label="Edit" style={{ padding: 7 }}><Icon name="edit" size={15} color="#2F6BFF" /></button>
              <button className="btnGhost" onClick={() => remove(s.id)} aria-label="Remove" style={{ padding: 7 }}><Icon name="trash" size={15} color="#FF6B5E" /></button>
            </div>
          </div>
        );
      })}
    </>
  );
}

/* ---------- Notices ---------- */
function Notices() {
  const [list, setList] = useState(null);
  const [form, setForm] = useState({ title: "", body: "", pinned: false });
  useEffect(() => { store.listNews().then(setList); }, []);
  async function add() {
    if (!form.title.trim()) return;
    const rec = await store.addNews({ title: form.title.trim(), body: form.body.trim(), pinned: form.pinned, date: new Date().toISOString().slice(0, 10) });
    setList((l) => [rec, ...(l || [])]); setForm({ title: "", body: "", pinned: false });
  }
  async function remove(id) { await store.deleteNews(id); setList((l) => l.filter((n) => n.id !== id)); }
  return (
    <>
      <div className="card" style={{ padding: 15, marginBottom: 16, borderColor: "var(--azure)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 10 }}>Post a notice</div>
        <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        <textarea className="input" rows={3} placeholder="Message…" value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} style={{ resize: "vertical" }} />
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--inkSoft)", marginBottom: 12, cursor: "pointer" }}>
          <input type="checkbox" checked={form.pinned} onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))} /> Pin to top
        </label>
        <button className="btnP" onClick={add} style={{ width: "100%", justifyContent: "center" }}><Icon name="plus" size={15} color="#fff" sw={2.5} /> Publish notice</button>
      </div>
      {list === null ? <p className="para">Loading…</p> : (list || []).map((n) => (
        <div key={n.id} className="card" style={{ padding: 14, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {n.pinned && <span className="pillBadge" style={{ background: "#FDEEDA", color: "#B76A0E" }}><Icon name="pin" size={12} color="#B76A0E" sw={2.4} /> Pinned</span>}
              <span style={{ fontSize: 12, color: "var(--inkSoft)", fontWeight: 600 }}>{fmtDate(n.date)}</span>
            </div>
            <button className="btnGhost" onClick={() => remove(n.id)}><Icon name="trash" size={15} color="#FF6B5E" /></button>
          </div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, color: "var(--ink)", margin: "8px 0 5px" }}>{n.title}</div>
          <p className="para" style={{ margin: 0, fontSize: 13 }}>{n.body}</p>
        </div>
      ))}
    </>
  );
}

/* ---------- Timetable (fully editable) ---------- */
function Timetable() {
  const [grade, setGrade] = useState(GRADES[0]);
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState({ subject: "", teacher: "", day: "Mon", time: "", link: "" });
  const [editId, setEditId] = useState(null);
  const [edit, setEdit] = useState({ subject: "", teacher: "", day: "Mon", time: "", link: "" });
  useEffect(() => { setRows(null); store.listTimetableExtra(grade).then(setRows); }, [grade]);

  const base = TT[grade] || [];
  const usingBase = rows !== null && rows.length === 0;

  async function importBase() {
    const created = [];
    for (const r of base) created.push(await store.addTimetableExtra(grade, { subject: r[0], teacher: r[1], day: r[2], time: r[3], link: "" }));
    setRows(created);
  }
  async function add() {
    if (!form.subject.trim() || !form.time.trim()) return;
    const rec = await store.addTimetableExtra(grade, { subject: form.subject.trim(), teacher: form.teacher.trim(), day: form.day, time: form.time.trim(), link: form.link.trim() });
    setRows((x) => [...(x || []), rec]); setForm({ subject: "", teacher: "", day: "Mon", time: "", link: "" });
  }
  async function remove(id) { await store.removeTimetableExtra(grade, id); setRows((x) => x.filter((r) => r.id !== id)); }
  function startEdit(r) { setEditId(r.id); setEdit({ subject: r.subject, teacher: r.teacher || "", day: r.day, time: r.time, link: r.link || "" }); }
  async function saveEdit(id) { await store.updateTimetableRow(grade, id, edit); setRows((x) => x.map((r) => (r.id === id ? { ...r, ...edit } : r))); setEditId(null); }

  return (
    <>
      <div className="seg" style={{ marginBottom: 14 }}>{GRADES.map((g) => <button key={g} className={grade === g ? "on" : ""} onClick={() => setGrade(g)}>{g}</button>)}</div>

      {rows === null ? <p className="para">Loading…</p> : usingBase ? (
        <>
          <div className="card" style={{ padding: 14, marginBottom: 12, background: "var(--tintBlue)", border: "none" }}>
            <div style={{ fontSize: 13, color: "var(--navy)", fontWeight: 600, marginBottom: 10 }}>These are the built-in rows for {grade}. Import them to edit or remove them here.</div>
            <button className="btnP" onClick={importBase} style={{ justifyContent: "center" }}><Icon name="plus" size={15} color="#fff" sw={2.5} /> Import {grade} rows to edit</button>
          </div>
          {base.map((r, i) => <Row key={"b" + i} subject={r[0]} teacher={r[1]} day={r[2]} time={r[3]} />)}
        </>
      ) : (
        rows.map((r) => editId === r.id ? (
          <div key={r.id} className="card" style={{ padding: 14, marginBottom: 8, borderColor: "var(--azure)" }}>
            <input className="input" placeholder="Subject" value={edit.subject} onChange={(e) => setEdit((s) => ({ ...s, subject: e.target.value }))} />
            <input className="input" placeholder="Teacher" value={edit.teacher} onChange={(e) => setEdit((s) => ({ ...s, teacher: e.target.value }))} />
            <div style={{ display: "flex", gap: 10 }}>
              <select className="input" value={edit.day} onChange={(e) => setEdit((s) => ({ ...s, day: e.target.value }))} style={{ flex: 1 }}>{DAYS.map((d) => <option key={d}>{d}</option>)}</select>
              <input className="input" placeholder="Time" value={edit.time} onChange={(e) => setEdit((s) => ({ ...s, time: e.target.value }))} style={{ flex: 2 }} />
            </div>
            <input className="input" placeholder="Join link (Zoom / Meet) — optional" value={edit.link} onChange={(e) => setEdit((s) => ({ ...s, link: e.target.value }))} />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btnP" onClick={() => saveEdit(r.id)} style={{ flex: 1, justifyContent: "center" }}>Save</button>
              <button className="btnGhost" onClick={() => setEditId(null)} style={{ padding: "10px 14px" }}>Cancel</button>
            </div>
          </div>
        ) : (
          <Row key={r.id} subject={r.subject} teacher={r.teacher} day={r.day} time={r.time} link={r.link} onEdit={() => startEdit(r)} onRemove={() => remove(r.id)} />
        ))
      )}

      {!usingBase && rows !== null && (
        <div className="card" style={{ padding: 15, marginTop: 12, borderColor: "var(--azure)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 10 }}>Add a class to {grade}</div>
          <input className="input" placeholder="Subject" list="subjlist" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
          <datalist id="subjlist">{(SUBJECTS_BY_GRADE[grade] || []).map((s) => <option key={s} value={s} />)}</datalist>
          <input className="input" placeholder="Teacher" value={form.teacher} onChange={(e) => setForm((f) => ({ ...f, teacher: e.target.value }))} />
          <div style={{ display: "flex", gap: 10 }}>
            <select className="input" value={form.day} onChange={(e) => setForm((f) => ({ ...f, day: e.target.value }))} style={{ flex: 1 }}>{DAYS.map((d) => <option key={d}>{d}</option>)}</select>
            <input className="input" placeholder="e.g. 6:00–7:00 PM" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} style={{ flex: 2 }} />
          </div>
          <input className="input" placeholder="Join link (Zoom / Meet) — optional" value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} />
          <button className="btnP" onClick={add} style={{ width: "100%", justifyContent: "center" }}><Icon name="plus" size={15} color="#fff" sw={2.5} /> Add class</button>
        </div>
      )}
    </>
  );
}
function Row({ subject, teacher, day, time, link, onEdit, onRemove }) {
  const col = DAYCOL[day] || "#2F6BFF";
  return (
    <div className="card" style={{ padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14.5, fontWeight: 700, color: "var(--ink)" }}>{subject}</div>
        {teacher ? <div style={{ fontSize: 12, color: "var(--inkSoft)", marginTop: 2 }}>{teacher}</div> : null}
        {onEdit && (link
          ? <div style={{ fontSize: 11, color: "#1E9E5A", fontWeight: 700, marginTop: 3, display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="globe" size={11} color="#1E9E5A" sw={2.4} /> Join link set</div>
          : <div style={{ fontSize: 11, color: "#9AA7BE", marginTop: 3 }}>No join link yet</div>)}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ textAlign: "right" }}>
          <span style={{ display: "inline-block", fontSize: 11, fontWeight: 800, color: "#fff", background: col, padding: "3px 9px", borderRadius: 999 }}>{day}</span>
          <div style={{ fontSize: 11.5, color: "var(--inkSoft)", fontWeight: 600, marginTop: 3, whiteSpace: "nowrap" }}>{time}</div>
        </div>
        {onEdit && <button className="btnGhost" onClick={onEdit} style={{ padding: 7 }}><Icon name="pin" size={13} color="#52617A" /></button>}
        {onRemove && <button className="btnGhost" onClick={onRemove}><Icon name="trash" size={14} color="#FF6B5E" /></button>}
      </div>
    </div>
  );
}

/* ---------- Photos ---------- */
function Photos() {
  const [list, setList] = useState(null);
  const [form, setForm] = useState({ src: "", cap: "" });
  useEffect(() => { store.listGalleryExtra().then(setList); }, []);
  async function add() {
    if (!form.src.trim()) return;
    const rec = await store.addGalleryExtra({ src: form.src.trim(), cap: form.cap.trim() });
    setList((l) => [...(l || []), rec]); setForm({ src: "", cap: "" });
  }
  async function remove(id) { await store.removeGalleryExtra(id); setList((l) => l.filter((g) => g.id !== id)); }
  return (
    <>
      <div className="card" style={{ padding: 15, marginBottom: 16, borderColor: "var(--azure)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 10 }}>Add a photo to the home gallery</div>
        <input className="input" placeholder="Image link (https://…)" value={form.src} onChange={(e) => setForm((f) => ({ ...f, src: e.target.value }))} />
        <input className="input" placeholder="Caption" value={form.cap} onChange={(e) => setForm((f) => ({ ...f, cap: e.target.value }))} />
        <button className="btnP" onClick={add} style={{ width: "100%", justifyContent: "center" }}><Icon name="plus" size={15} color="#fff" sw={2.5} /> Add photo</button>
        <p style={{ fontSize: 11.5, color: "var(--inkSoft)", margin: "10px 2px 0" }}>Paste a link to a photo already online. Direct phone uploads need Firebase Storage — ask me to wire it up.</p>
      </div>
      {list === null ? <p className="para">Loading…</p> : (list || []).length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--inkSoft)", fontSize: 14 }}>No added photos yet. The built-in gallery still shows on the home page.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {list.map((g) => (
            <div key={g.id} className="card" style={{ overflow: "hidden", padding: 0 }}>
              <img src={g.src} alt={g.cap} style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }} />
              <div style={{ padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "var(--ink)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.cap || "Photo"}</span>
                <button className="btnGhost" onClick={() => remove(g.id)} style={{ padding: 6 }}><Icon name="trash" size={13} color="#FF6B5E" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------- Teacher profiles (public directory) ---------- */
function TeacherProfiles() {
  const [list, setList] = useState(null);
  const [form, setForm] = useState({ name: "", role: "", joined: "", photo: "" });
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState(null);
  const [edit, setEdit] = useState({ name: "", role: "", joined: "", photo: "" });
  useEffect(() => { store.listDirectory().then(setList); }, []);

  async function add() {
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      const rec = await store.addDirectory({ name: form.name.trim(), role: form.role.trim(), joined: form.joined.trim(), photo: form.photo || "" });
      setList((l) => [...(l || []), rec]); setForm({ name: "", role: "", joined: "", photo: "" });
    } finally { setBusy(false); }
  }
  async function importBuiltin() {
    setBusy(true);
    try {
      const items = BUILTIN_TEACHERS.map((t) => ({ name: t.name, role: t.role, joined: t.joined, photo: t.photo }));
      const recs = await store.importDirectory(items);
      setList((l) => [...(l || []), ...recs]);
    } finally { setBusy(false); }
  }
  async function remove(id) { await store.removeDirectory(id); setList((l) => l.filter((d) => d.id !== id)); }
  function startEdit(d) { setEditId(d.id); setEdit({ name: d.name, role: d.role || "", joined: d.joined || "", photo: d.photo || "" }); }
  async function saveEdit(id) { await store.updateDirectory(id, edit); setList((l) => l.map((d) => (d.id === id ? { ...d, ...edit } : d))); setEditId(null); }

  return (
    <>
      {(list !== null && list.length === 0) && (
        <div className="card" style={{ padding: 14, marginBottom: 16, background: "var(--tintBlue)", border: "none" }}>
          <div style={{ fontSize: 13, color: "var(--navy)", fontWeight: 600, marginBottom: 10 }}>The public Teachers page currently shows the 28 built-in profiles. Import them to edit, or just add new teachers below.</div>
          <button className="btnP" onClick={importBuiltin} disabled={busy} style={{ justifyContent: "center" }}><Icon name="plus" size={15} color="#fff" sw={2.5} /> {busy ? "Importing…" : "Import the 28 built-in profiles"}</button>
        </div>
      )}

      <div className="card" style={{ padding: 16, marginBottom: 16, borderColor: "var(--azure)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 10 }}>Add a teacher profile</div>
        <ImagePicker value={form.photo} onChange={(v) => setForm((f) => ({ ...f, photo: v }))} shape="circle" maxSize={300} />
        <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <input className="input" placeholder="Role (e.g. Grade 3 · English)" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
        <input className="input" placeholder="Since (e.g. 2020)" value={form.joined} onChange={(e) => setForm((f) => ({ ...f, joined: e.target.value }))} />
        <button className="btnP" onClick={add} disabled={busy} style={{ width: "100%", justifyContent: "center" }}><Icon name="plus" size={15} color="#fff" sw={2.5} /> Add profile</button>
      </div>

      {list === null ? <p className="para">Loading…</p> : list.map((d) => editId === d.id ? (
        <div key={d.id} className="card" style={{ padding: 14, marginBottom: 8, borderColor: "var(--azure)" }}>
          <ImagePicker value={edit.photo} onChange={(v) => setEdit((s) => ({ ...s, photo: v }))} shape="circle" maxSize={300} />
          <input className="input" placeholder="Name" value={edit.name} onChange={(e) => setEdit((s) => ({ ...s, name: e.target.value }))} />
          <input className="input" placeholder="Role" value={edit.role} onChange={(e) => setEdit((s) => ({ ...s, role: e.target.value }))} />
          <input className="input" placeholder="Since" value={edit.joined} onChange={(e) => setEdit((s) => ({ ...s, joined: e.target.value }))} />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btnP" onClick={() => saveEdit(d.id)} style={{ flex: 1, justifyContent: "center" }}>Save</button>
            <button className="btnGhost" onClick={() => setEditId(null)} style={{ padding: "10px 14px" }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div key={d.id} className="card" style={{ padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
          {d.photo ? <img src={d.photo} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} /> : <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#EAF1FF" }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{d.name}</div>
            <div style={{ fontSize: 11.5, color: "var(--inkSoft)" }}>{d.role}{d.joined ? ` · since ${d.joined}` : ""}</div>
          </div>
          <button className="btnGhost" onClick={() => startEdit(d)} style={{ padding: 7 }}><Icon name="pin" size={13} color="#52617A" /></button>
          <button className="btnGhost" onClick={() => remove(d.id)}><Icon name="trash" size={15} color="#FF6B5E" /></button>
        </div>
      ))}
    </>
  );
}

/* ---------- Site content (founders, history, home-page text) ---------- */
function SiteContent() {
  const [loaded, setLoaded] = useState(false);
  const [taglines, setTaglines] = useState("");
  const [teach, setTeach] = useState("");
  const [press, setPress] = useState(PRESS_DEF);
  const [leader, setLeader] = useState(LEADER_DEF);
  const [founders, setFounders] = useState(FOUNDERS_DEF);
  const [milestones, setMilestones] = useState(MILESTONES_DEF);
  const [calendarImage, setCalendarImage] = useState("");
  const [stats, setStats] = useState({ years: "6", students: "100+", grades: "7", free: "Free" });
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    store.getSiteContent().then((s) => {
      s = s || {};
      setTaglines((s.taglines && s.taglines.length ? s.taglines : ROTATING).join("\n"));
      setTeach((s.teach && s.teach.length ? s.teach : TEACH_DEF).join("\n"));
      setPress(s.press || PRESS_DEF);
      setLeader(s.leaderMessage || LEADER_DEF);
      setFounders(s.founders && s.founders.length ? s.founders : FOUNDERS_DEF);
      setMilestones(s.milestones && s.milestones.length ? s.milestones : MILESTONES_DEF);
      setCalendarImage(s.calendarImage || "");
      setStats(s.stats || { years: "6", students: "100+", grades: "7", free: "Free" });
      setLoaded(true);
    });
  }, []);

  async function useLiveCount() {
    const all = await store.listStudents();
    const rounded = Math.floor(all.length / 50) * 50;
    setStats((st) => ({ ...st, students: (rounded < 50 ? all.length : rounded) + "+" }));
  }

  async function save() {
    setBusy(true); setSaved(false);
    try {
      await store.saveSiteContent({
        taglines: taglines.split("\n").map((x) => x.trim()).filter(Boolean),
        teach: teach.split("\n").map((x) => x.trim()).filter(Boolean),
        press, leaderMessage: leader, founders, milestones, calendarImage, stats,
      });
      setSaved(true);
    } finally { setBusy(false); }
  }

  if (!loaded) return <p className="para">Loading…</p>;
  const lbl = { fontSize: 12, fontWeight: 700, color: "var(--ink)", display: "block", margin: "2px 0 6px" };

  return (
    <>
      <Section title="Home — rotating taglines (one per line)">
        <textarea className="input" rows={4} value={taglines} onChange={(e) => setTaglines(e.target.value)} style={{ resize: "vertical" }} />
      </Section>
      <Section title="Home — “What we teach” chips (one per line)">
        <textarea className="input" rows={4} value={teach} onChange={(e) => setTeach(e.target.value)} style={{ resize: "vertical" }} />
      </Section>

      <Section title="Home — “In the news” card">
        <label style={lbl}>Outlet</label><input className="input" value={press.outlet} onChange={(e) => setPress({ ...press, outlet: e.target.value })} />
        <label style={lbl}>Title</label><input className="input" value={press.title} onChange={(e) => setPress({ ...press, title: e.target.value })} />
        <label style={lbl}>Link</label><input className="input" value={press.url} onChange={(e) => setPress({ ...press, url: e.target.value })} />
        <label style={lbl}>Summary</label><textarea className="input" rows={3} value={press.blurb} onChange={(e) => setPress({ ...press, blurb: e.target.value })} style={{ resize: "vertical" }} />
      </Section>

      <Section title="Home — headline statistics (update each year)">
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}><label style={lbl}>Years</label><input className="input" value={stats.years} onChange={(e) => setStats((s) => ({ ...s, years: e.target.value }))} /></div>
          <div style={{ flex: 1 }}><label style={lbl}>Students / year</label><input className="input" value={stats.students} onChange={(e) => setStats((s) => ({ ...s, students: e.target.value }))} /></div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}><label style={lbl}>Grade levels</label><input className="input" value={stats.grades} onChange={(e) => setStats((s) => ({ ...s, grades: e.target.value }))} /></div>
          <div style={{ flex: 1 }}><label style={lbl}>Cost label</label><input className="input" value={stats.free} onChange={(e) => setStats((s) => ({ ...s, free: e.target.value }))} /></div>
        </div>
        <button className="btnGhost" onClick={useLiveCount} style={{ color: "var(--azure)", fontWeight: 700, fontSize: 13, marginTop: 2 }}>Use current student count (rounded)</button>
        <p style={{ fontSize: 11.5, color: "var(--inkSoft)", margin: "6px 2px 0" }}>Type “100+”, “150+”, etc. The button reads your live roster and rounds down to the nearest 50 (e.g. 112 → 100+, 164 → 150+).</p>
      </Section>

      <Section title="Academic calendar image (replace each year)">
        <ImagePicker value={calendarImage} onChange={setCalendarImage} shape="square" maxSize={1400} quality={0.82} />
        <p style={{ fontSize: 11.5, color: "var(--inkSoft)", margin: "2px 2px 0" }}>Upload next year's calendar image here. Leave empty to show the built-in 2026–27 calendar.</p>
      </Section>

      <Section title="Founders">
        {founders.map((f, i) => (
          <div key={i} className="card" style={{ padding: 12, marginBottom: 8 }}>
            <ImagePicker value={f.photo || ""} onChange={(v) => setFounders(upd(founders, i, { photo: v }))} shape="circle" maxSize={320} />
            <input className="input" placeholder="Name" value={f.name} onChange={(e) => setFounders(upd(founders, i, { name: e.target.value }))} />
            <input className="input" placeholder="Role" value={f.role} onChange={(e) => setFounders(upd(founders, i, { role: e.target.value }))} />
            <textarea className="input" placeholder="Message (optional)" rows={2} value={f.message || ""} onChange={(e) => setFounders(upd(founders, i, { message: e.target.value }))} style={{ resize: "vertical" }} />
            <button className="btnGhost" onClick={() => setFounders(founders.filter((_, k) => k !== i))} style={{ color: "#FF6B5E", fontSize: 12.5, fontWeight: 600 }}>Remove</button>
          </div>
        ))}
        <button className="btnGhost" onClick={() => setFounders([...founders, { name: "", role: "", message: "", photo: "" }])} style={{ color: "var(--azure)", fontWeight: 700, fontSize: 13 }}>+ Add founder</button>
      </Section>

      <Section title="Director's / leadership message">
        <label style={lbl}>Name</label><input className="input" value={leader.name} onChange={(e) => setLeader({ ...leader, name: e.target.value })} />
        <label style={lbl}>Role</label><input className="input" value={leader.role} onChange={(e) => setLeader({ ...leader, role: e.target.value })} />
        <label style={lbl}>Message</label><textarea className="input" rows={3} value={leader.message} onChange={(e) => setLeader({ ...leader, message: e.target.value })} style={{ resize: "vertical" }} />
      </Section>

      <Section title="History timeline (About page)">
        {milestones.map((m, i) => (
          <div key={i} className="card" style={{ padding: 12, marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="input" placeholder="Year" value={m.year} onChange={(e) => setMilestones(upd(milestones, i, { year: e.target.value }))} style={{ flex: 1 }} />
              <input className="input" placeholder="#color" value={m.color || "#2F6BFF"} onChange={(e) => setMilestones(upd(milestones, i, { color: e.target.value }))} style={{ width: 100 }} />
            </div>
            <input className="input" placeholder="Title" value={m.title} onChange={(e) => setMilestones(upd(milestones, i, { title: e.target.value }))} />
            <textarea className="input" placeholder="Description" rows={2} value={m.body} onChange={(e) => setMilestones(upd(milestones, i, { body: e.target.value }))} style={{ resize: "vertical" }} />
            <button className="btnGhost" onClick={() => setMilestones(milestones.filter((_, k) => k !== i))} style={{ color: "#FF6B5E", fontSize: 12.5, fontWeight: 600 }}>Remove</button>
          </div>
        ))}
        <button className="btnGhost" onClick={() => setMilestones([...milestones, { year: "", title: "", body: "", color: "#2F6BFF" }])} style={{ color: "var(--azure)", fontWeight: 700, fontSize: 13 }}>+ Add milestone</button>
      </Section>

      <button className="btnP" onClick={save} disabled={busy} style={{ width: "100%", justifyContent: "center", marginTop: 8, opacity: busy ? 0.7 : 1 }}>
        {saved ? <><Icon name="check" size={16} color="#fff" sw={2.5} /> Saved</> : (busy ? "Saving…" : "Save all content")}
      </button>
      <div style={{ height: 8 }} />
    </>
  );
}
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h3 className="h2" style={{ marginBottom: 10 }}>{title}</h3>
      {children}
    </div>
  );
}
function upd(arr, i, patch) { return arr.map((x, k) => (k === i ? { ...x, ...patch } : x)); }

import { useState, useEffect } from "react";
import Icon from "../data/icons.jsx";
import Mascot from "../components/Mascot.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { GRADES, TERMS, ATT_LABEL, ATT_COLOR, MARK_MAX } from "../data/school";
import { fmtDate, classCancelledToday, driveFolderPath } from "../lib/util";
import { hasDrive, uploadToDrive } from "../lib/drive";
import FileViewer from "../components/FileViewer.jsx";
import { TEACHERS } from "../data/teachers";
import * as store from "../lib/store";

const today = () => new Date().toISOString().slice(0, 10);

/* Small grade selector, only shown when a teacher has more than one grade. */
function GradePicker({ grades, grade, onPick }) {
  if (grades.length <= 1) return null;
  return (
    <div className="seg">
      {grades.map((g) => (
        <button key={g} className={grade === g ? "on" : ""} onClick={() => onPick(g)}>{g}</button>
      ))}
    </div>
  );
}

/* ---------------- Attendance (for the teacher's own subject) ---------------- */
function Attendance({ grades, subject }) {
  const [grade, setGrade] = useState(grades[0]);
  const [date, setDate] = useState(today());
  const [students, setStudents] = useState([]);
  const [rec, setRec] = useState({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true; setLoading(true); setSaved(false);
    Promise.all([store.listStudentsByGrade(grade), store.getAttendance(grade, subject, date)]).then(([all, existing]) => {
      if (!live) return;
      const inGrade = all.filter((s) => s.grade === grade);
      setStudents(inGrade);
      const base = {};
      inGrade.forEach((s) => { base[s.id] = existing[s.id] || "present"; });
      setRec(base); setLoading(false);
    });
    return () => { live = false; };
  }, [grade, subject, date]);

  function cycle(id) {
    setSaved(false);
    setRec((r) => {
      const order = ["present", "absent", "late"];
      return { ...r, [id]: order[(order.indexOf(r[id]) + 1) % order.length] };
    });
  }
  async function save() { await store.saveAttendance(grade, subject, date, rec); setSaved(true); }

  const counts = students.reduce((a, s) => { a[rec[s.id]] = (a[rec[s.id]] || 0) + 1; return a; }, {});

  return (
    <>
      <div className="card" style={{ padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8, background: "var(--tintBlue)", border: "none" }}>
        <Icon name="book" size={16} color="#2F6BFF" sw={2.3} />
        <span style={{ fontSize: 13, color: "var(--navy)", fontWeight: 700 }}>{subject} class attendance</span>
      </div>
      <GradePicker grades={grades} grade={grade} onPick={setGrade} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0" }}>
        <Icon name="calendar" size={16} color="#52617A" />
        <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} style={{ margin: 0, maxWidth: 190 }} />
      </div>

      {loading ? <p className="para">Loading class…</p> : students.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--inkSoft)", fontSize: 14 }}>No students in {grade} yet. Ask an admin to add them.</div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {["present", "absent", "late"].map((k) => (
              <span key={k} className="pillBadge" style={{ background: "#fff", border: "1px solid var(--line)", color: ATT_COLOR[k] }}>{counts[k] || 0} {ATT_LABEL[k]}</span>
            ))}
          </div>
          {students.map((s) => (
            <div key={s.id} className="card" style={{ padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)" }}>{s.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--inkSoft)" }}>{s.code}</div>
              </div>
              <button onClick={() => cycle(s.id)} style={{ border: "none", cursor: "pointer", borderRadius: 999, padding: "7px 16px", fontWeight: 700, fontSize: 13, color: "#fff", background: ATT_COLOR[rec[s.id]] }}>{ATT_LABEL[rec[s.id]]}</button>
            </div>
          ))}
          <p style={{ fontSize: 11.5, color: "var(--inkSoft)", margin: "6px 2px 12px" }}>Tap a status to change it (Present → Absent → Late).</p>
          <button className="btnP" onClick={save} style={{ width: "100%", justifyContent: "center" }}>
            {saved ? <><Icon name="check" size={16} color="#fff" sw={2.5} /> Saved for {fmtDate(date)}</> : "Save attendance"}
          </button>
        </>
      )}
      <div style={{ height: 8 }} />
    </>
  );
}

/* ---------------- Marks (locked to the teacher's subject) ---------------- */
function Marks({ grades, subject }) {
  const [grade, setGrade] = useState(grades[0]);
  const [term, setTerm] = useState(TERMS[0]);
  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true; setLoading(true); setSaved(false);
    Promise.all([store.listStudentsByGrade(grade), store.getMarks(grade, subject, term)]).then(([all, existing]) => {
      if (!live) return;
      const inGrade = all.filter((s) => s.grade === grade);
      setStudents(inGrade);
      const base = {};
      inGrade.forEach((s) => { base[s.id] = existing[s.id] != null ? String(existing[s.id]) : ""; });
      setScores(base); setLoading(false);
    });
    return () => { live = false; };
  }, [grade, subject, term]);

  function setScore(id, v) { setSaved(false); setScores((s) => ({ ...s, [id]: v.replace(/[^0-9]/g, "").slice(0, 3) })); }
  async function save() {
    const out = {};
    Object.keys(scores).forEach((id) => { if (scores[id] !== "") out[id] = Math.min(MARK_MAX, parseInt(scores[id], 10)); });
    await store.saveMarks(grade, subject, term, out); setSaved(true);
  }

  return (
    <>
      <div className="card" style={{ padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8, background: "var(--tintBlue)", border: "none" }}>
        <Icon name="award" size={16} color="#2F6BFF" sw={2.3} />
        <span style={{ fontSize: 13, color: "var(--navy)", fontWeight: 700 }}>{subject} marks · out of {MARK_MAX}</span>
      </div>
      <GradePicker grades={grades} grade={grade} onPick={setGrade} />
      <div className="seg" style={{ marginTop: grades.length > 1 ? 8 : 0 }}>
        {TERMS.map((t) => (<button key={t} className={term === t ? "on" : ""} onClick={() => setTerm(t)}>{t}</button>))}
      </div>
      <div style={{ margin: "12px 0 10px", fontSize: 12.5, color: "var(--inkSoft)", fontWeight: 600 }}>{grade} · {subject} · {term}</div>

      {loading ? <p className="para">Loading…</p> : students.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--inkSoft)", fontSize: 14 }}>No students in {grade} yet.</div>
      ) : (
        <>
          {students.map((s) => (
            <div key={s.id} className="card" style={{ padding: "10px 14px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)" }}>{s.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--inkSoft)" }}>{s.code}</div>
              </div>
              <input inputMode="numeric" value={scores[s.id]} onChange={(e) => setScore(s.id, e.target.value)} placeholder="-"
                style={{ width: 64, textAlign: "center", padding: "9px 8px", borderRadius: 10, border: "1.5px solid var(--line)", fontSize: 15, fontWeight: 700, color: "var(--ink)", background: "#FBFCFF" }} />
            </div>
          ))}
          <button className="btnP" onClick={save} style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
            {saved ? <><Icon name="check" size={16} color="#fff" sw={2.5} /> Marks saved</> : "Save marks"}
          </button>
        </>
      )}
      <div style={{ height: 8 }} />
    </>
  );
}

/* ---------------- Teacher Today dashboard ---------------- */
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function TeacherToday({ user, regular, specials, onTake, onMarks }) {
  const [info, setInfo] = useState(null); // per-class: {time, day, link, size}
  useEffect(() => {
    let live = true;
    Promise.all(regular.map(async (a) => {
      const [tt, studs] = await Promise.all([store.getTimetable(a.grade), store.listStudentsByGrade(a.grade)]);
      const row = tt.find((r) => (r.subject || "").toLowerCase() === (a.subject || "").toLowerCase()) || {};
      return { time: row.time || "", day: row.day || "", link: row.link || "", size: studs.length };
    })).then((res) => { if (live) setInfo(res); });
    return () => { live = false; };
  }, [user.id]);

  const today = DAYS[new Date().getDay()];
  const todays = regular.map((a, i) => ({ a, i, x: info ? info[i] : null })).filter((c) => c.x && c.x.day === today);

  return (
    <>
      <h3 className="h2" style={{ margin: "4px 0 10px" }}>Today · {fmtDate(new Date())}</h3>
      {info === null ? <p className="para">Loading…</p> : todays.length === 0 ? (
        <div className="card" style={{ padding: 20, textAlign: "center", color: "var(--inkSoft)", fontSize: 14 }}>
          <Mascot size={72} style={{ margin: "0 auto 6px" }} />
          <div>No classes scheduled today. 🎉</div>
        </div>
      ) : todays.map(({ a, i, x }) => (
        <div key={i} className="card" style={{ padding: 15, marginBottom: 10, borderColor: "var(--azure)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: "var(--tintBlue)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="book" size={20} color="#2F6BFF" sw={2.2} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 15.5 }}>{a.subject} · {a.grade}</div>
              <div style={{ fontSize: 12, color: "var(--inkSoft)", marginTop: 1 }}>{x.time || "Time TBA"} · {x.size} students</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 13 }}>
            <button className="btnP" onClick={() => onTake(i)} style={{ flex: 1, justifyContent: "center", background: "#1E9E5A" }}><Icon name="check" size={15} color="#fff" sw={2.5} /> Take attendance</button>
            {x.link && <a href={x.link} target="_blank" rel="noopener noreferrer" className="btnP" style={{ textDecoration: "none", background: "var(--tintBlue)", color: "var(--azure)" }}><Icon name="globe" size={15} color="#2F6BFF" sw={2.4} /> Join</a>}
          </div>
        </div>
      ))}

      <h3 className="h2" style={{ margin: "22px 0 10px" }}>Your classes</h3>
      {regular.map((a, i) => (
        <div key={i} className="card" style={{ padding: 14, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 15 }}>{a.subject} · {a.grade}</div>
              <div style={{ fontSize: 12, color: "var(--inkSoft)", marginTop: 1 }}>{info && info[i] ? `${info[i].size} students` : "…"}{info && info[i] && info[i].day ? ` · ${info[i].day} ${info[i].time}` : ""}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btnP" onClick={() => onTake(i)} style={{ flex: 1, justifyContent: "center", background: "#fff", color: "var(--azure)", border: "1px solid var(--line)" }}><Icon name="check" size={15} color="#2F6BFF" sw={2.4} /> Attendance</button>
            <button className="btnP" onClick={() => onMarks(i)} style={{ flex: 1, justifyContent: "center", background: "#fff", color: "var(--azure)", border: "1px solid var(--line)" }}><Icon name="award" size={15} color="#2F6BFF" sw={2.4} /> Marks</button>
          </div>
        </div>
      ))}

      {specials.length > 0 && (
        <div className="card" style={{ padding: 14, marginTop: 4, background: "#EAF7EF", border: "none" }}>
          <div style={{ fontSize: 12.5, color: "#1E7A45", fontWeight: 700 }}>Your special classes</div>
          <div style={{ fontSize: 12.5, color: "#1E7A45", marginTop: 4 }}>{specials.map((a) => a.subject).join(", ")}, attendance &amp; marks tools for these are coming soon.</div>
        </div>
      )}
      <div style={{ height: 8 }} />
    </>
  );
}

/* ---------------- Teacher Assignments (Work) ---------------- */
function TeacherAssignments({ grades, subject }) {
  const [list, setList] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ grade: grades[0] || "", title: "", instructions: "", link: "", viewUrl: "", openUrl: "", downloadUrl: "", fileName: "", due: "" });
  const [expand, setExpand] = useState(null);
  const [detail, setDetail] = useState({});
  const [viewer, setViewer] = useState(null);
  const [up, setUp] = useState(false);
  useEffect(() => { store.listAssignmentsForTeacher(grades, subject).then(setList); }, []);

  async function onFile(e) {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    setUp(true);
    try { const r = await uploadToDrive(driveFolderPath(form.grade, subject, "Assignments", form.due), f); setForm((s) => ({ ...s, link: r.downloadUrl, viewUrl: r.viewUrl, openUrl: r.openUrl, downloadUrl: r.downloadUrl, fileName: r.name })); }
    catch (err) { alert(err.message || "Upload failed"); }
    finally { setUp(false); }
  }

  if (grades.length === 0) return <div className="card" style={{ padding: 20, color: "var(--inkSoft)", fontSize: 14 }}>Assignments are for grade classes. Your special-class tools are coming soon.</div>;

  const [addErr, setAddErr] = useState("");
  async function add() {
    setAddErr("");
    if (!form.title.trim()) { setAddErr("Please add a title."); return; }
    const hasFile = Boolean(form.link.trim());
    const hasInstructions = form.instructions.trim().length > 0;
    if (!hasFile && !hasInstructions) {
      setAddErr("An assignment needs a worksheet, or written instructions telling students what to submit. Please add one of them.");
      return;
    }
    const rec = await store.addAssignment({ grade: form.grade, subject, title: form.title.trim(), instructions: form.instructions.trim(), link: form.link.trim(), viewUrl: form.viewUrl, openUrl: form.openUrl, downloadUrl: form.downloadUrl, fileName: form.fileName, due: form.due });
    setList((l) => [rec, ...(l || [])]); setForm({ grade: form.grade, title: "", instructions: "", link: "", viewUrl: "", openUrl: "", downloadUrl: "", fileName: "", due: "" }); setOpen(false);
  }
  async function remove(id) { await store.removeAssignment(id); setList((l) => l.filter((a) => a.id !== id)); setExpand(null); }
  async function toggleExpand(a) {
    if (expand === a.id) { setExpand(null); return; }
    setExpand(a.id);
    if (!detail[a.id]) {
      const [students, subs] = await Promise.all([store.listStudentsByGrade(a.grade), store.listSubmissions(a.id)]);
      setDetail((d) => ({ ...d, [a.id]: { students, subs } }));
    }
  }
  async function review(a, st) { await setStatus(a, st, "reviewed"); }
  async function setStatus(a, st, status) {
    const rec = await store.setSubmission(a.id, st.id, a.grade, status === "reviewed"
      ? { status: "reviewed", reviewedAt: new Date().toISOString() }
      : { status: "submitted", reviewedAt: "" });
    setDetail((d) => ({ ...d, [a.id]: { ...d[a.id], subs: { ...d[a.id].subs, [st.id]: rec } } }));
  }

  return (
    <>
      {!open ? (
        <button className="btnP" onClick={() => setOpen(true)} style={{ width: "100%", justifyContent: "center", marginBottom: 16 }}>
          <Icon name="plus" size={15} color="#fff" sw={2.5} /> New assignment
        </button>
      ) : (
        <div className="card" style={{ padding: 16, marginBottom: 16, borderColor: "var(--azure)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>New assignment · {subject}</div>
            <button className="btnGhost" onClick={() => setOpen(false)}><Icon name="x" size={15} color="#52617A" /></button>
          </div>
          {grades.length > 1 && (
            <select className="input" value={form.grade} onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}>{grades.map((g) => <option key={g}>{g}</option>)}</select>
          )}
          <input className="input" placeholder="Title (e.g. Worksheet 5, Nouns)" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <textarea className="input" rows={2} placeholder="Instructions, what students should do / submit (required if there's no worksheet)" value={form.instructions} onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))} style={{ resize: "vertical" }} />
          {hasDrive ? (
            <div style={{ marginBottom: 10 }}>
              <label className="btnP" style={{ width: "100%", justifyContent: "center", background: form.fileName ? "#1E9E5A" : "var(--tintBlue)", color: form.fileName ? "#fff" : "var(--azure)", cursor: "pointer" }}>
                <Icon name={form.fileName ? "check" : "plus"} size={15} color={form.fileName ? "#fff" : "#2F6BFF"} sw={2.4} />
                {up ? "Uploading…" : form.fileName ? `Uploaded: ${form.fileName}` : "Upload worksheet (to KTN Drive)"}
                <input type="file" onChange={onFile} style={{ display: "none" }} />
              </label>
            </div>
          ) : (
            <input className="input" placeholder="Worksheet link (Google Drive / any link)" value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} />
          )}
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", display: "block", margin: "2px 0 6px" }}>Due date (optional)</label>
          <input className="input" type="date" value={form.due} onChange={(e) => setForm((f) => ({ ...f, due: e.target.value }))} />
          {addErr && <div style={{ color: "#FF6B5E", fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>{addErr}</div>}
          <button className="btnP" onClick={add} style={{ width: "100%", justifyContent: "center" }}>Post assignment</button>
          <p style={{ fontSize: 11.5, color: "var(--inkSoft)", margin: "10px 2px 0" }}>Upload the worksheet to Google Drive, then paste its share link here, this keeps storage free.</p>
        </div>
      )}

      {list === null ? <p className="para">Loading…</p> : list.length === 0 ? (
        <div className="card" style={{ padding: 22, textAlign: "center", color: "var(--inkSoft)", fontSize: 14 }}>
          <Mascot size={70} style={{ margin: "0 auto 6px" }} /><div>No assignments yet. Post your first one!</div>
        </div>
      ) : list.map((a) => {
        const d = detail[a.id];
        const done = d ? Object.values(d.subs).filter((s) => s.status === "reviewed").length : null;
        return (
          <div key={a.id} className="card" style={{ padding: 14, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 15 }}>{a.title}</div>
                <div style={{ fontSize: 12, color: "var(--inkSoft)", marginTop: 2 }}>{a.grade}{a.due ? ` · due ${fmtDate(a.due)}` : ""}{d ? ` · ${done}/${d.students.length} done` : ""}</div>
              </div>
              <button className="btnGhost" onClick={() => remove(a.id)}><Icon name="trash" size={15} color="#FF6B5E" /></button>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              {(a.viewUrl || a.link) && (a.viewUrl
                ? <button className="btnP" onClick={() => setViewer({ name: a.fileName || a.title, viewUrl: a.viewUrl, downloadUrl: a.downloadUrl || a.link, openUrl: a.openUrl || a.link })} style={{ background: "var(--tintBlue)", color: "var(--azure)" }}><Icon name="book" size={15} color="#2F6BFF" sw={2.3} /> Worksheet</button>
                : <a href={a.link} target="_blank" rel="noopener noreferrer" className="btnP" style={{ textDecoration: "none", background: "var(--tintBlue)", color: "var(--azure)" }}><Icon name="book" size={15} color="#2F6BFF" sw={2.3} /> Worksheet</a>)}
              <button className="btnP" onClick={() => toggleExpand(a)} style={{ flex: 1, justifyContent: "center", background: expand === a.id ? "var(--azure)" : "#fff", color: expand === a.id ? "#fff" : "var(--azure)", border: "1px solid var(--azure)" }}>
                {expand === a.id ? "Hide class" : "View class"}
              </button>
            </div>
            {expand === a.id && (
              <div style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 8 }}>
                {!d ? <p className="para" style={{ fontSize: 13 }}>Loading class…</p> : d.students.length === 0 ? (
                  <div style={{ fontSize: 13, color: "var(--inkSoft)" }}>No students in {a.grade} yet.</div>
                ) : d.students.map((st) => {
                  const s = d.subs[st.id];
                  const status = s ? s.status : "pending";
                  return (
                    <div key={st.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 2px", gap: 6 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, flex: 1, minWidth: 0 }}>{st.name}</div>
                      {s && (s.viewUrl || s.link) && <button className="btnGhost" onClick={() => setViewer({ name: st.name + ", work", viewUrl: s.viewUrl, downloadUrl: s.downloadUrl || s.link, openUrl: s.openUrl || s.link })} style={{ padding: 7 }} title="Open student's work"><Icon name="book" size={14} color="#2F6BFF" /></button>}
                      {status === "reviewed"
                        ? <button className="pillBadge" onClick={() => setStatus(a, st, "submitted")} title="Tap to undo" style={{ background: "#E1F5EE", color: "#1E7A45", border: "none", cursor: "pointer" }}><Icon name="check" size={12} color="#1E7A45" sw={2.5} /> Done ✕</button>
                        : <button className="btnP" onClick={() => review(a, st)} style={{ padding: "7px 12px", fontSize: 12.5, background: status === "submitted" ? "#1E9E5A" : "#fff", color: status === "submitted" ? "#fff" : "var(--inkSoft)", border: status === "submitted" ? "none" : "1px solid var(--line)" }}>
                            {status === "submitted" ? "✓ Mark done" : "Mark done"}
                          </button>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      {viewer && <FileViewer file={viewer} onClose={() => setViewer(null)} />}
      <div style={{ height: 8 }} />
    </>
  );
}

/* ---------------- Teacher Class links (join link + cancel) ---------------- */
function ClassLinks({ classes }) {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    Promise.all(classes.map(async (c) => {
      const cl = await store.getClassLink(c.grade, c.subject);
      return { grade: c.grade, subject: c.subject, link: (cl && cl.link) || "", cancelled: classCancelledToday(cl), reason: (cl && cl.reason) || "", msg: "" };
    })).then(setRows);
  }, []);
  function upd(i, patch) { setRows((r) => r.map((x, k) => (k === i ? { ...x, ...patch } : x))); }
  async function save(i) {
    const r = rows[i];
    const todayStr = new Date().toISOString().slice(0, 10);
    await store.setClassLink(r.grade, r.subject, { link: r.link.trim(), cancelled: r.cancelled, reason: r.reason.trim(), cancelledOn: r.cancelled ? todayStr : "" });
    upd(i, { msg: "Saved ✓" }); setTimeout(() => upd(i, { msg: "" }), 1800);
  }
  if (rows === null) return <p className="para">Loading…</p>;
  if (rows.length === 0) return <div className="card" style={{ padding: 20, color: "var(--inkSoft)", fontSize: 14 }}>You have no grade classes to set links for.</div>;
  return (
    <>
      <p className="para" style={{ margin: "0 0 14px" }}>Set the online class link students will use. If you can't hold a class, tick “class cancelled” and add a reason, students will see it instead of the link.</p>
      {rows.map((r, i) => (
        <div key={i} className="card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 10 }}>{r.subject} · {r.grade}</div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", display: "block", margin: "2px 0 6px" }}>Online class link (Zoom / Meet)</label>
          <input className="input" placeholder="https://…" value={r.link} onChange={(e) => upd(i, { link: e.target.value })} disabled={r.cancelled} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--inkSoft)", margin: "4px 0 10px", cursor: "pointer" }}>
            <input type="checkbox" checked={r.cancelled} onChange={(e) => upd(i, { cancelled: e.target.checked })} /> Class cancelled
          </label>
          {r.cancelled && <input className="input" placeholder="Reason shown to students (e.g. Teacher unwell today)" value={r.reason} onChange={(e) => upd(i, { reason: e.target.value })} />}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="btnP" onClick={() => save(i)} style={{ justifyContent: "center" }}>Save</button>
            {r.link && <button className="btnGhost" onClick={() => { try { navigator.clipboard.writeText(r.link); upd(i, { msg: "Link copied" }); setTimeout(() => upd(i, { msg: "" }), 1500); } catch (e) {} }} style={{ color: "var(--azure)", fontWeight: 700, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="copy" size={14} color="#2F6BFF" /> Copy link</button>}
            {r.msg && <span style={{ color: "#1E7A45", fontWeight: 700, fontSize: 13 }}>{r.msg}</span>}
          </div>
        </div>
      ))}
      <div style={{ height: 8 }} />
    </>
  );
}

/* ---------------- Teacher shell ---------------- */
export default function Teacher({ user }) {
  const [tab, setTab] = useState("today");

  const assignments = (user.assignments && user.assignments.length)
    ? user.assignments
    : (user.grades && user.grades.length ? user.grades.map((g) => ({ subject: user.subject, grade: g })) : (user.subject ? [{ subject: user.subject, grade: "" }] : []));
  const regular = assignments.filter((a) => a.grade);
  const specials = assignments.filter((a) => !a.grade);

  const [pick, setPick] = useState(0);
  const current = regular[pick] || null;

  if (assignments.length === 0) {
    return <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--inkSoft)", fontSize: 14, marginTop: 20 }}>
      No classes are assigned to your account yet. Please ask the admin to set them.
    </div>;
  }

  const TABS = [["today", "Today", "home"], ["attendance", "Attendance", "check"], ["marks", "Marks", "award"], ["work", "Work", "book"], ["link", "Class link", "globe"]];
  const norm = (s) => (s || "").toLowerCase().replace(/[^a-z]/g, "");
  const match = TEACHERS.find((t) => norm(t.name) === norm(user.name));
  const photo = (user.photo) || (match && match.photo) || "";
  const first = (user.name || "Teacher").split(" ")[0];
  const roleSummary = regular.length ? (regular.length > 1 ? `${regular[0].subject} · ${regular.length} classes` : `${regular[0].subject} · ${regular[0].grade}`) : (specials.length ? specials.map((s) => s.subject).join(", ") : "");
  const expYears = user.joined ? new Date().getFullYear() - parseInt(user.joined, 10) : 0;

  return (
    <>
      <div className="card" style={{ padding: 16, background: "linear-gradient(135deg, var(--navy), var(--azure))", border: "none", display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        {photo
          ? <img src={photo} alt={user.name} style={{ width: 56, height: 56, borderRadius: 18, objectFit: "cover", border: "2px solid rgba(255,255,255,.5)", flexShrink: 0 }} />
          : <div style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 19, flexShrink: 0 }}>{(user.name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("")}</div>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "rgba(255,255,255,.8)", fontSize: 12, fontWeight: 600 }}>Teacher</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "#fff", fontSize: 19, fontWeight: 800, marginTop: 1 }}>Hello, {first}!</div>
          <div style={{ color: "#FFD9A6", fontSize: 12, marginTop: 3 }}>{roleSummary}{user.joined ? ` · since ${user.joined}${expYears > 0 ? ` (${expYears} yr${expYears === 1 ? "" : "s"})` : ""}` : ""}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {TABS.map(([k, label, ic]) => (
          <button key={k} className="btnP" onClick={() => setTab(k)} style={{ background: tab === k ? "var(--azure)" : "#fff", color: tab === k ? "#fff" : "var(--inkSoft)", border: "1px solid " + (tab === k ? "var(--azure)" : "var(--line)") }}>
            <Icon name={ic} size={15} color={tab === k ? "#fff" : "#52617A"} sw={2.4} /> {label}
          </button>
        ))}
      </div>

      {tab === "link" && <ClassLinks classes={regular} />}
      {tab === "work" && <TeacherAssignments grades={[...new Set(regular.map((a) => a.grade))]} subject={regular[0] ? regular[0].subject : (user.subject || "")} />}

      {tab === "today" && (
        <TeacherToday user={user} regular={regular} specials={specials}
          onTake={(i) => { setPick(i); setTab("attendance"); }}
          onMarks={(i) => { setPick(i); setTab("marks"); }} />
      )}

      {(tab === "attendance" || tab === "marks") && (current ? (
        <>
          {regular.length > 1 && (
            <div className="seg" style={{ marginBottom: 12 }}>
              {regular.map((a, i) => (<button key={i} className={pick === i ? "on" : ""} onClick={() => setPick(i)}>{a.grade} · {a.subject}</button>))}
            </div>
          )}
          <div style={{ fontSize: 12.5, color: "var(--inkSoft)", margin: "0 0 14px" }}>You teach <b style={{ color: "var(--ink)" }}>{current.subject}</b> · {current.grade}</div>
          {tab === "attendance" ? <Attendance grades={[current.grade]} subject={current.subject} /> : <Marks grades={[current.grade]} subject={current.subject} />}
        </>
      ) : (
        <div className="card" style={{ padding: 20, color: "var(--inkSoft)", fontSize: 14 }}>Your classes are special classes (no Grade 1–7). Tools for extra classes are coming soon.</div>
      ))}
    </>
  );
}

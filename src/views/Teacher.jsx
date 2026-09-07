import { useState, useEffect } from "react";
import Icon from "../data/icons.jsx";
import Mascot from "../components/Mascot.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { GRADES, TERMS, ATT_LABEL, ATT_COLOR, MARK_MAX } from "../data/school";
import { fmtDate } from "../lib/util";
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
              <input inputMode="numeric" value={scores[s.id]} onChange={(e) => setScore(s.id, e.target.value)} placeholder="—"
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
          <div style={{ fontSize: 12.5, color: "#1E7A45", marginTop: 4 }}>{specials.map((a) => a.subject).join(", ")} — attendance &amp; marks tools for these are coming soon.</div>
        </div>
      )}
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

  const TABS = [["today", "Today", "home"], ["attendance", "Attendance", "check"], ["marks", "Marks", "award"]];

  return (
    <>
      <SectionTitle eyebrow={`Welcome, ${user.name.split(" ")[0]}`} title={tab === "today" ? "Your day" : tab === "attendance" ? "Attendance" : "Enter marks"} />
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {TABS.map(([k, label, ic]) => (
          <button key={k} className="btnP" onClick={() => setTab(k)} style={{ background: tab === k ? "var(--azure)" : "#fff", color: tab === k ? "#fff" : "var(--inkSoft)", border: "1px solid " + (tab === k ? "var(--azure)" : "var(--line)") }}>
            <Icon name={ic} size={15} color={tab === k ? "#fff" : "#52617A"} sw={2.4} /> {label}
          </button>
        ))}
      </div>

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

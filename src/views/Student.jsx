import { useState, useEffect } from "react";
import Icon from "../data/icons.jsx";
import Mascot from "../components/Mascot.jsx";
import FileViewer from "../components/FileViewer.jsx";
import { hasDrive, uploadToDrive } from "../lib/drive";
import { TERMS, ATT_LABEL, ATT_COLOR, MARK_MAX, SUBJECTS_BY_GRADE } from "../data/school";
import logo from "../assets/logo.png";
import { fmtDate, classCancelledToday } from "../lib/util";
import * as store from "../lib/store";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYCOL = { Mon: "#2F6BFF", Tue: "#1E9E5A", Wed: "#B76A0E", Thu: "#7A3FF2", Fri: "#FF6B5E", Sat: "#0E9BAA", Sun: "#E0457B" };

function Ring({ pct, color = "#fff", track = "rgba(255,255,255,.28)", size = 66 }) {
  const r = (size - 8) / 2, c = 2 * Math.PI * r, off = c * (1 - (pct || 0) / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth="7" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </svg>
  );
}

export default function Student({ user }) {
  const [marks, setMarks] = useState([]);
  const [att, setAtt] = useState([]);
  const [tt, setTt] = useState([]);
  const [news, setNews] = useState([]);
  const [asg, setAsg] = useState([]);
  const [subs, setSubs] = useState({});
  const [cls, setCls] = useState({});
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState(null);
  const [upId, setUpId] = useState(null);

  useEffect(() => {
    let live = true;
    Promise.all([
      store.getStudentMarks(user.id, user.grade),
      store.getStudentAttendance(user.id, user.grade),
      user.grade ? store.getTimetable(user.grade) : Promise.resolve([]),
      store.listNews(),
      user.grade ? store.listAssignmentsByGrade(user.grade) : Promise.resolve([]),
      store.getStudentSubmissions(user.id),
      user.grade ? store.listClassLinksByGrade(user.grade) : Promise.resolve({}),
    ]).then(([m, a, t, n, ag, sb, cl]) => { if (!live) return; setMarks(m); setAtt(a); setTt(t); setNews(n); setAsg(ag); setSubs(sb); setCls(cl); setLoading(false); });
    return () => { live = false; };
  }, [user.id, user.grade]);

  async function markDone(a) {
    const rec = await store.setSubmission(a.id, user.id, user.grade, { status: "submitted", submittedAt: new Date().toISOString() });
    setSubs((s) => ({ ...s, [a.id]: rec }));
  }
  async function uploadWork(a, file) {
    if (!file) return;
    setUpId(a.id);
    try {
      const r = await uploadToDrive(`Submissions/${user.grade}`, file);
      const rec = await store.setSubmission(a.id, user.id, user.grade, { status: "submitted", submittedAt: new Date().toISOString(), link: r.downloadUrl, viewUrl: r.viewUrl, openUrl: r.openUrl, downloadUrl: r.downloadUrl, fileName: r.name });
      setSubs((s) => ({ ...s, [a.id]: rec }));
    } catch (e) { alert(e.message || "Upload failed"); }
    finally { setUpId(null); }
  }

  // attendance
  const summary = att.reduce((o, r) => { o[r.status] = (o[r.status] || 0) + 1; return o; }, {});
  const present = (summary.present || 0) + (summary.late || 0);
  const pct = att.length ? Math.round((present / att.length) * 100) : 0;
  const bySubjAtt = {};
  att.forEach((r) => { const s = bySubjAtt[r.subject] || (bySubjAtt[r.subject] = { t: 0, p: 0 }); s.t++; if (r.status !== "absent") s.p++; });

  // marks
  const gradeSubjects = SUBJECTS_BY_GRADE[user.grade] || [];
  const allSubjects = Array.from(new Set([...gradeSubjects, ...marks.map((m) => m.subject)]));
  // term -> subject -> score
  const byTS = {};
  marks.forEach((m) => { (byTS[m.term] = byTS[m.term] || {})[m.subject] = m.score; });
  const termOverall = (t) => {
    const entered = allSubjects.map((s) => (byTS[t] || {})[s]).filter((v) => v != null);
    return entered.length ? Math.round((entered.reduce((a, b) => a + b, 0) / (entered.length * MARK_MAX)) * 100) : null;
  };
  const [openTerm, setOpenTerm] = useState(TERMS[0]);

  function downloadMarksheet() {
    const logoUrl = (() => { try { return new URL(logo, window.location.href).href; } catch (e) { return logo; } })();
    const gl = (pct) => pct == null ? "" : pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B" : pct >= 60 ? "C" : pct >= 50 ? "D" : "E";
    const rows = allSubjects.map((s) => {
      const s1 = (byTS["Sem 1"] || {})[s], s2 = (byTS["Sem 2"] || {})[s];
      return `<tr><td>${s}</td><td style="text-align:center">${s1 != null ? s1 : "—"}</td><td style="text-align:center">${s2 != null ? s2 : "—"}</td></tr>`;
    }).join("");
    const o1 = termOverall("Sem 1"), o2 = termOverall("Sem 2");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Marksheet — ${user.name}</title>
      <style>body{font-family:Arial,sans-serif;color:#16233A;padding:32px;max-width:640px;margin:0 auto}
      .head{display:flex;align-items:center;gap:14px;border-bottom:3px solid #2F6BFF;padding-bottom:14px}
      .head img{width:56px;height:56px;object-fit:contain}
      h1{font-size:20px;margin:0} .sub{color:#6B7A90;font-size:12px}
      .info{display:flex;gap:24px;margin:18px 0;font-size:13px} .info b{color:#16233A}
      table{width:100%;border-collapse:collapse;margin-top:8px} th,td{border:1px solid #E4EAF5;padding:9px 12px;font-size:13px}
      th{background:#EAF1FF;text-align:left} .tot td{font-weight:bold;background:#FDF3E6}
      .foot{margin-top:24px;font-size:11px;color:#8B8698;text-align:center}
      @media print{button{display:none}}</style></head><body>
      <div class="head"><img src="${logoUrl}"><div><h1>KTN Digital Online School</h1><div class="sub">Education for Free · Since 2019 — Report card</div></div></div>
      <div class="info"><div><b>Student:</b> ${user.name}</div><div><b>Roll:</b> ${user.rollNumber || user.code || "—"}</div><div><b>Class:</b> ${user.grade || "—"}</div></div>
      <table><thead><tr><th>Subject</th><th style="text-align:center">Sem 1 (/100)</th><th style="text-align:center">Sem 2 (/100)</th></tr></thead>
      <tbody>${rows}<tr class="tot"><td>Overall</td><td style="text-align:center">${o1 != null ? o1 + "% " + gl(o1) : "—"}</td><td style="text-align:center">${o2 != null ? o2 + "% " + gl(o2) : "—"}</td></tr></tbody></table>
      <div class="foot">Generated by the KTN Digital Online School app. Marks out of ${MARK_MAX}.</div>
      <div style="text-align:center;margin-top:20px"><button onclick="window.print()" style="padding:10px 20px;font-size:14px;background:#2F6BFF;color:#fff;border:none;border-radius:8px;cursor:pointer">Save as PDF / Print</button></div>
      </body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    if (!w) {
      const a = document.createElement("a");
      a.href = url; a.download = `Marksheet-${(user.name || "student").replace(/\s+/g, "-")}.html`;
      document.body.appendChild(a); a.click(); a.remove();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  // today's classes
  const today = DAYS[new Date().getDay()];
  const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekRows = [...tt].sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
  const pinned = news.find((n) => n.pinned) || news[0];

  if (loading) return <p className="para" style={{ marginTop: 20 }}>Loading your dashboard…</p>;

  return (
    <>
      {/* HEADER CARD */}
      <div className="card" style={{ padding: 18, background: "linear-gradient(135deg, var(--navy), var(--azure))", border: "none", display: "flex", alignItems: "center", gap: 14, position: "relative", overflow: "visible" }}>
        <Mascot size={52} className="mascot-peek" style={{ top: -22, right: 12 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "rgba(255,255,255,.8)", fontSize: 12, fontWeight: 600 }}>{user.grade || "Student"}</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "#fff", fontSize: 21, fontWeight: 800, marginTop: 2, lineHeight: 1.1 }}>{user.name}</div>
          <div style={{ color: "#FFD9A6", fontSize: 12.5, marginTop: 4 }}>Roll {user.rollNumber || user.code || "—"}</div>
        </div>
        <div style={{ position: "relative", width: 66, height: 66 }}>
          <Ring pct={pct} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 15 }}>{pct}%</div>
            <div style={{ fontSize: 8, opacity: .85 }}>attend</div>
          </div>
        </div>
      </div>

      {/* THIS WEEK'S CLASSES */}
      <h3 className="h2" style={{ margin: "22px 0 10px" }}>This week's classes</h3>
      {weekRows.length === 0 ? (
        <div className="card" style={{ padding: 20, textAlign: "center", color: "var(--inkSoft)", fontSize: 14 }}>
          <Mascot size={72} style={{ margin: "0 auto 6px" }} />
          <div>No classes scheduled yet.</div>
        </div>
      ) : weekRows.map((r, i) => {
        const cl = cls[r.subject];
        const cancelled = classCancelledToday(cl);
        const link = (cl && cl.link) || r.link;
        const isToday = r.day === today;
        const col = DAYCOL[r.day] || "#2F6BFF";
        return (
          <div key={i} className="card" style={{ padding: 14, marginBottom: 8, borderColor: isToday ? "var(--azure)" : "var(--line)", boxShadow: isToday ? "0 6px 18px -10px rgba(47,107,255,.4)" : undefined }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: "var(--tintBlue)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="book" size={20} color="#2F6BFF" sw={2.2} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 15 }}>{r.subject}</span>
                  {isToday && <span style={{ fontSize: 9.5, fontWeight: 800, color: "#fff", background: "var(--azure)", padding: "2px 7px", borderRadius: 999 }}>TODAY</span>}
                </div>
                <div style={{ fontSize: 12, color: "var(--inkSoft)", marginTop: 1 }}>{r.teacher} · {r.time}</div>
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: "#fff", background: col, padding: "3px 9px", borderRadius: 999, flexShrink: 0 }}>{r.day}</span>
            </div>
            {cancelled ? (
              <div style={{ marginTop: 10, background: "#FCEDEC", color: "#C0392B", borderRadius: 12, padding: "10px 12px", fontSize: 12.5, fontWeight: 600 }}>
                🚫 No class — {cl.reason || "cancelled by the teacher"}
              </div>
            ) : link ? (
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <a href={link} target="_blank" rel="noopener noreferrer" className="btnP" style={{ flex: 1, justifyContent: "center", textDecoration: "none", background: "#1E9E5A" }}><Icon name="globe" size={15} color="#fff" sw={2.4} /> Join class</a>
                <button className="btnGhost" onClick={() => { try { navigator.clipboard.writeText(link); } catch (e) {} }} title="Copy link" style={{ padding: "10px 12px", border: "1px solid var(--line)" }}><Icon name="copy" size={15} color="#2F6BFF" /></button>
              </div>
            ) : null}
          </div>
        );
      })}

      {/* ATTENDANCE */}
      <h3 className="h2" style={{ margin: "22px 0 10px" }}>Attendance</h3>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: att.length ? 14 : 0 }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 30, color: pct >= 75 ? "#1E9E5A" : "#B76A0E" }}>{pct}%</div>
          <div style={{ fontSize: 13, color: "var(--inkSoft)", fontWeight: 600 }}>
            {att.length ? `Present in ${present} of ${att.length} classes.` : "No attendance recorded yet."}
          </div>
        </div>
        {Object.keys(bySubjAtt).map((s) => {
          const p = Math.round((bySubjAtt[s].p / bySubjAtt[s].t) * 100);
          return (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
              <div style={{ width: 74, fontSize: 12.5, fontWeight: 600 }}>{s}</div>
              <div style={{ flex: 1, height: 9, borderRadius: 999, background: "#EEF2F8", overflow: "hidden" }}><span style={{ display: "block", height: "100%", width: p + "%", background: p >= 75 ? "#1E9E5A" : "#B76A0E", borderRadius: 999 }} /></div>
              <div style={{ width: 62, textAlign: "right", fontSize: 12, color: "var(--inkSoft)", fontWeight: 600 }}>{p}% ({bySubjAtt[s].p}/{bySubjAtt[s].t})</div>
            </div>
          );
        })}
      </div>

      {/* MARKS */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "22px 0 10px" }}>
        <h3 className="h2">Marks</h3>
        <button className="btnP" onClick={downloadMarksheet} style={{ padding: "8px 12px", fontSize: 12.5 }}>
          <Icon name="send" size={14} color="#fff" sw={2.4} style={{ transform: "rotate(90deg)" }} /> Marksheet
        </button>
      </div>
      {TERMS.map((t) => {
        const open = openTerm === t;
        const ov = termOverall(t);
        return (
          <div key={t} className="card" style={{ padding: 0, marginBottom: 10, overflow: "hidden" }}>
            <button onClick={() => setOpenTerm(open ? "" : t)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>{t}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="pillBadge" style={{ background: ov != null ? "var(--tintBlue)" : "#EEF2F8", color: ov != null ? "var(--azure)" : "var(--inkSoft)" }}>{ov != null ? `${ov}%` : "Not graded"}</span>
                <Icon name="chev" size={16} color="#52617A" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .2s" }} />
              </span>
            </button>
            {open && (
              <div style={{ padding: "0 16px 14px" }}>
                {allSubjects.length === 0 ? <div style={{ fontSize: 13, color: "var(--inkSoft)" }}>No subjects yet.</div> : allSubjects.map((s) => {
                  const score = (byTS[t] || {})[s];
                  return (
                    <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                      <div style={{ width: 78, fontSize: 13, fontWeight: 600 }}>{s}</div>
                      <div style={{ flex: 1, height: 10, borderRadius: 999, background: "#EEF2F8", overflow: "hidden" }}>
                        {score != null && <span style={{ display: "block", height: "100%", width: score + "%", background: "var(--azure)", borderRadius: 999 }} />}
                      </div>
                      <div style={{ width: 66, textAlign: "right", fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 13, color: score != null ? "var(--ink)" : "var(--inkSoft)" }}>{score != null ? score : "—"}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* ASSIGNMENTS */}
      <h3 className="h2" style={{ margin: "22px 0 10px" }}>Assignments</h3>
      {asg.length === 0 ? (
        <div className="card" style={{ padding: 18, textAlign: "center", color: "var(--inkSoft)", fontSize: 13.5 }}>No assignments right now. 🎉</div>
      ) : Object.entries(asg.reduce((g, a) => { (g[a.subject] = g[a.subject] || []).push(a); return g; }, {})).map(([subj, items]) => (
        <div key={subj}>
          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 13, color: "var(--azure)", margin: "8px 2px 8px" }}>{subj}</div>
          {items.map((a) => {
        const st = subs[a.id];
        return (
          <div key={a.id} className="card" style={{ padding: 14, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 14.5 }}>{a.title}</div>
                <div style={{ fontSize: 12, color: "var(--inkSoft)", marginTop: 2 }}>{a.subject}{a.due ? ` · due ${fmtDate(a.due)}` : ""}</div>
              </div>
              {st && st.status === "reviewed" ? <span className="pillBadge" style={{ background: "#E1F5EE", color: "#1E7A45" }}><Icon name="check" size={12} color="#1E7A45" sw={2.5} /> Done</span>
                : st && st.status === "submitted" ? <span className="pillBadge" style={{ background: "var(--tintAmber)", color: "#B76A0E" }}>Submitted</span>
                : null}
            </div>
            {a.instructions && <p className="para" style={{ margin: "8px 0 0", fontSize: 12.5 }}>{a.instructions}</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              {(a.viewUrl || a.link) && (a.viewUrl
                ? <button className="btnP" onClick={() => setViewer({ name: a.fileName || a.title, viewUrl: a.viewUrl, downloadUrl: a.downloadUrl || a.link, openUrl: a.openUrl || a.link })} style={{ flex: 1, justifyContent: "center", background: "var(--tintBlue)", color: "var(--azure)" }}><Icon name="book" size={15} color="#2F6BFF" sw={2.3} /> Open worksheet</button>
                : <a href={a.link} target="_blank" rel="noopener noreferrer" className="btnP" style={{ flex: 1, justifyContent: "center", textDecoration: "none", background: "var(--tintBlue)", color: "var(--azure)" }}><Icon name="book" size={15} color="#2F6BFF" sw={2.3} /> Open worksheet</a>)}
              {hasDrive ? (
                (!st || st.status !== "reviewed") && (
                  <label className="btnP" style={{ flex: 1, justifyContent: "center", background: "#1E9E5A", cursor: "pointer" }}>
                    <Icon name="check" size={15} color="#fff" sw={2.5} /> {upId === a.id ? "Uploading…" : (st ? "Re-upload work" : "Upload my work")}
                    <input type="file" onChange={(e) => uploadWork(a, e.target.files && e.target.files[0])} style={{ display: "none" }} />
                  </label>
                )
              ) : (!st && <button className="btnP" onClick={() => markDone(a)} style={{ flex: 1, justifyContent: "center", background: "#1E9E5A" }}><Icon name="check" size={15} color="#fff" sw={2.5} /> Mark as done</button>)}
            </div>
          </div>
        );
      })}
        </div>
      ))}

      {/* NOTICE */}
      {pinned && (<>
        <h3 className="h2" style={{ margin: "22px 0 10px" }}>Notice</h3>
        <div className="card" style={{ padding: 16 }}>
          {pinned.pinned && <span className="pillBadge" style={{ background: "var(--tintAmber)", color: "#B76A0E" }}><Icon name="pin" size={12} color="#B76A0E" sw={2.4} /> Pinned</span>}
          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 15.5, margin: "9px 0 5px" }}>{pinned.title}</div>
          <p className="para" style={{ margin: 0, fontSize: 13 }}>{pinned.body}</p>
        </div>
      </>)}
      <div style={{ height: 10 }} />
      {viewer && <FileViewer file={viewer} onClose={() => setViewer(null)} />}
    </>
  );
}

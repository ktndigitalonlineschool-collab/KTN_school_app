import { useState, useEffect } from "react";
import Icon from "../data/icons.jsx";
import Mascot from "../components/Mascot.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { TT_ORDER, TT, DAYCOL } from "../data/content";
import { classCancelledToday } from "../lib/util";
import * as store from "../lib/store";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Classes({ grade, onGrade }) {
  const [extra, setExtra] = useState([]);
  const [cls, setCls] = useState({});
  useEffect(() => {
    if (grade === "Extra Classes") { setExtra([]); setCls({}); return; }
    store.listTimetableExtra(grade).then(setExtra).catch(() => setExtra([]));
    store.listClassLinksByGrade(grade).then(setCls).catch(() => setCls({}));
  }, [grade]);
  const rows = extra.length
    ? extra.map((r) => ({ subject: r.subject, teacher: r.teacher, day: r.day, time: r.time, link: r.link }))
    : (TT[grade] || []).map((r) => ({ subject: r[0], teacher: r[1], day: r[2], time: r[3] }));
  const today = DAYS[new Date().getDay()];

  return (
    <>
      <SectionTitle eyebrow="Timetable" title="Class schedule" />
      <p className="para" style={{ margin: "-6px 0 14px" }}>
        All classes are held online in the evenings (Korea time). Pick a grade to see its weekly schedule.
      </p>
      <div className="seg">
        {TT_ORDER.map((g) => (
          <button key={g} className={grade === g ? "on" : ""} onClick={() => onGrade(g)}>{g}</button>
        ))}
      </div>
      <div style={{ marginTop: 14 }}>
        {rows.length === 0 ? (
          <div className="card" style={{ padding: 22, textAlign: "center", color: "var(--inkSoft)", fontSize: 14 }}>
            <Mascot size={70} style={{ margin: "0 auto 6px" }} />
            <div>No classes listed for {grade} yet.</div>
          </div>
        ) : rows.map((row, i) => {
          const col = DAYCOL[row.day] || "#2F6BFF";
          const isToday = row.day === today;
          return (
            <div key={i} className="card" style={{ padding: "14px 15px", marginBottom: 10, borderColor: isToday ? "var(--azure)" : "var(--line)", boxShadow: isToday ? "0 6px 18px -10px rgba(47,107,255,.4)" : undefined }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{row.subject}</span>
                    {isToday && <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: "var(--azure)", padding: "2px 8px", borderRadius: 999 }}>TODAY</span>}
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--inkSoft)", marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>
                    <Icon name="users" size={13} color="#52617A" sw={2.2} />{row.teacher}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span style={{ display: "inline-block", fontSize: 11.5, fontWeight: 800, color: "#fff", background: col, padding: "3px 10px", borderRadius: 999 }}>{row.day}</span>
                  <div style={{ fontSize: 12, color: "var(--inkSoft)", fontWeight: 600, marginTop: 4, whiteSpace: "nowrap" }}>{row.time}</div>
                </div>
              </div>
              {(() => {
                const cl = cls[row.subject];
                if (classCancelledToday(cl)) return (
                  <div style={{ marginTop: 12, background: "#FCEDEC", color: "#C0392B", borderRadius: 12, padding: "10px 12px", fontSize: 12.5, fontWeight: 600 }}>🚫 No class, {cl.reason || "cancelled by the teacher"}</div>
                );
                const link = (cl && cl.link) || row.link;
                return link ? (
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <a href={link} target="_blank" rel="noopener noreferrer" className="btnP" style={{ flex: 1, justifyContent: "center", textDecoration: "none", background: "#1E9E5A" }}>
                      <Icon name="globe" size={15} color="#fff" sw={2.4} /> Join class
                    </a>
                    <button className="btnGhost" onClick={() => { try { navigator.clipboard.writeText(link); } catch (e) {} }} title="Copy link" style={{ padding: "10px 12px", border: "1px solid var(--line)" }}><Icon name="copy" size={15} color="#2F6BFF" /></button>
                  </div>
                ) : null;
              })()}
            </div>
          );
        })}
      </div>
      <div style={{ height: 8 }} />
    </>
  );
}

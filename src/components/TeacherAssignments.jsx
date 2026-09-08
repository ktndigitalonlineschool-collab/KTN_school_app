import { useState } from "react";
import Icon from "../data/icons.jsx";
import { GRADES, CORE_SUBJECTS, SPECIAL_CLASSES, assignmentLabel } from "../data/school";

// Manages a teacher's list of classes. Each is { subject, grade }, grade "" = special.
export default function TeacherAssignments({ value, onChange }) {
  const list = value || [];
  const [kind, setKind] = useState("regular"); // "regular" | "special"
  const [subject, setSubject] = useState(CORE_SUBJECTS[0]);
  const [grade, setGrade] = useState(GRADES[0]);
  const [special, setSpecial] = useState(SPECIAL_CLASSES[0]);

  function add() {
    const a = kind === "regular" ? { subject, grade } : { subject: special, grade: "" };
    if (list.some((x) => x.subject === a.subject && x.grade === a.grade)) return; // no duplicates
    onChange([...list, a]);
  }
  function removeAt(i) { onChange(list.filter((_, k) => k !== i)); }

  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", display: "block", margin: "2px 0 6px" }}>Classes this teacher takes</label>

      {list.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
          {list.map((a, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: a.grade ? "var(--tintBlue)" : "#EAF7EF", color: a.grade ? "var(--azure)" : "#1E7A45", fontSize: 12.5, fontWeight: 700, padding: "6px 10px", borderRadius: 999 }}>
              {assignmentLabel(a)}
              <button type="button" onClick={() => removeAt(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                <Icon name="x" size={12} color={a.grade ? "#2F6BFF" : "#1E7A45"} sw={2.6} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div style={{ border: "1.5px dashed var(--line)", borderRadius: 12, padding: 12 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          <button type="button" onClick={() => setKind("regular")} style={tab(kind === "regular")}>Regular class</button>
          <button type="button" onClick={() => setKind("special")} style={tab(kind === "special")}>Special class</button>
        </div>
        {kind === "regular" ? (
          <div style={{ display: "flex", gap: 8 }}>
            <select className="input" value={subject} onChange={(e) => setSubject(e.target.value)} style={{ margin: 0, flex: 1 }}>
              {CORE_SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select className="input" value={grade} onChange={(e) => setGrade(e.target.value)} style={{ margin: 0, flex: 1 }}>
              {GRADES.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
        ) : (
          <select className="input" value={special} onChange={(e) => setSpecial(e.target.value)} style={{ margin: 0 }}>
            {SPECIAL_CLASSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        )}
        <button type="button" className="btnGhost" onClick={add} style={{ marginTop: 10, color: "var(--azure)", fontWeight: 700, fontSize: 13 }}>
          <Icon name="plus" size={14} color="#2F6BFF" sw={2.5} /> Add this class
        </button>
      </div>
      <p style={{ fontSize: 11.5, color: "var(--inkSoft)", margin: "8px 2px 0" }}>Most teachers take one or two classes. Add each one, a grade subject, or a special class like a language level, dance or music.</p>
    </div>
  );
}
function tab(on) {
  return { flex: 1, background: on ? "var(--azure)" : "#fff", color: on ? "#fff" : "var(--inkSoft)", border: "1px solid " + (on ? "var(--azure)" : "var(--line)"), borderRadius: 9, padding: "8px 10px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" };
}

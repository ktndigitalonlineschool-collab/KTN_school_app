import { useState } from "react";
import Icon from "../data/icons.jsx";
import Mascot from "../components/Mascot.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { fmtDate } from "../lib/util";

export default function News({ news, staff, onPublish, onDelete }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const sorted = [...news].sort(
    (a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.date < a.date ? -1 : 1)
  );

  async function publish() {
    if (!title.trim()) return;
    await onPublish(title.trim(), body.trim());
    setTitle(""); setBody(""); setOpen(false);
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <SectionTitle eyebrow="News & announcements" title="What's happening" noMargin />
        {staff && (
          <button className="btnP" onClick={() => setOpen((o) => !o)} style={{ padding: "9px 13px", fontSize: 13 }}>
            <Icon name="plus" size={15} color="#fff" sw={2.6} /> Post
          </button>
        )}
      </div>

      {staff && open && (
        <div className="card" style={{ padding: 15, marginTop: 14, borderColor: "var(--azure)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 10 }}>New announcement</div>
          <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="input" rows={3} placeholder="Write your message…" value={body} onChange={(e) => setBody(e.target.value)} style={{ resize: "vertical" }} />
          <button className="btnP" onClick={publish} style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
            Publish announcement
          </button>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        {sorted.length === 0 && (
          <div className="card" style={{ padding: 22, textAlign: "center", color: "var(--inkSoft)", fontSize: 14 }}>
            <Mascot size={70} style={{ margin: "0 auto 6px" }} />
            <div>No announcements yet — check back soon!</div>
          </div>
        )}
        {sorted.map((n) => (
          <div key={n.id} className="card" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {n.pinned && (
                  <span className="pillBadge" style={{ background: "#FDEEDA", color: "#B76A0E" }}>
                    <Icon name="pin" size={13} color="#B76A0E" sw={2.4} /> Pinned
                  </span>
                )}
                <span style={{ fontSize: 12, color: "var(--inkSoft)", fontWeight: 600, alignSelf: "center" }}>{fmtDate(n.date)}</span>
              </div>
              {staff && (
                <button className="btnGhost" onClick={() => onDelete(n.id)} aria-label="Delete">
                  <Icon name="trash" size={15} color="#FF6B5E" />
                </button>
              )}
            </div>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "var(--ink)", margin: "9px 0 6px" }}>{n.title}</h3>
            <p className="para" style={{ margin: 0 }}>{n.body}</p>
          </div>
        ))}
      </div>
      <div style={{ height: 8 }} />
    </>
  );
}

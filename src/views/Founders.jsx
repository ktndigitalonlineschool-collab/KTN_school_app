import Icon from "../data/icons.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { FOUNDERS, LEADER_MESSAGE, FOUNDERS_STORY } from "../data/content";

function initials(name) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
const AVATAR_COLORS = ["#2F6BFF", "#1E9E5A", "#B76A0E", "#FF6B5E", "#7A3FF2"];

export default function Founders({ site }) {
  const F = site && site.founders && site.founders.length ? site.founders : FOUNDERS;
  const LEAD = site && site.leaderMessage ? site.leaderMessage : LEADER_MESSAGE;
  return (
    <>
      <SectionTitle eyebrow="Our founders" title="The people behind KTN" />
      <div style={{ textAlign: "center", margin: "-2px 0 14px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, color: "var(--amber)", fontSize: 14 }}>
        Education for Free! Education for All!
      </div>
      <div className="card" style={{ padding: 16, marginBottom: 16, background: "var(--tintAmber)", border: "none" }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 15, color: "#8A5A12", marginBottom: 6 }}>History begins at a dream</div>
        <p style={{ fontSize: 13.5, color: "#6B4409", lineHeight: 1.6, margin: 0 }}>{FOUNDERS_STORY}</p>
      </div>

      {/* Featured message */}
      <div className="card" style={{ padding: 18, marginBottom: 18, background: "linear-gradient(135deg, var(--navy), var(--azure))", border: "none", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 10, right: 12 }}><Icon name="quote" size={44} color="rgba(255,255,255,.16)" /></div>
        <p style={{ color: "#fff", fontSize: 15, lineHeight: 1.55, fontWeight: 600, margin: "0 0 12px", fontFamily: "'Plus Jakarta Sans', sans-serif", position: "relative" }}>
          “{F[0].message}”
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {F[0].photo && <img src={F[0].photo} alt={F[0].name} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,.5)" }} />}
          <div>
            <div style={{ color: "#FFD9A6", fontSize: 13, fontWeight: 700 }}>{F[0].name}</div>
            <div style={{ color: "rgba(255,255,255,.75)", fontSize: 12 }}>{F[0].role}</div>
          </div>
        </div>
      </div>

      {/* Founder cards */}
      {F.map((f, i) => (
        <div key={f.name} className="card" style={{ padding: 15, marginBottom: 10, display: "flex", gap: 13, alignItems: "center" }}>
          {f.photo ? (
            <img src={f.photo} alt={f.name} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: AVATAR_COLORS[i % AVATAR_COLORS.length], color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 17, flexShrink: 0 }}>
              {initials(f.name)}
            </div>
          )}
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15.5, fontWeight: 700, color: "var(--ink)" }}>{f.name}</div>
            <div style={{ fontSize: 12.5, color: "var(--azure)", fontWeight: 600, marginTop: 2 }}>{f.role}</div>
            {f.message && i > 0 && <div style={{ fontSize: 12.5, color: "var(--inkSoft)", marginTop: 5, lineHeight: 1.45 }}>{f.message}</div>}
          </div>
        </div>
      ))}

      {/* Editable leadership message placeholder */}
      <div className="card" style={{ padding: 16, marginTop: 8, background: "var(--tintBlue)", border: "none" }}>
        <div style={{ fontSize: 11, color: "var(--inkSoft)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>{LEAD.role}</div>
        <p style={{ fontSize: 13.5, color: "var(--navy)", lineHeight: 1.55, margin: "8px 0 0" }}>{LEAD.message}</p>
      </div>
      <div style={{ height: 8 }} />
    </>
  );
}

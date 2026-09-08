import Icon from "../data/icons.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { FOUNDERS } from "../data/content";

function initials(name) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
const AVATAR_COLORS = ["#2F6BFF", "#1E9E5A", "#B76A0E", "#FF6B5E", "#7A3FF2"];

export default function Founders({ site }) {
  const F = site && site.founders && site.founders.length ? site.founders : FOUNDERS;
  return (
    <>
      <SectionTitle eyebrow="Our founders" title="The people behind KTN" />
      <div style={{ textAlign: "center", margin: "-2px 0 14px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, color: "var(--amber)", fontSize: 14 }}>
        Education for Free! Education for All!
      </div>
      {/* Story: pull-quote + a 3-step journey */}
      <div className="card" style={{ padding: "22px 18px", marginBottom: 12, background: "linear-gradient(150deg, var(--navy), var(--azure))", border: "none", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 6, left: 14 }}><Icon name="quote" size={40} color="rgba(255,255,255,.16)" /></div>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 24, color: "#fff", lineHeight: 1.15, position: "relative" }}>
          History begins at a<br /><span style={{ color: "#FFD79A" }}>dream.</span>
        </div>
        <div style={{ color: "rgba(255,255,255,.85)", fontSize: 13, marginTop: 8 }}>And that&rsquo;s exactly where KTN began.</div>
      </div>

      {[
        { ic: "spark", tint: "var(--tintAmber)", col: "#B76A0E", t: "The dream", b: "We saw Indian children in Korea drifting from their roots, and imagined a free Indian CBSE school, by the community, for the community." },
        { ic: "users", tint: "var(--tintBlue)", col: "#2F6BFF", t: "The call", b: "We rallied the Indian families of Korea, and volunteers stepped up, teachers giving their evenings so no child is left behind." },
        { ic: "heart", tint: "#E1F5EE", col: "#1E9E5A", t: "The growth", b: "A shared dream took hold among dozens of teachers and hundreds of parents, a thriving school since 2019." },
      ].map((s, i) => (
        <div key={i} className="card" style={{ padding: 14, marginBottom: 10, display: "flex", gap: 13, alignItems: "flex-start" }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: s.tint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name={s.ic} size={20} color={s.col} sw={2.2} />
          </div>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 14.5, color: "var(--ink)" }}>{s.t}</div>
            <div style={{ fontSize: 13, color: "var(--inkSoft)", lineHeight: 1.5, marginTop: 3 }} dangerouslySetInnerHTML={{ __html: s.b }} />
          </div>
        </div>
      ))}

      <div className="card" style={{ padding: "14px 16px", marginBottom: 16, background: "var(--tintAmber)", border: "none", textAlign: "center" }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13.5, color: "#8A5A12", lineHeight: 1.5 }}>
          Proof that when a community comes together, education can truly be free, for every child. 🧡
        </div>
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
      <div style={{ height: 8 }} />
    </>
  );
}

import Icon from "../data/icons.jsx";
import logo from "../assets/logo.png";

export default function Header({ onSignIn }) {
  return (
    <header className="bar" style={{ padding: "12px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* emblem in a gradient ring */}
        <div style={{ width: 48, height: 48, borderRadius: "50%", padding: 2.5, background: "linear-gradient(135deg, var(--azure), var(--amber))", boxShadow: "0 4px 12px rgba(47,107,255,.28)", flexShrink: 0 }}>
          <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={logo} alt="KTN" style={{ width: 36, height: 36, objectFit: "contain" }} />
          </div>
        </div>
        <div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 16, letterSpacing: "-.4px", lineHeight: 1 }}>
            <span style={{ color: "var(--amber)" }}>KTN</span> <span style={{ color: "var(--navy)" }}>Digital Online School</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--amber)" }} />
            <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".7px", color: "var(--inkSoft)", textTransform: "uppercase" }}>Education for Free · Since 2019</span>
          </div>
        </div>
      </div>
      <button className="btnGhost" onClick={onSignIn}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 13px", fontSize: 12.5, fontWeight: 700, color: "#fff", background: "var(--azure)", border: "none", borderRadius: 12, boxShadow: "0 4px 12px rgba(47,107,255,.3)" }}>
        <Icon name="lock" size={13} color="#fff" /> Sign in
      </button>
    </header>
  );
}

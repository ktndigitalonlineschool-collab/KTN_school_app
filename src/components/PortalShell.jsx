import Icon from "../data/icons.jsx";
import logo from "../assets/logo.png";

const ROLE_LABEL = { admin: "Admin", teacher: "Teacher", student: "Student / Parent" };

export default function PortalShell({ user, onLogout, children }) {
  return (
    <div className="wrap">
      <header className="bar">
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", padding: 2, background: "linear-gradient(135deg, var(--azure), var(--amber))", flexShrink: 0 }}>
            <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={logo} alt="KTN" style={{ width: 30, height: 30, objectFit: "contain" }} />
            </div>
          </div>
          <div style={{ lineHeight: 1.05 }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 14.5, color: "var(--ink)" }}>
              {ROLE_LABEL[user.role]} portal
            </div>
            <div style={{ fontSize: 10.5, color: "var(--inkSoft)", fontWeight: 600 }}>{user.name}</div>
          </div>
        </div>
        <button className="btnGhost" onClick={onLogout}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", fontSize: 12.5, color: "var(--inkSoft)", fontWeight: 600 }}>
          <Icon name="logout" size={15} color="#52617A" /> Log out
        </button>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}

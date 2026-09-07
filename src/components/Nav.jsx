import Icon from "../data/icons.jsx";

const NAV = [
  ["home", "Home", "home"],
  ["about", "About", "info"],
  ["classes", "Classes", "calendar"],
  ["teachers", "Teachers", "users"],
  ["news", "News", "newspaper"],
  ["apply", "Apply", "send"],
];

export default function Nav({ tab, staff, onGo }) {
  return (
    <nav className="tabs">
      {NAV.map(([key, label, ic]) => {
        const active = tab === key || (key === "home" && tab === "staff" && !staff);
        return (
          <button key={key} onClick={() => onGo(key)}>
            <div className="pill" style={{ background: active ? "var(--tintBlue)" : "transparent" }}>
              <Icon name={ic} size={19} color={active ? "#2F6BFF" : "#52617A"} sw={active ? 2.5 : 2} />
            </div>
            <span className="lbl" style={{ color: active ? "var(--azure)" : "var(--inkSoft)", fontWeight: active ? 700 : 600 }}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

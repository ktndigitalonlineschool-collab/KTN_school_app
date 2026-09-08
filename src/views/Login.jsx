import { useState } from "react";
import Icon from "../data/icons.jsx";
import logo from "../assets/logo.png";
import Mascot from "../components/Mascot.jsx";
import { hasFirebase } from "../lib/firebase";
import {
  signInEmail, resetPassword, demoLoginAdmin, demoLoginTeacher, demoLoginStudent,
} from "../lib/auth";

export default function Login({ onBack, onLoggedIn, onSignup }) {
  return hasFirebase
    ? <EmailLogin onBack={onBack} onSignup={onSignup} />
    : <DemoLogin onBack={onBack} onLoggedIn={onLoggedIn} />;
}

/* ---------- Real login (Firebase) ---------- */
function EmailLogin({ onBack, onSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr(""); setMsg(""); setBusy(true);
    try { await signInEmail(email, password); }         // App's auth listener shows the portal
    catch (e) { setErr(friendly(e)); }
    finally { setBusy(false); }
  }
  async function forgot() {
    setErr(""); setMsg("");
    if (!email.trim()) { setErr("Enter your email first, then tap reset."); return; }
    try { await resetPassword(email); setMsg("Password reset email sent. Check your inbox."); }
    catch (e) { setErr(friendly(e)); }
  }

  return (
    <Shell onBack={onBack}>
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 800, color: "var(--ink)", marginBottom: 14 }}>Sign in to the portal</div>
        <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
        <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        {err && <div style={{ color: "#FF6B5E", fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>{err}</div>}
        {msg && <div style={{ color: "#1E9E5A", fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>{msg}</div>}
        <button className="btnP" onClick={submit} disabled={busy} style={{ width: "100%", justifyContent: "center", opacity: busy ? 0.7 : 1 }}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <button onClick={forgot} style={{ background: "none", border: "none", color: "var(--azure)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", marginTop: 12, width: "100%" }}>
          Forgot password?
        </button>
        <div style={{ borderTop: "1px solid var(--line)", margin: "14px 0 0", paddingTop: 14, textAlign: "center" }}>
          <span style={{ fontSize: 12.5, color: "var(--inkSoft)" }}>Are you a teacher? </span>
          <button onClick={onSignup} style={{ background: "none", border: "none", color: "var(--azure)", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Create an account</button>
          <div style={{ fontSize: 11.5, color: "var(--inkSoft)", marginTop: 6 }}>Parents: you'll get a “set your password” email once your child is enrolled.</div>
        </div>
      </div>
      <p className="para" style={{ fontSize: 12, textAlign: "center", marginTop: 14 }}>
        Admins, teachers and parents sign in with the email &amp; password given to them. Anyone can browse the public school site without signing in.
      </p>
    </Shell>
  );
}
function friendly(e) {
  const c = (e && e.code) || "";
  if (c.includes("invalid-credential") || c.includes("wrong-password") || c.includes("user-not-found")) return "Email or password is incorrect.";
  if (c.includes("too-many-requests")) return "Too many attempts. Please wait a moment and try again.";
  if (c.includes("invalid-email")) return "That doesn't look like a valid email.";
  return (e && e.message) || "Sign-in failed.";
}

/* ---------- Demo login (no Firebase) ---------- */
const ROLES = [
  { key: "student", label: "Student / Parent", ic: "cap", tint: "#EAF1FF", col: "#2F6BFF", desc: "See your marks & attendance", hint: "Your code, e.g. S-3001", demo: "S-3001" },
  { key: "teacher", label: "Teacher", ic: "users", tint: "#EAF7EF", col: "#1E9E5A", desc: "Take attendance, enter marks", hint: "Your teacher code, e.g. T-101", demo: "T-101" },
  { key: "admin", label: "Admin", ic: "spark", tint: "#FDEEDA", col: "#B76A0E", desc: "Manage the whole school", hint: "Admin passcode", demo: "admin123" },
];
function DemoLogin({ onBack, onLoggedIn }) {
  const [role, setRole] = useState(null);
  const [value, setValue] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const active = ROLES.find((r) => r.key === role);

  async function submit() {
    setErr(""); setBusy(true);
    try {
      let user;
      if (role === "admin") user = await demoLoginAdmin(value.trim());
      else if (role === "teacher") user = await demoLoginTeacher(value);
      else user = await demoLoginStudent(value);
      onLoggedIn(user);
    } catch (e) { setErr(e.message || "Sign-in failed."); }
    finally { setBusy(false); }
  }

  return (
    <Shell onBack={role ? () => { setRole(null); setValue(""); setErr(""); } : onBack} backLabel={role ? "Choose a different role" : "Back to school site"}>
      {!role && (
        <>
          {ROLES.map((r) => (
            <div key={r.key} className="card lift" onClick={() => setRole(r.key)} style={{ padding: 16, marginBottom: 12, display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: r.tint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={r.ic} size={22} color={r.col} sw={2.3} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15.5, fontWeight: 700, color: "var(--ink)" }}>{r.label}</div>
                <div style={{ fontSize: 12.5, color: "var(--inkSoft)", marginTop: 2 }}>{r.desc}</div>
              </div>
              <Icon name="chev" size={20} color="#52617A" />
            </div>
          ))}
          <p className="para" style={{ fontSize: 12, textAlign: "center", marginTop: 14 }}>Demo mode, connect Firebase for real email &amp; password logins.</p>
        </>
      )}
      {role && (
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: active.tint, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={active.ic} size={20} color={active.col} sw={2.3} />
            </div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>{active.label}</div>
          </div>
          <input className="input" type={role === "admin" ? "password" : "text"} placeholder={active.hint} value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} autoFocus />
          {err && <div style={{ color: "#FF6B5E", fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>{err}</div>}
          <button className="btnP" onClick={submit} disabled={busy} style={{ width: "100%", justifyContent: "center", opacity: busy ? 0.7 : 1 }}>{busy ? "Signing in…" : "Sign in"}</button>
          <div style={{ marginTop: 12, padding: 10, borderRadius: 10, background: "var(--bg)", fontSize: 12, color: "var(--inkSoft)" }}>
            <b style={{ color: "var(--ink)" }}>Demo login:</b> use <code style={{ background: "#fff", padding: "1px 6px", borderRadius: 6, border: "1px solid var(--line)" }}>{active.demo}</code>
            {role === "student" && " (or S-3002 … S-5001)"}
          </div>
        </div>
      )}
    </Shell>
  );
}

/* ---------- Shared frame ---------- */
function Shell({ onBack, backLabel = "Back to school site", children }) {
  return (
    <div className="wrap">
      <main className="content" style={{ paddingTop: 26 }}>
        <button className="btnGhost" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--inkSoft)", fontWeight: 600, marginBottom: 18 }}>
          <Icon name="chev" size={15} color="#52617A" style={{ transform: "rotate(180deg)" }} /> {backLabel}
        </button>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <Mascot size={82} className="mascot-float" style={{ margin: "0 auto" }} />
          <div className="eyebrow" style={{ textAlign: "center", marginTop: 4 }}>KTN Portal</div>
          <h2 className="title" style={{ textAlign: "center" }}>Sign in</h2>
        </div>
        {children}
        <div style={{ height: 20 }} />
      </main>
    </div>
  );
}

import { useState } from "react";
import Icon from "../data/icons.jsx";
import logo from "../assets/logo.png";
import TeacherAssignments from "../components/TeacherAssignments.jsx";
import { signUp } from "../lib/auth";

// Sign-up is for TEACHERS only. Students/parents join via the Apply form; the
// admin accepts them, which creates their login and emails a set-password link.
export default function Signup({ onBack }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setErr("");
    if (!name.trim() || !email.trim()) { setErr("Please enter your name and email."); return; }
    if (password.length < 6) { setErr("Please choose a password of at least 6 characters."); return; }
    if (assignments.length === 0) { setErr("Please add at least one class you teach."); return; }
    setBusy(true);
    try {
      await signUp(email, password, { requestedRole: "teacher", name: name.trim(), email: email.trim(), assignments });
      setDone(true);
    } catch (e) { setErr(friendly(e)); }
    finally { setBusy(false); }
  }

  return (
    <div className="wrap">
      <main className="content" style={{ paddingTop: 26 }}>
        <button className="btnGhost" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--inkSoft)", fontWeight: 600, marginBottom: 18 }}>
          <Icon name="chev" size={15} color="#52617A" style={{ transform: "rotate(180deg)" }} /> Back to sign in
        </button>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <img src={logo} alt="KTN" style={{ width: 70, height: 70, objectFit: "contain", marginBottom: 8 }} />
          <div className="eyebrow" style={{ textAlign: "center" }}>Teacher registration</div>
          <h2 className="title" style={{ textAlign: "center" }}>Create a teacher account</h2>
        </div>

        {done ? (
          <div className="card" style={{ padding: 24, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#EAF7EF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Icon name="check" size={36} color="#1E9E5A" sw={2} />
            </div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 19, fontWeight: 800, color: "var(--ink)", margin: "0 0 8px" }}>Registration submitted</h2>
            <p className="para" style={{ margin: "0 auto 18px", maxWidth: 300 }}>Thank you! An admin will review and approve your account. Once approved, sign in with your email and password.</p>
            <button className="btnP" onClick={onBack} style={{ margin: "0 auto" }}>Back to sign in</button>
          </div>
        ) : (
          <div className="card" style={{ padding: 16 }}>
            <p className="para" style={{ margin: "0 0 12px", fontSize: 13 }}>
              This form is for <b>teachers</b>. Parents don't sign up here — you'll receive a “set your password” email once your child's admission is accepted.
            </p>
            <Label>Full name *</Label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
            <Label>Email address *</Label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
            <TeacherAssignments value={assignments} onChange={setAssignments} />
            <Label>Choose a password *</Label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
            {err && <div style={{ color: "#FF6B5E", fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>{err}</div>}
            <button className="btnP" onClick={submit} disabled={busy} style={{ width: "100%", justifyContent: "center", opacity: busy ? 0.7 : 1 }}>
              {busy ? "Submitting…" : "Submit registration"}
            </button>
          </div>
        )}
        <div style={{ height: 20 }} />
      </main>
    </div>
  );
}

function friendly(e) {
  const c = (e && e.code) || "";
  if (c.includes("email-already-in-use")) return "That email already has an account. Try signing in instead.";
  if (c.includes("invalid-email")) return "That doesn't look like a valid email.";
  if (c.includes("weak-password")) return "Please choose a stronger password (at least 6 characters).";
  return (e && e.message) || "Could not submit. Please try again.";
}
function Label({ children }) { return <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", display: "block", margin: "2px 0 6px" }}>{children}</label>; }

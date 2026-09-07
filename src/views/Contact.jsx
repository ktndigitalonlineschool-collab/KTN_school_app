import { useState } from "react";
import Icon from "../data/icons.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import * as store from "../lib/store";

const CONTACT = [
  ["mail", "Email", "ktndigitalonlineschool@gmail.com"],
  ["phone", "Phone", "+82 10 9313 7860"],
  ["mappin", "Location", "South Korea · fully online"],
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit() {
    if (!form.name.trim() || !form.message.trim()) return;
    setBusy(true);
    try {
      await store.addMessage({ name: form.name.trim(), email: form.email.trim(), message: form.message.trim(), date: new Date().toISOString() });
      setDone(true);
    } finally { setBusy(false); }
  }

  return (
    <>
      <SectionTitle eyebrow="Contact us" title="We'd love to hear from you" />
      <p className="para" style={{ margin: "-6px 0 14px" }}>
        Questions about admissions, classes or volunteering? Send us a message and our team will reply.
      </p>

      <div className="card" style={{ padding: 6, marginBottom: 16 }}>
        {CONTACT.map((c, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, padding: 12, borderBottom: i < 2 ? "1px solid var(--line)" : "none" }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--tintBlue)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={c[0]} size={16} color="#2F6BFF" sw={2.3} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--inkSoft)", fontWeight: 600 }}>{c[1]}</div>
              <div style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 600, wordBreak: "break-word" }}>{c[2]}</div>
            </div>
          </div>
        ))}
      </div>

      {done ? (
        <div className="card" style={{ padding: 24, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#EAF7EF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <Icon name="check" size={30} color="#1E9E5A" sw={2} />
          </div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>Message sent</div>
          <p className="para" style={{ margin: "6px 0 0" }}>Thank you — we'll get back to you soon.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 10 }}>Send us a message</div>
          <input className="input" placeholder="Your name" value={form.name} onChange={set("name")} />
          <input className="input" type="email" placeholder="Your email (optional)" value={form.email} onChange={set("email")} />
          <textarea className="input" rows={4} style={{ resize: "vertical" }} placeholder="How can we help?" value={form.message} onChange={set("message")} />
          <button className="btnP" onClick={submit} disabled={busy} style={{ width: "100%", justifyContent: "center", opacity: busy ? 0.7 : 1 }}>
            <Icon name="send" size={16} color="#fff" sw={2.4} /> {busy ? "Sending…" : "Send message"}
          </button>
        </div>
      )}
      <div style={{ height: 8 }} />
    </>
  );
}

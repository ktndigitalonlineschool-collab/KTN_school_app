import Icon from "../data/icons.jsx";
import Mascot from "../components/Mascot.jsx";
import logo from "../assets/logo.png";
import { MILESTONES } from "../data/content";

const STATS = [["2019", "Founded"], ["100+", "Students / year"], ["1–7", "Grade levels"], ["Free", "Always"]];
const OFFER = [
  ["book", "CBSE core subjects", "Mathematics, English, EVS and Social Science, following the NCERT–CBSE framework for Grades 1–7."],
  ["lang", "Indian languages", "Tamil, Hindi and Telugu, keeping children connected to their mother tongue and heritage."],
  ["spark", "Special classes", "Classical dance, Carnatic music, drawing, computer studies, Korean language and yoga."],
  ["award", "Real exams & certificates", "Quarterly, half-yearly and annual exams with report cards and certificates, just like an Indian school."],
];
const CONTACT = [
  ["mail", "Email", "ktndigitalonlineschool@gmail.com"],
  ["phone", "Phone", "Add your number here"],
  ["mappin", "Location", "South Korea · fully online"],
];

export default function About({ site }) {
  const MS = site && site.milestones && site.milestones.length ? site.milestones : MILESTONES;
  return (
    <>
      <div style={{ textAlign: "center", marginBottom: 16, position: "relative" }}>
        <img src={logo} alt="KTN logo" style={{ width: 108, height: 108, objectFit: "contain", marginBottom: 8 }} />
        <Mascot size={54} className="mascot-float" style={{ position: "absolute", top: 40, right: "50%", marginRight: -96 }} />
        <div className="eyebrow" style={{ textAlign: "center" }}>About us</div>
        <h2 className="title" style={{ textAlign: "center" }}>A school by the community,<br />for the community</h2>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <p className="para" style={{ margin: "0 0 12px" }}>
          KTN Digital Online School (Korea Tamil Nanbargal) is Korea's first entirely free, Indian CBSE/NCERT-based online school. Founded in December 2019, we make quality education accessible to every child in the Indian community across South Korea.
        </p>
        <p className="para" style={{ margin: 0 }}>
          We are powered by dedicated volunteer teachers — the pillars of KTN. Classes run online in the evenings, so children continue their day school while staying connected to their roots, their languages, and their culture.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 9, marginTop: 14 }}>
        {STATS.map((s, i) => (
          <div key={i} className="card" style={{ padding: "13px 6px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 19, fontWeight: 800, color: "var(--azure)" }}>{s[0]}</div>
            <div style={{ fontSize: 10.5, color: "var(--inkSoft)", fontWeight: 600, marginTop: 2 }}>{s[1]}</div>
          </div>
        ))}
      </div>

      <h3 className="h2" style={{ margin: "22px 0 12px" }}>What we offer</h3>
      {OFFER.map((f, i) => (
        <div key={i} className="card" style={{ padding: 15, marginBottom: 10, display: "flex", gap: 13, alignItems: "flex-start" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--tintBlue)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name={f[0]} size={19} color="#2F6BFF" sw={2.3} />
          </div>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)" }}>{f[1]}</div>
            <div style={{ fontSize: 13, color: "var(--inkSoft)", marginTop: 3, lineHeight: 1.45 }}>{f[2]}</div>
          </div>
        </div>
      ))}

      <div className="card" style={{ padding: 16, background: "var(--tintBlue)", border: "none", marginTop: 4 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Icon name="globe" size={20} color="#1B327E" sw={2.2} />
          <p style={{ fontSize: 13, color: "var(--navy)", lineHeight: 1.5, margin: 0 }}>
            With the warm support of the Embassy of India, Seoul, KTN has grown into a global family — welcoming learners from Korea, Australia, Malaysia, Singapore, Taiwan, India and beyond.
          </p>
        </div>
      </div>

      {/* HISTORY */}
      <h3 className="h2" style={{ margin: "24px 0 4px" }}>Our journey</h3>
      <p className="para" style={{ margin: "0 0 14px" }}>From a small idea in 2019 to a thriving online family — the moments that shaped KTN.</p>
      <div style={{ position: "relative", paddingLeft: 30 }}>
        <div style={{ position: "absolute", left: 9, top: 6, bottom: 6, width: 2, background: "var(--line)" }} />
        {MS.map((m, i) => (
          <div key={i} style={{ position: "relative", marginBottom: i === MS.length - 1 ? 0 : 18 }}>
            <div style={{ position: "absolute", left: -30, top: 4, width: 20, height: 20, borderRadius: "50%", background: "#fff", border: `3px solid ${m.color}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: m.color }} />
            </div>
            <div className="card" style={{ padding: 14 }}>
              <div style={{ display: "inline-block", fontSize: 11.5, fontWeight: 800, color: m.color, background: "var(--bg)", padding: "3px 9px", borderRadius: 999, marginBottom: 7 }}>{m.year}</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15.5, fontWeight: 700, color: "var(--ink)", marginBottom: 5 }}>{m.title}</div>
              <p className="para" style={{ margin: 0, fontSize: 13 }}>{m.body}</p>
            </div>
          </div>
        ))}
      </div>

      <h3 className="h2" style={{ margin: "24px 0 12px" }}>Get in touch</h3>
      <div className="card" style={{ padding: 6 }}>
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
      <div style={{ height: 8 }} />
      <div style={{ textAlign: "center", fontSize: 11, color: "var(--inkSoft)", marginTop: 4 }}>KTN Digital School app · v2.0</div>
    </>
  );
}

import { useState, useEffect, useRef } from "react";
import Icon from "../data/icons.jsx";
import Mascot from "../components/Mascot.jsx";
import { TEACH, TEACH_COLORS, ROTATING, VOICES, PRESS } from "../data/content";
import { TEACHERS } from "../data/teachers";
import { GALLERY } from "../data/gallery";
import { prefersReducedMotion } from "../lib/util";
import * as store from "../lib/store";

const HIGHLIGHTS = [
  ["heart", "100% free of cost", "#FCEDEC", "#FF6B5E"],
  ["book", "Indian CBSE curriculum", "#FDEEDA", "#B76A0E"],
  ["lang", "Tamil · Hindi · Telugu", "#EAF1FF", "#2F6BFF"],
  ["spark", "Dance, music, art & more", "#EAF7EF", "#1E9E5A"],
];

function useCountUp(target, run) {
  const [n, setN] = useState(run ? 0 : target);
  useEffect(() => {
    if (!run) { setN(target); return; }
    let raf;
    const t0 = performance.now();
    const dur = 1300;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);
  return n;
}

export default function Home({ news, site, onGo, onLightbox }) {
  const ROT = site && site.taglines && site.taglines.length ? site.taglines : ROTATING;
  const TEACHLIST = site && site.teach && site.teach.length ? site.teach : TEACH;
  const PRESSD = site && site.press ? site.press : PRESS;
  const reduce = prefersReducedMotion();
  const [rot, setRot] = useState(0);
  const [voice, setVoice] = useState(0);
  const rotRef = useRef(null);
  const voiceRef = useRef(null);

  const years = useCountUp(6, false);
  const students = useCountUp(100, false);
  const grades = useCountUp(7, false);
  const sd = (site && site.stats) || {};
  const st = { years: sd.years || "6", students: sd.students || "100+", grades: sd.grades || "7", free: sd.free || "Free" };

  useEffect(() => {
    if (reduce) return;
    const a = setInterval(() => {
      setRot((r) => (r + 1) % ROT.length);
      const el = rotRef.current;
      if (el) { el.classList.remove("swap"); void el.offsetWidth; el.classList.add("swap"); }
    }, 2600);
    const b = setInterval(() => {
      setVoice((v) => (v + 1) % VOICES.length);
      const el = voiceRef.current;
      if (el) { el.classList.remove("swap"); void el.offsetWidth; el.classList.add("swap"); }
    }, 4800);
    return () => { clearInterval(a); clearInterval(b); };
  }, [reduce, site]);

  const [extraGallery, setExtraGallery] = useState([]);
  useEffect(() => { store.listGalleryExtra().then(setExtraGallery).catch(() => {}); }, []);
  const gallery = [...GALLERY, ...extraGallery];

  const pinned = news.find((n) => n.pinned) || news[0];
  const v = VOICES[voice];

  return (
    <>
      {/* HERO */}
      <div className="hero">
        <div className="blob" style={{ top: -45, right: -30, width: 160, height: 160, background: "rgba(255,255,255,.13)" }} />
        <div className="blob blob2" style={{ bottom: -55, left: -25, width: 130, height: 130, background: "rgba(255,176,32,.28)" }} />
        <div className="blob blob3" style={{ top: 60, left: "45%", width: 70, height: 70, background: "rgba(255,107,94,.22)" }} />
        <Mascot size={62} className="mascot-float" style={{ position: "absolute", top: 14, right: 12, opacity: 0.97 }} />
        <div style={{ position: "relative" }}>
          <div className="reveal r1" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.18)", color: "#fff", padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, marginBottom: 16 }}>
            <Icon name="heart" size={13} color="#fff" /> Education for Free · Education for All
          </div>
          <h1 className="reveal r2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#fff", fontSize: 27, lineHeight: 1.15, fontWeight: 800, margin: 0, letterSpacing: "-.6px" }}>
            Where our children<br />learn, grow & stay rooted
          </h1>
          <div className="reveal r3" style={{ height: 26, margin: "12px 0 20px", overflow: "hidden" }}>
            <div ref={rotRef} className="swap" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#fff", fontSize: 15, fontWeight: 700 }}>
              <Icon name="spark" size={15} color="#F5921E" />
              <span style={{ color: "#FFD9A6" }}>{ROT[rot % ROT.length]}</span>
            </div>
          </div>
          <div className="reveal r4" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => onGo("apply")} style={{ background: "#F5921E", color: "#1B327E", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 800, fontSize: 14.5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7, boxShadow: "0 6px 16px rgba(255,176,32,.4)" }}>
              Join for free <Icon name="chev" size={17} color="#1B327E" sw={2.6} />
            </button>
            <button onClick={() => onGo("about")} style={{ background: "rgba(255,255,255,.16)", color: "#fff", border: "1.5px solid rgba(255,255,255,.4)", borderRadius: 12, padding: "12px 16px", fontWeight: 700, fontSize: 14.5, cursor: "pointer" }}>
              About us
            </button>
          </div>
        </div>
      </div>

      {/* STATS (editable via Admin → Content) */}
      <div className="card" style={{ marginTop: 16, padding: "16px 8px", display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
        {[[st.years, "Years strong"], [st.students, "Students / year"], [st.grades, "Grade levels"], [st.free, "Always"]].map((s, i) => (
          <div key={i} style={{ textAlign: "center", borderRight: i < 3 ? "1px solid var(--line)" : "none" }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 21, fontWeight: 800, color: "var(--azure)", lineHeight: 1 }}>{s[0]}</div>
            <div style={{ fontSize: 10, color: "var(--inkSoft)", fontWeight: 600, marginTop: 5 }}>{s[1]}</div>
          </div>
        ))}
      </div>

      {/* MARQUEE */}
      <div style={{ marginTop: 20 }}>
        <h2 className="h2" style={{ marginBottom: 10 }}>What we teach</h2>
        <div className="marquee">
          <div className="marquee-track">
            {TEACHLIST.concat(TEACHLIST).map((s, i) => (
              <span key={i} className="chip">
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: TEACH_COLORS[i % TEACH_COLORS.length] }} />
                {s}
              </span>
            ))}
          </div>
          <div className="fade-l" /><div className="fade-r" />
        </div>
      </div>

      {/* GALLERY */}
      <div style={{ marginTop: 22 }}>
        <h2 className="h2" style={{ marginBottom: 10 }}>Life at KTN</h2>
        <div className="gstrip">
          {gallery.map((p, i) => (
            <div key={i} className="gphoto" onClick={() => onLightbox(p)}>
              <img src={p.src} alt={p.cap} />
              <div className="cap">{p.cap}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HIGHLIGHTS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20 }}>
        {HIGHLIGHTS.map((x, i) => (
          <div key={i} className="card lift" style={{ padding: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: x[2], display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 9 }}>
              <Icon name={x[0]} size={18} color={x[3]} sw={2.3} />
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{x[1]}</div>
          </div>
        ))}
      </div>

      {/* IN THE NEWS */}
      <a href={PRESSD.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block", marginTop: 20 }}>
        <div className="card lift" style={{ padding: 16, display: "flex", gap: 13, alignItems: "flex-start" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#FDEEDA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="newspaper" size={19} color="#B76A0E" sw={2.3} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#B76A0E", letterSpacing: ".5px", textTransform: "uppercase" }}>In the news · {PRESSD.outlet}</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14.5, fontWeight: 700, color: "var(--ink)", margin: "4px 0 4px", lineHeight: 1.25 }}>{PRESSD.title}</div>
            <div style={{ fontSize: 12.5, color: "var(--inkSoft)", lineHeight: 1.45 }}>{PRESSD.blurb}</div>
            <div style={{ fontSize: 12, color: "var(--azure)", fontWeight: 700, marginTop: 6, display: "inline-flex", alignItems: "center", gap: 3 }}>Read the article <Icon name="chev" size={13} color="#2F6BFF" /></div>
          </div>
        </div>
      </a>

      {/* TEACHERS PREVIEW */}
      <div className="card lift" onClick={() => onGo("teachers")} style={{ marginTop: 20, padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
        <div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15.5, fontWeight: 700, color: "var(--ink)" }}>Meet our teachers</div>
          <div style={{ fontSize: 12.5, color: "var(--inkSoft)", marginTop: 2 }}>More than 30 dedicated volunteers, the heart of KTN</div>
          <div style={{ display: "flex", marginLeft: 10, marginTop: 10 }}>
            {TEACHERS.slice(0, 6).map((t) => (
              <img key={t.key} src={t.photo} alt="" style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", border: "2px solid #fff", marginLeft: -10, boxShadow: "0 2px 6px rgba(22,35,58,.15)" }} />
            ))}
          </div>
        </div>
        <Icon name="chev" size={20} color="#52617A" />
      </div>

      {/* VOICES */}
      <div style={{ marginTop: 20 }}>
        <h2 className="h2" style={{ marginBottom: 10 }}>From our teachers</h2>
        <div className="card" style={{ padding: 18, background: "linear-gradient(135deg, var(--navy), var(--azure))", border: "none", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 10, right: 12 }}>
            <Icon name="quote" size={46} color="rgba(255,255,255,.16)" />
          </div>
          <div ref={voiceRef} className="swap" style={{ position: "relative" }}>
            <p style={{ color: "#fff", fontSize: 15.5, lineHeight: 1.5, fontWeight: 600, margin: "0 0 12px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>“{v.q}”</p>
            <div style={{ color: "#FFD9A6", fontSize: 13, fontWeight: 700 }}>{v.name}</div>
            <div style={{ color: "rgba(255,255,255,.75)", fontSize: 12 }}>{v.role}</div>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
            {VOICES.map((_, i) => (
              <div key={i} style={{ width: i === voice ? 18 : 6, height: 6, borderRadius: 999, background: i === voice ? "#F5921E" : "rgba(255,255,255,.35)", transition: "width .3s" }} />
            ))}
          </div>
        </div>
      </div>

      {/* NEWS PREVIEW */}
      {pinned && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h2 className="h2">Latest news</h2>
            <button onClick={() => onGo("news")} style={{ background: "none", border: "none", color: "var(--azure)", fontWeight: 700, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 2, cursor: "pointer" }}>
              See all <Icon name="chev" size={14} color="#2F6BFF" />
            </button>
          </div>
          <div className="card lift" style={{ padding: 16 }}>
            <span className="pillBadge" style={{ background: "#FDEEDA", color: "#B76A0E" }}>
              <Icon name="pin" size={13} color="#B76A0E" sw={2.4} /> Pinned
            </span>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "var(--ink)", margin: "10px 0 6px" }}>{pinned.title}</h3>
            <p className="para" style={{ margin: 0 }}>{pinned.body}</p>
          </div>
        </div>
      )}

      {/* QUICK LINKS */}
      <div className="card lift" onClick={() => onGo("calendar")} style={{ marginTop: 20, padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#FDEEDA", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="calendar" size={20} color="#B76A0E" sw={2.3} />
          </div>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14.5, fontWeight: 700, color: "var(--ink)" }}>School calendar</div>
            <div style={{ fontSize: 12, color: "var(--inkSoft)", marginTop: 2 }}>Term dates, holidays & exams</div>
          </div>
        </div>
        <Icon name="chev" size={20} color="#52617A" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
        <div className="card lift" onClick={() => onGo("founders")} style={{ padding: 16, cursor: "pointer" }}>
          <Icon name="users" size={20} color="#2F6BFF" sw={2.3} />
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14.5, fontWeight: 700, color: "var(--ink)", marginTop: 8 }}>Our founders</div>
          <div style={{ fontSize: 12, color: "var(--inkSoft)", marginTop: 2 }}>Meet the team behind KTN</div>
        </div>
        <div className="card lift" onClick={() => onGo("contact")} style={{ padding: 16, cursor: "pointer" }}>
          <Icon name="mail" size={20} color="#1E9E5A" sw={2.3} />
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14.5, fontWeight: 700, color: "var(--ink)", marginTop: 8 }}>Contact us</div>
          <div style={{ fontSize: 12, color: "var(--inkSoft)", marginTop: 2 }}>Questions? Get in touch</div>
        </div>
      </div>

      {/* CTA */}
      <div className="card" style={{ marginTop: 20, padding: 22, textAlign: "center", background: "linear-gradient(140deg, #F5921E, #F98029)", border: "none" }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 19, fontWeight: 800, color: "var(--navy)", lineHeight: 1.25 }}>Admissions are open, and it's free</div>
        <p style={{ fontSize: 13.5, color: "#5A4410", margin: "8px 0 16px", lineHeight: 1.45 }}>Give your child their roots, their language, and a caring community. Request a place today.</p>
        <button onClick={() => onGo("apply")} style={{ background: "var(--navy)", color: "#fff", border: "none", borderRadius: 12, padding: "12px 20px", fontWeight: 800, fontSize: 14.5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7 }}>
          Request admission <Icon name="chev" size={17} color="#fff" sw={2.6} />
        </button>
      </div>
      <div style={{ height: 8 }} />
    </>
  );
}

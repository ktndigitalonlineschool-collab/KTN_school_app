import { useState, useEffect } from "react";
import SectionTitle from "../components/SectionTitle.jsx";
import { TEACHERS } from "../data/teachers";
import * as store from "../lib/store";

export default function Teachers() {
  const [dir, setDir] = useState(null);
  useEffect(() => { store.listDirectory().then(setDir).catch(() => setDir([])); }, []);

  // Use the admin-managed directory if it has entries, else the built-in 28.
  const base = dir && dir.length ? dir : TEACHERS;
  const byExp = (a, b) => (parseInt(a.joined, 10) || 9999) - (parseInt(b.joined, 10) || 9999);
  const current = base.filter((t) => !t.left).slice().sort(byExp);
  const past = base.filter((t) => t.left).slice().sort(byExp);

  const Card = (t, i) => (
    <div key={t.id || t.key || i} className="card tcard lift">
      {t.photo ? <img src={t.photo} alt={t.name} /> : <div style={{ width: 74, height: 74, borderRadius: "50%", margin: "0 auto", background: "#EAF1FF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, color: "#2F6BFF" }}>{(t.name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("")}</div>}
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13.5, fontWeight: 700, color: "var(--ink)", marginTop: 9, lineHeight: 1.2 }}>{t.name}</div>
      <div style={{ fontSize: 11.5, color: "var(--azure)", fontWeight: 600, marginTop: 3, lineHeight: 1.3 }}>{t.role}</div>
      {t.joined && <div style={{ fontSize: 10.5, color: "var(--inkSoft)", marginTop: 4 }}>{t.left ? `${t.joined}\u2013${t.left}` : `Since ${t.joined}`}</div>}
    </div>
  );

  return (
    <>
      <SectionTitle eyebrow="Our teachers" title={`${current.length} volunteers, one family`} />
      <p className="para" style={{ margin: "-6px 0 14px" }}>
        Every KTN teacher is a volunteer who gives their time so children can learn for free. Here is the team.
      </p>
      <div className="tgrid">
        {current.map(Card)}
      </div>

      {past.length > 0 && (
        <>
          <h3 className="h2" style={{ margin: "26px 0 4px" }}>Past teachers, with gratitude 🧡</h3>
          <p className="para" style={{ margin: "0 0 14px", fontSize: 13 }}>With heartfelt thanks to those who gave their time to KTN over the years.</p>
          <div className="tgrid">
            {past.map(Card)}
          </div>
        </>
      )}
      <div style={{ height: 8 }} />
    </>
  );
}

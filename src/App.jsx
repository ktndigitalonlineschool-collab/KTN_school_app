import { useState, useEffect, useRef } from "react";
import Header from "./components/Header.jsx";
import Nav from "./components/Nav.jsx";
import Lightbox from "./components/Lightbox.jsx";
import PortalShell from "./components/PortalShell.jsx";
import Home from "./views/Home.jsx";
import About from "./views/About.jsx";
import Classes from "./views/Classes.jsx";
import Teachers from "./views/Teachers.jsx";
import News from "./views/News.jsx";
import Apply from "./views/Apply.jsx";
import Contact from "./views/Contact.jsx";
import Founders from "./views/Founders.jsx";
import Calendar from "./views/Calendar.jsx";
import Login from "./views/Login.jsx";
import Signup from "./views/Signup.jsx";
import Admin from "./views/Admin.jsx";
import Teacher from "./views/Teacher.jsx";
import Student from "./views/Student.jsx";
import Icon from "./data/icons.jsx";
import Mascot from "./components/Mascot.jsx";
import logo from "./assets/logo.png";
import { hasFirebase } from "./lib/firebase";
import { subscribeAuth, signOutUser, getDemoSession } from "./lib/auth";
import * as store from "./lib/store";

export default function App() {
  const [session, setSession] = useState(hasFirebase ? undefined : getDemoSession());
  const [screen, setScreen] = useState("site"); // "site" | "login" | "signup"

  useEffect(() => {
    if (!hasFirebase) return;
    const unsub = subscribeAuth((s) => setSession(s));
    return unsub;
  }, []);

  if (session === undefined) return <Splash />;

  // Signed in
  if (session) {
    const logout = async () => { await signOutUser(); setSession(null); setScreen("site"); };
    if (session.role === "pending" || session.role === "rejected" || session.role === "none") {
      return <StatusScreen role={session.role} email={session.email} onLogout={logout} />;
    }
    return (
      <PortalShell user={session} onLogout={logout}>
        {session.role === "admin" && <Admin />}
        {session.role === "teacher" && <Teacher user={session} />}
        {session.role === "student" && <Student user={session} />}
      </PortalShell>
    );
  }

  if (screen === "login") {
    return <Login onBack={() => setScreen("site")} onSignup={() => setScreen("signup")} onLoggedIn={(u) => { setScreen("site"); setSession(u); }} />;
  }
  if (screen === "signup") {
    return <Signup onBack={() => setScreen("login")} />;
  }
  return <PublicSite onSignIn={() => setScreen("login")} />;
}

function Splash() {
  return (
    <div className="wrap" style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", opacity: 0.85 }}>
        <Mascot size={96} className="mascot-float" />
        <div style={{ marginTop: 8, fontSize: 13, color: "var(--inkSoft)", fontWeight: 600 }}>Loading…</div>
      </div>
    </div>
  );
}

function StatusScreen({ role, email, onLogout }) {
  const map = {
    pending: { ic: "clock", col: "#B76A0E", tint: "#FDEEDA", title: "Waiting for approval", body: "Your registration has been received. An admin will approve your account soon — then you can sign in and see your portal." },
    rejected: { ic: "x", col: "#FF6B5E", tint: "#FCEDEC", title: "Account not approved", body: "This account wasn't approved. Please contact the school if you think this is a mistake." },
    none: { ic: "info", col: "#52617A", tint: "#EEF1F7", title: "Account not set up", body: "Your account isn't linked to a role yet. Please ask the admin to finish setting it up." },
  };
  const m = map[role] || map.none;
  return (
    <div className="wrap">
      <main className="content" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="card" style={{ padding: 26, textAlign: "center", maxWidth: 340 }}>
          {role === "pending"
            ? <Mascot size={90} className="mascot-float" style={{ margin: "0 auto 6px" }} />
            : <div style={{ width: 60, height: 60, borderRadius: "50%", background: m.tint, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}><Icon name={m.ic} size={30} color={m.col} sw={2} /></div>}
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 19, fontWeight: 800, color: "var(--ink)", margin: "0 0 8px" }}>{m.title}</h2>
          <p className="para" style={{ margin: "0 0 18px" }}>{m.body}</p>
          {email && <div style={{ fontSize: 12, color: "var(--inkSoft)", marginBottom: 16 }}>Signed in as {email}</div>}
          <button className="btnP" onClick={onLogout} style={{ margin: "0 auto" }}>Log out</button>
        </div>
      </main>
    </div>
  );
}

function PublicSite({ onSignIn }) {
  const [tab, setTab] = useState("home");
  const [news, setNews] = useState([]);
  const [grade, setGrade] = useState("Grade 1");
  const [lightbox, setLightbox] = useState(null);
  const [site, setSite] = useState(null);
  const mainRef = useRef(null);

  useEffect(() => {
    store.listNews().then(setNews).catch(() => {});
    store.getSiteContent().then(setSite).catch(() => {});
  }, []);

  function go(next) { setTab(next); if (mainRef.current) mainRef.current.scrollTop = 0; }
  async function submitApply(record) { await store.addApp(record); }

  function view() {
    switch (tab) {
      case "home": return <Home news={news} site={site} onGo={go} onLightbox={setLightbox} />;
      case "about": return <About site={site} />;
      case "classes": return <Classes grade={grade} onGrade={setGrade} />;
      case "teachers": return <Teachers />;
      case "news": return <News news={news} staff={false} onPublish={() => {}} onDelete={() => {}} />;
      case "apply": return <Apply onSubmit={submitApply} />;
      case "contact": return <Contact />;
      case "founders": return <Founders site={site} />;
      case "calendar": return <Calendar site={site} />;
      default: return <Home news={news} site={site} onGo={go} onLightbox={setLightbox} />;
    }
  }

  // Bottom nav highlights Home for the extra (non-tab) pages
  const navTab = ["contact", "founders", "calendar"].includes(tab) ? "home" : tab;

  return (
    <div className="wrap">
      <Header onSignIn={onSignIn} />
      <main className="content" ref={mainRef}>{view()}</main>
      <Nav tab={navTab} staff={false} onGo={go} />
      {lightbox && <Lightbox photo={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

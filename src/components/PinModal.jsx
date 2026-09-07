import { useRef, useEffect, useState } from "react";
import Icon from "../data/icons.jsx";

const PIN = import.meta.env.VITE_STAFF_PIN || "1234";

export default function PinModal({ onClose, onSuccess }) {
  const inputRef = useRef(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function submit() {
    if ((inputRef.current?.value || "") === PIN) onSuccess();
    else setErr(true);
  }

  return (
    <div className="backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 22, width: "100%", maxWidth: 320 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--tintBlue)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="lock" size={17} color="#2F6BFF" />
            </div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 16, color: "var(--ink)" }}>
              Staff sign in
            </div>
          </div>
          <button className="btnGhost" onClick={onClose}>
            <Icon name="x" size={16} color="#52617A" />
          </button>
        </div>
        <input
          ref={inputRef}
          type="password"
          className="input"
          placeholder="Enter PIN"
          onKeyDown={(e) => e.key === "Enter" && submit()}
          style={{ textAlign: "center", letterSpacing: 6, fontSize: 18, marginBottom: err ? 6 : 12 }}
        />
        {err && (
          <div style={{ color: "#FF6B5E", fontSize: 12.5, marginBottom: 12, fontWeight: 600 }}>
            Incorrect PIN. Try again.
          </div>
        )}
        <button className="btnP" onClick={submit} style={{ width: "100%", justifyContent: "center" }}>
          Sign in
        </button>
        <div style={{ fontSize: 11, color: "var(--inkSoft)", textAlign: "center", marginTop: 10 }}>
          Teachers only
        </div>
      </div>
    </div>
  );
}

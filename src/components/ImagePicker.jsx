import { useRef, useState } from "react";
import Icon from "../data/icons.jsx";

// Resize a chosen image file to a small JPEG data URI, entirely in the browser.
// This keeps photos free (stored inside Firestore) with no Firebase Storage.
function fileToResizedDataURI(file, maxSize, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) { height = Math.round((height * maxSize) / width); width = maxSize; }
        else if (height > maxSize) { width = Math.round((width * maxSize) / height); height = maxSize; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ImagePicker({ value, onChange, shape = "circle", maxSize = 400, quality = 0.72 }) {
  const fileRef = useRef(null);
  const [mode, setMode] = useState("upload"); // "upload" | "link"
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");

  async function pick(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setBusy(true);
    try { onChange(await fileToResizedDataURI(file, maxSize, quality)); }
    finally { setBusy(false); }
  }

  const previewStyle = {
    width: 64, height: 64, objectFit: "cover", border: "1px solid var(--line)",
    borderRadius: shape === "circle" ? "50%" : 12, background: "#F0F3FA",
  };

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {value ? <img src={value} alt="" style={previewStyle} /> : (
          <div style={{ ...previewStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="cap" size={22} color="#9AA7BE" />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <button type="button" onClick={() => setMode("upload")} style={tabStyle(mode === "upload")}>Upload</button>
            <button type="button" onClick={() => setMode("link")} style={tabStyle(mode === "link")}>Paste link</button>
            {value && <button type="button" onClick={() => onChange("")} style={{ ...tabStyle(false), color: "#FF6B5E" }}>Remove</button>}
          </div>
          {mode === "upload" ? (
            <>
              <input ref={fileRef} type="file" accept="image/*" onChange={pick} style={{ display: "none" }} />
              <button type="button" className="btnGhost" onClick={() => fileRef.current && fileRef.current.click()} disabled={busy}
                style={{ fontSize: 12.5, fontWeight: 600, color: "var(--azure)", padding: "8px 12px" }}>
                {busy ? "Processing…" : "Choose a photo"}
              </button>
            </>
          ) : (
            <div style={{ display: "flex", gap: 6 }}>
              <input className="input" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} style={{ margin: 0 }} />
              <button type="button" className="btnP" onClick={() => url.trim() && onChange(url.trim())} style={{ padding: "9px 12px" }}>Use</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function tabStyle(on) {
  return { background: on ? "var(--tintBlue)" : "transparent", border: "none", borderRadius: 8, padding: "5px 9px", fontSize: 12, fontWeight: 700, cursor: "pointer", color: on ? "var(--azure)" : "var(--inkSoft)" };
}

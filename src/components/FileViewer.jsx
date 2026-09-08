import { useEffect } from "react";
import Icon from "../data/icons.jsx";

// Shows a Drive file preview in an iframe, with Download and Open buttons.
// `file` = { name, viewUrl, downloadUrl, openUrl }.
export default function FileViewer({ file, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (!file) return null;

  return (
    <div className="backdrop" style={{ padding: 14 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "100%", maxWidth: 420, height: "82vh", background: "#fff", borderRadius: 18, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name || "Worksheet"}</div>
          <button className="btnGhost" onClick={onClose}><Icon name="x" size={16} color="#52617A" /></button>
        </div>
        {file.viewUrl
          ? <iframe title="viewer" src={file.viewUrl} style={{ flex: 1, border: 0, width: "100%" }} />
          : <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--inkSoft)", fontSize: 14, padding: 20, textAlign: "center" }}>Preview isn't available for this link, use Open below.</div>}
        <div style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid var(--line)" }}>
          {file.downloadUrl && <a href={file.downloadUrl} className="btnP" style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}><Icon name="send" size={15} color="#fff" sw={2.4} style={{ transform: "rotate(90deg)" }} /> Download</a>}
          {(file.openUrl || file.viewUrl) && <a href={file.openUrl || file.viewUrl} target="_blank" rel="noopener noreferrer" className="btnP" style={{ flex: 1, justifyContent: "center", textDecoration: "none", background: "var(--tintBlue)", color: "var(--azure)" }}><Icon name="globe" size={15} color="#2F6BFF" sw={2.4} /> Open</a>}
        </div>
      </div>
    </div>
  );
}

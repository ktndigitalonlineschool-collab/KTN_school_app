import { useEffect } from "react";

export default function Lightbox({ photo, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!photo) return null;
  return (
    <div className="lbox" onClick={onClose}>
      <img src={photo.src} alt={photo.cap} />
      <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{photo.cap}</div>
    </div>
  );
}

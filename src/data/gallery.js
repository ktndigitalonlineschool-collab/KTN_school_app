// Gallery images imported from ./assets/gallery, paired with captions.
const mods = import.meta.glob("../assets/gallery/*.jpg", { eager: true, import: "default" });
const CAPS = ["Cultural performance", "Annual field trip", "Live online learning", "Anniversary celebration", "Honouring our students", "Field trip group"];
const entries = Object.keys(mods).sort((a,b)=>{
  const na = parseInt(a.match(/g(\d+)\.jpg/)[1], 10);
  const nb = parseInt(b.match(/g(\d+)\.jpg/)[1], 10);
  return na - nb;
});
export const GALLERY = entries.map((path, i) => ({ src: mods[path], cap: CAPS[i] || "" }));

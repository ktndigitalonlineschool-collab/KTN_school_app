// Gallery images imported from ./assets/gallery, paired with captions.
// The KTN teachers (Annual Day) photo is featured first, before the rest.
import teachersAnnual from "../assets/gallery/teachers-annualday.jpg";

const mods = import.meta.glob("../assets/gallery/g*.jpg", { eager: true, import: "default" });
const CAPS = ["Cultural performance", "Annual field trip", "Live online learning", "Anniversary celebration", "Honouring our students", "Field trip group"];
const entries = Object.keys(mods).sort((a, b) => {
  const na = parseInt(a.match(/g(\d+)\.jpg/)[1], 10);
  const nb = parseInt(b.match(/g(\d+)\.jpg/)[1], 10);
  return na - nb;
});
const builtins = entries.map((path, i) => ({ src: mods[path], cap: CAPS[i] || "" }));

export const GALLERY = [
  { src: teachersAnnual, cap: "KTN teachers · Annual Day" },
  ...builtins,
];

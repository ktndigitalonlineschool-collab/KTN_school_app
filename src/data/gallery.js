// Gallery images imported from ./assets/gallery, paired with captions.
// The KTN teachers (Annual Day) photo is featured first, before the rest.
import teachersAnnual from "../assets/gallery/teachers-annualday.jpg";

const mods = import.meta.glob("../assets/gallery/g*.jpg", { eager: true, import: "default" });
const CAPS = ["Cultural performance", "Field trip to the farm", "In the classroom", "Anniversary celebration", "Gandhi Jayanti", "Campus visit"];
const entries = Object.keys(mods).sort((a, b) => {
  const na = parseInt(a.match(/g(\d+)\.jpg/)[1], 10);
  const nb = parseInt(b.match(/g(\d+)\.jpg/)[1], 10);
  return na - nb;
});
const builtins = entries.map((path, i) => ({ src: mods[path], cap: CAPS[i] || "" }));

export const GALLERY = [
  { src: teachersAnnual, cap: "KTN teachers · Annual Day", wide: true },
  ...builtins,
];

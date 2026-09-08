// Builds the official "Record of Academic Performance" report card as printable
// HTML. One page per semester. Grades auto-derived from the KTN grade scale.
import { academicYear } from "./util";

const SCALE = [
  ["91 - 100", "A1"], ["81 - 90", "A2"], ["71 - 80", "B1"], ["61 - 70", "B2"],
  ["51 - 60", "C1"], ["41 - 50", "C2"], ["33 - 40", "D"], ["32 and below", "E"],
  ["Not applicable", "NA"], ["Absent", "AB"],
];

function gradeFor(m) {
  if (m == null || m === "") return "";
  const n = Number(m);
  if (isNaN(n)) return "";
  if (n >= 91) return "A1"; if (n >= 81) return "A2"; if (n >= 71) return "B1";
  if (n >= 61) return "B2"; if (n >= 51) return "C1"; if (n >= 41) return "C2";
  if (n >= 33) return "D"; return "E";
}

function yearLabel() {
  const ay = academicYear(); // e.g. "2026-27"
  const parts = ay.split("-");
  return `${parts[0]} - 20${parts[1]}`;
}

const SIGNATURE = `<svg width="120" height="46" viewBox="0 0 120 46" xmlns="http://www.w3.org/2000/svg"><path d="M6 34 C 18 6, 26 6, 24 30 C 23 40, 30 12, 40 20 C 47 26, 44 8, 54 14 C 62 19, 58 34, 70 24 C 80 16, 86 30, 100 18 C 108 11, 114 20, 118 16" fill="none" stroke="#2a3a6a" stroke-width="2" stroke-linecap="round"/></svg>`;

function semesterPage(card, semKey, semLabel, logoUrl, isLast) {
  const marks = (card.marks && card.marks[semKey]) || {};
  const rows = card.subjects.map((s) => {
    const m = marks[s];
    return `<tr><td class="subj">${s}</td><td class="ctr">${m != null && m !== "" ? m : ""}</td><td class="ctr">${gradeFor(m)}</td></tr>`;
  }).join("");
  const scored = card.subjects.map((s) => marks[s]).filter((v) => v != null && v !== "").map(Number);
  const pct = scored.length ? Math.round((scored.reduce((a, b) => a + b, 0) / scored.length)) : null;
  const overallRow = `<tr class="overall"><td class="subj">OVERALL</td><td class="ctr">${pct != null ? pct + "%" : ""}</td><td class="ctr">${pct != null ? gradeFor(pct) : ""}</td></tr>`;
  const scaleChips = SCALE.map(([r, g]) => `<span class="chip"><b>${g}</b> ${r}</span>`).join("");
  return `<div class="rc${isLast ? "" : " pb"}">
    <div class="head">
      <img class="emb" src="${logoUrl}" />
      <div class="titles">
        <div class="t1">Korea Tamil Nanbargal Digital Online School</div>
        <div class="t2">Republic of Korea</div>
        <div class="t3">Record of Academic Performance</div>
        <div class="t4">${yearLabel()}</div>
      </div>
    </div>
    <table class="idbox"><tbody>
      <tr><td class="k">ROLL NO</td><td class="v">${card.roll || ""}</td></tr>
      <tr><td class="k">GRADE</td><td class="v">${card.grade || ""}</td></tr>
    </tbody></table>
    <table class="namebox"><tbody><tr><td class="lbl">STUDENT NAME</td><td class="nm">${card.name || ""}</td></tr></tbody></table>
    <table class="marks"><tbody>
      <tr><th class="subhead" rowspan="2">SUBJECT</th><th class="semhead" colspan="2">${semLabel}</th></tr>
      <tr><th>MARKS</th><th>GRADE</th></tr>
      ${rows || `<tr><td class="subj" colspan="3" style="text-align:center;color:#888">No marks recorded</td></tr>`}
      ${scored.length ? overallRow : ""}
    </tbody></table>
    <div class="scaleTitle">GRADE SCALE</div>
    <div class="scaleChips">${scaleChips}</div>
    <div class="footer">
      <div class="remarksline"></div>
      <div class="sign">${SIGNATURE}<div class="pl">PRINCIPAL</div></div>
    </div>
  </div>`;
}

const SEM_LABEL = { "Sem 1": "SEMESTER 1", "Sem 2": "SEMESTER 2" };
export function reportCardDoc(cards, logoUrl, sems) {
  const use = sems && sems.length ? sems : ["Sem 1", "Sem 2"];
  const pages = [];
  cards.forEach((card, ci) => {
    use.forEach((sk, si) => {
      const last = ci === cards.length - 1 && si === use.length - 1;
      pages.push(semesterPage(card, sk, SEM_LABEL[sk] || sk, logoUrl, last));
    });
  });
  return `<!doctype html><html><head><meta charset="utf-8"><title>Report card</title>
  <style>
    body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#16233A;background:#eef2f7}
    .rc{width:640px;margin:0 auto;background:#fff;padding:26px 30px 34px;position:relative;box-sizing:border-box}
    .pb{page-break-after:always}
    .head{display:flex;align-items:center;gap:16px;border-bottom:2px solid #2a3a6a;padding-bottom:12px}
    .emb{width:78px;height:78px;object-fit:contain;flex:0 0 auto}
    .titles{flex:1;text-align:center}
    .t1{font-size:17px;font-weight:800;color:#1B327E}
    .t2{font-size:14px;font-weight:800;color:#1B327E;margin-top:3px}
    .t3{font-size:12.5px;font-weight:700;margin-top:6px}
    .t4{font-size:12.5px;font-weight:700;margin-top:3px}
    table{border-collapse:collapse}
    .idbox{margin:14px 0 0 auto;border:1px solid #2a3a6a}
    .idbox .k{background:#DDEBF7;font-weight:800;font-size:11px;padding:5px 12px;border:1px solid #2a3a6a}
    .idbox .v{padding:5px 16px;font-weight:700;font-size:12px;border:1px solid #2a3a6a;min-width:70px;text-align:center}
    .namebox{width:100%;margin-top:8px}
    .namebox .lbl{width:180px;background:#DDEBF7;font-weight:800;font-size:12px;padding:8px 10px;border:1px solid #2a3a6a}
    .namebox .nm{padding:8px 12px;font-size:13px;border:1px solid #2a3a6a}
    .marks{width:100%;margin-top:18px}
    .marks th,.marks td{border:1px solid #2a3a6a;font-size:12.5px;padding:8px 10px}
    .marks .subhead{width:210px;background:#DDEBF7;font-weight:800;vertical-align:middle}
    .marks .semhead{background:#DDEBF7;font-weight:800;text-align:center;font-size:13px}
    .marks th{background:#DDEBF7;font-weight:800}
    .marks .subj{color:#1B327E;font-weight:600}
    .marks .ctr{text-align:center;color:#1E7A45;font-weight:700}
    .marks .overall td{background:#FDF3E6;font-weight:800;color:#1B327E}
    .scaleTitle{font-weight:800;font-size:12px;margin:18px 0 6px;padding-left:2px}
    .scaleChips{display:flex;flex-wrap:wrap;gap:6px}
    .scaleChips .chip{border:1px solid #cdd8ec;background:#f4f8ff;border-radius:6px;padding:4px 9px;font-size:11px;color:#16233A}
    .scaleChips .chip b{color:#1B327E}
    .footer{display:flex;align-items:flex-end;justify-content:space-between;margin-top:30px}
    .remarksline{flex:1}
    .sign{text-align:center}
    .sign .pl{font-weight:800;font-size:12px;letter-spacing:.5px;margin-top:2px;border-top:1px solid #2a3a6a;padding-top:3px}
    .noprint{text-align:center;padding:14px;background:#eef2f7}
    @media print{.noprint{display:none}body{background:#fff}.rc{margin:0}}
  </style></head><body>
  <div class="noprint"><button onclick="window.print()" style="padding:10px 22px;font-size:14px;background:#2F6BFF;color:#fff;border:none;border-radius:8px;cursor:pointer">Save as PDF / Print</button></div>
  ${pages.join("")}
  </body></html>`;
}

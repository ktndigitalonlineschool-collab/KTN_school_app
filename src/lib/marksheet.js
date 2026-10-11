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

const SIGNATURE = `<img src="data:image/png;base64,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" alt="signature" style="height:40px"/>`;

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

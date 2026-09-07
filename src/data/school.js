// Academic model + demo seed data.
// Subjects for each grade are derived from the real timetable, so marks entry
// always matches what a grade actually studies.

import { TT, TT_ORDER } from "./content";

export const TERMS = ["Sem 1", "Sem 2"];
export const ATT_STATUS = ["present", "absent", "late"];
export const ATT_LABEL = { present: "Present", absent: "Absent", late: "Late" };
export const ATT_COLOR = { present: "#1E9E5A", absent: "#FF6B5E", late: "#B76A0E" };

// { "Grade 1": ["English","Maths"], ... }  (Extra Classes excluded)
export const SUBJECTS_BY_GRADE = {};
TT_ORDER.forEach((g) => {
  if (g === "Extra Classes") return;
  const seen = [];
  (TT[g] || []).forEach((row) => {
    if (!seen.includes(row[0])) seen.push(row[0]);
  });
  SUBJECTS_BY_GRADE[g] = seen;
});

export const GRADES = TT_ORDER.filter((g) => g !== "Extra Classes");

// Every subject a teacher might be assigned (core subjects across all grades,
// plus the language subjects). One of these is picked per teacher by the admin.
export const ALL_SUBJECTS = Array.from(
  new Set([].concat(...Object.values(SUBJECTS_BY_GRADE)))
).concat(["Tamil", "Hindi", "Telugu"]).filter((v, i, a) => a.indexOf(v) === i);

// Regular (grade-based) subjects that carry marks.
export const CORE_SUBJECTS = Array.from(
  new Set([].concat(...Object.values(SUBJECTS_BY_GRADE)))
);

// Special / extra classes (no Grade 1–7; level- or activity-based).
export const SPECIAL_CLASSES = [
  "Hindi Level 1", "Hindi Level 2", "Hindi Level 3", "Hindi Level 4",
  "Telugu Level 1", "Telugu Level 2", "Telugu Level 3", "Telugu Level 4",
  "Tamil Level 1", "Tamil Level 2", "Tamil Level 3", "Tamil Level 4",
  "Kannada", "Korean", "Computer", "Classical Dance", "Carnatic Music", "Drawing",
  "Yoga", "General Knowledge",
];

// A teacher's classes are stored as assignments: { subject, grade }.
// Regular class -> grade is "Grade N". Special class -> grade is "".
export function assignmentLabel(a) { return a.grade ? `${a.grade} · ${a.subject}` : a.subject; }
export function deriveAssignments(assignments) {
  const list = assignments || [];
  const subject = list[0] ? list[0].subject : "";
  const grades = Array.from(new Set(list.filter((a) => a.grade).map((a) => a.grade)));
  return { subject, grades };
}

// ---- Demo accounts (DEMO MODE ONLY) ----
// In production these are replaced by real Firebase Authentication logins.
export const ADMIN_PASSCODE = "admin123";

export const SEED_STAFF = [
  { id: "T-101", code: "T-101", name: "Saraswathi Sivamani", subject: "English", grades: ["Grade 3"] },
  { id: "T-103", code: "T-103", name: "Sivasankari S", subject: "Maths", grades: ["Grade 3"] },
  { id: "T-102", code: "T-102", name: "Divyanshi Mishra", subject: "English", grades: ["Grade 5", "Grade 6"] },
];

export const SEED_STUDENTS = [
  { id: "S-3001", code: "S-3001", name: "Aarav Kumar", grade: "Grade 3", parent: "Rajesh Kumar", phone: "+82 10-1111-2222" },
  { id: "S-3002", code: "S-3002", name: "Diya Sharma", grade: "Grade 3", parent: "Meena Sharma", phone: "+82 10-3333-4444" },
  { id: "S-3003", code: "S-3003", name: "Ishaan Reddy", grade: "Grade 3", parent: "Suresh Reddy", phone: "+82 10-5555-6666" },
  { id: "S-3004", code: "S-3004", name: "Ananya Nair", grade: "Grade 3", parent: "Lakshmi Nair", phone: "+82 10-7777-8888" },
  { id: "S-3005", code: "S-3005", name: "Vihaan Gupta", grade: "Grade 3", parent: "Amit Gupta", phone: "+82 10-9999-0000" },
  { id: "S-5001", code: "S-5001", name: "Saanvi Iyer", grade: "Grade 5", parent: "Karthik Iyer", phone: "+82 10-2222-3333" },
  { id: "S-5002", code: "S-5002", name: "Arjun Menon", grade: "Grade 5", parent: "Priya Menon", phone: "+82 10-4444-5555" },
  { id: "S-5003", code: "S-5003", name: "Kiara Das", grade: "Grade 5", parent: "Rahul Das", phone: "+82 10-6666-7777" },
];

// Marks store shape: { "Grade|Subject|Term": { studentId: score } }
export const SEED_MARKS = {
  "Grade 3|English|Sem 1": { "S-3001": 82, "S-3002": 90, "S-3003": 71, "S-3004": 88, "S-3005": 64 },
  "Grade 3|Maths|Sem 1": { "S-3001": 75, "S-3002": 84, "S-3003": 68, "S-3004": 91, "S-3005": 59 },
  "Grade 3|Science|Sem 1": { "S-3001": 79, "S-3002": 86, "S-3003": 73, "S-3004": 80, "S-3005": 66 },
  "Grade 5|English|Sem 1": { "S-5001": 88, "S-5002": 74, "S-5003": 81 },
  "Grade 5|Maths|Sem 1": { "S-5001": 92, "S-5002": 69, "S-5003": 77 },
  "Grade 5|Science|Sem 1": { "S-5001": 85, "S-5002": 72, "S-5003": 79 },
};

// Attendance store shape: { "Grade|Subject|YYYY-MM-DD": { studentId: "present"|"absent"|"late" } }
// Attendance is per subject class, since each teacher teaches one subject.
export const SEED_ATTENDANCE = {
  "Grade 3|English|2026-02-02": { "S-3001": "present", "S-3002": "present", "S-3003": "absent", "S-3004": "present", "S-3005": "late" },
  "Grade 3|English|2026-02-09": { "S-3001": "present", "S-3002": "late", "S-3003": "present", "S-3004": "present", "S-3005": "present" },
  "Grade 3|Maths|2026-02-03": { "S-3001": "present", "S-3002": "present", "S-3003": "present", "S-3004": "absent", "S-3005": "present" },
  "Grade 3|Maths|2026-02-10": { "S-3001": "absent", "S-3002": "present", "S-3003": "present", "S-3004": "present", "S-3005": "present" },
  "Grade 5|English|2026-02-02": { "S-5001": "present", "S-5002": "present", "S-5003": "present" },
  "Grade 5|English|2026-02-09": { "S-5001": "present", "S-5002": "absent", "S-5003": "present" },
};

export const MARK_MAX = 100;

export const GENDERS = ["Female", "Male", "Prefer not to say"];

// Extra-curriculum options offered by the school (multi-select at registration).
export const EXTRA_CURRICULUM = [
  "Hindi Level 1", "Hindi Level 2", "Hindi Level 3", "Hindi Level 4",
  "Telugu Level 1", "Telugu Level 2", "Telugu Level 3", "Telugu Level 4",
  "Tamil Level 1", "Tamil Level 2", "Tamil Level 3", "Tamil Level 4",
  "Kannada", "Korean", "Computer", "Classical Dance", "Carnatic Music", "Drawing",
];

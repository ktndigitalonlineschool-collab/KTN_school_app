// One storage layer, two backends.
//
// Every screen calls these functions — never Firebase or localStorage directly.
// When Firebase keys are present we read/write Firestore (shared across every
// device); otherwise we use this browser, seeded with demo data so the app is
// fully explorable offline. Both return the same shapes.

import { hasFirebase, db } from "./firebase";
import {
  collection, getDocs, getDoc, addDoc, setDoc, deleteDoc, doc, query, orderBy, where, writeBatch, runTransaction,
} from "firebase/firestore";
import { SEED_NEWS } from "../data/content";
import { TT as BASE_TT } from "../data/content";
import { SEED_STUDENTS, SEED_STAFF, SEED_MARKS, SEED_ATTENDANCE } from "../data/school";

/* ---------- on-device helpers ---------- */
function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); }
  catch { return fallback; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}
function lsSeeded(key, seed) {
  const cur = lsGet(key, null);
  if (cur === null) { lsSet(key, seed); return seed; }
  return cur;
}

/* ============ NEWS ============ */
export async function listNews() {
  if (hasFirebase) {
    const snap = await getDocs(query(collection(db, "news"), orderBy("date", "desc")));
    if (snap.empty) {
      for (const item of SEED_NEWS) { const { id, ...rest } = item; await addDoc(collection(db, "news"), rest); }
      const s2 = await getDocs(query(collection(db, "news"), orderBy("date", "desc")));
      return s2.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  return lsGet("ktn_news", null) || SEED_NEWS;
}
export async function addNews(item) {
  if (hasFirebase) { const ref = await addDoc(collection(db, "news"), item); return { id: ref.id, ...item }; }
  const list = lsGet("ktn_news", null) || SEED_NEWS;
  const rec = { id: "n" + Date.now(), ...item }; lsSet("ktn_news", [rec, ...list]); return rec;
}
export async function deleteNews(id) {
  if (hasFirebase) { await deleteDoc(doc(db, "news", id)); return; }
  const list = lsGet("ktn_news", null) || SEED_NEWS; lsSet("ktn_news", list.filter((n) => n.id !== id));
}

/* ============ ADMISSION REQUESTS ============ */
export async function listApps() {
  if (hasFirebase) {
    const snap = await getDocs(query(collection(db, "applications"), orderBy("date", "desc")));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  return lsGet("ktn_apps", []);
}
export async function addApp(item) {
  if (hasFirebase) { const ref = await addDoc(collection(db, "applications"), item); return { id: ref.id, ...item }; }
  const list = lsGet("ktn_apps", []); const rec = { id: "a" + Date.now(), ...item }; lsSet("ktn_apps", [rec, ...list]); return rec;
}
export async function clearApps() {
  if (hasFirebase) {
    const snap = await getDocs(collection(db, "applications"));
    const batch = writeBatch(db); snap.docs.forEach((d) => batch.delete(d.ref)); await batch.commit(); return;
  }
  lsSet("ktn_apps", []);
}

/* ============ STUDENTS ============ */
export async function listStudents() {
  if (hasFirebase) {
    const snap = await getDocs(collection(db, "students"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  return lsSeeded("ktn_students", SEED_STUDENTS);
}
export async function addStudent(s) {
  const code = s.code || genCode("S", s.grade);
  const rec = { ...s, code };
  if (hasFirebase) { const ref = await addDoc(collection(db, "students"), rec); return { id: ref.id, ...rec }; }
  const list = lsSeeded("ktn_students", SEED_STUDENTS);
  const withId = { id: code, ...rec }; lsSet("ktn_students", [...list, withId]); return withId;
}
export async function removeStudent(id) {
  if (hasFirebase) { await deleteDoc(doc(db, "students", id)); return; }
  const list = lsSeeded("ktn_students", SEED_STUDENTS); lsSet("ktn_students", list.filter((s) => s.id !== id));
}
export async function updateStudent(id, patch) {
  if (hasFirebase) { await setDoc(doc(db, "students", id), patch, { merge: true }); return; }
  const list = lsSeeded("ktn_students", SEED_STUDENTS); lsSet("ktn_students", list.map((s) => (s.id === id ? { ...s, ...patch } : s)));
}
export async function findStudentByCode(code) {
  const list = await listStudents();
  return list.find((s) => (s.code || "").toLowerCase() === code.toLowerCase()) || null;
}
// Teachers read only their own grade(s); this grade-scoped query respects that.
export async function listStudentsByGrade(grade) {
  if (hasFirebase) {
    const snap = await getDocs(query(collection(db, "students"), where("grade", "==", grade)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  const list = lsSeeded("ktn_students", SEED_STUDENTS);
  return list.filter((s) => s.grade === grade);
}
export async function setStudentUid(id, uid) {
  if (hasFirebase) { await setDoc(doc(db, "students", id), { uid }, { merge: true }); return; }
}

/* ============ USER ROLES (Firebase Auth uid -> role) ============ */
export async function getUserDoc(uid) {
  if (!hasFirebase) return null;
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}
export async function setUserDoc(uid, data) {
  if (!hasFirebase) return;
  await setDoc(doc(db, "users", uid), data);
}

/* ============ STAFF (teacher accounts) ============ */
export async function listStaff() {
  if (hasFirebase) {
    const snap = await getDocs(collection(db, "staff"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  return lsSeeded("ktn_staff", SEED_STAFF);
}
export async function addStaff(s) {
  const code = s.code || genCode("T");
  const rec = { ...s, code };
  if (hasFirebase) { const ref = await addDoc(collection(db, "staff"), rec); return { id: ref.id, ...rec }; }
  const list = lsSeeded("ktn_staff", SEED_STAFF);
  const withId = { id: code, ...rec }; lsSet("ktn_staff", [...list, withId]); return withId;
}
export async function removeStaff(id) {
  if (hasFirebase) { await deleteDoc(doc(db, "staff", id)); return; }
  const list = lsSeeded("ktn_staff", SEED_STAFF); lsSet("ktn_staff", list.filter((s) => s.id !== id));
}
export async function findStaffByCode(code) {
  const list = await listStaff();
  return list.find((s) => (s.code || "").toLowerCase() === code.toLowerCase()) || null;
}
export async function addStaffFromAssignments({ name, assignments, joined }) {
  const { subject, grades } = deriveAssignments(assignments);
  return addStaff({ name, subject, grades, assignments: assignments || [], joined: joined || "" });
}
export async function setStaffUid(id, uid) {
  if (hasFirebase) { await setDoc(doc(db, "staff", id), { uid }, { merge: true }); return; }
}
export async function updateStaff(id, patch) {
  if (hasFirebase) { await setDoc(doc(db, "staff", id), patch, { merge: true }); return; }
  const list = lsSeeded("ktn_staff", SEED_STAFF); lsSet("ktn_staff", list.map((s) => (s.id === id ? { ...s, ...patch } : s)));
}
export async function updateUserDoc(uid, patch) {
  if (!hasFirebase || !uid) return;
  await setDoc(doc(db, "users", uid), patch, { merge: true });
}

/* ============ MARKS ============ */
// Cloud: one document per student ("studentId__Subject__Term") so a student can
// only ever read their own marks. On-device (demo): kept as a simple class map.
const mk = (g, s, t) => `${g}|${s}|${t}`;
const mkDoc = (sid, s, t) => `${sid}__${s}__${t}`;
export async function getMarks(grade, subject, term) {
  if (hasFirebase) {
    const snap = await getDocs(query(collection(db, "marks"),
      where("grade", "==", grade), where("subject", "==", subject), where("term", "==", term)));
    const out = {}; snap.docs.forEach((d) => { const m = d.data(); out[m.studentId] = m.score; });
    return out;
  }
  const all = lsGet("ktn_marks", null) || SEED_MARKS;
  if (lsGet("ktn_marks", null) === null) lsSet("ktn_marks", SEED_MARKS);
  return all[mk(grade, subject, term)] || {};
}
export async function saveMarks(grade, subject, term, scores) {
  if (hasFirebase) {
    const batch = writeBatch(db);
    Object.keys(scores).forEach((sid) => {
      batch.set(doc(db, "marks", mkDoc(sid, subject, term)),
        { studentId: sid, grade, subject, term, score: scores[sid] }, { merge: true });
    });
    await batch.commit();
    return;
  }
  const all = lsGet("ktn_marks", null) || { ...SEED_MARKS };
  all[mk(grade, subject, term)] = scores; lsSet("ktn_marks", all);
}
export async function getStudentMarks(studentId, grade) {
  const out = [];
  if (hasFirebase) {
    const snap = await getDocs(query(collection(db, "marks"), where("studentId", "==", studentId)));
    snap.docs.forEach((d) => { const m = d.data(); out.push({ subject: m.subject, term: m.term, score: m.score }); });
    return out;
  }
  const all = lsGet("ktn_marks", null) || SEED_MARKS;
  Object.keys(all).forEach((k) => {
    const [g, subject, term] = k.split("|");
    if (g === grade && all[k][studentId] != null) out.push({ subject, term, score: all[k][studentId] });
  });
  return out;
}
// All marks for a whole grade, grouped by studentId (admin report cards).
export async function getGradeMarks(grade) {
  const map = {};
  if (hasFirebase) {
    const snap = await getDocs(query(collection(db, "marks"), where("grade", "==", grade)));
    snap.docs.forEach((d) => { const m = d.data(); (map[m.studentId] = map[m.studentId] || []).push({ subject: m.subject, term: m.term, score: m.score }); });
  } else {
    const all = lsGet("ktn_marks", null) || SEED_MARKS;
    Object.keys(all).forEach((k) => {
      const [g, subject, term] = k.split("|");
      if (g === grade) Object.keys(all[k]).forEach((sid) => { (map[sid] = map[sid] || []).push({ subject, term, score: all[k][sid] }); });
    });
  }
  return map;
}

/* ============ ATTENDANCE (per subject class) ============ */
// Cloud: one document per student ("studentId__Subject__Date"). On-device (demo):
// a simple class map per Grade|Subject|Date.
const akey = (g, subject, date) => `${g}|${subject}|${date}`;
const aDoc = (sid, subject, date) => `${sid}__${subject}__${date}`;
export async function getAttendance(grade, subject, date) {
  if (hasFirebase) {
    const snap = await getDocs(query(collection(db, "attendance"),
      where("grade", "==", grade), where("subject", "==", subject), where("date", "==", date)));
    const out = {}; snap.docs.forEach((d) => { const a = d.data(); out[a.studentId] = a.status; });
    return out;
  }
  const all = lsGet("ktn_attendance", null) || SEED_ATTENDANCE;
  if (lsGet("ktn_attendance", null) === null) lsSet("ktn_attendance", SEED_ATTENDANCE);
  return all[akey(grade, subject, date)] || {};
}
export async function saveAttendance(grade, subject, date, records) {
  if (hasFirebase) {
    const batch = writeBatch(db);
    Object.keys(records).forEach((sid) => {
      batch.set(doc(db, "attendance", aDoc(sid, subject, date)),
        { studentId: sid, grade, subject, date, status: records[sid] }, { merge: true });
    });
    await batch.commit();
    return;
  }
  const all = lsGet("ktn_attendance", null) || { ...SEED_ATTENDANCE };
  all[akey(grade, subject, date)] = records; lsSet("ktn_attendance", all);
}
export async function getStudentAttendance(studentId, grade) {
  const out = [];
  if (hasFirebase) {
    const snap = await getDocs(query(collection(db, "attendance"), where("studentId", "==", studentId)));
    snap.docs.forEach((d) => { const a = d.data(); out.push({ date: a.date, subject: a.subject, status: a.status }); });
  } else {
    const all = lsGet("ktn_attendance", null) || SEED_ATTENDANCE;
    Object.keys(all).forEach((k) => {
      const [g, subject, date] = k.split("|");
      if (g === grade && all[k][studentId]) out.push({ date, subject, status: all[k][studentId] });
    });
  }
  out.sort((a, b) => (a.date < b.date ? 1 : -1));
  return out;
}

/* ============ GALLERY (admin-added, URL based) ============ */
export async function listGalleryExtra() {
  if (hasFirebase) {
    const snap = await getDocs(collection(db, "gallery"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  return lsGet("ktn_gallery", []);
}
export async function addGalleryExtra(item) {
  if (hasFirebase) { const ref = await addDoc(collection(db, "gallery"), item); return { id: ref.id, ...item }; }
  const list = lsGet("ktn_gallery", []); const rec = { id: "g" + Date.now(), ...item }; lsSet("ktn_gallery", [...list, rec]); return rec;
}
export async function removeGalleryExtra(id) {
  if (hasFirebase) { await deleteDoc(doc(db, "gallery", id)); return; }
  const list = lsGet("ktn_gallery", []); lsSet("ktn_gallery", list.filter((g) => g.id !== id));
}

/* ---------- helpers ---------- */
function genCode(prefix, grade) {
  const gNum = grade ? (grade.match(/\d+/) || [""])[0] : "";
  const rand = Math.floor(Math.random() * 900) + 100;
  return `${prefix}-${gNum}${rand}`;
}

/* ============ TIMETABLE (admin-added class rows) ============ */
export async function listTimetableExtra(grade) {
  if (hasFirebase) {
    const snap = await getDocs(query(collection(db, "timetable"), where("grade", "==", grade)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  const all = lsGet("ktn_tt", {}); return all[grade] || [];
}
export async function addTimetableExtra(grade, row) {
  const item = { grade, ...row };
  if (hasFirebase) { const ref = await addDoc(collection(db, "timetable"), item); return { id: ref.id, ...item }; }
  const all = lsGet("ktn_tt", {}); const rec = { id: "tt" + Date.now(), ...item };
  all[grade] = [...(all[grade] || []), rec]; lsSet("ktn_tt", all); return rec;
}
export async function removeTimetableExtra(grade, id) {
  if (hasFirebase) { await deleteDoc(doc(db, "timetable", id)); return; }
  const all = lsGet("ktn_tt", {}); all[grade] = (all[grade] || []).filter((r) => r.id !== id); lsSet("ktn_tt", all);
}
// Normalised timetable for a grade: DB rows if the admin added any, else built-in.
export async function getTimetable(grade) {
  const extra = await listTimetableExtra(grade);
  if (extra.length) return extra.map((r) => ({ subject: r.subject, teacher: r.teacher, day: r.day, time: r.time, link: r.link || "" }));
  return (BASE_TT[grade] || []).map((r) => ({ subject: r[0], teacher: r[1], day: r[2], time: r[3], link: "" }));
}

/* ============ MESSAGES (public Contact form) ============ */
export async function addMessage(item) {
  if (hasFirebase) { const ref = await addDoc(collection(db, "messages"), item); return { id: ref.id, ...item }; }
  const list = lsGet("ktn_messages", []); const rec = { id: "m" + Date.now(), ...item }; lsSet("ktn_messages", [rec, ...list]); return rec;
}
export async function listMessages() {
  if (hasFirebase) {
    const snap = await getDocs(query(collection(db, "messages"), orderBy("date", "desc")));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  return lsGet("ktn_messages", []);
}
export async function clearMessages() {
  if (hasFirebase) {
    const snap = await getDocs(collection(db, "messages"));
    const batch = writeBatch(db); snap.docs.forEach((d) => batch.delete(d.ref)); await batch.commit(); return;
  }
  lsSet("ktn_messages", []);
}

/* ============ SIGN-UPS & APPROVALS ============ */
// People who signed up but aren't approved yet (users doc role == "pending").
export async function listPendingUsers() {
  if (!hasFirebase) return [];
  const snap = await getDocs(query(collection(db, "users"), where("role", "==", "pending")));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}
// Admin approves a student sign-up: create their student record + grant the role.
export async function approveStudent(uid, profile) {
  const rec = await addStudent(profile);
  await setStudentUid(rec.id, uid);
  await setUserDoc(uid, { role: "student", studentId: rec.id, name: profile.name, grade: profile.grade });
  return rec;
}
// Admin approves a teacher sign-up.
export async function approveTeacher(uid, { name, assignments }) {
  const { subject, grades } = deriveAssignments(assignments);
  const rec = await addStaff({ name, subject, grades, assignments: assignments || [] });
  await setStaffUid(rec.id, uid);
  await setUserDoc(uid, { role: "teacher", staffId: rec.id, name, subject, grades, assignments: assignments || [] });
  return rec;
}
export async function rejectSignup(uid) {
  if (hasFirebase) await setUserDoc(uid, { role: "rejected" });
}

/* ============ TEACHER DIRECTORY (public profiles, admin-editable) ============ */
export async function listDirectory() {
  if (hasFirebase) {
    const snap = await getDocs(collection(db, "directory"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  return lsGet("ktn_directory", []);
}
export async function addDirectory(item) {
  if (hasFirebase) { const ref = await addDoc(collection(db, "directory"), item); return { id: ref.id, ...item }; }
  const list = lsGet("ktn_directory", []); const rec = { id: "d" + Date.now() + Math.floor(Math.random() * 999), ...item }; lsSet("ktn_directory", [...list, rec]); return rec;
}
export async function updateDirectory(id, patch) {
  if (hasFirebase) { await setDoc(doc(db, "directory", id), patch, { merge: true }); return; }
  const list = lsGet("ktn_directory", []); lsSet("ktn_directory", list.map((d) => (d.id === id ? { ...d, ...patch } : d)));
}
export async function removeDirectory(id) {
  if (hasFirebase) { await deleteDoc(doc(db, "directory", id)); return; }
  const list = lsGet("ktn_directory", []); lsSet("ktn_directory", list.filter((d) => d.id !== id));
}
export async function importDirectory(items) {
  const out = [];
  for (const it of items) out.push(await addDirectory(it));
  return out;
}

/* ============ TIMETABLE (full rows, admin-editable) ============ */
export async function updateTimetableRow(grade, id, patch) {
  if (hasFirebase) { await setDoc(doc(db, "timetable", id), patch, { merge: true }); return; }
  const all = lsGet("ktn_tt", {}); all[grade] = (all[grade] || []).map((r) => (r.id === id ? { ...r, ...patch } : r)); lsSet("ktn_tt", all);
}

/* ============ SITE CONTENT (singleton, admin-editable) ============ */
export async function getSiteContent() {
  if (hasFirebase) {
    const snap = await getDoc(doc(db, "content", "site"));
    return snap.exists() ? snap.data() : null;
  }
  return lsGet("ktn_site", null);
}
export async function saveSiteContent(patch) {
  if (hasFirebase) { await setDoc(doc(db, "content", "site"), patch, { merge: true }); return; }
  const cur = lsGet("ktn_site", {}) || {}; lsSet("ktn_site", { ...cur, ...patch });
}

/* ============ ROLL NUMBERS & ROSTER IMPORT ============ */
// A temporary password the admin can hand out; the person changes it on first login.
export function genTempPassword() {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let s = "ktn";
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// Seed / read the auto roll-number counter (used when an application is accepted).
export async function seedRollCounter(next) {
  if (hasFirebase) { await setDoc(doc(db, "counters", "roll"), { next }, { merge: true }); return; }
  lsSet("ktn_roll_next", next);
}
export async function getNextRoll() {
  if (hasFirebase) {
    const ref = doc(db, "counters", "roll");
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const cur = snap.exists() ? snap.data().next : 1;
      tx.set(ref, { next: cur + 1 }, { merge: true });
      return String(cur);
    });
  }
  const n = lsGet("ktn_roll_next", 1); lsSet("ktn_roll_next", n + 1); return String(n);
}

// One-time import of existing students. Skips roll numbers already present, so
// re-running is safe. Seeds the roll counter to (highest roll + 1).
export async function importRoster(roster) {
  const existing = await listStudents();
  const have = new Set(existing.map((s) => String(s.rollNumber)));
  const toAdd = roster.filter((r) => !have.has(String(r.rollNumber)))
    .map((r) => ({ name: r.name, rollNumber: String(r.rollNumber), code: String(r.rollNumber),
      grade: "", status: "enrolled", frozen: false, tempPassword: genTempPassword() }));

  if (hasFirebase) {
    // Firestore batches are limited to 500 writes — chunk to be safe.
    for (let i = 0; i < toAdd.length; i += 400) {
      const batch = writeBatch(db);
      toAdd.slice(i, i + 400).forEach((rec) => batch.set(doc(collection(db, "students")), rec));
      await batch.commit();
    }
  } else {
    const list = lsSeeded("ktn_students", SEED_STUDENTS);
    lsSet("ktn_students", [...list, ...toAdd.map((r) => ({ id: r.code, ...r }))]);
  }

  const allRolls = [...roster, ...existing].map((r) => parseInt(r.rollNumber, 10) || 0);
  await seedRollCounter(Math.max(0, ...allRolls) + 1);
  return toAdd.length;
}

/* ============ ENROL / PROMOTE HELPERS ============ */
import { GRADES as GRADE_LIST, deriveAssignments } from "../data/school";

export async function deleteApp(id) {
  if (hasFirebase) { await deleteDoc(doc(db, "applications", id)); return; }
  const list = lsGet("ktn_apps", []); lsSet("ktn_apps", list.filter((a) => a.id !== id));
}

// Accept an application: assign the next roll number and create the student.
export async function acceptApplication(app) {
  const rollNumber = await getNextRoll();
  const rec = await addStudent({
    name: app.student, grade: app.grade || "", rollNumber, code: rollNumber,
    status: "enrolled", frozen: false,
    mobile: app.phone || "", email: app.email || "", location: app.location || "", comments: app.message || "",
  });
  await deleteApp(app.id);
  return { rollNumber, id: rec.id };
}

// Promote everyone up one grade for a new academic year. Grade 7 -> Graduated.
export async function promoteAll() {
  const list = await listStudents();
  const changes = list.filter((s) => GRADE_LIST.includes(s.grade)).map((s) => {
    const idx = GRADE_LIST.indexOf(s.grade);
    const last = idx >= GRADE_LIST.length - 1;
    return { id: s.id, grade: last ? "Graduated" : GRADE_LIST[idx + 1], status: last ? "graduated" : (s.status || "enrolled") };
  });
  if (hasFirebase) {
    for (let i = 0; i < changes.length; i += 400) {
      const batch = writeBatch(db);
      changes.slice(i, i + 400).forEach((c) => batch.set(doc(db, "students", c.id), { grade: c.grade, status: c.status }, { merge: true }));
      await batch.commit();
    }
  } else {
    const all = lsSeeded("ktn_students", SEED_STUDENTS);
    const m = new Map(changes.map((c) => [c.id, c]));
    lsSet("ktn_students", all.map((s) => (m.has(s.id) ? { ...s, grade: m.get(s.id).grade, status: m.get(s.id).status } : s)));
  }
  return changes.length;
}

/* ============ BULK STUDENT UPDATE (spreadsheet) ============ */
export const STUDENT_CSV_COLUMNS = [
  "rollNumber", "name", "grade", "nationality", "gender", "dob", "location",
  "emergencyContact", "postalAddress", "extra", "fatherName", "motherName",
  "mobile", "email", "comments",
];

// Update existing students (matched by roll number) and create any new ones.
// `rows` come from a parsed CSV (objects keyed by the columns above).
export async function bulkUpsertStudents(rows) {
  const existing = await listStudents();
  const byRoll = new Map(existing.map((s) => [String(s.rollNumber || s.code || ""), s]));
  const textKeys = ["name", "grade", "nationality", "gender", "dob", "location",
    "emergencyContact", "postalAddress", "fatherName", "motherName", "mobile", "email", "comments"];
  const norm = (r) => {
    const out = {};
    textKeys.forEach((k) => { if (r[k] !== undefined && String(r[k]).trim() !== "") out[k] = String(r[k]).trim(); });
    if (r.extra !== undefined && String(r.extra).trim() !== "") out.extra = String(r.extra).split(/[;,]/).map((x) => x.trim()).filter(Boolean);
    return out;
  };

  const ops = [];
  let updated = 0, created = 0, skipped = 0;
  for (const r of rows) {
    const roll = String(r.rollNumber || "").trim();
    if (!roll) { skipped++; continue; }
    const fields = norm(r);
    const ex = byRoll.get(roll);
    if (ex) { ops.push(["update", ex.id, fields]); updated++; }
    else { ops.push(["create", null, { rollNumber: roll, code: roll, status: "enrolled", frozen: false, tempPassword: genTempPassword(), ...fields }]); created++; }
  }

  if (hasFirebase) {
    for (let i = 0; i < ops.length; i += 400) {
      const batch = writeBatch(db);
      ops.slice(i, i + 400).forEach(([op, id, data]) => {
        const ref = op === "update" ? doc(db, "students", id) : doc(collection(db, "students"));
        batch.set(ref, data, { merge: true });
      });
      await batch.commit();
    }
  } else {
    let list = lsSeeded("ktn_students", SEED_STUDENTS);
    ops.forEach(([op, id, data]) => {
      if (op === "update") list = list.map((s) => (s.id === id ? { ...s, ...data } : s));
      else list = [...list, { id: data.code, ...data }];
    });
    lsSet("ktn_students", list);
  }
  return { updated, created, skipped };
}

/* ============ ASSIGNMENTS / WORKSHEETS (v2) ============ */
/* Files live in Google Drive; we store only a link + tiny status records. */
export async function addAssignment(data) {
  const rec = { ...data, createdAt: new Date().toISOString() };
  if (hasFirebase) { const ref = await addDoc(collection(db, "assignments"), rec); return { id: ref.id, ...rec }; }
  const list = lsGet("ktn_assignments", []); const r = { id: "as" + Date.now(), ...rec }; lsSet("ktn_assignments", [r, ...list]); return r;
}
export async function removeAssignment(id) {
  if (hasFirebase) { await deleteDoc(doc(db, "assignments", id)); return; }
  lsSet("ktn_assignments", lsGet("ktn_assignments", []).filter((a) => a.id !== id));
}
export async function listAssignmentsByGrade(grade) {
  if (hasFirebase) {
    const snap = await getDocs(query(collection(db, "assignments"), where("grade", "==", grade)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  return lsGet("ktn_assignments", []).filter((a) => a.grade === grade);
}
export async function listAssignmentsForTeacher(grades, subject) {
  let all = [];
  if (hasFirebase) {
    const snap = await getDocs(query(collection(db, "assignments"), where("subject", "==", subject)));
    all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } else {
    all = lsGet("ktn_assignments", []).filter((a) => a.subject === subject);
  }
  return all.filter((a) => grades.includes(a.grade)).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

const subId = (aid, sid) => `${aid}__${sid}`;
export async function setSubmission(assignmentId, studentId, grade, patch) {
  const data = { assignmentId, studentId, grade, ...patch };
  if (hasFirebase) { await setDoc(doc(db, "submissions", subId(assignmentId, studentId)), data, { merge: true }); return data; }
  const all = lsGet("ktn_submissions", {}); all[subId(assignmentId, studentId)] = { ...(all[subId(assignmentId, studentId)] || {}), ...data }; lsSet("ktn_submissions", all); return data;
}
export async function getStudentSubmissions(studentId) {
  const map = {};
  if (hasFirebase) {
    const snap = await getDocs(query(collection(db, "submissions"), where("studentId", "==", studentId)));
    snap.docs.forEach((d) => { const s = d.data(); map[s.assignmentId] = s; });
  } else {
    const all = lsGet("ktn_submissions", {}); Object.values(all).forEach((s) => { if (s.studentId === studentId) map[s.assignmentId] = s; });
  }
  return map;
}
export async function listSubmissions(assignmentId) {
  const map = {};
  if (hasFirebase) {
    const snap = await getDocs(query(collection(db, "submissions"), where("assignmentId", "==", assignmentId)));
    snap.docs.forEach((d) => { const s = d.data(); map[s.studentId] = s; });
  } else {
    const all = lsGet("ktn_submissions", {}); Object.values(all).forEach((s) => { if (s.assignmentId === assignmentId) map[s.studentId] = s; });
  }
  return map;
}

/* ============ CLASS LINKS (teacher-managed join link + cancel) ============ */
const clId = (g, s) => `${g}__${s}`;
export async function getClassLink(grade, subject) {
  if (hasFirebase) { const snap = await getDoc(doc(db, "classlinks", clId(grade, subject))); return snap.exists() ? snap.data() : null; }
  const all = lsGet("ktn_classlinks", {}); return all[clId(grade, subject)] || null;
}
export async function setClassLink(grade, subject, patch) {
  const data = { grade, subject, ...patch, updatedAt: new Date().toISOString() };
  if (hasFirebase) { await setDoc(doc(db, "classlinks", clId(grade, subject)), data, { merge: true }); return data; }
  const all = lsGet("ktn_classlinks", {}); all[clId(grade, subject)] = { ...(all[clId(grade, subject)] || {}), ...data }; lsSet("ktn_classlinks", all); return data;
}
export async function listClassLinksByGrade(grade) {
  const map = {};
  if (hasFirebase) {
    const snap = await getDocs(query(collection(db, "classlinks"), where("grade", "==", grade)));
    snap.docs.forEach((d) => { const c = d.data(); map[c.subject] = c; });
  } else {
    const all = lsGet("ktn_classlinks", {}); Object.values(all).forEach((c) => { if (c.grade === grade) map[c.subject] = c; });
  }
  return map;
}

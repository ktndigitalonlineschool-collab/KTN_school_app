// Authentication, works two ways:
//
//  • Firebase ON  → real email + password logins (Firebase Authentication).
//    Each account's role is stored in a "users/{uid}" document. Firestore
//    security rules use that role to decide what the person can read/write.
//
//  • Firebase OFF → simple demo codes kept in this browser (for local testing).

import { hasFirebase, auth, config } from "./firebase";
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
  sendPasswordResetEmail, createUserWithEmailAndPassword,
} from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { ADMIN_PASSCODE, deriveAssignments } from "../data/school";
import {
  findStaffByCode, findStudentByCode, getUserDoc, setUserDoc, setStudentUid, setStaffUid,
} from "./store";

/* =========================================================
   Build a session object from a "users/{uid}" role document
   ========================================================= */
function sessionFromRole(user, roleData) {
  return {
    uid: user.uid,
    email: user.email,
    role: roleData.role,
    name: roleData.name || user.email,
    id: roleData.studentId || roleData.staffId || null,
    grade: roleData.grade,
    rollNumber: roleData.rollNumber || "",
    subject: roleData.subject,
    grades: roleData.grades || [],
    joined: roleData.joined || "",
  };
}

/* =========================================================
   Subscribe to who is signed in. Calls cb(session | null).
   Returns an unsubscribe function.
   ========================================================= */
export function subscribeAuth(cb) {
  if (!hasFirebase) {
    cb(getDemoSession());
    return () => {};
  }
  return onAuthStateChanged(auth, async (user) => {
    if (!user) { cb(null); return; }
    try {
      const roleData = await getUserDoc(user.uid);
      if (!roleData) { cb({ role: "none", email: user.email, uid: user.uid }); return; }
      cb(sessionFromRole(user, roleData));
    } catch {
      cb({ role: "none", email: user.email, uid: user.uid });
    }
  });
}

/* =========================================================
   Sign in / out
   ========================================================= */
export async function signInEmail(email, password) {
  await signInWithEmailAndPassword(auth, email.trim(), password);
}
// Self sign-up: create the account, store a "pending" profile for admin review,
// then sign out so the person waits for approval before entering the portal.
export async function signUp(email, password, pendingData) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await setUserDoc(cred.user.uid, { role: "pending", ...pendingData });
  await signOut(auth);
}
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email.trim());
}
export async function signOutUser() {
  if (hasFirebase) { await signOut(auth); return; }
  clearDemoSession();
}

/* =========================================================
   Admin creates a login for a teacher or student.
   Uses a temporary secondary app so the admin stays signed in.
   Returns the new account's uid.
   ========================================================= */
export async function createLogin(email, password) {
  const secondary = initializeApp(config, "acct-" + Date.now());
  const secAuth = getAuth(secondary);
  try {
    const cred = await createUserWithEmailAndPassword(secAuth, email.trim(), password);
    await signOut(secAuth);
    return cred.user.uid;
  } finally {
    await deleteApp(secondary);
  }
}

// Create a student's login and link it to their record.
export async function createStudentAccount({ email, password, studentId, name, grade, rollNumber }) {
  const uid = await createLogin(email, password);
  await setUserDoc(uid, { role: "student", studentId, name, grade, rollNumber: rollNumber || "" });
  await setStudentUid(studentId, uid);
  return uid;
}

// Create a teacher's login and link it to their record.
export async function createTeacherAccount({ email, password, staffId, name, assignments, joined }) {
  const uid = await createLogin(email, password);
  const { subject, grades } = deriveAssignments(assignments);
  await setUserDoc(uid, { role: "teacher", staffId, name, subject, grades, assignments: assignments || [], joined: joined || "" });
  await setStaffUid(staffId, uid);
  return uid;
}

/* =========================================================
   DEMO MODE (no Firebase): code-based login in this browser
   ========================================================= */
const KEY = "ktn_session";
export function getDemoSession() {
  try { const v = localStorage.getItem(KEY); return v ? JSON.parse(v) : null; }
  catch { return null; }
}
function setDemoSession(u) { try { localStorage.setItem(KEY, JSON.stringify(u)); } catch { /* ignore */ } }
function clearDemoSession() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } }

export async function demoLoginAdmin(passcode) {
  if (passcode !== ADMIN_PASSCODE) throw new Error("Wrong admin passcode.");
  const u = { role: "admin", name: "Administrator" }; setDemoSession(u); return u;
}
export async function demoLoginTeacher(code) {
  const s = await findStaffByCode((code || "").trim());
  if (!s) throw new Error("No teacher found with that code.");
  const u = { role: "teacher", id: s.id, name: s.name, code: s.code, grades: s.grades || [], subject: s.subject || "" };
  setDemoSession(u); return u;
}
export async function demoLoginStudent(code) {
  const s = await findStudentByCode((code || "").trim());
  if (!s) throw new Error("No student found with that code.");
  const u = { role: "student", id: s.id, name: s.name, code: s.code, grade: s.grade, parent: s.parent || "" };
  setDemoSession(u); return u;
}
export { clearDemoSession as clearSession };

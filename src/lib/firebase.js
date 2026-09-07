// Firebase setup.
//
// If you paste your Firebase keys into a ".env" file, the app connects to
// Firestore (cloud database) and Firebase Authentication (real logins). If you
// leave the keys blank, `hasFirebase` is false and the app quietly uses
// on-device storage with simple demo codes — so it always runs.

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const hasFirebase = Boolean(config.apiKey && config.projectId);

export const app = hasFirebase ? initializeApp(config) : null;
export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;

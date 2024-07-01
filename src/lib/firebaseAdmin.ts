// @/lib/firebaseAdmin.js
import { initializeApp, cert, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

interface FirebaseAdminConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

const firebaseConfig: FirebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || "",
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
};

function getFirebaseApp(config: FirebaseAdminConfig) {
  try {
    return getApp();
  } catch {
    return initializeApp({
      credential: cert(config),
    });
  }
}

export const adminApp = getFirebaseApp(firebaseConfig);
export const adminFirestore = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);

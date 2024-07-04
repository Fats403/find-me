"use client";

import { FirebaseOptions, getApp, initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  doc,
  setDoc,
  collection,
} from "firebase/firestore";
import { Position } from "./types";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp(config: FirebaseOptions) {
  try {
    return getApp();
  } catch {
    return initializeApp(config);
  }
}

const app = getFirebaseApp(firebaseConfig);

export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

export const googleAuthProvider = new GoogleAuthProvider();
export const firestore = initializeFirestore(app, {
  localCache: persistentLocalCache(),
});

export function setPinLocation(
  sessionKey: string | null,
  pin: Position
): Promise<void> {
  const docRef = doc(firestore, `sessions/${sessionKey}`);
  return setDoc(docRef, { pin }, { merge: true });
}

export function sendLocationUpdate(
  sessionKey: string | null,
  position: Position
): Promise<void> {
  const locationCollectionRef = collection(
    firestore,
    `sessions/${sessionKey}/locations`
  );
  const docRef = doc(locationCollectionRef);
  return setDoc(docRef, {
    id: docRef.id,
    ...position,
  });
}

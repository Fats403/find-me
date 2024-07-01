import { NextResponse } from "next/server";
import { adminFirestore, adminAuth } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json(
      { error: "Authorization header missing" },
      { status: 401 }
    );
  }

  const idToken = authHeader.split("Bearer ")[1];

  if (!idToken) {
    return NextResponse.json(
      { error: "Bearer token missing" },
      { status: 401 }
    );
  }

  let userId;
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    userId = decodedToken.uid;
  } catch (error) {
    return NextResponse.json({ error: "Invalid ID token" }, { status: 401 });
  }

  const userRef = adminFirestore.collection("users").doc(userId);
  const userDoc = await userRef.get();

  if (userDoc.exists && userDoc.data()?.activeSessionId) {
    return NextResponse.json(
      { error: "You already have an active session" },
      { status: 400 }
    );
  }

  let newSessionKey;
  let sessionExists = true;

  do {
    newSessionKey = Math.floor(100000 + Math.random() * 900000).toString();
    const sessionRef = adminFirestore.collection("sessions").doc(newSessionKey);
    const sessionDoc = await sessionRef.get();
    sessionExists = sessionDoc.exists;
  } while (sessionExists);

  const sessionRef = adminFirestore.collection("sessions").doc(newSessionKey);

  await sessionRef.set({ creatorId: userId, viewerCount: 0 });
  await userRef.set({ activeSessionId: newSessionKey }, { merge: true });

  return NextResponse.json({ sessionKey: newSessionKey });
}

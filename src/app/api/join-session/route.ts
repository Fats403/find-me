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

  const { sessionKey } = await request.json();

  if (!sessionKey) {
    return NextResponse.json({ error: "Session key missing" }, { status: 400 });
  }

  const sessionRef = adminFirestore.collection("sessions").doc(sessionKey);
  const sessionDoc = await sessionRef.get();

  if (!sessionDoc.exists) {
    return NextResponse.json(
      { error: "Session does not exist" },
      { status: 404 }
    );
  }

  return NextResponse.json({ message: "Joined session successfully" });
}

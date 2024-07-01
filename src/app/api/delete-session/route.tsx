import { NextResponse } from "next/server";
import { adminFirestore, adminAuth } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function DELETE(request: Request) {
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

  if (!userDoc.exists) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const userData = userDoc.data();
  const sessionKey = userData?.activeSessionId;

  if (!sessionKey) {
    return NextResponse.json({ error: "No active session" }, { status: 400 });
  }

  const sessionRef = adminFirestore.collection("sessions").doc(sessionKey);
  const sessionDoc = await sessionRef.get();

  if (!sessionDoc.exists) {
    return NextResponse.json(
      { error: "Session does not exist" },
      { status: 404 }
    );
  }

  const sessionData = sessionDoc.data();

  if (sessionData?.creatorId !== userId) {
    return NextResponse.json(
      { error: "You are not the creator of this session" },
      { status: 403 }
    );
  }

  // Delete all documents in the locations subcollection
  const locationsRef = sessionRef.collection("locations");
  const locationsSnapshot = await locationsRef.get();
  const deletePromises = locationsSnapshot.docs.map((doc) => doc.ref.delete());
  await Promise.all(deletePromises);

  // Delete the session document
  await sessionRef.delete();

  // Clear the active session ID from the user document
  await userRef.update({ activeSessionId: FieldValue.delete() });

  // Get updated user data
  const updatedUserDoc = await userRef.get();
  const updatedUserData = updatedUserDoc.data();

  return NextResponse.json({
    message: "Session and locations deleted successfully",
    user: updatedUserData,
  });
}

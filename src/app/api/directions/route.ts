import { NextResponse } from "next/server";
import axios from "axios";
import { adminAuth } from "@/lib/firebaseAdmin";
import { GetDirectionsResponseData } from "@/lib/types";

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

  const { start, end } = await request.json();

  if (!start || !end) {
    return NextResponse.json(
      { error: "Start and end points are required" },
      { status: 400 }
    );
  }

  try {
    const response = await axios.get(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${start};${end}`,
      {
        params: {
          access_token: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
          geometries: "geojson",
          steps: true,
          overview: "full",
        },
      }
    );

    const { routes } = response.data;
    if (routes.length === 0) {
      return NextResponse.json({ error: "No route found" }, { status: 404 });
    }

    const route = routes[0];
    const tripPath = route.geometry.coordinates;
    const instructions = route.legs[0].steps.map((step: any) => ({
      maneuver: step.maneuver.instruction,
      location: step.maneuver.location,
    }));

    const data: GetDirectionsResponseData = { tripPath, instructions };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching directions:", error);
    return NextResponse.json(
      { error: "Failed to fetch directions" },
      { status: 500 }
    );
  }
}

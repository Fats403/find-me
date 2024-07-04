import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Location } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const calculateDistance = (pos1: Location, pos2: Location) => {
  const R = 6371e3; // Earth's radius in meters
  const DEG_TO_RAD = Math.PI / 180;
  const lat1 = pos1.lat * DEG_TO_RAD;
  const lat2 = pos2.lat * DEG_TO_RAD;
  const deltaLat = (pos2.lat - pos1.lat) * DEG_TO_RAD;
  const deltaLng = (pos2.lng - pos1.lng) * DEG_TO_RAD;

  // Simplified equirectangular approximation
  const cosLatAvg = Math.cos((lat1 + lat2) * 0.5);
  const x = deltaLng * cosLatAvg;
  const y = deltaLat;
  const distance = Math.sqrt(x * x + y * y) * R;

  return distance; // Distance in meters
};

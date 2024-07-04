import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Location } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const calculateDistance = (pos1: Location, pos2: Location) => {
  const R = 6371e3; // Earth's radius in meters
  const lat1 = pos1.lat * (Math.PI / 180);
  const lat2 = pos2.lat * (Math.PI / 180);
  const deltaLat = (pos2.lat - pos1.lat) * (Math.PI / 180);
  const deltaLng = (pos2.lng - pos1.lng) * (Math.PI / 180);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

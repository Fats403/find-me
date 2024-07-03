import { Timestamp } from "firebase/firestore";

export interface Location {
  lat: number;
  lng: number;
}

export interface Position extends Location {
  timestamp: Timestamp;
  id: string;
}

import { Timestamp } from "firebase/firestore";

export interface Position {
  lat: number;
  lng: number;
  timestamp: Timestamp;
  id: string;
}

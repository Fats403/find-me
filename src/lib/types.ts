import { Timestamp } from "firebase/firestore";

export interface Location {
  lat: number;
  lng: number;
}

export interface Position extends Location {
  timestamp: Timestamp;
  id: string;
}

export interface SessionData {
  creatorId: string;
  viewerCount: number;
  pin?: Location;
}

export interface CreateSessionResponseData {
  sessionKey: string;
}

export interface DeleteSessionResponseData {
  user: UserData;
  message: string;
}

export interface UserData {
  activeSessionId?: string;
  id: string;
}

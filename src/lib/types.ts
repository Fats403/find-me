export type BoundType = "fitToBounds" | "centerOnUser" | "nothing";

export interface Location {
  lat: number;
  lng: number;
}

export interface Position extends Location {
  timestamp: number;
  heading?: number | null;
  speed?: number | null;
  id?: string;
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

export interface GetDirectionsResponseData {
  tripPath: [number, number][];
  instructions: {
    maneuver: string;
    location: [number, number];
  }[];
}

export interface UserData {
  activeSessionId?: string;
  id: string;
}

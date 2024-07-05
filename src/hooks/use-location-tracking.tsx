"use client";

import { useState, useEffect, useContext, useRef } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { firestore, sendLocationUpdate } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { AuthContext } from "@/components/firebase-provider";
import { Position, SessionData } from "@/lib/types";
import { useSession } from "@/components/session-provider";
import { calculateDistance } from "@/lib/utils";

const geoOptions = { enableHighAccuracy: true };

const useLocationTracking = (
  sessionKey: string | null,
  sessionData: SessionData | null
) => {
  const [currentPosition, setCurrentPosition] = useState<Position | null>(
    () => {
      if (typeof window !== "undefined") {
        const savedPosition = localStorage.getItem("currentPosition");
        return savedPosition ? JSON.parse(savedPosition) : null;
      }
      return null;
    }
  );
  const [locations, setLocations] = useState<Position[]>([]);
  const { toast } = useToast();
  const authContext = useContext(AuthContext);
  const { tracking, setTracking, updateDistance } = useSession();

  const watchIdRef = useRef<number | null>(null);
  const lastSentPositionRef = useRef<Position | null>(null);

  const handlePositionError = (error: GeolocationPositionError) => {
    console.error("Error getting location:", error);

    let description = error.message;

    if (error.code === error.PERMISSION_DENIED) {
      description = "Permission denied. Please enable location access.";
    } else if (error.code === error.POSITION_UNAVAILABLE) {
      description = "Position unavailable. Please try again.";
    } else if (error.code === error.TIMEOUT) {
      description = "Location request timed out. Please try again.";
    }

    setTracking(false);

    toast({
      title: "Location error",
      description,
      variant: "destructive",
    });
  };

  const sendLocationIfFarEnough = (position: Position) => {
    const lastSentPosition = lastSentPositionRef.current;

    if (
      !lastSentPosition ||
      calculateDistance(lastSentPosition, position) > Number(updateDistance)
    ) {
      sendLocationUpdate(sessionKey, position);
      lastSentPositionRef.current = position;
    }
  };

  useEffect(() => {
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, heading, speed } = position.coords;
        if (!latitude || !longitude) return;

        const newPosition = {
          lat: latitude,
          lng: longitude,
          timestamp: position.timestamp,
          heading,
          speed,
        };

        setCurrentPosition(newPosition);
        localStorage.setItem("currentPosition", JSON.stringify(newPosition));

        if (tracking && sessionData?.creatorId === authContext?.user?.uid) {
          sendLocationIfFarEnough(newPosition);
        }
      },
      handlePositionError,
      geoOptions
    );

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [tracking, sessionData?.creatorId, sessionKey, authContext?.user]);

  useEffect(() => {
    if (!sessionKey) return;

    const unsubscribe = onSnapshot(
      collection(firestore, "sessions", sessionKey, "locations"),
      (snapshot) => {
        const newLocations: Position[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data() as Position;
          newLocations.push({ ...data });
        });

        newLocations.sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        setLocations(newLocations);
      }
    );

    return () => unsubscribe();
  }, [sessionKey]);

  return {
    currentPosition,
    locations,
  };
};

export default useLocationTracking;

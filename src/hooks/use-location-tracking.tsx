"use client";

import { useState, useEffect, useContext } from "react";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
import { firestore, sendLocationUpdate } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { AuthContext } from "@/components/firebase-provider";
import { Location, Position, SessionData } from "@/lib/types";
import { useSettings } from "@/components/settings-provider";

const geoOptions = { enableHighAccuracy: true };

const useLocationTracking = (
  sessionKey: string | null,
  sessionData: SessionData | null
) => {
  const [currentPosition, setCurrentPosition] = useState<Location | null>(
    () => {
      if (typeof window !== "undefined") {
        const savedPosition = localStorage.getItem("currentPosition");
        return savedPosition ? JSON.parse(savedPosition) : null;
      }
    }
  );
  const [locations, setLocations] = useState<Position[]>([]);
  const { toast } = useToast();
  const authContext = useContext(AuthContext);
  const { updateInterval, tracking, setTracking } = useSettings();

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

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (
      tracking &&
      sessionData &&
      sessionData.creatorId === authContext?.user?.uid
    ) {
      const fetchLocation = () => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            sendLocationUpdate(sessionKey, position);
          },
          handlePositionError,
          geoOptions
        );
      };

      intervalId = setInterval(fetchLocation, updateInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [
    tracking,
    sessionData,
    sessionKey,
    updateInterval,
    toast,
    authContext?.user,
    setTracking,
  ]);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newPosition = {
          lat: latitude,
          lng: longitude,
        };
        setCurrentPosition(newPosition);
        localStorage.setItem("currentPosition", JSON.stringify(newPosition));
      },
      handlePositionError,
      geoOptions
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  useEffect(() => {
    if (!sessionKey) return;

    const unsubscribe = onSnapshot(
      collection(firestore, "sessions", sessionKey, "locations"),
      (snapshot) => {
        const newLocations: Position[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data() as Position;
          const { id, lat, lng, timestamp } = data;

          if (timestamp instanceof Timestamp) {
            newLocations.push({ id, lat, lng, timestamp });
          }
        });

        newLocations.sort(
          (a, b) =>
            a.timestamp.toDate().getTime() - b.timestamp.toDate().getTime()
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

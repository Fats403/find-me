"use client";

import { useState, useEffect, useContext } from "react";
import {
  collection,
  setDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { AuthContext } from "@/components/firebase-provider";
import { Position, SessionData } from "@/lib/types";
import { useSettings } from "@/components/settings-provider";

const useLocationTracking = (
  sessionKey: string | undefined,
  sessionData: SessionData | null
) => {
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [locations, setLocations] = useState<Position[]>([]);
  const { toast } = useToast();
  const authContext = useContext(AuthContext);
  const { updateInterval, tracking, setTracking } = useSettings();

  useEffect(() => {
    const sendLocationUpdate = async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      const locationCollectionRef = collection(
        firestore,
        `sessions/${sessionKey}/locations`
      );
      const docRef = doc(locationCollectionRef);
      await setDoc(docRef, {
        id: docRef.id,
        lat: latitude,
        lng: longitude,
        timestamp: serverTimestamp(),
      });
      setCurrentPosition({
        id: docRef.id,
        lat: latitude,
        lng: longitude,
        timestamp: Timestamp.now(),
      });
      console.log("sent location update");
    };

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
      toast({
        title: "Location error",
        description,
        variant: "destructive",
      });
      setTracking(false);
      if (typeof window !== "undefined") {
        localStorage.setItem("tracking", JSON.stringify(false));
      }
    };

    const geoOptions = { enableHighAccuracy: true };
    let intervalId: NodeJS.Timeout;

    if (
      tracking &&
      sessionData &&
      sessionData.creatorId === authContext?.user?.uid
    ) {
      const fetchLocation = () => {
        navigator.geolocation.getCurrentPosition(
          sendLocationUpdate,
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

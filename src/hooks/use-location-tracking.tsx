"use client";

import { useState, useEffect, useContext } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { AuthContext } from "@/components/firebase-provider";

interface Position {
  lat: number;
  lng: number;
  timestamp?: string;
}

const useLocationTracking = (
  sessionKey: string | undefined,
  sessionData: any,
  updateInterval: number
) => {
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [locations, setLocations] = useState<{ [id: string]: Position }>({});
  const [tracking, setTracking] = useState<boolean>(false);
  const { toast } = useToast();
  const authContext = useContext(AuthContext);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTrackingState = localStorage.getItem("tracking");
      if (savedTrackingState) {
        setTracking(JSON.parse(savedTrackingState));
      }
    }
  }, []);

  useEffect(() => {
    const sendLocationUpdate = async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      const locationCollectionRef = collection(
        firestore,
        `sessions/${sessionKey}/locations`
      );
      await addDoc(locationCollectionRef, {
        lat: latitude,
        lng: longitude,
        timestamp: serverTimestamp(),
      });
      setCurrentPosition({ lat: latitude, lng: longitude });
      console.log("sent location update");
    };

    const handlePositionError = (error: GeolocationPositionError) => {
      console.error("Error getting location:", error);
      toast({
        title: "Location error",
        description: error.message,
        variant: "destructive",
      });
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

      console.log("setup interval");
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
  ]);

  useEffect(() => {
    if (!sessionKey) return;

    const unsubscribe = onSnapshot(
      collection(firestore, "sessions", sessionKey, "locations"),
      (snapshot) => {
        setLocations((prevLocations) => {
          const newLocations = { ...prevLocations };
          snapshot.docChanges().forEach((change) => {
            const { lat, lng, timestamp } = change.doc.data();
            if (change.type === "added" || change.type === "modified") {
              newLocations[change.doc.id] = { lat, lng, timestamp };
            } else if (change.type === "removed") {
              delete newLocations[change.doc.id];
            }
          });
          return newLocations;
        });
      }
    );

    return () => unsubscribe();
  }, [sessionKey]);

  const toggleTracking = () => {
    setTracking((prev) => {
      const newState = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("tracking", JSON.stringify(newState));
      }
      return newState;
    });
  };

  return { currentPosition, locations, tracking, toggleTracking };
};

export default useLocationTracking;

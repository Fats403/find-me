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
import { Position } from "@/lib/types";

const useLocationTracking = (
  sessionKey: string | undefined,
  sessionData: any,
  updateInterval: number
) => {
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [locations, setLocations] = useState<Position[]>([]);
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

  const requestLocationPermission = () => {
    navigator.geolocation.getCurrentPosition(
      () => {},
      (error) => {
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
      }
    );
  };

  const toggleTracking = () => {
    setTracking((prev) => {
      const newState = !prev;
      if (newState) {
        navigator.permissions
          .query({ name: "geolocation" })
          .then((result) => {
            if (result.state !== "granted") {
              toast({
                title: "Permission required",
                description: "Please enable location access to start tracking.",
                variant: "destructive",
              });
              requestLocationPermission();
            }
          })
          .catch((error) => {
            console.error("Permission query failed:", error);
            setTracking(false);
            if (typeof window !== "undefined") {
              localStorage.setItem("tracking", JSON.stringify(false));
            }
          });
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("tracking", JSON.stringify(newState));
      }
      return newState;
    });
  };

  return {
    currentPosition,
    locations,
    tracking,
    toggleTracking,
  };
};

export default useLocationTracking;

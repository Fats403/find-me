"use client";

import { BoundType, SessionData } from "@/lib/types";
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useMemo,
} from "react";
import { AuthContext } from "./firebase-provider";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "./ui/use-toast";
import { doc, onSnapshot } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

interface SessionContextProps {
  boundType: BoundType;
  tracking: boolean;
  updateDistance: string;
  sessionData: SessionData | null;
  sessionKey: string;
  isLoadingSession: boolean;
  isSessionOwner: boolean;
  locationSettingsOpen: boolean;
  deleteSessionOpen: boolean;
  directionsOpen: boolean;
  placingPin: boolean;
  setLocationSettingsOpen: (open: boolean) => void;
  setDeleteSessionOpen: (open: boolean) => void;
  setDirectionsOpen: (open: boolean) => void;
  setPlacingPin: (open: boolean) => void;
  setTracking: React.Dispatch<React.SetStateAction<boolean>>;
  setBoundType: (boundType: BoundType) => void;
  setUpdateDistance: (distance: string) => void;
}

const SessionContext = createContext<SessionContextProps | undefined>(
  undefined
);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const getInitialState = <T,>(key: string, defaultValue: T): T => {
    if (typeof window !== "undefined") {
      const savedValue = localStorage.getItem(key);
      if (savedValue !== null) {
        return JSON.parse(savedValue);
      }
    }
    return defaultValue;
  };

  const [updateDistance, setUpdateDistance] = useState<string>(
    getInitialState("updateDistance", "250")
  );
  const [boundType, setBoundType] = useState<BoundType>(
    getInitialState("boundType", "nothing")
  );
  const [tracking, setTracking] = useState<boolean>(
    getInitialState("tracking", false)
  );

  const [locationSettingsOpen, setLocationSettingsOpen] = useState(false);
  const [deleteSessionOpen, setDeleteSessionOpen] = useState(false);
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [placingPin, setPlacingPin] = useState(false);

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(false);
  const authContext = useContext(AuthContext);

  const isSessionOwner = authContext?.user?.uid === sessionData?.creatorId;

  const router = useRouter();
  const { key } = useParams();
  const { toast } = useToast();

  const sessionKey = useMemo(
    () => (typeof key === "string" || key === undefined ? key : key?.[0]),
    [key]
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("tracking", JSON.stringify(tracking));
    }
  }, [tracking]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("boundType", JSON.stringify(boundType));
    }
  }, [boundType]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("updateDistance", JSON.stringify(updateDistance));
    }
  }, [updateDistance]);

  useEffect(() => {
    if (!sessionKey || !authContext?.user) return;

    setIsLoadingSession(true);

    const sessionDoc = doc(firestore, "sessions", sessionKey);
    const unsubscribe = onSnapshot(
      sessionDoc,
      (sessionSnap: any) => {
        if (sessionSnap.exists()) {
          setSessionData(sessionSnap.data() as SessionData);
        } else {
          toast({
            title: "Session doesn't exist.",
            variant: "destructive",
          });
          router.push("/");
        }
        setIsLoadingSession(false);
      },
      (error) => {
        console.error(error);
        toast({
          title: "Error fetching session",
          variant: "destructive",
        });
        setIsLoadingSession(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [router, toast, authContext?.user, sessionKey]);

  return (
    <SessionContext.Provider
      value={{
        locationSettingsOpen,
        directionsOpen,
        deleteSessionOpen,
        placingPin,
        updateDistance,
        boundType,
        tracking,
        sessionData,
        sessionKey,
        isLoadingSession,
        isSessionOwner,
        setLocationSettingsOpen,
        setDirectionsOpen,
        setDeleteSessionOpen,
        setPlacingPin,
        setUpdateDistance,
        setBoundType,
        setTracking,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};

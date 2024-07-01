"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, firestore } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { AuthContext, UserData } from "@/components/firebase-provider";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

interface SessionData {
  creatorId: string;
  viewerCount: number;
  private: boolean;
}

interface CreateSessionResponseData {
  sessionKey: string;
}

interface DeleteSessionResponseData {
  user: UserData;
  message: string;
}

interface JoinSessionResponseData {
  message: string;
}

interface Position {
  lat: number;
  lng: number;
}

interface SessionContextType {
  sessionData: SessionData | null;
  currentPosition: Position | null;
  sessionKey: string;
  loading: boolean;
  updateInterval: number;
  setUpdateInterval: React.Dispatch<React.SetStateAction<number>>;
  deleteSession: () => void;
  createSession: () => void;
  joinSession: (sessionKey: string) => void;
  isDeletingSession: boolean;
  isCreatingSession: boolean;
  isJoiningSession: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [updateInterval, setUpdateInterval] = useState(60000);
  const router = useRouter();
  const { key } = useParams();
  const { toast } = useToast();
  const authContext = useContext(AuthContext);
  const sessionKey =
    typeof key === "string" || key === undefined ? key : key?.[0];

  useEffect(() => {
    const fetchSessionData = async () => {
      if (!sessionKey || !authContext?.user) return;

      setLoading(true);

      try {
        const sessionDoc = doc(firestore, "sessions", sessionKey);
        const sessionSnap = await getDoc(sessionDoc);

        if (sessionSnap.exists()) {
          setSessionData(sessionSnap.data() as SessionData);
        } else {
          toast({
            title: "Session doesn't exist.",
            variant: "destructive",
          });
          router.push("/");
        }
      } catch (error: unknown) {
        toast({
          title: "Error fetching session",
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred.",
          variant: "destructive",
        });
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [router, toast, authContext?.user]);

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

    if (sessionData) {
      if (sessionData.creatorId === authContext?.user?.uid) {
        const fetchLocation = () => {
          navigator.geolocation.getCurrentPosition(
            sendLocationUpdate,
            handlePositionError,
            geoOptions
          );
        };

        intervalId = setInterval(fetchLocation, updateInterval);
      }
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [sessionData, key, updateInterval, toast, authContext?.user]);

  const deleteSessionMutation = useMutation<DeleteSessionResponseData, Error>({
    mutationFn: async () => {
      const idToken = await authContext?.user?.getIdToken(true);
      return axios.delete("/api/delete-session", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
    },
    onSuccess: (data: DeleteSessionResponseData) => {
      setSessionData(null);
      authContext?.setUserData(data.user);
      router.push("/");
      toast({ title: "Session deleted!" });
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.error || "An unexpected error occurred.";
      toast({
        title: "Something went wrong",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const createSessionMutation = useMutation<CreateSessionResponseData, Error>({
    mutationFn: async () => {
      const idToken = await auth.currentUser?.getIdToken(true);
      const response = await axios.post<CreateSessionResponseData>(
        "/api/start-session",
        null,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      if (data.sessionKey) {
        router.push(`/session/${data.sessionKey}`);
      }
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.error || "An unexpected error occurred.";
      toast({
        title: "Something went wrong",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const joinSessionMutation = useMutation<
    JoinSessionResponseData,
    Error,
    string
  >({
    mutationFn: async (sessionKey: string) => {
      const idToken = await authContext?.user?.getIdToken(true);
      const response = await axios.post<JoinSessionResponseData>(
        "/api/join-session",
        { sessionKey },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast({ title: data.message });
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.error || "An unexpected error occurred.";
      toast({
        title: "Something went wrong",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const deleteSession = () => {
    deleteSessionMutation.mutate();
  };

  const createSession = () => {
    createSessionMutation.mutate();
  };

  const joinSession = (sessionKey: string) => {
    joinSessionMutation.mutate(sessionKey);
  };

  return (
    <SessionContext.Provider
      value={{
        currentPosition,
        sessionData,
        sessionKey,
        loading,
        updateInterval,
        setUpdateInterval,
        deleteSession,
        createSession,
        joinSession,
        isDeletingSession: deleteSessionMutation.isPending,
        isCreatingSession: createSessionMutation.isPending,
        isJoiningSession: joinSessionMutation.isPending,
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

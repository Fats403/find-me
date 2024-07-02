"use client";

import React, { createContext, useContext, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { AuthContext, UserData } from "@/components/firebase-provider";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import useFetchSessionData from "@/hooks/use-fetch-session";
import useLocationTracking from "@/hooks/use-location-tracking";

interface Position {
  lat: number;
  lng: number;
  timestamp?: string;
}

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

interface SessionContextType {
  sessionData: SessionData | null;
  currentPosition: Position | null;
  locations: { [id: string]: Position };
  sessionKey: string;
  loading: boolean;
  updateInterval: number;
  setUpdateInterval: React.Dispatch<React.SetStateAction<number>>;
  deleteSession: () => void;
  createSession: () => void;
  isDeletingSession: boolean;
  isCreatingSession: boolean;
  tracking: boolean;
  toggleTracking: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [updateInterval, setUpdateInterval] = useState(60000);
  const router = useRouter();
  const { key } = useParams();
  const { toast } = useToast();
  const authContext = useContext(AuthContext);
  const sessionKey =
    typeof key === "string" || key === undefined ? key : key?.[0];

  const { sessionData, loading } = useFetchSessionData(sessionKey);
  const { currentPosition, locations, tracking, toggleTracking } =
    useLocationTracking(sessionKey, sessionData, updateInterval);

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

  const deleteSession = () => {
    deleteSessionMutation.mutate();
  };

  const createSession = () => {
    createSessionMutation.mutate();
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
        tracking,
        toggleTracking,
        locations,
        isDeletingSession: deleteSessionMutation.isPending,
        isCreatingSession: createSessionMutation.isPending,
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

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { AuthContext } from "@/components/firebase-provider";
import { useContext } from "react";

interface SessionData {
  creatorId: string;
  viewerCount: number;
  private: boolean;
}

const useFetchSessionData = (sessionKey: string | undefined) => {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const { toast } = useToast();
  const authContext = useContext(AuthContext);

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
  }, [router, toast, authContext?.user, sessionKey]);

  return { sessionData, loading };
};

export default useFetchSessionData;

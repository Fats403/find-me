"use client";

import { useEffect, useState, useContext } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { AuthContext } from "@/components/firebase-provider";
import { SessionData } from "@/lib/types";

const useFetchSessionData = (sessionKey: string | null) => {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const authContext = useContext(AuthContext);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!sessionKey || !authContext?.user) return;

    setLoading(true);

    const sessionDoc = doc(firestore, "sessions", sessionKey);
    const unsubscribe = onSnapshot(
      sessionDoc,
      (sessionSnap) => {
        if (sessionSnap.exists()) {
          setSessionData(sessionSnap.data() as SessionData);
        } else {
          toast({
            title: "Session doesn't exist.",
            variant: "destructive",
          });
          router.push("/");
        }
        setLoading(false);
      },
      (error) => {
        console.error(error);
        toast({
          title: "Error fetching session",
          variant: "destructive",
        });
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [router, toast, authContext?.user, sessionKey]);

  return { sessionData, loading };
};

export default useFetchSessionData;

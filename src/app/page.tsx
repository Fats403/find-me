"use client";

import { Button } from "@/components/ui/button";
import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/ui/spinner";
import { AuthContext } from "@/components/firebase-provider";
import GoogleButton from "@/components/ui/google-button";
import { auth } from "@/lib/firebase";
import { useMutation } from "@tanstack/react-query";
import { CreateSessionResponseData } from "@/lib/types";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";

export default function Component() {
  const authContext = useContext(AuthContext);
  const router = useRouter();
  const { toast } = useToast();

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

  useEffect(() => {
    if (!authContext?.loading) {
      if (authContext?.userData?.activeSessionId) {
        router.push(`/session/${authContext.userData.activeSessionId}`);
      }
    }
  }, [router, authContext]);

  if (authContext?.loading || authContext?.userData?.activeSessionId) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Spinner className="text-black dark:text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-center">
      <Image
        className="w-full h-full inset-0 z-0 absolute object-cover"
        fill
        alt="find me bg"
        src="/bg-image.webp"
      />
      <section className="relative z-10 flex h-[80dvh] w-full flex-col items-center justify-center space-y-6 px-4 md:px-6">
        <div className="space-y-2 text-center flex justify-center flex-col items-center">
          <Image
            src="/android-chrome-192x192.png"
            width={96}
            height={96}
            className="rounded-full mb-4 border-2 border-black"
            alt="find me logo"
            priority
          />
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Find Me
          </h1>
          {!authContext?.user && (
            <p className="max-w-[700px] text-muted-foreground md:text-xl">
              Login to start a session
            </p>
          )}
        </div>
        {authContext?.user ? (
          <Button
            variant="outline"
            className="shadow-[inset_0_0_0_2px_#616467] text-black px-12 py-4 rounded-full tracking-widest uppercase font-bold bg-transparent hover:bg-[#616467] hover:text-white dark:text-neutral-200 transition duration-200"
            disabled={createSessionMutation.isPending}
            onClick={() => createSessionMutation.mutate()}
          >
            {createSessionMutation.isPending ? (
              <Spinner className="text-black dark:text-white" />
            ) : (
              "Create Session"
            )}
          </Button>
        ) : (
          <GoogleButton />
        )}
      </section>
    </div>
  );
}

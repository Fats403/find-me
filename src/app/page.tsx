"use client";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/ui/spinner";
import { AuthContext } from "@/components/firebase-provider";
import GoogleButton from "@/components/ui/google-button";
import { useSession } from "@/components/session-provider";
import { auth } from "@/lib/firebase";

export default function Component() {
  const authContext = useContext(AuthContext);
  const [value, setValue] = useState("");
  const router = useRouter();

  const { isCreatingSession, createSession } = useSession();

  useEffect(() => {
    // auth.signOut();
  }, []);

  useEffect(() => {
    if (!authContext?.loading) {
      if (authContext?.userData?.activeSessionId) {
        router.push(`/session/${authContext.userData.activeSessionId}`);
      }
    }
  }, [router, authContext]);

  return (
    <div className="min-h-screen flex justify-center items-center">
      {!authContext?.loading && !authContext?.userData?.activeSessionId ? (
        <section className="max-w-[400px] py-12">
          <div className="space-y-6 text-center">
            <h1 className="text-3xl font-bold">Find Me</h1>
          </div>
          <div className="space-y-6 flex justify-center items-center flex-col">
            <InputOTP
              maxLength={6}
              autoFocus
              value={value}
              onChange={(value) => setValue(value)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <div className="grid gap-2">
              <Button className="w-full">Join Session</Button>
              {authContext?.user ? (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={isCreatingSession}
                  onClick={() => createSession()}
                >
                  {isCreatingSession ? (
                    <Spinner className="text-black dark:text-white" />
                  ) : (
                    "Create Session"
                  )}
                </Button>
              ) : (
                <GoogleButton />
              )}
            </div>
          </div>
        </section>
      ) : (
        <div className="min-h-screen flex justify-center items-center">
          <Spinner className="text-black dark:text-white" />
        </div>
      )}
    </div>
  );
}

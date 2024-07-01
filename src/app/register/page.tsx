import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Register() {
  return (
    <div className="container mx-auto flex flex-col items-center justify-center px-4 py-16">
      <Link
        href="/"
        className="group mb-6 flex text-muted-foreground hover:text-primary"
        prefetch={false}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Go back
      </Link>
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create an account
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and display name to start a session
          </p>
        </div>
        <div className="grid gap-6">
          <form>
            <div className="grid gap-2">
              <Label className="sr-only" htmlFor="email">
                Email
              </Label>
              <Input
                id="email"
                placeholder="name@example.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
              />
            </div>
            <div className="grid gap-2">
              <Label className="sr-only" htmlFor="name">
                Display Name
              </Label>
              <Input
                id="name"
                placeholder="Your display name"
                autoCapitalize="none"
                autoComplete="name"
                autoCorrect="off"
              />
            </div>
            <Button className="mt-4" type="submit">
              Register
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

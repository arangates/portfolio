"use client";

import { Button } from "@portfolio/ui/components/button";
import { Spinner } from "@portfolio/ui/components/spinner";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export function GoogleSignInButton({
  label = "Continue with Google",
  errorCallbackURL = "/login?oauth=failed",
}: {
  label?: string;
  errorCallbackURL?: string;
}) {
  const [isPending, setIsPending] = useState(false);

  async function signInWithGoogle() {
    setIsPending(true);

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
        errorCallbackURL,
      });

      if (result.error) {
        toast.error(result.error.message || "Google sign-in could not be started");
        setIsPending(false);
      }
    } catch {
      toast.error("Google sign-in could not be started");
      setIsPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={isPending}
      onClick={signInWithGoogle}
    >
      {isPending ? <Spinner data-icon="inline-start" /> : <GoogleIcon />}
      {isPending ? "Opening Google…" : label}
    </Button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.98-.9 6.63-2.36l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.77-5.61-4.14H3.04v2.62A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.92A6.02 6.02 0 0 1 6.08 12c0-.67.11-1.32.31-1.92V7.46H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.54l3.35-2.62Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.94c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.96 5.46l3.35 2.62C7.18 7.71 9.39 5.94 12 5.94Z"
      />
    </svg>
  );
}

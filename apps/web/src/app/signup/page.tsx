import { auth, googleAuthEnabled } from "@portfolio/auth";
import { isSovereignMode } from "@portfolio/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { SignupForm } from "@/components/signup-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ oauth?: string; error?: string }>;
}) {
  if (isSovereignMode()) {
    redirect("/dashboard");
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) redirect("/dashboard");
  const { oauth, error } = await searchParams;

  return (
    <SignupForm googleEnabled={googleAuthEnabled} oauthFailed={oauth === "failed" || !!error} />
  );
}

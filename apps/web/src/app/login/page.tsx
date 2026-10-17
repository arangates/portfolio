import { auth, googleAuthEnabled } from "@portfolio/auth";
import { isSovereignMode } from "@portfolio/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
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
    <LoginForm googleEnabled={googleAuthEnabled} oauthFailed={oauth === "failed" || !!error} />
  );
}

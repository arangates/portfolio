import { auth, googleAuthEnabled } from "@portfolio/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ oauth?: string; error?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) redirect("/dashboard");
  const { oauth, error } = await searchParams;

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm googleEnabled={googleAuthEnabled} oauthFailed={oauth === "failed" || !!error} />
      </div>
    </main>
  );
}

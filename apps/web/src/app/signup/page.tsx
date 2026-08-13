import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { SignupForm } from "@/components/signup-form";

export default async function SignupPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <SignupForm />
      </div>
    </main>
  );
}

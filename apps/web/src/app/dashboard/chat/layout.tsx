import { GlobalAIChat } from "@/components/global-ai-chat";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  return <GlobalAIChat userId={session.user.id}>{children}</GlobalAIChat>;
}

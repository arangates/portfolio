import { CashFlowView } from "@/components/cash-flow-view";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function PersonalCashFlowPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  return <CashFlowView userId={session.user.id} scope="personal" />;
}

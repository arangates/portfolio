import { FinancialIntelligencePanel } from "@/components/financial-intelligence-panel";
import { getFinancialIntelligence } from "@portfolio/api/financial-intelligence-queries";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function IntelligencePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const intelligence = await getFinancialIntelligence(session.user.id);
  return (
    <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
      <div className="flex flex-col gap-5 px-4 py-5 md:px-6 md:py-6">
        <div>
          <p className="text-sm font-medium text-primary">Decision support</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-balance">
            Financial intelligence
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Connect the dots across your imported records. Every finding shows the evidence, impact,
            and next action.
          </p>
        </div>
        <FinancialIntelligencePanel data={intelligence} />
      </div>
    </div>
  );
}

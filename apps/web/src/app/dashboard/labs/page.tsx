import { PageHeader } from "@/components/page-header";
import EvaluationSection from "@/components/evaluation-section";
import { AmbientInsightsSection } from "@/components/ambient-insights";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@portfolio/ui/components/card";

export default function LabsPage() {
  if (process.env.NEXT_PUBLIC_ENABLE_LABS !== "true") {
    redirect("/dashboard");
  }

  return (
    <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
      <div className="flex flex-col gap-4 py-4 sm:py-5 md:gap-5 md:py-6">
        <PageHeader
          title="Selvam Labs (Experimental)"
          description="Early-access intelligent features, proactive insights, and experimental financial models."
        />

        <div className="px-4 lg:px-6 space-y-12">
          {/* Ambient Intelligence */}
          <section>
            <AmbientInsightsSection />
          </section>

          {/* Selvam Evaluate */}
          <section>
            <EvaluationSection />
          </section>

          {/* Scenario Engine placeholder */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Scenario Engine</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Hypothetical projection of life events against your FIRE plan.
            </p>
            <Card>
              <CardHeader>
                <CardTitle>What-If Scenarios</CardTitle>
                <CardDescription>
                  This experimental engine mathematically simulates life events (market crashes,
                  sabbaticals, large expenses) against your live portfolio in-memory. Use the API at{" "}
                  <code className="bg-muted px-1 py-0.5 rounded">/api/scenarios</code> to test it
                  programmatically.
                </CardDescription>
              </CardHeader>
            </Card>
          </section>

          {/* Capital Deployment Plan placeholder */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Autonomous Deployer</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Actionable shopping list to close allocation drift.
            </p>
            <Card>
              <CardHeader>
                <CardTitle>Capital Deployment Plan</CardTitle>
                <CardDescription>
                  This engine generates a deterministic purchase plan for your surplus cash based on
                  your exact target drift. Use the API at{" "}
                  <code className="bg-muted px-1 py-0.5 rounded">/api/deployment-plan</code> to test
                  it programmatically.
                </CardDescription>
              </CardHeader>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}

import { PageHeader } from "@/components/page-header";
import EvaluationSection from "@/components/evaluation-section";
import { AmbientInsightsSection } from "@/components/ambient-insights";
import { LabsScenarioEngine } from "@/components/labs-scenario-engine";
import { LabsDeploymentPlan } from "@/components/labs-deployment-plan";
import { redirect } from "next/navigation";

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

          {/* Scenario Engine */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Scenario Engine</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Hypothetical projection of life events against your FIRE plan.
            </p>
            <LabsScenarioEngine />
          </section>

          {/* Capital Deployment Plan */}
          <section>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Autonomous Deployer</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Actionable shopping list to close allocation drift.
            </p>
            <LabsDeploymentPlan />
          </section>
        </div>
      </div>
    </div>
  );
}

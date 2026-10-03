import { PageHeader } from "@/components/page-header";
import EvaluationSection from "@/components/evaluation-section";
import { AmbientInsightsSection } from "@/components/ambient-insights";
import { LabsScenarioEngine } from "@/components/labs-scenario-engine";
import { LabsDeploymentPlan } from "@/components/labs-deployment-plan";
import { redirect } from "next/navigation";
import {
  BeakerIcon,
  BrainCircuitIcon,
  ChartNoAxesCombinedIcon,
  RouteIcon,
  SparklesIcon,
} from "lucide-react";

const experiments = [
  { label: "Signal center", detail: "Live financial signals", icon: BrainCircuitIcon },
  {
    label: "Scenario studio",
    detail: "Model decisions before acting",
    icon: ChartNoAxesCombinedIcon,
  },
  { label: "Deployment copilot", detail: "Turn drift into a plan", icon: RouteIcon },
];

export default function LabsPage() {
  if (process.env.NEXT_PUBLIC_ENABLE_LABS !== "true") redirect("/dashboard");

  return (
    <main className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
      <div className="flex flex-col gap-6 py-5 md:gap-8 md:py-7">
        <PageHeader
          title="Selvam Labs"
          description="A decision cockpit for testing the moves that shape your financial future."
        />
        <div className="flex flex-col gap-6 px-4 lg:px-6">
          <section className="relative overflow-hidden rounded-2xl border bg-card p-5 md:p-7">
            <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">
                  <BeakerIcon className="size-4" /> Experimental finance
                </div>
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  From data to decisions.
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                  Selvam Labs connects your portfolio, cash flow, FIRE plan, and allocation targets
                  so you can see the consequence of a decision before you make it.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 lg:min-w-[430px]">
                {experiments.map(({ label, detail, icon: Icon }) => (
                  <div key={label} className="rounded-xl border bg-background/60 p-3">
                    <Icon className="mb-5 size-4 text-primary" />
                    <p className="text-xs font-medium">{label}</p>
                    <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <AmbientInsightsSection />
          <EvaluationSection />
          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <SparklesIcon className="size-5 text-primary" />
                  <h2 className="text-xl font-semibold tracking-tight">Scenario studio</h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Stress-test life events against your current FIRE trajectory.
                </p>
              </div>
              <LabsScenarioEngine />
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <RouteIcon className="size-5 text-primary" />
                  <h2 className="text-xl font-semibold tracking-tight">Deployment copilot</h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Convert surplus cash and allocation drift into an explainable shopping list.
                </p>
              </div>
              <LabsDeploymentPlan />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

import { getLatestEvaluation, getActiveAlerts } from "@portfolio/api/evaluation-queries";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import EvaluationScoreCards from "./evaluation-score-cards";
import { RunEvaluationButton, AlertsContainer } from "./evaluation-actions";
import { Card, CardDescription, CardHeader, CardTitle } from "@portfolio/ui/components/card";

export default async function EvaluationSection() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return null;
  }

  const [evaluation, alerts] = await Promise.all([
    getLatestEvaluation(session.user.id),
    getActiveAlerts(session.user.id),
  ]);

  if (!evaluation) {
    return (
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="text-center py-8">
          <CardTitle>Welcome to Selvam Evaluate</CardTitle>
          <CardDescription className="max-w-md mx-auto mb-4 mt-2">
            Get intelligent insights into your financial health, FIRE trajectory, and tax
            efficiency. Run your first evaluation to get started.
          </CardDescription>
          <div className="flex justify-center">
            <RunEvaluationButton />
          </div>
        </CardHeader>
      </Card>
    );
  }

  const evalData = evaluation.evaluation;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Intelligence</h2>
          <p className="text-muted-foreground text-sm">
            AI-driven insights on your financial posture.
          </p>
        </div>
        <RunEvaluationButton />
      </div>

      <EvaluationScoreCards
        scores={{
          liquidity: evaluation.liquidityScore ?? null,
          fire: evaluation.fireScore ?? null,
          deployment: evaluation.deploymentScore ?? null,
          evidence: evaluation.evidenceScore ?? null,
          tax: evaluation.taxScore ?? null,
          overall: evaluation.overallScore ?? null,
        }}
        reasoning={evalData.scores}
        summary={evalData.executive_summary}
        evaluatedAt={evaluation.createdAt}
      />

      <AlertsContainer alerts={alerts ?? []} />
    </div>
  );
}

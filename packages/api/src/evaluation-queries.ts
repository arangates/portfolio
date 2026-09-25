import "server-only";

import { db, financialEvaluation, evaluationAlert } from "@portfolio/db";
import { and, desc, eq, isNull, sql } from "drizzle-orm";

export async function getLastEvaluationHash(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ contextHash: financialEvaluation.contextHash })
    .from(financialEvaluation)
    .where(eq(financialEvaluation.userId, userId))
    .orderBy(desc(financialEvaluation.createdAt))
    .limit(1);
  return row?.contextHash ?? null;
}

export async function getLatestEvaluation(userId: string) {
  const [evaluation] = await db
    .select()
    .from(financialEvaluation)
    .where(eq(financialEvaluation.userId, userId))
    .orderBy(desc(financialEvaluation.createdAt))
    .limit(1);

  if (!evaluation) {
    return null;
  }

  const alerts = await db
    .select()
    .from(evaluationAlert)
    .where(eq(evaluationAlert.evaluationId, evaluation.id))
    .orderBy(desc(evaluationAlert.createdAt));

  return {
    id: evaluation.id,
    trigger: evaluation.trigger,
    model: evaluation.model,
    liquidityScore: evaluation.liquidityScore,
    fireScore: evaluation.fireScore,
    deploymentScore: evaluation.deploymentScore,
    evidenceScore: evaluation.evidenceScore,
    taxScore: evaluation.taxScore,
    overallScore: evaluation.overallScore,
    evaluation: evaluation.evaluation as {
      scores?: {
        liquidity_health?: { score: number; reasoning: string };
        fire_trajectory?: { score: number; reasoning: string };
        deployment_discipline?: { score: number; reasoning: string };
        evidence_freshness?: { score: number; reasoning: string };
        tax_efficiency?: { score: number; reasoning: string };
      };
      overall_score?: number;
      executive_summary?: string;
    },
    alerts,
    createdAt: evaluation.createdAt,
  };
}

export async function getEvaluationHistory(userId: string, limit = 30) {
  return db
    .select({
      id: financialEvaluation.id,
      liquidityScore: financialEvaluation.liquidityScore,
      fireScore: financialEvaluation.fireScore,
      deploymentScore: financialEvaluation.deploymentScore,
      evidenceScore: financialEvaluation.evidenceScore,
      taxScore: financialEvaluation.taxScore,
      overallScore: financialEvaluation.overallScore,
      createdAt: financialEvaluation.createdAt,
    })
    .from(financialEvaluation)
    .where(eq(financialEvaluation.userId, userId))
    .orderBy(desc(financialEvaluation.createdAt))
    .limit(limit);
}

export async function getActiveAlerts(userId: string) {
  return db
    .select()
    .from(evaluationAlert)
    .where(and(eq(evaluationAlert.userId, userId), isNull(evaluationAlert.acknowledgedAt)))
    .orderBy(
      sql`CASE ${evaluationAlert.severity} WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END`,
      desc(evaluationAlert.createdAt),
    );
}

export async function saveEvaluation(params: {
  userId: string;
  trigger: string;
  model: string;
  scores: {
    liquidity: number | null;
    fire: number | null;
    deployment: number | null;
    evidence: number | null;
    tax: number | null;
    overall: number | null;
  };
  evaluation: unknown;
  alerts: Array<{
    category: string;
    severity: string;
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
    alertKey: string;
  }>;
  contextHash: string;
}) {
  return db.transaction(async (tx) => {
    const [insertedEval] = await tx
      .insert(financialEvaluation)
      .values({
        userId: params.userId,
        trigger: params.trigger,
        model: params.model,
        liquidityScore: params.scores.liquidity,
        fireScore: params.scores.fire,
        deploymentScore: params.scores.deployment,
        evidenceScore: params.scores.evidence,
        taxScore: params.scores.tax,
        overallScore: params.scores.overall,
        evaluation: params.evaluation,
        contextHash: params.contextHash,
      })
      .returning({ id: financialEvaluation.id });

    if (!insertedEval) {
      throw new Error("Failed to insert evaluation");
    }

    if (params.alerts.length > 0) {
      await tx.insert(evaluationAlert).values(
        params.alerts.map((alert) => ({
          userId: params.userId,
          evaluationId: insertedEval.id,
          category: alert.category,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          actionLabel: alert.actionLabel ?? null,
          actionHref: alert.actionHref ?? null,
          alertKey: alert.alertKey,
        })),
      );
    }

    return insertedEval.id;
  });
}

export async function acknowledgeAlert(userId: string, alertId: string) {
  await db
    .update(evaluationAlert)
    .set({ acknowledgedAt: new Date() })
    .where(and(eq(evaluationAlert.id, alertId), eq(evaluationAlert.userId, userId)));
}

export async function acknowledgeAllAlerts(userId: string) {
  await db
    .update(evaluationAlert)
    .set({ acknowledgedAt: new Date() })
    .where(and(eq(evaluationAlert.userId, userId), isNull(evaluationAlert.acknowledgedAt)));
}

import { env } from "@portfolio/env/server";
import { buildEvaluationContext } from "@portfolio/api/evaluation-engine";
import { getLastEvaluationHash, saveEvaluation } from "@portfolio/api/evaluation-queries";
import { gateway } from "ai";
import { generateObject } from "ai";
import { db, user } from "@portfolio/db";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 300;

const evaluationSchema = z.object({
  scores: z.object({
    liquidity_health: z.object({
      score: z.number().min(0).max(100),
      reasoning: z.string(),
    }),
    fire_trajectory: z.object({
      score: z.number().min(0).max(100),
      reasoning: z.string(),
    }),
    deployment_discipline: z.object({
      score: z.number().min(0).max(100),
      reasoning: z.string(),
    }),
    evidence_freshness: z.object({
      score: z.number().min(0).max(100),
      reasoning: z.string(),
    }),
    tax_efficiency: z.object({
      score: z.number().min(0).max(100),
      reasoning: z.string(),
    }),
  }),
  overall_score: z.number().min(0).max(100),
  executive_summary: z.string(),
  alerts: z.array(
    z.object({
      category: z.enum(["liquidity", "fire", "deployment", "evidence", "tax", "cross_domain"]),
      severity: z.enum(["info", "warning", "critical"]),
      title: z.string(),
      description: z.string(),
      action_label: z.string().optional(),
      action_href: z.string().optional(),
      alert_key: z.string(),
    }),
  ),
});

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allUsers = await db.select().from(user);
    let evaluatedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const u of allUsers) {
      try {
        const context = await buildEvaluationContext(u.id);
        const lastHash = await getLastEvaluationHash(u.id);

        if (lastHash === context.contextHash) {
          skippedCount++;
          continue;
        }

        const { object: result } = await generateObject({
          model: gateway("anthropic/claude-sonnet-4.6"),
          schema: evaluationSchema,
          system: context.rubrics,
          prompt: context.prompt,
        });

        await saveEvaluation({
          userId: u.id,
          trigger: "cron",
          model: "anthropic/claude-sonnet-4.6",
          scores: {
            liquidity: result.scores.liquidity_health.score,
            fire: result.scores.fire_trajectory.score,
            deployment: result.scores.deployment_discipline.score,
            evidence: result.scores.evidence_freshness.score,
            tax: result.scores.tax_efficiency.score,
            overall: result.overall_score,
          },
          evaluation: result,
          alerts: result.alerts.map((alert) => ({
            category: alert.category,
            severity: alert.severity,
            title: alert.title,
            description: alert.description,
            actionLabel: alert.action_label,
            actionHref: alert.action_href,
            alertKey: alert.alert_key,
          })),
          contextHash: context.contextHash,
        });

        evaluatedCount++;
      } catch (err) {
        console.error(`Evaluation failed for user ${u.id}:`, err);
        failedCount++;
      }
    }

    return Response.json({
      status: "success",
      evaluatedCount,
      skippedCount,
      failedCount,
    });
  } catch (error) {
    console.error("Cron evaluation job failed:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

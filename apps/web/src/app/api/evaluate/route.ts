import { generateObject } from "ai";
import { gateway } from "ai";
import { buildEvaluationContext } from "@portfolio/api/evaluation-engine";
import { getLastEvaluationHash, saveEvaluation } from "@portfolio/api/evaluation-queries";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

// Schema for the structured evaluation output from Jev
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

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Determine trigger from query params or body
  const url = new URL(request.url);
  const trigger = url.searchParams.get("trigger") ?? "manual";

  const context = await buildEvaluationContext(session.user.id);

  // Skip if nothing meaningful changed since last evaluation
  const lastHash = await getLastEvaluationHash(session.user.id);
  if (lastHash === context.contextHash && trigger !== "manual") {
    return Response.json({
      status: "no_change",
      message: "Financial data unchanged since last evaluation",
    });
  }

  try {
    const { object: result } = await generateObject({
      model: gateway("typesafe-ai/jev"),
      schema: evaluationSchema,
      system: context.rubrics,
      prompt: context.prompt,
    });

    const evaluationId = await saveEvaluation({
      userId: session.user.id,
      trigger,
      model: "typesafe-ai/jev",
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

    return Response.json({
      status: "evaluated",
      evaluationId,
      scores: {
        liquidity: result.scores.liquidity_health.score,
        fire: result.scores.fire_trajectory.score,
        deployment: result.scores.deployment_discipline.score,
        evidence: result.scores.evidence_freshness.score,
        tax: result.scores.tax_efficiency.score,
        overall: result.overall_score,
      },
      summary: result.executive_summary,
      alertCount: result.alerts.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Evaluation failed";
    console.error("Selvam Evaluate failed:", error);
    return Response.json({ error: message }, { status: 502 });
  }
}

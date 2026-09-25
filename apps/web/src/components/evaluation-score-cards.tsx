"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@portfolio/ui/components/card";
import { cn } from "@portfolio/ui/lib/utils";
import {
  ActivityIcon,
  FlameIcon,
  RouteIcon,
  ShieldCheckIcon,
  ReceiptTextIcon,
  SparklesIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type EvaluationScore = {
  liquidity: number | null;
  fire: number | null;
  deployment: number | null;
  evidence: number | null;
  tax: number | null;
  overall: number | null;
};

type ScoreReasoning = {
  liquidity_health?: { score: number; reasoning: string };
  fire_trajectory?: { score: number; reasoning: string };
  deployment_discipline?: { score: number; reasoning: string };
  evidence_freshness?: { score: number; reasoning: string };
  tax_efficiency?: { score: number; reasoning: string };
};

type Props = {
  scores: EvaluationScore;
  reasoning?: ScoreReasoning;
  summary?: string;
  evaluatedAt?: Date | string;
};

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 70
      ? "text-emerald-500"
      : score >= 50
        ? "text-amber-500"
        : score >= 30
          ? "text-orange-500"
          : "text-red-500";

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        className="text-muted/30"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className={color}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        className={cn("rotate-90 origin-center fill-current text-xs font-semibold", color)}
        style={{ transform: "rotate(90deg)", transformOrigin: "center" }}
      >
        {score}
      </text>
    </svg>
  );
}

function DimensionCard({
  title,
  score,
  reasoning,
  Icon,
}: {
  title: string;
  score: number | null;
  reasoning?: string;
  Icon: LucideIcon;
}) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="p-4 flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          {score !== null ? (
            <ScoreRing score={score} size={40} />
          ) : (
            <div className="w-10 h-10 flex items-center justify-center rounded-full border border-dashed text-muted-foreground">
              —
            </div>
          )}
        </div>
        <CardDescription className="text-xs">
          {score !== null ? reasoning || "No reasoning provided." : "Not yet evaluated"}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

export default function EvaluationScoreCards({ scores, reasoning, summary, evaluatedAt }: Props) {
  return (
    <div className="space-y-4">
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-4">
            {scores.overall !== null ? (
              <ScoreRing score={scores.overall} size={64} />
            ) : (
              <div className="w-16 h-16 flex items-center justify-center rounded-full border-2 border-dashed text-muted-foreground text-xl shrink-0">
                —
              </div>
            )}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Financial Intelligence Score</CardTitle>
              </div>
              <CardDescription className="text-sm text-foreground/80 font-medium">
                {summary ||
                  (scores.overall !== null
                    ? "Your finances have been evaluated."
                    : "No evaluation has been run yet.")}
              </CardDescription>
              {evaluatedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last evaluated: {new Date(evaluatedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <DimensionCard
          title="Liquidity"
          score={scores.liquidity}
          reasoning={reasoning?.liquidity_health?.reasoning}
          Icon={ActivityIcon}
        />
        <DimensionCard
          title="FIRE Trajectory"
          score={scores.fire}
          reasoning={reasoning?.fire_trajectory?.reasoning}
          Icon={FlameIcon}
        />
        <DimensionCard
          title="Deployment"
          score={scores.deployment}
          reasoning={reasoning?.deployment_discipline?.reasoning}
          Icon={RouteIcon}
        />
        <DimensionCard
          title="Evidence"
          score={scores.evidence}
          reasoning={reasoning?.evidence_freshness?.reasoning}
          Icon={ShieldCheckIcon}
        />
        <DimensionCard
          title="Tax Efficiency"
          score={scores.tax}
          reasoning={reasoning?.tax_efficiency?.reasoning}
          Icon={ReceiptTextIcon}
        />
      </div>
    </div>
  );
}

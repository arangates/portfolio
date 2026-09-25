"use client";

import { Button } from "@portfolio/ui/components/button";
import { SparklesIcon, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import EvaluationAlerts, { type Alert } from "./evaluation-alerts";

export function RunEvaluationButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleRunEvaluation = () => {
    startTransition(async () => {
      try {
        await fetch("/api/evaluate?trigger=manual", { method: "POST" });
        router.refresh();
      } catch (error) {
        console.error("Failed to run evaluation:", error);
      }
    });
  };

  return (
    <Button onClick={handleRunEvaluation} disabled={isPending}>
      {isPending ? (
        <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <SparklesIcon className="w-4 h-4 mr-2" />
      )}
      Run evaluation
    </Button>
  );
}

export function AlertsContainer({ alerts }: { alerts: Alert[] }) {
  const router = useRouter();

  const handleDismiss = async (alertId: string) => {
    try {
      await fetch("/api/evaluate/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss", alertId }),
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to dismiss alert:", error);
    }
  };

  const handleDismissAll = async () => {
    try {
      await fetch("/api/evaluate/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss_all" }),
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to dismiss all alerts:", error);
    }
  };

  return (
    <EvaluationAlerts alerts={alerts} onDismiss={handleDismiss} onDismissAll={handleDismissAll} />
  );
}

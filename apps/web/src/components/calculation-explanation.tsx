"use client";
import { CircleHelpIcon } from "lucide-react";
import { Button } from "@portfolio/ui/components/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@portfolio/ui/components/dialog";
export type CalculationExplanation = {
  formula: string;
  inputs: Array<{ label: string; value: string }>;
  limitations: string;
  sourceHref: string;
};
export function CalculationExplanationButton({
  title,
  explanation,
}: {
  title: string;
  explanation: CalculationExplanation;
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`How was ${title} calculated?`}
            title="How was this calculated?"
          />
        }
      >
        <CircleHelpIcon />
      </DialogTrigger>
      <DialogContent data-financial-dialog>
        <DialogHeader>
          <DialogTitle>{title}: calculation</DialogTitle>
          <DialogDescription>{explanation.formula}</DialogDescription>
        </DialogHeader>
        <dl className="space-y-3">
          {explanation.inputs.map((row) => (
            <div
              key={row.label}
              className="flex flex-wrap justify-between gap-2 border-b pb-2 text-sm"
            >
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-medium tabular-nums">{row.value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm text-muted-foreground">{explanation.limitations}</p>
        <a href={explanation.sourceHref} className="text-sm underline underline-offset-4">
          Open source records
        </a>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { Button } from "@portfolio/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@portfolio/ui/components/card";
import { CalendarClockIcon } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "salary-did-not-work-months";

export function SalaryGapControls({ gaps }: { gaps: string[] }) {
  const [didNotWork, setDidNotWork] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      setDidNotWork(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      setDidNotWork([]);
    }
  }, []);

  const toggleMonth = (month: string) => {
    const next = didNotWork.includes(month)
      ? didNotWork.filter((value) => value !== month)
      : [...didNotWork, month];
    setDidNotWork(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage errors in private or restricted contexts.
    }
  };

  const visibleGaps = gaps.filter((gap) => !didNotWork.includes(gap));
  if (visibleGaps.length === 0 && gaps.length === 0) return null;

  return (
    <div className="px-4 lg:px-6">
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClockIcon className="size-4 text-amber-600" />
            Coverage gap detected
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {visibleGaps.length > 0 ? (
            <div className="space-y-2">
              <p>
                Missing between the first and latest imported periods: {visibleGaps.join(", ")}.
              </p>
              <div className="flex flex-wrap gap-2">
                {gaps.map((gap) => {
                  const selected = didNotWork.includes(gap);
                  return (
                    <Button
                      key={gap}
                      type="button"
                      variant={selected ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => toggleMonth(gap)}
                    >
                      {selected ? "Marked: didn’t work" : `Mark ${gap} as didn’t work`}
                    </Button>
                  );
                })}
              </div>
            </div>
          ) : (
            <p>These missing periods were marked as no salary because the user did not work.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

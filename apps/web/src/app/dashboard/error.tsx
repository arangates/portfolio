"use client";

import { Button } from "@portfolio/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@portfolio/ui/components/card";
import { RotateCcwIcon } from "lucide-react";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-80 items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Portfolio data could not be loaded</CardTitle>
          <CardDescription>
            The error was contained and no data was changed. Try the request again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error.digest ? (
            <p className="text-xs text-muted-foreground">Reference: {error.digest}</p>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button onClick={reset}>
            <RotateCcwIcon data-icon="inline-start" />
            Try again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

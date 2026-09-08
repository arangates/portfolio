"use client";
import { useEffect } from "react";
import { beginOperation } from "@/lib/app-activity";

/** Keep update protection active across an entire batch, including response parsing. */
export function useOperationBusy(pending: boolean) {
  useEffect(() => {
    if (pending) return beginOperation();
  }, [pending]);
}

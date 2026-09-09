"use client";
import { createContext, useContext, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@portfolio/ui/components/button";
import { createAmountFormatter, type AmountMode } from "@/lib/format";

const AmountContext = createContext<AmountMode>("compact");
const ControlContext = createContext({ toggle: () => {}, pending: false });
export function AmountPreferences({
  initialMode,
  children,
}: {
  initialMode: AmountMode;
  children: ReactNode;
}) {
  const [mode, setMode] = useState(initialMode);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  function toggle() {
    const next = mode === "compact" ? "exact" : "compact";
    document.cookie = `selvam-amount-mode=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    setMode(next);
    startTransition(() => router.refresh());
  }
  return (
    <AmountContext.Provider value={mode}>
      <ControlContext.Provider value={{ toggle, pending }}>{children}</ControlContext.Provider>
    </AmountContext.Provider>
  );
}
export function useAmountFormat() {
  return createAmountFormatter(useContext(AmountContext));
}
export function AmountModeToggle() {
  const mode = useContext(AmountContext);
  const { toggle, pending } = useContext(ControlContext);
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={toggle}
      aria-label={`Amount display: ${mode}. Switch to ${mode === "compact" ? "exact" : "compact"} amounts`}
      aria-pressed={mode === "exact"}
      title="Exact shows full currency amounts; chart axes keep compact scale labels."
    >
      {mode === "compact" ? "1.2K" : "1,234.56"}
    </Button>
  );
}

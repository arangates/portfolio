"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Button } from "@portfolio/ui/components/button";

const PrivacyContext = createContext({ hidden: false, toggle: () => {} });
export function useFinancialPrivacy() {
  return useContext(PrivacyContext).hidden;
}

export function DashboardExperience({
  initialHidden,
  children,
}: {
  initialHidden: boolean;
  children: ReactNode;
}) {
  const [hidden, setHidden] = useState(initialHidden);
  function toggle() {
    const next = !hidden;
    setHidden(next);
    document.cookie = `selvam-privacy=${next ? "hidden" : "visible"}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  }
  useEffect(() => {
    document.documentElement.dataset.financialPrivacy = String(hidden);
    return () => {
      delete document.documentElement.dataset.financialPrivacy;
    };
  }, [hidden]);
  return <PrivacyContext.Provider value={{ hidden, toggle }}>{children}</PrivacyContext.Provider>;
}

export function PrivacyToggle() {
  const { hidden, toggle } = useContext(PrivacyContext);
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-pressed={hidden}
      aria-label={hidden ? "Show financial details" : "Hide financial details"}
      title={hidden ? "Show financial details" : "Hide financial details"}
    >
      {hidden ? <EyeOffIcon /> : <EyeIcon />}
    </Button>
  );
}

export function FinancialContent({ children }: { children: ReactNode }) {
  const { hidden, toggle } = useContext(PrivacyContext);
  return (
    <>
      {hidden ? (
        <div
          className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-20 text-center"
          role="status"
        >
          <EyeOffIcon className="size-8 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Financial details hidden</h2>
          <p className="text-sm text-muted-foreground">
            Your balances, charts and records are concealed. You can still navigate using the menu.
          </p>
          <Button variant="outline" onClick={toggle}>
            Show financial details
          </Button>
        </div>
      ) : null}
      <div hidden={hidden} inert={hidden} className="min-w-0 flex-1">
        {children}
      </div>
    </>
  );
}

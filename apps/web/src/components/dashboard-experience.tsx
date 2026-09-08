"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  EyeIcon,
  EyeOffIcon,
  HouseIcon,
  BrainCircuitIcon,
  UploadIcon,
  MenuIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@portfolio/ui/components/button";
import { useSidebar } from "@portfolio/ui/components/sidebar";

const PrivacyContext = createContext({ hidden: false, toggle: () => {} });

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

const destinations = [
  { href: "/dashboard", label: "Overview", icon: HouseIcon },
  { href: "/dashboard/twin", label: "Twin", icon: BrainCircuitIcon },
  { href: "/dashboard/imports", label: "Import", icon: UploadIcon },
] as const;

export function MobileNavigation() {
  const pathname = usePathname();
  const { toggleSidebar, openMobile } = useSidebar();
  return (
    <nav
      aria-label="Mobile navigation"
      className="mobile-navigation fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-background/95 backdrop-blur md:hidden"
    >
      {destinations.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          prefetch={false}
          aria-current={pathname === href ? "page" : undefined}
          className="flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground aria-[current=page]:bg-accent aria-[current=page]:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          <Icon className="size-5" />
          <span>{label}</span>
        </Link>
      ))}
      <button
        type="button"
        onClick={toggleSidebar}
        aria-expanded={openMobile}
        aria-label="More navigation"
        className="flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <MenuIcon className="size-5" />
        <span>More</span>
      </button>
    </nav>
  );
}

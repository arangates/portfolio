"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@portfolio/ui/components/tabs";
import {
  ArrowsClockwise,
  Bell,
  FireSimple,
  Key,
  Palette,
  ShieldCheck,
  SlidersHorizontal,
  UserCircle,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";

type SettingsSection =
  | "account"
  | "appearance"
  | "notifications"
  | "portfolio"
  | "exchange-rates"
  | "planning"
  | "security"
  | "model-keys";

const sections: {
  value: SettingsSection;
  label: string;
  description: string;
  icon: PhosphorIcon;
}[] = [
  {
    value: "account",
    label: "Account",
    description: "Your profile and sign-in details.",
    icon: UserCircle,
  },
  {
    value: "appearance",
    label: "Appearance",
    description: "Choose how Selvam looks on your devices.",
    icon: Palette,
  },
  {
    value: "notifications",
    label: "Notifications",
    description: "Choose which updates Selvam sends you.",
    icon: Bell,
  },
  {
    value: "portfolio",
    label: "Portfolio",
    description: "Base currency, locale and number display.",
    icon: SlidersHorizontal,
  },
  {
    value: "exchange-rates",
    label: "Exchange rates",
    description: "Automatic updates, manual rates and stored quotes.",
    icon: ArrowsClockwise,
  },
  {
    value: "planning",
    label: "Planning",
    description: "Assumptions behind your FIRE projections.",
    icon: FireSimple,
  },
  {
    value: "security",
    label: "Data & security",
    description: "Backups, archive, password and account deletion.",
    icon: ShieldCheck,
  },
  {
    value: "model-keys",
    label: "Model keys",
    description: "Connect the AI providers used by chat.",
    icon: Key,
  },
];

export function SettingsTabs({
  account,
  appearance,
  notifications,
  portfolio,
  exchangeRates,
  planning,
  dataAndSecurity,
  modelKeys,
  defaultValue = "account",
}: {
  account: React.ReactNode;
  appearance: React.ReactNode;
  notifications: React.ReactNode;
  portfolio: React.ReactNode;
  exchangeRates: React.ReactNode;
  planning: React.ReactNode;
  dataAndSecurity: React.ReactNode;
  modelKeys: React.ReactNode;
  defaultValue?: SettingsSection;
}) {
  const [value, setValue] = useState<SettingsSection>(defaultValue);
  const [sidebar, setSidebar] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const sync = () => setSidebar(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  function change(next: SettingsSection) {
    setValue(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url);
  }

  return (
    <Tabs
      value={value}
      onValueChange={(next) => change(next as SettingsSection)}
      orientation={sidebar ? "vertical" : "horizontal"}
      className="min-w-0 flex-col gap-5 px-4 lg:flex-row lg:items-start lg:gap-8 lg:px-6"
    >
      <TabsList
        variant="line"
        aria-label="Settings sections"
        className="flex h-auto w-full flex-row justify-start gap-1 overflow-x-auto rounded-none border-b p-0 pb-2 lg:sticky lg:top-20 lg:w-60 lg:shrink-0 lg:flex-col lg:overflow-visible lg:border-b-0 lg:pb-0"
      >
        {sections.map(({ value: sectionValue, label, icon: Icon }) => (
          <TabsTrigger
            key={sectionValue}
            value={sectionValue}
            className="h-10 flex-none shrink-0 justify-start gap-2.5 rounded-lg px-3 text-left text-sidebar-foreground/80 after:hidden data-active:bg-muted! data-active:text-foreground data-active:shadow-none dark:text-sidebar-foreground/80 dark:data-active:border-transparent dark:data-active:bg-muted! lg:h-12 lg:w-full lg:gap-3 lg:px-4 lg:text-base"
          >
            <Icon className="size-4 lg:size-5" />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      <div className="min-w-0 flex-1 [&_[data-slot=card-content]]:px-4 [&_[data-slot=card-content]]:pb-4 [&_[data-slot=card-footer]]:px-4 [&_[data-slot=card-footer]]:pb-4 [&_[data-slot=card-header]]:p-4 [&_[data-slot=card]]:gap-0 [&_[data-slot=card]]:py-0 [&_[data-slot=card]]:shadow-xs sm:[&_[data-slot=card-content]]:px-5 sm:[&_[data-slot=card-content]]:pb-5 sm:[&_[data-slot=card-footer]]:px-5 sm:[&_[data-slot=card-footer]]:pb-5 sm:[&_[data-slot=card-header]]:p-5">
        {sections.map((section) => (
          <TabsContent key={section.value} value={section.value} className="mt-0 space-y-5">
            <header className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight text-balance">{section.label}</h2>
              <p className="text-sm text-pretty text-muted-foreground">{section.description}</p>
            </header>
            {section.value === "account" ? (
              <div className="max-w-3xl">{account}</div>
            ) : section.value === "appearance" ? (
              <div className="max-w-3xl">{appearance}</div>
            ) : section.value === "notifications" ? (
              <div className="max-w-3xl">{notifications}</div>
            ) : section.value === "portfolio" ? (
              <div className="grid min-w-0 gap-4 2xl:grid-cols-2">{portfolio}</div>
            ) : section.value === "exchange-rates" ? (
              <div className="grid min-w-0 gap-4 2xl:grid-cols-2">{exchangeRates}</div>
            ) : section.value === "planning" ? (
              planning
            ) : section.value === "security" ? (
              <div className="grid min-w-0 gap-4 2xl:grid-cols-2">{dataAndSecurity}</div>
            ) : (
              modelKeys
            )}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}

"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@portfolio/ui/components/tabs";
import { FlameIcon, ShieldCheckIcon, SlidersHorizontalIcon, UserRoundIcon } from "lucide-react";

export function SettingsTabs({
  account,
  portfolio,
  planning,
  dataAndSecurity,
  defaultValue = "account",
}: {
  account: React.ReactNode;
  portfolio: React.ReactNode;
  planning: React.ReactNode;
  dataAndSecurity: React.ReactNode;
  defaultValue?: "account" | "portfolio" | "planning" | "security";
}) {
  return (
    <Tabs defaultValue={defaultValue} className="min-w-0 gap-4 px-4 lg:px-6">
      <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 group-data-horizontal/tabs:h-auto sm:inline-grid sm:w-auto sm:grid-cols-4">
        <TabsTrigger value="account" className="h-9 gap-2 px-3">
          <UserRoundIcon className="size-4" />
          Account
        </TabsTrigger>
        <TabsTrigger value="portfolio" className="h-9 gap-2 px-3">
          <SlidersHorizontalIcon className="size-4" />
          Portfolio
        </TabsTrigger>
        <TabsTrigger value="planning" className="h-9 gap-2 px-3">
          <FlameIcon className="size-4" />
          Planning
        </TabsTrigger>
        <TabsTrigger value="security" className="h-9 gap-2 px-3">
          <ShieldCheckIcon className="size-4" />
          Data & security
        </TabsTrigger>
      </TabsList>
      <div className="[&_[data-slot=card]]:gap-0 [&_[data-slot=card]]:py-0 [&_[data-slot=card]]:shadow-xs [&_[data-slot=card-content]]:px-4 [&_[data-slot=card-content]]:pb-4 sm:[&_[data-slot=card-content]]:px-5 sm:[&_[data-slot=card-content]]:pb-5 [&_[data-slot=card-footer]]:px-4 [&_[data-slot=card-footer]]:pb-4 sm:[&_[data-slot=card-footer]]:px-5 sm:[&_[data-slot=card-footer]]:pb-5 [&_[data-slot=card-header]]:p-4 sm:[&_[data-slot=card-header]]:p-5">
        <TabsContent value="account">
          <div className="max-w-2xl">{account}</div>
        </TabsContent>
        <TabsContent value="portfolio">
          <div className="grid min-w-0 gap-4 xl:grid-cols-2">{portfolio}</div>
        </TabsContent>
        <TabsContent value="planning">{planning}</TabsContent>
        <TabsContent value="security">
          <div className="grid min-w-0 gap-4 xl:grid-cols-2">{dataAndSecurity}</div>
        </TabsContent>
      </div>
    </Tabs>
  );
}

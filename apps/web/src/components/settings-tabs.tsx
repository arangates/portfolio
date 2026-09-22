"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@portfolio/ui/components/tabs";
import {
  FlameIcon,
  KeyRoundIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  UserRoundIcon,
} from "lucide-react";

export function SettingsTabs({
  account,
  portfolio,
  planning,
  dataAndSecurity,
  modelKeys,
  defaultValue = "account",
}: {
  account: React.ReactNode;
  portfolio: React.ReactNode;
  planning: React.ReactNode;
  dataAndSecurity: React.ReactNode;
  modelKeys: React.ReactNode;
  defaultValue?: "account" | "portfolio" | "planning" | "security" | "model-keys";
}) {
  return (
    <Tabs defaultValue={defaultValue} className="min-w-0 gap-5 px-4 lg:px-6">
      <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-lg border bg-muted/40 p-1 group-data-horizontal/tabs:h-auto sm:inline-flex sm:w-auto">
        <TabsTrigger value="account" className="h-9 shrink-0 gap-2 px-3">
          <UserRoundIcon className="size-4" />
          Account
        </TabsTrigger>
        <TabsTrigger value="portfolio" className="h-9 shrink-0 gap-2 px-3">
          <SlidersHorizontalIcon className="size-4" />
          Portfolio
        </TabsTrigger>
        <TabsTrigger value="planning" className="h-9 shrink-0 gap-2 px-3">
          <FlameIcon className="size-4" />
          Planning
        </TabsTrigger>
        <TabsTrigger value="security" className="h-9 shrink-0 gap-2 px-3">
          <ShieldCheckIcon className="size-4" />
          Data & security
        </TabsTrigger>
        <TabsTrigger value="model-keys" className="h-9 shrink-0 gap-2 px-3">
          <KeyRoundIcon className="size-4" /> Model keys
        </TabsTrigger>
      </TabsList>
      <div className="[&_[data-slot=card]]:gap-0 [&_[data-slot=card]]:py-0 [&_[data-slot=card]]:shadow-xs [&_[data-slot=card-content]]:px-4 [&_[data-slot=card-content]]:pb-4 sm:[&_[data-slot=card-content]]:px-5 sm:[&_[data-slot=card-content]]:pb-5 [&_[data-slot=card-footer]]:px-4 [&_[data-slot=card-footer]]:pb-4 sm:[&_[data-slot=card-footer]]:px-5 sm:[&_[data-slot=card-footer]]:pb-5 [&_[data-slot=card-header]]:p-4 sm:[&_[data-slot=card-header]]:p-5">
        <TabsContent value="account" className="mt-0">
          <div className="max-w-2xl">{account}</div>
        </TabsContent>
        <TabsContent value="portfolio" className="mt-0">
          <div className="grid min-w-0 gap-4 xl:grid-cols-2">{portfolio}</div>
        </TabsContent>
        <TabsContent value="planning" className="mt-0">
          {planning}
        </TabsContent>
        <TabsContent value="security" className="mt-0">
          <div className="grid min-w-0 gap-4 xl:grid-cols-2">{dataAndSecurity}</div>
        </TabsContent>
        <TabsContent value="model-keys" className="mt-0">
          {modelKeys}
        </TabsContent>
      </div>
    </Tabs>
  );
}

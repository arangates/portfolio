"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@portfolio/ui/components/tabs";
import {
  ArrowRightLeftIcon,
  BanknoteIcon,
  BuildingIcon,
  LandmarkIcon,
  ShoppingBagIcon,
  TrendingUpIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

export function AnalyticsTabs({
  wealth,
  property,
  cashFlow,
  income,
  household,
  trading,
  defaultValue = "wealth",
}: {
  wealth?: React.ReactNode;
  property?: React.ReactNode;
  cashFlow?: React.ReactNode;
  income?: React.ReactNode;
  household?: React.ReactNode;
  trading?: React.ReactNode;
  defaultValue?: string;
}) {
  const router = useRouter();

  return (
    <Tabs
      value={defaultValue}
      className="min-w-0 gap-5 px-4 lg:px-6"
      onValueChange={(value) => {
        router.push(`?tab=${value}`, { scroll: false });
      }}
    >
      <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-lg border bg-muted/40 p-1 group-data-horizontal/tabs:h-auto sm:inline-flex sm:w-auto">
        <TabsTrigger value="wealth" className="h-9 shrink-0 gap-2 px-3">
          <LandmarkIcon className="size-4" />
          Wealth structure
        </TabsTrigger>
        <TabsTrigger value="property" className="h-9 shrink-0 gap-2 px-3">
          <BuildingIcon className="size-4" />
          Real estate
        </TabsTrigger>
        <TabsTrigger value="cash-flow" className="h-9 shrink-0 gap-2 px-3">
          <ArrowRightLeftIcon className="size-4" />
          Cash flow
        </TabsTrigger>
        <TabsTrigger value="income" className="h-9 shrink-0 gap-2 px-3">
          <BanknoteIcon className="size-4" />
          Income
        </TabsTrigger>
        <TabsTrigger value="household" className="h-9 shrink-0 gap-2 px-3">
          <ShoppingBagIcon className="size-4" />
          Household
        </TabsTrigger>
        <TabsTrigger value="trading" className="h-9 shrink-0 gap-2 px-3">
          <TrendingUpIcon className="size-4" />
          Trading
        </TabsTrigger>
      </TabsList>
      <div className="mt-5 flex flex-col gap-6">
        <TabsContent value="wealth" className="mt-0">
          {wealth}
        </TabsContent>
        <TabsContent value="property" className="mt-0">
          {property}
        </TabsContent>
        <TabsContent value="cash-flow" className="mt-0">
          {cashFlow}
        </TabsContent>
        <TabsContent value="income" className="mt-0">
          {income}
        </TabsContent>
        <TabsContent value="household" className="mt-0">
          {household}
        </TabsContent>
        <TabsContent value="trading" className="mt-0">
          {trading}
        </TabsContent>
      </div>
    </Tabs>
  );
}

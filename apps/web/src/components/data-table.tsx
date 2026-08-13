"use client";

import { formatCurrency } from "@/lib/format";
import { Badge } from "@zerodha-coin/ui/components/badge";
import { Label } from "@zerodha-coin/ui/components/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@zerodha-coin/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@zerodha-coin/ui/components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@zerodha-coin/ui/components/tabs";
import { useState } from "react";

export type AssetRow = {
  key: string;
  name: string;
  category: string;
  nativeValue: number;
  currency: string;
  baseValue: number | null;
  isLiquid: boolean;
  risk: string;
  location: string;
};

function AssetRows({ assets, baseCurrency }: { assets: AssetRow[]; baseCurrency: string }) {
  return (
    <Table>
      <TableHeader className="sticky top-0 bg-muted">
        <TableRow>
          <TableHead>Asset</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Liquidity</TableHead>
          <TableHead className="text-right">Native value</TableHead>
          <TableHead className="text-right">Value in {baseCurrency}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map((asset) => (
          <TableRow key={asset.key}>
            <TableCell className="font-medium">{asset.name}</TableCell>
            <TableCell className="max-w-64 text-muted-foreground">{asset.location}</TableCell>
            <TableCell>{asset.category}</TableCell>
            <TableCell>
              <Badge variant="outline">{asset.isLiquid ? "Liquid" : "Long term"}</Badge>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCurrency(asset.nativeValue, asset.currency)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {asset.baseValue === null
                ? "FX rate needed"
                : formatCurrency(asset.baseValue, baseCurrency)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function DataTable({ assets, baseCurrency }: { assets: AssetRow[]; baseCurrency: string }) {
  const [view, setView] = useState("all");
  const visibleAssets = view === "liquid" ? assets.filter((asset) => asset.isLiquid) : assets;

  return (
    <Tabs value={view} onValueChange={(value) => setView(value ?? "all")} className="w-full gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="asset-view" className="sr-only">
          Asset view
        </Label>
        <Select value={view} onValueChange={(value) => setView(value ?? "all")}>
          <SelectTrigger className="flex w-fit @4xl/main:hidden" size="sm" id="asset-view">
            <SelectValue placeholder="All assets" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All assets</SelectItem>
              <SelectItem value="liquid">Movable assets</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <TabsList className="hidden @4xl/main:flex">
          <TabsTrigger value="all">All assets</TabsTrigger>
          <TabsTrigger value="liquid">Movable assets</TabsTrigger>
        </TabsList>
        <Badge variant="secondary">{visibleAssets.length} asset classes</Badge>
      </div>
      <TabsContent value={view} className="overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden border">
          <AssetRows assets={visibleAssets} baseCurrency={baseCurrency} />
        </div>
      </TabsContent>
    </Tabs>
  );
}

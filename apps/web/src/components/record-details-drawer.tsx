"use client";

import { Button } from "@portfolio/ui/components/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@portfolio/ui/components/drawer";
import { EyeIcon, XIcon } from "lucide-react";

type DetailItem = {
  label: string;
  value: string;
};

export function RecordDetailsDrawer({
  title,
  description,
  items,
  triggerLabel = "Details",
}: {
  title: string;
  description: string;
  items: DetailItem[];
  triggerLabel?: string;
}) {
  return (
    <Drawer swipeDirection="right">
      <DrawerTrigger
        render={
          <Button variant="ghost" size="sm" title={`View details for ${title}`}>
            <EyeIcon data-icon="inline-start" />
            {triggerLabel}
          </Button>
        }
      />
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <dl className="grid gap-4 overflow-y-auto p-4 text-sm">
          {items.map((item) => (
            <div key={item.label} className="grid gap-1 border-b pb-4 last:border-0 last:pb-0">
              <dt className="text-xs font-medium text-muted-foreground">{item.label}</dt>
              <dd className="break-words tabular-nums">{item.value}</dd>
            </div>
          ))}
        </dl>
        <DrawerFooter>
          <DrawerClose
            render={
              <Button variant="outline">
                <XIcon data-icon="inline-start" />
                Close
              </Button>
            }
          />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

"use client";

import { useState } from "react";
import { BellIcon, BellOffIcon, SendIcon } from "lucide-react";
import { toast } from "sonner";

import type { NotificationSettings } from "@/lib/push-notifications";
import { useOperationBusy } from "@/hooks/use-operation-busy";
import { Button } from "@portfolio/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@portfolio/ui/components/card";
import { Checkbox } from "@portfolio/ui/components/checkbox";
import { Label } from "@portfolio/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@portfolio/ui/components/select";

function applicationServerKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replaceAll("-", "+").replaceAll("_", "/");
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

async function post(body: unknown) {
  const response = await fetch("/api/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = (await response.json()) as {
    settings?: NotificationSettings;
    sent?: number;
    error?: string;
  };
  if (!response.ok) throw new Error(result.error ?? "Could not update notifications");
  return result;
}

export function NotificationSettingsCard({
  initialSettings,
}: {
  initialSettings: NotificationSettings;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [pending, setPending] = useState(false);
  useOperationBusy(pending);
  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  async function run(task: () => Promise<void>) {
    setPending(true);
    try {
      await task();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update notifications");
    } finally {
      setPending(false);
    }
  }

  async function enableOnDevice() {
    if (!supported) throw new Error("Push notifications are not supported in this browser");
    if (!settings.publicKey) throw new Error("Push notifications are not configured on the server");
    const permission = await Notification.requestPermission();
    if (permission !== "granted")
      throw new Error("Notification permission was not granted. Update it in browser settings.");
    const registration = await navigator.serviceWorker.getRegistration("/");
    if (!registration)
      throw new Error("Install or reload the production app before enabling notifications");
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey(settings.publicKey),
      }));
    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth)
      throw new Error("The browser returned an incomplete push subscription");
    const result = await post({ action: "subscribe", subscription: json });
    if (result.settings) setSettings(result.settings);
    toast.success("Notifications enabled on this device");
  }

  async function disableOnDevice() {
    const registration = await navigator.serviceWorker.getRegistration("/");
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      await post({ action: "unsubscribe", endpoint: subscription.endpoint });
      await subscription.unsubscribe();
    }
    setSettings((current) => ({
      ...current,
      subscriptionCount: Math.max(0, current.subscriptionCount - (subscription ? 1 : 0)),
    }));
    toast.success("Notifications disabled on this device");
  }

  async function savePreference(next: Partial<NotificationSettings>) {
    const updated = { ...settings, ...next };
    const result = await post({
      action: "preferences",
      enabled: updated.enabled,
      reminderHour: updated.reminderHour,
      daysAhead: updated.daysAhead,
    });
    setSettings(result.settings ?? updated);
  }

  const unavailable = !settings.configured || !supported;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellIcon className="size-4" /> Push notifications
        </CardTitle>
        <CardDescription>
          Private reminders for upcoming bills, contract endings and fixed-deposit maturities.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {unavailable ? (
          <p className="text-sm text-muted-foreground">
            {!settings.configured
              ? "Add the VAPID environment variables to enable push delivery."
              : "This browser does not support web push. On iPhone or iPad, install Selvam to the Home Screen first."}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => void run(enableOnDevice)}
            disabled={pending || unavailable}
          >
            <BellIcon /> Enable on this device
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void run(disableOnDevice)}
            disabled={pending || !supported}
          >
            <BellOffIcon /> Disable this device
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              void run(async () => {
                await post({ action: "test" });
                toast.success("Test notification sent");
              })
            }
            disabled={pending || settings.subscriptionCount === 0 || !settings.enabled}
          >
            <SendIcon /> Send test
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {settings.subscriptionCount} enabled{" "}
          {settings.subscriptionCount === 1 ? "device" : "devices"}
        </p>
        <div className="flex items-center gap-3 rounded-md border p-3">
          <Checkbox
            id="push-reminders-enabled"
            checked={settings.enabled}
            disabled={pending || settings.subscriptionCount === 0}
            onCheckedChange={(checked) =>
              void run(() => savePreference({ enabled: checked === true }))
            }
          />
          <Label htmlFor="push-reminders-enabled" className="flex-1">
            Send scheduled reminders
          </Label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="notification-hour">Local delivery time</Label>
            <Select
              value={String(settings.reminderHour)}
              onValueChange={(value) =>
                value !== null && void run(() => savePreference({ reminderHour: Number(value) }))
              }
              disabled={pending || !settings.enabled}
            >
              <SelectTrigger id="notification-hour" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, hour) => (
                  <SelectItem key={hour} value={String(hour)}>
                    {String(hour).padStart(2, "0")}:00
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notification-horizon">Look ahead</Label>
            <Select
              value={String(settings.daysAhead)}
              onValueChange={(value) =>
                value !== null && void run(() => savePreference({ daysAhead: Number(value) }))
              }
              disabled={pending || !settings.enabled}
            >
              <SelectTrigger id="notification-horizon" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 3, 7, 14].map((days) => (
                  <SelectItem key={days} value={String(days)}>
                    {days} {days === 1 ? "day" : "days"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Notifications show event names but no balances or amounts on the lock screen. Delivery
          uses the time zone saved in Portfolio settings.
        </p>
      </CardContent>
    </Card>
  );
}

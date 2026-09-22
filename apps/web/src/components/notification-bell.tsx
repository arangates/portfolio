"use client";

import { BellIcon, CheckIcon, InboxIcon, XIcon } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";

import { Button } from "@portfolio/ui/components/button";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  url: string;
  readAt: string | null;
  createdAt: string;
};

function relativeTime(value: string) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications/inbox", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { notifications: NotificationItem[]; unread: number };
      setItems(data.notifications);
      setUnread(data.unread);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  async function markRead(id: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, readAt: new Date().toISOString() } : item,
      ),
    );
    setUnread((current) => Math.max(0, current - 1));
    await fetch("/api/notifications/inbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read", id }),
    });
  }

  async function archiveAll() {
    await fetch("/api/notifications/inbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "archive-all" }),
    });
    setItems([]);
    setUnread(0);
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="relative"
        aria-label={unread ? `${unread} unread notifications` : "Notifications"}
        onClick={() => {
          setOpen((current) => !current);
          if (!open) void load();
        }}
      >
        <BellIcon />
        {unread > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-foreground">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </Button>
      {open ? (
        <div className="absolute top-full right-0 z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Notifications</h2>
              <p className="text-xs text-muted-foreground">{unread} unread</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpen(false)}
              aria-label="Close notifications"
            >
              <XIcon />
            </Button>
          </div>
          <div className="max-h-[min(28rem,60vh)] overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Loading notifications...
              </p>
            ) : null}
            {!loading && items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <InboxIcon className="size-7 text-muted-foreground" />
                <p className="text-sm font-medium">You&apos;re all caught up</p>
                <p className="text-xs text-muted-foreground">New reminders will appear here.</p>
              </div>
            ) : null}
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.url as Route}
                onClick={() => {
                  if (!item.readAt) void markRead(item.id);
                  setOpen(false);
                }}
                className={`flex gap-3 border-b px-4 py-3 transition-colors hover:bg-accent ${item.readAt ? "" : "bg-accent/40"}`}
              >
                <span
                  className={`mt-1 flex size-7 shrink-0 items-center justify-center rounded-full ${item.readAt ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"}`}
                >
                  {item.readAt ? <CheckIcon className="size-4" /> : <BellIcon className="size-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">{item.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {relativeTime(item.createdAt)}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">{item.body}</span>
                </span>
              </Link>
            ))}
          </div>
          <div className="flex items-center justify-between border-t px-4 py-2">
            <Link
              href="/dashboard/settings#notification-preferences"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              Notification settings
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void archiveAll()}
              disabled={!items.length}
            >
              Archive all
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

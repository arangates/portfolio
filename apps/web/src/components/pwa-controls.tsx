"use client";

import { useOperationBusy } from "@/hooks/use-operation-busy";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { DownloadIcon, RefreshCwIcon, WifiOffIcon } from "lucide-react";
import { Button } from "@portfolio/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@portfolio/ui/components/dialog";
import { hasActiveRequests } from "@/lib/app-activity";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
type PwaState = {
  install: InstallEvent | null;
  installed: boolean;
  dismissed: boolean;
  dismiss: () => void;
  clearPrompt: () => void;
  waiting: ServiceWorker | null;
  offline: boolean;
  workerError: boolean;
};
const PwaContext = createContext<PwaState>({
  install: null,
  installed: true,
  dismissed: false,
  dismiss: () => {},
  clearPrompt: () => {},
  waiting: null,
  offline: false,
  workerError: false,
});

export function PwaProvider({ children }: { children: ReactNode }) {
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [offline, setOffline] = useState(false);
  const [workerError, setWorkerError] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;
    // The actual selected app theme can differ from the operating system theme.
    const metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
    metas.forEach((meta) => {
      meta.content = resolvedTheme === "dark" ? "#171717" : "#ffffff";
    });
  }, [resolvedTheme]);

  useEffect(() => {
    const standalone = matchMedia("(display-mode: standalone)");
    const syncInstalled = () =>
      setInstalled(
        standalone.matches ||
          (navigator as Navigator & { standalone?: boolean }).standalone === true,
      );
    syncInstalled();
    try {
      setDismissed(localStorage.getItem("selvam-install-dismissed") === "true");
    } catch {
      /* Storage may be disabled. */
    }
    const offer = (event: Event) => {
      event.preventDefault();
      setInstall(event as InstallEvent);
    };
    const completed = () => {
      setInstalled(true);
      setInstall(null);
    };
    const connectivity = () => setOffline(!navigator.onLine);
    connectivity();
    window.addEventListener("beforeinstallprompt", offer);
    window.addEventListener("appinstalled", completed);
    window.addEventListener("online", connectivity);
    window.addEventListener("offline", connectivity);
    standalone.addEventListener("change", syncInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", offer);
      window.removeEventListener("appinstalled", completed);
      window.removeEventListener("online", connectivity);
      window.removeEventListener("offline", connectivity);
      standalone.removeEventListener("change", syncInstalled);
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    let disposed = false;
    let registration: ServiceWorkerRegistration | undefined;
    let installing: ServiceWorker | null = null;
    const check = () => {
      if (!disposed && registration?.waiting && navigator.serviceWorker.controller)
        setWaiting(registration.waiting);
    };
    const found = () => {
      installing?.removeEventListener("statechange", check);
      installing = registration?.installing ?? null;
      installing?.addEventListener("statechange", check);
      check();
    };
    const foreground = () => {
      if (document.visibilityState === "visible" && navigator.onLine)
        void registration?.update().catch(() => {});
    };
    void navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((result) => {
        if (disposed) return;
        registration = result;
        check();
        found();
        registration.addEventListener("updatefound", found);
        document.addEventListener("visibilitychange", foreground);
      })
      .catch(() => {
        if (!disposed) setWorkerError(true);
      });
    return () => {
      disposed = true;
      registration?.removeEventListener("updatefound", found);
      installing?.removeEventListener("statechange", check);
      document.removeEventListener("visibilitychange", foreground);
    };
  }, []);

  return (
    <PwaContext.Provider
      value={{
        install,
        installed,
        dismissed,
        waiting,
        offline,
        workerError,
        clearPrompt: () => setInstall(null),
        dismiss: () => {
          setDismissed(true);
          try {
            localStorage.setItem("selvam-install-dismissed", "true");
          } catch {
            /* Keep the in-memory preference. */
          }
        },
      }}
    >
      {children}
    </PwaContext.Provider>
  );
}

export function InstallApp({ alwaysShow = false }: { alwaysShow?: boolean }) {
  const pwa = useContext(PwaContext);
  const [open, setOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [pending, setPending] = useState(false);
  useOperationBusy(pending);
  useEffect(() => {
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
    );
  }, []);
  async function install() {
    if (!pwa.install) {
      setOpen(true);
      return;
    }
    setPending(true);
    try {
      await pwa.install.prompt();
      await pwa.install.userChoice;
    } catch {
      setOpen(true);
    } finally {
      pwa.clearPrompt();
      setPending(false);
    }
  }
  if (pwa.installed || (pwa.dismissed && !alwaysShow)) return null;
  return (
    <>
      <Button
        variant="outline"
        size={alwaysShow ? "default" : "icon"}
        onClick={install}
        disabled={pending}
        aria-label="Install Selvam"
        title="Install Selvam"
      >
        <DownloadIcon />
        {alwaysShow ? "Install Selvam" : null}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Install Selvam</DialogTitle>
            <DialogDescription>
              {isIOS
                ? "Open the browser Share menu, choose “Add to Home Screen”, then confirm Add. If that option is missing, open Selvam in Safari."
                : "Open your browser menu and look for “Install Selvam”, “Install app”, or “Add to Home Screen”. If unavailable, you can keep using Selvam in this browser."}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Launch directly into your dashboard. Financial records require a connection.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              pwa.dismiss();
              setOpen(false);
            }}
          >
            Not now
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AppStatus() {
  const { waiting, offline, workerError } = useContext(PwaContext);
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [checking, setChecking] = useState(false);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const dirty = useRef(false);
  const updating = useRef(false);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    dirty.current = false;
    setMessage(null);
    setLoadedAt(null);
  }, [pathname]);
  useEffect(() => {
    const edited = (event: Event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("form")) dirty.current = true;
    };
    const rendered = () =>
      setLoadedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!updating.current && (dirty.current || hasActiveRequests())) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const controlled = () => {
      if (updating.current) location.reload();
    };
    const workerMessage = (event: MessageEvent) => {
      if (event.data?.type === "UPDATE_BLOCKED") {
        if (finishTimer.current) clearTimeout(finishTimer.current);
        updating.current = false;
        setChecking(false);
        setMessage("Close other Selvam tabs or windows before applying the update.");
      }
    };
    document.addEventListener("input", edited);
    window.addEventListener("selvam-view-loaded", rendered);
    window.addEventListener("beforeunload", beforeUnload);
    navigator.serviceWorker?.addEventListener("controllerchange", controlled);
    navigator.serviceWorker?.addEventListener("message", workerMessage);
    return () => {
      document.removeEventListener("input", edited);
      window.removeEventListener("selvam-view-loaded", rendered);
      window.removeEventListener("beforeunload", beforeUnload);
      navigator.serviceWorker?.removeEventListener("controllerchange", controlled);
      navigator.serviceWorker?.removeEventListener("message", workerMessage);
      if (finishTimer.current) clearTimeout(finishTimer.current);
    };
  }, []);
  function canReload() {
    if (hasActiveRequests() || document.querySelector('[role="dialog"], [aria-busy="true"] form')) {
      setMessage("Finish the open form or import before refreshing or updating.");
      return false;
    }
    if (dirty.current) {
      // Explicitly review potential unsaved edits. Never discard them automatically.
      if (!window.confirm("Refreshing may discard unsaved changes. Continue?")) return false;
      dirty.current = false;
    }
    return true;
  }
  async function refresh() {
    if (!canReload()) return;
    setChecking(true);
    setMessage(null);
    try {
      const response = await fetch("/api/connection", {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error("Connection failed");
      startTransition(() => router.refresh());
    } catch {
      setMessage("Unable to reach Selvam. Check your connection and try again.");
    } finally {
      setChecking(false);
    }
  }
  function update() {
    if (!waiting || !canReload()) return;
    if (finishTimer.current) clearTimeout(finishTimer.current);
    updating.current = true;
    setChecking(true);
    setMessage(null);
    waiting.postMessage({ type: "APPLY_UPDATE" });
    finishTimer.current = setTimeout(() => {
      updating.current = false;
      setChecking(false);
      setMessage("Update did not finish. Try again when connected.");
    }, 15000);
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b bg-muted/20 px-4 py-1.5 text-xs text-muted-foreground lg:px-6">
      <div role="status" className="flex min-w-0 flex-1 items-center gap-2">
        {offline ? <WifiOffIcon className="size-3.5 shrink-0" /> : null}
        <span>
          {message ??
            (offline
              ? "Offline · displayed data may be out of date"
              : pending || checking
                ? "Refreshing…"
                : waiting
                  ? "An app update is available"
                  : loadedAt
                    ? `View loaded ${loadedAt} · valuation dates are shown with your data`
                    : "Valuation dates are shown with your data")}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {workerError ? <span>Offline support unavailable</span> : null}
        {waiting ? (
          <Button
            size="sm"
            variant="outline"
            disabled={offline || checking || pending}
            onClick={update}
          >
            Update app
          </Button>
        ) : null}
        <Button
          size="icon"
          variant="ghost"
          disabled={offline || checking || pending}
          onClick={refresh}
          aria-label="Refresh data"
          title="Refresh data"
        >
          <RefreshCwIcon className={pending || checking ? "motion-safe:animate-spin" : ""} />
        </Button>
      </div>
    </div>
  );
}

/** Runs after the server-rendered route commits, including an explicit refresh. */
export function ViewLoaded({ requestId }: { requestId: string }) {
  useEffect(() => {
    const timer = setTimeout(() => window.dispatchEvent(new Event("selvam-view-loaded")), 0);
    return () => clearTimeout(timer);
  }, [requestId]);
  return null;
}

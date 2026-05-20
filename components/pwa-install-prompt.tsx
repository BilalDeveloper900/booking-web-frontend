"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DISMISSED_KEY = "bookitdaily.pwa.dismissed";
const DISMISSED_TTL_DAYS = 30;

/**
 * Browser shape for the `beforeinstallprompt` event. Chrome/Edge/Brave fire this
 * on installable pages. iOS Safari does NOT — for iOS we fall back to a hint card.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: readonly string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari home-screen apps set this on navigator.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}

function wasRecentlyDismissed() {
  try {
    const at = localStorage.getItem(DISMISSED_KEY);
    if (!at) return false;
    const ageMs = Date.now() - Number(at);
    return ageMs < DISMISSED_TTL_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function PWAInstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (isStandalone() || wasRecentlyDismissed()) {
      setHidden(true);
      return;
    }

    function onPrompt(e: Event) {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
      setHidden(false);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS-only fallback: show the manual "Add to Home Screen" hint after 4s.
    let iosTimer: ReturnType<typeof setTimeout> | undefined;
    if (isIOS()) {
      iosTimer = setTimeout(() => {
        setShowIosHint(true);
        setHidden(false);
      }, 4000);
    }

    function onInstalled() {
      setHidden(true);
      setEvent(null);
      setShowIosHint(false);
    }
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  function dismiss() {
    setHidden(true);
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      /* localStorage may be blocked — ignore. */
    }
  }

  async function install() {
    if (!event) return;
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === "accepted") {
      setHidden(true);
      setEvent(null);
    }
  }

  if (hidden) return null;
  if (!event && !showIosHint) return null;

  return (
    <div
      role="dialog"
      aria-label="Install Book It Daily"
      className={cn(
        "fixed left-1/2 -translate-x-1/2 z-50 w-[min(92vw,380px)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-300",
        // Mobile: above the bottom tab bar. Desktop: bottom-right.
        "bottom-[calc(env(safe-area-inset-bottom)+72px)] lg:bottom-6 lg:right-6 lg:translate-x-0 lg:left-auto"
      )}
    >
      <div className="bg-card border border-border rounded-xl shadow-overlay p-4 flex items-start gap-3">
        <span className="w-10 h-10 rounded-lg bg-foreground text-background grid place-items-center shrink-0 font-serif text-lg leading-none">
          B
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold mb-0.5">Install Book It Daily</div>
          {showIosHint && !event ? (
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Tap <span aria-hidden>⎙</span> Share, then{" "}
              <span className="font-medium text-foreground">Add to Home Screen</span> to use it
              like a native app.
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Add to your home screen for offline access and a faster, native-feel experience.
            </p>
          )}
          {event && (
            <Button size="xs" className="mt-2.5 gap-1.5" onClick={install}>
              <Download className="w-3 h-3" /> Install
            </Button>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="w-7 h-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

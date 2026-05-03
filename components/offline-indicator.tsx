"use client";

import { useEffect, useState } from "react";
import { CloudOff, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Slim banner that pops at the top of the viewport when the browser loses
 * connectivity, and shows a brief "back online" confirmation when it recovers.
 * Hides itself entirely on the very first online render so it never flickers.
 */
export function OfflineIndicator() {
  const [online, setOnline] = useState(true);
  const [justCameBack, setJustCameBack] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);

    function onOffline() {
      setOnline(false);
      setJustCameBack(false);
    }
    function onOnline() {
      setOnline(true);
      setJustCameBack(true);
      const t = setTimeout(() => setJustCameBack(false), 2500);
      return () => clearTimeout(t);
    }

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  if (online && !justCameBack) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed top-3 left-1/2 -translate-x-1/2 z-50 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-200",
        "rounded-full px-3 py-1.5 text-[12px] font-medium tabular-nums shadow-overlay flex items-center gap-2",
        online
          ? "bg-[--pos]/15 text-[--pos] border border-[--pos]/30"
          : "bg-[--neg]/15 text-[--neg] border border-[--neg]/30"
      )}
    >
      {online ? (
        <>
          <Wifi className="w-3.5 h-3.5" aria-hidden /> Back online
        </>
      ) : (
        <>
          <CloudOff className="w-3.5 h-3.5" aria-hidden /> You&rsquo;re offline · using cached
          data
        </>
      )}
    </div>
  );
}

/**
 * Web Notification API wrapper.
 *
 * - `useDesktopNotifications()` exposes the current permission state and a
 *   `request()` function that prompts the user. The Notification API only
 *   allows `requestPermission()` from a user gesture, so call `request()`
 *   from a click handler — not on mount.
 *
 * - `fireDesktopNotification()` shows a system-level notification, but only
 *   if permission is `granted`. Caller passes title, body, icon, optional
 *   tag (for de-duping repeated alerts from the same thread), and onClick.
 */
"use client";

import { useCallback, useEffect, useState } from "react";

export type PermissionState = "default" | "granted" | "denied" | "unsupported";

export function useDesktopNotifications() {
  const [permission, setPermission] = useState<PermissionState>("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  const request = useCallback(async (): Promise<PermissionState> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return "unsupported";
    }
    if (Notification.permission === "granted" || Notification.permission === "denied") {
      // Browsers don't show a fresh prompt once a decision exists.
      setPermission(Notification.permission);
      return Notification.permission;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  return { permission, request };
}

interface FireArgs {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  onClick?: () => void;
}

/** Returns true if a notification was actually fired. */
export function fireDesktopNotification(args: FireArgs): boolean {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;

  try {
    const notification = new Notification(args.title, {
      body: args.body,
      icon: args.icon ?? "/icons/maison-192.svg",
      tag: args.tag,
    });
    notification.onclick = () => {
      window.focus();
      args.onClick?.();
      notification.close();
    };
    return true;
  } catch {
    // Some browsers (older Safari, hardened modes) throw rather than no-op.
    return false;
  }
}

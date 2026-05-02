"use client";

import * as React from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  /** User's stored preference (may be "system"). */
  theme: Theme;
  /** What's actually applied right now (resolves "system" against the OS). */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export const THEME_STORAGE_KEY = "maison.theme";

/** Inline script used in <head> to apply the saved theme **before** React hydrates,
 *  so dark surfaces don't flash light on first paint. Kept in this file so the
 *  storage key + class name are defined in exactly one place. */
export const themeBootScript = `
(function(){try{
  var k='${THEME_STORAGE_KEY}';
  var s=localStorage.getItem(k)||'system';
  var d=s==='dark'||(s==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
  var c=document.documentElement.classList;
  if(d) c.add('dark'); else c.remove('dark');
  document.documentElement.style.colorScheme=d?'dark':'light';
}catch(e){}})();
`;

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Theme to use before React rehydrates the user's saved preference.
   *  Should match what the boot script applies (default "system"). */
  defaultTheme?: Theme;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: ThemeProviderProps) {
  // We can't read localStorage during SSR — start with the default and
  // sync from storage in an effect (the boot script has already painted
  // the right colors, so this is a no-op visually).
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>("light");

  // Hydrate from localStorage once on mount.
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      const initial: Theme =
        saved === "light" || saved === "dark" || saved === "system" ? saved : defaultTheme;
      const resolved = initial === "system" ? getSystemTheme() : initial;
      setThemeState(initial);
      setResolvedTheme(resolved);
      // The boot script already set the class — this just keeps state in sync.
    } catch {
      /* localStorage may be blocked (private mode, etc.) — ignore. */
    }
  }, [defaultTheme]);

  // Re-resolve when the OS theme changes, but only while the user is on "system".
  React.useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const next = mq.matches ? "dark" : "light";
      setResolvedTheme(next);
      applyTheme(next);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    const resolved = next === "system" ? getSystemTheme() : next;
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);

  const value = React.useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}

"use client";

import type { TooltipContentProps } from "recharts";

/**
 * Shared chart helpers. Recharts accepts `var(--token)` strings directly in
 * fill/stroke props, so we pass tokens through verbatim — no JS color drift.
 * See design-system/MASTER.md §2 for the token contract.
 */

export const chartTokens = {
  primary: "var(--teal-700)",
  primaryLight: "var(--teal-500)",
  secondary: "var(--sage-500)",
  secondaryLight: "oklch(0.85 0.04 195)",
  ink: "var(--ink-900)",
  inkMuted: "var(--ink-500)",
  line: "var(--line)",
  lineSoft: "var(--line-soft)",
  pos: "var(--pos)",
  neg: "var(--neg)",
  warn: "var(--warn)",
} as const;

export const axisTick = {
  fill: "var(--ink-500)",
  fontSize: 10,
  fontFamily: "var(--font-sans)",
} as const;

/** Wrap any tooltip body in this for consistent styling across charts. */
export function ChartTooltipFrame({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-popover border border-border rounded-lg shadow-overlay px-3 py-2 text-xs min-w-35 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150">
      {label && (
        <div className="text-[10px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
          {label}
        </div>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export function ChartTooltipRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-2 h-2 rounded-sm shrink-0"
        style={{ background: color }}
        aria-hidden
      />
      <span className="text-muted-foreground flex-1">{label}</span>
      <span className="tabular-nums font-medium">{value}</span>
    </div>
  );
}

export type RechartsTooltipProps = TooltipContentProps;

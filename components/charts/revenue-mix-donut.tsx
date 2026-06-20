"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatPrice, currencySymbol } from "@/lib/offers";
import { chartTokens, ChartTooltipFrame, ChartTooltipRow, type RechartsTooltipProps } from "@/components/charts/theme";

export type MixSegment = { name: string; cents: number; pct: number };

const PALETTE = [
  chartTokens.primary,
  chartTokens.primaryLight,
  chartTokens.secondary,
  chartTokens.secondaryLight,
];

type Row = { name: string; value: number; cents: number; color: string };

function makeTooltip(currency: string) {
  return function DonutTooltip({ active, payload }: RechartsTooltipProps) {
    if (!active || !payload || payload.length === 0) return null;
    const seg = payload[0].payload as Row;
    return (
      <ChartTooltipFrame label={seg.name}>
        <ChartTooltipRow color={seg.color} label="Share" value={`${seg.value}%`} />
        <ChartTooltipRow color="transparent" label="Revenue" value={formatPrice(seg.cents, currency)} />
      </ChartTooltipFrame>
    );
  };
}

/** Compact money label, e.g. €38.4k / €920. */
function shortMoney(cents: number, currency: string): string {
  const whole = cents / 100;
  if (whole >= 1000) {
    return `${currencySymbol(currency)}${(whole / 1000).toFixed(1)}k`;
  }
  return formatPrice(cents, currency);
}

export function RevenueMixDonut({
  segments,
  currency = "EUR",
  totalCents,
}: {
  segments: MixSegment[];
  currency?: string;
  totalCents: number;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const Tip = makeTooltip(currency);

  const rows: Row[] = segments.map((s, i) => ({
    name: s.name,
    value: s.pct,
    cents: s.cents,
    color: PALETTE[i % PALETTE.length],
  }));

  return (
    <div className="relative w-40 h-40 shrink-0">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={rows}
            dataKey="value"
            innerRadius={50}
            outerRadius={70}
            stroke="var(--card)"
            strokeWidth={2}
            startAngle={90}
            endAngle={-270}
            paddingAngle={1}
            onMouseEnter={(_, idx) => setActiveIndex(idx)}
            onMouseLeave={() => setActiveIndex(null)}
            animationDuration={500}
            animationBegin={100}
          >
            {rows.map((s, i) => (
              <Cell
                key={s.name}
                fill={s.color}
                opacity={activeIndex === null || activeIndex === i ? 1 : 0.4}
                style={{ transition: "opacity 150ms" }}
              />
            ))}
          </Pie>
          <Tooltip content={(props) => <Tip {...props} />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className="text-center">
          <div className="text-[22px] font-semibold tabular-nums leading-none text-foreground">
            {shortMoney(totalCents, currency)}
          </div>
          <div className="text-[9px] text-muted-foreground tracking-[0.12em] mt-1.5">
            THIS MONTH
          </div>
        </div>
      </div>
    </div>
  );
}

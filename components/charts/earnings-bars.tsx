"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { STYLIST_EARNINGS_LABELS, STYLIST_EARNINGS_WEEKLY } from "@/lib/data";
import {
  axisTick,
  chartTokens,
  ChartTooltipFrame,
  ChartTooltipRow,
  type RechartsTooltipProps,
} from "@/components/charts/theme";

const data = STYLIST_EARNINGS_WEEKLY.map((v, i) => ({
  week: STYLIST_EARNINGS_LABELS[i],
  earned: v,
}));

const fmt = (n: number) => `€${n.toLocaleString()}`;

function EarningsTooltip({ active, payload, label }: RechartsTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const earned = (payload[0]?.value as number | undefined) ?? 0;
  return (
    <ChartTooltipFrame label={label != null ? String(label) : undefined}>
      <ChartTooltipRow color={chartTokens.primary} label="Earned" value={fmt(earned)} />
    </ChartTooltipFrame>
  );
}

export function EarningsBars({ height = 200 }: { height?: number }) {
  return (
    <div style={{ height }} className="-mx-1 mt-2">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="week"
            axisLine={false}
            tickLine={false}
            tick={axisTick}
            interval={0}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            content={(props) => <EarningsTooltip {...props} />}
          />
          <Bar
            dataKey="earned"
            fill={chartTokens.primary}
            radius={[4, 4, 0, 0]}
            animationDuration={400}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

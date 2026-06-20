"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { formatPrice } from "@/lib/offers";
import {
  axisTick,
  chartTokens,
  ChartTooltipFrame,
  ChartTooltipRow,
  type RechartsTooltipProps,
} from "@/components/charts/theme";

export type EarningsPoint = { week: string; earnedCents: number };

function makeTooltip(currency: string) {
  return function EarningsTooltip({ active, payload, label }: RechartsTooltipProps) {
    if (!active || !payload || payload.length === 0) return null;
    const earned = (payload[0]?.value as number | undefined) ?? 0;
    return (
      <ChartTooltipFrame label={label != null ? String(label) : undefined}>
        <ChartTooltipRow color={chartTokens.primary} label="Earned" value={formatPrice(earned, currency)} />
      </ChartTooltipFrame>
    );
  };
}

export function EarningsBars({
  data,
  currency = "EUR",
  height = 200,
}: {
  data: EarningsPoint[];
  currency?: string;
  height?: number;
}) {
  const chartData = data.map((d) => ({ week: d.week, earned: d.earnedCents }));
  const Tip = makeTooltip(currency);

  return (
    <div style={{ height }} className="-mx-1 mt-2">
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="week" axisLine={false} tickLine={false} tick={axisTick} interval={0} />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            content={(props) => <Tip {...props} />}
          />
          <Bar dataKey="earned" fill={chartTokens.primary} radius={[4, 4, 0, 0]} animationDuration={400} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

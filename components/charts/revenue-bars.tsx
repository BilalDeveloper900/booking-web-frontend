"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { REVENUE_BARS, REVENUE_LABELS } from "@/lib/data";
import {
  axisTick,
  chartTokens,
  ChartTooltipFrame,
  ChartTooltipRow,
  type RechartsTooltipProps,
} from "@/components/charts/theme";

const data = REVENUE_BARS.map((v, i) => {
  const subs = Math.round(v * 0.62);
  return {
    month: REVENUE_LABELS[i],
    subs,
    credits: v - subs,
    total: v,
  };
});

function fmtK(value: number) {
  return `€${(value * 0.4).toFixed(1)}k`;
}

function RevenueTooltip({ active, payload, label }: RechartsTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const subs = (payload.find((p) => p.dataKey === "subs")?.value as number | undefined) ?? 0;
  const credits = (payload.find((p) => p.dataKey === "credits")?.value as number | undefined) ?? 0;
  return (
    <ChartTooltipFrame label={label != null ? String(label) : undefined}>
      <ChartTooltipRow color={chartTokens.primary} label="Subscriptions" value={fmtK(subs)} />
      <ChartTooltipRow color={chartTokens.secondary} label="Credit packs" value={fmtK(credits)} />
      <div className="h-px bg-border my-1" />
      <ChartTooltipRow color="transparent" label="Total" value={fmtK(subs + credits)} />
    </ChartTooltipFrame>
  );
}

export function RevenueBars() {
  return (
    <div className="h-55 -mx-1 mt-3">
      <ResponsiveContainer>
        <BarChart data={data} barCategoryGap={10} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={axisTick}
            interval={0}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            content={(props) => <RevenueTooltip {...props} />}
          />
          <Bar dataKey="subs" stackId="a" fill={chartTokens.primary} animationDuration={400} />
          <Bar dataKey="credits" stackId="a" fill={chartTokens.secondary} radius={[4, 4, 0, 0]} animationDuration={400} animationBegin={120} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

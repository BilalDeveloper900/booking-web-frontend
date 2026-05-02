"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FINANCE_INCOMING, FINANCE_MONTHS, FINANCE_OUTGOING } from "@/lib/data";
import {
  axisTick,
  chartTokens,
  ChartTooltipFrame,
  ChartTooltipRow,
  type RechartsTooltipProps,
} from "@/components/charts/theme";

const data = FINANCE_MONTHS.map((m, i) => ({
  month: m,
  incoming: FINANCE_INCOMING[i] ?? 0,
  outgoing: FINANCE_OUTGOING[i] ?? 0,
  net: (FINANCE_INCOMING[i] ?? 0) - (FINANCE_OUTGOING[i] ?? 0),
}));

const fmt = (n: number) => `€${n.toLocaleString()}`;

function FlowTooltip({ active, payload, label }: RechartsTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const incoming = (payload.find((p) => p.dataKey === "incoming")?.value as number | undefined) ?? 0;
  const outgoing = (payload.find((p) => p.dataKey === "outgoing")?.value as number | undefined) ?? 0;
  const net = incoming - outgoing;
  return (
    <ChartTooltipFrame label={label != null ? String(label) : undefined}>
      <ChartTooltipRow color={chartTokens.primary} label="Incoming" value={fmt(incoming)} />
      <ChartTooltipRow color={chartTokens.neg} label="Outgoing" value={fmt(outgoing)} />
      <div className="h-px bg-border my-1" />
      <ChartTooltipRow color="transparent" label="Net" value={fmt(net)} />
    </ChartTooltipFrame>
  );
}

export function FlowChart() {
  return (
    <div className="h-60 -mx-2 mt-2">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="incFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartTokens.primary} stopOpacity={0.18} />
              <stop offset="100%" stopColor={chartTokens.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--line-soft)" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={axisTick}
            interval={0}
          />
          <YAxis hide domain={[0, "dataMax + 4000"]} />
          <Tooltip
            cursor={{ stroke: "var(--ink-300)", strokeDasharray: "3 3" }}
            content={(props) => <FlowTooltip {...props} />}
          />
          <Area
            type="monotone"
            dataKey="incoming"
            stroke={chartTokens.primary}
            strokeWidth={2}
            fill="url(#incFill)"
            dot={{ fill: chartTokens.primary, r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
            animationDuration={500}
          />
          <Line
            type="monotone"
            dataKey="outgoing"
            stroke={chartTokens.neg}
            strokeWidth={2}
            strokeDasharray="4 3"
            opacity={0.7}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
            animationDuration={500}
            animationBegin={150}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

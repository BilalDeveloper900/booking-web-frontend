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
import { formatPrice } from "@/lib/offers";
import {
  axisTick,
  chartTokens,
  ChartTooltipFrame,
  ChartTooltipRow,
  type RechartsTooltipProps,
} from "@/components/charts/theme";

export type FlowPoint = { month: string; incomingCents: number; outgoingCents: number };

function makeTooltip(currency: string) {
  return function FlowTooltip({ active, payload, label }: RechartsTooltipProps) {
    if (!active || !payload || payload.length === 0) return null;
    const incoming = (payload.find((p) => p.dataKey === "incoming")?.value as number | undefined) ?? 0;
    const outgoing = (payload.find((p) => p.dataKey === "outgoing")?.value as number | undefined) ?? 0;
    const net = incoming - outgoing;
    return (
      <ChartTooltipFrame label={label != null ? String(label) : undefined}>
        <ChartTooltipRow color={chartTokens.primary} label="Incoming" value={formatPrice(incoming, currency)} />
        <ChartTooltipRow color={chartTokens.neg} label="Outgoing" value={formatPrice(outgoing, currency)} />
        <div className="h-px bg-border my-1" />
        <ChartTooltipRow color="transparent" label="Net" value={formatPrice(net, currency)} />
      </ChartTooltipFrame>
    );
  };
}

export function FlowChart({
  data,
  currency = "EUR",
}: {
  data: FlowPoint[];
  currency?: string;
}) {
  const chartData = data.map((p) => ({
    month: p.month,
    incoming: p.incomingCents,
    outgoing: p.outgoingCents,
  }));
  const Tip = makeTooltip(currency);

  return (
    <div className="h-60 -mx-2 mt-2">
      <ResponsiveContainer>
        <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="incFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartTokens.primary} stopOpacity={0.18} />
              <stop offset="100%" stopColor={chartTokens.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--line-soft)" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={axisTick} interval={0} />
          <YAxis hide domain={[0, "dataMax + 4000"]} />
          <Tooltip
            cursor={{ stroke: "var(--ink-300)", strokeDasharray: "3 3" }}
            content={(props) => <Tip {...props} />}
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

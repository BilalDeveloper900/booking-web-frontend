"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { chartTokens, ChartTooltipFrame, ChartTooltipRow, type RechartsTooltipProps } from "@/components/charts/theme";

const SEGMENTS = [
  { name: "Studio subscriptions", value: 38, amount: 14620, color: chartTokens.primary },
  { name: "Atelier subscriptions", value: 26, amount: 9840, color: chartTokens.primaryLight },
  { name: "Credit packs", value: 21, amount: 8210, color: chartTokens.secondary },
  { name: "Pay-as-you-go", value: 15, amount: 5750, color: chartTokens.secondaryLight },
] as const;

function DonutTooltip({ active, payload }: RechartsTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const seg = payload[0].payload as (typeof SEGMENTS)[number];
  return (
    <ChartTooltipFrame label={seg.name}>
      <ChartTooltipRow color={seg.color} label="Share" value={`${seg.value}%`} />
      <ChartTooltipRow color="transparent" label="Revenue" value={`€${seg.amount.toLocaleString()}`} />
    </ChartTooltipFrame>
  );
}

export function RevenueMixDonut() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div className="relative w-40 h-40 shrink-0">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={SEGMENTS as unknown as { name: string; value: number; amount: number; color: string }[]}
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
            {SEGMENTS.map((s, i) => (
              <Cell
                key={s.name}
                fill={s.color}
                opacity={activeIndex === null || activeIndex === i ? 1 : 0.4}
                style={{ transition: "opacity 150ms" }}
              />
            ))}
          </Pie>
          <Tooltip content={(props) => <DonutTooltip {...props} />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className="text-center">
          <div className="text-[22px] font-semibold tabular-nums leading-none text-foreground">
            €38.4k
          </div>
          <div className="text-[9px] text-muted-foreground tracking-[0.12em] mt-1.5">
            THIS MONTH
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Filter, ArrowUpRight, Plus, Search, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatBlock, PersonCell, Pill } from "@/components/shared";
import { CLIENTS } from "@/lib/data";
import { cn } from "@/lib/utils";

const FILTERS = ["All", "Subscribers", "Pay-as-you-go", "Lapsed"] as const;
type Filter = (typeof FILTERS)[number];

export function ClientsScreen() {
  const [filter, setFilter] = useState<Filter>("All");

  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="flex items-start mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-[24px] font-semibold tracking-tight leading-tight">Clients</h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            312 total · 186 active subscribers · 28 new this month
          </p>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-3.5 h-3.5" /> All plans
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowUpRight className="w-3.5 h-3.5" /> Export
          </Button>
          <Button size="sm" className="gap-2">
            <Plus className="w-3.5 h-3.5" /> Invite client
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatBlock label="Active" value="186" foot="of 312 total" hero />
        <StatBlock label="Low credits" value="14" foot="< 2 remaining" />
        <StatBlock label="Lapsed (60d)" value="22" foot="re-engagement queued" />
        <StatBlock label="Avg LTV" value="2,140" unit="€" foot="across all plans" />
      </div>

      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="flex items-center px-6 py-4 border-b border-border gap-4 flex-wrap">
          <button
            type="button"
            aria-label="Search clients"
            className="flex items-center gap-2 bg-muted/70 hover:bg-muted px-3 py-1.5 rounded-lg max-w-[320px] flex-1 motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card text-left"
          >
            <Search className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
            <span className="text-[13px] text-muted-foreground">Search clients…</span>
          </button>
          <div className="flex-1" />
          <div role="tablist" className="flex items-center gap-0.5 p-0.5 bg-muted rounded-lg">
            {FILTERS.map((t) => {
              const active = filter === t;
              return (
                <button
                  key={t}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(t)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-md motion-safe:transition-all motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-card text-foreground shadow-sm font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3 pl-6">Client</th>
              <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">Plan</th>
              <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">Credits</th>
              <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">Stylist</th>
              <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">Last visit</th>
              <th className="text-right text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">LTV</th>
              <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">Status</th>
              <th className="pb-3 pt-3 pr-4" />
            </tr>
          </thead>
          <tbody>
            {CLIENTS.map((c) => (
              <tr
                key={c.name}
                className="border-b border-[--line-soft] last:border-0 hover:bg-muted/40 motion-safe:transition-colors motion-safe:duration-150"
              >
                <td className="py-3.5 pl-6"><PersonCell name={c.name} hue={c.hue} /></td>
                <td className="text-xs text-muted-foreground">{c.plan}</td>
                <td><CreditsCell value={c.credits} /></td>
                <td className="text-xs text-muted-foreground">{c.trainer}</td>
                <td className="text-xs text-muted-foreground">{c.last}</td>
                <td className="text-right tabular-nums">€{c.ltv.toLocaleString()}</td>
                <td>
                  {c.status === "active" && <Pill kind="sage" dot>Active</Pill>}
                  {c.status === "low" && <Pill kind="warn" dot>Low credits</Pill>}
                  {c.status === "lapsed" && <Pill dot>Lapsed</Pill>}
                </td>
                <td className="pr-4">
                  <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${c.name}`}>
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center px-6 py-3.5 border-t border-border text-xs text-muted-foreground">
          <span>Showing 8 of 312</span>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon-sm" aria-label="Previous page">
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="icon-sm" aria-label="Next page">
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreditsCell({ value }: { value: number }) {
  const max = 12;
  const pct = Math.min(100, (value / max) * 100);
  const color = value === 0 ? "var(--neg)" : value <= 2 ? "var(--warn)" : "var(--teal-700)";
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1.25 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span
        className="text-xs tabular-nums"
        style={{
          color: value === 0 ? "var(--neg)" : "var(--ink-900)",
          fontWeight: value <= 2 ? 600 : 400,
        }}
      >
        {value}
      </span>
    </div>
  );
}

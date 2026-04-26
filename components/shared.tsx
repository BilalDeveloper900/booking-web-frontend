import { cn, getInitials } from "@/lib/utils";

export function HueAvatar({ name, hue, size = 28 }: { name: string; hue: number; size?: number }) {
  return (
    <div
      className="rounded-full grid place-items-center text-white font-semibold shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.39,
        background: `linear-gradient(135deg, oklch(0.7 0.08 ${hue}), oklch(0.55 0.07 ${hue + 30}))`,
      }}
    >
      {getInitials(name)}
    </div>
  );
}

export function PersonCell({ name, meta, hue }: { name: string; meta?: string; hue: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <HueAvatar name={name} hue={hue} />
      <div>
        <div className="text-[13px] font-medium">{name}</div>
        {meta && <div className="text-[11px] text-muted-foreground">{meta}</div>}
      </div>
    </div>
  );
}

export function Pill({ kind, dot, children }: { kind?: string; dot?: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full font-medium tracking-tight",
        kind === "teal" && "bg-[--teal-100] text-[--teal-900]",
        kind === "sage" && "bg-[--sage-100] text-[oklch(0.4_0.05_165)]",
        kind === "warn" && "bg-[oklch(0.96_0.04_70)] text-[oklch(0.45_0.1_60)]",
        !kind && "bg-muted text-muted-foreground"
      )}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function UtilBar({ value }: { value: number }) {
  const color = value > 80 ? "var(--teal-700)" : value > 65 ? "var(--sage-500)" : "var(--warn)";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{value}%</span>
    </div>
  );
}

export function StatBlock({
  label,
  value,
  unit,
  delta,
  deltaKind = "pos",
  foot,
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  deltaKind?: "pos" | "neg";
  foot: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-[18px]">
      <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-3.5">
        {label}
      </div>
      <div className="text-[28px] font-semibold tracking-tight leading-none tabular-nums">
        {value}
        {unit && <span className="text-sm text-muted-foreground ml-0.5">{unit}</span>}
      </div>
      <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
        {delta && (
          <span className={cn("font-medium tabular-nums", deltaKind === "pos" ? "text-[--pos]" : "text-[--neg]")}>
            {deltaKind === "pos" ? "↑" : "↓"} {delta}
          </span>
        )}
        <span>{foot}</span>
      </div>
    </div>
  );
}

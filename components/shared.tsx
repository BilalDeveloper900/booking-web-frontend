import { TrendingUp, TrendingDown } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

export function HueAvatar({
  name,
  hue,
  size = 28,
  src,
}: {
  name: string;
  hue: number;
  size?: number;
  /** When set, the uploaded photo is shown; the hue gradient + initials remain
   * the fallback (used before the image loads or when no photo exists). */
  src?: string | null;
}) {
  return (
    <div
      className="relative rounded-full grid place-items-center text-white font-semibold shrink-0 overflow-hidden"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.39,
        background: `linear-gradient(135deg, oklch(0.7 0.08 ${hue}), oklch(0.55 0.07 ${hue + 30}))`,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)",
      }}
    >
      {getInitials(name)}
      {src && (
        // eslint-disable-next-line @next/next/no-img-element -- dynamic Supabase
        // Storage URL; using next/image would require remotePatterns config.
        <img
          src={src}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
      )}
    </div>
  );
}

export function PersonCell({ name, meta, hue }: { name: string; meta?: string; hue: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <HueAvatar name={name} hue={hue} />
      <div className="min-w-0">
        <div className="text-[13px] font-medium leading-tight truncate">{name}</div>
        {meta && <div className="text-[11px] text-muted-foreground truncate">{meta}</div>}
      </div>
    </div>
  );
}

export function Pill({ kind, dot, children }: { kind?: string; dot?: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full font-medium tracking-tight motion-safe:transition-colors motion-safe:duration-150",
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
        <div
          className="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out"
          style={{ width: `${value}%`, background: color }}
        />
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
  hero = false,
  loading = false,
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  deltaKind?: "pos" | "neg";
  foot: string;
  hero?: boolean;
  /** When true, render skeleton bars in place of value + footer text.
   * The label stays visible so the user knows which stat is loading. */
  loading?: boolean;
}) {
  const TrendIcon = deltaKind === "pos" ? TrendingUp : TrendingDown;
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-[18px] motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-px",
        hero ? "shadow-hero hover:shadow-overlay" : "shadow-card hover:shadow-hero"
      )}
    >
      <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-3.5">
        {label}
      </div>
      {loading ? (
        <>
          <div
            className={cn(
              "rounded bg-muted motion-safe:animate-pulse motion-safe:duration-1000",
              hero ? "h-8 w-24" : "h-7 w-20"
            )}
            aria-hidden
          />
          <div
            className="mt-3 h-2.5 w-28 rounded-full bg-muted motion-safe:animate-pulse motion-safe:duration-1000"
            aria-hidden
          />
        </>
      ) : (
        <>
          <div
            className={cn(
              "font-semibold tracking-tight leading-none tabular-nums",
              hero ? "text-[32px]" : "text-[28px]"
            )}
          >
            {value}
            {unit && (
              <span className="text-sm text-muted-foreground ml-0.5 font-normal">
                {unit}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
            {delta && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-medium tabular-nums",
                  deltaKind === "pos" ? "text-[--pos]" : "text-[--neg]"
                )}
              >
                <TrendIcon className="w-3 h-3" aria-hidden />
                {delta}
              </span>
            )}
            <span>{foot}</span>
          </div>
        </>
      )}
    </div>
  );
}

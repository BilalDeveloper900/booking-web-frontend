/**
 * Skeleton primitives. One source of truth for "what does loading look like
 * in this app?" — pulled out so every screen feels the same.
 *
 * Rule of thumb:
 *   - Match the shape of the real content, not just its size. Skeletons
 *     should slot into the final layout without causing CLS.
 *   - One subtle motion-safe pulse — no shimmer animation.
 *   - For submit buttons, use Loader2 + animate-spin instead (this file
 *     has nothing to do with that flow).
 *   - Don't show a skeleton AND an empty state at the same time. Caller
 *     gates with `loading ? <Skeleton/> : data.length === 0 ? <Empty/> :
 *     <Content/>`.
 */
import { cn } from "@/lib/utils";

/* ────────── Base ────────── */

/** Bare pulsing rectangle. Width/height come from caller. */
export function Skeleton({ className, ...rest }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn(
        "rounded-md bg-muted motion-safe:animate-pulse motion-safe:duration-1000",
        className
      )}
      {...rest}
    />
  );
}

/** Text-line shaped skeleton. `w` is a Tailwind width class. */
export function SkeletonLine({
  w = "w-24",
  h = "h-3",
  className,
}: {
  w?: string;
  h?: string;
  className?: string;
}) {
  return <Skeleton className={cn("rounded-full", w, h, className)} />;
}

/** Avatar circle skeleton. */
export function SkeletonAvatar({ size = 36 }: { size?: number }) {
  return (
    <Skeleton
      className="rounded-full shrink-0"
      style={{ width: size, height: size }}
    />
  );
}

/* ────────── StatBlock ────────── */

/** Mirrors the layout of <StatBlock>: label bar on top, big value bar,
 * small subtitle bar. Use 4 of these in the same grid as the real stats. */
export function StatBlockSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 lg:p-5">
      <SkeletonLine w="w-16" h="h-2.5" />
      <Skeleton className="w-20 h-7 mt-3 rounded" />
      <SkeletonLine w="w-24" h="h-2.5" className="mt-3" />
    </div>
  );
}

export function StatBlockSkeletonRow({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatBlockSkeleton key={i} />
      ))}
    </div>
  );
}

/* ────────── Table ────────── */

/** Skeleton tbody rows for any data table. Caller passes the column count so
 * the cells align with the headers. */
export function TableSkeletonRows({
  rows = 6,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-[--line-soft] last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="py-3.5 px-3 first:pl-6 last:pr-6">
              {c === 0 ? (
                // First column usually has an avatar + 2 lines (person cell).
                <div className="flex items-center gap-2.5">
                  <SkeletonAvatar size={28} />
                  <div className="space-y-1.5">
                    <SkeletonLine w="w-28" h="h-2.5" />
                    <SkeletonLine w="w-16" h="h-2" />
                  </div>
                </div>
              ) : (
                <SkeletonLine
                  w={c === cols - 1 ? "w-16" : "w-20"}
                  h="h-2.5"
                />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ────────── List items ────────── */

/** Avatar + 2 lines + right-aligned bar. Used for any "person list" — thread
 * list, recent activity, etc. */
export function AvatarLineSkeleton({
  trailing = true,
}: {
  /** Show a small right-aligned bar (timestamp, unread count, etc). */
  trailing?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <SkeletonAvatar size={36} />
      <div className="flex-1 min-w-0 space-y-1.5">
        <SkeletonLine w="w-32" h="h-3" />
        <SkeletonLine w="w-44" h="h-2.5" />
      </div>
      {trailing && <SkeletonLine w="w-10" h="h-2" />}
    </div>
  );
}

/** Generic content card skeleton — wraps in border + radius so it lives
 * directly inside a list/grid container. */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl p-4 space-y-3",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <SkeletonAvatar size={32} />
        <div className="flex-1 space-y-1.5">
          <SkeletonLine w="w-32" h="h-3" />
          <SkeletonLine w="w-24" h="h-2.5" />
        </div>
      </div>
      <SkeletonLine w="w-full" h="h-2.5" />
      <SkeletonLine w="w-3/4" h="h-2.5" />
    </div>
  );
}

/* ────────── Charts ────────── */

/** Sized placeholder for a chart container. Prevents the recharts
 * "width(-1)/height(-1)" warning by giving the chart slot a known box even
 * while data is loading. */
export function ChartSkeleton({
  height = 220,
  bars = 12,
}: {
  height?: number;
  bars?: number;
}) {
  // Pseudo-random but stable bar heights derived from index so the
  // skeleton doesn't shimmy on re-renders.
  return (
    <div className="w-full" style={{ height }}>
      <div className="h-full flex items-end gap-2 pt-2 pb-6 relative">
        {Array.from({ length: bars }).map((_, i) => {
          const pct = 30 + ((i * 37) % 60); // 30-90%
          return (
            <Skeleton
              key={i}
              className="flex-1 rounded-t-sm rounded-b-none"
              style={{ height: `${pct}%` }}
            />
          );
        })}
        {/* axis line */}
        <div className="absolute left-0 right-0 bottom-5 h-px bg-border" />
      </div>
    </div>
  );
}

/* ────────── Chat ────────── */

/** Single chat bubble skeleton; alternates side via fromMe flag. */
export function BubbleSkeleton({
  fromMe = false,
  widthClass = "w-48",
}: {
  fromMe?: boolean;
  widthClass?: string;
}) {
  return (
    <div className={cn("flex", fromMe ? "justify-end" : "justify-start")}>
      <Skeleton
        className={cn(
          "rounded-2xl",
          widthClass,
          "h-10",
          fromMe ? "rounded-br-md" : "rounded-bl-md"
        )}
      />
    </div>
  );
}

/** Realistic-looking chat thread (alternating sides, varying widths). */
export function ConversationSkeleton({ count = 5 }: { count?: number }) {
  const widths = ["w-32", "w-48", "w-40", "w-56", "w-36", "w-44"];
  return (
    <div className="flex-1 overflow-hidden p-4 lg:p-6 space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <BubbleSkeleton
          key={i}
          fromMe={i % 2 === 1}
          widthClass={widths[i % widths.length]}
        />
      ))}
    </div>
  );
}

/** Skeleton list for the messages-inbox sidebar. */
export function ThreadListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-[--line-soft]">
      {Array.from({ length: count }).map((_, i) => (
        <AvatarLineSkeleton key={i} />
      ))}
    </div>
  );
}

/* ────────── Calendar ────────── */

/** Faded event block placeholder. Position with absolute parent. */
export function CalendarEventSkeleton({
  top,
  height,
  hue = 200,
}: {
  top: number;
  height: number;
  hue?: number;
}) {
  return (
    <div
      className="absolute left-1 right-1 rounded overflow-hidden motion-safe:animate-pulse motion-safe:duration-1000 px-2 py-1.5 space-y-1"
      style={{
        top,
        height,
        background: `oklch(0.95 0.03 ${hue})`,
        borderLeft: `3px solid oklch(0.55 0.08 ${hue})`,
        opacity: 0.5,
      }}
      aria-hidden
    >
      <div className="w-2/3 h-2 rounded-full bg-foreground/15" />
      <div className="w-1/2 h-1.5 rounded-full bg-foreground/10" />
    </div>
  );
}

/* ────────── Booking summary ────────── */

/** Mirrors the right-rail "Booking summary" card on /client/book. */
export function BookingSummarySkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <SkeletonLine w="w-32" h="h-3" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <SkeletonLine w="w-20" h="h-2.5" />
          <SkeletonLine w="w-24" h="h-2.5" />
        </div>
      ))}
      <Skeleton className="w-full h-10 rounded-lg" />
    </div>
  );
}

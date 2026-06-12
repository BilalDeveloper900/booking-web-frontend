"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Product-truth stat strip with a count-up that plays once on first view.
 * Numbers are claims about the product, not invented usage metrics.
 * Reduced-motion users (and no-IO browsers) see final values immediately.
 */

const STATS = [
  { value: 100, suffix: "%", label: "of client revenue stays yours" },
  { value: 0, suffix: "%", label: "transaction fees, ever" },
  { value: 3, suffix: "", label: "roles — owner, staff, client — one app" },
  { value: 14, suffix: "-day", label: "free trial on every paid plan" },
] as const;

const DURATION = 900;

function useCountUp(target: number, play: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!play) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    if (reduced) {
      raf = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(raf);
    }
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setValue(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [play, target]);
  return value;
}

function Stat({ value, suffix, label, play }: (typeof STATS)[number] & { play: boolean }) {
  const n = useCountUp(value, play);
  return (
    <div className="text-center px-4">
      <div className="text-[28px] md:text-[36px] font-semibold tracking-tight tabular-nums text-[--teal-700]">
        {n}
        {suffix}
      </div>
      <div className="text-[12px] text-muted-foreground leading-snug max-w-[180px] mx-auto">{label}</div>
    </div>
  );
}

export function StatsStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // No IO support: reveal on the next frame (async, mirrors Reveal).
      const raf = requestAnimationFrame(() => setPlay(true));
      return () => cancelAnimationFrame(raf);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPlay(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="grid grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-4 divide-x-0 lg:divide-x divide-[--line-soft]"
    >
      {STATS.map((s) => (
        <Stat key={s.label} {...s} play={play} />
      ))}
    </div>
  );
}

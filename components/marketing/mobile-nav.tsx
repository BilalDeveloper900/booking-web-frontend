"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/#demo", label: "Live demo" },
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#offers", label: "Offers" },
  { href: "/#faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * Mobile-only disclosure menu for the marketing header. Closes on
 * navigation, outside tap, and Escape. Desktop keeps the inline nav.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close whenever the route changes (anchor taps close via onClick).
  // Official "adjust state during render" pattern — no effect needed.
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="marketing-mobile-nav"
        onClick={() => setOpen((o) => !o)}
        className="grid place-items-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {open ? <X className="w-5 h-5" aria-hidden /> : <Menu className="w-5 h-5" aria-hidden />}
      </button>

      {open && (
        <nav
          id="marketing-mobile-nav"
          aria-label="Main"
          className="bid-pop absolute left-0 right-0 top-16 border-b border-border bg-card/95 backdrop-blur shadow-overlay"
        >
          <ul className="max-w-6xl mx-auto px-4 py-2">
            {LINKS.map((l) => (
              <li key={l.href} className="border-b border-[--line-soft] last:border-0">
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block py-3 text-[15px] font-medium text-foreground/90 hover:text-foreground",
                    "motion-safe:transition-colors motion-safe:duration-150"
                  )}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}

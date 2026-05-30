import Link from "next/link";
import { Wallet } from "lucide-react";

/**
 * Shared marketing footer. Surfaces the legal pages (terms, privacy, refund)
 * so they're reachable from every public page — a requirement for payment-
 * provider verification (Paddle).
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 flex flex-col gap-6">
        <div className="flex items-center gap-x-5 gap-y-2 flex-wrap text-[12px] text-muted-foreground">
          <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link href="/refund-policy" className="hover:text-foreground">Refund Policy</Link>
          <span className="hidden md:inline opacity-40">·</span>
          <Link href="/owner" className="hover:text-foreground">Owner demo</Link>
          <Link href="/admin" className="hover:text-foreground">Admin demo</Link>
          <Link href="/client" className="hover:text-foreground">Client demo</Link>
        </div>
        <div className="flex items-center gap-4 flex-wrap text-[12px] text-muted-foreground border-t border-border pt-6">
          <span>© 2026 Book It Daily</span>
          <span className="hidden md:inline opacity-40">·</span>
          <a href="mailto:bookitdaily@gmail.com" className="hover:text-foreground">bookitdaily@gmail.com</a>
          <span className="flex-1" />
          <Wallet className="w-3.5 h-3.5" aria-hidden />
          <span>Billing powered by Paddle</span>
        </div>
      </div>
    </footer>
  );
}

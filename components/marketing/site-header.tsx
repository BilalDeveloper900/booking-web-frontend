import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

/**
 * Shared marketing top-nav used by the landing page and the public
 * legal/pricing pages. In-page anchors point at the landing page
 * (`/#features`) so they work from any route.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-md bg-foreground grid place-items-center text-background font-serif text-lg leading-none motion-safe:transition-transform motion-safe:duration-200 group-hover:rotate-[-4deg]">
            B
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Book It Daily</span>
        </Link>
        <nav className="hidden md:flex items-center gap-5 text-sm text-muted-foreground">
          <Link href="/#features" className="hover:text-foreground motion-safe:transition-colors">Features</Link>
          <Link href="/pricing" className="hover:text-foreground motion-safe:transition-colors">Pricing</Link>
          <Link href="/#offers" className="hover:text-foreground motion-safe:transition-colors">Offers</Link>
          <Link href="/#faq" className="hover:text-foreground motion-safe:transition-colors">FAQ</Link>
        </nav>
        <div className="flex-1" />
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:text-foreground motion-safe:transition-colors"
        >
          Sign in
        </Link>
        <Link href="/signup" className={buttonVariants({ size: "sm" })}>
          Start free
        </Link>
      </div>
    </header>
  );
}

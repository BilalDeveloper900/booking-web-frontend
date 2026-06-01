import Link from "next/link";
import { Wallet } from "lucide-react";

const PRODUCT_LINKS = [
  { href: "/pricing", label: "Pricing" },
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

const LEGAL_LINKS = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/refund-policy", label: "Refund Policy" },
];

const DEMO_LINKS = [
  { href: "/owner", label: "Owner demo" },
  { href: "/admin", label: "Admin demo" },
  { href: "/client", label: "Client demo" },
];

/**
 * Shared marketing footer. Surfaces the legal pages (terms, privacy, refund)
 * so they're reachable from every public page — a requirement for payment-
 * provider verification (Paddle).
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 group w-fit">
              <div className="w-8 h-8 rounded-md bg-foreground grid place-items-center text-background font-serif text-lg leading-none">
                B
              </div>
              <span className="text-[15px] font-semibold tracking-tight">Book It Daily</span>
            </Link>
            <p className="text-[12px] text-muted-foreground leading-relaxed mt-3 max-w-[28ch]">
              Booking & memberships for yoga, pilates, gyms, and personal trainers.
            </p>
          </div>

          <FooterColumn title="Product" links={PRODUCT_LINKS} />
          <FooterColumn title="Legal" links={LEGAL_LINKS} />
          <FooterColumn title="Try a demo" links={DEMO_LINKS} />
        </div>

        <div className="mt-10 pt-6 border-t border-border flex items-center gap-x-4 gap-y-2 flex-wrap text-[12px] text-muted-foreground">
          <span>© 2026 Book It Daily</span>
          <span aria-hidden className="opacity-40">·</span>
          <a href="mailto:bookitdaily@gmail.com" className="hover:text-foreground motion-safe:transition-colors">
            bookitdaily@gmail.com
          </a>
          <span className="flex-1" />
          <span className="inline-flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5" aria-hidden />
            Billing powered by Paddle
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <nav aria-label={title}>
      <div className="text-[11px] font-medium tracking-[0.12em] uppercase text-muted-foreground mb-3">
        {title}
      </div>
      <ul className="flex flex-col gap-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-[13px] text-foreground/80 hover:text-foreground motion-safe:transition-colors"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

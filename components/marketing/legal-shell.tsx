import Link from "next/link";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

/**
 * Page chrome for the public legal pages (Terms, Privacy, Refund).
 * Provides the shared header/footer, a title block, a "last updated"
 * line, and a readable prose column. Page bodies pass semantic HTML
 * as children and rely on the `.legal-prose` rules below for typography.
 */
export function LegalShell({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro?: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1">
        <header className="border-b border-border bg-card/40">
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-12 md:py-16">
            <div className="text-[11px] font-medium tracking-[0.12em] uppercase text-[--role-accent-dark]">
              Book It Daily
            </div>
            <h1 className="text-[32px] md:text-[44px] font-semibold tracking-tight leading-[1.1] mt-2">
              {title}
            </h1>
            {intro && (
              <p className="text-[15px] text-muted-foreground mt-4 leading-relaxed max-w-2xl">
                {intro}
              </p>
            )}
            <p className="text-[12px] text-muted-foreground mt-5">Last updated: {updated}</p>
          </div>
        </header>
        <article className="max-w-3xl mx-auto px-4 md:px-6 py-10 md:py-14 legal-prose">
          {children}
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}

/** A numbered/titled top-level section within a legal page. */
export function LegalSection({
  id,
  heading,
  children,
}: {
  id?: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2>{heading}</h2>
      {children}
    </section>
  );
}

/** Renders a short contact block reused across the legal pages. */
export function LegalContact() {
  return (
    <p>
      Questions about this document can be sent to{" "}
      <a href="mailto:bookitdaily@gmail.com">bookitdaily@gmail.com</a>. You can also
      review our other policies:{" "}
      <Link href="/terms">Terms of Service</Link>,{" "}
      <Link href="/privacy">Privacy Policy</Link>, and{" "}
      <Link href="/refund-policy">Refund Policy</Link>.
    </p>
  );
}

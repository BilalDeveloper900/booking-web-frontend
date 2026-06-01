import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, PlayCircle, Wallet, Rocket } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ContactForm } from "@/components/marketing/contact-form";
import { NewsletterForm } from "@/components/marketing/newsletter-form";

export const metadata: Metadata = {
  title: "Contact — Book It Daily",
  description:
    "Get in touch with Book It Daily — booking & membership software for yoga & pilates studios, gyms, and personal trainers. Questions about sales, support, or billing? We're happy to help.",
  alternates: { canonical: "/contact" },
};

const CARDS = [
  {
    icon: PlayCircle,
    title: "See it in action",
    body: "Create a free account and explore the whole app — bookings, class packs, and memberships. No card needed.",
    cta: "Start free",
    href: "/signup",
  },
  {
    icon: Wallet,
    title: "Find the right plan",
    body: "Flat, simple pricing built for studios of every size — from solo trainers to multi-instructor studios.",
    cta: "Compare plans",
    href: "/pricing",
  },
  {
    icon: Rocket,
    title: "Get set up fast",
    body: "Import your clients and classes and go live in an afternoon. We're happy to help you migrate.",
    cta: "Read the FAQ",
    href: "/#faq",
  },
] as const;

export default function ContactPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1">
        {/* ── dark hero with form ── */}
        <section className="relative overflow-hidden border-b border-border">
          {/* soft teal aurora + faint grid — same light treatment as the landing hero */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-gradient-to-b from-[--teal-100]/50 via-background to-background pointer-events-none"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 -z-10 h-80 opacity-[0.18] pointer-events-none [mask-image:radial-gradient(60%_60%_at_50%_0%,#000,transparent)]"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />

          <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* left: copy + CTA */}
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.1em] uppercase text-[--role-accent-dark] bg-[--role-accent-light]/60 px-2.5 py-1 rounded-full mb-5">
                Contact us
              </span>
              <h1 className="text-[38px] md:text-[56px] font-semibold tracking-tight leading-[1.03]">
                Let&rsquo;s get your <span className="text-primary">studio online.</span>
              </h1>
              <p className="text-[15px] md:text-[17px] text-muted-foreground leading-relaxed mt-5 max-w-xl">
                See how Book It Daily handles class bookings, class packs, and memberships for yoga
                &amp; pilates studios, gyms, and personal trainers. We&rsquo;re a small team and we
                read every message.
              </p>

              <div className="mt-8 flex items-center gap-4 flex-wrap">
                <Link
                  href="/signup"
                  className={cn(buttonVariants({ size: "lg" }), "group h-11 px-5 gap-2")}
                >
                  Start free
                  <ArrowRight className="w-4 h-4 motion-safe:transition-transform motion-safe:duration-200 group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="mailto:bookitdaily@gmail.com"
                  className="text-[13px] font-medium text-muted-foreground hover:text-foreground underline underline-offset-4 decoration-border"
                >
                  or email us directly
                </a>
              </div>
            </div>

            {/* right: form */}
            <div>
              <ContactForm />
            </div>
          </div>
        </section>

        {/* ── "with Book It Daily you can" cards ── */}
        <section className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <h2 className="text-[24px] md:text-[32px] font-semibold tracking-tight leading-tight text-center mb-12">
              With <span className="text-primary">Book It Daily</span> you can:
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {CARDS.map((c) => (
                <div
                  key={c.title}
                  className="bg-card border border-border rounded-xl p-6 shadow-card flex flex-col motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-0.5 hover:shadow-hero"
                >
                  <span className="w-10 h-10 rounded-lg bg-[--role-accent-light]/60 text-[--role-accent-dark] grid place-items-center mb-4">
                    <c.icon className="w-5 h-5" aria-hidden />
                  </span>
                  <h3 className="text-[16px] font-semibold mb-1.5">{c.title}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed flex-1">{c.body}</p>
                  <Link
                    href={c.href}
                    className={cn(buttonVariants({ size: "sm" }), "self-start mt-5 gap-1.5")}
                  >
                    {c.cta} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── newsletter band ── */}
        <section className="border-t border-border bg-muted/30">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 items-center">
            <div>
              <h2 className="text-[20px] md:text-[24px] font-semibold tracking-tight leading-tight">
                Get studio growth tips in your inbox.
              </h2>
              <p className="text-[14px] text-muted-foreground leading-relaxed mt-2 max-w-2xl">
                How top studios fill their classes, sell more packs, and keep members coming back —
                plus the occasional Book It Daily product update. No spam.
              </p>
            </div>
            <div className="lg:justify-self-end w-full">
              <NewsletterForm />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

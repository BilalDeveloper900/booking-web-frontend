import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Check,
  CreditCard,
  Globe,
  LayoutDashboard,
  MessageSquare,
  Moon,
  Smartphone,
  Sparkles,
  Users,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

const TIERS = [
  {
    id: "free",
    name: "Free",
    tagline: "For solo coaches starting out",
    monthly: 0,
    yearly: 0,
    cta: "Start free",
    ctaHref: "/signup",
    features: [
      "1 admin",
      "30 active clients",
      "50 bookings / month",
      "Booking calendar + agenda",
      "Client + admin messages",
      "Mobile PWA — installable",
    ],
    limits: 'Includes "Powered by Book It Daily" footer.',
  },
  {
    id: "solo",
    name: "Solo",
    tagline: "For 1-person studios going pro",
    monthly: 9,
    yearly: 90,
    cta: "Start 14-day trial",
    ctaHref: "/signup",
    features: [
      "1 admin",
      "150 active clients",
      "Unlimited bookings",
      "Branding removed",
      "Finance dashboard",
      "Email support",
    ],
  },
  {
    id: "studio",
    name: "Studio",
    tagline: "Where most studios land",
    monthly: 24,
    yearly: 240,
    cta: "Start 14-day trial",
    ctaHref: "/signup",
    popular: true,
    features: [
      "5 admins",
      "500 active clients",
      "Custom domain",
      "Build your own client offers",
      "Dark mode for your team",
      "Priority email support",
    ],
  },
  // {
  //   id: "atelier",
  //   name: "Atelier",
  //   tagline: "Multi-location and chains",
  //   monthly: 39,
  //   yearly: 390,
  //   cta: "Start 14-day trial",
  //   ctaHref: "/signup",
  //   features: [
  //     "Unlimited admins",
  //     "Unlimited clients",
  //     "Multi-location",
  //     "White-label everything",
  //     "API access",
  //     "Live chat support",
  //   ],
  // },
] as const;

const FEATURES = [
  {
    icon: Calendar,
    title: "Booking calendar that works on a phone",
    body: "Week + agenda view, drag-friendly slots, real-time 'now' line, quick filters per admin. Mobile and desktop share the same data.",
  },
  {
    icon: LayoutDashboard,
    title: "Finance dashboard built in",
    body: "Track revenue, outgoing payouts, credit pack sales, and admin commissions in one place — no spreadsheet ladder.",
  },
  {
    icon: Users,
    title: "Clients, admins, and credits — sane data model",
    body: "Subscriptions, top-up packs, commission splits, and per-admin earnings are first-class. Not bolted on.",
  },
  {
    icon: MessageSquare,
    title: "1-to-1 messaging",
    body: "Clients message their admin, admins reply from the same app. Quick replies for the busy chair.",
  },
  {
    icon: Smartphone,
    title: "PWA, not just a website",
    body: "Install it on a phone home screen. Works offline-friendly with bottom tabs that feel native.",
  },
  {
    icon: Moon,
    title: "Dark mode that actually works",
    body: "Tokenized end-to-end — calendar, charts, sheets. Your late-night closing reports won't fry your eyes.",
  },
] as const;

const ADDONS = [
  { icon: Globe, label: "Custom email domain", price: "+$3/mo", body: "Send from bookings@your-studio.com" },
  { icon: MessageSquare, label: "SMS notifications", price: "+$5/mo", body: "100 SMS included, then $0.04 each" },
  { icon: Users, label: "Extra admin seat", price: "+$3/mo each", body: "Beyond your tier limit, add as you grow" },
  { icon: Sparkles, label: "Branded landing page", price: "+$5/mo", body: "Public booking page with your logo and colors" },
] as const;

const FAQ = [
  {
    q: "How is this different from Calendly or Acuity?",
    a: "Those are scheduling tools. We're a full booking + clients + admins + finance product built for studios that take credits/packages. Calendly can't do credit packs, commission splits, or client subscriptions natively.",
  },
  {
    q: "Can I migrate my existing bookings?",
    a: "Yes — CSV import for clients and bookings is on the Studio tier. Atelier customers get a 1:1 migration session.",
  },
  {
    q: "Do you take a percentage of each booking?",
    a: "No. We charge a flat monthly subscription. You keep 100% of what your clients pay you. (We don't process payments — you plug in your own gateway.)",
  },
  {
    q: "What payment processor should I use?",
    a: "We bill our own subscription via Lemon Squeezy. For your client payments, you can use Stripe, Lemon Squeezy, Paddle, Square, or take cash/bank transfers. Your call.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes — monthly plans cancel at the next billing date. Annual plans pro-rate the unused months.",
  },
  {
    q: "Will my data be safe?",
    a: "Daily backups, encrypted at rest, GDPR compliant. You can export everything as CSV at any time.",
  },
] as const;

export default function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      <SiteHeader />
      <Hero />
      <Trusted />
      <FeaturesSection />
      <PricingSection />
      <AddonsSection />
      <BuildOffers />
      <FaqSection />
      <FooterCta />
      <SiteFooter />
    </div>
  );
}

/* ---------------- hero ---------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[--teal-100]/40 to-transparent pointer-events-none" aria-hidden />
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-16 md:py-24 text-center relative">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.08em] uppercase text-[--role-accent-dark] bg-[--role-accent-light]/60 px-2.5 py-1 rounded-full mb-6">
          <Sparkles className="w-3 h-3" /> Built for salons, gyms, studios
        </span>
        <h1 className="text-[40px] md:text-[64px] font-semibold tracking-tight leading-[1.05] mb-5">
          The booking app your <br className="hidden sm:inline" />
          studio actually wants.
        </h1>
        <p className="text-[16px] md:text-[18px] text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
          Manage bookings, clients, admins, and earnings in one place. Bring your own payments,
          design your own credit packs, and ship a real PWA your clients install on their phone.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "h-11 px-5 gap-2")}>
            Start free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="#pricing" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 px-5")}>
            See pricing
          </Link>
        </div>
        <div className="text-[12px] text-muted-foreground mt-4">
          No credit card · Cancel anytime · Free forever tier
        </div>
      </div>
    </section>
  );
}

/* ---------------- trusted ---------------- */

function Trusted() {
  const logos = ["Aurelia Salon", "Studio Twelve", "Atelier Noir", "Crown & Co.", "Le Coiffeur"];
  return (
    <section className="border-y border-border bg-card/40">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground text-center mb-4">
          Trusted by studios across Europe
        </div>
        <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap opacity-60">
          {logos.map((l) => (
            <span
              key={l}
              className="text-[13px] tracking-tight font-serif text-foreground/70"
            >
              {l}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- features ---------------- */

function FeaturesSection() {
  return (
    <section id="features" className="py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <Heading
          eyebrow="Features"
          title="Everything a small studio needs."
          subtitle="No bloat, no enterprise lock-in. The pieces below are in every paid plan."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-card border border-border rounded-xl p-6 shadow-card motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-px hover:shadow-hero"
            >
              <span className="w-10 h-10 rounded-lg bg-[--role-accent-light]/60 text-[--role-accent-dark] grid place-items-center mb-4">
                <f.icon className="w-5 h-5" aria-hidden />
              </span>
              <div className="text-[15px] font-semibold mb-1.5">{f.title}</div>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- pricing ---------------- */

function PricingSection() {
  return (
    <section id="pricing" className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <Heading
          eyebrow="Pricing"
          title="One flat fee. No transaction cuts."
          subtitle="Save 2 months when you pay yearly. All prices in USD."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
          {TIERS.map((t) => {
            const featured = "popular" in t && t.popular;
            return (
              <div
                key={t.id}
                className={
                  "bg-card border rounded-xl p-6 flex flex-col motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-px " +
                  (featured
                    ? "border-primary ring-1 ring-primary/30 shadow-hero"
                    : "border-border shadow-card hover:shadow-hero")
                }
              >
                {featured && (
                  <span className="self-start text-[10px] tracking-[0.08em] uppercase font-semibold text-primary-foreground bg-primary px-2 py-0.5 rounded-full mb-3">
                    Most popular
                  </span>
                )}
                <div className="text-[15px] font-semibold tracking-tight">{t.name}</div>
                <div className="text-[12px] text-muted-foreground mb-5">{t.tagline}</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-[36px] font-semibold tracking-tight tabular-nums">
                    ${t.monthly}
                  </span>
                  <span className="text-[13px] text-muted-foreground">/mo</span>
                </div>
                <div className="text-[11px] text-muted-foreground mb-5 tabular-nums">
                  {t.yearly === 0 ? "Free forever" : `or $${t.yearly}/yr (save $${t.monthly * 12 - t.yearly})`}
                </div>
                <ul className="text-[13px] space-y-2 mb-6 flex-1">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2 items-start">
                      <Check className="w-3.5 h-3.5 text-[--pos] mt-0.5 shrink-0" aria-hidden />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {"limits" in t && t.limits && (
                  <div className="text-[11px] text-muted-foreground mb-4">{t.limits}</div>
                )}
                <Link
                  href={t.ctaHref}
                  className={cn(buttonVariants({ variant: featured ? "default" : "outline" }), "w-full")}
                >
                  {t.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- addons ---------------- */

function AddonsSection() {
  return (
    <section className="py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <Heading
          eyebrow="Add-ons"
          title="Bolt on what you actually need."
          subtitle="Available on any paid plan. Add or remove anytime."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
          {ADDONS.map((a) => (
            <div
              key={a.label}
              className="bg-card border border-border rounded-xl p-5 shadow-card"
            >
              <span className="w-9 h-9 rounded-lg bg-muted text-foreground grid place-items-center mb-3">
                <a.icon className="w-4 h-4" aria-hidden />
              </span>
              <div className="text-[14px] font-semibold mb-1">{a.label}</div>
              <div className="text-[12px] text-[--pos] font-semibold tabular-nums mb-1.5">{a.price}</div>
              <p className="text-[12px] text-muted-foreground leading-relaxed">{a.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- build offers callout ---------------- */

function BuildOffers() {
  return (
    <section id="offers" className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="bg-card border border-border rounded-2xl shadow-hero overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr]">
            <div className="p-8 md:p-12">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.08em] uppercase text-[--role-accent-dark] bg-[--role-accent-light]/60 px-2.5 py-1 rounded-full mb-4">
                <CreditCard className="w-3 h-3" /> Credits + subscriptions
              </span>
              <h3 className="text-[28px] md:text-[32px] font-semibold tracking-tight leading-tight mb-3">
                Design your own client offers.
              </h3>
              <p className="text-[14px] text-muted-foreground leading-relaxed mb-5">
                Build subscription plans + top-up credit packs that fit how your studio actually
                sells. Edit the price, the credits, the perks, the name. Templates included.
              </p>
              <ul className="text-[13px] space-y-2 mb-6">
                {[
                  "Pay-as-you-go, monthly subscriptions, credit packs",
                  "Set commission split per admin",
                  "Live preview of how clients see them",
                  "No-code — point, click, save",
                ].map((b) => (
                  <li key={b} className="flex gap-2 items-start">
                    <Check className="w-3.5 h-3.5 text-[--pos] mt-0.5 shrink-0" aria-hidden />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <Link href="/owner/offers" className={cn(buttonVariants(), "gap-1.5")}>
                Try the offers builder <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-muted/40 border-l border-border p-8 grid place-items-center">
              <div className="bg-card border border-border rounded-xl shadow-hero w-full max-w-xs p-5">
                <div className="text-[10px] uppercase tracking-[0.08em] font-medium text-muted-foreground mb-3">
                  Preview · Studio plan
                </div>
                <div className="text-[20px] font-semibold tabular-nums">$89/mo</div>
                <div className="text-[12px] text-muted-foreground mb-4">8 credits / month</div>
                <ul className="text-[12px] space-y-1.5 mb-4">
                  <li className="flex gap-2 items-start">
                    <Check className="w-3 h-3 text-[--pos] mt-0.5 shrink-0" />
                    Priority booking
                  </li>
                  <li className="flex gap-2 items-start">
                    <Check className="w-3 h-3 text-[--pos] mt-0.5 shrink-0" />
                    Free reschedule
                  </li>
                  <li className="flex gap-2 items-start">
                    <Check className="w-3 h-3 text-[--pos] mt-0.5 shrink-0" />
                    €11.13 per credit
                  </li>
                </ul>
                <button type="button" className={cn(buttonVariants({ size: "sm" }), "w-full")}>
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- faq ---------------- */

function FaqSection() {
  return (
    <section id="faq" className="py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <Heading
          eyebrow="FAQ"
          title="Things people ask."
          align="left"
        />
        <div className="mt-10 divide-y divide-border border-y border-border">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group py-5"
            >
              <summary className="flex justify-between items-start gap-4 cursor-pointer list-none">
                <span className="text-[15px] font-medium">{item.q}</span>
                <span className="text-muted-foreground text-xl leading-none transition-transform group-open:rotate-45 mt-1">
                  +
                </span>
              </summary>
              <p className="text-[13px] text-muted-foreground leading-relaxed mt-3">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- footer cta ---------------- */

function FooterCta() {
  return (
    <section className="py-16 md:py-20 bg-foreground text-background">
      <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
        <h2 className="text-[28px] md:text-[36px] font-semibold tracking-tight leading-tight mb-3">
          Run your studio from your pocket.
        </h2>
        <p className="text-[14px] opacity-70 leading-relaxed mb-6">
          Free forever. Upgrade if you outgrow it. No surprises.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/signup"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-11 px-5 border-background/30 text-background hover:bg-background/10 gap-2"
            )}
          >
            Start free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="#pricing"
            className={cn(
              buttonVariants({ variant: "ghost", size: "lg" }),
              "h-11 px-5 text-background hover:bg-background/10"
            )}
          >
            Compare plans
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------- shared ---------------- */

function Heading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      <div className="text-[11px] font-medium tracking-[0.12em] uppercase text-[--role-accent-dark]">
        {eyebrow}
      </div>
      <h2 className="text-[28px] md:text-[36px] font-semibold tracking-tight leading-tight mt-2">
        {title}
      </h2>
      {subtitle && (
        <p
          className={
            "text-[14px] text-muted-foreground mt-3 leading-relaxed " +
            (align === "center" ? "max-w-xl mx-auto" : "max-w-2xl")
          }
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

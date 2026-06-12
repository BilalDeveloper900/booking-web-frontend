import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  Check,
  CreditCard,
  MousePointerClick,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { JsonLd } from "@/components/marketing/json-ld";
import { Reveal } from "@/components/marketing/reveal";
import { HeroAppPreview } from "@/components/marketing/hero-app-preview";
import { StatsStrip } from "@/components/marketing/stats-strip";
import { DemoBooking } from "@/components/marketing/demo-booking";
import { BentoFeatures } from "@/components/marketing/bento-features";
import { RoleShowcase } from "@/components/marketing/role-showcase";
import { PricingPlans } from "@/components/marketing/pricing-plans";

/* ───────────────────────── SEO ───────────────────────── */

// Set this to your production domain. Used for canonical + Open Graph URLs and
// the structured data @id graph. (NEXT_PUBLIC_APP_URL is localhost in dev.)
const SITE_URL = "https://www.bookitdaily.com";

const SITE_DESCRIPTION =
  "Book It Daily is booking and membership software for yoga & pilates studios, gyms, and personal trainers. Manage class bookings, class packs, memberships, clients, and payments in one installable app — with a free forever plan and no transaction fees.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Book It Daily — Booking & membership software for yoga studios, gyms & personal trainers",
  description: SITE_DESCRIPTION,
  keywords: [
    "fitness studio software",
    "yoga studio booking software",
    "pilates booking software",
    "gym management software",
    "personal trainer booking app",
    "class booking software",
    "class packs",
    "membership management software",
    "book fitness classes online",
    "no transaction fees booking",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Book It Daily",
    title: "Booking & memberships for yoga studios, gyms & personal trainers",
    description: SITE_DESCRIPTION,
    images: [{ url: "/icons/bookitdaily-512.svg", width: 512, height: 512, alt: "Book It Daily" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Book It Daily — Booking software for fitness studios & trainers",
    description:
      "Manage class bookings, packs, memberships, and clients in one installable app. Free forever plan, no transaction fees.",
    images: ["/icons/bookitdaily-512.svg"],
  },
  robots: { index: true, follow: true },
};

/* ───────────────────────── content ───────────────────────── */

const TIERS = [
  {
    id: "free",
    name: "Free",
    tagline: "For solo coaches starting out",
    monthly: 0,
    yearly: 0,
    cta: "Start free",
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
] as const;

const HOW_IT_WORKS = [
  {
    icon: Building2,
    title: "Set up your studio",
    body: "Add your services, staff, and opening hours. Invite your team in a click — each gets their own role.",
  },
  {
    icon: CalendarClock,
    title: "Share your booking link",
    body: "Clients book online or install your branded app on their phone. No app store, no download friction.",
  },
  {
    icon: Zap,
    title: "Run the day from one place",
    body: "Bookings, credits, messages, payouts, and revenue — all in a single dashboard that fits in your pocket.",
  },
] as const;

const ADDONS = [
  { icon: Users, label: "Extra admin seat", price: "+$3/mo each", body: "Beyond your tier limit, add as you grow" },
  { icon: Sparkles, label: "Branded landing page", price: "+$5/mo", body: "Public booking page with your logo and colors" },
] as const;

const FAQ = [
  {
    q: "What is Book It Daily?",
    a: "Book It Daily is booking and membership software for yoga & pilates studios, gyms, and personal trainers. It handles class and 1-on-1 bookings, class packs and memberships, client records, messaging, and finance — in one installable web app (PWA) that works on both phones and desktops.",
  },
  {
    q: "How is this different from Mindbody, Acuity, or Calendly?",
    a: "Acuity and Calendly are just schedulers — they can't sell class packs or memberships. Mindbody and Glofox can, but they're expensive and complex for small studios. Book It Daily gives you class bookings, packs, and memberships at a flat $9–$24/mo, with no cut of your revenue.",
  },
  {
    q: "Do you take a percentage of each booking?",
    a: "No. Book It Daily charges a flat monthly subscription. You keep 100% of what your clients pay you — we don't process your clients' payments, so there are no transaction fees on your revenue.",
  },
  {
    q: "How are subscriptions billed?",
    a: "Your Book It Daily subscription is billed through Polar, our Merchant of Record, which handles VAT and sales tax globally. For the payments your own clients make to you, plug in whatever you already use — Stripe, Polar, Square, cash, or bank transfer.",
  },
  {
    q: "Can I migrate my existing bookings?",
    a: "Yes — CSV import for clients and bookings is available on the Studio plan, so you can move your existing book of business over without re-keying everything.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Monthly plans stop renewing at the next billing date and annual plans are handled per our refund policy. There are no long-term contracts.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. Data is encrypted at rest, backed up daily, and GDPR-compliant. You can export everything as CSV at any time — your data is always yours.",
  },
] as const;

/* ───────────────────────── structured data ───────────────────────── */

function structuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Book It Daily",
        url: SITE_URL,
        logo: `${SITE_URL}/icons/bookitdaily-512.svg`,
        email: "bookitdaily@gmail.com",
        description: SITE_DESCRIPTION,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Book It Daily",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#software`,
        name: "Book It Daily",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web, iOS, Android (PWA)",
        description: SITE_DESCRIPTION,
        publisher: { "@id": `${SITE_URL}/#organization` },
        offers: TIERS.map((t) => ({
          "@type": "Offer",
          name: `${t.name} plan`,
          price: String(t.monthly),
          priceCurrency: "USD",
          url: `${SITE_URL}/pricing`,
        })),
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        mainEntity: FAQ.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };
}

/* ───────────────────────── page ───────────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      <JsonLd data={structuredData()} />
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <StatsSection />
        <DemoSection />
        <FeaturesSection />
        <RolesSection />
        <HowItWorks />
        <PricingSection />
        <AddonsSection />
        <BuildOffers />
        <FaqSection />
        <FooterCta />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ---------------- hero ---------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* layered background: soft teal aurora + faint grid */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-b from-[--teal-100]/50 via-background to-background pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute inset-x-0 top-0 -z-10 opacity-[0.18] pointer-events-none [mask-image:radial-gradient(60%_60%_at_50%_0%,#000,transparent)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
        aria-hidden
      />

      {/* soft animated teal glow behind the headline */}
      <div
        className="bid-hero-glow absolute left-1/2 top-24 -z-10 h-72 w-160 max-w-[90vw] -translate-x-1/2 rounded-full bg-[--teal-500]/45 blur-[90px] pointer-events-none"
        aria-hidden
      />

      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-16 md:pt-24 pb-20 md:pb-28">
        <div className="max-w-5xl mx-auto text-center">
          <Reveal delay={0}>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.08em] uppercase text-[--role-accent-dark] bg-[--role-accent-light]/60 px-2.5 py-1 rounded-full mb-6">
              <Sparkles className="w-3 h-3 motion-safe:animate-pulse" aria-hidden /> Built for yoga, pilates, gyms
              &amp; trainers
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="text-[40px] md:text-[64px] font-semibold tracking-tight leading-[1.04] mb-5">
              The booking app your{" "}
              <span className="text-primary bid-gradient-text">studio</span> actually wants.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="text-[16px] md:text-[18px] text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
              Class bookings, packs, and memberships in one installable app. Bring your own payments
              and keep 100% of your revenue your clients book in seconds, you run the day from your
              pocket.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link
                href="/signup"
                className={cn(buttonVariants({ size: "lg" }), "group h-11 px-5 gap-2")}
              >
                Start free
                <ArrowRight className="w-4 h-4 motion-safe:transition-transform motion-safe:duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/contact"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 px-5 gap-2")}
              >
                <MousePointerClick className="w-4 h-4" aria-hidden />
                Try the live demo
              </Link>
            </div>
          </Reveal>
          <Reveal delay={320}>
            <div className="text-[12px] text-muted-foreground mt-4">
              No credit card · Cancel anytime · Free forever tier
            </div>
          </Reveal>
        </div>

        {/* animated product preview */}
        <Reveal delay={380}>
          <HeroAppPreview />
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- stats ---------------- */

function StatsSection() {
  return (
    <section aria-label="Why studios switch" className="py-12 md:py-16 border-b border-border">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <Reveal>
          <StatsStrip />
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- live demo ---------------- */

function DemoSection() {
  return (
    <section id="demo" aria-labelledby="demo-heading" className="py-16 md:py-24 scroll-mt-20">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <Heading
          id="demo-heading"
          eyebrow="Try it live"
          title="Book a class. Right here, right now."
          subtitle="This is the real booking flow your clients get — group classes with live capacity, and a 1-on-1 slot grid that only shows true availability. No signup needed."
        />
        <Reveal delay={120} className="mt-12 block">
          <DemoBooking />
        </Reveal>
        <Reveal delay={200}>
          <p className="text-[12px] text-muted-foreground text-center mt-4">
            Sandbox data — go ahead and click everything.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- features (bento) ---------------- */

function FeaturesSection() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="py-16 md:py-24 bg-muted/30 border-y border-border scroll-mt-20"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <Heading
          id="features-heading"
          eyebrow="Features"
          title="Everything a small studio needs. Already built."
          subtitle="No bloat, no enterprise lock-in. Every card below is live in the product today."
        />
        <Reveal delay={120} className="mt-12 block">
          <BentoFeatures />
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- roles ---------------- */

function RolesSection() {
  return (
    <section id="roles" aria-labelledby="roles-heading" className="py-16 md:py-24 scroll-mt-20">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <Heading
          id="roles-heading"
          eyebrow="One app, three dashboards"
          title="Owners, staff, and clients each get their own home."
          subtitle="Same data, three tailored views — switch below to see what each role sees."
        />
        <Reveal delay={120} className="mt-12 block">
          <RoleShowcase />
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- how it works ---------------- */

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="py-16 md:py-24 bg-muted/30 border-y border-border scroll-mt-20"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <Heading
          id="how-heading"
          eyebrow="How it works"
          title="Live in an afternoon."
          subtitle="No onboarding calls, no setup fees. Three steps from sign-up to your first booking."
        />
        <ol className="relative grid grid-cols-1 md:grid-cols-3 gap-5 mt-12">
          {/* connecting line (desktop) */}
          <div
            className="hidden md:block absolute top-[42px] left-[16%] right-[16%] h-px bg-gradient-to-r from-[--teal-500]/0 via-[--teal-500]/40 to-[--teal-500]/0 -z-0"
            aria-hidden
          />
          {HOW_IT_WORKS.map((s, i) => (
            <Reveal
              as="li"
              key={s.title}
              delay={i * 110}
              className="group relative bg-card border border-border rounded-xl p-6 shadow-card motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-0.5 hover:shadow-hero"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0 motion-safe:transition-transform motion-safe:duration-200 group-hover:scale-110">
                  <s.icon className="w-5 h-5" aria-hidden />
                </span>
                <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground tabular-nums">
                  Step {i + 1}
                </span>
              </div>
              <h3 className="text-[15px] font-semibold mb-1.5">{s.title}</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{s.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------------- pricing ---------------- */

function PricingSection() {
  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="py-16 md:py-24 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <Heading
          id="pricing-heading"
          eyebrow="Pricing"
          title="One flat fee. No transaction cuts."
          subtitle="Save 2 months when you pay yearly. All prices in USD."
        />
        <Reveal delay={120} className="mt-12 block">
          <PricingPlans tiers={TIERS} />
        </Reveal>
        <p className="text-[12px] text-muted-foreground text-center mt-6">
          Looking for the full breakdown?{" "}
          <Link href="/pricing" className="text-primary underline underline-offset-2 hover:opacity-80">
            Compare all plans &amp; add-ons
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

/* ---------------- addons ---------------- */

function AddonsSection() {
  return (
    <section aria-labelledby="addons-heading" className="py-16 md:py-20 bg-muted/30 border-y border-border">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <Heading
          id="addons-heading"
          eyebrow="Add-ons"
          title="Bolt on what you actually need."
          subtitle="Available on any paid plan. Add or remove anytime."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10 max-w-2xl mx-auto">
          {ADDONS.map((a, i) => (
            <Reveal key={a.label} delay={i * 90} className="h-full">
              <div className="group h-full bg-card border border-border rounded-xl p-5 shadow-card motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-0.5 hover:shadow-hero">
                <span className="w-9 h-9 rounded-lg bg-muted text-foreground grid place-items-center mb-3 motion-safe:transition-transform motion-safe:duration-200 group-hover:scale-110">
                  <a.icon className="w-4 h-4" aria-hidden />
                </span>
                <div className="text-[14px] font-semibold mb-1">{a.label}</div>
                <div className="text-[12px] text-[--pos] font-semibold tabular-nums mb-1.5">{a.price}</div>
                <p className="text-[12px] text-muted-foreground leading-relaxed">{a.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- build offers callout ---------------- */

function BuildOffers() {
  return (
    <section id="offers" aria-labelledby="offers-heading" className="py-16 md:py-24 scroll-mt-20">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <Reveal className="bg-card border border-border rounded-2xl shadow-hero overflow-hidden block">
          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr]">
            <div className="p-8 md:p-12">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.08em] uppercase text-[--role-accent-dark] bg-[--role-accent-light]/60 px-2.5 py-1 rounded-full mb-4">
                <CreditCard className="w-3 h-3" aria-hidden /> Credits + subscriptions
              </span>
              <h2 id="offers-heading" className="text-[28px] md:text-[32px] font-semibold tracking-tight leading-tight mb-3">
                Design your own client offers.
              </h2>
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
              <div className="bg-card border border-border rounded-xl shadow-hero w-full max-w-xs p-5 motion-safe:transition-transform motion-safe:duration-200 hover:scale-[1.02]">
                <div className="text-[10px] uppercase tracking-[0.08em] font-medium text-muted-foreground mb-3">
                  Preview · Studio plan
                </div>
                <div className="text-[20px] font-semibold tabular-nums">$89/mo</div>
                <div className="text-[12px] text-muted-foreground mb-4">8 credits / month</div>
                <ul className="text-[12px] space-y-1.5 mb-4">
                  {["Priority booking", "Free reschedule", "€11.13 per credit"].map((p) => (
                    <li key={p} className="flex gap-2 items-start">
                      <Check className="w-3 h-3 text-[--pos] mt-0.5 shrink-0" aria-hidden />
                      {p}
                    </li>
                  ))}
                </ul>
                <span className={cn(buttonVariants({ size: "sm" }), "w-full pointer-events-none")}>
                  Subscribe
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- faq ---------------- */

function FaqSection() {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="py-16 md:py-24 bg-muted/30 border-t border-border scroll-mt-20">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <Heading id="faq-heading" eyebrow="FAQ" title="Things people ask." align="left" />
        <div className="mt-10 divide-y divide-border border-y border-border">
          {FAQ.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex justify-between items-start gap-4 cursor-pointer list-none">
                <h3 className="text-[15px] font-medium">{item.q}</h3>
                <span
                  className="text-muted-foreground text-xl leading-none motion-safe:transition-transform motion-safe:duration-200 group-open:rotate-45 mt-1"
                  aria-hidden
                >
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
    <section className="relative py-16 md:py-20 bg-foreground text-background overflow-hidden">
      {/* subtle teal glow in the dark band */}
      <div
        className="bid-hero-glow absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-56 w-[480px] max-w-[80vw] rounded-full bg-[--teal-500]/20 blur-[80px] pointer-events-none"
        aria-hidden
      />
      <Reveal className="relative max-w-3xl mx-auto px-4 md:px-6 text-center block">
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
              buttonVariants({ size: "lg" }),
              "group h-11 px-5 gap-2 bg-background text-foreground hover:bg-background/90"
            )}
          >
            Start free
            <ArrowRight className="w-4 h-4 motion-safe:transition-transform motion-safe:duration-200 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/pricing"
            className={cn(
              buttonVariants({ variant: "ghost", size: "lg" }),
              "h-11 px-5 text-background hover:bg-background/10"
            )}
          >
            Compare plans
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------------- shared ---------------- */

function Heading({
  id,
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  id?: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  return (
    <Reveal className={align === "center" ? "text-center" : ""}>
      <div className="text-[11px] font-medium tracking-[0.12em] uppercase text-[--role-accent-dark]">
        {eyebrow}
      </div>
      <h2 id={id} className="text-[28px] md:text-[36px] font-semibold tracking-tight leading-tight mt-2">
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
    </Reveal>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PricingPlans } from "@/components/marketing/pricing-plans";

export const metadata: Metadata = {
  title: "Pricing — Book It Daily",
  description:
    "Simple, flat pricing for Book It Daily — booking & membership software for yoga & pilates studios, gyms, and personal trainers. Free forever tier plus paid plans in USD. No transaction fees.",
};

const TIERS = [
  {
    id: "free",
    name: "Free",
    tagline: "For solo coaches starting out",
    monthly: 0,
    yearly: 0,
    cta: "Start free",
    features: [
      "1 admin seat",
      "Up to 30 active clients",
      "50 bookings / month",
      "Booking calendar + agenda",
      "Client + admin messaging",
      "Installable mobile PWA",
    ],
    limits: 'Includes a "Powered by Book It Daily" footer.',
  },
  {
    id: "solo",
    name: "Solo",
    tagline: "For 1-person studios going pro",
    monthly: 9,
    yearly: 90,
    cta: "Start 14-day trial",
    features: [
      "1 admin seat",
      "Up to 150 active clients",
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
      "Up to 5 admin seats",
      "Up to 500 active clients",
      "Custom domain",
      "Build your own client offers",
      "Dark mode for your team",
      "Priority email support",
    ],
  },
] as const;

// add-ons temporarily hidden — see commented section below
// const ADDONS = [
//   { icon: Users, label: "Extra admin seat", price: "+$3 / mo each", body: "Beyond your plan limit, add as you grow." },
//   { icon: Sparkles, label: "Branded landing page", price: "+$5 / mo", body: "Public booking page with your logo and colors." },
// ] as const;

const BILLING_FAQ = [
  {
    q: "What currency are prices in, and who charges me?",
    a: "All prices are in US Dollars (USD). Subscriptions are sold by Book It Daily and processed by our payment provider, Polar, who acts as the Merchant of Record and handles applicable sales tax and VAT. Your card statement will show a charge from Polar on behalf of Book It Daily.",
  },
  {
    q: "Is there a free trial?",
    a: "Paid plans include a 14-day free trial. You will not be charged until the trial ends, and you can cancel any time before then at no cost. The Free plan is free forever and never requires a card.",
  },
  {
    q: "How does annual billing work?",
    a: "Annual plans are billed once per year and save you the equivalent of two months versus paying monthly. You can switch between monthly and annual at any time from your account.",
  },
  {
    q: "Can I cancel or change plans anytime?",
    a: "Yes. You can upgrade, downgrade, or cancel at any time. Monthly plans stop renewing at the end of the current billing period; annual plans are handled per our Refund Policy.",
  },
  {
    q: "Do you take a cut of payments my clients make to me?",
    a: "No. Book It Daily charges a flat software subscription only. You keep 100% of what your clients pay you. We sell booking software — we do not process your clients' payments to your studio.",
  },
] as const;

export default function PricingPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1">
        {/* hero */}
        <section className="border-b border-border bg-card/40">
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-12 md:py-16 text-center">
            <div className="text-[11px] font-medium tracking-[0.12em] uppercase text-[--role-accent-dark]">
              Pricing
            </div>
            <h1 className="text-[32px] md:text-[48px] font-semibold tracking-tight leading-[1.08] mt-2">
              One flat fee. No transaction cuts.
            </h1>
            <p className="text-[15px] md:text-[16px] text-muted-foreground mt-4 leading-relaxed max-w-2xl mx-auto">
              Book It Daily is booking &amp; membership software for yoga &amp; pilates studios, gyms,
              and personal trainers. Pick a plan below — start free, upgrade when you outgrow it. All
              prices in USD. Save two months when you pay yearly.
            </p>
          </div>
        </section>

        {/* tiers */}
        <section className="py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <PricingPlans tiers={TIERS} />
            <p className="text-[12px] text-muted-foreground text-center mt-6">
              Prices exclude applicable sales tax / VAT, which is calculated at checkout by our
              payment provider, Polar.
            </p>
          </div>
        </section>

        {/* add-ons — temporarily hidden */}
        {/*
        <section className="py-12 md:py-16 bg-muted/30 border-y border-border">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <div className="text-center">
              <div className="text-[11px] font-medium tracking-[0.12em] uppercase text-[--role-accent-dark]">
                Add-ons
              </div>
              <h2 className="text-[24px] md:text-[30px] font-semibold tracking-tight leading-tight mt-2">
                Bolt on what you actually need.
              </h2>
              <p className="text-[14px] text-muted-foreground mt-3 max-w-xl mx-auto leading-relaxed">
                Available on any paid plan. Add or remove anytime — billed alongside your subscription.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10 max-w-2xl mx-auto">
              {ADDONS.map((a) => (
                <div key={a.label} className="bg-card border border-border rounded-xl p-5 shadow-card">
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
        */}

        {/* billing FAQ */}
        <section className="py-12 md:py-16">
          <div className="max-w-3xl mx-auto px-4 md:px-6">
            <div className="text-center">
              <div className="text-[11px] font-medium tracking-[0.12em] uppercase text-[--role-accent-dark]">
                Billing
              </div>
              <h2 className="text-[24px] md:text-[30px] font-semibold tracking-tight leading-tight mt-2">
                How billing works.
              </h2>
            </div>
            <div className="mt-8 divide-y divide-border border-y border-border">
              {BILLING_FAQ.map((item) => (
                <details key={item.q} className="group py-5">
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
            <p className="text-[12px] text-muted-foreground mt-6 leading-relaxed">
              See our{" "}
              <Link href="/refund-policy" className="text-primary underline underline-offset-2 hover:opacity-80">
                Refund Policy
              </Link>
              ,{" "}
              <Link href="/terms" className="text-primary underline underline-offset-2 hover:opacity-80">
                Terms of Service
              </Link>
              , and{" "}
              <Link href="/privacy" className="text-primary underline underline-offset-2 hover:opacity-80">
                Privacy Policy
              </Link>{" "}
              for full details.
            </p>
          </div>
        </section>

        {/* cta */}
        <section className="py-14 md:py-20 bg-foreground text-background">
          <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
            <h2 className="text-[26px] md:text-[34px] font-semibold tracking-tight leading-tight mb-3">
              Ready to take bookings?
            </h2>
            <p className="text-[14px] opacity-70 leading-relaxed mb-6">
              Free forever. Upgrade if you outgrow it. No surprises.
            </p>
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 px-5 border-background/30 text-black hover:bg-background/10 gap-2"
              )}
            >
              Start free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

"use client";

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCurrentMember } from "@/lib/auth/use-current-member";
import { useEffectivePlan } from "@/lib/limits";
import { planAllows, minPlanFor, getPlan, type GatedFeature } from "@/lib/plans";

/**
 * Wraps a screen and only renders it when the studio's plan unlocks `feature`.
 * Otherwise shows a locked card — owners get an upgrade CTA to /owner/subscription;
 * admins/clients (who don't pay the SaaS) get a plain "not available" message.
 *
 * The plan check mirrors the server-side gates (booking RPCs, send-email,
 * record_manual_sale) so this is UX, not the security boundary.
 */

const FEATURE_COPY: Record<GatedFeature, { title: string; body: string }> = {
  chat: {
    title: "Messaging",
    body: "Chat with your clients and team in real time, right inside the app.",
  },
  finance: {
    title: "Finance dashboard",
    body: "See revenue, payouts, and per-staff commission at a glance.",
  },
  manualPayments: {
    title: "Payments",
    body: "Record client payments and grant credits from one place.",
  },
  credits: {
    title: "Credits",
    body: "Sell credit packs and memberships, gift credits, and let clients book with them.",
  },
  offersBuilder: {
    title: "Offers builder",
    body: "Design subscription plans and credit packs that fit how your studio sells.",
  },
};

export function UpgradeGate({
  feature,
  children,
}: {
  feature: GatedFeature;
  children: React.ReactNode;
}) {
  const { member, loading: memberLoading } = useCurrentMember();
  const { plan, loading: planLoading } = useEffectivePlan(member?.studio.id);

  // Brief: avoids flashing the locked card before the plan resolves.
  if (memberLoading || planLoading) return null;

  if (planAllows(plan, feature)) return <>{children}</>;

  const copy = FEATURE_COPY[feature];
  const needed = getPlan(minPlanFor(feature));
  const isOwner = member?.role === "owner";

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
      <div className="max-w-md mx-auto mt-6 md:mt-10 bg-card border border-border rounded-xl shadow-card p-8 text-center">
        <span className="w-12 h-12 rounded-full bg-[--role-accent-light]/60 text-[--role-accent-dark] grid place-items-center mx-auto mb-4">
          <Lock className="w-5 h-5" aria-hidden />
        </span>
        <h2 className="text-[18px] font-semibold tracking-tight">{copy.title}</h2>
        <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">{copy.body}</p>
        <p className="text-[13px] mt-4">
          {isOwner ? (
            <>
              Available on the <span className="font-semibold">{needed?.name}</span> plan.
            </>
          ) : (
            <>This studio&apos;s plan doesn&apos;t include {copy.title.toLowerCase()} yet.</>
          )}
        </p>
        {isOwner && (
          <Link href="/owner/subscription" className={cn(buttonVariants(), "mt-5 gap-1.5")}>
            <Sparkles className="w-4 h-4" /> Upgrade to {needed?.name}
          </Link>
        )}
      </div>
    </div>
  );
}

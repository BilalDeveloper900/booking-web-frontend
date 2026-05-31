"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { useCurrentMember } from "@/lib/auth/use-current-member";

/**
 * Auth-aware actions on the right of the marketing header. Logged-in users see
 * a "Dashboard" button (to their role home); logged-out users see Sign in +
 * Start free. While the auth state resolves we render a spacer so the
 * logged-out buttons never flash for an already-signed-in visitor.
 */
export function SiteHeaderActions() {
  const { member, loading } = useCurrentMember();

  if (loading) {
    return <div className="h-8 w-28" aria-hidden />;
  }

  if (member) {
    return (
      <Link href={`/${member.role}`} className={buttonVariants({ size: "sm" })}>
        Dashboard
      </Link>
    );
  }

  return (
    <>
      <Link
        href="/login"
        className="text-sm text-muted-foreground hover:text-foreground motion-safe:transition-colors"
      >
        Sign in
      </Link>
      <Link href="/signup" className={buttonVariants({ size: "sm" })}>
        Start free
      </Link>
    </>
  );
}

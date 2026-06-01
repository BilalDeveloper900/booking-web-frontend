"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Newsletter signup. No list backend yet — composes a "subscribe" email to us
 * (mailto) so it works today. Replace with a real provider (e.g. Resend
 * audiences) later without touching the page.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    window.location.href = `mailto:bookitdaily@gmail.com?subject=${encodeURIComponent(
      "Subscribe to studio tips"
    )}&body=${encodeURIComponent(`Please add me to your list: ${email.trim()}`)}`;
    setDone(true);
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2 w-full max-w-md">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        placeholder="Enter your email"
        className={cn(
          "flex-1 h-11 rounded-lg border border-border bg-card px-3 text-[13px] outline-none",
          "motion-safe:transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
        )}
      />
      <Button type="submit" size="lg" className="gap-2 shrink-0">
        {done ? (
          <>
            <Check className="w-4 h-4" /> Thanks
          </>
        ) : (
          <>
            Subscribe <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>
    </form>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "../_form";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.includes("@") && !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });

    setSubmitting(false);
    if (resetError) {
      // Don't leak which emails exist — show success regardless of error type
      // unless it's a rate limit (which IS user-actionable).
      if (resetError.message.toLowerCase().includes("rate")) {
        setError("Too many attempts. Wait a minute and try again.");
        return;
      }
    }
    setSent(true);
  }

  return (
    <div>
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground motion-safe:transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
      </Link>

      <h1 className="font-serif text-[36px] leading-tight tracking-tight mb-2">Reset password</h1>
      <p className="text-[14px] text-muted-foreground mb-8">
        Type the email tied to your studio. We&rsquo;ll send a one-time link.
      </p>

      {sent ? (
        <div className="rounded-xl border border-[--pos]/30 bg-[--pos]/5 p-5 text-[13px]">
          <div className="flex items-center gap-2 font-semibold mb-1">
            <Mail className="w-4 h-4 text-[--pos]" /> Check your inbox
          </div>
          <p className="text-muted-foreground leading-relaxed">
            If <span className="text-foreground font-medium">{email}</span> exists, a reset link
            is on its way. Link expires in 30 minutes.
          </p>
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => {
              setSent(false);
              setEmail("");
            }}
          >
            Send another email
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@studio.com"
              autoComplete="email"
              required
            />
          </Field>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-[--neg]/30 bg-[--neg]/10 px-3 py-2 text-[12px] text-[--neg]"
            >
              {error}
            </div>
          )}

          <Button type="submit" disabled={!canSubmit} className="w-full h-11 gap-2">
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Sending
              </>
            ) : (
              <>
                Send reset link <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>
      )}

      <p className="text-[13px] text-muted-foreground text-center mt-8">
        Remember it now?{" "}
        <Link href="/login" className="text-foreground font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

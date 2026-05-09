"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "../_form";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState<"checking" | "ok" | "no_session">("checking");

  // Supabase puts a recovery session in the URL hash; getUser() picks it up.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data }) => setReady(data.user ? "ok" : "no_session"))
      .catch(() => setReady("no_session"));
  }, []);

  const canSubmit =
    password.length >= 8 &&
    password === confirm &&
    !submitting &&
    ready === "ok";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }
    router.replace("/login?reset=1");
  }

  if (ready === "checking") {
    return (
      <div className="flex items-center gap-3 text-[14px] text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking reset link…
      </div>
    );
  }

  if (ready === "no_session") {
    return (
      <div>
        <h1 className="font-serif text-[36px] leading-tight tracking-tight mb-2">Link expired</h1>
        <p className="text-[14px] text-muted-foreground mb-6">
          This reset link is no longer valid. Request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium hover:underline"
        >
          Request new link <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-[36px] leading-tight tracking-tight mb-2">
        Set a new password
      </h1>
      <p className="text-[14px] text-muted-foreground mb-8">
        Pick something you don&rsquo;t use anywhere else. At least 8 characters.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="New password">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 grid place-items-center text-muted-foreground hover:text-foreground rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </Field>

        <Field label="Confirm password">
          <Input
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Type it again"
            autoComplete="new-password"
            required
            minLength={8}
          />
          {confirm.length > 0 && password !== confirm && (
            <p className="text-[11px] text-[--neg] mt-1.5">Passwords don&rsquo;t match.</p>
          )}
        </Field>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-[--neg]/30 bg-[--neg]/10 px-3 py-2 text-[12px] text-[--neg]"
          >
            {error}
          </div>
        )}

        <Button type="submit" disabled={!canSubmit} className="w-full h-11 gap-2 mt-2">
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Updating
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" /> Update password
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

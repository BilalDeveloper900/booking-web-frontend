"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Divider, Field, Input } from "../_form";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="inline-flex items-center gap-2 text-[14px] text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next");
  const orphan = search.get("orphan") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.includes("@") && password.length >= 6 && !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(humanizeAuthError(signInError.message));
      setSubmitting(false);
      return;
    }

    const result = await ensureProvisioned(supabase);

    if (result.kind === "error") {
      setError(result.message);
      setSubmitting(false);
      return;
    }

    const resolvedRole = result.role;
    const resolvedHome = `/${resolvedRole}`;

    // Only honor ?next= if it matches the user's actual role. Prevents an
    // admin from being deep-linked to /owner.
    const nextMatchesRole =
      next && new RegExp(`^/${resolvedRole}(/|$)`).test(next);
    router.replace(nextMatchesRole ? next : resolvedHome);
    // Don't unset submitting — we're navigating away.
  }

  return (
    <div>
      <h1 className="font-serif text-[36px] leading-tight tracking-tight mb-2">Welcome back</h1>
      <p className="text-[14px] text-muted-foreground mb-8">
        Sign in to keep running your studio.
      </p>

      {orphan && !error && (
        <div className="rounded-lg border border-[--warn]/30 bg-[--warn]/10 px-3 py-2.5 text-[12px] text-[--warn] mb-5">
          Sign in to finish setting up your account. If you were invited but
          the link expired, ask whoever invited you for a fresh one.
        </div>
      )}

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

        <Field
          label="Password"
          right={
            <Link
              href="/forgot-password"
              className="text-[11px] text-muted-foreground hover:text-foreground motion-safe:transition-colors"
            >
              Forgot password?
            </Link>
          }
        >
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              minLength={6}
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

        <label className="flex items-center gap-2 cursor-pointer text-[13px] select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
          />
          Keep me signed in for 30 days
        </label>

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
              <Loader2 className="w-4 h-4 animate-spin" /> Signing in
            </>
          ) : (
            <>
              Sign in <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>

      <Divider>or</Divider>

      <p className="text-[13px] text-muted-foreground text-center">
        New to Book It Daily?{" "}
        <Link href="/signup" className="text-foreground font-medium hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

function humanizeAuthError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("invalid login credentials")) return "Wrong email or password.";
  if (lower.includes("email not confirmed")) return "Please confirm your email first — check your inbox.";
  if (lower.includes("rate limit")) return "Too many attempts. Wait a minute and try again.";
  return msg;
}

type ProvisionResult =
  | { kind: "ok"; role: "owner" | "admin" | "client" }
  | { kind: "error"; message: string };

/**
 * After a successful sign-in, resolve the user's role and complete any
 * pending provisioning step.
 *
 * Source of truth for intent is `auth.users.user_metadata` (set during
 * signup), NOT sessionStorage — that prior implementation broke whenever a
 * user confirmed their email in a different tab/browser, silently turning
 * invitees into owners.
 *
 *   - Has owner membership      -> /owner
 *   - Has admin membership      -> /admin
 *   - Has client membership     -> /client
 *   - No membership + invite_token in metadata -> accept_invitation
 *   - No membership + intended_role='owner'    -> create_studio_for_owner
 *   - No membership + no metadata              -> error ("orphan" account)
 */
async function ensureProvisioned(
  supabase: ReturnType<typeof createClient>
): Promise<ProvisionResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { kind: "error", message: "Sign-in failed unexpectedly." };

  const { data: rows } = await supabase
    .from("studio_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("status", "active");

  const roles = (rows ?? []).map((r) => r.role as string);
  if (roles.includes("owner")) return { kind: "ok", role: "owner" };
  if (roles.includes("admin")) return { kind: "ok", role: "admin" };
  if (roles.includes("client")) return { kind: "ok", role: "client" };

  const meta = (user.user_metadata ?? {}) as {
    invite_token?: string;
    intended_role?: string;
    studio_name?: string;
  };

  if (meta.invite_token) {
    const { error } = await supabase.rpc("accept_invitation", {
      p_token: meta.invite_token,
    });
    if (error) {
      console.error("[login] accept_invitation failed:", error.message);
      return {
        kind: "error",
        message:
          "We couldn't accept your invite. It may have been cancelled or expired — ask whoever invited you for a fresh link.",
      };
    }
    const { data: postRows } = await supabase
      .from("studio_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("status", "active");
    const postRoles = (postRows ?? []).map((r) => r.role as string);
    if (postRoles.includes("admin")) return { kind: "ok", role: "admin" };
    if (postRoles.includes("client")) return { kind: "ok", role: "client" };
    return {
      kind: "error",
      message: "Invite accepted but membership wasn't created. Try again.",
    };
  }

  if (meta.intended_role === "owner") {
    const { error } = await supabase.rpc("create_studio_for_owner", {
      p_studio_name: meta.studio_name ?? "",
    });
    if (error) {
      return {
        kind: "error",
        message: `Studio setup failed: ${error.message}. Try signing in again.`,
      };
    }
    return { kind: "ok", role: "owner" };
  }

  // Authenticated but unknown intent — refuse to silently make them an owner.
  return {
    kind: "error",
    message:
      "Your account isn't attached to any studio. If you were invited, open your invite link again. Otherwise, create a new studio at /signup.",
  };
}

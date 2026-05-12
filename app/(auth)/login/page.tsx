"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Divider, Field, Input } from "../_form";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next");
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

    // First-login auto-provision: if this user has no active membership, they
    // came from a confirmed-email signup and we still need to create their
    // studio. The RPC is idempotent so this is safe to call.
    const provisionedTarget = await ensureProvisioned(supabase);

    // Resolve where to send them: ?next=<path>, else the resolved dashboard.
    if (next && /^\/(owner|admin|client)(\/|$)/.test(next)) {
      router.replace(next);
    } else {
      router.replace(provisionedTarget);
    }
    // Don't unset submitting — we're navigating away.
  }

  return (
    <div>
      <h1 className="font-serif text-[36px] leading-tight tracking-tight mb-2">Welcome back</h1>
      <p className="text-[14px] text-muted-foreground mb-8">
        Sign in to keep running your studio.
      </p>

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
        New to Maison?{" "}
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

/**
 * After a successful sign-in: figure out where to send the user, and if they
 * have no membership yet (post-email-confirmation signup), create one now.
 * Pending state from /signup is stashed in sessionStorage:
 *   - "maison.pending_invite_token" -> accept invitation (admin/client signup)
 *   - "maison.pending_studio_name"  -> create studio (owner signup)
 */
async function ensureProvisioned(
  supabase: ReturnType<typeof createClient>
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "/login";

  const { data: rows } = await supabase
    .from("studio_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("status", "active");

  const roles = (rows ?? []).map((r) => r.role as string);
  if (roles.includes("owner")) return "/owner";
  if (roles.includes("admin")) return "/admin";
  if (roles.includes("client")) return "/client";

  // Pending invite (admin / client confirmation flow)
  let pendingInvite: string | null = null;
  let pendingName: string | null = null;
  try {
    pendingInvite = sessionStorage.getItem("maison.pending_invite_token");
    pendingName = sessionStorage.getItem("maison.pending_studio_name");
    sessionStorage.removeItem("maison.pending_invite_token");
    sessionStorage.removeItem("maison.pending_studio_name");
  } catch {
    /* sessionStorage unavailable */
  }

  if (pendingInvite) {
    const { error } = await supabase.rpc("accept_invitation", {
      p_token: pendingInvite,
    });
    if (error) {
      console.error("[login] accept_invitation failed:", error.message);
      return "/owner"; // dead-end; UI will show empty state, user can re-invite
    }
    // Re-read role to know where to send them.
    const { data: postRows } = await supabase
      .from("studio_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("status", "active");
    const postRoles = (postRows ?? []).map((r) => r.role as string);
    if (postRoles.includes("admin")) return "/admin";
    if (postRoles.includes("client")) return "/client";
    return "/owner";
  }

  // No invite -> fresh owner signup. Auto-provision a studio.
  const { error } = await supabase.rpc("create_studio_for_owner", {
    p_studio_name: pendingName ?? "",
  });
  if (error) {
    console.error("[login] create_studio_for_owner failed:", error.message);
  }
  return "/owner";
}

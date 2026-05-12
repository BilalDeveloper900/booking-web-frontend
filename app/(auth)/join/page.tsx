"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  UserPlus,
  Users,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Divider, Field, Input } from "../_form";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type InvitePreview = {
  studio_id: string;
  studio_name: string;
  studio_slug: string;
  email: string;
  role: "admin" | "client";
  expires_at: string;
  accepted_at: string | null;
  cancelled_at: string | null;
};

type Status =
  | "checking"
  | "missing"
  | "not_found"
  | "expired"
  | "cancelled"
  | "used"
  | "ok";

export default function JoinPage() {
  const router = useRouter();
  const search = useSearchParams();
  const inviteToken = search.get("invite");

  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [status, setStatus] = useState<Status>(inviteToken ? "checking" : "missing");

  // Resolve the invite. Runs once on mount. If no token, the initial state
  // ("missing") already covers it — don't touch state in the effect body.
  useEffect(() => {
    if (!inviteToken) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .rpc("peek_invitation", { p_token: inviteToken })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data || data.length === 0) {
          setStatus("not_found");
          return;
        }
        const row = data[0] as InvitePreview;
        if (row.cancelled_at) {
          setStatus("cancelled");
          return;
        }
        if (row.accepted_at) {
          setStatus("used");
          return;
        }
        if (new Date(row.expires_at) < new Date()) {
          setStatus("expired");
          return;
        }
        setInvite(row);
        setStatus("ok");
      });
    return () => {
      cancelled = true;
    };
  }, [inviteToken]);

  // Loading state — never flash a "wrong" UI.
  if (status === "checking") {
    return (
      <div>
        <div className="inline-flex items-center gap-2 text-[14px] text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Checking your invite…
        </div>
      </div>
    );
  }

  // Missing or invalid token states.
  if (status !== "ok" || !invite || !inviteToken) {
    return <InviteIssue status={status} />;
  }

  return <JoinForm router={router} invite={invite} inviteToken={inviteToken} />;
}

/* ───────────────────────── Form ───────────────────────── */

function JoinForm({
  router,
  invite,
  inviteToken,
}: {
  router: ReturnType<typeof useRouter>;
  invite: InvitePreview;
  inviteToken: string;
}) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  const roleLabel = invite.role === "admin" ? "team member" : "client";
  const RoleIcon = invite.role === "admin" ? UserPlus : Users;
  const strength = scorePassword(password);

  const canSubmit =
    name.trim().length > 0 && password.length >= 8 && accepted && !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: invite.email,
      password,
      options: { data: { name: name.trim() } },
    });

    if (signUpError) {
      setError(humanizeAuthError(signUpError.message));
      setSubmitting(false);
      return;
    }

    // Email confirmation flow — no immediate session. Stash the token so
    // /login picks it up after they confirm + sign in.
    if (!data.session) {
      try {
        sessionStorage.setItem("maison.pending_invite_token", inviteToken);
      } catch {
        /* sessionStorage unavailable */
      }
      setNeedsConfirm(true);
      setSubmitting(false);
      return;
    }

    // Have a session — accept the invite now.
    const { error: rpcError } = await supabase.rpc("accept_invitation", {
      p_token: inviteToken,
    });
    if (rpcError) {
      setError(humanizeRpcError(rpcError.message));
      setSubmitting(false);
      return;
    }
    router.replace(invite.role === "admin" ? "/admin" : "/client");
  }

  if (needsConfirm) {
    return (
      <div>
        <h1 className="font-serif text-[36px] leading-tight tracking-tight mb-2">
          Check your inbox
        </h1>
        <p className="text-[14px] text-muted-foreground mb-6">
          We sent a confirmation link to{" "}
          <span className="text-foreground font-medium">{invite.email}</span>.
          Click it, then sign in to finish joining {invite.studio_name}.
        </p>
        <div className="rounded-xl border border-border bg-card p-4 text-[12px] text-muted-foreground leading-relaxed mb-6">
          <Mail className="w-3.5 h-3.5 inline mr-1.5" />
          Didn&rsquo;t get it? Check spam, or wait a minute. The link expires in
          24 hours.
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium hover:underline"
        >
          Back to sign in <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="inline-flex items-center gap-2 self-start px-2 py-1 rounded-md text-[11px] font-medium mb-4 bg-[--role-accent-light] text-[--role-accent-dark]">
        <RoleIcon className="w-3 h-3" />
        {invite.role === "admin" ? "Team invite" : "Client invite"}
      </div>

      <h1 className="font-serif text-[36px] leading-tight tracking-tight mb-2">
        Join {invite.studio_name}
      </h1>
      <p className="text-[14px] text-muted-foreground mb-6">
        You&rsquo;ve been invited to <span className="text-foreground font-medium">{invite.studio_name}</span>{" "}
        as a <span className="text-foreground font-medium">{roleLabel}</span>.
        Set a name and password to accept.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Your name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={invite.role === "admin" ? "Camille Roux" : "Olivia Wren"}
            autoComplete="name"
            required
          />
        </Field>

        <Field
          label="Email"
          right={
            <span className="text-[10px] text-muted-foreground">
              From your invite
            </span>
          }
        >
          <Input type="email" value={invite.email} disabled />
        </Field>

        <Field label="Password">
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
          {password.length > 0 && <PasswordStrength score={strength} />}
        </Field>

        <label className="flex items-start gap-2 cursor-pointer text-[12px] text-muted-foreground select-none">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="w-4 h-4 rounded border-border accent-primary mt-0.5 cursor-pointer shrink-0"
          />
          <span>
            I agree to the{" "}
            <Link href="#" className="underline hover:text-foreground">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="#" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

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
              <Loader2 className="w-4 h-4 animate-spin" /> Joining
            </>
          ) : (
            <>
              Join {invite.studio_name} <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>

      <Divider>or</Divider>

      <p className="text-[13px] text-muted-foreground text-center">
        Already have an account?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(
            invite.role === "admin" ? "/admin" : "/client"
          )}`}
          className="text-foreground font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

/* ───────────────────────── Invalid invite ───────────────────────── */

function InviteIssue({ status }: { status: Status }) {
  const messages: Record<Exclude<Status, "ok" | "checking">, string> = {
    missing: "This page is for accepting an invite. Ask the studio owner for a link.",
    not_found: "We couldn't find that invite. Ask the studio owner for a fresh link.",
    expired: "This invite link has expired. Ask the studio owner for a fresh one.",
    cancelled: "This invite was cancelled by the studio owner.",
    used: "This invite has already been used. Sign in instead.",
  };
  const message = messages[status as keyof typeof messages] ?? messages.not_found;

  return (
    <div>
      <h1 className="font-serif text-[36px] leading-tight tracking-tight mb-2">
        Invite issue
      </h1>
      <p className="text-[14px] text-muted-foreground mb-6">{message}</p>
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium hover:underline"
      >
        Sign in instead <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

/* ───────────────────────── helpers ───────────────────────── */

function humanizeAuthError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("already registered") || lower.includes("user already")) {
    return "An account with this email already exists. Sign in instead?";
  }
  if (lower.includes("rate limit"))
    return "Too many attempts. Wait a minute and try again.";
  if (lower.includes("password") && lower.includes("weak")) {
    return "Password too weak — try mixing upper, lower, numbers, and symbols.";
  }
  return msg;
}

function humanizeRpcError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("invitation_not_found")) return "Invite link not recognized.";
  if (lower.includes("invitation_expired")) return "This invite has expired.";
  if (lower.includes("invitation_cancelled")) return "This invite was cancelled.";
  if (lower.includes("invitation_already_used"))
    return "This invite has already been used.";
  return msg;
}

function scorePassword(p: string) {
  if (p.length === 0) return 0;
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
  if (/\d/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  return Math.min(4, score);
}

function PasswordStrength({ score }: { score: number }) {
  const labels = ["Too short", "Weak", "Okay", "Strong", "Excellent"];
  const colors = [
    "bg-[--neg]",
    "bg-[--neg]",
    "bg-[--warn]",
    "bg-[--pos]",
    "bg-[--pos]",
  ];
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex gap-1 flex-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full motion-safe:transition-colors motion-safe:duration-200",
              i < score ? colors[score] : "bg-muted"
            )}
          />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground tabular-nums w-16 text-right">
        {labels[score]}
      </span>
    </div>
  );
}


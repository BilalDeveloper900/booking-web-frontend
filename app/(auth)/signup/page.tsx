"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Divider, Field, Input, SocialButtons } from "../_form";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [studio, setStudio] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const strength = scorePassword(password);
  const canSubmit =
    name.trim().length > 0 &&
    email.includes("@") &&
    password.length >= 8 &&
    accepted &&
    !submitting;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    // Mock signup — replace with real call later.
    setTimeout(() => router.push("/owner"), 700);
  }

  return (
    <div>
      <h1 className="font-serif text-[36px] leading-tight tracking-tight mb-2">
        Start your studio
      </h1>
      <p className="text-[14px] text-muted-foreground mb-2">
        Free forever — no credit card.{" "}
        <span className="text-[--pos] font-medium">Setup takes under 60 seconds.</span>
      </p>
      <Perks />

      <SocialButtons />
      <Divider>or sign up with email</Divider>

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Your name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Camille Roux"
            autoComplete="name"
            required
          />
        </Field>

        <Field label="Studio name (optional)">
          <Input
            value={studio}
            onChange={(e) => setStudio(e.target.value)}
            placeholder="Maison & Co."
            autoComplete="organization"
          />
        </Field>

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
            <Link href="#" className="underline hover:text-foreground">Terms</Link>{" "}
            and{" "}
            <Link href="#" className="underline hover:text-foreground">Privacy Policy</Link>.
          </span>
        </label>

        <Button type="submit" disabled={!canSubmit} className="w-full h-11 gap-2">
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Creating your studio
            </>
          ) : (
            <>
              Create account <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>

      <p className="text-[13px] text-muted-foreground text-center mt-8">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground font-medium hover:underline">
          Sign in
        </Link>
      </p>

      <p className="text-[11px] text-muted-foreground text-center mt-6 leading-relaxed">
        Got an invite from a studio? Open the link in your email — you&rsquo;ll land here with
        the rest pre-filled.
      </p>
    </div>
  );
}

function Perks() {
  const items = ["Free tier forever", "Cancel anytime", "Your data, exportable"];
  return (
    <ul className="flex flex-wrap gap-3 mb-6 text-[12px] text-muted-foreground">
      {items.map((it) => (
        <li key={it} className="inline-flex items-center gap-1">
          <Check className="w-3 h-3 text-[--pos]" aria-hidden /> {it}
        </li>
      ))}
    </ul>
  );
}

/* ---------- password strength ---------- */

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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Divider, Field, Input, SocialButtons } from "../_form";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.includes("@") && password.length >= 6 && !submitting;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    // Simulate auth — replace with real call once backend is wired.
    setTimeout(() => router.push("/owner"), 600);
  }

  return (
    <div>
      <h1 className="font-serif text-[36px] leading-tight tracking-tight mb-2">Welcome back</h1>
      <p className="text-[14px] text-muted-foreground mb-8">
        Sign in to keep running your studio.
      </p>

      <SocialButtons />
      <Divider>or continue with email</Divider>

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

      <p className="text-[13px] text-muted-foreground text-center mt-8">
        New to Maison?{" "}
        <Link href="/signup" className="text-foreground font-medium hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

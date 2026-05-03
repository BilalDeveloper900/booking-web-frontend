"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function SocialButtons() {
  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      <SocialButton provider="google" />
      <SocialButton provider="apple" />
    </div>
  );
}

function SocialButton({ provider }: { provider: "google" | "apple" }) {
  const router = useRouter();
  const label = provider === "google" ? "Continue with Google" : "Continue with Apple";
  return (
    <button
      type="button"
      onClick={() => router.push("/owner")}
      aria-label={label}
      className="h-10 rounded-lg border border-border bg-card hover:bg-muted/40 flex items-center justify-center gap-2 text-[13px] font-medium motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {provider === "google" ? <GoogleGlyph /> : <AppleGlyph />}
      <span className="hidden sm:inline">{provider === "google" ? "Google" : "Apple"}</span>
    </button>
  );
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.95v2.33A9 9 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.97 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.95a9 9 0 0 0 0 8.08l3.02-2.33z" fill="#FBBC05" />
      <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .95 4.96l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

function AppleGlyph() {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden fill="currentColor">
      <path d="M11.62 8.45a3.62 3.62 0 0 1 1.73-3.04 3.71 3.71 0 0 0-2.92-1.58c-1.23-.13-2.42.74-3.05.74-.65 0-1.6-.72-2.65-.7a3.89 3.89 0 0 0-3.27 2 8.21 8.21 0 0 0 1 11.74c.64.61 1.4 1.3 2.4 1.26.96-.04 1.32-.62 2.48-.62 1.16 0 1.5.62 2.5.6 1.04-.02 1.7-.62 2.33-1.24a9.05 9.05 0 0 0 1.07-2.18 3.5 3.5 0 0 1-2.13-3.18zM9.66 2.4a3.55 3.55 0 0 0 .81-2.55 3.6 3.6 0 0 0-2.32 1.21 3.34 3.34 0 0 0-.83 2.45 2.95 2.95 0 0 0 2.34-1.11z" />
    </svg>
  );
}

export function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <span className="flex-1 h-px bg-border" aria-hidden />
      <span className="text-[11px] tracking-[0.04em] text-muted-foreground uppercase">
        {children}
      </span>
      <span className="flex-1 h-px bg-border" aria-hidden />
    </div>
  );
}

export function Field({
  label,
  right,
  children,
}: {
  label: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground">
          {label}
        </label>
        {right}
      </div>
      {children}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full h-10 rounded-lg border border-border bg-background px-3 text-[13px] outline-none motion-safe:transition-colors motion-safe:duration-150",
        "hover:border-foreground/30 focus:border-ring focus:ring-2 focus:ring-ring/20",
        "placeholder:text-muted-foreground/60"
      )}
    />
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sendContactSubmission } from "@/lib/email";

const SUPPORT_EMAIL = "bookitdaily@gmail.com";

const TOPICS = ["Sales", "Support", "Billing", "Partnership", "Other"] as const;
type Topic = (typeof TOPICS)[number];

/**
 * Contact form (light surface, matches the rest of the site). On submit it
 * sends a transactional email through Supabase Edge Functions, with a mailto
 * fallback if the function call fails.
 */
export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<Topic>("Sales");
  const [message, setMessage] = useState("");
  const [agree, setAgree] = useState(false);
  const [opened, setOpened] = useState(false);

  const canSend = name.trim() && email.includes("@") && message.trim() && agree;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    void (async () => {
      try {
        await sendContactSubmission({
          name: name.trim(),
          email: email.trim(),
          topic,
          message: message.trim(),
        });
        setOpened(true);
      } catch {
        const subject = `[${topic}] Message from ${name.trim()}`;
        const body = `${message.trim()}\n\n— ${name.trim()} (${email.trim()})`;
        window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        setOpened(true);
      }
    })();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-card border border-border rounded-2xl p-6 md:p-7 space-y-4 shadow-hero"
    >
      <Field label="Name">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={inputCls}
          placeholder="Your name"
        />
      </Field>
      <Field label="Email">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputCls}
          placeholder="you@studio.com"
        />
      </Field>
      <Field label="Topic">
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value as Topic)}
          className={inputCls}
        >
          {TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Message">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={4}
          className={cn(inputCls, "h-auto py-2.5 resize-y")}
          placeholder="Tell us a bit about your studio and how we can help…"
        />
      </Field>

      <label className="flex items-start gap-2.5 text-[12px] text-muted-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-border accent-[--teal-700]"
        />
        <span>
          I agree with the{" "}
          <Link
            href="/terms"
            className="text-primary underline underline-offset-2 hover:opacity-80"
          >
            Terms and Conditions
          </Link>
        </span>
      </label>

      <Button
        type="submit"
        size="lg"
        className="w-full gap-2"
        disabled={!canSend}
      >
        {opened ? (
          <>
            <Check className="w-4 h-4" /> Opened your email app
          </>
        ) : (
          <>
            <Send className="w-4 h-4" /> Send your request
          </>
        )}
      </Button>

      <div className="pt-2 border-t border-border">
        <div className="text-[12px] font-semibold text-foreground mt-3 mb-2">
          You can also contact us via
        </div>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground motion-safe:transition-colors"
        >
          <span className="w-8 h-8 rounded-full bg-muted grid place-items-center shrink-0">
            <Mail className="w-3.5 h-3.5" />
          </span>
          {SUPPORT_EMAIL}
        </a>
      </div>
    </form>
  );
}

const inputCls = cn(
  "w-full h-11 rounded-lg border border-border bg-background px-3 text-[13px] text-foreground placeholder:text-muted-foreground/60",
  "outline-none motion-safe:transition-colors motion-safe:duration-150",
  "hover:border-foreground/30 focus:border-ring focus:ring-2 focus:ring-ring/20",
);

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

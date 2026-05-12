"use client";

import { useState } from "react";
import { Copy, Check, Loader2, UserPlus, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { createInvitation, inviteUrl } from "@/lib/members";
import { cn } from "@/lib/utils";

/**
 * Reusable owner-side invite sheet. Creates an `invitations` row and shows the
 * shareable link. Owner can copy the link and send it to the invitee any way
 * they like (WhatsApp, email, in person) — no email infrastructure required.
 *
 * Wire `onInvited()` to refetch your invitations list after a successful create.
 */
export function InviteSheet({
  open,
  onOpenChange,
  studioId,
  invitedBy,
  role,
  onInvited,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studioId: string | undefined;
  invitedBy: string | undefined;
  role: "admin" | "client";
  onInvited?: () => void;
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        {studioId && invitedBy && (
          <InviteForm
            studioId={studioId}
            invitedBy={invitedBy}
            role={role}
            onClose={() => onOpenChange(false)}
            onInvited={onInvited}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function InviteForm({
  studioId,
  invitedBy,
  role,
  onClose,
  onInvited,
}: {
  studioId: string;
  invitedBy: string;
  role: "admin" | "client";
  onClose: () => void;
  onInvited?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canSubmit = email.includes("@") && !submitting && !createdLink;
  const roleLabel = role === "admin" ? "team member" : "client";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const row = await createInvitation(studioId, email, role, invitedBy);
      setCreatedLink(inviteUrl(row.token));
      onInvited?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    if (!createdLink) return;
    try {
      await navigator.clipboard.writeText(createdLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked; user can select manually */
    }
  }

  return (
    <>
      <SheetHeader className="p-6 pb-4">
        <div className="inline-flex items-center gap-2 self-start px-2 py-1 rounded-md text-[11px] font-medium mb-3 bg-[--role-accent-light] text-[--role-accent-dark]">
          <UserPlus className="w-3 h-3" />
          New {role === "admin" ? "admin" : "client"}
        </div>
        <SheetTitle className="text-[20px] font-semibold tracking-tight">
          {createdLink ? "Invite ready" : `Invite a ${roleLabel}`}
        </SheetTitle>
        <SheetDescription>
          {createdLink
            ? "Share this link any way you like. It expires in 7 days and can only be used once."
            : `Enter their email. We'll generate a one-time link you can share — no automatic email yet.`}
        </SheetDescription>
      </SheetHeader>

      {createdLink ? (
        <div className="px-6 pb-4 space-y-4">
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-2">
              Share link
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[12px] font-mono truncate select-all bg-card border border-border rounded-md px-2 py-1.5">
                {createdLink}
              </code>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 shrink-0"
                onClick={copyLink}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
              Sent to: <span className="text-foreground">{email}</span> · Expires in 7 days
            </p>
          </div>

          <div className="rounded-lg border border-dashed border-border p-3 text-[12px] text-muted-foreground leading-relaxed">
            <Mail className="w-3.5 h-3.5 inline mr-1.5" />
            Automatic invite emails will land in a later release. For now,
            paste the link into WhatsApp, Slack, or your own email client.
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="px-6 pb-4 space-y-4">
          <div>
            <label className="block text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={role === "admin" ? "stylist@example.com" : "client@example.com"}
              autoComplete="off"
              required
              className={cn(
                "w-full h-10 rounded-lg border border-border bg-background px-3 text-[13px] outline-none motion-safe:transition-colors motion-safe:duration-150",
                "hover:border-foreground/30 focus:border-ring focus:ring-2 focus:ring-ring/20"
              )}
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              This shows up in your pending invites. The invite link works regardless
              of which email they sign up with.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-[--neg]/30 bg-[--neg]/10 px-3 py-2 text-[12px] text-[--neg]"
            >
              {error}
            </div>
          )}
        </form>
      )}

      <div className="mt-auto p-6 pt-4 border-t border-border flex flex-col gap-2">
        {createdLink ? (
          <>
            <Button className="w-full" onClick={onClose}>
              Done
            </Button>
          </>
        ) : (
          <>
            <Button
              className="w-full gap-2"
              onClick={onSubmit}
              disabled={!canSubmit}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Generate invite link
                </>
              )}
            </Button>
            <Button variant="ghost" className="w-full" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
          </>
        )}
      </div>
    </>
  );
}

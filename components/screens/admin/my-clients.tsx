"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Loader2,
  AlertCircle,
  X,
  Copy,
  Check,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonCell, HueAvatar } from "@/components/shared";
import { useCurrentMember } from "@/lib/auth/use-current-member";
import { useAdminClients, type AdminClient } from "@/lib/admin-clients";
import {
  useStudioInvitations,
  cancelInvitation,
  inviteUrl,
} from "@/lib/members";
import { startThreadWith } from "@/lib/chat";
import { InviteSheet } from "@/components/invite-sheet";
import { TableSkeletonRows } from "@/components/skeletons";

export function AdminMyClients() {
  const { member } = useCurrentMember();
  const studioId = member?.studio.id;
  const adminMemberId = member?.member.id;
  const adminUserId = member?.user.id;

  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);

  const { clients, total, loading } = useAdminClients({ adminMemberId, search });
  const {
    invitations,
    loading: invitesLoading,
    error: invitesError,
    refetch: refetchInvites,
  } = useStudioInvitations(studioId, "client");

  const pendingCount = invitations.length;

  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="flex items-start mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-[24px] font-semibold tracking-tight leading-tight">My clients</h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            {loading
              ? "Loading…"
              : `${total} ${total === 1 ? "client" : "clients"}${
                  pendingCount > 0
                    ? ` · ${pendingCount} pending invite${pendingCount === 1 ? "" : "s"}`
                    : ""
                }`}
          </p>
        </div>
        <div className="flex-1" />
        <Button
          size="sm"
          className="gap-2"
          onClick={() => setInviteOpen(true)}
          disabled={!studioId || !adminUserId}
        >
          <Plus className="w-3.5 h-3.5" /> Invite client
        </Button>
      </div>

      {invitesError && (
        <div
          role="alert"
          className="rounded-lg border border-[--neg]/30 bg-[--neg]/10 px-3 py-2 text-[12px] text-[--neg] mb-4 inline-flex items-center gap-2"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          {invitesError}
        </div>
      )}

      {invitations.length > 0 && (
        <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden mb-5">
          <div className="px-6 py-3 border-b border-border">
            <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground">
              Pending invitations
            </div>
          </div>
          <div className="divide-y divide-[--line-soft]">
            {invitesLoading
              ? Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-12 m-2 rounded-md bg-muted/40 animate-pulse" />
                ))
              : invitations.map((inv) => (
                  <PendingInviteRow
                    key={inv.id}
                    id={inv.id}
                    email={inv.email}
                    token={inv.token}
                    createdAt={inv.created_at}
                    onCancelled={refetchInvites}
                  />
                ))}
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="flex items-center px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2 bg-muted/70 hover:bg-muted px-3 py-1.5 rounded-lg max-w-[320px] flex-1 motion-safe:transition-colors motion-safe:duration-150 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-card">
            <Search className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients…"
              className="bg-transparent border-0 outline-none text-[13px] placeholder:text-muted-foreground flex-1"
              aria-label="Search clients"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border">
                <Th first>Client</Th>
                <Th>Visits</Th>
                <Th>Last visit</Th>
                <Th>Next visit</Th>
                <Th>Favourite service</Th>
                <Th align="right">Credits used</Th>
                <th className="pb-3 pt-3 pr-6" />
              </tr>
            </thead>
            <tbody>
              {loading && clients.length === 0 && (
                <TableSkeletonRows rows={6} cols={7} />
              )}
              {!loading &&
                clients.map((c) => <ClientRow key={c.clientMemberId} client={c} />)}
              {!loading && clients.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                    {search.trim() ? (
                      <>No clients match &quot;{search.trim()}&quot;</>
                    ) : (
                      <>
                        No clients yet.{" "}
                        <button
                          type="button"
                          onClick={() => setInviteOpen(true)}
                          className="text-[--role-accent] hover:underline font-medium"
                          disabled={!studioId || !adminUserId}
                        >
                          Invite one
                        </button>{" "}
                        to get started.
                      </>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <InviteSheet
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        studioId={studioId}
        invitedBy={adminUserId}
        role="client"
        onInvited={refetchInvites}
      />
    </div>
  );
}

function ClientRow({ client: c }: { client: AdminClient }) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  async function openConversation() {
    if (starting) return;
    setStarting(true);
    try {
      const threadId = await startThreadWith(c.clientMemberId);
      router.push(`/admin/messages?thread=${threadId}`);
    } catch (e) {
      console.error("[admin/clients] startThreadWith:", e);
      setStarting(false);
    }
  }

  return (
    <tr className="border-b border-[--line-soft] last:border-0 hover:bg-muted/40 motion-safe:transition-colors motion-safe:duration-150">
      <td className="py-3.5 pl-6">
        <PersonCell name={c.name} hue={c.hue} />
      </td>
      <td className="py-3.5 tabular-nums">{c.visits}</td>
      <td className="py-3.5 text-xs text-muted-foreground">{c.lastVisitLabel}</td>
      <td className="py-3.5 text-xs text-muted-foreground">{c.nextVisitLabel}</td>
      <td className="py-3.5 text-xs">{c.favouriteService ?? "—"}</td>
      <td className="py-3.5 text-right tabular-nums">{c.totalCreditsCharged}</td>
      <td className="py-3.5 pr-6 text-right">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Message ${c.name}`}
          onClick={openConversation}
          disabled={starting}
        >
          {starting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MessageSquare className="w-4 h-4" />
          )}
        </Button>
      </td>
    </tr>
  );
}

function PendingInviteRow({
  id,
  email,
  token,
  createdAt,
  onCancelled,
}: {
  id: string;
  email: string;
  token: string;
  createdAt: string;
  onCancelled: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(inviteUrl(token));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  }

  async function cancel() {
    if (cancelling) return;
    setCancelling(true);
    try {
      await cancelInvitation(id);
    } catch (e) {
      console.error("[admin/clients] cancelInvitation:", e);
    } finally {
      setCancelling(false);
      onCancelled();
    }
  }

  return (
    <div className="flex items-center gap-2.5 px-6 py-3">
      <HueAvatar name={email} hue={hashHue(email)} />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium truncate">{email}</div>
        <div className="text-[11px] text-muted-foreground">Sent {timeAgo(createdAt)}</div>
      </div>
      <Button
        variant="ghost"
        size="xs"
        className="gap-1 text-[--role-accent] hover:text-[--role-accent-dark]"
        onClick={copy}
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied ? "Copied" : "Copy link"}
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={`Cancel invite for ${email}`}
        onClick={cancel}
        disabled={cancelling}
      >
        {cancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
      </Button>
    </div>
  );
}

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

function timeAgo(ts: string): string {
  const d = new Date(ts);
  const diffMs = Date.now() - d.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function Th({
  children,
  first,
  last,
  align = "left",
}: {
  children: React.ReactNode;
  first?: boolean;
  last?: boolean;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3 ${
        align === "right" ? "text-right" : "text-left"
      } ${first ? "pl-6" : ""} ${last ? "pr-6" : ""}`}
    >
      {children}
    </th>
  );
}

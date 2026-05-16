"use client";

import { useMemo, useState } from "react";
import {
  Filter,
  ArrowUpRight,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  X,
  Copy,
  Check,
  Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatBlock, PersonCell, Pill, HueAvatar } from "@/components/shared";
import { useCurrentMember } from "@/lib/auth/use-current-member";
import {
  useStudioMembers,
  useStudioInvitations,
  cancelInvitation,
  inviteUrl,
} from "@/lib/members";
import { InviteSheet } from "@/components/invite-sheet";
import { GiftCreditsSheet } from "@/components/gift-credits-sheet";
import { cn } from "@/lib/utils";

const FILTERS = ["All", "Subscribers", "Pay-as-you-go", "Lapsed"] as const;
type FilterT = (typeof FILTERS)[number];

export function ClientsScreen() {
  const [filter, setFilter] = useState<FilterT>("All");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [giftTarget, setGiftTarget] = useState<
    | { memberId: string; name: string; hue: number; email?: string }
    | null
  >(null);

  const { member } = useCurrentMember();
  const studioId = member?.studio.id;
  const ownerUserId = member?.user.id;

  const {
    members: clients,
    loading: clientsLoading,
    error: clientsError,
    refetch: refetchClients,
  } = useStudioMembers(studioId, "client");

  const {
    invitations,
    loading: invitesLoading,
    error: invitesError,
    refetch: refetchInvites,
  } = useStudioInvitations(studioId, "client");

  // Top-line stats from live data. Some are placeholders until bookings land.
  const stats = useMemo(() => {
    const total = clients.length;
    const pending = invitations.length;
    return { total, pending };
  }, [clients, invitations]);

  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="flex items-start mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-[24px] font-semibold tracking-tight leading-tight">Clients</h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            {stats.total} total · {stats.pending} pending invite
            {stats.pending === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-3.5 h-3.5" /> All plans
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowUpRight className="w-3.5 h-3.5" /> Export
          </Button>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => setInviteOpen(true)}
            disabled={!studioId || !ownerUserId}
          >
            <Plus className="w-3.5 h-3.5" /> Invite client
          </Button>
        </div>
      </div>

      {(clientsError || invitesError) && (
        <div
          role="alert"
          className="rounded-lg border border-[--neg]/30 bg-[--neg]/10 px-3 py-2 text-[12px] text-[--neg] mb-4 inline-flex items-center gap-2"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          {clientsError ?? invitesError}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatBlock
          label="Total"
          value={String(stats.total)}
          foot={`${stats.pending} pending invite${stats.pending === 1 ? "" : "s"}`}
          hero
        />
        <StatBlock label="Active subscribers" value="—" foot="needs plans data" />
        <StatBlock label="Low credits" value="—" foot="needs bookings data" />
        <StatBlock label="Avg LTV" value="—" foot="needs bookings data" />
      </div>

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
        <div className="flex items-center px-6 py-4 border-b border-border gap-4 flex-wrap">
          <button
            type="button"
            aria-label="Search clients"
            className="flex items-center gap-2 bg-muted/70 hover:bg-muted px-3 py-1.5 rounded-lg max-w-[320px] flex-1 motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card text-left"
          >
            <Search className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
            <span className="text-[13px] text-muted-foreground">Search clients…</span>
          </button>
          <div className="flex-1" />
          <div role="tablist" className="flex items-center gap-0.5 p-0.5 bg-muted rounded-lg">
            {FILTERS.map((t) => {
              const active = filter === t;
              return (
                <button
                  key={t}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(t)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-md motion-safe:transition-all motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-card text-foreground shadow-sm font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border">
              <Th first>Client</Th>
              <Th>Plan</Th>
              <Th>Credits</Th>
              <Th>Joined</Th>
              <Th align="right">LTV</Th>
              <Th>Status</Th>
              <th className="pb-3 pt-3 pr-4" />
            </tr>
          </thead>
          <tbody>
            {clientsLoading && clients.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Loading clients…</span>
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  No clients yet.{" "}
                  <button
                    type="button"
                    onClick={() => setInviteOpen(true)}
                    className="text-[--role-accent] hover:underline font-medium"
                    disabled={!studioId || !ownerUserId}
                  >
                    Invite one
                  </button>{" "}
                  to get started.
                </td>
              </tr>
            ) : (
              clients.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-[--line-soft] last:border-0 hover:bg-muted/40 motion-safe:transition-colors motion-safe:duration-150"
                >
                  <td className="py-3.5 pl-6">
                    <PersonCell
                      name={c.user.name}
                      meta={c.user.email}
                      hue={c.user.avatar_hue}
                    />
                  </td>
                  <td className="text-xs text-muted-foreground">—</td>
                  <td className="text-xs text-muted-foreground">—</td>
                  <td className="text-xs text-muted-foreground tabular-nums">
                    {formatJoined(c.joined_at)}
                  </td>
                  <td className="text-right tabular-nums text-muted-foreground">—</td>
                  <td>
                    <Pill kind="sage" dot>
                      Active
                    </Pill>
                  </td>
                  <td className="pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Gift credits to ${c.user.name}`}
                        onClick={() =>
                          setGiftTarget({
                            memberId: c.id,
                            name: c.user.name,
                            hue: c.user.avatar_hue,
                            email: c.user.email,
                          })
                        }
                      >
                        <Gift className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`More actions for ${c.user.name}`}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex items-center px-6 py-3.5 border-t border-border text-xs text-muted-foreground tabular-nums">
          <span>
            Showing {clients.length} of {clients.length}
          </span>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon-sm" aria-label="Previous page" disabled>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="icon-sm" aria-label="Next page" disabled>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <InviteSheet
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        studioId={studioId}
        invitedBy={ownerUserId}
        role="client"
        onInvited={() => {
          refetchInvites();
          refetchClients();
        }}
      />

      <GiftCreditsSheet
        open={giftTarget !== null}
        onOpenChange={(o) => {
          if (!o) setGiftTarget(null);
        }}
        client={giftTarget}
        onGifted={refetchClients}
      />
    </div>
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
      console.error("[clients] cancelInvitation:", e);
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

function formatJoined(ts: string): string {
  const d = new Date(ts);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
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
  align = "left",
}: {
  children: React.ReactNode;
  first?: boolean;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3 ${
        align === "right" ? "text-right" : "text-left"
      } ${first ? "pl-6" : ""}`}
    >
      {children}
    </th>
  );
}

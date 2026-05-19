"use client";

import { useMemo, useState } from "react";
import {
  Filter,
  Plus,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  X,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonCell, UtilBar, HueAvatar, Pill } from "@/components/shared";
import { TableSkeletonRows } from "@/components/skeletons";
import { useCurrentMember } from "@/lib/auth/use-current-member";
import {
  useStudioMembers,
  useStudioInvitations,
  cancelInvitation,
  inviteUrl,
} from "@/lib/members";
import { InviteSheet } from "@/components/invite-sheet";

export function AdminsScreen() {
  const { member } = useCurrentMember();
  const studioId = member?.studio.id;
  const ownerUserId = member?.user.id;

  const {
    members: admins,
    loading: adminsLoading,
    error: adminsError,
    refetch: refetchAdmins,
  } = useStudioMembers(studioId, "admin");

  const {
    invitations,
    loading: invitesLoading,
    error: invitesError,
    refetch: refetchInvites,
  } = useStudioInvitations(studioId, "admin");

  const [inviteOpen, setInviteOpen] = useState(false);

  const stats = useMemo(() => {
    const commissions = admins
      .map((a) => a.commission_pct)
      .filter((c): c is number => c != null);
    const avg =
      commissions.length > 0
        ? Math.round(commissions.reduce((a, b) => a + b, 0) / commissions.length)
        : null;
    const min = commissions.length > 0 ? Math.min(...commissions) : null;
    const max = commissions.length > 0 ? Math.max(...commissions) : null;
    return { count: admins.length, pending: invitations.length, avg, min, max };
  }, [admins, invitations]);

  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="flex items-start mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-[24px] font-semibold tracking-tight leading-tight">Admins</h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            {stats.count} active · {stats.pending} pending invite
            {stats.pending === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-3.5 h-3.5" /> Active
          </Button>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => setInviteOpen(true)}
            disabled={!studioId || !ownerUserId}
          >
            <Plus className="w-3.5 h-3.5" /> Invite admin
          </Button>
        </div>
      </div>

      {(adminsError || invitesError) && (
        <div
          role="alert"
          className="rounded-lg border border-[--neg]/30 bg-[--neg]/10 px-3 py-2 text-[12px] text-[--neg] mb-4 inline-flex items-center gap-2"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          {adminsError ?? invitesError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardLabel>Schedule density (this week)</CardLabel>
          {adminsLoading ? (
            <ListSkeleton rows={3} />
          ) : admins.length === 0 ? (
            <EmptyHint>Invite an admin to see their schedule here.</EmptyHint>
          ) : (
            <div className="grid grid-cols-[80px_1fr] gap-x-3 gap-y-2 items-center mt-3.5">
              {admins.map((a) => (
                <div key={a.id} className="contents">
                  <div className="text-xs text-muted-foreground truncate">
                    {a.user.name.split(" ")[0]}
                  </div>
                  {/* Placeholder utilization — needs sessions data (Phase 2.E) */}
                  <UtilBar value={0} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardLabel>Commission split</CardLabel>
          <div className="flex items-end mt-3.5 mb-2.5 gap-3">
            <span className="text-[40px] font-semibold tracking-tight leading-none tabular-nums">
              {stats.avg ?? "—"}
              <span className="text-2xl text-muted-foreground font-normal">%</span>
            </span>
            <div className="flex-1" />
            <Pill kind="sage">House avg</Pill>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Admins keep a % of each booking&rsquo;s gross. Adjust per admin in their profile.
          </p>
          <div className="h-px bg-border my-4" />
          <div className="flex items-center text-xs text-muted-foreground">
            <span>Range</span>
            <span className="flex-1" />
            <span className="tabular-nums">
              {stats.min != null && stats.max != null
                ? `${stats.min}% – ${stats.max}%`
                : "—"}
            </span>
          </div>
        </Card>

        <Card>
          <CardLabel>Pending invitations</CardLabel>
          <div className="mt-2">
            {invitesLoading ? (
              <ListSkeleton rows={2} />
            ) : invitations.length === 0 ? (
              <EmptyHint>No pending invites.</EmptyHint>
            ) : (
              invitations.map((inv) => (
                <PendingInviteRow
                  key={inv.id}
                  id={inv.id}
                  email={inv.email}
                  token={inv.token}
                  createdAt={inv.created_at}
                  onCancelled={refetchInvites}
                />
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Admins table */}
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border">
              <Th first>Admin</Th>
              <Th>Specialty</Th>
              <Th>Commission</Th>
              <Th align="right">Joined</Th>
              <th className="pb-3 pt-3 pr-4" />
            </tr>
          </thead>
          <tbody>
            {adminsLoading && admins.length === 0 ? (
              <TableSkeletonRows rows={5} cols={5} />
            ) : admins.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                  No admins yet. Invite one to get started.
                </td>
              </tr>
            ) : (
              admins.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-[--line-soft] last:border-0 hover:bg-muted/40 motion-safe:transition-colors motion-safe:duration-150"
                >
                  <td className="py-3.5 pl-6">
                    <PersonCell
                      name={a.user.name}
                      meta={a.user.email}
                      hue={a.user.avatar_hue}
                    />
                  </td>
                  <td>{a.specialty ?? <span className="text-muted-foreground">—</span>}</td>
                  <td className="tabular-nums font-medium">
                    {a.commission_pct != null ? (
                      `${a.commission_pct}%`
                    ) : (
                      <span className="text-muted-foreground font-normal">—</span>
                    )}
                  </td>
                  <td className="text-right tabular-nums text-muted-foreground">
                    {formatJoined(a.joined_at)}
                  </td>
                  <td className="pr-4">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`More actions for ${a.user.name}`}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <InviteSheet
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        studioId={studioId}
        invitedBy={ownerUserId}
        role="admin"
        onInvited={() => {
          refetchInvites();
          refetchAdmins();
        }}
      />
    </div>
  );
}

/* ─────────── helpers ─────────── */

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
      /* clipboard blocked; user can copy manually from URL bar */
    }
  }

  async function cancel() {
    if (cancelling) return;
    setCancelling(true);
    try {
      await cancelInvitation(id);
    } catch (e) {
      console.error("[admins] cancelInvitation:", e);
    } finally {
      setCancelling(false);
      onCancelled();
    }
  }

  return (
    <div className="flex items-center gap-2.5 py-2 border-b border-[--line-soft] last:border-0">
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

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-card motion-safe:transition-shadow motion-safe:duration-200 hover:shadow-hero">
      {children}
    </div>
  );
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground">
      {children}
    </div>
  );
}

function ListSkeleton({ rows }: { rows: number }) {
  return (
    <div className="mt-3.5 space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-7 rounded-md bg-muted/40 animate-pulse" />
      ))}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] text-muted-foreground mt-3.5 leading-relaxed">{children}</p>
  );
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

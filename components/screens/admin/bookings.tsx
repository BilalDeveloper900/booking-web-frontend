"use client";

import { MoreHorizontal, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatBlock, PersonCell, Pill } from "@/components/shared";
import { TableSkeletonRows } from "@/components/skeletons";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCurrentMember } from "@/lib/auth/use-current-member";
import {
  useAdminBookings,
  useAdminBookingStats,
  type AdminBookingRow,
  type AdminBookingTab,
} from "@/lib/admin-bookings";

export function AdminBookings() {
  const { member } = useCurrentMember();
  const studioId = member?.studio.id;
  const adminMemberId = member?.member.id;

  const stats = useAdminBookingStats({ studioId, adminMemberId });
  const upcoming = useAdminBookings({ studioId, adminMemberId, tab: "upcoming" });
  const pending = useAdminBookings({ studioId, adminMemberId, tab: "pending" });
  const past = useAdminBookings({ studioId, adminMemberId, tab: "past" });

  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-[24px] font-semibold tracking-tight leading-tight">Bookings</h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Manage your upcoming and past sessions
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatBlock
          label="Confirmed"
          value={String(stats.stats.confirmedNext7d)}
          foot="next 7 days"
          hero
        />
        <StatBlock
          label="Pending"
          value={String(stats.stats.pendingCount)}
          foot="awaiting confirmation"
        />
        <StatBlock
          label="Hours booked"
          value={stats.stats.hoursThisWeek.toString()}
          foot="this week"
        />
        <StatBlock
          label="Credits"
          value={String(stats.stats.creditsThisWeek)}
          foot="this week"
        />
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList variant="line" className="mb-4">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <BookingsTable tab="upcoming" rows={upcoming.rows} loading={upcoming.loading} />
        </TabsContent>

        <TabsContent value="pending">
          <BookingsTable tab="pending" rows={pending.rows} loading={pending.loading} />
        </TabsContent>

        <TabsContent value="past">
          <BookingsTable tab="past" rows={past.rows} loading={past.loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BookingsTable({
  tab,
  rows,
  loading,
}: {
  tab: AdminBookingTab;
  rows: AdminBookingRow[];
  loading: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border">
              <Th first>Date</Th>
              <Th>Time</Th>
              <Th>Client</Th>
              <Th>Service</Th>
              <Th>Duration</Th>
              <Th>Credits</Th>
              <Th>Status</Th>
              <th className="pb-3 pt-3 pr-4" />
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 && (
              <TableSkeletonRows rows={6} cols={8} />
            )}
            {!loading &&
              rows.map((b) => (
                <tr
                  key={b.bookingId}
                  className="border-b border-[--line-soft] last:border-0 hover:bg-muted/40 motion-safe:transition-colors motion-safe:duration-150"
                >
                  <td className="py-3.5 pl-6 text-xs text-muted-foreground tabular-nums">{b.dateLabel}</td>
                  <td className="py-3.5 tabular-nums">{b.timeLabel}</td>
                  <td className="py-3.5">
                    <PersonCell name={b.client} hue={b.clientHue} />
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-1.5">
                      {b.service}
                      {b.mode === "group" && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                          <Users className="w-2.5 h-2.5" aria-hidden /> Class
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 tabular-nums">{b.durationLabel}</td>
                  <td className="py-3.5 tabular-nums">{b.credits}</td>
                  <td className="py-3.5">
                    {b.status === "confirmed" && <Pill kind="sage" dot>Confirmed</Pill>}
                    {b.status === "now" && <Pill kind="teal" dot>In session</Pill>}
                    {b.status === "pending" && <Pill kind="warn" dot>Pending</Pill>}
                    {b.status === "attended" && <Pill kind="sage">Attended</Pill>}
                    {b.status === "no_show" && <Pill kind="warn">No-show</Pill>}
                    {b.status === "cancelled" && <Pill>Cancelled</Pill>}
                    {b.status === "waitlist" && <Pill>Waitlist</Pill>}
                  </td>
                  <td className="pr-4">
                    <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${b.client}`}>
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                  {emptyMessage(tab)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!loading && rows.length > 0 && (
        <div className="flex items-center px-6 py-3.5 border-t border-border text-xs text-muted-foreground tabular-nums">
          <span>
            Showing {rows.length} {rows.length === 1 ? "booking" : "bookings"}
          </span>
        </div>
      )}
    </div>
  );
}

function emptyMessage(tab: AdminBookingTab): string {
  switch (tab) {
    case "upcoming":
      return "No confirmed bookings coming up.";
    case "pending":
      return "Nothing waiting on your approval.";
    case "past":
      return "No past bookings yet.";
  }
}

function Th({ children, first }: { children: React.ReactNode; first?: boolean }) {
  return (
    <th
      className={`text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3 ${
        first ? "pl-6" : ""
      }`}
    >
      {children}
    </th>
  );
}

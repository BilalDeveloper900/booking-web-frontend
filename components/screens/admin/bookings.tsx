import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatBlock, PersonCell, Pill } from "@/components/shared";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ADMIN_BOOKINGS } from "@/lib/data";

const UPCOMING_BOOKINGS = ADMIN_BOOKINGS.filter(
  (b) => b.status === "confirmed" || b.status === "now"
);
const PENDING_BOOKINGS = ADMIN_BOOKINGS.filter((b) => b.status === "pending");

export function AdminBookings() {
  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-[24px] font-semibold tracking-tight leading-tight">Bookings</h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Manage your upcoming and past sessions
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatBlock label="Confirmed" value="6" foot="next 7 days" hero />
        <StatBlock label="Pending" value="2" foot="awaiting confirmation" />
        <StatBlock label="Hours booked" value="14.5" unit="/32" foot="this week" />
        <StatBlock label="Credits earned" value="34" delta="6%" foot="this week" />
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList variant="line" className="mb-4">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <BookingsTable rows={UPCOMING_BOOKINGS} />
        </TabsContent>

        <TabsContent value="pending">
          <BookingsTable rows={PENDING_BOOKINGS} />
        </TabsContent>

        <TabsContent value="past">
          <BookingsTable rows={[]} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BookingsTable({ rows }: { rows: (typeof ADMIN_BOOKINGS)[number][] }) {
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
            {rows.map((b, i) => (
              <tr
                key={i}
                className="border-b border-[--line-soft] last:border-0 hover:bg-muted/40 motion-safe:transition-colors motion-safe:duration-150"
              >
                <td className="py-3.5 pl-6 text-xs text-muted-foreground tabular-nums">{b.date}</td>
                <td className="py-3.5 tabular-nums">{b.time}</td>
                <td className="py-3.5"><PersonCell name={b.client} hue={b.hue} /></td>
                <td className="py-3.5">{b.service}</td>
                <td className="py-3.5 tabular-nums">{b.duration}</td>
                <td className="py-3.5 tabular-nums">{b.credits}</td>
                <td className="py-3.5">
                  {b.status === "confirmed" && <Pill kind="sage" dot>Confirmed</Pill>}
                  {b.status === "now" && <Pill kind="teal" dot>In session</Pill>}
                  {b.status === "pending" && <Pill kind="warn" dot>Pending</Pill>}
                </td>
                <td className="pr-4">
                  <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${b.client}`}>
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                  No bookings to show
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center px-6 py-3.5 border-t border-border text-xs text-muted-foreground tabular-nums">
        <span>Showing {rows.length} of 48</span>
      </div>
    </div>
  );
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

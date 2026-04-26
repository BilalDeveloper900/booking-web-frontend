import { MoreHorizontal } from "lucide-react";
import { StatBlock, PersonCell, Pill } from "@/components/shared";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { STYLIST_BOOKINGS } from "@/lib/data";

const UPCOMING_BOOKINGS = STYLIST_BOOKINGS.filter(
  (b) => b.status === "confirmed" || b.status === "now"
);
const PENDING_BOOKINGS = STYLIST_BOOKINGS.filter(
  (b) => b.status === "pending"
);

export function StylistBookings() {
  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-[15px] font-semibold tracking-tight">Bookings</h2>
        <p className="text-[13px] text-muted-foreground">
          Manage your upcoming and past sessions
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatBlock label="Confirmed" value="6" foot="next 7 days" />
        <StatBlock label="Pending" value="2" foot="awaiting confirmation" />
        <StatBlock
          label="Hours booked"
          value="14.5"
          unit="/32"
          foot="this week"
        />
        <StatBlock
          label="Credits earned"
          value="34"
          delta="6%"
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
          <BookingsTable
            rows={UPCOMING_BOOKINGS}
          />
        </TabsContent>

        <TabsContent value="pending">
          <BookingsTable
            rows={PENDING_BOOKINGS}
          />
        </TabsContent>

        <TabsContent value="past">
          <BookingsTable rows={[]} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BookingsTable({
  rows,
}: {
  rows: (typeof STYLIST_BOOKINGS)[number][];
}) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3 pl-6">
                Date
              </th>
              <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">
                Time
              </th>
              <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">
                Client
              </th>
              <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">
                Service
              </th>
              <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">
                Duration
              </th>
              <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">
                Credits
              </th>
              <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">
                Status
              </th>
              <th className="pb-3 pt-3 pr-4" />
            </tr>
          </thead>
          <tbody>
            {rows.map((b, i) => (
              <tr
                key={i}
                className="border-b border-[--line-soft] last:border-0"
              >
                <td className="py-3.5 pl-6 text-xs text-muted-foreground">
                  {b.date}
                </td>
                <td className="py-3.5 tabular-nums">{b.time}</td>
                <td className="py-3.5">
                  <PersonCell name={b.client} hue={b.hue} />
                </td>
                <td className="py-3.5">{b.service}</td>
                <td className="py-3.5 tabular-nums">{b.duration}</td>
                <td className="py-3.5 tabular-nums">{b.credits}</td>
                <td className="py-3.5">
                  {b.status === "confirmed" && (
                    <Pill kind="sage" dot>
                      Confirmed
                    </Pill>
                  )}
                  {b.status === "now" && (
                    <Pill kind="teal" dot>
                      In session
                    </Pill>
                  )}
                  {b.status === "pending" && (
                    <Pill kind="warn" dot>
                      Pending
                    </Pill>
                  )}
                </td>
                <td className="pr-4 text-muted-foreground">
                  <MoreHorizontal className="w-4 h-4" />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  No bookings to show
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center px-6 py-3.5 border-t border-border text-xs text-muted-foreground">
        <span>Showing {rows.length} of 48</span>
      </div>
    </div>
  );
}

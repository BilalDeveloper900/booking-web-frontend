import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PersonCell, Pill } from "@/components/shared";
import { CLIENT_UPCOMING, CLIENT_PAST_VISITS } from "@/lib/data";

export function ClientBookings() {
  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-[24px] font-semibold tracking-tight leading-tight">My bookings</h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          View and manage your appointments
        </p>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList variant="line" className="mb-5">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <div className="grid grid-cols-1 gap-3">
            {CLIENT_UPCOMING.map((a) => (
              <BookingCard key={a.id}>
                <DateBlock date={a.date} dateNum={a.dateNum} accent />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-[13px] font-medium">{a.service}</span>
                    <Pill kind="teal" dot>{a.status}</Pill>
                  </div>
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {a.time} · {a.duration} · {a.credits} credits
                  </div>
                  <div className="mt-1.5">
                    <PersonCell name={a.admin} hue={a.hue} />
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 sm:ml-auto">
                  <Button variant="outline" size="sm">Reschedule</Button>
                  <Button variant="ghost" size="sm">Cancel</Button>
                </div>
              </BookingCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="past">
          <div className="grid grid-cols-1 gap-3">
            {CLIENT_PAST_VISITS.map((v, i) => {
              const [day, mon] = v.date.split(" ");
              return (
                <BookingCard key={i}>
                  <DateBlock date={mon} dateNum={day} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium mb-0.5">{v.service}</div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      {v.admin} · {v.credits} credits
                    </div>
                    <div className="mt-1.5">
                      <Stars value={v.rating} />
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 sm:ml-auto">
                    <Button size="sm">Rebook</Button>
                  </div>
                </BookingCard>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="cancelled">
          <div className="bg-card border border-border rounded-xl shadow-card p-12 text-center text-sm text-muted-foreground">
            No cancelled bookings
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BookingCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-card p-4 flex flex-col sm:flex-row sm:items-center gap-4 motion-safe:transition-all motion-safe:duration-200 hover:shadow-hero hover:-translate-y-px">
      {children}
    </div>
  );
}

function DateBlock({
  date,
  dateNum,
  accent,
}: {
  date: string;
  dateNum: string | number;
  accent?: boolean;
}) {
  return (
    <div
      className={
        accent
          ? "w-12 h-14 rounded-lg bg-[--role-accent-light] text-[--role-accent-dark] flex flex-col items-center justify-center shrink-0"
          : "w-12 h-14 rounded-lg bg-muted flex flex-col items-center justify-center shrink-0"
      }
    >
      <span className="text-[11px] font-medium leading-none">{date}</span>
      <span className="text-lg font-bold leading-tight tabular-nums">{dateNum}</span>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${n <= value ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/40"}`}
          aria-hidden
        />
      ))}
    </span>
  );
}

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PersonCell, Pill } from "@/components/shared";
import { CLIENT_UPCOMING, CLIENT_PAST_VISITS } from "@/lib/data";

export function ClientBookings() {
  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <h2 className="text-[15px] font-semibold tracking-tight mb-1">
        My bookings
      </h2>
      <p className="text-[13px] text-muted-foreground mb-6">
        View and manage your appointments
      </p>

      <Tabs defaultValue="upcoming">
        <TabsList variant="line" className="mb-5">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <div className="grid grid-cols-1 gap-3">
            {CLIENT_UPCOMING.map((a) => (
              <div
                key={a.id}
                className="bg-card border border-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex items-center gap-4 sm:gap-5">
                  <div className="w-12 h-14 rounded-lg bg-muted flex flex-col items-center justify-center shrink-0">
                    <span className="text-[11px] font-medium text-muted-foreground leading-none">
                      {a.date}
                    </span>
                    <span className="text-lg font-bold leading-tight tabular-nums">
                      {a.dateNum}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[13px] font-medium">
                        {a.service}
                      </span>
                      <Pill kind="teal" dot>
                        {a.status}
                      </Pill>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {a.time} · {a.duration} · {a.credits} credits
                    </div>
                    <div className="mt-1.5">
                      <PersonCell name={a.stylist} hue={a.hue} />
                    </div>
                  </div>
                </div>
                <div className="flex-1" />
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm">
                    Reschedule
                  </Button>
                  <Button variant="ghost" size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="past">
          <div className="grid grid-cols-1 gap-3">
            {CLIENT_PAST_VISITS.map((v, i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex items-center gap-4 sm:gap-5">
                  <div className="w-12 h-14 rounded-lg bg-muted flex flex-col items-center justify-center shrink-0">
                    <span className="text-[13px] font-bold tabular-nums leading-tight">
                      {v.date.split(" ")[0]}
                    </span>
                    <span className="text-[11px] text-muted-foreground leading-none">
                      {v.date.split(" ")[1]}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium mb-0.5">
                      {v.service}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {v.stylist} · {v.credits} credits
                    </div>
                    <div className="text-amber-500 text-xs mt-1 tracking-tight">
                      {"★".repeat(v.rating)}
                      {Array.from({ length: 5 - v.rating }).map((_, j) => (
                        <span key={j} className="opacity-20">
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex-1" />
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm">
                    Rebook
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cancelled">
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
            No cancelled bookings
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

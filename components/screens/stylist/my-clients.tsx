import { Search } from "lucide-react";
import { PersonCell } from "@/components/shared";
import { STYLIST_CLIENTS } from "@/lib/data";

export function StylistMyClients() {
  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-[15px] font-semibold tracking-tight">My Clients</h2>
        <p className="text-[13px] text-muted-foreground">
          7 active clients
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg max-w-[320px] flex-1">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[13px] text-muted-foreground">
              Search clients…
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3 pl-6">
                  Client
                </th>
                <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">
                  Visits
                </th>
                <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">
                  Last visit
                </th>
                <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">
                  Next visit
                </th>
                <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">
                  Favourite service
                </th>
                <th className="text-left text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3">
                  Credits
                </th>
                <th className="text-right text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground pb-3 pt-3 pr-6">
                  Lifetime
                </th>
              </tr>
            </thead>
            <tbody>
              {STYLIST_CLIENTS.map((c) => (
                <tr
                  key={c.name}
                  className="border-b border-[--line-soft] last:border-0"
                >
                  <td className="py-3.5 pl-6">
                    <PersonCell name={c.name} hue={c.hue} />
                  </td>
                  <td className="py-3.5 tabular-nums">{c.visits}</td>
                  <td className="py-3.5 text-xs text-muted-foreground">
                    {c.lastVisit}
                  </td>
                  <td className="py-3.5 text-xs text-muted-foreground">
                    {c.nextVisit}
                  </td>
                  <td className="py-3.5 text-xs">{c.favourite}</td>
                  <td className="py-3.5 tabular-nums">{c.credits}</td>
                  <td className="py-3.5 text-right tabular-nums pr-6">
                    €{c.ltv.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

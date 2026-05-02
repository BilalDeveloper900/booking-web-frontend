import { Search } from "lucide-react";
import { PersonCell } from "@/components/shared";
import { ADMIN_CLIENTS } from "@/lib/data";

export function AdminMyClients() {
  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-[24px] font-semibold tracking-tight leading-tight">My clients</h2>
        <p className="text-[13px] text-muted-foreground mt-1">7 active clients</p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="flex items-center px-6 py-4 border-b border-border">
          <button
            type="button"
            aria-label="Search clients"
            className="flex items-center gap-2 bg-muted/70 hover:bg-muted px-3 py-1.5 rounded-lg max-w-[320px] flex-1 motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card text-left"
          >
            <Search className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
            <span className="text-[13px] text-muted-foreground">Search clients…</span>
          </button>
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
                <Th>Credits</Th>
                <Th align="right" last>Lifetime</Th>
              </tr>
            </thead>
            <tbody>
              {ADMIN_CLIENTS.map((c) => (
                <tr
                  key={c.name}
                  className="border-b border-[--line-soft] last:border-0 hover:bg-muted/40 motion-safe:transition-colors motion-safe:duration-150"
                >
                  <td className="py-3.5 pl-6"><PersonCell name={c.name} hue={c.hue} /></td>
                  <td className="py-3.5 tabular-nums">{c.visits}</td>
                  <td className="py-3.5 text-xs text-muted-foreground">{c.lastVisit}</td>
                  <td className="py-3.5 text-xs text-muted-foreground">{c.nextVisit}</td>
                  <td className="py-3.5 text-xs">{c.favourite}</td>
                  <td className="py-3.5 tabular-nums">{c.credits}</td>
                  <td className="py-3.5 text-right tabular-nums pr-6">€{c.ltv.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
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

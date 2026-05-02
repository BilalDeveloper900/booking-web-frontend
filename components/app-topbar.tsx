import { Bell, Menu, MessageSquare, Search } from "lucide-react";

interface AppTopbarProps {
  title: string;
  onMenuClick?: () => void;
}

export function AppTopbar({ title, onMenuClick }: AppTopbarProps) {
  return (
    <div className="h-16 shrink-0 border-b border-border flex items-center px-4 md:px-8 gap-5 bg-card/80 backdrop-blur supports-backdrop-filter:bg-card/70">
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="lg:hidden w-9 h-9 grid place-items-center rounded-lg hover:bg-muted text-muted-foreground motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          <Menu className="w-5 h-5" aria-hidden />
        </button>
      )}
      <h1 className="text-[17px] font-semibold tracking-tight">{title}</h1>
      <button
        type="button"
        className="ml-auto hidden md:flex items-center gap-2 bg-muted/70 hover:bg-muted px-3 py-1.5 rounded-lg md:w-56 lg:w-72 text-left motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        aria-label="Search clients, bookings, services"
      >
        <Search className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
        <span className="text-[13px] text-muted-foreground flex-1">
          Search clients, bookings, services…
        </span>
        <kbd className="text-[11px] text-muted-foreground font-sans tabular-nums px-1.5 py-px rounded border border-border bg-card">
          ⌘K
        </kbd>
      </button>
      <button
        aria-label="Notifications"
        className="relative md:first:ml-auto w-9 h-9 grid place-items-center rounded-lg hover:bg-muted text-muted-foreground motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
      >
        <Bell className="w-4 h-4" aria-hidden />
        <span
          aria-hidden
          className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[--role-accent]"
        />
      </button>
      <button
        aria-label="Messages"
        className="w-9 h-9 grid place-items-center rounded-lg hover:bg-muted text-muted-foreground motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
      >
        <MessageSquare className="w-4 h-4" aria-hidden />
      </button>
    </div>
  );
}

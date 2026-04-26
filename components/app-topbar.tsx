import { Bell, Menu, MessageSquare, Search } from "lucide-react";

interface AppTopbarProps {
  title: string;
  onMenuClick?: () => void;
}

export function AppTopbar({ title, onMenuClick }: AppTopbarProps) {
  return (
    <div className="h-16 shrink-0 border-b border-border flex items-center px-4 md:px-8 gap-5 bg-card">
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="md:hidden w-9 h-9 grid place-items-center rounded-lg hover:bg-muted transition-colors text-muted-foreground"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}
      <h1 className="text-[17px] font-semibold tracking-tight">{title}</h1>
      <div className="ml-auto hidden md:flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg w-70">
        <Search className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[13px] text-muted-foreground flex-1">
          Search clients, bookings, services…
        </span>
        <span className="text-[11px] text-muted-foreground">⌘K</span>
      </div>
      <button className="md:first:ml-auto w-9 h-9 grid place-items-center rounded-lg hover:bg-muted transition-colors text-muted-foreground">
        <Bell className="w-4 h-4" />
      </button>
      <button className="w-9 h-9 grid place-items-center rounded-lg hover:bg-muted transition-colors text-muted-foreground">
        <MessageSquare className="w-4 h-4" />
      </button>
    </div>
  );
}

import { Zap } from "lucide-react";

/**
 * "Powered by Book It Daily" bar shown to clients of FREE-plan studios. Removed
 * once the studio upgrades to a paid plan (rendered conditionally in
 * DashboardShell). This is the Free→paid branding hook.
 */
export function PoweredByFooter() {
  return (
    <a
      href="https://www.bookitdaily.com"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-1.5 border-t border-border bg-muted/30 px-4 py-2.5 text-[12px] text-muted-foreground hover:text-foreground motion-safe:transition-colors"
    >
      <Zap className="w-3.5 h-3.5 text-primary" aria-hidden />
      Powered by <span className="font-semibold">Book It Daily</span>
    </a>
  );
}

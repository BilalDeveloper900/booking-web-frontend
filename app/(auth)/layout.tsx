import Link from "next/link";
import { Quote } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex bg-background">
      {/* Form side */}
      <div className="flex-1 flex flex-col">
        <header className="px-6 md:px-10 py-6 flex items-center">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-md bg-foreground grid place-items-center text-background font-serif text-lg leading-none motion-safe:transition-transform motion-safe:duration-200 group-hover:rotate-[-4deg]">
              B
            </div>
            <span className="text-[15px] font-semibold tracking-tight">Book It Daily</span>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-[400px]">{children}</div>
        </main>

        <footer className="px-6 md:px-10 py-5 text-[12px] text-muted-foreground flex items-center gap-4 flex-wrap">
          <span>© 2026 Book It Daily</span>
          <span className="hidden sm:inline">·</span>
          <Link href="/" className="hover:text-foreground motion-safe:transition-colors">
            Home
          </Link>
          <Link href="#" className="hover:text-foreground motion-safe:transition-colors">
            Terms
          </Link>
          <Link href="#" className="hover:text-foreground motion-safe:transition-colors">
            Privacy
          </Link>
        </footer>
      </div>

      {/* Decorative side — desktop only */}
      <div className="hidden lg:flex lg:flex-1 relative bg-foreground text-background overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 20%, var(--teal-500) 0, transparent 40%), radial-gradient(circle at 80% 70%, var(--sage-500) 0, transparent 40%)",
          }}
          aria-hidden
        />
        <div className="relative flex-1 flex flex-col justify-between p-10 xl:p-14 max-w-[600px] mx-auto">
          <div className="flex items-center gap-2 text-[11px] tracking-[0.12em] uppercase opacity-60">
            <span className="w-8 h-px bg-background/40" />
            What people say
          </div>

          <div>
            <Quote className="w-8 h-8 text-[--teal-500] mb-6" aria-hidden />
            <blockquote className="font-serif text-[28px] xl:text-[34px] leading-[1.25] tracking-tight">
              &ldquo;We dropped Mindbody a week into Book It Daily. The class packs alone earned us back
              the subscription in three days.&rdquo;
            </blockquote>
            <div className="mt-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[--teal-500] grid place-items-center font-semibold text-foreground">
                RP
              </div>
              <div className="leading-tight">
                <div className="text-[14px] font-semibold">Riverside Pilates</div>
                <div className="text-[12px] opacity-60">Camille Roux, Owner</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-[12px] opacity-50">
            <div>
              <div className="text-[20px] font-semibold tabular-nums">312</div>
              <div>active studios</div>
            </div>
            <div>
              <div className="text-[20px] font-semibold tabular-nums">€1.2M</div>
              <div>booked monthly</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

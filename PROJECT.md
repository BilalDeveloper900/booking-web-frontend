# Book It Daily — Project handover

**Read this before doing anything in this codebase.** It's the project's
architecture in one place. Each section links to the file or folder where the
detail lives.

This is a Pakistan-built **multi-role booking SaaS** for salons / gyms /
studios. Three user types share one codebase. Currently: frontend-only,
Next.js 16, all data is mocked in [`lib/data.ts`](lib/data.ts). The backend
roadmap lives in [BACKEND-PLAN.md](BACKEND-PLAN.md).

---

## 1. Tech stack — note the unusual bits

| Tool | Version | Why it matters |
|---|---|---|
| **Next.js** | **16.2.4** | Has breaking changes from training data. Read `node_modules/next/dist/docs/` before writing routes/middleware. `middleware.ts` was renamed to `proxy.ts` in v16. |
| **React** | 19.2.4 | Stable. Server Components by default; client components opt in with `"use client"`. |
| **TypeScript** | 5.x | Strict mode on. |
| **Tailwind** | **v4** | `@theme inline {}` block in [globals.css](app/globals.css). Spacing scale is dynamic — `w-13` works as 52px. The IDE linter warns about non-canonical arbitrary values. |
| **base-ui (`@base-ui/react`)** | 1.4.1 | **NOT Radix.** Buttons use `render={<Link …/>}` prop, *not* `asChild`. Popover has Root/Trigger/Portal/Positioner/Popup parts. Sheets via `Dialog`. |
| **shadcn-style wrappers** | local | Live in [components/ui/](components/ui/). All wrap base-ui (or are unstyled primitives). Available: avatar, badge, button, card, popover, separator, sheet, skeleton, switch, tabs. |
| **lucide-react** | 1.11 | All icons. Don't use emoji as icons (see [design-system/MASTER.md](design-system/MASTER.md) §11). |
| **recharts** | 3.8.1 | Charts. v3 changed types — for tooltip content callbacks use `TooltipContentProps`, not `TooltipProps`. Pass content as a function: `content={(props) => <Tooltip {...props} />}`. |
| **Lemon Squeezy** | planned | The chosen payment processor. **No Stripe** — owner is in Pakistan. LS is Merchant of Record (handles VAT/tax globally). No marketplace/Connect equivalent. See [BACKEND-PLAN.md](BACKEND-PLAN.md) §Payments. |

**Project skills** in [.agents/skills/](.agents/skills/):
- `next-best-practices/SKILL.md` — read for Next 16 conventions
- `ui-ux-pro-max/SKILL.md` — design intelligence (the Python `--design-system` CLI is symlink-broken; use the markdown rules directly)
- `web-design-guidelines/SKILL.md` — Vercel UI guidelines reviewer

---

## 2. The three roles

| Role | URL | Persona (mock) | Notes |
|---|---|---|---|
| **owner** | `/owner` | Elena Marchetti, "Owner · Pro plan" | Pays the SaaS subscription. Manages admins, clients, finance, offers. |
| **admin** | `/admin` *(was `/stylist` — renamed)* | Camille Roux, "Senior Colorist" | A staff member. Invited by an owner. Has bookings + clients + earnings. **The role used to be called "stylist" in code — a full rename has been done. Don't reintroduce "stylist" terminology.** |
| **client** | `/client` | Olivia Wren, "Studio · 8 credits/mo" | The end customer. Books sessions, has credits + plan. |

Role config: [`lib/roles.ts`](lib/roles.ts). Each `RoleConfig` has `role`,
`label`, `navItems[]`, `user`. Sidebar / bottom-tabs / topbar all read from
this.

The dashboard shell sets a `data-role="..."` attribute on the outer wrapper
so [globals.css](app/globals.css) can scope `--role-accent`,
`--role-accent-light`, `--role-accent-dark`, `--ring` per role:
- owner → teal `oklch(0.42 0.06 195)`
- admin → indigo `oklch(0.55 0.10 260)`
- client → green `oklch(0.55 0.12 155)`

`--primary` is **NOT** per-role. It's `var(--teal-700)` globally — every
primary `<Button>` renders teal across all roles, by design. Don't reintroduce
per-role primary overrides.

---

## 3. Folder map

```
web/
  app/
    layout.tsx                         Root: Poppins + Geist Mono, ThemeProvider, SW register, OfflineIndicator, PWAInstallPrompt
    page.tsx                           Landing page (hero, pricing, features, FAQ, addons, build-offers callout)
    globals.css                        Tailwind v4 @theme + design tokens + role accents + dark mode + PWA helpers
    (auth)/
      layout.tsx                       Split layout: form left + decorative pull-quote right
      _form.tsx                        Shared form primitives (SocialButtons, Field, Input, Divider)
      login/page.tsx                   Email/password + social, mock submit → /owner
      signup/page.tsx                  Self-serve owner signup, password strength meter
      forgot-password/page.tsx         Send reset link (mock)
    (dashboard)/
      owner/                           5 main sections + settings + offers
        layout.tsx                       <DashboardShell role="owner">
        page.tsx                         → DashboardScreen
        calendar/page.tsx                → CalendarScreen (shared across owner + admin)
        clients/page.tsx                 → ClientsScreen
        admins/page.tsx                  → AdminsScreen   (renamed from stylists/)
        offers/page.tsx                  → OffersScreen   (NEW: subscription plans + credit packs builder)
        finance/page.tsx                 → FinanceScreen
        settings/page.tsx                → SettingsScreen role="owner"
      admin/                           6 main sections + settings (renamed from stylist/)
        layout.tsx, page.tsx             <DashboardShell role="admin"> → AdminOverview
        calendar/  bookings/  clients/  earnings/  messages/  settings/
      client/                          5 main sections + settings
        layout.tsx, page.tsx             <DashboardShell role="client"> → ClientHome
        book/  bookings/  credits/  messages/  settings/
  components/
    dashboard-shell.tsx                AppSidebar (lg+) + AppTopbar + AppBottomTabs (<lg) + main {children}
    app-sidebar.tsx                    Desktop nav. Logo, workspace nav, Account section (Subscription/Settings), profile menu trigger
    app-topbar.tsx                     Hamburger (mobile), title, search bar (md+), Bell, Messages, profile menu trigger
    app-bottom-tabs.tsx                Mobile/tablet bottom tab nav (<lg). Reads same RoleConfig.navItems
    profile-menu.tsx                   Popover-based profile menu (avatar/email/role + actions/toggles/sign out)
    theme-provider.tsx                 useTheme() context, FOUC-prevention boot script, system theme listener
    offline-indicator.tsx              "You're offline" pill banner at top of viewport
    pwa-install-prompt.tsx             beforeinstallprompt listener + iOS Safari fallback hint
    shared.tsx                         HueAvatar, PersonCell, Pill, UtilBar, StatBlock (with hero variant)
    charts/
      theme.tsx                        Shared chart tokens + tooltip primitives (ChartTooltipFrame + ChartTooltipRow)
      revenue-bars.tsx                 Dashboard 12-month stacked bar (subs + credits)
      flow-chart.tsx                   Finance incoming vs outgoing area + dashed line
      revenue-mix-donut.tsx            Finance donut with hover-fade + center label
      earnings-bars.tsx                Admin 8-week earnings bars
    screens/
      dashboard.tsx                    OwnerDashboard
      calendar-screen.tsx              CalendarScreen — week/day/month + mobile agenda + EventSheet + NewBookingSheet
      clients-screen.tsx               ClientsScreen
      admins-screen.tsx                AdminsScreen (was stylists-screen)
      offers-screen.tsx                OffersScreen — editable plans + packs with preview-as-client sheet
      finance-screen.tsx               FinanceScreen
      settings-screen.tsx              Shared (takes role prop) — Profile/Notifications/Appearance/Security/Danger
      admin/                           overview, bookings, calendar wrapper, my-clients, messages, earnings
      client/                          home, book-session, client-bookings, credits, messages
    ui/                                shadcn-style wrappers around base-ui primitives
  lib/
    data.ts                            ALL mock data (TRAINERS, CLIENTS, CALENDAR_EVENTS, ADMIN_*, CLIENT_*, FINANCE_*)
    roles.ts                           Role union type + ROLE_CONFIGS map
    utils.ts                           cn() + getInitials()
  public/
    manifest.webmanifest               PWA manifest with shortcuts (Calendar, Book, Messages)
    sw.js                              Service worker with cache strategies (precache, network-first nav, cache-first static)
    offline.html                       Standalone offline fallback page
    icons/                             SVG app icons (192, 512, maskable)
  design-system/MASTER.md              The visual + interaction rulebook — read this before any UI change
```

---

## 4. Conventions you'll trip over without these

### Color / theme
- **Primary CTA = ink-dark teal across every role.** `--primary: var(--teal-700)`. Set once at `:root`, NEVER overridden per role. Selected states (date pills, time slots, chips) use `bg-primary text-primary-foreground` — same teal everywhere. See [design-system/MASTER.md §7](design-system/MASTER.md).
- `--role-accent` is for **secondary signals only** — active bottom-tab icon, "View all →" arrows, progress bars, focus rings. Cascades from `[data-role="..."]` set by `<DashboardShell>`.
- Calendar event blocks use a `useTheme()`-aware helper `eventColors(hue, isDark)` for dark-mode-aware OKLCH backgrounds. Don't hard-code light OKLCH values for events.
- Brand tokens (`--ink-*`, `--teal-*`, `--sage-*`, `--line*`, `--pos`, `--neg`, `--warn`) are **redefined in `.dark`** — see [globals.css](app/globals.css). The `--ink-*` scale flips so `--ink-100` ≈ near-bg in both themes.

### Theme system
- [`theme-provider.tsx`](components/theme-provider.tsx) — `useTheme()` returns `{ theme: "light"|"dark"|"system", resolvedTheme: "light"|"dark", setTheme }`.
- An inline boot script in `<head>` (in [layout.tsx](app/layout.tsx)) applies the saved theme **before paint** to avoid FOUC. Storage key: `bookitdaily.theme`.
- `<html suppressHydrationWarning>` is required on the `html` element so React doesn't complain about the boot-script class change.

### Responsive
- Sidebar visible at `lg+` (1024px+). Below that → bottom tab bar. **Don't change to `md:`** — small laptops at 1024px were squeezed by the sidebar before.
- Two-column dashboards (`grid-cols-[2fr_1fr]`) split at `xl:` (1280px+). Sidebar + content = too narrow at lg.
- Calendar shows mobile agenda below `lg`, full Week/Day/Month grid at `lg+`.
- Mobile padding `p-4 md:p-6 lg:p-8`.

### Buttons + interactive elements
- Use `<Button>` from [`ui/button.tsx`](components/ui/button.tsx) (wraps base-ui). Variants: `default`, `outline`, `ghost`, `destructive`, `secondary`, `link`. Sizes: `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`.
- For Links styled like buttons, use `buttonVariants(...)` className helper. **Don't use `asChild`** — base-ui doesn't support it.
- `cursor: pointer` is restored globally in [globals.css](app/globals.css) base layer for `button:not(:disabled), a[href], [role="button"], [role="tab"]`. Tailwind v4 dropped this default.

### Charts (recharts v3)
- Always use CSS variables in `fill`/`stroke`/`color` so charts auto-adapt to dark mode.
- Tooltip content callback uses **`TooltipContentProps`** (not `TooltipProps`). Pass as a function: `content={(props) => <MyTip {...props} />}`. JSX-element-as-content forms break TS.
- Suppress focus rings on chart SVGs: handled globally in [globals.css](app/globals.css) (`.recharts-wrapper * { outline: none !important; }`).

### Forms
- Use the inline form primitives in each screen (Field, Input, Textarea, Select). Or extract to a shared module if reused 3+ times. Patterns are consistent — see [`(auth)/_form.tsx`](app/(auth)/_form.tsx) and [`settings-screen.tsx`](components/screens/settings-screen.tsx).
- Form elements respect `--ring` for focus rings (which is per-role).

---

## 5. PWA — already done, here's how

| File | What it does |
|---|---|
| [`public/manifest.webmanifest`](public/manifest.webmanifest) | Standalone display, shortcuts to Calendar/Book/Messages, maskable icon |
| [`public/sw.js`](public/sw.js) | Network-first navigation + cache-first static + offline fallback. Versioned cache keys (`bookitdaily-precache-v1`, `bookitdaily-runtime-v1`) — bump when SW changes. |
| [`public/offline.html`](public/offline.html) | Static fallback when offline + auto-reload on `online` event |
| [`app/layout.tsx`](app/layout.tsx) | Registers SW (`afterInteractive`), sets viewport `viewportFit: cover`, theme color per color-scheme, applewebapp meta |
| [`components/pwa-install-prompt.tsx`](components/pwa-install-prompt.tsx) | `beforeinstallprompt` listener + iOS Safari hint after 4s. Dismissable for 30 days via `localStorage["bookitdaily.pwa.dismissed"]` |
| [`components/offline-indicator.tsx`](components/offline-indicator.tsx) | Pill banner via `online`/`offline` window events |

**Service workers don't activate in `next dev`.** Run `next build && next start` to test the SW for real.

---

## 6. Routes — full inventory

| URL | Component | Notes |
|---|---|---|
| `/` | [LandingPage](app/page.tsx) | Public marketing page. Pricing, features, addons, FAQ. |
| `/login` | [LoginPage](app/(auth)/login/page.tsx) | Mock submit → `/owner`. |
| `/signup` | [SignupPage](app/(auth)/signup/page.tsx) | Self-serve owner signup, password strength meter. Mock → `/owner`. |
| `/forgot-password` | [ForgotPasswordPage](app/(auth)/forgot-password/page.tsx) | Email + send link, mock success card. |
| `/owner` | [DashboardScreen](components/screens/dashboard.tsx) | KPI strip, revenue chart, today's schedule, admin perf table, subscription health. |
| `/owner/calendar` | [CalendarScreen](components/screens/calendar-screen.tsx) | Shared with `/admin/calendar`. |
| `/owner/clients` | [ClientsScreen](components/screens/clients-screen.tsx) | Filter chips, searchable table. |
| `/owner/admins` | [AdminsScreen](components/screens/admins-screen.tsx) | Schedule density, commission split, pending invites, full table. |
| `/owner/offers` | [OffersScreen](components/screens/offers-screen.tsx) | Edit subscription plans + credit packs. **Local state only — does NOT propagate to client side yet.** |
| `/owner/finance` | [FinanceScreen](components/screens/finance-screen.tsx) | Flow chart, donut, payouts, recent transactions. |
| `/owner/settings` | [SettingsScreen role="owner"](components/screens/settings-screen.tsx) | |
| `/admin` | [AdminOverview](components/screens/admin/overview.tsx) | Today's schedule, weekly earnings, messages preview. |
| `/admin/calendar` | [AdminCalendar](components/screens/admin/admin-calendar.tsx) | Re-exports CalendarScreen — *currently shows all events, not scoped to one admin*. |
| `/admin/bookings` | [AdminBookings](components/screens/admin/bookings.tsx) | Upcoming/Pending/Past tabs. |
| `/admin/clients` | [AdminMyClients](components/screens/admin/my-clients.tsx) | Per-admin clients table. |
| `/admin/messages` | [AdminMessages](components/screens/admin/messages.tsx) | Per-thread chat with quick replies. Local state. |
| `/admin/earnings` | [AdminEarnings](components/screens/admin/earnings.tsx) | KPIs, weekly bars, service mix, statement table. |
| `/admin/settings` | [SettingsScreen role="admin"](components/screens/settings-screen.tsx) | |
| `/client` | [ClientHome](components/screens/client/home.tsx) | Credits hero card, upcoming, book again, recent visits. |
| `/client/book` | [ClientBookSession](components/screens/client/book-session.tsx) | Service → admin → date/time → summary. All on one page. |
| `/client/bookings` | [ClientBookings](components/screens/client/client-bookings.tsx) | Upcoming/Past/Cancelled tabs. |
| `/client/credits` | [ClientCredits](components/screens/client/credits.tsx) | Plan + usage hero, top-up packs, transactions, switch plan. **Currently reads from static `CLIENT_PLANS` / `CLIENT_TOPUP_PACKS` — not yet wired to the offers builder.** |
| `/client/messages` | [ClientMessages](components/screens/client/messages.tsx) | Per-thread chat. Local state. |
| `/client/settings` | [SettingsScreen role="client"](components/screens/settings-screen.tsx) | |

---

## 7. What's mocked / dead / pending

This is the *most important section* if you're picking up to wire backend.

### Hard-coded mock data
- All data in [`lib/data.ts`](lib/data.ts). When wiring backend, this file gets replaced with API calls.
- Key arrays: `TRAINERS`, `CLIENTS`, `CALENDAR_EVENTS`, `CALENDAR_DAYS`, `HOURS`, `TODAY_BOOKINGS`, `REVENUE_BARS`, `CLIENT_*` (PROFILE, PLANS, TOPUP_PACKS, TRANSACTIONS, BOOKING_DATES, TIME_SLOTS, UPCOMING, PAST_VISITS, BOOK_AGAIN, THREADS, CHAT_MESSAGES), `ADMIN_*` (TODAY, BOOKINGS, CLIENTS, THREADS, CHAT_MESSAGES, EARNINGS_*, SERVICE_MIX, STATEMENTS), `FINANCE_*`.

### Forms that don't submit
- Login, Signup, Forgot password — all mock with `setTimeout`.
- Profile menu's Sign out → just navigates to `/login` (no token clear).
- Settings → Save changes — not wired.
- Offers builder edits → state only, doesn't propagate to `/client/credits`.
- New-booking sheet on calendar — doesn't create a real booking.
- Top up button on client credits hero card — no checkout.
- Messages send — local state only, no socket / API.
- Bell + Messages topbar buttons — no dropdown.

### Dead controls (UI-only, no behavior yet)
- Sidebar **Subscription** button (no route).
- Topbar **Search bar** — opens nothing (cmd-K placeholder).
- "Create your offers" preview-as-client button works; the *actual* connection between offers builder and client app is missing.
- Stylist legend filter on calendar — works locally but resets on refresh.

### Feature gaps
- No real-time anything (no websockets, no SSE).
- No notifications system (UI exists, no plumbing).
- No file uploads (avatar upload button exists, doesn't upload).
- No invite-acceptance flow (`/signup?invite=TOKEN` not yet implemented in [signup/page.tsx](app/(auth)/signup/page.tsx)).
- No multi-tenancy. Currently every visitor sees the same Book It Daily studio.

---

## 8. Common gotchas (specific things that bit me)

- **Stale `.next/types/`** caches reference deleted routes after renames. After moving folders, run `rm -rf .next/types .next/dev/types` before `tsc --noEmit`.
- **Service worker only activates in production build.** Don't expect offline to work in `next dev`.
- **Tailwind v4** prefers canonical spacing classes (`w-13` for 52px, `p-4.5` for 18px). The IDE flags `w-[52px]`. Either is fine functionally; the linter is style-only.
- **Recharts wrapper focus outlines** show on click because of base layer's `outline-ring/50`. Already suppressed globally with `.recharts-wrapper * { outline: none !important; }` in globals.css.
- **`mv` on Windows** with the dev server running can fail with `Permission denied`. Use `cp -r` then `rm -rf` — that's what I did to rename `stylist/` → `admin/`.
- **`useTheme()` requires the `<ThemeProvider>` wrapper** in [layout.tsx](app/layout.tsx). Calling it from a server component throws.
- **Bottom-tabs threshold is `lg:` not `md:`** — see §4. If you change it back, tablet UX gets cramped.
- The PWA install prompt **stores dismissal in localStorage for 30 days** — clear `bookitdaily.pwa.dismissed` to test it again.

---

## 9. What to read next

- [BACKEND-PLAN.md](BACKEND-PLAN.md) — what backend pieces to build, in what order, with example schemas.
- [design-system/MASTER.md](design-system/MASTER.md) — the visual rulebook. Required before any UI change.
- [.agents/skills/next-best-practices/SKILL.md](.agents/skills/next-best-practices/SKILL.md) — Next 16 conventions.

When in doubt about Next.js APIs, **read `node_modules/next/dist/docs/`**, not your training data — the framework changed in v16.

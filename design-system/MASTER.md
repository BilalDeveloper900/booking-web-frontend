# Maison & Co. — Design System (MASTER)

> **Source of truth.** Read this before designing or modifying any UI in this
> repo. Page-specific overrides may live in `design-system/pages/<page>.md`.

This system is derived from the `ui-ux-pro-max` skill in
[../.agents/skills/ui-ux-pro-max/SKILL.md](../.agents/skills/ui-ux-pro-max/SKILL.md).
Rule references in this doc point to that skill's Quick Reference sections.

---

## 1. Brand & character

| | |
|---|---|
| **Product** | SaaS booking application for an upmarket salon (Maison & Co.) |
| **Roles** | Owner (operations), Stylist (provider), Client (customer) |
| **Tone** | Sophisticated, calm, editorial. Atelier-luxury, not corporate. |
| **Anti-tone** | Generic shadcn neutral, "AI-default flat", playful, cute |
| **Visual reference** | Linear's restraint × Stripe's data clarity × Aesop's warmth |

**Test for "on brand":** screenshot the surface, blur it 8px. Can you tell it
isn't generic shadcn? If no, it isn't on brand.

---

## 2. Color tokens

All colors live in [../app/globals.css](../app/globals.css) as CSS variables.
**Never hard-code hex in components.** Use the tokens below.

### Brand
| Token | Use | Notes |
|---|---|---|
| `--teal-700` (via `--primary`) | Primary CTA across every role | Brand teal. The default `<Button>` reads `--primary` — keep this consistent across owner / stylist / client so the same CTA looks identical everywhere. |
| `--teal-700` | Brand mark, hero KPIs, owner role accent, link accent | Same value, used directly when you need the literal token. |
| `--teal-500` | Secondary teal, chart series 2, hover-fill on teal surfaces | |
| `--teal-100` | Tinted surfaces (in-session row, today cell, brand pills bg) | Never as text bg below 14px |
| `--teal-900` | On-teal-100 text, deep accent | |
| `--sage-500` | Secondary accent, positive states, chart series 3 | |
| `--sage-100` | Sage tinted surfaces | |
| `--role-accent` | Per-role accent (owner=teal, stylist=indigo, client=green) | Set by `[data-role]` on shell |

### Surface
| Token | Use |
|---|---|
| `--background` | Page background — warm off-white `#fafaf9` |
| `--card` | Card surface — pure white `#ffffff` |
| `--popover` | Popovers, menus, sheets |
| `--muted` | Subtle fills (chip bg, search bar bg, table-zebra) |

### Text
| Token | Use | Min size |
|---|---|---|
| `--ink-900` | Primary text, headlines, hero numbers | 13px+ |
| `--ink-700` | Body text on surfaces | 13px+ |
| `--ink-500` | Secondary text, meta, captions | 11px+ |
| `--ink-300` | Tertiary, disabled labels | 12px+ only |

### Lines
| Token | Use |
|---|---|
| `--line` | Card borders, dividers between sections |
| `--line-soft` | Inner dividers (table rows, list items) |

### Status
| Token | Use |
|---|---|
| `--pos` | Positive deltas, success, income |
| `--neg` | Negative deltas, errors, outflows, "now" line |
| `--warn` | Warnings, low-credit, expiring |

### Accessibility floor
- Body text on `--background` and `--card`: **≥ 4.5:1** (rule: `color-accessible-pairs`)
- Large text and UI glyphs: **≥ 3:1**
- Status colors must always be paired with an icon or text — **never color-only** (rule: `color-not-only`)

---

## 3. Typography

### Scale

| Role | Size | Weight | Tracking | Use |
|---|---|---|---|---|
| **Display** | `text-[28px]` | 600 | `-0.01em` | Hero KPIs, dashboard greetings, donut center |
| **Headline** | `text-[22px]` | 600 | `-0.01em` | Page H1 (e.g. "Clients", "Finance") |
| **Title** | `text-[15px]` | 600 | `-0.005em` | Card titles, section headers |
| **Subtitle** | `text-[13px]` | 500 | `0` | Card subtitles, table data |
| **Body** | `text-[13px]` | 400 | `0` | Body copy, descriptions |
| **Caption** | `text-[11px]` | 500 | `0.08em` uppercase | Eyebrow labels, table headers, meta |
| **Micro** | `text-[10px]` | 500 | `0.12em` uppercase | Sidebar section dividers |

**Numerics:** every numeric value (price, count, percent, time, date) **must** use `tabular-nums` (rule: `number-tabular`). Prevents layout shift when values change.

**Don'ts:**
- ❌ Don't squash page titles to 15px — that's the card-title tier. Pages get headline (22px) or display (28px).
- ❌ Don't mix arbitrary sizes (`text-[14px]`, `text-[16px]`). Stick to the scale.
- ❌ Don't use bold on body — use medium (500) for emphasis, semibold (600) for titles only.

---

## 4. Elevation & surfaces

The flat-everything look is the #1 "AI-built" tell. Use a 3-tier elevation ladder.

| Tier | Usage | Class |
|---|---|---|
| **0 (flush)** | Backgrounds, table rows, dividers | no shadow, no border |
| **1 (resting card)** | Standard cards, sidebars, topbar | `border border-border` |
| **2 (hero card)** | Primary KPI card, today's schedule, summary card | `border border-border shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_-2px_rgba(15,23,42,0.05)]` |
| **3 (overlay)** | Popovers, sheets, modals | `border border-border shadow-[0_8px_32px_-8px_rgba(15,23,42,0.18)]` |

**Hover lift** (interactive cards only): `transition-all duration-200 hover:-translate-y-px hover:shadow-[...tier+1]`. Skip on dense tables.

**Radius scale** (already defined in `@theme inline`):
- `rounded-md` (0.4rem) — pills, badges, chips
- `rounded-lg` (0.5rem) — buttons, inputs, list items, default cards
- `rounded-xl` (0.7rem) — hero cards, sheets
- `rounded-full` — avatars, dot indicators

Don't mix radii within one card. A card at `rounded-xl` should contain elements at `rounded-lg` or smaller — never larger.

---

## 5. Spacing rhythm

Use a 4px base. Common values:

| Scale | px | Use |
|---|---|---|
| `gap-1` / `space-y-1` | 4 | Inline icon + text |
| `gap-2` / `p-2` | 8 | Tight groups, pill internal padding |
| `gap-3` / `p-3` | 12 | List item padding, button gap |
| `gap-4` / `p-4` | 16 | Stat block grid gap, form fields |
| `gap-5` / `p-5` | 20 | Card grid gap |
| `p-6` | 24 | Card internal padding |
| `p-8` | 32 | Page outer padding (desktop) |
| `gap-12` | 48 | Major section breaks |

**Page outer padding:** `p-6 lg:p-8` — never edge-to-edge on desktop.
**Card internal padding:** `p-6` for hero cards, `p-5` for resting cards, `p-[18px]` for stat blocks.

---

## 6. Motion

Skill rules: `duration-timing`, `motion-meaning`, `state-transition`,
`exit-faster-than-enter`, `reduced-motion`.

### Duration tokens
- **80–120ms** — micro-feedback (press, toggle, focus)
- **150–200ms** — color/opacity transitions, hover
- **200–300ms** — entrance, expansion, sheet open
- **300–400ms** — page-level transitions only

Anything > 400ms feels broken.

### Easing
- Entering: `ease-out`
- Exiting: `ease-in` (and ~70% the duration of enter — rule: `exit-faster-than-enter`)
- Spring: prefer for "natural" motions (sheet, stat-counter); use `cubic-bezier(0.32, 0.72, 0, 1)` if no spring available
- **Never `linear`** for UI — only for progress bars

### Required transitions
| Element | Transition |
|---|---|
| Buttons | `transition-all duration-150` (color, bg, shadow) |
| Cards (interactive) | `transition-all duration-200 hover:-translate-y-px hover:shadow-md` |
| Nav items | `transition-colors duration-150` |
| Pills, badges | `transition-colors duration-150` |
| Tab/segmented controls | `transition-all duration-200` (bg + shadow) |

### Reduced motion
Wrap any non-essential animation in `motion-safe:`. Required transformations (e.g. sheet slide-in) can stay.

```tsx
className="motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-px"
```

---

## 7. Component patterns

### Buttons
Use the `Button` component from `@/components/ui/button`. **Always use a variant** — never style raw buttons unless building a primitive.

| Variant | When |
|---|---|
| `default` | Primary CTA. ONE per screen (rule: `primary-action`) |
| `outline` | Secondary actions in toolbars |
| `ghost` | Tertiary actions, table row icons, dismiss buttons |
| `destructive` | Delete, cancel-with-loss |

**Primary CTA uses brand teal across every role** — `--primary` is set once at `:root` to `var(--teal-700)`. The role accent is reserved for *secondary* indicators (active bottom-tab icon, "View all →" arrows, progress fills, focus rings). Don't override `--primary` per role; the same button must look identical across owner / stylist / client, and recoloring it green or indigo per role breaks brand consistency.

### Stat blocks
Use the `StatBlock` shared component. Keep it dense:
- Eyebrow label (caption tier, uppercase, muted)
- Big number (display tier, tabular-nums)
- Delta + footnote (caption tier, with **icon** — never `↑` `↓` text glyphs, rule: `no-emoji-icons`)

For the **lead KPI** of a page (e.g. Revenue on Finance), use the `StatBlockHero` variant: includes a sparkline and a slightly larger value.

### Cards
- Title row: caption-tier label on the left, optional `Button variant="link" size="xs"` on the right (NOT a `<span>`). Use a `<Link>` or `<button>` — never a span (rule: `aria-labels`, `keyboard-nav`).
- Body: padded `p-6`, content with consistent vertical rhythm.

### Pills
Use the `Pill` shared component. `kind` maps to status:
- `teal` → in-progress, info
- `sage` → positive, active, income
- `warn` → warning, low, expiring
- `(none)` → neutral, lapsed

Always use `dot` prop for status pills so the meaning isn't conveyed by color alone (rule: `color-not-only`).

### Tables
- Header: caption-tier (`text-[11px] uppercase tracking-[0.08em] font-medium text-muted-foreground`)
- Row: `text-[13px]`, `py-3.5` minimum
- Row hover: `hover:bg-muted/40 transition-colors`
- Borders: `border-b border-[--line-soft]`, `last:border-0`
- Action column: use `<Button variant="ghost" size="icon-sm" aria-label="...">` — never a bare lucide icon

### Segmented controls
Used in calendar (Day/Week/Month) and clients (filter tabs). Pattern:
```tsx
<div role="tablist" className="flex items-center gap-0.5 p-0.5 bg-muted rounded-lg">
  {options.map((opt) => (
    <button
      key={opt}
      role="tab"
      aria-selected={active === opt}
      className={cn(
        "px-3 py-1 text-xs rounded-md transition-all duration-150 focus-visible:ring-2 focus-visible:ring-ring",
        active === opt
          ? "bg-card text-foreground shadow-sm font-medium"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {opt}
    </button>
  ))}
</div>
```

### Sidebar nav
- Active item uses **role accent** (not full ink): `bg-[--role-accent]/10 text-[--role-accent] font-medium` with a 2px left rail in `--role-accent`.
- Resting state: `text-muted-foreground hover:bg-muted hover:text-foreground`.
- Section dividers: caption-tier, `mt-6 mb-1.5`.

---

## 8. Iconography

- **Library:** `lucide-react` only. No emoji as icons (rule: `no-emoji-icons`).
- **Sizes:** `w-3.5 h-3.5` (xs, in pills), `w-4 h-4` (default, in buttons), `w-5 h-5` (sidebar/topbar). Don't use arbitrary sizes.
- **Stroke:** lucide default 2px. Don't customize per-icon.
- **Color:** inherit `currentColor` — never hard-code.
- **Delta arrows:** use `<TrendingUp />` and `<TrendingDown />` (or `<ArrowUp />` / `<ArrowDown />`), **never** `↑` / `↓` text glyphs.

---

## 9. Accessibility (CRITICAL)

These are non-negotiable. Skill rules: §1.

- [ ] Every interactive element has a **visible focus ring** (`focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`). The shadcn `Button` already has this — preserve it.
- [ ] Every icon-only button has `aria-label`.
- [ ] Disabled buttons use the `disabled` attribute, not just opacity.
- [ ] Forms use `<label htmlFor>` + matching `id` on input.
- [ ] Errors live below the field, in `--neg`, with an icon.
- [ ] Multi-step flows use `role="progressbar"` with `aria-valuenow` / `aria-valuemax`.
- [ ] Tab order matches visual order. Never `tabIndex={-1}` to "fix" focus issues.
- [ ] Color is never the sole signal — pair with icon, text, or pattern.
- [ ] Touch targets ≥ 36×36 on web (44×44 on mobile/tablet UI).

---

## 10. Layout & responsive

- **Breakpoints:** Tailwind defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280). Use `lg:` for desktop layout switches, `md:` for nav transitions.
- **Container:** never set fixed `max-w-*` on the page root. Cards inside use their own width.
- **Sidebar:** `hidden md:flex w-60`. On mobile, opens via Sheet from left.
- **Topbar:** sticky `h-16`, `border-b border-border`.
- **Page padding:** `p-6 lg:p-8` consistently.
- **Stat grids:** `grid grid-cols-2 md:grid-cols-4 gap-4` (mobile gets 2 columns, never 4).
- **Two-column dashboards:** `grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5`. Mobile stacks.
- **Sticky CTAs on mobile:** for primary actions on long pages, `sticky bottom-0 bg-background/95 backdrop-blur border-t p-4` on mobile only.

---

## 11. Anti-patterns (do not do)

A short, hard list. If you catch yourself doing one of these, stop.

- ❌ `<span className="cursor-pointer">View details →</span>` — use `<button>` or `<Link>`. Spans aren't focusable.
- ❌ Hard-coded hex in components (`bg-[#fafaf9]`). Use the token (`bg-background`).
- ❌ `↑` / `↓` text arrows for deltas. Use lucide `TrendingUp`/`TrendingDown`.
- ❌ Page title at `text-[15px]`. That's the card-title tier. Pages get 22–28px.
- ❌ Recoloring `<Button>`'s primary CTA per role (owner=teal, stylist=indigo, client=green). Primary is ink across all roles — keep brand color for secondary accents only.
- ❌ Stripping focus rings via `cn(...)` overrides. Always preserve `focus-visible:*` from base classes.
- ❌ Identical `border border-border rounded-lg` on every surface. Use the elevation ladder.
- ❌ Mock search bars rendered as `<div>` or `<span>` — make them a `<button>` so they're clickable + focusable.
- ❌ Same icon set mixed with emoji.
- ❌ Animations without `motion-safe:` guard.
- ❌ Tables with no row hover.
- ❌ Numerics without `tabular-nums`.

---

## 12. Pre-delivery checklist

Before claiming a screen is done:

**Visual**
- [ ] Type ladder respected (no page title at body tier)
- [ ] Hero card uses tier-2 elevation; resting cards tier-1
- [ ] Brand teal used for primary CTA and active nav state
- [ ] All numerics use `tabular-nums`
- [ ] All icons from lucide; no emoji; no text-arrow glyphs
- [ ] No raw hex in component className/style

**Interaction**
- [ ] Every interactive element has a focus ring
- [ ] Every icon button has `aria-label`
- [ ] Hover state on table rows + interactive cards
- [ ] Buttons have a press feedback (already in shadcn `Button` via `active:translate-y-px`)
- [ ] All transitions ≤ 300ms, wrapped in `motion-safe:` where decorative

**Accessibility**
- [ ] Body text ≥ 4.5:1 contrast
- [ ] No color-only meaning (status pills always have a dot or icon)
- [ ] Tab order logical
- [ ] Decorative spans-as-buttons replaced with `<button>` / `<Link>`

**Layout**
- [ ] Page renders cleanly at 375 (mobile), 768 (tablet), 1280 (desktop)
- [ ] Sidebar collapses to Sheet on mobile
- [ ] No horizontal scroll
- [ ] Stat grids reflow (2 cols mobile → 4 cols desktop)

---

## 13. How to extend this doc

- Don't bloat MASTER.md. If a rule applies to one page only, put it in
  `design-system/pages/<page-slug>.md`.
- When adding a new component primitive (e.g. a `Toast`), add a §7 entry here
  and link to the implementation file.
- When changing a token in [globals.css](../app/globals.css), update §2 in this
  doc in the same commit.
- The skill at [`.agents/skills/ui-ux-pro-max/SKILL.md`](../.agents/skills/ui-ux-pro-max/SKILL.md)
  is the upstream source — this doc is the project-specific application of it.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Read these before doing anything

This codebase has a lot of project-specific conventions that don't match
defaults. **Don't skip these — they save you from re-discovering things and
making changes that violate established patterns.**

- **[`PROJECT.md`](PROJECT.md)** — full project handover: tech stack (Next 16, base-ui not Radix, Tailwind v4, recharts v3 quirks), three-role architecture, route inventory, what's mocked vs real, common gotchas. **Read first.**
- **[`BACKEND-PLAN.md`](BACKEND-PLAN.md)** — backend roadmap: recommended stack (Clerk + Supabase + Lemon Squeezy), data model sketches, API surface, file-by-file migration from mock to real. Read before building any backend.
- **[`design-system/MASTER.md`](design-system/MASTER.md)** — visual + interaction rulebook (color tokens, typography, elevation, anti-patterns). **Required reading before any UI change.** Page-specific overrides live in `design-system/pages/`.

## Project skills

This repo ships skills in `.agents/skills/`. Read the relevant SKILL.md before
acting — they encode rules you don't know.

- **`.agents/skills/next-best-practices/SKILL.md`** — read before writing or
  reviewing any Next.js code (RSC boundaries, async params/cookies, error
  handling, `next/image`, the `middleware → proxy` rename, etc.). Each section
  links to a sub-doc; load the sub-doc only when its topic is in scope.
- **`.agents/skills/ui-ux-pro-max/SKILL.md`** — read before designing,
  building, or reviewing any UI component, page, or visual decision (color,
  typography, spacing, accessibility, layout). Note: the Python `--design-system`
  CLI is symlink-broken on this machine; use the markdown rules directly.
- **`.agents/skills/web-design-guidelines/SKILL.md`** — invoke when the user
  asks to review UI, audit design, check accessibility, or check the site
  against best practices.

## Quick orientation (one-paragraph version)

Multi-role booking SaaS for salons / gyms / studios. Three roles share one
codebase: **owner** (`/owner` — pays the SaaS subscription), **admin**
(`/admin` — staff, was `/stylist` before a full rename — don't reintroduce
the old name), **client** (`/client` — end customer). Frontend-only right
now; all data is mocked in [`lib/data.ts`](lib/data.ts). Built with Next 16,
React 19, Tailwind v4, base-ui (NOT Radix), recharts v3, Poppins +
Geist Mono fonts. PWA-ready (manifest, SW, offline page, install prompt,
offline indicator). Theme system has light/dark + per-role accents but
`--primary` is brand teal globally — never per-role. Auth pages exist but
mock-submit only. Lemon Squeezy is the planned payments gateway (no Stripe —
Pakistan-based founder).

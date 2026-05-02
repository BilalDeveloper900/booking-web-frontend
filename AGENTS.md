<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project skills

This repo ships skills in `.agents/skills/`. Read the relevant SKILL.md before
acting — they encode rules you don't know.

- **`.agents/skills/next-best-practices/SKILL.md`** — read before writing or
  reviewing any Next.js code (RSC boundaries, async params/cookies, error
  handling, `next/image`, the `middleware → proxy` rename, etc.). Each section
  links to a sub-doc; load the sub-doc only when its topic is in scope.
- **`.agents/skills/ui-ux-pro-max/SKILL.md`** — read before designing,
  building, or reviewing any UI component, page, or visual decision (color,
  typography, spacing, accessibility, layout).
- **`.agents/skills/web-design-guidelines/SKILL.md`** — invoke when the user
  asks to review UI, audit design, check accessibility, or check the site
  against best practices.

## Design system

This project's design system is documented at
[`design-system/MASTER.md`](design-system/MASTER.md). Read it before any
visual change. Page-specific overrides live in `design-system/pages/`.

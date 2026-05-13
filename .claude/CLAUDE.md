# CLAUDE.md

SvelteKit 2 + Svelte 5 portfolio site. Deployed on Vercel. Content from Markdown files and Notion API.

## Commands

```bash
pnpm dev          # start dev server
pnpm build        # production build
pnpm preview      # preview production build
pnpm check        # svelte-check + TS type check
pnpm lint         # prettier + eslint
pnpm format       # auto-format
pnpm db:push      # push Drizzle schema to DB
pnpm db:studio    # open Drizzle Studio
```

## Architecture

- **Routes** live in `src/routes/` — SvelteKit file-based routing
- **Content** (projects, about tabs) are `.md` files in `src/contents/`, processed by mdsvex
- **Articles** come from Notion API at runtime — never prerendered
- **Server-only code** lives in `src/lib/server/` — never import it client-side
- **Types** are in `src/lib/types.ts` — no `any`, use proper interfaces
- **Icons** are SVG symbols in `static/icons.svg`, used via `<Icon id="..." />`

## Svelte 5 — Runes Only

Always use Svelte 5 rune syntax. Never use legacy Svelte 4 patterns.

| Use this | Not this |
|----------|----------|
| `let { prop } = $props()` | `export let prop` |
| `let x = $derived(expr)` | `$: x = expr` |
| `$effect(() => { ... })` | `onMount(...)` for reactive logic |
| `$state(value)` | `let value` for reactive state |

## Tailwind CSS v4

- Config is **inside `src/app.css`** using `@theme {}` — there is no `tailwind.config.js`
- Custom colors use OKLCH `ash-*` scale (e.g. `ash-200`, `ash-700`)
- Utility classes only — no inline `style=""`, no custom CSS unless utilities can't do it
- Component `<style>` blocks only for things utilities can't express

## Key Constraints

- **TypeScript everywhere** — no `.js` files in `src/`
- **Imports use `$lib/...`** — never relative paths like `../../`
- **`@notionhq/client` is pinned to v2** — v5 removed `databases.query`, do not upgrade
- Routes using `searchParams` or Notion API must set `export const prerender = false`
- Secret env vars use `$env/static/private`, public ones use `$env/static/public`

## Adding Content

**New project:** Create `src/contents/projects/<slug>.md` with frontmatter:
```md
---
title: Project Name
description: One-line description.
poster: /projects/<image>.png
techstack: ['TypeScript', 'SvelteKit']
---
```
Drop poster image in `static/projects/`.

**New about tab:** Create `src/contents/abouts/<slug>.md` with `title` + `description` frontmatter. Tab appears automatically.

**New article:** Publish a page in the Notion database (set `Published` date). No rebuild needed.

## Environment Variables

| Variable | Description |
|---|---|
| `BASE_URL` | Full origin URL (used by sitemap/robots) |
| `NOTION_TOKEN` | Notion integration secret (`ntn_` or `secret_` prefix) |
| `NOTION_DATABASE_ID` | 32-char hex ID of the articles Notion database |

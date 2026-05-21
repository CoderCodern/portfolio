# CLAUDE.md

SvelteKit 2 + Svelte 5 portfolio site. Deployed on Vercel (`nodejs22.x`). All content comes from local `.md` files processed by mdsvex.

## Commands

```bash
pnpm dev          # start dev server at http://localhost:5173
pnpm build        # production build
pnpm preview      # preview production build
pnpm check        # svelte-check + TS type check
pnpm lint         # prettier + eslint
pnpm format       # auto-format
pnpm db:push      # push Drizzle schema to DB (guestbook — not yet live)
pnpm db:studio    # open Drizzle Studio
```

## Architecture

### UI Shell

The entire site renders inside a **draggable floating window** (`<main>` in `+layout.svelte`):
- Desktop: 70vw × 75vh, draggable via mousedown, fullscreen-toggleable
- Mobile: full viewport, drag/fullscreen disabled
- Background: animated grid pattern + grain noise (`/grain.webp`)
- Shadow: animated wave shadow via CSS keyframes

### Content System

All content is `.md` files under `src/contents/`, loaded with `import.meta.glob()` at build time via mdsvex:

| Directory | Route | Notes |
|-----------|-------|-------|
| `src/contents/abouts/` | `/abouts/[slug]` | Tabs: `personal`, `work`, `gear`. `/abouts` redirects to `/abouts/personal` |
| `src/contents/projects/` | `/projects/[slug]` | Filter by `?techstack=` URL param |
| `src/contents/articles/` | `/articles/[slug]` | Filter by `?category=` URL param, paginated 10/page |

`src/lib/index.ts` exports a single `generateEntries(contentType)` utility used in `+page.server.ts` files to generate prerender entries.

### Routing and Prerendering

- Root layout: `prerender = true` (default for most routes)
- `/articles` and its layout: `prerender = false` — required because the page reads `?category=` and `?page=` URL searchParams for filtering and pagination
- Individual article/project/about pages: prerendered via `entries` in `+page.server.ts`

### Svelte 5 — Runes Only

Always use Svelte 5 rune syntax. Never use legacy Svelte 4 patterns.

| Use this | Not this |
|----------|----------|
| `let { prop } = $props()` | `export let prop` |
| `let x = $derived(expr)` | `$: x = expr` |
| `$effect(() => { ... })` | `onMount(...)` for reactive logic |
| `$state(value)` | `let value` for reactive state |

### Tailwind CSS v4

- Config is **inside `src/app.css`** using `@theme {}` — there is no `tailwind.config.js`
- Custom color scale: `ash-50` through `ash-950` (grayscale OKLCH) + `--color-cyan`
- Utility classes only — no inline `style=""`, no custom CSS unless utilities can't do it
- Component `<style>` blocks only for things utilities can't express (e.g. the wave shadow keyframes in `+layout.svelte`)

## Key Constraints

- **TypeScript everywhere** — no `.js` files in `src/`
- **Imports use `$lib/...`** — never relative paths like `../../`
- Routes using `searchParams` must set `export const prerender = false`
- Secret env vars use `$env/static/private`, public ones use `$env/static/public`
- `experimental: { remoteFunctions: true }` and `compilerOptions: { experimental: { async: true } }` are enabled in `svelte.config.js`

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `BASE_URL` | Full origin URL (used by sitemap/robots) | Yes |
| `DATABASE_URL` | PostgreSQL connection string (guestbook — not yet live) | Planned |

## Adding Content

**New project:** Create `src/contents/projects/<slug>.md` with frontmatter:
```md
---
title: Project Name
description: One-line description.
poster: /projects/<image>.png
techstack: ['TypeScript', 'SvelteKit']
date: '2024-01'
category: 'Web'
---
```
Drop poster image in `static/projects/`.

**New about tab:** Create `src/contents/abouts/<slug>.md` with `title` + `description` frontmatter. The tab appears automatically — title format is `<icon-name>.<display-name>` (e.g. `user.personal`).

**New article:** Create `src/contents/articles/<slug>.md` with frontmatter:
```md
---
title: Article Title
description: One-line description.
publishedDate: '2024-01-15'
poster: /articles/<image>.png
category: '.NET'
---
```

## Planned Features (not yet implemented)

The following packages are installed but not yet wired up — they are for an upcoming **guestbook** feature:

- `drizzle-orm` + `postgres` — database ORM; schema will live at `src/lib/server/db/schema.ts`
- `arctic` — OAuth provider (for guestbook authentication)
- `openai` — AI integration
- `@notionhq/client`, `notion-to-md`, `@tryfabric/martian` — Notion migration utilities (used by the `/convert-notion-blog` skill, not the running site)

The sitemap already includes `/guestbook` in anticipation of this route being added.

## Analytics and Haptics

- **Umami analytics**: `data-umami-event` attributes on key links and buttons track user interactions (article clicks, project views, about tab switches)
- **Haptics**: `web-haptics` (`createWebHaptics`) is used on nav links for mobile haptic feedback — always call `onDestroy(destroy)` when using it in a component

# Technical Reference

Architecture, project structure, and coding conventions for this SvelteKit portfolio site.

---

## Project Structure

```
site/
├── src/
│   ├── app.css                    # Global styles, Tailwind imports, CSS variables
│   ├── app.d.ts                   # TypeScript ambient declarations
│   ├── app.html                   # HTML shell
│   ├── hooks.server.ts            # Server hooks (font preloading)
│   │
│   ├── contents/                  # Markdown content (processed by mdsvex)
│   │   ├── abouts/
│   │   │   ├── personal.md        # Personal info tab
│   │   │   ├── work.md            # Work experience, skills, education
│   │   │   └── gear.md            # Hardware & software setup
│   │   ├── projects/              # One .md file per project
│   │   └── articles/              # Legacy static articles (unused — Notion is the source)
│   │
│   ├── lib/
│   │   ├── components/
│   │   │   ├── icon.svelte        # SVG icon wrapper (<use xlink:href>)
│   │   │   ├── metadata.svelte    # <head> metadata / OpenGraph
│   │   │   └── layout/
│   │   │       ├── header/        # Mac window chrome (header bar, eye animation)
│   │   │       └── navbar/        # Navigation menu + keyboard shortcuts
│   │   ├── server/
│   │   │   └── notion.ts          # Notion API client (server-only)
│   │   ├── types.ts               # Shared TypeScript interfaces
│   │   └── index.ts               # Barrel export
│   │
│   └── routes/
│       ├── +layout.server.ts      # Root: prerender = true
│       ├── +layout.svelte         # Root layout (header + navbar + slot)
│       ├── +page.svelte           # Homepage (ASCII art, tagline)
│       ├── abouts/                # About section (tabbed: personal / work / gear)
│       ├── projects/              # Project grid + techstack filter
│       ├── articles/              # Article list + detail (Notion-backed)
│       ├── robots.txt/            # Dynamic robots.txt endpoint
│       └── sitemap.xml/           # Dynamic sitemap endpoint
│
├── static/
│   ├── icons.svg                  # Sprite sheet for all tech icons
│   ├── projects/                  # Project poster images
│   └── fonts/                     # (served by @fontsource/commit-mono)
│
├── svelte.config.js               # SvelteKit + mdsvex config
├── vite.config.ts
├── tailwind.config (inline in app.css via @theme)
└── .env.example
```

---

## Tech Stack Details

### SvelteKit 2 + Svelte 5

- All components use **Svelte 5 runes**: `$state`, `$derived`, `$props`, `$effect`
- No legacy `export let` props or `$:` reactive statements
- Server-side data loading via `+page.server.ts` / `+layout.server.ts`

### Tailwind CSS v4

- Configuration lives inside `src/app.css` using `@theme {}` — no `tailwind.config.js` file
- Custom color tokens use OKLCH: `ash-*` scale (e.g. `ash-200`, `ash-700`)
- Typography plugin (`@tailwindcss/typography`) used for article prose rendering

### mdsvex

- Processes `.md` files as Svelte components
- Frontmatter is exposed as `metadata` on the module
- Syntax highlighting via Shiki (`poimandres` theme) — configured in `svelte.config.js`
- Plugins: `remark-toc` (auto table of contents), `rehype-slug` (heading anchors)

### Notion Integration

- `@notionhq/client` v2 — v5 removed `databases.query`, so v2 is pinned
- `notion-to-md` converts Notion blocks → markdown
- `marked` converts markdown → HTML for `{@html}` rendering
- Server-only (`src/lib/server/notion.ts`) — never imported on the client
- Articles route opts out of prerendering: `export const prerender = false`

### Icons

All icons are SVG symbols in `static/icons.svg`. Use them via `<icon.svelte>`:

```svelte
<Icon id="typescript" class="size-4" />
```

Rendered as `<svg><use xlink:href="/icons.svg#typescript" /></svg>`.

---

## Routing & Prerendering

| Route | Prerendered | Data source |
|---|---|---|
| `/` | Yes | Static |
| `/abouts/[slug]` | Yes | `.md` files via `import.meta.glob` |
| `/projects` | No | `.md` files (needs `searchParams` for filter) |
| `/projects/[slug]` | Yes | `.md` files |
| `/articles` | No | Notion API |
| `/articles/[slug]` | No | Notion API |
| `/sitemap.xml` | Yes | Static |
| `/robots.txt` | Yes | Static |

Routes that use `page.url.searchParams` or fetch dynamic data must set `export const prerender = false`.

---

## Adding Content

### New project

Create `src/contents/projects/<slug>.md`:

```md
---
title: Project Name
description: One-line description.
poster: /projects/<image>.png
techstack: ['C#', 'React', 'SQL Server']
---

## Overview

...

## Contributions

...
```

Drop the poster image in `static/projects/`.

### New about tab

Create `src/contents/abouts/<slug>.md` with `title` and `description` frontmatter. The tab appears automatically via the layout's `import.meta.glob`.

### New article

Add a page to your Notion database with the `Published` date set. It appears on the site on next page load (no rebuild needed).

---

## Coding Conventions

### General

- **TypeScript everywhere** — no `.js` files in `src/`
- Imports use `$lib/...` alias, never relative paths like `../../`
- No `any` types — use proper interfaces from `src/lib/types.ts`

### Svelte components

- One component per file, filename in `kebab-case.svelte`
- Props declared with `let { prop } = $props()` (Svelte 5 rune style)
- Reactive values with `let x = $derived(...)` — no `$:` blocks
- Side effects with `$effect(() => { ... })` — no `onMount` for reactive logic

### Server vs client

- Anything that touches `NOTION_TOKEN`, secrets, or Node-only APIs goes in `src/lib/server/` — SvelteKit enforces this boundary and will error if server code is imported client-side
- Use `$env/static/private` for secret env vars, `$env/static/public` for public ones

### Styles

- Tailwind utility classes only — no custom CSS unless absolutely necessary
- Component-scoped `<style>` blocks only for styles that can't be expressed as utilities
- No inline `style=""` attributes

### Comments

- Only when the **why** is non-obvious (a workaround, a constraint, a subtle invariant)
- Never describe what the code does — the code itself does that

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `BASE_URL` | Yes | Full origin URL — used by sitemap/robots routes |
| `NOTION_TOKEN` | Yes | Notion integration secret (prefix `ntn_` or `secret_`) |
| `NOTION_DATABASE_ID` | Yes | 32-char hex ID of the articles database |

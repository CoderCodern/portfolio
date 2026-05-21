# Viet Hoang — Personal Site

Personal portfolio site for Viet Hoang (Coder Codern), Software Engineer based in Hanoi, Vietnam. Built with SvelteKit and deployed on Vercel.

The UI renders as a draggable floating window (70vw × 75vh on desktop) on a grid-pattern background — fullscreen-capable, with animated grain noise and wave shadow.

Features:
- **Home** — ASCII banner + interactive Dino game
- **About** — Tabbed sections (personal, work, gear) from local markdown
- **Projects** — Filterable cards by tech stack, with poster images
- **Articles** — Written articles from local markdown, filterable by category with pagination

---

## Stack

| Layer | Technology |
|---|---|
| Framework | [SvelteKit 2](https://svelte.dev/) + Svelte 5 |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Markdown | [mdsvex](https://mdsvex.pngwn.io/) |
| Syntax highlighting | [Shiki](https://shiki.style/) — `poimandres` theme |
| Deployment | [Vercel](https://vercel.com) (`@sveltejs/adapter-vercel`) (`nodejs22.x`) |
| Font | [Commit Mono](https://commitmono.com/) |

---

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 9 (`npm i -g pnpm`)

---

## Setup

```bash
git clone https://github.com/CoderCodern/portfolio
cd portfolio
cp .env.example .env
```

Fill in `.env`:

```env
BASE_URL="http://localhost:5173"
```

`BASE_URL` is required for the sitemap (`/sitemap.xml`). No other env vars are needed for local development.

---

## Running Locally

```bash
pnpm install
pnpm dev
```

Opens at `http://localhost:5173`.

---

## Build & Preview

```bash
pnpm build       # production build
pnpm preview     # serve the built output locally
```

---

## Code Quality

```bash
pnpm check       # svelte-check + TypeScript
pnpm lint        # prettier + eslint
pnpm format      # auto-format all files
```

---

## Deployment

Deployed on [Vercel](https://vercel.com). Every push to `master` triggers an automatic deployment.

**Required environment variable on Vercel:**

| Variable | Description |
|---|---|
| `BASE_URL` | Production domain (e.g. `https://viethoang.dev`) — used by sitemap |

To set it: Vercel Dashboard → Project → Settings → Environment Variables.

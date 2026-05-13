# Viet Hoang — Personal Site

Personal portfolio site for Viet Hoang (Coder Codern), Software Engineer based in Hanoi, Vietnam. Built with SvelteKit and deployed on Vercel.

Features:
- **Home** — ASCII banner, introduction
- **About** — Personal info, work experience, skills, education, certifications, gear
- **Projects** — Filterable project cards with tech stack tags
- **Articles** — Curated reading list sourced dynamically from a Notion database

---

## Stack

| Layer | Technology |
|---|---|
| Framework | [SvelteKit 2](https://svelte.dev/) + Svelte 5 |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Markdown | [mdsvex](https://mdsvex.pngwn.io/) |
| Syntax highlighting | [Shiki](https://shiki.style/) — `poimandres` theme |
| Articles source | [Notion API](https://developers.notion.com/) via `@notionhq/client` |
| Deployment | [Vercel](https://vercel.com) (`@sveltejs/adapter-vercel`) |
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

# Notion integration (for Articles page)
NOTION_TOKEN="ntn_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
NOTION_DATABASE_ID="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

- `NOTION_TOKEN` — create an internal integration at [notion.so/my-integrations](https://www.notion.so/my-integrations) and share your database with it
- `NOTION_DATABASE_ID` — the 32-character ID from the database URL (not the page URL)

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

**Required environment variables on Vercel:**

| Variable | Description |
|---|---|
| `BASE_URL` | Production domain (e.g. `https://viethoang.dev`) — used by sitemap |
| `NOTION_TOKEN` | Notion integration secret |
| `NOTION_DATABASE_ID` | ID of the "My blog" database |

To set them: Vercel Dashboard → Project → Settings → Environment Variables.

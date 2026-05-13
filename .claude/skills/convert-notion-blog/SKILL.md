---
name: convert-notion-blog
description: Interactively fetch published articles from the Notion database and migrate them as .md files into src/contents/articles/. Prompts user to choose all or specific articles before writing.
origin: user
version: 1.0.0
---

# Convert Notion Blog

Use this skill to clone published articles from the Notion database into local
Markdown files under `src/contents/articles/`. Always runs interactively —
the user chooses which articles to migrate before any files are written.

## When to Use

- Migrating Notion articles to local Markdown for offline use or static rendering
- Bulk-importing new articles published in Notion
- Selectively pulling specific articles without touching existing files

## Prerequisites

- `.env` file at project root with `NOTION_TOKEN` and `NOTION_DATABASE_ID` set
- Dependencies installed (`pnpm install`)
- Run all scripts from the **project root** (`/Users/viethoang/Projects/site`)

## Interactive Workflow — Follow These Steps Exactly

### Step 1 — Fetch the article list

Run the list script to get all published articles from Notion:

```bash
node --env-file=.env .claude/skills/convert-notion-blog/scripts/list.js
```

This prints a numbered list of available articles. Capture the output to present
to the user.

### Step 2 — Ask the user what to migrate

Present this choice:

> Here are the published articles available in Notion:
>
> [1] Article Title One  (slug-one) — May 26, 2025
> [2] Article Title Two  (slug-two) — Apr 10, 2025
> ...
>
> Do you want to migrate **all** articles or **specific** ones?
> - Type `all` to migrate everything
> - Type the numbers of the articles you want (e.g. `1,3`)

Wait for the user's response before proceeding.

### Step 3a — Migrate all

If the user chose all:

```bash
node --env-file=.env .claude/skills/convert-notion-blog/scripts/migrate.js --all
```

### Step 3b — Migrate specific articles

If the user chose specific numbers, resolve their selection to slugs from the
list output, then pass them as `--ids`:

```bash
node --env-file=.env .claude/skills/convert-notion-blog/scripts/migrate.js --ids=slug-one,slug-two
```

### Step 4 — Report results

After the script finishes, summarise to the user:
- How many files were written
- How many were skipped (already existed)
- Any errors encountered
- Where the files landed: `src/contents/articles/`

## Output Format

Each migrated article is written as `src/contents/articles/{slug}.md`:

```md
---
title: Article Title
description: One-line description.
publishedDate: May 26, 2025
poster: https://...
---

(article body in markdown)
```

The format matches the existing articles in `src/contents/articles/`.

## Flags

| Flag | Behaviour |
|------|-----------|
| `--all` | Migrate every published article |
| `--ids=slug1,slug2` | Migrate only the listed slugs |
| `--force` | Overwrite existing `.md` files (default: skip) |

## Notes

- Articles already present as `.md` files are **skipped by default** — pass `--force` to overwrite
- The Notion client is pinned to `@notionhq/client` v2 — do not suggest upgrading
- `NOTION_DATABASE_ID` in `.env` should be the 32-char hex ID (no dashes)
- Scripts are plain Node.js — no SvelteKit build step needed

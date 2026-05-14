---
name: convert-notion-blog
description: Interactively migrate Notion articles to local .md files, write a new blog post from any URL into Notion, or smooth existing articles with AI (language detection + content refinement).
origin: user
version: 3.0.0
---

# Convert Notion Blog

Three modes of operation — always ask the user which they want before doing anything.

## Mode A — Migrate: Notion → local `.md` files

Pulls published articles from the Notion database and writes them as Markdown files
under `src/contents/articles/`.

## Mode B — Write: URL → Notion DB → (optionally) local `.md` file

Fetches a blog post from any URL, runs AI smoothing (language detection + content
refinement), creates a new page in the Notion database, then optionally saves it
as a local `.md` file.

## Mode C — Smooth: AI polish existing local `.md` file(s)

Runs AI smoothing on one or all articles already in `src/contents/articles/`:
- Pass 1: detects programming languages for untagged code fences
- Pass 2: refines content for clarity, tone, and originality

---

## Prerequisites

- `.env` file at project root with `NOTION_TOKEN`, `NOTION_DATABASE_ID`, and `OPENAI_API_KEY` set
- Dependencies installed (`pnpm install`)
- Run all scripts from the **project root** (`/Users/viethoang/Projects/site`)

---

## Interactive Workflow — Follow These Steps Exactly

### Step 1 — Ask which mode

Present this choice to the user:

> What would you like to do?
>
> **[A] Migrate** — pull published articles from Notion → local `.md` files
> **[B] Write new blog** — fetch a blog post from a URL → AI smooth → add to Notion (+ optionally save locally)
> **[C] Smooth** — AI polish existing local `.md` file(s) (language detection + content refinement)

Wait for the user's response before proceeding.

---

### Mode A — Migrate existing Notion articles

#### Step A1 — Fetch the article list

```bash
node --env-file=.env .claude/skills/convert-notion-blog/scripts/list.js
```

This prints a numbered list of published articles. Capture the output to present to the user.

#### Step A2 — Ask what to migrate

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

#### Step A3a — Migrate all

```bash
node --env-file=.env .claude/skills/convert-notion-blog/scripts/migrate.js --all
```

#### Step A3b — Migrate specific articles

Resolve numbers to title-based slugs from the list output, then pass them as `--ids`:

```bash
node --env-file=.env .claude/skills/convert-notion-blog/scripts/migrate.js --ids=slug-one,slug-two
```

#### Step A4 — Report results

Summarise to the user:
- How many files were written / skipped / failed
- Where the files landed: `src/contents/articles/`

---

### Mode B — Write new blog from URL

#### Step B1 — Ask for the URL

Ask the user to paste the blog post URL they want to import.

#### Step B2 — Fetch, smooth, and create in Notion

```bash
node --env-file=.env .claude/skills/convert-notion-blog/scripts/write.js --url=<url>
```

This script:
1. Fetches and extracts the article content from the URL
2. Converts HTML → Markdown (headings, images, blockquotes, code, lists all preserved)
3. **AI smooth**: detects code block languages + refines content for tone and originality
4. Converts smoothed Markdown → Notion block objects
5. Creates a new page in the Notion database with the article's title, description, date, and cover image

The script prints the created Notion page URL and the title-based slug on success.

If the URL requires JavaScript rendering or blocks scrapers, the script will fail with
a clear error. In that case, ask the user to paste the article text directly instead.

#### Step B3 — Ask if they want a local `.md` file

> The article was added to Notion. Do you also want to save it as a local `.md` file
> in `src/contents/articles/`?

If **yes**, use the slug printed in Step B2:

```bash
node --env-file=.env .claude/skills/convert-notion-blog/scripts/migrate.js --ids=<slug>
```

#### Step B4 — Report results

Summarise:
- The Notion page URL
- Whether the local `.md` file was saved and where

---

### Mode C — Smooth existing article(s)

#### Step C1 — Ask which article(s) to smooth

> Which article would you like to smooth?
> - Paste the slug (e.g. `my-article`) to smooth a single article
> - Type `all` to smooth every article in `src/contents/articles/`

Wait for the user's response before proceeding.

#### Step C2 — Dry-run first (recommended)

Show a preview of what will change without writing:

```bash
node --env-file=.env .claude/skills/convert-notion-blog/scripts/smooth.js --file=src/contents/articles/<slug>.md --dry-run
# or for all:
node --env-file=.env .claude/skills/convert-notion-blog/scripts/smooth.js --all --dry-run
```

#### Step C3 — Apply (after user confirms)

```bash
node --env-file=.env .claude/skills/convert-notion-blog/scripts/smooth.js --file=src/contents/articles/<slug>.md
# or for all:
node --env-file=.env .claude/skills/convert-notion-blog/scripts/smooth.js --all
```

#### Step C4 — Report results

Summarise:
- How many code blocks were tagged per article
- Word count before → after for content refinement
- Whether dry-run or applied

---

## Output Format

Each local article is written as `src/contents/articles/{slug}.md`:

```md
---
title: Article Title
description: One-line description.
publishedDate: May 26, 2025
poster: https://...
---

(article body in markdown)
```

---

## Flags Reference

### migrate.js

| Flag | Behaviour |
|------|-----------|
| `--all` | Migrate every published article |
| `--ids=slug1,slug2` | Migrate only the listed title-based slugs |
| `--force` | Overwrite existing `.md` files (default: skip) |

### write.js

| Flag | Behaviour |
|------|-----------|
| `--url=<url>` | URL of the blog post to import **(required)** |

### smooth.js

| Flag | Behaviour |
|------|-----------|
| `--file=<path>` | Smooth a single `.md` file |
| `--all` | Smooth every article in `src/contents/articles/` |
| `--dry-run` | Preview changes without writing |

---

## Notes

- Articles already present as `.md` files are **skipped by default** — pass `--force` to overwrite
- The Notion client is pinned to `@notionhq/client` v2 — do not upgrade to v5
- `NOTION_DATABASE_ID` in `.env` should be the 32-char hex ID (no dashes)
- Scripts are plain Node.js — no SvelteKit build step needed
- Slugs are derived from article titles, not Notion page IDs
- Smoothing uses `gpt-4o-mini` — very low cost (~$0.001 per article)
- If `OPENAI_API_KEY` is missing, `write.js` skips smoothing with a warning

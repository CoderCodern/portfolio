---
name: rename-blog-playlist
description: Rename a blog playlist (series) — updates the frontmatter series field, inline episode tags in md bodies, and series-tag divs in rendered html files
origin: user
---

## When to Activate
- "rename the playlist X to Y"
- "rename the series X"
- user wants to change a playlist/series name across all articles

---

## What It Updates

For every article whose frontmatter has `series: <old name>`:

| Layer | Pattern replaced |
|-------|-----------------|
| `.md` frontmatter | `series: Old Name` → `series: New Name` |
| `.md` body | `**Old Name · Episode NN**` → `**New Name · Episode NN**` |
| `.html` (via `htmlFile:`) | `<div class="series-tag">Old Name · Episode NN</div>` → `<div class="series-tag">New Name · Episode NN</div>` |

---

## Workflow

### Step 1 — Discover available playlists

Always run this first to find all series in the articles directory:

```bash
node .claude/skills/rename-blog-playlist/scripts/rename.js --list
```

Sample output:
```
Available playlists (2):

  "Claude Code"                  3 articles
  "Another Series"               1 article
```

### Step 2 — Ask the user to choose

Use `AskUserQuestion` to present the discovered playlists as options. Build the `options` array dynamically from the `--list` output — one option per series, with the article count as the description. If no playlists are found, tell the user and stop.

Combine both questions in a single `AskUserQuestion` call:
1. Which playlist to rename (options built from `--list` output)
2. What the new name should be

### Step 3 — Run the rename

```bash
node .claude/skills/rename-blog-playlist/scripts/rename.js --from="Old Name" --to="New Name"
```

The script prints each file it touches:

```
Renaming playlist: "Old Name" → "New Name"

  ✓ md   article-slug-1.md
  ✓ html article-slug-1.html
  ✓ md   article-slug-2.md
  ✓ html article-slug-2.html

Done. 2 md file(s), 2 html file(s) updated.
```

### Step 4 — Verify

The script only touches files that match. Confirm the output lists the expected articles.

If an html file is missing (not yet generated), the script prints a warning and skips it — no error.

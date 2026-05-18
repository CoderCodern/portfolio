---
name: cv-to-portfolio
description: Sync Viet Hoang's CV PDF to profile.md, then propagate changes into SvelteKit portfolio content files (src/contents/projects/, src/contents/abouts/). Two-stage workflow: convert PDF → refresh profile, then profile → update portfolio.
origin: local
---

# CV → Portfolio Sync

Two-stage workflow for keeping the portfolio in sync with the CV.

**Source of truth chain:**
```
personal-info/Nguyen-Viet-Hoang-March-2026.pdf
        ↓  (Stage 1: sync-cv)
personal-info/profile.md
        ↓  (Stage 2: sync-portfolio)
src/contents/projects/*.md
src/contents/abouts/*.md
```

---

## Stage 1 — Sync CV: PDF → profile.md

### Option A: Using the MCP tool (Claude Code sessions only)

Ask Claude:
> "Convert `file:///Users/viethoang/Projects/site/personal-info/Nguyen-Viet-Hoang-March-2026.pdf` to Markdown and update `personal-info/profile.md`"

Claude will call `convert_to_markdown(uri)` and write the result to `profile.md`.

### Option B: Using the CLI (any terminal)

```bash
cd ~/Projects/site

# Activate the markitdown venv
source ~/markitdown-mcp-venv/bin/activate

# Or use the pipx-installed CLI directly
export PATH="$PATH:/Users/viethoang/.local/bin"

markitdown personal-info/Nguyen-Viet-Hoang-March-2026.pdf -o personal-info/profile.md
```

### When to run Stage 1

Run Stage 1 whenever:
- You update the PDF with a new role, project, or certification
- You want to compare the PDF's extracted content with what's in `profile.md`

> **Note:** The existing `profile.md` is already comprehensive and manually curated. After a PDF conversion, review the diff before accepting — the PDF extraction may miss formatting nuances.

---

## Stage 2 — Sync Portfolio: profile.md → content files

### What profile.md contains

`personal-info/profile.md` is the canonical source for:
- Work experience (employer, role, dates, tech)
- Projects (name, description, contributions, stack)
- Education
- Certifications
- Skills

### Portfolio content locations

| Content type | Directory | Format |
|---|---|---|
| Project cards | `src/contents/projects/` | Frontmatter + Markdown body |
| About tabs | `src/contents/abouts/` | Frontmatter + TypeScript pseudo-code |

### Project file format

Each file in `src/contents/projects/<slug>.md`:

```md
---
title: Project Name
description: One-line description for the card.
poster: /projects/<image>.png
techstack:
  - .NET
  - React
date: Jan 2026 – Present
category: Enterprise
---

Employer · Date range · Team size: N+

Longer paragraph describing the project.

## Contributions

- Bullet point one
- Bullet point two

## Stack

- Tech · Version / variant
- Tech · Version / variant
```

### About tab format

Each file in `src/contents/abouts/<slug>.md` uses TypeScript pseudo-code style:

```md
---
title: 'filename.ts'
description: 'Short tagline.'
---

```ts
const FIELD = 'value';
const items = ['a', 'b', 'c'];
```
```

### Existing project slugs

| Slug | Project |
|---|---|
| `slr-seg.md` | SLR SEG (NashTech) |
| `slr-sustain.md` | SLR Sustain (NashTech) |
| `atlanta.md` | Atlanta (NashTech) |
| `shopship.md` | ShopShip (WindSoft) |
| `tnt-security.md` | TNT Security (WindSoft) |
| `care-house.md` | Care House (WindSoft) |
| `ncc-erp.md` | NCC ERP (NCC Plus) |
| `ucg.md` | UCG (NCC Plus) |

### Existing about slugs

| Slug | Content |
|---|---|
| `work.md` | Role, employers, skills, education, certs (TypeScript style) |
| `personal.md` | Personal info |
| `gear.md` | Dev setup / tools |

### Poster image convention

Project poster images live in `static/projects/`. Current pattern:
- `nashtech-seg.png`, `nashtech-slr.png`, `nashtech-atlanta.png`
- `windsoft-shopship.png`, `windsoft-carehouse.png`, `windsoft-vesi.png`
- `ncc-erp.png`, `ncc-ucg.png`

When adding a new project, drop a poster image in `static/projects/` using the same `<company>-<slug>.png` pattern.

---

## Typical Workflow

### Adding a new job or project from the CV

1. Update the PDF with the new role/project
2. Run Stage 1 to refresh `profile.md`
3. Review and clean up `profile.md` as needed
4. Tell Claude: "Create a new project entry in `src/contents/projects/` for [Project Name] based on `personal-info/profile.md`"
5. Claude generates the file using the frontmatter + body format above
6. Add a poster image to `static/projects/` if you have one

### Updating an existing project entry

Tell Claude:
> "Update `src/contents/projects/slr-seg.md` to reflect the latest contributions in `personal-info/profile.md`"

### Refreshing the work.md about tab

Tell Claude:
> "Regenerate `src/contents/abouts/work.md` using the skills, employers, education, and certifications in `personal-info/profile.md`. Keep the TypeScript pseudo-code style."

---

## Key Constraints (from CLAUDE.md)

- All portfolio routes use SvelteKit file-based routing — new `src/contents/projects/<slug>.md` files appear automatically as project pages
- TypeScript everywhere, `$lib/...` imports, no relative paths
- Tailwind CSS v4 with `ash-*` OKLCH color scale — no inline `style=""`
- Svelte 5 runes only: `$props()`, `$state()`, `$derived()`, `$effect()`
- `@notionhq/client` pinned to v2 — do not touch
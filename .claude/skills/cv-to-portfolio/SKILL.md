---
name: cv-to-portfolio
description: Sync Viet Hoang's CV PDF to profile.md, then propagate changes into SvelteKit portfolio content files (src/contents/projects/, src/contents/abouts/). The PDF converter is embedded in the project — no external tools needed.
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

The PDF converter is embedded in the project. No external tools required.

```
personal-info/
├── tools/                    ← embedded PDF converter (MIT, from microsoft/markitdown)
│   ├── _pdf_converter.py
│   ├── _base_converter.py
│   ├── _stream_info.py
│   └── _exceptions.py
├── convert_cv.py             ← runner script
├── requirements.txt          ← pdfminer.six + pdfplumber only
├── .venv/                    ← gitignored, created once
└── Nguyen-Viet-Hoang-March-2026.pdf
```

### First-time setup (one-time only)

```bash
cd ~/Projects/site
python3 -m venv personal-info/.venv
source personal-info/.venv/bin/activate
pip install -r personal-info/requirements.txt
```

### Running the conversion

```bash
cd ~/Projects/site
personal-info/.venv/bin/python personal-info/convert_cv.py
```

Output: `Done → profile.md (N characters)`

### When to run Stage 1

- After you update the PDF with a new role, project, or certification
- The script overwrites `profile.md` — review the diff before committing

> **Note:** `profile.md` is already curated. The raw PDF extraction is good for catching new content, but may miss formatting nuances. Always review the diff.

---

## Stage 2 — Sync Portfolio: profile.md → content files

### Portfolio content structure

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

### Existing slugs

**Projects** (`src/contents/projects/`):

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

**Abouts** (`src/contents/abouts/`):

| Slug | Content |
|---|---|
| `work.md` | Role, employers, skills, education, certs (TypeScript style) |
| `personal.md` | Personal info |
| `gear.md` | Dev setup / tools |

### Poster image convention

`static/projects/<company>-<slug>.png` — e.g. `nashtech-seg.png`, `windsoft-shopship.png`.

---

## Typical Workflow

### Adding a new job or project to the portfolio

1. Update the PDF with the new role/project
2. Run `personal-info/.venv/bin/python personal-info/convert_cv.py`
3. Review the diff in `personal-info/profile.md`, clean up as needed
4. Tell Claude: "Create a new project entry in `src/contents/projects/` for [Project Name] based on `personal-info/profile.md`"
5. Claude generates the file using the format above
6. Drop a poster image in `static/projects/` if you have one

### Updating an existing project entry

Tell Claude:
> "Update `src/contents/projects/slr-seg.md` to reflect the latest contributions in `personal-info/profile.md`"

### Refreshing the work.md about tab

Tell Claude:
> "Regenerate `src/contents/abouts/work.md` using the skills, employers, education, and certifications in `personal-info/profile.md`. Keep the TypeScript pseudo-code style."

---

## Key Constraints (from CLAUDE.md)

- New `src/contents/projects/<slug>.md` files appear as portfolio pages automatically
- TypeScript everywhere, `$lib/...` imports, no relative paths
- Tailwind CSS v4 with `ash-*` OKLCH color scale — no inline `style=""`
- Svelte 5 runes only: `$props()`, `$state()`, `$derived()`, `$effect()`
- `@notionhq/client` pinned to v2 — do not touch
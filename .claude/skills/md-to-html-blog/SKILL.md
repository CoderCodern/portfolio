---
name: md-to-html-blog
description: Convert markdown blog posts to styled HTML using the dark editorial design system with personality elements like jokes, quotes, and callouts
origin: user
---

## When to Activate
- "convert this markdown to HTML blog"
- "generate the HTML version" of a post
- "apply the blog design" to a markdown file
- user wants to turn a draft into a publishable blog page

---

## Accent Colors

| Episode / Theme  | `--accent`  | `--accent-dim` |
|------------------|-------------|----------------|
| 01 Installation  | `#e8a84c`   | `#3d2c12`      |
| 02 CLAUDE.md     | `#c9b1f5`   | `#1e1529`      |
| 03 Skills        | `#4caf7d`   | `#122a1e`      |
| 04 Subagents     | `#79c0ff`   | `#0d1f2d`      |
| 05 Hooks         | `#f0856a`   | `#2d1510`      |
| 06 Workflows     | `#56d4c8`   | `#0d2422`      |
| Unassigned       | `#e8a84c`   | `#3d2c12`      |

---

## Component Map

Use **shorthand** in the data file — the assembler expands it. Raw HTML still works but costs more tokens.

| Element               | Shorthand (preferred)                | Raw HTML fallback              |
|-----------------------|--------------------------------------|--------------------------------|
| `# Title`             | —                                    | `<h1>` inside `.hero`          |
| `## Section`          | —                                    | `<h2>` preceded by `.divider`  |
| `` `code` ``          | —                                    | `<code>`                       |
| ` ```lang ` block (verbatim from md) | `[code:N]`            | —                              |
| ` ```lang ` block (new/edited)       | `[code:lang]...[/code]` | `.code-block` div            |
| Pull quote            | `[bq]text[/bq]`                      | `<blockquote><p>text</p></blockquote>` |
| Amber callout         | `[tip]text[/tip]`                    | `<div class="callout">...`     |
| Green callout         | `[verdict]text[/verdict]`            | `<div class="callout green">...` |
| Red callout           | `[warn]text[/warn]`                  | `<div class="callout red">...` |
| Witty aside           | `[aside]text[/aside]`                | `<p class="aside"><em>text</em></p>` |
| Checklist             | `[list]\nitem\nitem\n[/list]`        | `<ul class="check-list">...`   |
| Compare grid          | `[cmp]\nbad: H\|i\ngood: H\|i\n[/cmp]` | `.compare` div grid         |
| Table                 | —                                    | `.table-wrap > table`          |
| Divider               | —                                    | `<div class="divider"><span>label</span></div>` |

**`[code:N]` — code block passthrough:** The assembler reads the Nth fenced code block from the markdown source file and injects it verbatim. N counts from 1 in document order. Use this for every code block that appears unchanged from the markdown — it saves all re-typing tokens. Only use `[code:lang]...[/code]` for blocks you write new or edit.

### Shorthand examples

```
[code:1]

[code:2]

[code:json]
{ "total": 100 }
[/code]

[tip]Your tip text here.[/tip]

[verdict]Your verdict text here.[/verdict]

[warn]Your warning text here.[/warn]

[aside]Dry joke or sarcastic observation here.[/aside]

[bq]"The most important sentence from the article."[/bq]

[list]
First action item
Second action item
Third action item
[/list]

[cmp]
bad: ❌ What most people do|Bad item 1|Bad item 2
good: ✅ What actually works|Good item 1|Good item 2
[/cmp]
```

---

## Personality Rules

**Minimum per post:** 1 blockquote pull-quote, 2 callouts, 1 witty `<em>` aside per section, 1 compare grid if do/don't content exists.

```html
<!-- Pull quote -->
<blockquote><p>"The most important sentence from the article."</p></blockquote>

<!-- Callouts: amber=tip, green=verdict, red=warning -->
<div class="callout"><div class="callout-label">💡 Tip</div><p>...</p></div>
<div class="callout green"><div class="callout-label">✓ Verdict</div><p>...</p></div>
<div class="callout red"><div class="callout-label">⚠️ Warning</div><p>...</p></div>

<!-- Witty aside -->
<p class="aside"><em>Dry joke or sarcastic observation here.</em></p>

<!-- Compare grid -->
<div class="compare">
  <div class="compare-col">
    <div class="compare-header bad-h">❌ What most people do</div>
    <div class="compare-item bad-t">...</div>
  </div>
  <div class="compare-col">
    <div class="compare-header good-h">✅ What actually works</div>
    <div class="compare-item good-t">...</div>
  </div>
</div>
```

**Tone:** senior dev — direct, self-aware, occasionally sarcastic, always helpful.
Good: *"That's more stars than most devs have commits."* / *"Yes, the test first. Before. I know."*
Bad: forced puns, mocking the reader, breaking technical credibility.

| Section type         | Personality element to inject                     |
|----------------------|---------------------------------------------------|
| Install / setup      | Joke about expecting it to be harder              |
| First use / aha      | Honest blockquote capturing the realization       |
| Do/don't rules       | Compare grid                                      |
| Best practices list  | Green callout verdict at end                      |
| Warning / gotcha     | Red callout with a joke inside                    |
| End of post          | Blockquote as closing thought                     |

---

## Prose Tone Rules

Write like a senior dev talking to a teammate — not like writing API documentation.

**Kill on sight:**
- Passive constructions: "It is important to note that...", "It should be mentioned..."
- Academic framing: "Furthermore", "The aforementioned", "This approach provides"
- Over-qualification: "In most cases", "Generally speaking", "It may be worth considering"
- List-as-introduction: paragraphs that just enumerate what the post will cover instead of just covering it
- Sentences starting with "It is" or "This is X that Y" — almost always replaceable

**Use instead:**
- Direct address: "You'll notice...", "Here's the thing:"
- Short sentences. One idea, one period.
- Own the opinion: "This one's better" not "This may be preferable"
- Human connectives: "So", "Now", "The trick is", "Turns out", "Here's why"
- First-person where genuine: "I ran this and...", "Took me a while to get this"

**Before → After examples:**
```
❌ "This article covers the complete hierarchy, how to structure each file, and the SOUL.md pattern."
✅ "Here's what we'll cover: the full file hierarchy, what goes in each layer, and the SOUL.md trick."

❌ "It is important to note that the description field functions as a trigger condition."
✅ "The description field is a trigger condition, not a capability list. That difference matters more than anything else in the file."

❌ "Before anything else, dispel the most common misconception."
✅ "Quick reality check first."

❌ "After reviewing dozens of repositories, these are the patterns that consistently separate effective files from ineffective ones."
✅ "After going through dozens of repos, here's what actually separates the files that work from the ones that silently stopped working."
```

**Minimum per section:** At least one direct-address or first-person sentence. No paragraph starting with "It is", "This is", or "This article/post covers".

---

## Divider Rule

Label = 1–3 lowercase words extracted from the `<h2>` text.

```html
<div class="divider"><span>the mental model</span></div>
<h2>The Mental Model Most People Get Wrong</h2>
```

---

## H1 Rule

Wrap the most evocative phrase in `<em>` — not a proper noun, not a filename, not the first word.

```html
<!-- Good -->
<h1>Skills: The <em>Passive Knowledge Layer</em> That Makes Claude Actually Good</h1>
<!-- Bad — file name, first word -->
<h1>How to Write a <em>CLAUDE.md</em> File</h1>
```

---

## Anti-Patterns

| Mistake                            | Fix                                      |
|------------------------------------|------------------------------------------|
| `<h1>` inside `<article>`          | H1 lives in `.hero` only                 |
| Missing `.lead` on first paragraph | First `<p>` always gets `.lead`          |
| `<ul>` for action items            | Use `.check-list`                        |
| No `.divider` before `<h2>`        | Every `<h2>` needs one                   |
| No personality in a section        | Add `<em>` aside or callout at minimum   |
| Wrong accent color                 | Check episode table above                |
| CSS in a separate file             | All styles inline — single file output   |
| Italicising file names in `<h1>`   | Wrap evocative phrases only              |
| No `htmlFile:` in md frontmatter   | Site falls back to raw markdown — always add it after assembly |
| `NEXT_EPISODE_URL` not set         | Next-post block is a dead div — always look up the playlist first |
| Wrong next episode title           | Use the next article's `title:` frontmatter verbatim, not a paraphrase |

---

## Workflow

### Step 0 — Choose article
```bash
ls src/contents/articles/*.md
```
Present a numbered list. Wait for the user to pick before proceeding.

### Step 1 — Read the markdown
Identify: episode number, sections, code blocks, tables, approximate length.

**If the article has `series:` in its frontmatter**, run the playlist lookup immediately:

```bash
grep -r "^series:" src/contents/articles/*.md | grep -v "^Binary"
```

Find all articles in the same series, sort them by `episode:` frontmatter value, and determine:
- The **next article slug** (for `NEXT_EPISODE_URL`)
- The **exact title** of that next article (for `NEXT_EPISODE_TITLE`)

Use the article's own markdown `title:` frontmatter value verbatim — do not invent or paraphrase it.

If the current article is the **last in the series** (no next episode exists yet):
- Set `NEXT_EPISODE_TITLE` to the anticipated next title (use the markdown body's "Next in the series" line if present)
- Set `NEXT_EPISODE_URL` to `#`
- In the HTML, keep the block as `<div class="next-post">` (not `<a>`) and set the label to `Coming up next`

**Important:** The assembled HTML loads inside a SvelteKit `<iframe>`. The `<a class="next-post">` in the template already has `target="_parent"` — this is required. Without it, the link navigates the iframe itself, producing a frame-in-frame black screen. Never remove `target="_parent"` from series navigation links.

### Step 1.5 — Smooth the prose

Before writing the data file, mentally re-read each paragraph through the Prose Tone Rules above.

Flag and rewrite any paragraph that:
- Starts with "It is" / "This is" / "The X is a Y that Z"
- Opens by listing what the article will cover (just cover it)
- Uses academic framing: "Furthermore", "In most cases", "It should be noted"
- Reads like documentation rather than a person talking

Code blocks, tables, callout labels, and checklist items are exempt — only rewrite `<p>` prose.

### Step 2 — Pick accent color
Use the table above. Note both hex values.

### Step 3 — Map elements
Convert every markdown element using the Component Map above.

**Code blocks — count them first:** Before writing the data file, number each fenced code block in the markdown (1, 2, 3…) in document order. Use `[code:N]` for every block that appears verbatim. Only use `[code:lang]...[/code]` for blocks you write new or meaningfully edit. The assembler warns if an index is out of range.

### Step 4 — Inject personality
Minimum: 1 blockquote, 2 callouts, 1 aside joke per section. Use compare grid where do/don't content exists.

### Step 5 — Add dividers
Every `<h2>` must be preceded by a `.divider`. Apply the Divider Rule above.

### Step 6 — Write data file and assemble

Write `src/contents/articles/html/<slug>.data` in this exact format:

```
PAGE_TITLE: Article title here
ACCENT_COLOR: #e8a84c
ACCENT_DIM: #3d2c12
SERIES_LABEL: Claude Code
EPISODE_NUM: 01
H1_WITH_EM_WRAPPED_KEYWORD: Title: The <em>Key Phrase</em> Goes Here
DATE: May 2026
READ_TIME: 8
TAG_1: Claude Code
TAG_2: AI
TAG_3: Tools
FIRST_PARAGRAPH: Lead paragraph as plain HTML on one line. <strong>Bold</strong> and <em>italics</em> are fine.
NEXT_EPISODE_TITLE: Title of the next post in the series
NEXT_EPISODE_URL: /articles/<next-slug>
FOOTER_REFERENCES: Source attributions, or "No external sources."
---CONTENT---
<div class="divider"><span>first section</span></div>
<h2>First Section Heading</h2>
<p>...</p>
```

Rules for the data file:
- Each metadata key is on its own line, `KEY: value` (colon-delimited)
- Values must not contain newlines — inline HTML only (e.g. `<strong>`, `<em>`, `<code>`)
- `---CONTENT---` is a literal separator line — everything after it becomes the article body
- `CONVERTED_CONTENT` is **not** a key — the script injects the content block automatically

Then run the assembler:
```bash
node .claude/skills/md-to-html-blog/scripts/assemble.js <slug>
```

This reads the `.data` file, fills all `{{VARIABLES}}` into `templates/base.html`, writes the final `.html`, and deletes the `.data` file.

### Pre-flight check
- Every `<h2>` has a preceding `.divider`?
- First paragraph in content uses `.lead`? (added automatically by template as `{{FIRST_PARAGRAPH}}`)
- At least 1 personality element per section?
- Correct accent color for the episode?

---

### Step 7 — Wire up the markdown frontmatter

**This step is required — without it the site renders markdown instead of HTML.**

The article route (`src/routes/articles/[slug]/+page.ts`) only loads the HTML file when the markdown frontmatter has an `htmlFile` key. Add it now:

```
htmlFile: <slug-of-the-html-file-without-extension>
```

Example — if the HTML was written to `src/contents/articles/html/my-article.html`:

```yaml
---
title: My Article
publishedDate: 2024-01-15
htmlFile: my-article
---
```

The value must exactly match the HTML filename (no `.html` extension). When this key is present the page renders the iframe with the styled HTML; when it's absent the page falls back to the unstyled markdown view.

---

### Step 8 — Report token cost

The assembler prints data file size automatically. Read it from the last line of assembler output — it looks like:

```
✓  src/contents/articles/html/<slug>.html
   data: 14200B (3550 est. tokens) → html: 32100B
```

Also measure the markdown input:

```bash
wc -c src/contents/articles/<slug>.md
```

Then report this block at the end of your response (fill in measured values):

---
**Token Cost Report — `<slug>`**

| | Bytes | Est. tokens (÷ 4) |
|---|---|---|
| Input — markdown read | `___` | `___` |
| Output — data file written | `___` | `___` (from assembler output) |
| Template CSS (not read by Claude) | ~15,600 | 0 |
| **Total Claude tokens** | | **`___`** |

> Baseline (old workflow, no assembler): ~`(md + html_assembled) ÷ 4` tokens. Saved ~`___`%.

---

Savings % = (1 − this_total ÷ baseline) × 100, where baseline = (md_bytes + assembled_html_bytes) ÷ 4.

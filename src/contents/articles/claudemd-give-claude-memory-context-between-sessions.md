---
title: "CLAUDE.md: Give Claude Memory & Context Between Sessions"
publishedDate: May 20, 2026
category: AI
poster: /articles/claude/cover.png
htmlFile: claudemd-give-claude-memory-context-between-sessions
series: Claude Code
episode: 2
---

Content is user-generated and unverified.

> 
>
> **Claude Code · Episode 02**
>
>

## CLAUDE.md: The File That Provides Claude with Memory, Personality, and Structure


_May 2026 · 12 min read · CLAUDE.md · Global Config · Personality · Real Templates_


While Week 1 focused on getting Claude Code operational, Week 2 emphasizes personalizing it to understand you better. The most significant leverage point in the Claude Code ecosystem is a simple markdown file named `CLAUDE.md`. Master this file, and every session begins with Claude already familiar with your stack, rules, and working style. Neglect it or overlook its importance, and you risk wasting tokens reintroducing yourself daily.


This article delves into every aspect: the complete hierarchy, structuring the file, what to include, the "Soul" pattern that infuses Claude with personality, and insights from the 220,000 GitHub stars garnered by Andrej Karpathy's influential file regarding the essential rules.


## Understanding CLAUDE.md


`CLAUDE.md` is a markdown file that Claude Code automatically reads at the beginning of each conversation—before you enter any text. Unlike a JSON configuration file, it lacks a schema or validation; it is simply plain text that influences Claude's thought process when collaborating with you.


Consider it a permanent briefing document. Each session starts with Claude having already reviewed it.

> 
>
> **The problem it addresses:** Claude Code lacks memory between sessions. Without CLAUDE.md, you begin from scratch each time. With it, you start from everything that matters.
>
>

## The Hierarchy: Four Levels, One System


This is a crucial aspect that many overlook. CLAUDE.md is not just a single file; it represents a layered system. Claude reads from multiple locations and integrates the information.


```vb
~/.claude/CLAUDE.md          ← 🌍 Global — YOUR soul, across all projects
~/.claude/SOUL.md            ← 🎭 Personality — how Claude communicates
~/projects/
└── my-app/
    ├── CLAUDE.md            ← 👥 Project — shared with team via git
    ├── CLAUDE.local.md      ← 🔒 Personal — your notes, gitignored
    └── src/
        └── api/
            └── CLAUDE.md    ← 📁 Subdirectory — lazy-loaded on demand
```


| File                  | Who Sees It                          | When to Use It                             |
| --------------------- | ------------------------------------ | ------------------------------------------ |
| `~/.claude/CLAUDE.md` | You only, all projects               | Your coding philosophy, style, personality |
| `~/.claude/SOUL.md`   | You only, all projects               | Communication style, tone, persona         |
| `./CLAUDE.md`         | Whole team (committed to git)        | Stack, commands, conventions, architecture |
| `./CLAUDE.local.md`   | You only (gitignored)                | Personal notes, WIP context, local paths   |
| `./src/api/CLAUDE.md` | Loaded when Claude reads files there | Domain-specific rules for a module         |


**Precedence rule:** More specific files take priority over broader ones. For instance, if your global file states "use tabs," but the project file specifies "use 2-space indentation," the project file's directive prevails.


## Level 1: The Global File — Your Developer DNA


`~/.claude/CLAUDE.md` is loaded into every project and session. This file should contain information that reflects _you as a developer_, rather than details about any specific codebase.


What to include:

- Your overarching coding philosophy (favoring simplicity and readability over cleverness)
- Your preferred communication style with Claude
- Your git commit preferences
- Cross-project tools you consistently utilize (e.g., always opting for `pnpm` over `npm`)
- Your review habits (always show a `/diff` before accepting changes)

**Minimal global starter:**


```vb
# Global Developer Config
## My Philosophy
- Prefer simple, readable code over clever abstractions
- Write the minimum code that actually solves the problem
- Readability beats brevity. Maintainability beats both.
## How I Work
- Always show me a `/diff` summary before large changes
- Ask before creating new files I didn't specifically request
- If you're uncertain about intent, ask — don't assume
## Git Style
- Conventional commits: feat:, fix:, chore:, docs:
- One logical change per commit
- Never use `--no-verify`
## Tools
- Package manager: pnpm (not npm or yarn)
- Always run typecheck after editing TypeScript files
```


## Level 2: SOUL.md — Infusing Claude with Personality


This concept revolutionized my perspective on AI tools. Inspired by `seaneoliver/claude-code-starter` on GitHub, `SOUL.md` is a distinct file (also located at `~/.claude/SOUL.md`) that focuses entirely on _how Claude communicates_—its tone, personality, and default behaviors when interacting with you.


**Why a separate file?** Mixing personality and technical instructions can lead to confusion. Keeping them distinct ensures clarity.


**Without SOUL.md, Claude tends to:**

- Provide lengthy responses when brevity would suffice
- Ask questions before delivering answers
- Begin with phrases like "I'd be happy to help!" before providing useful information
- Over-apologize
- Offer theoretical possibilities instead of the most likely solution

**With SOUL.md:**


```vb
# Soul — Communication Style
## Persona
Direct, senior engineer. No preamble. No apologies. No "Great question!"
Start with the answer, then explain if needed.
## Response Defaults
- Lead with code or commands, not explanations
- Short responses unless complexity demands more
- No bullet points when prose would suffice
- Prefer "here's the fix" over "here are the possible causes"
## When I Ask for Something Ambiguous
- State your interpretation first, then proceed
- Avoid multiple clarifying questions — choose the most likely intent
- Present trade-offs, not just the solution
## Code Style in Responses
- Show diffs, not full file rewrites, for small changes
- Use the language/framework already in the file you're editing
- Match existing patterns in the codebase, don't introduce new ones
## What to Avoid
- Starting responses with "Certainly!", "Of course!", "Absolutely!"
- Restating my question back to me before answering
- Listing every possible option when I asked for a recommendation
```


The transformation is striking. A prompt for a bug fix shifts from a lengthy exploration of possibilities to a concise, targeted answer featuring functional code.


## Level 3: The Project CLAUDE.md — Shared Team Knowledge


This file is often the starting point for many users, and for good reason—it offers the highest immediate return on investment. Committed to git, it is accessible to every team member who utilizes Claude Code in your repository.


**The golden rule:** Document what Claude gets _wrong_, rather than everything it should know. Claude can deduce patterns from your codebase; CLAUDE.md is for information it _cannot_ infer.


### The Optimal Structure


```vb
# [Project Name]
## What This Project Is
One or two sentences. Claude needs enough context to make architectural decisions.
## Stack
- Runtime: Node.js 20
- Framework: Express 5
- Database: PostgreSQL 15 with Prisma ORM
- Frontend: React 18 + Vite
- Testing: Vitest + Playwright
## Commands
- `pnpm dev`       — start local dev server (port 3000)
- `pnpm test`      — run unit tests
- `pnpm test:e2e`  — run Playwright tests
- `pnpm typecheck` — TypeScript check without emit
- `pnpm db:push`   — push Prisma schema changes
## Architecture
- @docs/ARCHITECTURE.md   ← read this before touching the auth module
- @docs/API-STANDARDS.md  ← REST conventions for all new routes
## Conventions
- camelCase for variables and functions
- PascalCase for React components and TypeScript types
- kebab-case for file names
- No default exports — named exports only
- Errors must be logged before they are thrown
## What Claude Often Gets Wrong Here
- Don't use `require()` — this is ESM only
- Don't add `console.log` for debugging — use the `logger` utility in src/utils/logger.ts
- Never modify migration files — create new ones instead
- The `auth` middleware must be applied before any route handler that touches user data
## When Compacting
Preserve: list of modified files, failing tests, current task description
```


### The `@filename` Syntax — Your Secret Weapon


Instead of embedding lengthy documentation, reference it:


```vb
## Architecture
- @docs/ARCHITECTURE.md
- @docs/API-STANDARDS.md
```


Claude retrieves these files on demand and integrates their content without permanently embedding them in the file. This approach allows your existing documentation to inform Claude's knowledge without inflating token usage.

> 
>
> **❌ Don't:** Inline `@-file` docs in CLAUDE.md — this embeds the entire file during each session startup. **✅ Do:** Write "For complex usage, see `path/to/docs.md`" — Claude fetches it only when relevant.
>
>

## Level 4: CLAUDE.local.md — Your Personal Layer


This file resides at your project root but is included in `.gitignore`, rendering it invisible to your team. Utilize it for:

- Work-in-progress context ("Currently refactoring the payment module — don't touch src/billing yet")
- Local path overrides ("My local DB runs on port 5433, not 5432")
- Personal notes that would clutter the team file
- Temporary rules during a feature branch

```vb
# Local Notes (not committed)
## Current Focus
Migrating from REST to tRPC — auth routes are partially done.
Don't add new REST endpoints. All new APIs go through src/trpc/router.ts
## My Local Setup
- DB port: 5433 (non-standard)
- Redis: disabled locally, use in-memory mock
## WIP
- UserProfile component is being rewritten — don't reference the old one in src/components/UserProfileLegacy.tsx
```


## The Karpathy Rules — 220,000 Stars for a Reason


In January 2026, Andrej Karpathy (OpenAI co-founder and former Tesla AI director) shared the most significant shift in his programming workflow over two decades: transitioning from 80% manual coding to 80% agent-driven coding with Claude Code. He identified four recurring failure patterns in LLM coding behavior.


Developer Forrest Chang distilled these observations into a single `CLAUDE.md` file — `forrestchang/andrej-karpathy-skills` — which has since amassed **220,000 combined GitHub stars** and held the top position on GitHub Trending for 28 consecutive days, becoming the most-starred repository in the AI tooling ecosystem. All from a single 70-line markdown file.


The four rules are:


```vb
## Think Before Coding
Don't assume. When a request is ambiguous, state your interpretation explicitly. Surface inconsistencies. Ask rather than guess. Present trade-offs before implementing. Don't manage confusion silently.
## Simplicity First
Write the minimum code that solves the stated problem. No unrequested abstractions, no speculative features, no "flexibility" nobody asked for. If the existing code is 100 lines, don't rewrite it to 1000 lines "for maintainability."
## Surgical Changes
Edit only what is directly relevant to the task. Don't touch adjacent code, comments, or formatting. Every changed line must trace directly to the request. Preserve style, naming, and patterns in the surrounding code.
## Goal-Driven Execution
Transform vague instructions into verifiable success criteria. "Fix the bug" becomes "write a test that reproduces it, then make it pass." Loop until the success criteria are met. Don't stop at "probably works."
```


**Why did this go viral?** Every developer who utilized an AI coding agent recognized these challenges immediately. The solution is a text file that anyone can replicate in 30 seconds.


**To incorporate Karpathy's rules into your project:**


```bash
echo "" >> CLAUDE.md
curl https://raw.githubusercontent.com/forrestchang/andrej-karpathy-skills/main/CLAUDE.md >> CLAUDE.md
```


## The Optimization Rules — Lessons Learned from the Community


After examining numerous high-star repositories and Anthropic's documentation, here are the patterns that consistently differentiate effective CLAUDE.md files from ineffective ones:


### Keep It Under 300 Lines


Research indicates that LLMs can reliably follow around 150–200 instructions at most. Claude Code's built-in system prompt already consumes approximately 50 instructions. This leaves you with about 100–150 slots for additional instructions. When a CLAUDE.md file becomes too lengthy, Claude doesn't merely ignore new instructions; it starts disregarding all of them uniformly.


**The test:** For each line in your CLAUDE.md, ask yourself — _"Would removing this lead Claude to make a mistake?"_ If not, eliminate it.


### Avoid Writing a Comprehensive Manual — Document What Claude Gets Wrong


Claude can deduce your coding patterns by analyzing your codebase. Avoid documenting what it can infer. Instead, focus on the surprises: the non-standard flag, the module where the pattern diverges, or the decision that seems illogical but has a rationale.


```vb
# ❌ Unnecessary (Claude infers this from the code)
- Use async/await for asynchronous operations
- Handle errors with try/catch
# ✅ Necessary (Claude can't know this)
- Never use the `--legacy-peer-deps` flag — it masks a real dependency conflict we're tracking
- The `PaymentService` class is a singleton — never instantiate it with `new`
```


### Negative Constraints Need a Positive Alternative


An LLM instructed to "never use X" may become stuck. Instead, specify what to use.


```vb
# ❌ Claude gets stuck
- Never use --foo-bar flag
# ✅ Claude knows what to do
- Never use --foo-bar; prefer --baz instead (avoids the caching issue in CI)
```


### Customize Compaction Behavior


Long sessions can be compressed using `/compact`. Without specific instructions, Claude may lose critical context during compaction.


```vb
## When Compacting
Always preserve: list of modified files, any failing tests, current task description, and any constraints established earlier in the session.
```


### Use Hooks for Essential Actions — Not CLAUDE.md


Instructions in CLAUDE.md are advisory. Claude reads them and attempts to follow, but they can be overridden or forgotten in lengthy sessions. For actions that must occur every single time—such as running a linter or blocking secrets from commits—use hooks instead.


```bash
## In CLAUDE.md (advisory)
- Run `pnpm typecheck` when you finish editing TypeScript files
## In Hooks (deterministic — always runs)
PostToolUse: bash -c "pnpm lint --fix $CLAUDE_TOOL_INPUT_FILE"
```


## The Complete File Map — What Goes Where


```vb
~/.claude/
├── CLAUDE.md         ← Your philosophy, cross-project preferences, git style
├── SOUL.md           ← Tone, communication style, persona
└── commands/
    └── security.md   ← Personal slash commands across all projects
./                    (project root, committed to git)
├── CLAUDE.md         ← Stack, commands, conventions, architecture refs
├── CLAUDE.local.md   ← Personal notes, WIP context (gitignored)
└── .claude/
    ├── settings.json      ← Permissions, model, hooks (committed)
    ├── settings.local.json ← Local overrides (gitignored)
    └── commands/
        └── review-pr.md   ← Team slash commands
```


## Quick Start: Generate Your First CLAUDE.md


Rather than creating it from scratch, let Claude assist you.


```bash
# Inside your project folder
claude
> /init
```


The `/init` command analyzes your codebase—identifying build systems, test frameworks, and coding patterns—and generates a starter CLAUDE.md. Then, run `/memory` to review what it already knows. Only add any missing information.


After that, incorporate Karpathy's rules:


```bash
echo "" >> CLAUDE.md
curl https://raw.githubusercontent.com/forrestchang/andrej-karpathy-skills/main/CLAUDE.md >> CLAUDE.md
```


Next, create your global Soul:


```bash
touch ~/.claude/CLAUDE.md   # Your developer DNA
touch ~/.claude/SOUL.md     # Your communication style
```


The entire setup takes about 20 minutes. Afterward, each session begins with a Claude that understands who you are, how you work, and what you value.


## Treat CLAUDE.md Like Code


One crucial aspect that many overlook is maintenance. CLAUDE.md is a dynamic document. When Claude makes a mistake you've corrected multiple times, add a rule. Conversely, if a rule becomes obsolete due to changes in the codebase, remove it. Run `/memory` after several sessions to see what Claude has learned automatically—and update your file accordingly.

> 
>
> The best CLAUDE.md is not the most comprehensive one. It is the most accurate one.
>
>

_Next in the series →_ _**Week 3 — Skills: Building Reusable Slash Commands for Your Workflows**_


_References:_ [_forrestchang/andrej-karpathy-skills_](https://github.com/forrestchang/andrej-karpathy-skills) _·_ [_Anthropic Claude Code Docs_](https://code.claude.com/docs/en/best-practices) _·_ [_MuhammadUsmanGM/claude-code-best-practices_](https://github.com/MuhammadUsmanGM/claude-code-best-practices) _·_ [_seaneoliver/claude-code-starter_](https://github.com/seaneoliver/claude-code-starter)


_Part of a learning-in-public series on Claude Code_


Content is user-generated and unverified.


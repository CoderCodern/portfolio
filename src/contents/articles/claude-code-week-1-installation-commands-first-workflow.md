---
title: "Claude Code Week 1: Installation, Commands & First Workflow"
publishedDate: May 20, 2026
category: AI
poster: /articles/claude/cover.png
htmlFile: claude-code-week1-installation-blog
---

Content is user-generated and unverified.

> 
>
> **Learning in Public · Episode 01**
>
>

## From Chat to Terminal: My First Week with Claude Code


_May 2026 · 8 min read · Installation · First Commands · Real Talk_


After months of utilizing Claude in the browser—asking questions, generating code snippets, and reviewing pull requests—I finally took the plunge and installed Claude Code, a terminal-based coding assistant. I dedicated a week to exploring its capabilities, and here’s what I discovered.


## Why I Made the Switch


The repetitive cycle of copying code from a chat window to my editor, pasting error messages back, and re-explaining relevant files was becoming tedious. I had heard numerous discussions about Claude Code being fundamentally different from a chat assistant; it operates more like a junior developer that can directly access and modify your codebase.


This compelling feedback motivated me to spend a weekend setting it up.

> 
>
> **⚡ Prerequisites:** Ensure you have Node.js 18 or higher installed. You can verify this with `node --version`. Additionally, a Claude account is required; the Pro plan is recommended, as Claude Code can consume many tokens during an active session.
>
>

## Installation — Easier Than Anticipated


I expected a complicated setup involving multiple configuration files, environment variables, and possibly a Docker container. To my surprise, the installation was straightforward.


### Step 1 — Install via npm


```bash
npm install -g @anthropic-ai/claude-code
```


### Step 2 — Authenticate


Navigate to your project folder and execute `claude`. On the first run, a browser window will open for you to connect your Anthropic account. This process takes less than a minute.


```vb
cd my-project
claude
# Opens browser auth flow on first run
# ✓  Logged in as you@example.com
# ✓  Welcome to Claude Code
# >
```


### Step 3 (Optional) — VS Code Extension


To enhance your experience, consider installing the VS Code extension, which integrates Claude Code directly into the sidebar. You can find it in the marketplace by searching for _"Claude Code"_. I opted for both the terminal for extensive sessions and the VS Code panel for quick inquiries while reviewing code.

> 
>
> **✓ It just works.** No need for a `.env` file or manual API key entry. The npm global installation manages the binary, and the browser authentication seamlessly links to your existing Claude account. Total setup time: approximately three minutes.
>
>

## Daily Activities Overview


Instead of presenting a polished success narrative, I’ll share a candid account of my week, including moments of uncertainty.


| Day     | Focus                          | What Happened                                                                                                     |
| ------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Day 1–2 | Learning to Prompt Differently | Initially treated it like a chat assistant, slowly realizing I should provide goals instead of steps.             |
| Day 3   | First Real Task                | Requested a refactor of an authentication module and observed it editing six files simultaneously.                |
| Day 4   | Discovered CLAUDE.md           | Created my first project memory file, eliminating the need to re-explain my stack each session.                   |
| Day 5–7 | Built a Daily Workflow         | Established a routine with morning reviews using `/diff` and end-of-day `/compact`, creating a consistent rhythm. |


## The First "Aha" Moment


On day three, I faced a disorganized authentication module—error handling was scattered, naming conventions were inconsistent, and two functions served similar purposes. In the browser, I would have copied one file at a time, requested suggestions, and manually implemented them.


With Claude Code, I simply described the issue:


```vb
The auth module under src/auth is inconsistent.
Error handling is spread across 4 files with different
patterns. Unify it — pick the cleanest approach already
in the codebase and apply it everywhere.
```


Claude analyzed the files, identified the pattern, proposed a plan, and—upon my approval—edited all six affected files. I ran `/diff` to review every change before accepting them. This process took about 90 seconds, a task that would have taken me 45 minutes of meticulous, error-prone editing.

> 
>
> _"The shift isn't 'AI writes my code.' It's 'I describe outcomes, Claude handles the execution, I review the result.'"_
>
>

## Essential Commands I Used Daily

- **`/diff`** — Displays every file that Claude has modified during the session. Use this as a checkpoint before proceeding. Essential.
- **`/compact`** — Condenses conversation history when context becomes lengthy. Execute this before transitioning to a new phase of work within the same session.
- **`/clear`** — Initiates a completely fresh context. This differs from `/compact` and should be used when switching to a genuinely new task.
- **`/memory`** — Reveals what Claude has learned about your project autonomously. This is useful to understand what is already tracked before drafting CLAUDE.md.
- **`/help`** — Lists all available commands. Type `/` and browse—there are over 60 built-in commands.

## CLAUDE.md — A Resource I Wish I'd Known About Earlier


Each session begins with a blank context window. By day three, I was weary from re-explaining my project—the tech stack, naming conventions, and test commands.


`CLAUDE.md` is a markdown file placed in your project root. Claude automatically reads this file at the start of every session, serving as a permanent briefing document.


```vb
# My Project
## Stack
- Node.js 20, Express, PostgreSQL
- React 18 on the frontend
- Docker for local dev
## Commands
- `npm run dev`      — start local server
- `npm test`         — run test suite
- `npm run lint:fix` — fix lint errors
## Conventions
- camelCase for variables, PascalCase for components
- Errors must always be logged before being thrown
- No default exports
## Architecture
- @docs/architecture.md
- @docs/api-standards.md
```


The `@filename` syntax is particularly powerful—Claude directly imports the content of those files. Your existing documentation becomes part of Claude's knowledge base. After adding this file, my sessions transformed; Claude stopped making assumptions and began working effectively.

> 
>
> **💡 Pro tip:** Run `/memory` before drafting your CLAUDE.md. Claude may have already inferred several aspects about your project automatically. Only include information it doesn't already know—keep the file concise and informative.
>
>

## Bonus: Teaching Claude About Yourself


Transitioning to Claude Code after years of using ChatGPT felt like starting from scratch. GPT had accumulated context about my coding style, preferences, and question-asking techniques. I was concerned about losing that rapport.


Fortunately, Claude features a memory system that operates differently: it is more intentional and transparent. You control what it knows. Here’s how I rebuilt that context from the ground up.


### Step 1 — Export Your ChatGPT History (optional but beneficial)


If you're migrating from ChatGPT, navigate to **Settings → Data Controls → Export data**. This will provide you with a zip file containing `conversations.json`. You don’t need to paste all of it—just skim through for conversations where you articulated your preferences, tech stack, or working style, and extract those key details.


### Step 2 — Enable Claude's Memory


Go to **Claude Settings → Memory** and activate _"Generate memory from chat history"_. With this enabled, Claude will automatically extract facts about you during conversations—your role, preferences, and recurring patterns—and save them across sessions. You can view, edit, or delete any memory at any time, ensuring transparency.


### Step 3 — Write Your Personal Context Prompt


Don’t wait for Claude to infer everything. Provide it with a head start. Paste something like this into a new Claude conversation:


```vb
Here's context about me — please remember this:
## Who I am
- Role: [e.g. fullstack developer, 5 years experience]
- Location / timezone: [e.g. Hanoi, GMT+7]
- Current focus: learning Claude Code, building side projects
## How I like to work with AI
- Prefer direct answers over long explanations
- Show code first, explain after if needed
- I learn by doing, not by reading theory
- Casual tone is fine — no need to be formal
## My tech stack
- Daily: Node.js, React, PostgreSQL
- Exploring: agentic AI tools, Claude Code workflows
## Things I dislike
- Bullet-point overload when prose would do
- Re-explaining basics I already know
- Overly cautious hedging on technical questions
```


Claude will confirm that it has saved this context. From that point forward, it will carry that information into every conversation.


### Step 4 — Set User Preferences in Settings


Navigate to **Settings → User preferences** and write a brief paragraph there as well. This serves as a permanent baseline, loaded into every conversation before you even type anything. Consider it your standing instructions to Claude.


### Step 5 — Add a Personal Section to Your Global CLAUDE.md


For Claude Code specifically, there’s a global memory file located at `~/.claude/CLAUDE.md`—not within any project, but accessible across all of them. Add a section like this:


```vb
## About me
- Fullstack dev, prefer Node/React
- Casual communication style, direct feedback welcome
- I review all diffs before accepting — don't rush to summarize
- Vietnamese is my first language; English technical terms are fine
```

> 
>
> **The key difference from GPT:** Claude's memory is visible and editable. If it learns something incorrect about you, you can correct it directly. This level of transparency is superior to an opaque model that quietly builds a profile over time.
>
>

## Honest Friction Points


The experience wasn’t entirely seamless. I encountered a few genuine challenges:


**Context degradation is real.** During lengthy sessions, Claude may lose track of earlier decisions. The solution is to proactively run `/compact`—before you notice a decline in context, not after. I learned this the hard way after a two-hour session where Claude forgot an important constraint I had set at the beginning.


**Prompting is a skill.** A vague request like "Fix the bug" yields mediocre results. In contrast, a more specific request such as "The login function returns 200 on invalid credentials—trace it, identify the root cause, and fix it without changing the function signature" produces excellent outcomes. Goal-oriented prompts with clear constraints consistently outperform ambiguous requests.


**Always review before accepting changes.** Claude may confidently propose modifications that are subtly incorrect—not broken, but not quite right either. Using `/diff` serves as your safety net. I review every session's changes before concluding.

> 
>
> **✓ End of Week Verdict:** Claude Code has genuinely transformed my workflow. Not because it’s magical, but because it alleviates the most tedious aspects of the edit-test-review cycle. The learning curve is real but brief. By day five, it felt entirely natural.
>
>

## What Comes Next


As week one concludes with a solid foundation, my next steps involve building custom **Skills**—reusable slash commands that encapsulate my team’s workflows—and exploring **subagents** for tasks that require isolated context. The system offers much more depth than what I uncovered in my first week.


If you’re on the fence about installing it—just execute the npm command. At worst, it takes three minutes, and you may never open it again.


_Next in the series →_ _**Week 2 — CLAUDE.md, Memory & Building My First Skills**_


_Written during a week of practical use · Part of a learning-in-public series on Claude Code_


Content is user-generated and unverified.


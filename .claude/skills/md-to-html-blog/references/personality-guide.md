# Personality Injection Guide

## Minimum Requirements per Post

- **1 blockquote** — extract the single best sentence from the content
- **2 callout boxes** minimum — one tip (amber), one verdict (green)
- **1 joke or witty aside** per major section — inline `<em>` or `<p class="aside">`
- **1 compare grid** if the content has any do/don't pattern

---

## Element Types

### A. Blockquote (pull quote)

Extract the single most important sentence. Use for opinions, key insights, conclusions.
Place mid-article for rhythm.

```html
<blockquote>
  <p>"The shift isn't 'AI writes my code.' It's 'I describe outcomes,
  Claude handles the execution, I review the result.'"</p>
</blockquote>
```

### B. Callout boxes — 4 varieties

```html
<div class="callout">           <!-- amber: tips, prereqs -->
<div class="callout green">     <!-- green: verdicts, wins -->
<div class="callout red">       <!-- red: warnings, mistakes -->
```

- **💡 tip (amber)** — useful shortcut or non-obvious insight
- **✓ verdict (green)** — end-of-section positive conclusion
- **⚡ prerequisite / warning (amber)** — things to know before proceeding
- **⚠️ danger (red)** — common mistake, security issue, or footgun

### C. Jokes and witty commentary

Insert a short joke or sarcastic aside as `<em>` inside a `<p>`, or as `<p class="aside">`.

Examples of the right tone:
- After CLAUDE.md: *"Think of it as the world's most patient onboarding doc — except it actually gets read."*
- After the Karpathy 220k stars stat: *"That's more stars than most developers have commits."*
- After explaining context rot: *"Your AI just went from senior engineer to intern who forgot everything after lunch."*
- For a TDD section: *"Write the test first. Yes, really. No, not after. Before. I know. It hurts. Do it anyway."*

### D. Real quotes with attribution

```html
<blockquote>
  <p>"Write skills you'd want to use yourself."</p>
</blockquote>
<p style="text-align:center; font-size:13px; color:var(--muted); margin-top:-1rem;">
  — ECC project documentation
</p>
```

### E. Week/day grid (journey-style posts)

```html
<div class="week-grid">
  <div class="week-day">
    <div class="week-day-label">Day 1–2</div>
    <div class="week-day-title">Learning to prompt differently</div>
    <div class="week-day-desc">Treating it like a chat assistant. Wrong move.</div>
  </div>
</div>
```

### F. Comparison grids (good vs bad)

```html
<div class="compare">
  <div class="compare-col">
    <div class="compare-header bad-h">❌ What most people do</div>
    ...
  </div>
  <div class="compare-col">
    <div class="compare-header good-h">✅ What actually works</div>
    ...
  </div>
</div>
```

---

## Tone Guide

The blog's voice: *a senior developer who is direct, self-aware, and occasionally sarcastic — but always genuinely helpful.*

- ✅ Dry humor about common mistakes: *"Yes, you need the test to fail first. Yes, before you write anything. Yes, I know."*
- ✅ Exaggeration about pain points: *"Without CLAUDE.md, every session starts like Claude woke up with amnesia in a foreign country."*
- ✅ Honest admissions: *"Day one I was basically just using it as an expensive autocomplete."*
- ❌ Forced puns that don't land
- ❌ Humor that mocks the reader
- ❌ Breaking the technical credibility of the post

---

## Placement by Section Type

| Section type            | Personality element                         |
|-------------------------|---------------------------------------------|
| Installation / setup    | Joke about how you expected it to be harder |
| First use / aha moment  | Honest blockquote capturing the realization |
| Do/don't rules          | Compare grid, no prose needed               |
| Best practices list     | Callout (green verdict) at the end          |
| Warning or gotcha       | Callout (red) with a joke inside            |
| End of post             | Blockquote as closing thought               |

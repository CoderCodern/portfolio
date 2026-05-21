# Anti-Patterns

| Mistake                                          | Fix                                                       |
|--------------------------------------------------|-----------------------------------------------------------|
| Putting `<h1>` inside `<article>`                | H1 lives in `.hero` only                                  |
| Missing `.lead` class on first paragraph         | First `<p>` after `<article>` always gets `.lead`         |
| Using `<ul>` for action items                    | Use `.check-list` for checklists, `<ul>` for plain lists  |
| Forgetting dividers between h2 sections          | Every `<h2>` needs a `.divider` before it                 |
| Dry wall of text with no personality             | Add `<em>` aside or callout at minimum per section        |
| Wrong accent color for episode                   | Check episode number in `accent-colors.md`                |
| Using `color-mix()` without fallback             | Provide `rgba()` fallbacks in the gradient                |
| Splitting CSS into a separate file               | Keep all styles inline in `<style>` — single file output  |
| Italicizing technical terms in `<h1>`            | Wrap evocative phrases only — see `h1-rules.md`           |

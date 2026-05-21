# Markdown → HTML Component Map

Use this table to convert every markdown element to its HTML counterpart.

| Markdown                | HTML component              | Notes                                        |
|-------------------------|-----------------------------|----------------------------------------------|
| `# Title`               | `<h1>` in hero section      | Never inside `<article>`                     |
| `## Section`            | `<h2>`                      | Use Lora serif; always preceded by `.divider`|
| `### Subsection`        | `<h3>`                      | Uppercase, accent colored                    |
| `` `code` ``            | `<code>` inline             | Accent colored pill                          |
| ```` ```lang ``` ````   | `.code-block` with header   | Include dots + lang label                    |
| `> blockquote`          | `<blockquote>` or `.callout`| See personality guide for rules              |
| `**bold**`              | `<strong>`                  |                                              |
| Table                   | `.table-wrap > table`       | First `td` gets mono accent style            |
| `---` divider           | `.divider` with span label  | Extract label from surrounding context       |
| Folder tree code block  | `.code-block` lang `tree`   | Keep tree characters verbatim                |
| Unordered list          | `<ul>` or `.check-list`     | Use `.check-list` for action items           |
| Series link at top      | `.series-tag` pill in hero  |                                              |
| "Next in series" at end | `.next-post` card           |                                              |

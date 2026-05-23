#!/usr/bin/env node
/**
 * Assembles a full HTML blog post from the base template + article data file.
 *
 * Usage (run from project root):
 *   node .claude/skills/md-to-html-blog/scripts/assemble.js <slug>
 *
 * Reads:   src/contents/articles/html/<slug>.data
 *          src/contents/articles/<slug>.md  (for code block passthrough)
 * Writes:  src/contents/articles/html/<slug>.html
 * Deletes: the .data file after successful assembly
 *
 * Data file format:
 *   KEY: value          <- one per line, colon-delimited
 *   ---CONTENT---       <- separator line
 *   <html or shorthand> <- everything after becomes CONVERTED_CONTENT
 *
 * Shorthand tags supported in CONVERTED_CONTENT:
 *   [code:N]                    → code block #N pulled verbatim from the markdown file
 *   [code:lang]...[/code]       → styled .code-block with dots + lang label (Claude-written)
 *   [tip]...[/tip]              → amber callout
 *   [verdict]...[/verdict]      → green callout
 *   [warn]...[/warn]            → red callout
 *   [aside]...[/aside]          → <p class="aside"><em>...</em></p>
 *   [bq]...[/bq]                → <blockquote><p>...</p></blockquote>
 *   [list]\nitem\nitem\n[/list] → <ul class="check-list">
 *   [cmp]\nbad: H|i1\ngood: H|i1\n[/cmp] → .compare grid
 */

import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHighlighter } from 'shiki';

const __dir = dirname(fileURLToPath(import.meta.url));
const [,, slug] = process.argv;

if (!slug) {
  console.error('Usage: node .claude/skills/md-to-html-blog/scripts/assemble.js <slug>');
  process.exit(1);
}

const templatePath = resolve(__dir, '../templates/base.html');
const dataPath     = resolve(process.cwd(), `src/contents/articles/html/${slug}.data`);
const mdPath       = resolve(process.cwd(), `src/contents/articles/${slug}.md`);
const outPath      = resolve(process.cwd(), `src/contents/articles/html/${slug}.html`);

const raw = readFileSync(dataPath, 'utf8');
const dataBytes = raw.length;
const sep = raw.indexOf('\n---CONTENT---\n');

if (sep === -1) {
  console.error('Error: missing ---CONTENT--- separator in data file');
  process.exit(1);
}

// Extract fenced code blocks from the markdown source (skip frontmatter)
function extractMdCodeBlocks(mdContent) {
  let body = mdContent;
  if (mdContent.startsWith('---')) {
    const fmEnd = mdContent.indexOf('\n---', 3);
    if (fmEnd !== -1) body = mdContent.slice(fmEnd + 4);
  }
  const blocks = [];
  const re = /```(\w*)\r?\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    blocks.push({ lang: m[1] || 'text', content: m[2] });
  }
  return blocks;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// All lang identifiers that may appear in markdown fences — includes full names and aliases
const KNOWN_LANGS = new Set([
  'ts', 'typescript', 'tsx',
  'js', 'javascript', 'jsx',
  'bash', 'sh', 'shell', 'zsh',
  'json', 'jsonc',
  'html', 'css', 'scss', 'sass',
  'svelte', 'vue',
  'markdown', 'md',
  'yaml', 'yml',
  'sql',
  'csharp', 'cs',
  'go',
  'python', 'py',
  'rust',
  'toml', 'graphql', 'diff', 'text', 'plaintext',
  'xml', 'dockerfile',
]);

function stripBg(out) {
  return out.replace(/(<pre\b[^>]*?)style="([^"]*)"/, (_, tag, style) => {
    const cleaned = style.split(';')
      .filter(s => !s.trim().startsWith('background-color'))
      .join(';').trim().replace(/;$/, '');
    return cleaned ? `${tag}style="${cleaned}"` : tag;
  });
}

const mdCodeBlocks = existsSync(mdPath) ? extractMdCodeBlocks(readFileSync(mdPath, 'utf8')) : [];

// Collect every lang this article needs, then load them all at once.
// createHighlighter makes codeToHtml synchronous — no race condition on concurrent calls.
const dataContent = raw.slice(sep + 15);
const inlineLangs = [...dataContent.matchAll(/\[code:([a-z]+)\]/gi)].map(m => m[1]);
const neededLangs = [...new Set([
  ...mdCodeBlocks.map(b => b.lang),
  ...inlineLangs,
  'text',
])].filter(l => KNOWN_LANGS.has(l));

const highlighter = await createHighlighter({ themes: ['nord'], langs: neededLangs });

function highlight(lang, rawContent) {
  const safeLang = KNOWN_LANGS.has(lang) ? lang : 'text';
  try {
    return stripBg(highlighter.codeToHtml(rawContent.trim(), { lang: safeLang, theme: 'nord' }));
  } catch {
    return `<pre><code>${escapeHtml(rawContent.trim())}</code></pre>`;
  }
}

function makeCodeBlock(lang, rawContent) {
  const inner = highlight(lang, rawContent);
  return `<div class="code-block">\n  <div class="code-header">\n    <div class="code-dots"><span></span><span></span><span></span></div>\n    <span class="code-lang">${lang}</span>\n  </div>\n  ${inner}\n</div>`;
}

function expandShorthand(content) {
  // [code:N] — passthrough from markdown
  content = content.replace(/\[code:(\d+)\]/g, (_, n) => {
    const idx = Number.parseInt(n) - 1;
    const block = mdCodeBlocks[idx];
    if (!block) {
      console.warn(`  ⚠ [code:${n}] not found — markdown has ${mdCodeBlocks.length} code block(s)`);
      return `<!-- [code:${n}] not found -->`;
    }
    return makeCodeBlock(block.lang, block.content);
  });

  // [code:lang]...[/code] — Claude-written code block
  content = content.replace(/\[code:([^\]]+)\]([\s\S]*?)\[\/code\]/g, (_, lang, code) =>
    makeCodeBlock(lang, code)
  );

  // [cmp]\nbad: Header|item1|item2\ngood: Header|item1|item2\n[/cmp]
  content = content.replace(/\[cmp\]([\s\S]*?)\[\/cmp\]/g, (_, body) => {
    let badH = '', goodH = '', badItems = [], goodItems = [];
    for (const line of body.trim().split('\n').filter(l => l.trim())) {
      const ci = line.indexOf(':');
      if (ci === -1) continue;
      const side = line.slice(0, ci).trim();
      const parts = line.slice(ci + 1).split('|').map(p => p.trim());
      if (side === 'bad')  { badH  = parts[0]; badItems  = parts.slice(1); }
      if (side === 'good') { goodH = parts[0]; goodItems = parts.slice(1); }
    }
    const bi = badItems.map(i  => `    <div class="compare-item bad-t">${i}</div>`).join('\n');
    const gi = goodItems.map(i => `    <div class="compare-item good-t">${i}</div>`).join('\n');
    return `<div class="compare">\n  <div class="compare-col">\n    <div class="compare-header bad-h">${badH}</div>\n${bi}\n  </div>\n  <div class="compare-col">\n    <div class="compare-header good-h">${goodH}</div>\n${gi}\n  </div>\n</div>`;
  });

  // [list]\nitem\nitem\n[/list]
  content = content.replace(/\[list\]([\s\S]*?)\[\/list\]/g, (_, items) => {
    const lis = items.trim().split('\n').filter(l => l.trim())
      .map(l => `  <li>${l.trim()}</li>`).join('\n');
    return `<ul class="check-list">\n${lis}\n</ul>`;
  });

  // Inline/short tags
  content = content.replace(/\[tip\]([\s\S]*?)\[\/tip\]/g,        (_, t) => `<div class="callout"><div class="callout-label">💡 Tip</div><p>${t.trim()}</p></div>`);
  content = content.replace(/\[verdict\]([\s\S]*?)\[\/verdict\]/g, (_, t) => `<div class="callout green"><div class="callout-label">✓ Verdict</div><p>${t.trim()}</p></div>`);
  content = content.replace(/\[warn\]([\s\S]*?)\[\/warn\]/g,       (_, t) => `<div class="callout red"><div class="callout-label">⚠️ Warning</div><p>${t.trim()}</p></div>`);
  content = content.replace(/\[aside\]([\s\S]*?)\[\/aside\]/g,     (_, t) => `<p class="aside"><em>${t.trim()}</em></p>`);
  content = content.replace(/\[bq\]([\s\S]*?)\[\/bq\]/g,           (_, t) => `<blockquote><p>${t.trim()}</p></blockquote>`);

  return content;
}

const vars = Object.fromEntries(
  raw.slice(0, sep).trim().split('\n')
    .filter(line => line.includes(':'))
    .map(line => {
      const i = line.indexOf(':');
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    })
);
vars.CONVERTED_CONTENT = expandShorthand(raw.slice(sep + 15).trim());

let html = readFileSync(templatePath, 'utf8');
for (const [key, val] of Object.entries(vars)) {
  html = html.split(`{{${key}}}`).join(val || '');
}

writeFileSync(outPath, html);
unlinkSync(dataPath);

const outPath_ = outPath.replace(process.cwd() + '\\', '').replace(process.cwd() + '/', '');
const passthroughNote = mdCodeBlocks.length ? ` (${mdCodeBlocks.length} md code blocks available)` : '';
console.log(`✓  ${outPath_}`);
console.log(`   data: ${dataBytes}B (${Math.round(dataBytes/4)} est. tokens) → html: ${html.length}B${passthroughNote}`);

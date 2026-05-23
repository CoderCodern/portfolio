#!/usr/bin/env node
/**
 * Re-highlights all existing .html blog files with the current Shiki theme.
 * Run whenever the theme in assemble.js changes.
 *
 * Usage (from project root):
 *   node .claude/skills/md-to-html-blog/scripts/retheme.js
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';
import { createHighlighter } from 'shiki';

const THEME   = 'nord';
const htmlDir = resolve(process.cwd(), 'src/contents/articles/html');

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

function unescapeHtml(str) {
  return str
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'");
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '');
}

function stripBg(out) {
  return out.replace(/(<pre\b[^>]*?)style="([^"]*)"/, (_, tag, style) => {
    const cleaned = style.split(';')
      .filter(s => !s.trim().startsWith('background-color'))
      .join(';').trim().replace(/;$/, '');
    return cleaned ? `${tag}style="${cleaned}"` : tag;
  });
}

// Scan all HTML files for every language used so we load them all upfront.
const htmlFiles = readdirSync(htmlDir).filter(f => f.endsWith('.html'));
const allLangs  = new Set(['text']);

for (const file of htmlFiles) {
  const html = readFileSync(join(htmlDir, file), 'utf8');
  for (const [, lang] of html.matchAll(/<span class="code-lang">([^<]+)<\/span>/g)) {
    if (KNOWN_LANGS.has(lang.trim())) allLangs.add(lang.trim());
  }
}

const highlighter = await createHighlighter({ themes: [THEME], langs: [...allLangs] });

function rehighlight(lang, innerHtml) {
  const plainCode = unescapeHtml(stripTags(innerHtml)).trim();
  const safeLang  = KNOWN_LANGS.has(lang) ? lang : 'text';
  try {
    return stripBg(highlighter.codeToHtml(plainCode, { lang: safeLang, theme: THEME }));
  } catch {
    return `<pre><code>${innerHtml}</code></pre>`;
  }
}

// Pattern: capture (lang-span)(gap)(full pre block)(closing </div>)
// The non-greedy pre match stops at the first </pre>, which is always the right one
// because nothing nests inside <pre> in Shiki output.
const RE = /(<span class="code-lang">([^<]+)<\/span>)([\s\S]*?)(<pre[\s\S]*?<\/pre>)(\s*<\/div>)/g;

let totalFiles = 0;
let totalBlocks = 0;

for (const file of htmlFiles) {
  const filePath = join(htmlDir, file);
  const original = readFileSync(filePath, 'utf8');
  let blockCount = 0;

  const updated = original.replace(RE, (_, langSpan, lang, gap, preBlock, closing) => {
    const codeMatch = preBlock.match(/<code[^>]*>([\s\S]*?)<\/code>/);
    if (!codeMatch) return _;
    const newPre = rehighlight(lang.trim(), codeMatch[1]);
    blockCount++;
    return `${langSpan}${gap}${newPre}${closing}`;
  });

  if (updated !== original) {
    writeFileSync(filePath, updated);
    console.log(`  ✓ ${file}  (${blockCount} block${blockCount !== 1 ? 's' : ''})`);
    totalFiles++;
    totalBlocks += blockCount;
  } else {
    console.log(`  - ${file}  (no code blocks or already up to date)`);
  }
}

console.log(`\nDone. ${totalFiles} file(s) updated, ${totalBlocks} block(s) rehighlighted → theme: '${THEME}'`);

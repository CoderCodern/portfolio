#!/usr/bin/env node
/**
 * Renames a blog playlist (series) across all .md and .html files.
 *
 * Usage (run from project root):
 *   node .claude/skills/rename-blog-playlist/scripts/rename.js --from="Old Name" --to="New Name"
 *
 * Updates per matched article:
 *   1. Frontmatter `series:` field in the .md file
 *   2. Inline `**Old Name · Episode NN**` tags in the .md body
 *   3. `<div class="series-tag">Old Name · Episode NN</div>` in the linked .html file
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { resolve, join } from 'path';

const args = process.argv.slice(2);

const root    = process.cwd();
const mdDir   = resolve(root, 'src/contents/articles');
const htmlDir = resolve(root, 'src/contents/articles/html');

// --list mode: print all unique series with article counts and exit
if (args.includes('--list')) {
  const counts = new Map();
  const files = readdirSync(mdDir).filter((f) => f.endsWith('.md'));

  for (const filename of files) {
    const content = readFileSync(join(mdDir, filename), 'utf8');
    if (!content.startsWith('---')) continue;
    const fmEnd = content.indexOf('\n---', 3);
    if (fmEnd === -1) continue;
    const fmText = content.slice(4, fmEnd);
    const m = fmText.match(/^series:\s*(.+)$/m);
    if (!m) continue;
    const name = m[1].trim();
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  if (counts.size === 0) {
    console.log('No playlists found.');
  } else {
    console.log(`Available playlists (${counts.size}):\n`);
    for (const [name, count] of counts) {
      const label = `"${name}"`;
      console.log(`  ${label.padEnd(30)} ${count} article${count !== 1 ? 's' : ''}`);
    }
  }
  process.exit(0);
}

const fromArg = args.find((a) => a.startsWith('--from='));
const toArg   = args.find((a) => a.startsWith('--to='));

if (!fromArg || !toArg) {
  console.error('Usage:');
  console.error('  rename.js --list');
  console.error('  rename.js --from="Old Name" --to="New Name"');
  process.exit(1);
}

const fromName = fromArg.slice('--from='.length).replace(/^["']|["']$/g, '');
const toName   = toArg.slice('--to='.length).replace(/^["']|["']$/g, '');

if (fromName === toName) {
  console.error('Error: --from and --to are the same.');
  process.exit(1);
}

console.log(`Renaming playlist: "${fromName}" → "${toName}"\n`);

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const mdFiles = readdirSync(mdDir).filter((f) => f.endsWith('.md'));

let mdUpdated   = 0;
let htmlUpdated = 0;

for (const filename of mdFiles) {
  const mdPath = join(mdDir, filename);
  const content = readFileSync(mdPath, 'utf8');

  // Only process files with YAML frontmatter
  if (!content.startsWith('---')) continue;
  const fmEnd = content.indexOf('\n---', 3);
  if (fmEnd === -1) continue;

  const fmText = content.slice(4, fmEnd); // key-value lines between the two ---

  // Check series: field
  const seriesMatch = fmText.match(/^series:\s*(.+)$/m);
  if (!seriesMatch || seriesMatch[1].trim() !== fromName) continue;

  // Extract htmlFile slug for the paired html update
  const htmlFileMatch = fmText.match(/^htmlFile:\s*(.+)$/m);
  const htmlSlug = htmlFileMatch?.[1].trim();

  // 1 & 2 — Update md: frontmatter series field + body episode tags
  const updatedMd = content
    .replace(
      new RegExp(`(^|\\n)(series: )${escapeRegex(fromName)}(\\n)`, 'm'),
      `$1$2${toName}$3`,
    )
    .replace(
      new RegExp(`\\*\\*${escapeRegex(fromName)} · Episode`, 'g'),
      `**${toName} · Episode`,
    );

  if (updatedMd !== content) {
    writeFileSync(mdPath, updatedMd);
    console.log(`  ✓ md   ${filename}`);
    mdUpdated++;
  }

  // 3 — Update paired html file series-tag
  if (htmlSlug) {
    const htmlPath = join(htmlDir, `${htmlSlug}.html`);
    if (!existsSync(htmlPath)) {
      console.log(`  ⚠ html not found: ${htmlSlug}.html (skipped)`);
      continue;
    }

    const htmlContent = readFileSync(htmlPath, 'utf8');
    const updatedHtml = htmlContent.replace(
      new RegExp(
        `(<div class="series-tag">)${escapeRegex(fromName)}( · Episode)`,
        'g',
      ),
      `$1${toName}$2`,
    );

    if (updatedHtml !== htmlContent) {
      writeFileSync(htmlPath, updatedHtml);
      console.log(`  ✓ html ${htmlSlug}.html`);
      htmlUpdated++;
    }
  }
}

if (mdUpdated === 0) {
  console.log(`No articles found with series: "${fromName}".`);
} else {
  console.log(`\nDone. ${mdUpdated} md file(s), ${htmlUpdated} html file(s) updated.`);
}

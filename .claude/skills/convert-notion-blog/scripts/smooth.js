#!/usr/bin/env node
/**
 * AI-powered polisher for local article .md files.
 * Pass 1: detects programming languages for untagged code fences.
 * Pass 2: refines article body for clarity, tone, and originality.
 *
 * Usage (run from project root):
 *   node --env-file=.env .claude/skills/convert-notion-blog/scripts/smooth.js --file=src/contents/articles/my-article.md
 *   node --env-file=.env .claude/skills/convert-notion-blog/scripts/smooth.js --file=... --dry-run
 *   node --env-file=.env .claude/skills/convert-notion-blog/scripts/smooth.js --all
 *   node --env-file=.env .claude/skills/convert-notion-blog/scripts/smooth.js --all --dry-run
 */

import fs from 'fs/promises';
import path from 'path';
import { detectCodeLanguages, refineContent, createOpenAIClient } from './ai.js';

const ARTICLES_DIR = path.resolve('src/contents/articles');

const args = process.argv.slice(2);
const smoothAll = args.includes('--all');
const dryRun = args.includes('--dry-run');
const fileArg = args.find((a) => a.startsWith('--file='));
const targetFile = fileArg ? fileArg.replace('--file=', '') : null;

if (!smoothAll && !targetFile) {
  console.error('Usage: smooth.js --file=<path> | --all [--dry-run]');
  process.exit(1);
}

const openai = createOpenAIClient();
if (!openai) {
  console.error('Error: OPENAI_API_KEY must be set in .env');
  process.exit(1);
}

/**
 * Splits a .md file into frontmatter and body.
 * Returns { frontmatter: string, body: string }
 */
function splitFrontmatter(content) {
  const match = content.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
  if (match) return { frontmatter: match[1], body: match[2] };
  return { frontmatter: '', body: content };
}

function wordCount(text) {
  return text.trim().split(/\s+/).length;
}

async function smoothFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const { frontmatter, body } = splitFrontmatter(content);
  const filename = path.basename(filePath);

  console.log(`\n--- ${filePath} ---`);

  // Pass 1: language detection
  const { markdown: langTagged, changes: langChanges } = await detectCodeLanguages(body, openai);

  if (langChanges.length === 0) {
    console.log('[Pass 1] No untagged code blocks found.');
  } else {
    console.log(`[Pass 1] Code language detection (${langChanges.length} block(s)):`);
    langChanges.forEach((c, i) => console.log(`  Block ${i + 1}: (untagged) → ${c.detected}`));
  }

  // Pass 2: content refinement
  const before = wordCount(langTagged);
  const refined = await refineContent(langTagged, openai);
  const after = wordCount(refined);
  console.log(`[Pass 2] Content refinement: ${before} → ${after} words`);

  if (dryRun) {
    console.log('\nDry run — no files written. Run without --dry-run to apply.');
    return { written: false, filename };
  }

  const updated = frontmatter + refined;
  await fs.writeFile(filePath, updated, 'utf-8');
  console.log(`  smooth ${filename}  (${langChanges.length} block(s) tagged, content refined)`);
  return { written: true, filename };
}

async function main() {
  let files = [];

  if (smoothAll) {
    const entries = await fs.readdir(ARTICLES_DIR);
    files = entries
      .filter((f) => f.endsWith('.md'))
      .map((f) => path.join(ARTICLES_DIR, f));
  } else {
    files = [path.resolve(targetFile)];
  }

  if (files.length === 0) {
    console.log('No .md files found.');
    return;
  }

  let written = 0;
  let skipped = 0;

  for (const filePath of files) {
    try {
      const result = await smoothFile(filePath);
      if (result.written) written++;
      else skipped++;
    } catch (err) {
      console.error(`  error ${path.basename(filePath)}  ${err.message}`);
    }
  }

  console.log(`\nDone. ${written} smoothed, ${skipped} dry-run.`);
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});

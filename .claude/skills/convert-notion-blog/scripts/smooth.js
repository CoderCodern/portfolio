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
import { detectCodeLanguages, refineContent, generateDescription, detectCategory, createOpenAIClient } from './ai.js';

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

/** Reads a single scalar value from a frontmatter string by key. */
function getFrontmatterField(fm, key) {
  const match = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  if (!match) return null;
  let v = match[1].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
    v = v.slice(1, -1);
  return v;
}

/** Appends a key: value line to frontmatter, before the closing ---. */
function addFrontmatterField(fm, key, value) {
  const needsQuotes = /[:#,[\]{}&*!|>'"@`]/.test(value) || value !== value.trim();
  const line = needsQuotes ? `${key}: "${value.replace(/"/g, '\\"')}"` : `${key}: ${value}`;
  return fm.replace(/\n---\n$/, `\n${line}\n---\n`);
}

/**
 * Strips boilerplate injected by Claude artifact exports:
 * - "Content is user-generated and unverified." line
 * - Leading blank lines after frontmatter
 */
function stripArtifactBoilerplate(body) {
  return body
    .replace(/^Content is user-generated and unverified\.\s*\n*/m, '')
    .replace(/^\n{2,}/, '\n');
}

function wordCount(text) {
  return text.trim().split(/\s+/).length;
}

async function smoothFile(filePath) {
  let content = await fs.readFile(filePath, 'utf-8');
  let { frontmatter, body } = splitFrontmatter(content);
  const filename = path.basename(filePath);

  console.log(`\n--- ${filePath} ---`);

  // Pass 0: frontmatter normalization
  const pass0Changes = [];

  // Strip artifact boilerplate from body
  const cleanedBody = stripArtifactBoilerplate(body);
  if (cleanedBody !== body) {
    pass0Changes.push('stripped artifact boilerplate');
    body = cleanedBody;
  }

  // Generate description if missing
  if (!getFrontmatterField(frontmatter, 'description')) {
    const title = getFrontmatterField(frontmatter, 'title') ?? filename;
    const description = await generateDescription(title, body, openai);
    frontmatter = addFrontmatterField(frontmatter, 'description', description);
    pass0Changes.push(`description generated: "${description}"`);
  }

  // Detect category if missing
  if (!getFrontmatterField(frontmatter, 'category')) {
    const title = getFrontmatterField(frontmatter, 'title') ?? filename;
    const description = getFrontmatterField(frontmatter, 'description') ?? '';
    const category = await detectCategory(title, description, body, openai);
    frontmatter = addFrontmatterField(frontmatter, 'category', category);
    pass0Changes.push(`category detected: ${category}`);
  }

  if (pass0Changes.length === 0) {
    console.log('[Pass 0] Frontmatter OK — no normalization needed.');
  } else {
    console.log(`[Pass 0] Frontmatter normalized (${pass0Changes.length} fix(es)):`);
    pass0Changes.forEach((c) => console.log(`  ${c}`));
  }

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
  const normNote = pass0Changes.length > 0 ? `, ${pass0Changes.length} frontmatter fix(es)` : '';
  console.log(`  smooth ${filename}  (${langChanges.length} block(s) tagged, content refined${normNote})`);
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

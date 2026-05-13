#!/usr/bin/env node
/**
 * Migrates Notion articles to src/contents/articles/{slug}.md
 * Filenames are derived from article titles, not Notion page IDs.
 *
 * Usage (run from project root):
 *   node --env-file=.env .claude/skills/convert-notion-blog/scripts/migrate.js --all
 *   node --env-file=.env .claude/skills/convert-notion-blog/scripts/migrate.js --ids=slug1,slug2
 *   node --env-file=.env .claude/skills/convert-notion-blog/scripts/migrate.js --all --force
 */

import { Client, isFullPage } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import fs from 'fs/promises';
import path from 'path';

const token = process.env.NOTION_TOKEN;
const databaseId = process.env.NOTION_DATABASE_ID;

if (!token || !databaseId) {
  console.error('Error: NOTION_TOKEN and NOTION_DATABASE_ID must be set in .env');
  process.exit(1);
}

const args = process.argv.slice(2);
const migrateAll = args.includes('--all');
const force = args.includes('--force');
const idsArg = args.find((a) => a.startsWith('--ids='));
const selectedSlugs = idsArg ? idsArg.replace('--ids=', '').split(',').filter(Boolean) : [];

if (!migrateAll && selectedSlugs.length === 0) {
  console.error('Usage: migrate.js --all | --ids=slug1,slug2 [--force]');
  process.exit(1);
}

const OUTPUT_DIR = path.resolve('src/contents/articles');

const notion = new Client({ auth: token });
const n2m = new NotionToMarkdown({ notionClient: notion });

function titleToSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

function extractMeta(page) {
  const props = page.properties;

  const title =
    props['Name']?.type === 'title'
      ? (props['Name'].title[0]?.plain_text ?? 'Untitled')
      : 'Untitled';

  const description =
    props['Description']?.type === 'rich_text'
      ? (props['Description'].rich_text[0]?.plain_text ?? '')
      : props['AI custom autofill']?.type === 'rich_text'
        ? (props['AI custom autofill'].rich_text[0]?.plain_text ?? '')
        : '';

  const rawDate =
    props['Published']?.type === 'date'
      ? (props['Published'].date?.start ?? '')
      : '';

  const publishedDate = rawDate
    ? new Date(rawDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const poster =
    page.cover?.type === 'external'
      ? page.cover.external.url
      : page.cover?.type === 'file'
        ? page.cover.file.url
        : '';

  const slug = titleToSlug(title);
  const notionId = page.id; // UUID with dashes, used for Notion API calls

  return { slug, notionId, title, description, publishedDate, poster };
}

function buildFrontmatter(meta) {
  const lines = ['---', `title: "${meta.title.replace(/"/g, '\\"')}"`];
  if (meta.description) lines.push(`description: "${meta.description.replace(/"/g, '\\"')}"`);
  if (meta.publishedDate) lines.push(`publishedDate: ${meta.publishedDate}`);
  if (meta.poster) lines.push(`poster: ${meta.poster}`);
  lines.push('---', '');
  return lines.join('\n');
}

/**
 * Cleans markdown produced by notion-to-md:
 * - Strips leading 4-space groups added for nested Notion blocks (prevents
 *   them being misinterpreted as code blocks by the markdown renderer).
 * - Replaces URL-encoded or URL-like image alt text with an empty string.
 */
function cleanMarkdown(content) {
  let inFence = false;
  return content
    .split('\n')
    .map((line) => {
      if (/^\s*```/.test(line)) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;

      // Clean image alt text when it looks like a URL or URL-encoded string
      line = line.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => {
        const isUrlLike = alt.startsWith('http') || alt.includes('%2F') || alt.includes('%3A');
        return `![${isUrlLike ? '' : alt}](${url})`;
      });

      // Strip leading groups of 4 spaces (notion-to-md indents nested blocks)
      line = line.replace(/^( {4})+/, '');

      return line;
    })
    .join('\n');
}

async function fetchContent(notionId) {
  const mdBlocks = await n2m.pageToMarkdown(notionId);
  const { parent: markdown } = n2m.toMarkdownString(mdBlocks);
  return cleanMarkdown(markdown);
}

async function migrate() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const response = await notion.databases.query({
    database_id: databaseId,
    filter: { property: 'Published', date: { is_not_empty: true } },
    sorts: [{ property: 'Published', direction: 'descending' }],
  });

  let pages = response.results.filter(isFullPage);

  if (!migrateAll) {
    pages = pages.filter((p) => {
      const meta = extractMeta(p);
      return selectedSlugs.includes(meta.slug);
    });
    const foundSlugs = pages.map((p) => extractMeta(p).slug);
    const notFound = selectedSlugs.filter((s) => !foundSlugs.includes(s));
    if (notFound.length > 0) {
      console.warn(`Warning: these slugs were not found in Notion: ${notFound.join(', ')}`);
    }
  }

  if (pages.length === 0) {
    console.log('No matching articles found.');
    return;
  }

  let written = 0;
  let skipped = 0;
  let failed = 0;

  for (const page of pages) {
    const meta = extractMeta(page);
    const filePath = path.join(OUTPUT_DIR, `${meta.slug}.md`);

    try {
      const exists = await fs.access(filePath).then(() => true).catch(() => false);

      if (exists && !force) {
        console.log(`  skip  ${meta.slug}.md  (already exists — use --force to overwrite)`);
        skipped++;
        continue;
      }

      const content = await fetchContent(meta.notionId);
      const fileContent = buildFrontmatter(meta) + content;

      await fs.writeFile(filePath, fileContent, 'utf-8');
      console.log(`  write ${meta.slug}.md  "${meta.title}"`);
      written++;
    } catch (err) {
      console.error(`  error ${meta.slug}.md  ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. ${written} written, ${skipped} skipped, ${failed} failed.`);
  console.log(`Output: ${OUTPUT_DIR}`);
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});

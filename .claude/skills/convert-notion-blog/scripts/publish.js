#!/usr/bin/env node
/**
 * Publishes a smoothed markdown file to Notion and saves it locally.
 * Takes pre-smoothed content so it can be run independently of write.js.
 * Prints a single JSON line to stdout for the orchestrator to capture.
 * Progress messages go to stderr.
 *
 * Usage (run from project root):
 *   node --env-file=.env .claude/skills/convert-notion-blog/scripts/publish.js \
 *     --file=.claude/tmp/blog-smoothed.md \
 *     --title="My Article Title" \
 *     --slug=my-article-title \
 *     --url=https://original-source-url \
 *     [--image=https://cover-image-url] \
 *     [--published=2026-05-22]
 */

import { Client } from '@notionhq/client';
import { markdownToBlocks } from '@tryfabric/martian';
import { readFileSync, writeFileSync, mkdirSync, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { resolve } from 'path';
import {
  generateThumbnail,
  detectCategory,
  createOpenAIClient,
  resetTokenUsage,
  formatTokenReport,
} from './ai.js';

const token = process.env.NOTION_TOKEN;
const databaseId = process.env.NOTION_DATABASE_ID;

if (!token || !databaseId) {
  console.error('Error: NOTION_TOKEN and NOTION_DATABASE_ID must be set in .env');
  process.exit(1);
}

const args = process.argv.slice(2);
function getArg(prefix) {
  return args.find((a) => a.startsWith(prefix))?.slice(prefix.length) ?? '';
}

const filePath = getArg('--file=');
const title = getArg('--title=');
const slug = getArg('--slug=');
const originalUrl = getArg('--url=');
let coverImage = getArg('--image=');
const publishedStr = getArg('--published=');

if (!filePath || !title || !slug) {
  console.error(
    'Usage: publish.js --file=<path> --title=<title> --slug=<slug> [--url=...] [--image=...] [--published=...]',
  );
  process.exit(1);
}

const notion = new Client({ auth: token });

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

function sanitizeTableBlocks(blocks) {
  return blocks.map((block) => {
    if (block.type !== 'table') return block;
    const rows = block.table?.children ?? [];
    if (!rows.length) return block;
    const tableWidth = Math.max(1, rows[0]?.table_row?.cells?.length ?? 1);
    const sanitizedRows = rows.map((row) => {
      if (row.type !== 'table_row') return row;
      const cells = row.table_row?.cells ?? [];
      const padded = [...cells];
      while (padded.length < tableWidth) padded.push([]);
      return { ...row, table_row: { ...row.table_row, cells: padded.slice(0, tableWidth) } };
    });
    return {
      ...block,
      table: { ...block.table, table_width: tableWidth, children: sanitizedRows },
    };
  });
}

async function downloadImage(imageUrl, imageSlug) {
  const dir = resolve(`static/articles/${imageSlug}`);
  mkdirSync(dir, { recursive: true });
  const dest = resolve(dir, 'cover.png');
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await pipeline(res.body, createWriteStream(dest));
  return `/articles/${imageSlug}/cover.png`;
}

async function createNotionPage(markdown, imageUrl) {
  let blocks;
  try {
    blocks = sanitizeTableBlocks(markdownToBlocks(markdown));
  } catch {
    blocks = markdown
      .split(/\n\n+/)
      .filter(Boolean)
      .map((text) => ({
        type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: text.slice(0, 2000) } }] },
      }));
  }

  const publishedDate = publishedStr
    ? new Date(publishedStr).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const properties = {
    Name: { title: [{ text: { content: title.slice(0, 2000) } }] },
    Published: { date: { start: publishedDate } },
  };
  if (originalUrl) properties['URL'] = { url: originalUrl };

  const [firstChunk, ...rest] = chunkArray(blocks, 100);
  const payload = {
    parent: { database_id: databaseId },
    properties,
    children: firstChunk ?? [],
  };
  if (imageUrl) payload.cover = { type: 'external', external: { url: imageUrl } };

  const page = await notion.pages.create(payload);
  for (const chunk of rest) {
    await notion.blocks.children.append({ block_id: page.id, children: chunk });
  }
  return page;
}

function buildFrontmatter(fields) {
  const lines = ['---', `title: "${fields.title.replace(/"/g, '\\"')}"`];
  if (fields.description) lines.push(`description: "${fields.description.replace(/"/g, '\\"')}"`);
  if (fields.publishedDate) lines.push(`publishedDate: ${fields.publishedDate}`);
  if (fields.category) lines.push(`category: ${fields.category}`);
  if (fields.poster) lines.push(`poster: ${fields.poster}`);
  lines.push('---', '');
  return lines.join('\n');
}

async function main() {
  resetTokenUsage();
  const smoothedMarkdown = readFileSync(resolve(filePath), 'utf-8');
  const openai = createOpenAIClient();

  // Detect category
  let category = '';
  if (openai) {
    try {
      category = await detectCategory(title, '', smoothedMarkdown, openai);
      console.error(`Category: ${category}`);
    } catch {
      // non-fatal
    }
  }

  // Generate thumbnail via DALL-E (non-fatal if unavailable)
  let localCoverPath = '';
  if (openai) {
    try {
      console.error('Generating thumbnail...');
      const dalleUrl = await generateThumbnail(title, '', openai);
      localCoverPath = await downloadImage(dalleUrl, slug);
      coverImage = dalleUrl;
      console.error(`Thumbnail: ${localCoverPath}`);
    } catch (err) {
      console.error(`  (thumbnail skipped: ${err.message})`);
    }
  }

  // Create Notion page
  console.error('Creating Notion page...');
  const page = await createNotionPage(smoothedMarkdown, coverImage || null);
  const notionUrl = `https://notion.so/${page.id.replace(/-/g, '')}`;
  console.error(`Notion:  ${notionUrl}`);

  // Save local .md file directly — no round-trip through Notion needed
  const outputDir = resolve('src/contents/articles');
  mkdirSync(outputDir, { recursive: true });
  const localPath = resolve(outputDir, `${slug}.md`);

  const posterValue = localCoverPath || coverImage || '';
  const publishedDateFormatted = publishedStr
    ? new Date(publishedStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  const frontmatter = buildFrontmatter({
    title,
    publishedDate: publishedDateFormatted,
    category,
    poster: posterValue,
  });

  writeFileSync(localPath, frontmatter + smoothedMarkdown, 'utf-8');
  console.error(`Local:   ${localPath}`);
  console.error(`[Tokens] OpenAI: ${formatTokenReport()}`);

  // Single JSON line to stdout — orchestrator captures this
  console.log(
    JSON.stringify({
      notionUrl,
      localPath,
      slug,
      category,
      cover: localCoverPath || coverImage || '',
      openaiTokenReport: formatTokenReport(),
    }),
  );
}

main().catch((err) => {
  console.error('publish failed:', err.message);
  process.exit(1);
});

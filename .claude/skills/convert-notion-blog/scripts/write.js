#!/usr/bin/env node
/**
 * Fetches a blog post from any URL, converts it, and creates a new page in the
 * Notion database with proper block formatting (headings, images, quotes, code).
 *
 * Usage (run from project root):
 *   node --env-file=.env .claude/skills/convert-notion-blog/scripts/write.js --url=https://...
 *
 * After the Notion page is created, use migrate.js to save it as a local .md file:
 *   node --env-file=.env .claude/skills/convert-notion-blog/scripts/migrate.js --ids=<slug>
 */

import { Client } from '@notionhq/client';
import { markdownToBlocks } from '@tryfabric/martian';
import TurndownService from 'turndown';
import { extract } from '@extractus/article-extractor';
import { createWriteStream, mkdirSync } from 'fs';
import { pipeline } from 'stream/promises';
import { resolve } from 'path';
import { smoothMarkdown, detectCategory, generateThumbnail, createOpenAIClient } from './ai.js';

const token = process.env.NOTION_TOKEN;
const databaseId = process.env.NOTION_DATABASE_ID;

if (!token || !databaseId) {
  console.error('Error: NOTION_TOKEN and NOTION_DATABASE_ID must be set in .env');
  process.exit(1);
}

const args = process.argv.slice(2);
const urlArg = args.find((a) => a.startsWith('--url='));

if (!urlArg) {
  console.error('Usage: write.js --url=<article-url>');
  process.exit(1);
}

const articleUrl = urlArg.slice('--url='.length);
const notion = new Client({ auth: token });

async function downloadThumbnail(imageUrl, slug) {
  const dir = resolve(process.cwd(), `static/articles/${slug}`);
  mkdirSync(dir, { recursive: true });
  const dest = resolve(dir, 'cover.png');
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
  await pipeline(response.body, createWriteStream(dest));
  return `/articles/${slug}/cover.png`;
}

function titleToSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

function htmlToMarkdown(html) {
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
  });
  return td.turndown(html);
}

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * Ensures every table_row in every table block has exactly table_width cells.
 * The Notion API rejects tables where row cell counts don't match table_width.
 */
function sanitizeTableBlocks(blocks) {
  return blocks.map((block) => {
    if (block.type !== 'table') return block;
    const rows = block.table?.children ?? [];
    if (rows.length === 0) return block;
    const tableWidth = Math.max(1, rows[0]?.table_row?.cells?.length ?? 1);
    const sanitizedRows = rows.map((row) => {
      if (row.type !== 'table_row') return row;
      const cells = row.table_row?.cells ?? [];
      const padded = [...cells];
      while (padded.length < tableWidth) padded.push([]);
      return { ...row, table_row: { ...row.table_row, cells: padded.slice(0, tableWidth) } };
    });
    return { ...block, table: { ...block.table, table_width: tableWidth, children: sanitizedRows } };
  });
}

async function createNotionPage(article, markdown) {
  let blocks;
  try {
    blocks = sanitizeTableBlocks(markdownToBlocks(markdown));
  } catch {
    // Fallback: wrap every non-empty paragraph as a plain paragraph block
    blocks = markdown
      .split(/\n\n+/)
      .filter(Boolean)
      .map((text) => ({
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: text.slice(0, 2000) } }],
        },
      }));
  }

  const publishedDate = article.published
    ? new Date(article.published).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const properties = {
    Name: {
      title: [{ text: { content: (article.title ?? 'Untitled').slice(0, 2000) } }],
    },
    Published: {
      date: { start: publishedDate },
    },
  };

  if (articleUrl) {
    properties['URL'] = { url: articleUrl };
  }

  // Notion API allows max 100 children on page creation
  const [firstChunk, ...remainingChunks] = chunkArray(blocks, 100);

  const payload = {
    parent: { database_id: databaseId },
    properties,
    children: firstChunk ?? [],
  };

  if (article.image) {
    payload.cover = { type: 'external', external: { url: article.image } };
  }

  const page = await notion.pages.create(payload);

  // Append remaining blocks in 100-block chunks
  for (const chunk of remainingChunks) {
    await notion.blocks.children.append({ block_id: page.id, children: chunk });
  }

  return page;
}

async function main() {
  console.log(`Fetching: ${articleUrl}`);

  const article = await extract(articleUrl, { timeout: 15000 });
  if (!article || !article.content) {
    console.error('Error: Could not extract article content from URL.');
    console.error('The site may require JavaScript rendering or block scrapers.');
    process.exit(1);
  }

  const title = article.title ?? 'Untitled';
  const slug = titleToSlug(title);

  console.log(`Title:   ${title}`);
  console.log(`Slug:    ${slug}`);
  if (article.description) console.log(`Desc:    ${article.description.slice(0, 80)}...`);

  const rawMarkdown = htmlToMarkdown(article.content);

  const openai = createOpenAIClient();
  let finalMarkdown = rawMarkdown;
  if (openai) {
    console.log('Smoothing content (language detection + refinement)...');
    const { markdown: smoothed, langChanges } = await smoothMarkdown(rawMarkdown, openai);
    finalMarkdown = smoothed;
    if (langChanges.length > 0) {
      console.log(`  Tagged ${langChanges.length} code block(s): ${langChanges.map((c) => c.detected).join(', ')}`);
    }
  } else {
    console.log('  (OPENAI_API_KEY not set — skipping smoothing)');
  }

  let thumbnailUrl = article.image ?? null;
  let localCoverPath = null;

  if (openai) {
    try {
      const category = await detectCategory(title, article.description ?? '', finalMarkdown, openai);
      console.log(`Category: ${category}`);
    } catch {
      // non-fatal
    }

    try {
      console.log('Generating thumbnail with DALL-E 3...');
      const dalleUrl = await generateThumbnail(title, article.description ?? '', openai);
      localCoverPath = await downloadThumbnail(dalleUrl, slug);
      thumbnailUrl = dalleUrl;
      console.log(`Thumbnail: ${localCoverPath}`);
    } catch (err) {
      console.warn(`  (thumbnail generation failed: ${err.message})`);
    }
  }

  // Patch article.image so createNotionPage uses the DALL-E URL for the cover
  const articleWithCover = { ...article, image: thumbnailUrl };

  console.log('Creating Notion page...');
  const page = await createNotionPage(articleWithCover, finalMarkdown);

  const notionUrl = `https://notion.so/${page.id.replace(/-/g, '')}`;
  console.log(`\nDone.`);
  console.log(`Notion:  ${notionUrl}`);
  console.log(`Slug:    ${slug}`);
  if (localCoverPath) console.log(`Cover:   ${localCoverPath}`);
  console.log(`\nTo save as a local .md file, run:`);
  console.log(`  node --env-file=.env .claude/skills/convert-notion-blog/scripts/migrate.js --ids=${slug}`);
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});

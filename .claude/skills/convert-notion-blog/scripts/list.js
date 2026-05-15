#!/usr/bin/env node
/**
 * Lists all published articles from the Notion database.
 * Run from project root: node --env-file=.env .claude/skills/convert-notion-blog/scripts/list.js
 *
 * The slug shown in parentheses is the title-derived filename used by migrate.js.
 * Pass it to --ids when migrating specific articles.
 */

import { Client, isFullPage } from '@notionhq/client';
import fs from 'fs/promises';
import path from 'path';

const token = process.env.NOTION_TOKEN;
const databaseId = process.env.NOTION_DATABASE_ID;

if (!token || !databaseId) {
  console.error('Error: NOTION_TOKEN and NOTION_DATABASE_ID must be set in .env');
  process.exit(1);
}

const notion = new Client({ auth: token });

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
    : 'No date';

  const slug = titleToSlug(title);

  return { slug, title, publishedDate };
}

async function listArticles() {
  const outputDir = path.resolve('src/contents/articles');
  let existingSlugs = new Set();
  try {
    const files = await fs.readdir(outputDir);
    for (const f of files) {
      if (f.endsWith('.md')) existingSlugs.add(f.slice(0, -3));
    }
  } catch {
    // directory may not exist yet
  }

  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: 'Published',
      date: { is_not_empty: true },
    },
    sorts: [{ property: 'Published', direction: 'descending' }],
  });

  const articles = response.results.filter(isFullPage).map(extractMeta);

  if (articles.length === 0) {
    console.log('No published articles found in the Notion database.');
    return;
  }

  console.log('  ✓ = already migrated to src/contents/articles/\n');
  articles.forEach((article, i) => {
    const index = String(i + 1).padStart(2, ' ');
    const migrated = existingSlugs.has(article.slug);
    const marker = migrated ? '✓' : ' ';
    const title = article.title.padEnd(50, ' ').slice(0, 50);
    console.log(`[${index}] ${marker} ${title} (${article.slug}) — ${article.publishedDate}`);
  });
}

listArticles().catch((err) => {
  console.error('Failed to fetch articles:', err.message);
  process.exit(1);
});

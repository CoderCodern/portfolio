#!/usr/bin/env node
/**
 * Fetches a blog post from a URL and converts it to raw markdown.
 * Saves intermediate file to .claude/tmp/blog-raw.md.
 * Prints a single JSON line to stdout for the orchestrator to capture.
 * Progress messages go to stderr.
 *
 * Usage (run from project root):
 *   node --env-file=.env .claude/skills/convert-notion-blog/scripts/fetch.js --url=https://...
 */

import { extract } from '@extractus/article-extractor';
import TurndownService from 'turndown';
import { mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const args = process.argv.slice(2);
const urlArg = args.find((a) => a.startsWith('--url='));

if (!urlArg) {
  console.error('Usage: fetch.js --url=<article-url>');
  process.exit(1);
}

const articleUrl = urlArg.slice('--url='.length);

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

async function main() {
  console.error(`Fetching: ${articleUrl}`);

  const article = await extract(articleUrl, { timeout: 15000 });
  if (!article?.content) {
    console.error('Error: Could not extract article content.');
    console.error('The site may require JavaScript rendering or block scrapers.');
    process.exit(1);
  }

  const title = article.title ?? 'Untitled';
  const slug = titleToSlug(title);
  const rawMarkdown = htmlToMarkdown(article.content);

  console.error(`Title:   ${title}`);
  console.error(`Slug:    ${slug}`);

  const tmpDir = resolve('.claude/tmp');
  mkdirSync(tmpDir, { recursive: true });

  const rawPath = resolve(tmpDir, 'blog-raw.md');
  writeFileSync(rawPath, rawMarkdown, 'utf-8');
  console.error(`Saved:   ${rawPath}`);

  // Single JSON line to stdout — orchestrator captures this
  console.log(
    JSON.stringify({
      title,
      slug,
      description: article.description ?? '',
      image: article.image ?? '',
      published: article.published ?? '',
      rawPath,
    }),
  );
}

main().catch((err) => {
  console.error('fetch failed:', err.message);
  process.exit(1);
});

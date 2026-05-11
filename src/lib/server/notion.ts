import { Client, isFullPage } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { marked } from 'marked';
import { NOTION_TOKEN, NOTION_DATABASE_ID } from '$env/static/private';

import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

const notion = new Client({ auth: NOTION_TOKEN });
const n2m = new NotionToMarkdown({ notionClient: notion });

export interface NotionArticle {
	slug: string;
	title: string;
	description: string;
	publishedDate: string;
	poster: string;
}

function extractMeta(page: PageObjectResponse): NotionArticle {
	const props = page.properties;

	const title =
		props['Name']?.type === 'title' ? (props['Name'].title[0]?.plain_text ?? 'Untitled') : 'Untitled';

	// Description: fall back to AI custom autofill if a dedicated Description property is added later
	const description =
		props['Description']?.type === 'rich_text'
			? (props['Description'].rich_text[0]?.plain_text ?? '')
			: props['AI custom autofill']?.type === 'rich_text'
				? (props['AI custom autofill'].rich_text[0]?.plain_text ?? '')
				: '';

	const rawDate =
		props['Published']?.type === 'date' ? (props['Published'].date?.start ?? '') : '';

	const publishedDate = rawDate
		? new Date(rawDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
		: '';

	const poster =
		page.cover?.type === 'external'
			? page.cover.external.url
			: page.cover?.type === 'file'
				? page.cover.file.url
				: '/opengraph-image.png';

	// Use stripped page ID as slug (no dashes)
	const slug = page.id.replace(/-/g, '');

	return { slug, title, description, publishedDate, poster };
}

export async function getArticles(): Promise<NotionArticle[]> {
	const response = await notion.databases.query({
		database_id: NOTION_DATABASE_ID,
		filter: {
			property: 'Published',
			date: { is_not_empty: true }
		},
		sorts: [{ property: 'Published', direction: 'descending' }]
	});

	return response.results.filter(isFullPage).map(extractMeta);
}

export async function getArticle(slug: string): Promise<{ content: string; meta: NotionArticle }> {
	// Restore dashed UUID format from the stripped slug
	const pageId = slug.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');

	const page = await notion.pages.retrieve({ page_id: pageId });

	if (!isFullPage(page)) throw new Error(`Page ${pageId} not found`);

	const mdBlocks = await n2m.pageToMarkdown(pageId);
	const { parent: markdown } = n2m.toMarkdownString(mdBlocks);
	const content = await marked.parse(markdown);

	return { content, meta: extractMeta(page) };
}

import type { Article } from '$lib/types';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async () => {
	const paths = import.meta.glob('/src/contents/articles/*.md', { eager: true });
	const items: Article[] = [];
	let allCategories: string[] = [];
	let allSeries: string[] = [];

	for (const path in paths) {
		const file = paths[path];
		const slug = path.split('/').at(-1)?.replace('.md', '');

		if (file && typeof file === 'object' && 'metadata' in file && slug) {
			const metadata = file.metadata as Omit<Article, 'slug'>;
			items.push({ ...metadata, slug });
			if (metadata.category) allCategories.push(metadata.category);
			if (metadata.series) allSeries.push(metadata.series);
		}
	}

	items.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());

	const categories = ['All Articles', ...new Set(allCategories)];
	const playlists = [...new Set(allSeries)];

	return { items, categories, playlists };
};

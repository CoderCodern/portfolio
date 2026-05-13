import type { PageServerLoad } from './$types';
import type { Article } from '$lib/types';

export const prerender = true;

export const load: PageServerLoad = async () => {
	const paths = import.meta.glob('/src/contents/articles/*.md', { eager: true });
	const articles: Article[] = [];

	for (const path in paths) {
		const file = paths[path];
		const slug = path.split('/').at(-1)?.replace('.md', '');

		if (file && typeof file === 'object' && 'metadata' in file && slug) {
			const metadata = file.metadata as Omit<Article, 'slug'>;
			articles.push({ ...metadata, slug });
		}
	}

	articles.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());

	return { articles };
};

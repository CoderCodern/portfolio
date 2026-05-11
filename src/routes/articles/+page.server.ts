import { getArticles } from '$lib/server/notion';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async () => {
	const articles = await getArticles();
	return { articles };
};

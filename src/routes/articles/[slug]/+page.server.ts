import { error } from '@sveltejs/kit';
import { getArticle } from '$lib/server/notion';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ params }) => {
	try {
		return await getArticle(params.slug);
	} catch (e) {
		console.error(e);
		error(404, `Article not found`);
	}
};

import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

const htmlFiles = import.meta.glob('/src/contents/articles/html/*.html', { as: 'raw', eager: false });

export const load: PageLoad = async ({ params }) => {
	try {
		const post = await import(`../../../contents/articles/${params.slug}.md`);

		if (post.metadata?.htmlFile) {
			const htmlPath = `/src/contents/articles/html/${post.metadata.htmlFile}.html`;
			const loadHtml = htmlFiles[htmlPath];
			if (loadHtml) {
				const raw = (await loadHtml()) as string;
				// .hero uses min-height:100vh which creates a feedback loop when the
				// iframe is resized to its content height — override it here only.
				const htmlContent = raw.replace(
					'</head>',
					'<style>.hero{min-height:0!important}</style></head>'
				);
				return { content: null, htmlContent, meta: post.metadata };
			}
		}

		return { content: post.default, htmlContent: null, meta: post.metadata };
	} catch (e) {
		if (!(e instanceof Error)) throw e;
		error(404, `Could not find ${params.slug}`);
	}
};

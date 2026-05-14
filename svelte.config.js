import remarkToc from 'remark-toc';
import rehypeSlug from 'rehype-slug';
import { createHighlighter } from 'shiki';
import { mdsvex, escapeSvelte } from 'mdsvex';
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {Promise<import('shiki').Highlighter> | null} */
let highlighterPromise = null;

function getSingletonHighlighter() {
	if (!highlighterPromise) {
		highlighterPromise = createHighlighter({
			themes: ['poimandres'],
			langs: [
				'javascript', 'typescript', 'jsx', 'tsx',
				'html', 'css', 'json', 'yaml', 'xml', 'markdown',
				'bash', 'shell', 'powershell',
				'python', 'go', 'rust', 'java', 'kotlin', 'swift',
				'csharp', 'cpp', 'c', 'php', 'ruby', 'sql'
			]
		});
	}
	return highlighterPromise;
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [
		vitePreprocess(),
		mdsvex({
			extensions: ['.md'],
			highlight: {
				highlighter: async (code, lang = 'text') => {
					const highlighter = await getSingletonHighlighter();
					const supported = highlighter.getLoadedLanguages();
					const effectiveLang = supported.includes(lang) ? lang : 'text';
					const html = escapeSvelte(
						highlighter.codeToHtml(code, {
							lang: effectiveLang,
							theme: 'poimandres',
							transformers: [
								{
									pre(node) {
										delete node.properties.style;
									}
								}
							]
						})
					);
					return `{@html \`${html}\` }`;
				}
			},
			remarkPlugins: [[remarkToc, { tight: true }]],
			rehypePlugins: [rehypeSlug]
		})
	],
	kit: { adapter: adapter({ runtime: 'nodejs22.x' }), experimental: { remoteFunctions: true } },
	compilerOptions: { experimental: { async: true } },
	vitePlugin: {
		inspector: {
			toggleKeyCombo: 'meta-shift',
			showToggleButton: 'always',
			toggleButtonPos: 'bottom-right'
		}
	}
};

export default config;

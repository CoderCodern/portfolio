<script lang="ts">
	import Metadata from '$lib/components/metadata.svelte';

	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Metadata title={data.meta.title + ' | Viet Hoang'} description={data.meta.description} image={data.meta.poster} />

<header class="group border-ash-700 bg-ash-700 relative mb-5 aspect-3/1 overflow-hidden border">
	<img src={data.meta.poster} alt={data.meta.title} class="size-full object-cover object-center" />
	<div class="absolute top-0 left-0 grid h-full w-full place-items-center bg-[#080808]/80 transition-opacity duration-500 group-hover:opacity-0">
		<h1 class="max-w-[80%] px-4 text-center text-2xl font-semibold uppercase lg:max-w-[60%] lg:text-4xl">
			{data.meta.title}
		</h1>
	</div>
	<div
		aria-hidden="true"
		class="absolute top-0 left-0 h-full w-full bg-repeat opacity-2 group-hover:opacity-0"
		style="background-image: url('https://framerusercontent.com/images/rR6HYXBrMmX4cRpXfXUOvpvpB0.png')"
	></div>
</header>

{#if data.meta.link || data.meta.github}
	<div class="mx-auto mb-5 flex max-w-3xl gap-3">
		{#if data.meta.link}
			<a
				href={data.meta.link}
				target="_blank"
				rel="noopener noreferrer"
				class="border-ash-700 hover:border-ash-500 text-ash-300 hover:text-ash-100 inline-flex items-center gap-2 border px-4 py-2 text-sm transition-colors duration-200"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
				</svg>
				Visit Project
			</a>
		{/if}
		{#if data.meta.github}
			<a
				href={data.meta.github}
				target="_blank"
				rel="noopener noreferrer"
				class="border-ash-700 hover:border-ash-500 text-ash-300 hover:text-ash-100 inline-flex items-center gap-2 border px-4 py-2 text-sm transition-colors duration-200"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
				</svg>
				GitHub
			</a>
		{/if}
	</div>
{/if}

<article
	class="prose prose-hr:border-ash-600 prose-pre:bg-ash-800/20 prose-code:before:opacity-0 prose-code:after:opacity-0 prose-code:text-ash-200 prose-code:font-mono prose-pre:border prose-headings:text-ash-200 prose-p:text-ash-400 prose-strong:text-ash-200 prose-li:text-ash-400 prose-li:marker:text-ash-300 prose-a:text-ash-200 prose-blockquote:border-ash-500 prose-p:indent-5 prose-td:text-ash-300 prose-thead:border-ash-300 prose-tr:border-ash-500 mx-auto max-w-3xl font-sans"
>
	<data.content />
</article>

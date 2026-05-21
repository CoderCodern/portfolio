<script lang="ts">
	import { page } from '$app/state';
	import { onDestroy } from 'svelte';
	import { createWebHaptics } from 'web-haptics/svelte';

	import Metadata from '$lib/components/metadata.svelte';
	import type { PageProps } from './$types';

	const PAGE_SIZE = 10;

	let { data }: PageProps = $props();

	let activeCategory = $derived(page.url.searchParams.get('category') ?? '');
	let currentPage    = $derived(Math.max(1, parseInt(page.url.searchParams.get('page') ?? '1', 10)));

	let filtered = $derived.by(() => {
		if (activeCategory === '') return data.items;
		return data.items.filter((item) => item.category === activeCategory);
	});

	let totalPages = $derived(Math.ceil(filtered.length / PAGE_SIZE));
	let articles   = $derived(filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE));

	function pageUrl(p: number) {
		const params = new URLSearchParams();
		if (activeCategory) params.set('category', activeCategory);
		if (p > 1) params.set('page', String(p));
		const qs = params.toString();
		return qs ? `/articles?${qs}` : '/articles';
	}

	const { trigger, destroy } = createWebHaptics();

	onDestroy(destroy);
</script>

<Metadata
	title="Articles | Viet Hoang"
	description="Articles and thoughts on software engineering, .NET, clean architecture, and frontend development."
/>

<h1 class="sr-only">Viet Hoang's Articles</h1>

<nav class="bg-ash-700 sticky top-0 z-50 mb-4 flex items-center overflow-x-auto select-none">
	{#each data.categories as item (item)}
		<a
			onclick={() => trigger()}
			href={item === 'All Articles' ? '/articles' : `/articles?category=${encodeURIComponent(item)}`}
			data-active={activeCategory === item || (activeCategory === '' && item === 'All Articles')}
			class="text-ash-300 data-[active=true]:bg-ash-300 data-[active=true]:text-ash-800 flex shrink-0 items-center px-3 py-0.5 leading-none transition-all"
			aria-label={`Filter by ${item}`}
		>
			{item}
		</a>
	{/each}
</nav>

<div class="grid gap-2 lg:grid-cols-2">
	{#each articles as article, i (i)}
		<div class="flex flex-col gap-y-2 border border-[#898989]/20 p-2 md:gap-y-2.5 lg:gap-y-5">
			{#if article.poster}
				<img
					src={article.poster}
					alt={article.title}
					class="h-36 w-full object-cover md:h-44"
					loading={i === 0 ? 'eager' : 'lazy'}
				/>
			{/if}
			<h2 class="text-lg font-semibold text-[#C6C6C6] md:text-xl lg:text-2xl">
				<a
					onclick={() => trigger()}
					href={`/articles/${article.slug}`}
					aria-label={`View details for article: ${article.title}`}
					data-umami-event="article-click"
					data-umami-event-title={article.title}
					data-umami-event-location="title"
				>
					{article.title}
				</a>
			</h2>

			{#if article.description}
				<p class="line-clamp-4 flex-1 text-sm">{article.description}</p>
			{/if}

			<div class="flex flex-wrap items-center justify-between gap-2 text-sm">
				<div class="flex items-center gap-2">
					<p>{article.publishedDate}</p>
					{#if article.category}
						<span class="border border-[#898989]/40 px-1.5 py-0.5 text-xs text-[#898989]">{article.category}</span>
					{/if}
				</div>
				<a
					onclick={() => trigger()}
					href={`/articles/${article.slug.toLowerCase()}`}
					class="flex items-center justify-center gap-x-2 bg-[#898989] px-2.5 py-0.5 text-[#131313] select-none"
					aria-label={`Read more about ${article.title}`}
					data-umami-event="article-click"
					data-umami-event-title={article.title}
					data-umami-event-location="button"
				>
					Read more &gt;&gt;
				</a>
			</div>
		</div>
	{/each}
</div>

{#if totalPages > 1}
	<div class="mt-4 flex items-center justify-between font-mono text-sm text-[#898989]">
		{#if currentPage > 1}
			<a
				onclick={() => trigger()}
				href={pageUrl(currentPage - 1)}
				class="border border-[#898989]/40 px-3 py-1 transition-colors hover:border-[#898989] hover:text-[#C6C6C6]"
			>
				&lt;&lt; Prev
			</a>
		{:else}
			<span></span>
		{/if}

		<span class="text-xs">{currentPage} / {totalPages}</span>

		{#if currentPage < totalPages}
			<a
				onclick={() => trigger()}
				href={pageUrl(currentPage + 1)}
				class="border border-[#898989]/40 px-3 py-1 transition-colors hover:border-[#898989] hover:text-[#C6C6C6]"
			>
				Next &gt;&gt;
			</a>
		{:else}
			<span></span>
		{/if}
	</div>
{/if}

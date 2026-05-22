<script lang="ts">
	import { page } from '$app/state';
	import { onDestroy } from 'svelte';
	import { createWebHaptics } from 'web-haptics/svelte';

	import Metadata from '$lib/components/metadata.svelte';
	import type { PageProps } from './$types';

	const PAGE_SIZE = 10;

	let { data }: PageProps = $props();

	let activeCategory = $derived(page.url.searchParams.get('category') ?? '');
	// null = not in playlist mode, '' = playlist index, 'name' = specific playlist
	let rawPlaylist    = $derived(page.url.searchParams.get('playlist'));
	let inPlaylistMode = $derived(rawPlaylist !== null);
	let activePlaylist = $derived(rawPlaylist ?? '');
	let currentPage    = $derived(Math.max(1, parseInt(page.url.searchParams.get('page') ?? '1', 10)));

	let filtered = $derived.by(() => {
		if (activePlaylist !== '') {
			return data.items
				.filter((item) => item.series === activePlaylist)
				.sort((a, b) => (a.episode ?? 0) - (b.episode ?? 0));
		}
		if (activeCategory === '') return data.items;
		return data.items.filter((item) => item.category === activeCategory);
	});

	let totalPages = $derived(Math.ceil(filtered.length / PAGE_SIZE));
	let articles   = $derived(filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE));

	// Metadata for each playlist, used in the index view
	let playlistIndex = $derived(
		data.playlists.map((name) => {
			const episodes = data.items
				.filter((i) => i.series === name)
				.sort((a, b) => (a.episode ?? 0) - (b.episode ?? 0));
			return {
				name,
				count: episodes.length,
				poster: episodes.find((e) => e.poster)?.poster,
				category: episodes[0]?.category,
				description: episodes[0]?.description,
			};
		})
	);

	function pageUrl(p: number) {
		const params = new URLSearchParams();
		if (activePlaylist) params.set('playlist', activePlaylist);
		else if (activeCategory) params.set('category', activeCategory);
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
			data-active={!inPlaylistMode && (activeCategory === item || (activeCategory === '' && item === 'All Articles'))}
			class="text-ash-300 data-[active=true]:bg-ash-300 data-[active=true]:text-ash-800 flex shrink-0 items-center px-3 py-0.5 leading-none transition-all"
			aria-label={`Filter by ${item}`}
		>
			{item}
		</a>
	{/each}
	{#if data.playlists.length > 0}
		<span class="bg-ash-500 mx-2 h-3.5 w-px shrink-0" aria-hidden="true"></span>
		<a
			onclick={() => trigger()}
			href="/articles?playlist"
			data-active={inPlaylistMode}
			class="text-ash-300 data-[active=true]:bg-ash-300 data-[active=true]:text-ash-800 flex shrink-0 items-center gap-1 px-3 py-0.5 leading-none transition-all"
			aria-label="View playlists"
		>
			<span class="text-[10px]">▶</span>Playlist
		</a>
	{/if}
</nav>

{#if inPlaylistMode && activePlaylist === ''}
	<!-- Playlist index — list of all series -->
	<div class="mb-3 flex items-center justify-between border-b border-[#898989]/20 pb-3">
		<div class="flex items-center gap-3">
			<span class="text-xl text-[#898989]">▶</span>
			<div>
				<p class="text-xs uppercase tracking-wider text-[#898989]">Browse</p>
				<h2 class="text-lg font-semibold text-[#C6C6C6]">Playlists</h2>
			</div>
		</div>
		<span class="font-mono text-sm text-[#898989]">{playlistIndex.length} series</span>
	</div>

	<div class="flex flex-col gap-3">
		{#each playlistIndex as playlist (playlist.name)}
			<a
				onclick={() => trigger()}
				href={`/articles?playlist=${encodeURIComponent(playlist.name)}`}
				class="group flex flex-col gap-2 border border-[#898989]/20 p-2 transition-colors hover:border-[#898989]/50 sm:flex-row sm:items-center sm:gap-4"
				aria-label={`View ${playlist.name} playlist`}
			>
				<!-- Thumbnail -->
				{#if playlist.poster}
					<img
						src={playlist.poster}
						alt={playlist.name}
						class="h-32 w-full object-cover sm:h-20 sm:w-36 sm:shrink-0"
						loading="lazy"
					/>
				{:else}
					<div class="flex h-32 w-full items-center justify-center bg-[#898989]/10 sm:h-20 sm:w-36 sm:shrink-0">
						<span class="text-2xl text-[#898989]/30">▶</span>
					</div>
				{/if}

				<!-- Info -->
				<div class="flex flex-1 flex-col gap-1">
					<p class="text-base font-semibold text-[#C6C6C6] group-hover:text-white transition-colors">{playlist.name}</p>
					{#if playlist.description}
						<p class="line-clamp-2 text-xs text-[#898989]">{playlist.description}</p>
					{/if}
					<div class="flex items-center gap-2 text-xs text-[#898989]">
						<span class="font-mono">{playlist.count} episode{playlist.count === 1 ? '' : 's'}</span>
						{#if playlist.category}
							<span class="border border-[#898989]/40 px-1.5 py-0.5">{playlist.category}</span>
						{/if}
					</div>
				</div>

				<span class="hidden shrink-0 self-center bg-[#898989] px-2.5 py-0.5 text-xs text-[#131313] sm:block">
					View &gt;&gt;
				</span>
			</a>
		{/each}
	</div>

{:else if inPlaylistMode && activePlaylist !== ''}
	<!-- Specific playlist — episode list -->
	<div class="mb-3 flex items-center justify-between border-b border-[#898989]/20 pb-3">
		<div class="flex items-center gap-3">
			<a href="/articles?playlist" class="text-[#898989] hover:text-[#C6C6C6] transition-colors text-sm">← Playlists</a>
			<span class="text-[#898989]/40">/</span>
			<div>
				<p class="text-xs uppercase tracking-wider text-[#898989]">Playlist</p>
				<h2 class="text-lg font-semibold text-[#C6C6C6]">{activePlaylist}</h2>
			</div>
		</div>
		<span class="font-mono text-sm text-[#898989]">{filtered.length} episode{filtered.length === 1 ? '' : 's'}</span>
	</div>

	<div class="flex flex-col">
		{#each filtered as article (article.slug)}
			<div class="flex items-start gap-3 border-b border-[#898989]/10 py-3 last:border-0">
				<span class="w-9 shrink-0 pt-1 text-center font-mono text-sm text-[#898989]">
					{String(article.episode ?? 0).padStart(2, '0')}
				</span>

				{#if article.poster}
					<img src={article.poster} alt={article.title} class="h-16 w-28 shrink-0 object-cover" loading="lazy" />
				{:else}
					<div class="flex h-16 w-28 shrink-0 items-center justify-center bg-[#898989]/10">
						<span class="font-mono text-xs text-[#898989]/40">EP {article.episode}</span>
					</div>
				{/if}

				<div class="flex min-w-0 flex-1 flex-col gap-1">
					<h2 class="text-sm font-semibold leading-snug text-[#C6C6C6]">
						<a
							onclick={() => trigger()}
							href={`/articles/${article.slug}`}
							aria-label={`Read: ${article.title}`}
							data-umami-event="article-click"
							data-umami-event-title={article.title}
							data-umami-event-location="playlist"
						>
							{article.title}
						</a>
					</h2>
					{#if article.description}
						<p class="line-clamp-2 text-xs text-[#898989]">{article.description}</p>
					{/if}
					<p class="text-xs text-[#898989]/60">{article.publishedDate}</p>
				</div>

				<a
					onclick={() => trigger()}
					href={`/articles/${article.slug.toLowerCase()}`}
					class="hidden shrink-0 self-center bg-[#898989] px-2.5 py-0.5 text-xs text-[#131313] select-none sm:block"
					aria-label={`Read ${article.title}`}
					data-umami-event="article-click"
					data-umami-event-title={article.title}
					data-umami-event-location="playlist-button"
				>
					Read &gt;&gt;
				</a>
			</div>
		{/each}
	</div>

{:else}
	<!-- Normal article grid -->
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
{/if}

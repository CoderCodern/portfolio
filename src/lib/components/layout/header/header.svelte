<script lang="ts">
	import Face from './face.svelte';

	interface Props {
		expandLevel: 0 | 1 | 2;
		onMouseDown: (e: MouseEvent) => void;
		toggleFullscreen: () => void;
	}

	let { expandLevel, onMouseDown, toggleFullscreen }: Props = $props();

	const expandLabels = ['Expand to tab fullscreen', 'Expand to device fullscreen', 'Exit fullscreen'] as const;
	const expandActions = ['enter-tab-fullscreen', 'enter-device-fullscreen', 'exit-fullscreen'] as const;

	function handleHeaderKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggleFullscreen();
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<header
	class={`relative flex cursor-default items-center justify-between overflow-hidden px-4 py-3 ${expandLevel > 0 ? 'lg:cursor-pointer' : 'lg:cursor-grab lg:active:cursor-grabbing'}`}
	ondblclick={toggleFullscreen}
	onmousedown={onMouseDown}
	onkeydown={handleHeaderKeyDown}
	data-umami-event-ondblclick="window-dblclick"
>
	<div class="group absolute top-1/2 hidden -translate-y-1/2 items-center lg:flex">
		<button
			class="grid h-6 w-6 place-items-center rounded-full"
			onclick={() => window.close()}
			aria-label="Close"
			data-umami-event="window-control"
			data-umami-event-action="close"
		>
			<div class="relative grid h-3 w-3 place-items-center rounded-full bg-[#898989] transition-colors group-hover:bg-[#FF6057]">
				<svg class="absolute h-1.5 w-1.5 opacity-0 transition-opacity group-hover:opacity-100" viewBox="0 0 10 10" stroke="#4D0000" stroke-width="1.8" stroke-linecap="round">
					<path d="M2 2 L8 8 M8 2 L2 8" />
				</svg>
			</div>
		</button>
		<button class="grid h-6 w-6 place-items-center rounded-full" onclick={() => history.back()} aria-label="Go back" data-umami-event="window-control" data-umami-event-action="minimize">
			<div class="relative grid h-3 w-3 place-items-center rounded-full bg-[#898989] transition-colors group-hover:bg-[#FEBC2D]">
				<svg class="absolute h-1.5 w-1.5 opacity-0 transition-opacity group-hover:opacity-100" viewBox="0 0 10 10" stroke="#4D3000" stroke-width="1.8" stroke-linecap="round">
					<path d="M2 5 L8 5" />
				</svg>
			</div>
		</button>
		<button
			class="grid h-6 w-6 place-items-center rounded-full"
			onclick={toggleFullscreen}
			aria-label={expandLabels[expandLevel]}
			data-umami-event="window-control"
			data-umami-event-action={expandActions[expandLevel]}
		>
			<div class="relative grid h-3 w-3 place-items-center rounded-full bg-[#898989] transition-colors group-hover:bg-[#2BC840]">
				<svg class="absolute h-1.5 w-1.5 opacity-0 transition-opacity group-hover:opacity-100" viewBox="0 0 10 10" stroke="#003D00" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					{#if expandLevel < 2}
						<!-- expand icon — levels 0 (tab) and 1 (device) -->
						<path d="M1 6 L1 9 L4 9 M6 1 L9 1 L9 4" />
					{:else}
						<!-- compress icon — level 2 (exit) -->
						<path d="M1 4 L4 4 L4 1 M6 9 L9 9 L9 6" />
					{/if}
				</svg>
			</div>
		</button>
	</div>
	<p class="not-sr-only mx-auto hidden font-semibold select-none lg:block">Coder Codern</p>
	<p class="not-sr-only mx-auto block font-semibold select-none lg:hidden">Coder Codern</p>
	<Face />
</header>

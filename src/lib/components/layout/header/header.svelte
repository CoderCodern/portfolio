<script lang="ts">
	import Face from './face.svelte';

	interface $$Props {
		isFullscreen: boolean;
		onMouseDown: (e: MouseEvent) => void;
		toggleFullscreen: () => void;
	}

	let { isFullscreen, onMouseDown, toggleFullscreen }: $$Props = $props();

	function handleHeaderKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggleFullscreen();
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<header
	class={`relative flex cursor-default items-center justify-between overflow-hidden px-4 py-3 ${isFullscreen ? 'lg:cursor-pointer' : 'lg:cursor-grab lg:active:cursor-grabbing'}`}
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
			aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
			data-umami-event="window-control"
			data-umami-event-action={isFullscreen ? 'exit-fullscreen' : 'enter-fullscreen'}
		>
			<div class="relative grid h-3 w-3 place-items-center rounded-full bg-[#898989] transition-colors group-hover:bg-[#2BC840]">
				<svg class="absolute h-1.5 w-1.5 opacity-0 transition-opacity group-hover:opacity-100" viewBox="0 0 10 10" stroke="#003D00" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M1 6 L1 9 L4 9 M6 1 L9 1 L9 4" />
				</svg>
			</div>
		</button>
	</div>
	<p class="not-sr-only mx-auto hidden font-semibold select-none lg:block">Coder Codern</p>
	<p class="not-sr-only mx-auto block font-semibold select-none lg:hidden">Coder Codern</p>
	<Face />
</header>

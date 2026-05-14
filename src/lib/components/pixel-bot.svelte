<script lang="ts">
	const BOT_W = 60; // px, total width including arms
	const MARGIN = 24; // px from each edge
	const SPEED = 38; // px/s — slow and chill

	let stage: HTMLDivElement | undefined = $state();
	let travel = $state(300);
	let x = $state(0);
	let dir = $state(1); // 1 = right, -1 = left
	let facingRight = $state(true);
	let audioCtx: AudioContext | null = null;

	// Keep travel in sync with container size
	$effect(() => {
		if (!stage) return;
		const update = () => {
			const next = Math.max(0, stage!.offsetWidth - MARGIN * 2 - BOT_W);
			travel = next;
			x = Math.min(x, next);
		};
		update();
		const ro = new ResizeObserver(update);
		ro.observe(stage);
		return () => ro.disconnect();
	});

	// rAF walk loop
	$effect(() => {
		let last = performance.now();
		let raf: number;

		function tick(now: number) {
			const dt = Math.min((now - last) / 1000, 0.05);
			last = now;
			x += dir * SPEED * dt;

			if (x >= travel) {
				x = travel;
				bounce();
			} else if (x <= 0) {
				x = 0;
				bounce();
			}

			raf = requestAnimationFrame(tick);
		}

		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	function bounce() {
		dir = -dir;
		facingRight = dir > 0;
		if (audioCtx) bloop(audioCtx);
	}

	function handleClick() {
		if (!audioCtx) audioCtx = new AudioContext();
		dir = -dir;
		facingRight = dir > 0;
		bloop(audioCtx);
	}

	function bloop(ctx: AudioContext) {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.type = 'square';
		osc.frequency.setValueAtTime(220, ctx.currentTime);
		osc.frequency.linearRampToValueAtTime(160, ctx.currentTime + 0.09);
		gain.gain.setValueAtTime(0.06, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
		osc.start(ctx.currentTime);
		osc.stop(ctx.currentTime + 0.14);
	}
</script>

<div class="stage" bind:this={stage} aria-hidden="true">
	<!-- "This is my side-kick" callout -->
	<div class="callout">
		<span class="callout-text">This is my side-kick</span>
		<svg class="arrow" viewBox="0 0 52 44" width="52" height="44" fill="none" aria-hidden="true">
			<path
				d="M 4,4 C 8,16 24,28 42,40"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
			/>
			<path
				d="M 36,37 L 42,40 L 39,34"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</div>

	<!-- Fixed dashed track -->
	<div class="track"></div>

	<!-- Walking bot -->
	<button
		class="mover"
		style="transform: translateX({x}px)"
		onclick={handleClick}
		title="Click me!"
		aria-label="Click to change direction"
	>
		<div class="dir" class:flip={!facingRight}>
			<div class="bob">
				<div class="body">
					<div class="arm l"></div>
					<div class="arm r"></div>
					<div class="eye l"></div>
					<div class="eye r"></div>
				</div>
				<div class="legs">
					<div class="leg"></div>
					<div class="leg"></div>
					<div class="leg"></div>
					<div class="leg"></div>
				</div>
			</div>
		</div>
	</button>
</div>

<style>
	.stage {
		position: relative;
		width: 100%;
		height: 108px;
		overflow: hidden;
	}

	/* ── Callout label ── */
	.callout {
		position: absolute;
		top: 4px;
		left: 20px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		color: var(--color-ash-500);
		pointer-events: none;
		user-select: none;
	}

	.callout-text {
		font-size: 0.7rem;
		font-style: italic;
		letter-spacing: 0.01em;
		line-height: 1;
		white-space: nowrap;
	}

	.arrow {
		margin-top: 2px;
		margin-left: 12px;
	}

	/* ── Track ── */
	.track {
		position: absolute;
		bottom: 14px;
		left: 24px;
		right: 24px;
		border-top: 2px dashed var(--color-ash-600);
		pointer-events: none;
	}

	/* ── Mover: JS drives translateX ── */
	.mover {
		position: absolute;
		bottom: 14px;
		left: 24px;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
	}

	/* Direction flip */
	.dir {
		transition: transform 0.13s ease;
		transform: scaleX(1);
	}

	.dir.flip {
		transform: scaleX(-1);
	}

	/* Vertical bob */
	.bob {
		animation: bob 0.48s ease-in-out infinite alternate;
	}

	@keyframes bob {
		from {
			transform: translateY(0);
		}
		to {
			transform: translateY(-4px);
		}
	}

	/* ── Pixel art body ── */
	.body {
		position: relative;
		width: 48px;
		height: 34px;
		background: #f97316;
		margin: 0 6px;
	}

	.eye {
		position: absolute;
		width: 10px;
		height: 13px;
		background: oklch(0.1 0 0);
		top: 7px;
	}

	.eye.l {
		left: 7px;
	}

	.eye.r {
		right: 7px;
	}

	.arm {
		position: absolute;
		width: 6px;
		height: 10px;
		background: #f97316;
		top: 10px;
	}

	.arm.l {
		left: -6px;
	}

	.arm.r {
		right: -6px;
	}

	/* ── Legs ── */
	.legs {
		display: flex;
		justify-content: space-evenly;
		padding: 0 8px;
	}

	.leg {
		width: 8px;
		height: 12px;
		background: #f97316;
		animation: step 0.42s ease-in-out infinite alternate;
	}

	.leg:nth-child(even) {
		animation-delay: 0.21s;
	}

	@keyframes step {
		from {
			transform: translateY(0);
		}
		to {
			transform: translateY(3px);
		}
	}

	/* Respect reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.bob,
		.leg {
			animation: none;
		}

		.dir {
			transition: none;
		}
	}
</style>

<script lang="ts">
	// ─── Constants ────────────────────────────────────────────────
	const STAGE_H       = 210;
	const GROUND        = 22;
	const BOT_X         = 80;
	const BOT_W         = 40;

	const GRAVITY       = 0.52;
	const JUMP1         = -11.5;
	const JUMP2         = -9.5;
	const MAX_JUMPS     = 2;

	const INIT_SPEED    = 3.0;
	const SPAWN_MIN     = 460;
	const SPAWN_RAND    = 300;
	const MIN_SPAWN_FRM = 58;
	const INVINCIBLE_F  = 90;

	const PROJ_SPEED = { bullet: 16, arrow: 7 } as const;

	type OType = 'bug-sm' | 'bug-md' | 'bug-lg';
	const TYPES: OType[] = ['bug-sm', 'bug-sm', 'bug-md', 'bug-md', 'bug-md', 'bug-lg'];
	const SIZES: Record<OType, { w: number; h: number }> = {
		'bug-sm': { w: 24, h: 20 },
		'bug-md': { w: 32, h: 26 },
		'bug-lg': { w: 40, h: 32 },
	};

	// ─── Speed per phase ──────────────────────────────────────────
	function computeSpeed(s: number): number {
		if (s < 100) return Math.min(5, INIT_SPEED + s * 0.025);
		if (s < 300) return Math.min(7, 5 + (s - 100) * 0.012);
		return          Math.min(9, 7 + (s - 300) * 0.01);
	}

	// ─── State ────────────────────────────────────────────────────
	type GS = 'idle' | 'playing' | 'dead';
	let gs          = $state<GS>('idle');
	let minimized   = $state(false);
	let restoring   = $state(false);
	let botY        = $state(0);
	let velY        = $state(0);
	let jumpsLeft   = $state(MAX_JUMPS);
	let score       = $state(0);
	let highScore   = $state(0);
	let shieldCount = $state(0);
	let invincible  = $state(0);
	let isJumping   = $derived(botY > 3);
	let weaponType  = $derived(
		score >= 500 ? ('gun' as const) :
		score >= 300 ? ('bow' as const) :
		null
	);

	interface Obs        { id: number; x: number; type: OType; }
	interface Projectile { id: number; x: number; type: 'bullet' | 'arrow'; }
	let obstacles   = $state<Obs[]>([]);
	let projectiles = $state<Projectile[]>([]);

	let stage      = $state<HTMLDivElement | undefined>(undefined);
	let stageW     = 700;
	let speed      = INIT_SPEED;
	let frame      = 0;
	let spawnTimer = 70;
	let oid = 0, pid = 0;
	let scoredIds  = new Set<number>();
	let shieldTier = 0;

	// ─── Stage width ──────────────────────────────────────────────
	$effect(() => {
		if (!stage) return;
		const update = () => { stageW = stage!.offsetWidth; };
		update();
		const ro = new ResizeObserver(update);
		ro.observe(stage);
		return () => ro.disconnect();
	});

	// ─── Game loop ────────────────────────────────────────────────
	$effect(() => {
		if (gs !== 'playing') return;
		let raf: number;

		function tick() {
			frame++;
			speed = computeSpeed(score);
			if (invincible > 0) invincible--;

			velY += GRAVITY;
			botY -= velY;
			if (botY <= 0) { botY = 0; velY = 0; jumpsLeft = MAX_JUMPS; }

			for (const obs of obstacles) {
				const { w } = SIZES[obs.type];
				if (!scoredIds.has(obs.id) && obs.x + w < BOT_X) {
					scoredIds.add(obs.id); score++;
				}
			}

			const tier = Math.floor(score / 100);
			if (tier > shieldTier) {
				shieldCount += tier - shieldTier;
				shieldTier = tier;
				playShieldUp();
			}

			const killedProj = new Set<number>();
			const killedObs  = new Set<number>();
			for (const p of projectiles) {
				for (const obs of obstacles) {
					if (killedProj.has(p.id) || killedObs.has(obs.id)) continue;
					const { w } = SIZES[obs.type];
					if (p.x + 10 >= obs.x && p.x <= obs.x + w) {
						killedProj.add(p.id); killedObs.add(obs.id);
						score++; playHit();
					}
				}
			}

			projectiles = projectiles
				.map(p => ({ ...p, x: p.x + PROJ_SPEED[p.type] }))
				.filter(p => p.x < stageW + 20 && !killedProj.has(p.id));

			obstacles = obstacles
				.map(o => ({ ...o, x: o.x - speed }))
				.filter(o => o.x > -80 && !killedObs.has(o.id));

			spawnTimer--;
			if (spawnTimer <= 0) {
				const type = TYPES[Math.floor(Math.random() * TYPES.length)];
				obstacles = [...obstacles, { id: oid++, x: stageW + 10, type }];
				const gap = SPAWN_MIN + Math.random() * SPAWN_RAND;
				spawnTimer = Math.max(MIN_SPAWN_FRM, Math.round(gap / speed));
			}

			const PAD = 6;
			for (const obs of obstacles) {
				const { w, h } = SIZES[obs.type];
				const hOk = BOT_X + BOT_W - PAD > obs.x + PAD && BOT_X + PAD < obs.x + w - PAD;
				const vOk = botY < h - PAD;
				if (hOk && vOk && invincible === 0) {
					if (shieldCount > 0) {
						shieldCount--; invincible = INVINCIBLE_F; playShieldHit();
					} else {
						if (score > highScore) highScore = score;
						gs = 'dead'; playDie(); return;
					}
				}
			}

			raf = requestAnimationFrame(tick);
		}

		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	// ─── Input ────────────────────────────────────────────────────
	function handleStageClick() {
		if (minimized) return;
		if (gs !== 'playing') { startGame(); return; }
		if (score >= 300) {
			fireProjectile(score >= 500 ? 'bullet' : 'arrow');
		} else {
			jump();
		}
	}

	function handleKey(e: KeyboardEvent) {
		if (minimized) return;
		if (!['Space', 'Enter', 'ArrowUp'].includes(e.code)) return;
		e.preventDefault();
		if (gs !== 'playing') { startGame(); return; }
		jump();
	}

	function minimize() {
		if (gs === 'playing') quitGame();
		restoring = false;
		minimized = true;
	}

	function restore() {
		restoring = true;
		minimized = false;
		setTimeout(() => { restoring = false; }, 480);
	}

	function startGame() {
		botY = 0; velY = 0; jumpsLeft = MAX_JUMPS;
		score = 0; frame = 0; speed = INIT_SPEED;
		obstacles = []; projectiles = []; spawnTimer = 70;
		scoredIds = new Set(); shieldTier = 0; shieldCount = 0; invincible = 0;
		gs = 'playing';
	}

	function quitGame() {
		botY = 0; velY = 0; jumpsLeft = MAX_JUMPS;
		score = 0; frame = 0; speed = INIT_SPEED;
		obstacles = []; projectiles = []; spawnTimer = 70;
		scoredIds = new Set(); shieldTier = 0; shieldCount = 0; invincible = 0;
		gs = 'idle';
	}

	function jump() {
		if (jumpsLeft <= 0) return;
		const isDouble = jumpsLeft < MAX_JUMPS;
		velY = isDouble ? JUMP2 : JUMP1;
		jumpsLeft--;
		playJump(isDouble);
	}

	function fireProjectile(type: 'bullet' | 'arrow') {
		projectiles = [...projectiles, { id: pid++, x: BOT_X + BOT_W + 4, type }];
		if (type === 'bullet') playShoot(); else playBow();
	}

	// ─── Audio ────────────────────────────────────────────────────
	let audioCtx: AudioContext | null = null;
	function actx() {
		if (!audioCtx) audioCtx = new AudioContext();
		return audioCtx;
	}

	function playJump(isDouble: boolean) {
		const c = actx(); const o = c.createOscillator(); const g = c.createGain();
		o.connect(g); g.connect(c.destination); o.type = 'square';
		o.frequency.setValueAtTime(isDouble ? 330 : 220, c.currentTime);
		o.frequency.exponentialRampToValueAtTime(isDouble ? 660 : 440, c.currentTime + 0.12);
		g.gain.setValueAtTime(0.07, c.currentTime);
		g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
		o.start(c.currentTime); o.stop(c.currentTime + 0.15);
	}

	function playShoot() {
		const c = actx(); const o = c.createOscillator(); const g = c.createGain();
		o.connect(g); g.connect(c.destination); o.type = 'square';
		o.frequency.setValueAtTime(900, c.currentTime);
		o.frequency.exponentialRampToValueAtTime(500, c.currentTime + 0.06);
		g.gain.setValueAtTime(0.08, c.currentTime);
		g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
		o.start(c.currentTime); o.stop(c.currentTime + 0.08);
	}

	function playBow() {
		const c = actx(); const o = c.createOscillator(); const g = c.createGain();
		o.connect(g); g.connect(c.destination); o.type = 'triangle';
		o.frequency.setValueAtTime(520, c.currentTime);
		o.frequency.exponentialRampToValueAtTime(260, c.currentTime + 0.22);
		g.gain.setValueAtTime(0.07, c.currentTime);
		g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.28);
		o.start(c.currentTime); o.stop(c.currentTime + 0.28);
	}

	function playHit() {
		const c = actx(); const o = c.createOscillator(); const g = c.createGain();
		o.connect(g); g.connect(c.destination); o.type = 'square';
		o.frequency.setValueAtTime(660, c.currentTime);
		o.frequency.exponentialRampToValueAtTime(220, c.currentTime + 0.07);
		g.gain.setValueAtTime(0.07, c.currentTime);
		g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.09);
		o.start(c.currentTime); o.stop(c.currentTime + 0.09);
	}

	function playShieldHit() {
		const c = actx(); const o = c.createOscillator(); const g = c.createGain();
		o.connect(g); g.connect(c.destination); o.type = 'square';
		o.frequency.setValueAtTime(180, c.currentTime);
		o.frequency.linearRampToValueAtTime(320, c.currentTime + 0.18);
		g.gain.setValueAtTime(0.1, c.currentTime);
		g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.22);
		o.start(c.currentTime); o.stop(c.currentTime + 0.22);
	}

	function playShieldUp() {
		const c = actx();
		[0, 0.08, 0.16].forEach((d, i) => {
			const o = c.createOscillator(); const g = c.createGain();
			o.connect(g); g.connect(c.destination); o.type = 'square';
			o.frequency.setValueAtTime(330 + i * 110, c.currentTime + d);
			g.gain.setValueAtTime(0.07, c.currentTime + d);
			g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + d + 0.09);
			o.start(c.currentTime + d); o.stop(c.currentTime + d + 0.09);
		});
	}

	function playDie() {
		const c = actx();
		[0, 0.1, 0.22].forEach((d, i) => {
			const o = c.createOscillator(); const g = c.createGain();
			o.connect(g); g.connect(c.destination); o.type = 'square';
			o.frequency.setValueAtTime(280 - i * 70, c.currentTime + d);
			g.gain.setValueAtTime(0.09, c.currentTime + d);
			g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + d + 0.1);
			o.start(c.currentTime + d); o.stop(c.currentTime + d + 0.1);
		});
	}
</script>

<svelte:window onkeydown={handleKey} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="game-outer"
	class:restoring
	style="height: {minimized ? 0 : STAGE_H}px"
>
	<div
		class="stage"
		class:minimized
		class:restoring
		bind:this={stage}
		onclick={handleStageClick}
		style="height: {STAGE_H}px"
	>
		<!-- ── Yellow minimize dot ─────────────────────────────────── -->
		<button
			class="yellow-dot"
			title="Minimize"
			onclick={(e) => { e.stopPropagation(); minimize(); }}
		></button>

		<!-- HUD -->
		{#if gs !== 'idle'}
			<div class="hud">
				<span>Score: {score}</span>
				<span class="hi">Best: {highScore}</span>
				{#if shieldCount > 0}
					<span class="shield-hud">
						{#each { length: Math.min(shieldCount, 6) } as _}◈{/each}{shieldCount > 6 ? `+${shieldCount - 6}` : ''}
					</span>
				{/if}
				{#if weaponType === 'gun'}
					<span class="weapon-label gun-label">🔫 GUN</span>
				{:else if weaponType === 'bow'}
					<span class="weapon-label bow-label">🏹 BOW</span>
				{/if}
			</div>
			{#if weaponType && gs === 'playing'}
				<div class="shoot-hint">Click to shoot · ↑ to jump</div>
			{/if}
		{/if}

		<!-- Idle overlay -->
		{#if gs === 'idle'}
			<div class="overlay">
				<p class="callout-text">This is my side-kick, Mr. Claude</p>
				<svg class="callout-arrow" viewBox="0 0 38 28" width="38" height="28" fill="none" aria-hidden="true">
					<path d="M4,4 C8,12 22,20 34,24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
					<path d="M29,22 L34,24 L31,19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
				<p class="prompt flash">Click · Space · ↑ to start</p>
				<div class="milestones">
					<span>🛡 100</span>
					<span>🏹 300</span>
					<span>🔫 500</span>
				</div>
			</div>
		{/if}

		<!-- Game over overlay -->
		{#if gs === 'dead'}
			<div class="overlay dead-overlay">
				<p class="game-over-text">GAME OVER</p>
				<p class="score-text">Score: {score}{score > 0 && score >= highScore ? ' 🏆' : ''}</p>
				<div class="dead-actions">
					<span class="prompt-inline flash">Click · Space · ↑ to retry</span>
					<span class="divider">or</span>
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<span class="quit-btn" onclick={(e) => { e.stopPropagation(); quitGame(); }}>Quit</span>
				</div>
			</div>
		{/if}

		<!-- Ground track -->
		<div class="track" style="bottom: {GROUND}px"></div>

		<!-- Projectiles -->
		{#each projectiles as p (p.id)}
			{#if p.type === 'bullet'}
				<div class="bullet" style="left: {p.x}px; bottom: {GROUND + 11}px"></div>
			{:else}
				<div class="arrow-shot" style="left: {p.x}px; bottom: {GROUND + 10}px"></div>
			{/if}
		{/each}

		<!-- Bot -->
		<div
			class="bot"
			class:jumping={isJumping}
			class:dead={gs === 'dead'}
			class:blinking={invincible > 0}
			style="left: {BOT_X}px; bottom: {GROUND + botY}px"
		>
			{#if shieldCount > 0}
				<div class="shield-icon">
					{#if shieldCount > 1}<span class="shield-count">{shieldCount}</span>{/if}
				</div>
			{/if}
			<div class="bob" class:paused={isJumping || gs !== 'playing'}>
				<div class="body">
					<div class="arm l"></div>
					<div class="arm r"></div>
					<div class="eye l"></div>
					<div class="eye r"></div>
					{#if weaponType === 'gun'}
						<div class="gun-barrel"></div>
					{:else if weaponType === 'bow'}
						<div class="bow-arm"></div>
					{/if}
				</div>
				<div class="legs" class:paused={isJumping || gs !== 'playing'}>
					<div class="leg"></div>
					<div class="leg"></div>
					<div class="leg"></div>
					<div class="leg"></div>
				</div>
			</div>
		</div>

		<!-- Obstacles -->
		{#each obstacles as obs (obs.id)}
			<div class="obs obs-bug" style="left: {obs.x}px; bottom: {GROUND}px">
				<svg
					viewBox="0 0 32 26"
					width={SIZES[obs.type].w}
					height={SIZES[obs.type].h}
					shape-rendering="crispEdges"
					aria-label="Bug"
				>
					<rect x="6"  y="0"  width="4"  height="4" fill="#ef4444"/>
					<rect x="22" y="0"  width="4"  height="4" fill="#ef4444"/>
					<rect x="6"  y="4"  width="20" height="4" fill="#ef4444"/>
					<rect x="2"  y="8"  width="28" height="4" fill="#ef4444"/>
					<rect x="0"  y="12" width="32" height="4" fill="#ef4444"/>
					<rect x="0"  y="16" width="32" height="4" fill="#ef4444"/>
					<rect x="6"  y="16" width="4"  height="4" fill="#111"/>
					<rect x="22" y="16" width="4"  height="4" fill="#111"/>
					<rect x="0"  y="20" width="32" height="2"  fill="#b91c1c"/>
					<rect x="0"  y="22" width="4"  height="4" fill="#b91c1c"/>
					<rect x="8"  y="22" width="4"  height="4" fill="#b91c1c"/>
					<rect x="20" y="22" width="4"  height="4" fill="#b91c1c"/>
					<rect x="28" y="22" width="4"  height="4" fill="#b91c1c"/>
				</svg>
			</div>
		{/each}
	</div>
</div>

<!-- Restore pill — appears after game minimizes -->
{#if minimized}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="restore-pill" onclick={restore}>
		<span class="restore-dot"></span>
		Mr. Claude's Game
	</div>
{/if}

<style>
	/* ─── Layout shell ──────────────────────────────────────────── */
	.game-outer {
		width: 100%;
		overflow: hidden;
		transition: height 0.38s cubic-bezier(0.4, 0, 0.2, 1) 0.06s;
	}

	.game-outer.restoring {
		transition: height 0.01s;
	}

	/* ─── Stage (visual layer) ──────────────────────────────────── */
	.stage {
		position: relative;
		width: 100%;
		overflow: hidden;
		cursor: pointer;
		user-select: none;
		transform-origin: center bottom;
		transition:
			transform 0.32s cubic-bezier(0.4, 0, 0.8, 1),
			opacity   0.28s ease;
	}

	.stage.restoring {
		transition:
			transform 0.44s cubic-bezier(0.34, 1.3, 0.64, 1),
			opacity   0.3s  ease;
	}

	.stage.minimized {
		transform: scaleY(0) scaleX(0.45);
		opacity: 0;
		pointer-events: none;
	}

	/* ─── Yellow minimize dot ───────────────────────────────────── */
	.yellow-dot {
		position: absolute;
		top: 9px;
		left: 12px;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: #febc2e;
		border: none;
		padding: 0;
		cursor: pointer;
		z-index: 20;
		box-shadow: inset 0 1px 1px oklch(1 0 0 / 0.3);
		transition: filter 0.15s, transform 0.1s;
	}

	.yellow-dot:hover  { filter: brightness(1.15); transform: scale(1.15); }
	.yellow-dot:active { transform: scale(0.88); }

	/* ─── Restore pill ──────────────────────────────────────────── */
	.restore-pill {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 5px 14px 5px 10px;
		border: 1px solid var(--color-ash-700);
		border-radius: 20px;
		background: none;
		color: var(--color-ash-500);
		font-size: 0.68rem;
		font-family: monospace;
		cursor: pointer;
		transition: color 0.15s, border-color 0.15s, background 0.15s;
		/* Fades in after the minimize animation finishes */
		animation: pill-in 0.28s ease 0.3s backwards;
	}

	.restore-pill:hover {
		color: var(--color-ash-200);
		border-color: var(--color-ash-400);
		background: oklch(0.2 0 0 / 0.3);
	}

	.restore-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #febc2e;
		flex-shrink: 0;
		box-shadow: 0 0 5px #febc2e88;
	}

	@keyframes pill-in {
		from { opacity: 0; transform: translateY(6px); }
		to   { opacity: 1; transform: translateY(0); }
	}

	/* ─── Track ─────────────────────────────────────────────────── */
	.track {
		position: absolute;
		left: 0; right: 0;
		border-top: 2px dashed var(--color-ash-600);
		pointer-events: none;
	}

	/* ─── HUD ───────────────────────────────────────────────────── */
	.hud {
		position: absolute;
		top: 8px; right: 16px;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 2px;
		font-size: 0.72rem;
		font-family: monospace;
		color: var(--color-ash-400);
		pointer-events: none;
		z-index: 10;
	}

	.hi         { font-size: 0.65rem; color: var(--color-ash-500); }
	.shield-hud { font-size: 0.7rem; color: #60a5fa; letter-spacing: 0.05em; }

	.weapon-label { font-size: 0.65rem; animation: wpulse 0.7s ease-in-out infinite alternate; }
	.gun-label    { color: #fbbf24; }
	.bow-label    { color: #86efac; }

	@keyframes wpulse { from { opacity: 1; } to { opacity: 0.4; } }

	.shoot-hint {
		position: absolute;
		bottom: 28px; left: 50%;
		transform: translateX(-50%);
		font-size: 0.62rem;
		font-family: monospace;
		color: var(--color-ash-500);
		white-space: nowrap;
		pointer-events: none;
		z-index: 10;
	}

	/* ─── Overlays ──────────────────────────────────────────────── */
	.overlay {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: flex-start;
		padding: 8px 20px 8px 34px;
		pointer-events: none;
		z-index: 10;
	}

	.dead-overlay {
		align-items: center;
		justify-content: center;
		padding: 0;
		background: oklch(0.1 0 0 / 0.6);
		pointer-events: auto;
	}

	.callout-text {
		font-size: 0.7rem;
		font-style: italic;
		color: var(--color-ash-500);
		line-height: 1;
		margin: 0;
		white-space: nowrap;
	}

	.callout-arrow {
		color: var(--color-ash-500);
		margin-top: 2px;
		margin-left: 10px;
	}

	.prompt {
		position: absolute;
		bottom: 42px; left: 50%;
		transform: translateX(-50%);
		font-size: 0.72rem;
		font-family: monospace;
		color: var(--color-ash-400);
		white-space: nowrap;
		margin: 0;
	}

	.milestones {
		position: absolute;
		bottom: 26px; right: 16px;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 1px;
		font-size: 0.58rem;
		font-family: monospace;
		color: var(--color-ash-600);
		pointer-events: none;
	}

	.game-over-text {
		font-size: 1.4rem;
		font-family: monospace;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: var(--color-ash-200);
		margin: 0 0 4px;
	}

	.score-text {
		font-size: 0.85rem;
		font-family: monospace;
		color: var(--color-ash-300);
		margin: 0 0 10px;
	}

	.dead-actions {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 0.72rem;
		font-family: monospace;
	}

	.prompt-inline { color: var(--color-ash-400); white-space: nowrap; }
	.divider       { color: var(--color-ash-600); }

	.quit-btn {
		color: var(--color-ash-400);
		cursor: pointer;
		padding: 2px 8px;
		border: 1px solid var(--color-ash-600);
		border-radius: 3px;
		transition: color 0.15s, border-color 0.15s;
	}

	.quit-btn:hover { color: var(--color-ash-200); border-color: var(--color-ash-400); }

	.flash { animation: flash 1s ease-in-out infinite alternate; }

	@keyframes flash { from { opacity: 1; } to { opacity: 0.3; } }

	/* ─── Projectiles ───────────────────────────────────────────── */
	.bullet {
		position: absolute;
		width: 10px; height: 4px;
		background: #fcd34d;
		border-radius: 2px;
		box-shadow: 0 0 6px #f59e0b;
		pointer-events: none;
	}

	.arrow-shot {
		position: absolute;
		width: 18px; height: 2px;
		background: #92400e;
		pointer-events: none;
	}

	.arrow-shot::before {
		content: '';
		position: absolute;
		right: -7px; top: -4px;
		border-left: 8px solid #fbbf24;
		border-top: 5px solid transparent;
		border-bottom: 5px solid transparent;
	}

	/* ─── Bot ───────────────────────────────────────────────────── */
	.bot { position: absolute; }

	.shield-icon {
		position: absolute;
		left: -14px; top: 7px;
		width: 10px; height: 14px;
		background: #3b82f6;
		clip-path: polygon(0 0, 100% 0, 100% 65%, 50% 100%, 0 65%);
	}

	.shield-count {
		position: absolute;
		top: -6px; left: 50%;
		transform: translateX(-50%);
		font-size: 7px;
		font-family: monospace;
		font-weight: 700;
		color: #fff;
		line-height: 1;
	}

	.blinking .body,
	.blinking .arm,
	.blinking .leg,
	.blinking .eye { animation: blink 0.12s linear infinite; }

	@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.15; } }

	.bob { animation: bob 0.46s ease-in-out infinite alternate; }
	.bob.paused { animation: none; }

	@keyframes bob { from { transform: translateY(0); } to { transform: translateY(-4px); } }

	.body {
		position: relative;
		width: 40px; height: 28px;
		background: #f97316;
		margin: 0 5px;
	}

	.dead .body { background: #dc2626; filter: brightness(0.7); }

	.eye {
		position: absolute;
		width: 8px; height: 11px;
		background: oklch(0.1 0 0);
		top: 6px;
	}

	.eye.l { left: 6px; }
	.eye.r { right: 6px; }

	.arm {
		position: absolute;
		width: 5px; height: 9px;
		background: #f97316;
		top: 8px;
	}

	.arm.l { left: -5px; }
	.arm.r { right: -5px; }

	.gun-barrel {
		position: absolute;
		right: -16px; top: 8px;
		width: 16px; height: 6px;
		background: #94a3b8;
		border-radius: 0 3px 3px 0;
	}

	.gun-barrel::before {
		content: '';
		position: absolute;
		left: 0; top: -3px;
		width: 8px; height: 4px;
		background: #64748b;
		border-radius: 2px 2px 0 0;
	}

	.bow-arm {
		position: absolute;
		right: -13px; top: 3px;
		width: 5px; height: 22px;
		border: 3px solid #92400e;
		border-left: none;
		border-radius: 0 10px 10px 0;
	}

	.bow-arm::after {
		content: '';
		position: absolute;
		right: -2px; top: 2px;
		width: 2px; height: 14px;
		background: #fbbf24;
	}

	.legs { display: flex; justify-content: space-evenly; padding: 0 6px; }

	.leg {
		width: 7px; height: 10px;
		background: #f97316;
		animation: step 0.38s ease-in-out infinite alternate;
	}

	.leg:nth-child(even) { animation-delay: 0.19s; }
	.legs.paused .leg    { animation: none; }

	@keyframes step { from { transform: translateY(0); } to { transform: translateY(3px); } }

	.jumping .body { transform: scaleY(1.1) translateY(-2px); }

	/* ─── Obstacles ─────────────────────────────────────────────── */
	.obs { position: absolute; }

	.obs-bug svg { animation: bugwalk 0.32s linear infinite alternate; }

	@keyframes bugwalk { from { transform: translateY(0); } to { transform: translateY(2px); } }

	/* ─── Reduced motion ─────────────────────────────────────────── */
	@media (prefers-reduced-motion: reduce) {
		.game-outer, .stage { transition: none; }
		.bob, .leg, .obs-bug svg, .blinking .body { animation: none; }
		.restore-pill { animation: none; }
	}
</style>

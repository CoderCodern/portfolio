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

	const INIT_SPEED    = 6.0;
	const SPAWN_MIN     = 460;
	const SPAWN_RAND    = 300;
	const MIN_SPAWN_FRM = 58;
	const INVINCIBLE_F  = 90;

	const BULLET_SPEED   = 17;
	const ARROW_SPEED_X  = 8;
	const ARROW_INIT_VY  = 4.5;   // initial upward velocity (px/frame)
	const ARROW_GRAV     = 0.18;  // gravity applied each frame
	const FIRE_Y_OFFSET  = 20;    // height above bot feet where projectiles spawn

	const BOW_AMMO_MAX   = 6;
	const BOW_REGEN_F    = 120;   // 1 arrow per 2 seconds
	const GUN_AMMO_MAX   = 3;
	const GUN_REGEN_F    = 120;   // 1 bullet per 2 seconds
	const BOT_H          = 38;    // total bot height (body + legs)

	const BAZOOKA_AMMO_MAX   = 1;
	const BAZOOKA_RECHARGE_F = 300;   // 5 s at 60 fps
	const BAZOOKA_SPEED_X    = 6;
	const BAZOOKA_INIT_VY    = 5.0;
	const FLAME_FRAMES       = 120;   // 2 s
	const FLAME_W            = 80;    // explosion width px
	const FLAME_H            = 70;    // explosion height px

	const BOSS_MILESTONE     = 1000;  // spawn boss every N pts
	const BOSS_HP_MAX        = 100;
	const BOSS_W             = 72;
	const BOSS_H             = 60;
	const BOSS_SHOOT_F       = 80;    // frames between boss shots
	const BOSS_PROJ_SPEED    = 6;
	const BOSS_PROJ_W        = 20;
	const BOSS_PROJ_H        = 16;
	const BOSS_DMG_BOW       = 2;
	const BOSS_DMG_GUN       = 5;
	const BOSS_DMG_ROCKET    = 10;

	type OType = 'bug-sm' | 'bug-md' | 'bug-lg';
	const TYPES: OType[] = ['bug-sm', 'bug-sm', 'bug-md', 'bug-md', 'bug-md', 'bug-lg'];
	const SIZES: Record<OType, { w: number; h: number }> = {
		'bug-sm': { w: 24, h: 20 },
		'bug-md': { w: 32, h: 26 },
		'bug-lg': { w: 40, h: 32 },
	};

	// ─── Speed per phase ──────────────────────────────────────────
	function computeSpeed(s: number): number {
		if (s < 100) return Math.min(10, INIT_SPEED + s * 0.05);
		if (s < 300) return Math.min(14, 10 + (s - 100) * 0.024);
		return          Math.min(18, 14 + (s - 300) * 0.02);
	}

	const POINTS: Record<OType, number> = {
		'bug-sm': 1,
		'bug-md': 2,
		'bug-lg': 3,
	};

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
	let weaponPrefer = $state<'bow' | 'gun' | 'bazooka'>('gun');
	let showHelp     = $state(false);
	let weaponType   = $derived(
		score >= 800 ? weaponPrefer :
		score >= 500 ? (weaponPrefer === 'bazooka' ? 'gun' : weaponPrefer) :
		score >= 300 ? 'bow' as const :
		null
	);

	interface Obs        { id: number; x: number; type: OType; flyY: number; }
	interface Projectile { id: number; x: number; y: number; velX: number; velY: number; type: 'bullet' | 'arrow' | 'rocket'; }
	interface Flame      { id: number; x: number; y: number; framesLeft: number; }
	interface Boss     { hp: number; x: number; flashF: number; shootTimer: number; }
	interface BossProj { id: number; x: number; y: number; }
	let obstacles   = $state<Obs[]>([]);
	let projectiles = $state<Projectile[]>([]);
	let flames      = $state<Flame[]>([]);
	let boss        = $state<Boss | null>(null);
	let bossProjs   = $state<BossProj[]>([]);

	let stage      = $state<HTMLDivElement | undefined>(undefined);
	let stageW     = 700;
	let speed      = INIT_SPEED;
	let frame      = 0;
	let spawnTimer = 70;
	let oid = 0, pid = 0, eid = 0, bid = 0;
	let lastBossMark = 0;
	let scoredIds  = new Set<number>();
	let shieldTier = 0;
	let bowAmmo        = $state(BOW_AMMO_MAX);
	let bowRechargeT   = $state(0);
	let gunAmmo        = $state(GUN_AMMO_MAX);
	let gunRechargeT   = $state(0);
	let bazookaAmmo    = $state(BAZOOKA_AMMO_MAX);
	let bazookaRchgT   = $state(0);

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
		if (gs !== 'playing' || showHelp) return;
		let raf: number;

		function tick() {
			frame++;
			speed = computeSpeed(score);
			if (invincible > 0) invincible--;
			if (bowRechargeT > 0) { bowRechargeT--; if (bowRechargeT === 0 && bowAmmo < BOW_AMMO_MAX) { bowAmmo++; if (bowAmmo < BOW_AMMO_MAX) bowRechargeT = BOW_REGEN_F; } }
			if (gunRechargeT > 0) { gunRechargeT--; if (gunRechargeT === 0 && gunAmmo < GUN_AMMO_MAX) { gunAmmo++; if (gunAmmo < GUN_AMMO_MAX) gunRechargeT = GUN_REGEN_F; } }
			if (bazookaRchgT > 0) { bazookaRchgT--; if (bazookaRchgT === 0) bazookaAmmo = BAZOOKA_AMMO_MAX; }

			velY += GRAVITY;
			botY -= velY;
			if (botY <= 0) { botY = 0; velY = 0; jumpsLeft = MAX_JUMPS; }

			for (const obs of obstacles) {
				const { w } = SIZES[obs.type];
				if (!scoredIds.has(obs.id) && obs.x + w < BOT_X) {
					scoredIds.add(obs.id); score += POINTS[obs.type];
				}
			}

			const tier = Math.floor(score / 100);
			if (tier > shieldTier) {
				shieldCount += tier - shieldTier;
				shieldTier = tier;
				playShieldUp();
			}

			// Boss milestone
			if (boss === null) {
				const mark = Math.floor(score / BOSS_MILESTONE);
				if (mark > lastBossMark && score > 0) {
					lastBossMark = mark;
					boss = { hp: BOSS_HP_MAX, x: Math.round(stageW * 0.62), flashF: 0, shootTimer: BOSS_SHOOT_F };
					bossProjs = [];
					obstacles = [];
					spawnTimer = 9999;
					playBossAppear();
				}
			}

			// Player projectiles vs boss
			if (boss) {
				for (const p of projectiles) {
					const xOk = p.x + 10 >= boss.x && p.x <= boss.x + BOSS_W;
					const yOk = p.y + 4 >= 0 && p.y <= BOSS_H;
					if (xOk && yOk) {
						const dmg = p.type === 'rocket' ? BOSS_DMG_ROCKET : p.type === 'bullet' ? BOSS_DMG_GUN : BOSS_DMG_BOW;
						const newHp = boss.hp - dmg;
						if (p.type === 'rocket') {
							flames = [...flames, { id: eid++, x: boss.x + BOSS_W / 2, y: Math.floor(BOSS_H / 2), framesLeft: FLAME_FRAMES }];
							playExplosion();
						} else { playHit(); }
						if (newHp <= 0) {
							flames = [...flames,
								{ id: eid++, x: boss.x + BOSS_W / 2, y: Math.floor(BOSS_H / 2), framesLeft: FLAME_FRAMES },
								{ id: eid++, x: boss.x + 18, y: 8, framesLeft: Math.floor(FLAME_FRAMES * 0.75) },
								{ id: eid++, x: boss.x + 54, y: 8, framesLeft: Math.floor(FLAME_FRAMES * 0.65) }
							];
							score += 50;
							boss = null; bossProjs = [];
							spawnTimer = 100;
							playBossDie();
						} else {
							boss = { ...boss, hp: newHp, flashF: 8 };
						}
						// consume the projectile (mark it — using a local set just for boss hits)
						// We break to avoid double-hit
						break;
					}
				}
				// Remove boss-consumed projectiles (those that just hit boss)
				// We'll re-filter after; for now keep killedProj logic untouched.
				// Tick boss shoot timer
				if (boss) {
					boss = { ...boss, shootTimer: boss.shootTimer - 1, flashF: Math.max(0, boss.flashF - 1) };
					if (boss.shootTimer <= 0) {
						const heights = [0, 20, 40, 60];
						const y = heights[Math.floor(Math.random() * heights.length)];
						bossProjs = [...bossProjs, { id: bid++, x: boss.x - 4, y }];
						boss = { ...boss, shootTimer: BOSS_SHOOT_F };
						playBossShoot();
					}
				}
				// Move boss projectiles
				bossProjs = bossProjs.map(p => ({ ...p, x: p.x - BOSS_PROJ_SPEED })).filter(p => p.x > -30);
			}

			const killedProj = new Set<number>();
			const killedObs  = new Set<number>();
			for (const p of projectiles) {
				for (const obs of obstacles) {
					if (killedProj.has(p.id) || killedObs.has(obs.id)) continue;
					const { w, h } = SIZES[obs.type];
					const xOk = p.x + 10 >= obs.x && p.x <= obs.x + w;
					const yOk = p.y + 4 >= obs.flyY && p.y <= obs.flyY + h;
					if (xOk && yOk) {
						killedProj.add(p.id); killedObs.add(obs.id);
						if (!scoredIds.has(obs.id)) { scoredIds.add(obs.id); score += POINTS[obs.type]; }
						if (p.type === 'rocket') {
							flames = [...flames, { id: eid++, x: obs.x + w / 2, y: Math.max(0, obs.flyY), framesLeft: FLAME_FRAMES }];
							playExplosion();
						} else { playHit(); }
					}
				}
			}

			// Flame vs obstacles — all bugs entering an active flame zone die
			for (const f of flames) {
				for (const obs of obstacles) {
					if (killedObs.has(obs.id)) continue;
					const { w, h } = SIZES[obs.type];
					const inX = obs.x + w > f.x - FLAME_W / 2 && obs.x < f.x + FLAME_W / 2;
					const inY = obs.flyY < f.y + FLAME_H && obs.flyY + h > f.y;
					if (inX && inY) {
						killedObs.add(obs.id);
						if (!scoredIds.has(obs.id)) { scoredIds.add(obs.id); score += POINTS[obs.type]; playHit(); }
					}
				}
			}

			const groundFlames: Flame[] = [];
			projectiles = projectiles
				.map(p => {
					const isArc = p.type === 'arrow' || p.type === 'rocket';
					const newVelY = isArc ? p.velY - ARROW_GRAV : 0;
					return { ...p, x: p.x + p.velX, y: p.y + p.velY, velY: newVelY };
				})
				.filter(p => {
					if (killedProj.has(p.id)) return false;
					if (p.type === 'rocket' && p.y <= 0) {
						groundFlames.push({ id: eid++, x: p.x, y: 0, framesLeft: FLAME_FRAMES });
						playExplosion();
						return false;
					}
					return p.x < stageW + 20 && p.y > -20;
				});
			if (groundFlames.length) flames = [...flames, ...groundFlames];

			obstacles = obstacles
				.map(o => ({ ...o, x: o.x - speed }))
				.filter(o => o.x > -80 && !killedObs.has(o.id));
			flames = flames.map(f => ({ ...f, framesLeft: f.framesLeft - 1 })).filter(f => f.framesLeft > 0);

			if (!boss) spawnTimer--;
			if (!boss && spawnTimer <= 0) {
				const type  = TYPES[Math.floor(Math.random() * TYPES.length)];
				const flyY  = Math.random() < 0.25 ? (Math.random() < 0.5 ? 20 : 60) : 0;
				obstacles = [...obstacles, { id: oid++, x: stageW + 10, type, flyY }];
				const gap = SPAWN_MIN + Math.random() * SPAWN_RAND;
				spawnTimer = Math.max(MIN_SPAWN_FRM, Math.round(gap / speed));
			}

			const PAD = 6;
			let shieldKillId = -1;
			for (const obs of obstacles) {
				const { w, h } = SIZES[obs.type];
				const hOk = BOT_X + BOT_W - PAD > obs.x + PAD && BOT_X + PAD < obs.x + w - PAD;
				const vOk = botY + BOT_H > obs.flyY + PAD && botY < obs.flyY + h - PAD;
				if (hOk && vOk && invincible === 0) {
					if (shieldCount > 0) {
						shieldKillId = obs.id;
						if (!scoredIds.has(obs.id)) { scoredIds.add(obs.id); score += POINTS[obs.type]; }
						shieldCount--; invincible = INVINCIBLE_F; playShieldHit();
						break;
					} else {
						if (score > highScore) highScore = score;
						gs = 'dead'; playDie(); return;
					}
				}
			}
			if (shieldKillId !== -1) obstacles = obstacles.filter(o => o.id !== shieldKillId);

			// Boss projectiles vs player
			if (boss || bossProjs.length > 0) {
				let bpKillId = -1;
				for (const bp of bossProjs) {
					const hOk = BOT_X + BOT_W - 5 > bp.x + 5 && BOT_X + 5 < bp.x + BOSS_PROJ_W - 5;
					const vOk = botY + BOT_H > bp.y + 5 && botY < bp.y + BOSS_PROJ_H - 5;
					if (hOk && vOk && invincible === 0) {
						if (shieldCount > 0) {
							bpKillId = bp.id;
							shieldCount--; invincible = INVINCIBLE_F; playShieldHit();
							break;
						} else {
							if (score > highScore) highScore = score;
							gs = 'dead'; playDie(); return;
						}
					}
				}
				if (bpKillId !== -1) bossProjs = bossProjs.filter(p => p.id !== bpKillId);
			}

			raf = requestAnimationFrame(tick);
		}

		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	// ─── Input ────────────────────────────────────────────────────
	function handleStageClick() {
		if (minimized) return;
		if (showHelp) { showHelp = false; return; }
		if (gs !== 'playing') { startGame(); return; }
		if (weaponType) {
			fireProjectile(weaponType === 'gun' ? 'bullet' : weaponType === 'bazooka' ? 'rocket' : 'arrow');
		} else {
			jump();
		}
	}

	function cycleWeapon() {
		if (score >= 800) {
			weaponPrefer = weaponPrefer === 'bow' ? 'gun' : weaponPrefer === 'gun' ? 'bazooka' : 'bow';
		} else if (score >= 500) {
			weaponPrefer = weaponPrefer === 'gun' ? 'bow' : 'gun';
		}
	}

	function handleRightClick(e: MouseEvent) {
		e.preventDefault();
		if (minimized || gs !== 'playing' || score < 500) return;
		cycleWeapon();
	}

	function handleKey(e: KeyboardEvent) {
		if (minimized) return;
		if (e.code === 'KeyZ' && gs === 'playing' && score >= 500) {
			cycleWeapon();
			return;
		}
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
		obstacles = []; projectiles = []; flames = []; spawnTimer = 70;
		scoredIds = new Set(); shieldTier = 0; shieldCount = 0; invincible = 0;
		bowAmmo = BOW_AMMO_MAX; bowRechargeT = 0;
		gunAmmo = GUN_AMMO_MAX; gunRechargeT = 0;
		bazookaAmmo = BAZOOKA_AMMO_MAX; bazookaRchgT = 0;
		boss = null; bossProjs = []; lastBossMark = 0;
		showHelp = false;
		gs = 'playing';
	}

	function quitGame() {
		botY = 0; velY = 0; jumpsLeft = MAX_JUMPS;
		score = 0; frame = 0; speed = INIT_SPEED;
		obstacles = []; projectiles = []; flames = []; spawnTimer = 70;
		scoredIds = new Set(); shieldTier = 0; shieldCount = 0; invincible = 0;
		bowAmmo = BOW_AMMO_MAX; bowRechargeT = 0;
		gunAmmo = GUN_AMMO_MAX; gunRechargeT = 0;
		bazookaAmmo = BAZOOKA_AMMO_MAX; bazookaRchgT = 0;
		boss = null; bossProjs = []; lastBossMark = 0;
		gs = 'idle';
	}

	function jump() {
		if (jumpsLeft <= 0) return;
		const isDouble = jumpsLeft < MAX_JUMPS;
		velY = isDouble ? JUMP2 : JUMP1;
		jumpsLeft--;
		playJump(isDouble);
	}

	function fireProjectile(type: 'bullet' | 'arrow' | 'rocket') {
		if (type === 'bullet') {
			if (gunAmmo <= 0) return;
			gunAmmo--;
			if (gunRechargeT === 0) gunRechargeT = GUN_REGEN_F;
			projectiles = [...projectiles, {
				id: pid++, x: BOT_X + BOT_W + 4, y: botY + FIRE_Y_OFFSET,
				velX: BULLET_SPEED, velY: 0, type
			}];
			playShoot();
		} else if (type === 'arrow') {
			if (bowAmmo <= 0) return;
			bowAmmo--;
			if (bowRechargeT === 0) bowRechargeT = BOW_REGEN_F;
			projectiles = [...projectiles, {
				id: pid++, x: BOT_X + BOT_W + 4, y: botY + FIRE_Y_OFFSET,
				velX: ARROW_SPEED_X, velY: ARROW_INIT_VY, type
			}];
			playBow();
		} else {
			if (bazookaAmmo <= 0) return;
			bazookaAmmo--;
			if (bazookaAmmo === 0) bazookaRchgT = BAZOOKA_RECHARGE_F;
			projectiles = [...projectiles, {
				id: pid++, x: BOT_X + BOT_W + 4, y: botY + FIRE_Y_OFFSET,
				velX: BAZOOKA_SPEED_X, velY: BAZOOKA_INIT_VY, type
			}];
			playBazooka();
		}
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

	function playBazooka() {
		const c = actx();
		// Sharp initial crack
		const oc = c.createOscillator(); const gc = c.createGain();
		oc.connect(gc); gc.connect(c.destination); oc.type = 'sawtooth';
		oc.frequency.setValueAtTime(700, c.currentTime);
		oc.frequency.exponentialRampToValueAtTime(180, c.currentTime + 0.05);
		gc.gain.setValueAtTime(0.28, c.currentTime);
		gc.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.07);
		oc.start(c.currentTime); oc.stop(c.currentTime + 0.08);
		// Building whoosh
		const bufSize = Math.floor(c.sampleRate * 0.45);
		const buf = c.createBuffer(1, bufSize, c.sampleRate);
		const bd = buf.getChannelData(0);
		for (let i = 0; i < bufSize; i++) bd[i] = (Math.random() * 2 - 1) * (0.2 + 0.8 * (i / bufSize)) * (1 - i / bufSize * 0.6);
		const src = c.createBufferSource(); src.buffer = buf;
		const filt = c.createBiquadFilter(); filt.type = 'bandpass';
		filt.frequency.setValueAtTime(900, c.currentTime);
		filt.frequency.exponentialRampToValueAtTime(280, c.currentTime + 0.45);
		filt.Q.value = 0.5;
		const wg = c.createGain();
		src.connect(filt); filt.connect(wg); wg.connect(c.destination);
		wg.gain.setValueAtTime(0.32, c.currentTime + 0.02);
		wg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.48);
		src.start(c.currentTime + 0.02); src.stop(c.currentTime + 0.5);
		// Deep thump
		const ot = c.createOscillator(); const gt = c.createGain();
		ot.connect(gt); gt.connect(c.destination); ot.type = 'sine';
		ot.frequency.setValueAtTime(95, c.currentTime + 0.02);
		ot.frequency.exponentialRampToValueAtTime(32, c.currentTime + 0.28);
		gt.gain.setValueAtTime(0.0, c.currentTime); gt.gain.linearRampToValueAtTime(0.32, c.currentTime + 0.05);
		gt.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.32);
		ot.start(c.currentTime); ot.stop(c.currentTime + 0.35);
	}

	function playExplosion() {
		const c = actx();
		// Hard initial punch
		const op = c.createOscillator(); const gp = c.createGain();
		op.connect(gp); gp.connect(c.destination); op.type = 'sawtooth';
		op.frequency.setValueAtTime(850, c.currentTime);
		op.frequency.exponentialRampToValueAtTime(180, c.currentTime + 0.03);
		gp.gain.setValueAtTime(0.55, c.currentTime);
		gp.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04);
		op.start(c.currentTime); op.stop(c.currentTime + 0.05);
		// Noise burst
		const bufSize = Math.floor(c.sampleRate * 0.32);
		const buf = c.createBuffer(1, bufSize, c.sampleRate);
		const bd = buf.getChannelData(0);
		for (let i = 0; i < bufSize; i++) bd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 0.4);
		const src = c.createBufferSource(); src.buffer = buf;
		const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
		const ng = c.createGain();
		src.connect(lp); lp.connect(ng); ng.connect(c.destination);
		ng.gain.setValueAtTime(0.6, c.currentTime);
		ng.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35);
		src.start(c.currentTime); src.stop(c.currentTime + 0.38);
		// Sub boom
		const ob = c.createOscillator(); const gb = c.createGain();
		ob.connect(gb); gb.connect(c.destination); ob.type = 'sawtooth';
		ob.frequency.setValueAtTime(140, c.currentTime);
		ob.frequency.exponentialRampToValueAtTime(14, c.currentTime + 0.65);
		gb.gain.setValueAtTime(0.48, c.currentTime);
		gb.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.7);
		ob.start(c.currentTime); ob.stop(c.currentTime + 0.75);
		// Mid crunch
		const om = c.createOscillator(); const gm = c.createGain();
		om.connect(gm); gm.connect(c.destination); om.type = 'square';
		om.frequency.setValueAtTime(400, c.currentTime + 0.01);
		om.frequency.exponentialRampToValueAtTime(50, c.currentTime + 0.2);
		gm.gain.setValueAtTime(0.32, c.currentTime + 0.01);
		gm.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.24);
		om.start(c.currentTime + 0.01); om.stop(c.currentTime + 0.26);
		// Rumble tail
		const or = c.createOscillator(); const gr = c.createGain();
		or.connect(gr); gr.connect(c.destination); or.type = 'sine';
		or.frequency.setValueAtTime(52, c.currentTime + 0.06);
		or.frequency.exponentialRampToValueAtTime(22, c.currentTime + 0.95);
		gr.gain.setValueAtTime(0.14, c.currentTime + 0.06);
		gr.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.0);
		or.start(c.currentTime + 0.06); or.stop(c.currentTime + 1.05);
	}

	function playBossAppear() {
		const c = actx();
		[0, 0.14, 0.28, 0.42].forEach((d, i) => {
			const o = c.createOscillator(); const g = c.createGain();
			o.connect(g); g.connect(c.destination); o.type = 'square';
			o.frequency.setValueAtTime(i % 2 === 0 ? 160 : 220, c.currentTime + d);
			g.gain.setValueAtTime(0.14, c.currentTime + d);
			g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + d + 0.12);
			o.start(c.currentTime + d); o.stop(c.currentTime + d + 0.13);
		});
		const od = c.createOscillator(); const gd = c.createGain();
		od.connect(gd); gd.connect(c.destination); od.type = 'sawtooth';
		od.frequency.setValueAtTime(55, c.currentTime);
		gd.gain.setValueAtTime(0.18, c.currentTime);
		gd.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.9);
		od.start(c.currentTime); od.stop(c.currentTime + 1.0);
	}

	function playBossShoot() {
		const c = actx(); const o = c.createOscillator(); const g = c.createGain();
		o.connect(g); g.connect(c.destination); o.type = 'square';
		o.frequency.setValueAtTime(280, c.currentTime);
		o.frequency.linearRampToValueAtTime(140, c.currentTime + 0.1);
		g.gain.setValueAtTime(0.11, c.currentTime);
		g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.13);
		o.start(c.currentTime); o.stop(c.currentTime + 0.14);
	}

	function playBossDie() {
		const c = actx();
		[0, 0.1, 0.22, 0.38].forEach((d, i) => {
			const freqs = [330, 440, 550, 660];
			const o = c.createOscillator(); const g = c.createGain();
			o.connect(g); g.connect(c.destination); o.type = 'square';
			o.frequency.setValueAtTime(freqs[i], c.currentTime + d);
			g.gain.setValueAtTime(0.12, c.currentTime + d);
			g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + d + 0.11);
			o.start(c.currentTime + d); o.stop(c.currentTime + d + 0.12);
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
		oncontextmenu={handleRightClick}
		style="height: {STAGE_H}px"
	>
		<!-- ── Yellow minimize dot ─────────────────────────────────── -->
		<button
			class="yellow-dot"
			title="Minimize"
			onclick={(e) => { e.stopPropagation(); minimize(); }}
		></button>
		<button
			class="help-btn"
			title="How to play"
			onclick={(e) => { e.stopPropagation(); showHelp = !showHelp; }}
		>?</button>

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
					<span class="ammo-dots">
						{'●'.repeat(gunAmmo) + '○'.repeat(GUN_AMMO_MAX - gunAmmo)}
					</span>
					{#if score >= 500}<span class="switch-hint">[Z] → {score >= 800 ? '🚀' : '🏹'}</span>{/if}
				{:else if weaponType === 'bow'}
					<span class="weapon-label bow-label">🏹 BOW</span>
					<span class="ammo-dots">
						{'●'.repeat(bowAmmo) + '○'.repeat(BOW_AMMO_MAX - bowAmmo)}
					</span>
					{#if score >= 500}<span class="switch-hint">[Z] → {score >= 800 ? '🚀' : '🔫'}</span>{/if}
				{:else if weaponType === 'bazooka'}
					<span class="weapon-label baz-label">🚀 BAZOOKA</span>
					<span class="ammo-dots{bazookaAmmo === 0 ? ' reloading' : ''}">
						{bazookaAmmo > 0 ? '●' : `↻ ${Math.ceil(bazookaRchgT / 60)}s`}
					</span>
					<span class="switch-hint">[Z] → 🏹</span>
				{/if}
			</div>
			{#if weaponType && gs === 'playing'}
				<div class="shoot-hint">Click to shoot · ↑ to jump{score >= 500 ? ' · Z/R-click switch' : ''}</div>
			{/if}
			{#if boss}
				<div class="boss-hud">
					<span class="boss-hud-label">👾 BOSS</span>
					<div class="boss-hud-bar"><div class="boss-hud-fill" style="width: {boss.hp}%"></div></div>
					<span class="boss-hud-hp">{boss.hp}</span>
				</div>
			{/if}
		{/if}

		<!-- Help overlay -->
		{#if showHelp}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="help-overlay" onclick={(e) => { e.stopPropagation(); showHelp = false; }}>
				<div class="help-panel" onclick={(e) => e.stopPropagation()}>
					<div class="help-col">
						<div class="help-heading">Controls</div>
						<div class="help-row"><span class="hk">↑ Space</span><span>Jump</span></div>
						<div class="help-row"><span class="hk">↑↑</span><span>Double jump</span></div>
						<div class="help-row"><span class="hk">Click</span><span>Shoot</span></div>
						<div class="help-row"><span class="hk">Z / R-click</span><span>Switch weapon</span></div>
					</div>
					<div class="help-col">
						<div class="help-heading">Milestones</div>
						<div class="help-row"><span>🛡 100</span><span>Shield</span></div>
						<div class="help-row"><span>🏹 300</span><span>Bow · 6 arrows · arc</span></div>
						<div class="help-row"><span>🔫 500</span><span>Gun · 3 shots · straight</span></div>
						<div class="help-row"><span>🚀 800</span><span>Bazooka · 1 shot · explodes</span></div>
						<div class="help-row"><span>👾 1000</span><span>Boss · 100 HP · shoots back</span></div>
						<div class="help-row"><span>✈</span><span>Flying bugs · dodge or shoot</span></div>
					</div>
				</div>
				<div class="help-close-hint">click outside to close</div>
			</div>
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
					<span>🚀 800</span>
					<span>👾 1k</span>
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
				<div class="bullet" style="left: {p.x}px; bottom: {GROUND + p.y}px"></div>
			{:else if p.type === 'arrow'}
				<div class="arrow-shot" style="left: {p.x}px; bottom: {GROUND + p.y}px; transform: rotate({Math.atan2(-p.velY, p.velX) * 180 / Math.PI}deg)"></div>
			{:else}
				<div class="rocket-proj" style="left: {p.x}px; bottom: {GROUND + p.y}px; transform: rotate({Math.atan2(-p.velY, p.velX) * 180 / Math.PI}deg)"></div>
			{/if}
		{/each}

		<!-- Explosions -->
		{#each flames as f (f.id)}
			<svg class="expl-svg" viewBox="-60 -60 120 120" width="120" height="120"
				style="left: {f.x - 60}px; bottom: {GROUND + f.y - 60}px"
				xmlns="http://www.w3.org/2000/svg">
				<polygon points="0,-50 10.7,-25.9 35.4,-35.4 25.9,-10.7 50,0 25.9,10.7 35.4,35.4 10.7,25.9 0,50 -10.7,25.9 -35.4,35.4 -25.9,10.7 -50,0 -25.9,-10.7 -35.4,-35.4 -10.7,-25.9" fill="#dc2626"/>
				<polygon points="13.4,-32.3 14.1,-14.1 32.3,-13.4 20,0 32.3,13.4 14.1,14.1 13.4,32.3 0,20 -13.4,32.3 -14.1,14.1 -32.3,13.4 -20,0 -32.3,-13.4 -14.1,-14.1 -13.4,-32.3 0,-20" fill="#f97316"/>
				<polygon points="0,-32 6.8,-16.5 22.6,-22.6 16.5,-6.8 32,0 16.5,6.8 22.6,22.6 6.8,16.5 0,32 -6.8,16.5 -22.6,22.6 -16.5,6.8 -32,0 -16.5,-6.8 -22.6,-22.6 -6.8,-16.5" fill="#fbbf24"/>
				<circle cx="0" cy="0" r="14" fill="#fff7ed"/>
				<circle cx="0"    cy="-54" r="5" fill="#f97316"/>
				<circle cx="38"   cy="-38" r="4" fill="#fbbf24"/>
				<circle cx="54"   cy="0"   r="5" fill="#f97316"/>
				<circle cx="38"   cy="38"  r="4" fill="#fbbf24"/>
				<circle cx="0"    cy="54"  r="5" fill="#f97316"/>
				<circle cx="-38"  cy="38"  r="4" fill="#fbbf24"/>
				<circle cx="-54"  cy="0"   r="5" fill="#f97316"/>
				<circle cx="-38"  cy="-38" r="4" fill="#fbbf24"/>
			</svg>
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
					{:else if weaponType === 'bazooka'}
						<div class="bazooka-barrel"></div>
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

		<!-- Boss -->
		{#if boss}
			<div class="boss-wrap" class:boss-flash={boss.flashF > 0}
				style="left: {boss.x}px; bottom: {GROUND}px">
				<div class="boss-hp-bar">
					<div class="boss-hp-fill" style="width: {boss.hp}%"></div>
					<span class="boss-hp-text">{boss.hp} HP</span>
				</div>
				<svg viewBox="0 -6 32 32" width={BOSS_W} height={BOSS_H}
					shape-rendering="crispEdges" aria-label="Boss Bug"
					class="boss-svg">
					<rect x="6"  y="-6" width="4" height="7"  fill="#7c3aed"/>
					<rect x="14" y="-8" width="4" height="9"  fill="#a855f7"/>
					<rect x="22" y="-6" width="4" height="7"  fill="#7c3aed"/>
					<rect x="6"  y="0"  width="4"  height="4" fill="#7c3aed"/>
					<rect x="22" y="0"  width="4"  height="4" fill="#7c3aed"/>
					<rect x="6"  y="4"  width="20" height="4" fill="#7c3aed"/>
					<rect x="2"  y="8"  width="28" height="4" fill="#6d28d9"/>
					<rect x="0"  y="12" width="32" height="4" fill="#7c3aed"/>
					<rect x="0"  y="16" width="32" height="4" fill="#7c3aed"/>
					<rect x="6"  y="16" width="4"  height="4" fill="#fbbf24"/>
					<rect x="22" y="16" width="4"  height="4" fill="#fbbf24"/>
					<rect x="0"  y="20" width="32" height="2"  fill="#4c1d95"/>
					<rect x="0"  y="22" width="4"  height="4" fill="#4c1d95"/>
					<rect x="8"  y="22" width="4"  height="4" fill="#4c1d95"/>
					<rect x="20" y="22" width="4"  height="4" fill="#4c1d95"/>
					<rect x="28" y="22" width="4"  height="4" fill="#4c1d95"/>
				</svg>
			</div>
		{/if}

		<!-- Boss projectiles -->
		{#each bossProjs as bp (bp.id)}
			<svg class="boss-proj-svg" viewBox="0 0 32 26"
				width={BOSS_PROJ_W} height={BOSS_PROJ_H}
				style="left: {bp.x}px; bottom: {GROUND + bp.y}px"
				shape-rendering="crispEdges" aria-label="Boss shot">
				<rect x="6"  y="0"  width="4"  height="4" fill="#a855f7"/>
				<rect x="22" y="0"  width="4"  height="4" fill="#a855f7"/>
				<rect x="6"  y="4"  width="20" height="4" fill="#a855f7"/>
				<rect x="2"  y="8"  width="28" height="4" fill="#a855f7"/>
				<rect x="0"  y="12" width="32" height="4" fill="#7c3aed"/>
				<rect x="0"  y="16" width="32" height="4" fill="#7c3aed"/>
				<rect x="6"  y="16" width="4"  height="4" fill="#fbbf24"/>
				<rect x="22" y="16" width="4"  height="4" fill="#fbbf24"/>
				<rect x="0"  y="20" width="32" height="2"  fill="#4c1d95"/>
				<rect x="0"  y="22" width="4"  height="4" fill="#4c1d95"/>
				<rect x="8"  y="22" width="4"  height="4" fill="#4c1d95"/>
				<rect x="20" y="22" width="4"  height="4" fill="#4c1d95"/>
				<rect x="28" y="22" width="4"  height="4" fill="#4c1d95"/>
			</svg>
		{/each}

		<!-- Obstacles -->
		{#each obstacles as obs (obs.id)}
			<div class="obs obs-bug{obs.flyY > 0 ? ' obs-flying' : ''}" style="left: {obs.x}px; bottom: {GROUND + obs.flyY}px">
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

	.ammo-dots          { font-size: 0.6rem; letter-spacing: 0.08em; color: var(--color-ash-400); }
	.ammo-dots.reloading { color: #fbbf24; animation: wpulse 0.7s ease-in-out infinite alternate; }
	.switch-hint        { font-size: 0.55rem; color: var(--color-ash-600); font-family: monospace; }

	/* ─── Help button ───────────────────────────────────────────── */
	.help-btn {
		position: absolute;
		top: 9px;
		left: 30px;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: #27c840;
		border: none;
		padding: 0;
		cursor: pointer;
		z-index: 20;
		display: flex; align-items: center; justify-content: center;
		font-size: 7px;
		font-weight: 700;
		color: oklch(0.1 0 0 / 0.7);
		line-height: 1;
		box-shadow: inset 0 1px 1px oklch(1 0 0 / 0.3);
		transition: filter 0.15s, transform 0.1s;
	}

	.help-btn:hover  { filter: brightness(1.15); transform: scale(1.15); }
	.help-btn:active { transform: scale(0.88); }

	/* ─── Help overlay ──────────────────────────────────────────── */
	.help-overlay {
		position: absolute;
		inset: 0;
		background: oklch(0.08 0 0 / 0.82);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 6px;
		z-index: 30;
		cursor: pointer;
	}

	.help-panel {
		display: flex;
		gap: 20px;
		background: oklch(0.13 0 0 / 0.95);
		border: 1px solid var(--color-ash-700);
		border-radius: 6px;
		padding: 12px 16px;
		cursor: default;
	}

	.help-col { display: flex; flex-direction: column; gap: 3px; min-width: 140px; }

	.help-heading {
		font-size: 0.6rem;
		font-family: monospace;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--color-ash-500);
		margin-bottom: 4px;
	}

	.help-row {
		display: flex;
		align-items: baseline;
		gap: 8px;
		font-size: 0.65rem;
		font-family: monospace;
		color: var(--color-ash-300);
	}

	.help-row span:first-child { min-width: 46px; flex-shrink: 0; }

	.hk {
		display: inline-block;
		background: var(--color-ash-800);
		border: 1px solid var(--color-ash-600);
		border-radius: 3px;
		padding: 0 4px;
		font-size: 0.6rem;
		color: var(--color-ash-300);
		min-width: 46px;
		text-align: center;
	}

	.help-close-hint {
		font-size: 0.55rem;
		font-family: monospace;
		color: var(--color-ash-700);
	}

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
		padding: 28px 20px 8px 34px;
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
		transform-origin: 0 50%;
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

	.obs-flying { animation: float-fly 0.9s ease-in-out infinite alternate; }

	@keyframes float-fly { from { transform: translateY(0); } to { transform: translateY(-6px); } }

	/* ─── Bazooka barrel ───────────────────────────────────────────── */
	.bazooka-barrel {
		position: absolute;
		right: -26px; top: 2px;
		width: 26px; height: 11px;
		background: #475569;
		border-radius: 0 5px 5px 0;
		border: 2px solid #334155;
	}

	.bazooka-barrel::before {
		content: '';
		position: absolute;
		left: -4px; top: -2px;
		width: 5px; height: 15px;
		background: #374151;
		border-radius: 2px;
	}

	/* ─── Rocket projectile ─────────────────────────────────────── */
	.rocket-proj {
		position: absolute;
		width: 22px; height: 8px;
		pointer-events: none;
		transform-origin: 0 50%;
	}

	.rocket-proj::before {
		content: '';
		position: absolute;
		left: 0; top: 1px;
		width: 18px; height: 6px;
		background: #94a3b8;
		border-radius: 1px 5px 5px 1px;
		box-shadow: 0 0 5px rgba(251,191,36,0.5);
	}

	.rocket-proj::after {
		content: '';
		position: absolute;
		left: -9px; top: 2px;
		width: 11px; height: 4px;
		background: linear-gradient(90deg, transparent, #f97316 60%, #fbbf24);
		animation: rocket-fire 0.07s linear infinite alternate;
	}

	@keyframes rocket-fire {
		from { width: 10px; opacity: 0.8; }
		to   { width: 14px; opacity: 1; }
	}

	/* ─── Explosion SVG ─────────────────────────────────────────── */
	.expl-svg {
		position: absolute;
		pointer-events: none;
		transform-origin: 50% 50%;
		animation: expl 2s ease-out forwards;
		z-index: 5;
	}

	@keyframes expl {
		0%   { transform: scale(0.05); opacity: 1; }
		12%  { transform: scale(1.35); opacity: 1; }
		28%  { transform: scale(0.88); opacity: 1; }
		50%  { transform: scale(1.0);  opacity: 0.9; }
		75%  { transform: scale(1.05); opacity: 0.45; }
		100% { transform: scale(1.1);  opacity: 0; }
	}

	.baz-label { color: #fb923c; }

	/* ─── Boss ──────────────────────────────────────────────────── */
	.boss-wrap {
		position: absolute;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3px;
		z-index: 4;
	}

	.boss-hp-bar {
		position: relative;
		width: 72px;
		height: 8px;
		background: oklch(0.15 0 0);
		border: 1px solid #7c3aed;
		border-radius: 3px;
		overflow: hidden;
	}

	.boss-hp-fill {
		height: 100%;
		background: linear-gradient(90deg, #7c3aed, #a855f7);
		transition: width 0.1s;
	}

	.boss-hp-text {
		position: absolute;
		inset: 0;
		display: flex; align-items: center; justify-content: center;
		font-size: 6px;
		font-family: monospace;
		color: #e9d5ff;
		letter-spacing: 0.05em;
	}

	.boss-svg {
		animation: boss-bob 0.7s ease-in-out infinite alternate;
	}

	@keyframes boss-bob {
		from { transform: translateY(0); }
		to   { transform: translateY(-5px); }
	}

	.boss-flash .boss-svg { animation: boss-flash-anim 0.08s linear infinite; }

	@keyframes boss-flash-anim { 0%, 100% { opacity: 1; } 50% { opacity: 0.15; } }

	.boss-proj-svg {
		position: absolute;
		pointer-events: none;
		transform: scaleX(-1);
		transform-origin: 50% 50%;
		animation: boss-proj-fly 0.2s linear infinite alternate;
	}

	@keyframes boss-proj-fly {
		from { transform: scaleX(-1) translateY(0); }
		to   { transform: scaleX(-1) translateY(-2px); }
	}

	/* ─── Boss HUD ───────────────────────────────────────────────── */
	.boss-hud {
		position: absolute;
		top: 8px; left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 6px;
		z-index: 10;
		pointer-events: none;
	}

	.boss-hud-label {
		font-size: 0.6rem;
		font-family: monospace;
		color: #a855f7;
		animation: wpulse 0.7s ease-in-out infinite alternate;
	}

	.boss-hud-bar {
		width: 80px; height: 6px;
		background: oklch(0.15 0 0);
		border: 1px solid #7c3aed;
		border-radius: 2px;
		overflow: hidden;
	}

	.boss-hud-fill {
		height: 100%;
		background: linear-gradient(90deg, #7c3aed, #a855f7);
		transition: width 0.08s;
	}

	.boss-hud-hp {
		font-size: 0.55rem;
		font-family: monospace;
		color: #c4b5fd;
	}

	/* ─── Reduced motion ─────────────────────────────────────────── */
	@media (prefers-reduced-motion: reduce) {
		.game-outer, .stage { transition: none; }
		.bob, .leg, .obs-bug svg, .blinking .body { animation: none; }
		.restore-pill { animation: none; }
	}
</style>

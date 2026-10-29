'use strict';
/*
 * V. Долина пісочного годинника. У руках — кришталева посудина, світло з якої витікає.
 * Стискати й берегти — марно: воно все одно згасає. Віддавати дорогою — паросткам,
 * ліхтарям, замерзлим птахам — і позаду розквітає сад, яким потім ідуть інші.
 */
(function (Y) {
  const U = Y.U, E = Y.E, A = Y.Audio, I = Y.Input, UI = Y.UI, TX = Y.TEXT;
  const W = 82, H = 14, COST = 0.064, NEED = 9;
  const TARGETS = [
    ['sprout', 8, 6], ['lamp', 12, 5], ['sprout', 16, 8], ['bird', 20, 9], ['sprout', 25, 5], ['lamp', 30, 9],
    ['sprout', 34, 8], ['lamp', 39, 5], ['bird', 43, 9], ['sprout', 47, 6], ['bird', 52, 5], ['sprout', 57, 8],
    ['lamp', 62, 9], ['sprout', 67, 5]
  ];
  const TREE = { x: 75 * 16 + 8, y: 7 * 16 + 8 };

  function makeMap() {
    const rows = [], r = U.rng(8);
    for (let y = 0; y < H; y++) {
      let row = '';
      for (let x = 0; x < W; x++) {
        let c = '.';
        if (y <= 2) c = ' ';
        else if (y === 3 || y >= 11) c = '#';
        else if (x === 0 || x === W - 1) c = '#';
        else if ((y === 4 || y === 10) && r() < 0.25) c = '#';
        if (x === 77 && y >= 4 && y <= 10) c = 'v';
        row += c;
      }
      rows.push(row);
    }
    return rows;
  }

  class Valley extends Y.Loc {
    constructor(G) {
      super(G);
      this.map = new E.TileMap(makeMap());
      this.solidChars = '# v';
      this.entry = { x: 3 * 16, y: 7 * 16 + 8, dir: 'right' };
      this.darkness = 0.76; this.darkRGB = '22,10,28';
      this.vignette = 0.5;
      this.stepOpts = { vol: 0.045, tone: 520 };
      this.L = 1; this.clutch = 0; this.holdT = 0; this.emptyT = 0;
      this.targets = TARGETS.map(([kind, tx, ty], i) => ({ kind, x: tx * 16 + 8, y: ty * 16 + 10, lit: false, b: 0, i, ph: i * 1.3 }));
      this.spots = [];
      this.streams = [];
      this.tree = { b: 0 };
      this.stage = 0;  // 0 walking, 1 last drop, 2 looking back, 3 free
      this.travelers = [];
      this.camOverride = null;
      this.floor = this.buildFloor();
      this.hintShown = false;
    }
    enter() {
      A.scene({ vrata: 0.8, ptici: 0 }, 3);
      setTimeout(() => { if (this.G.loc === this && this.stage === 0) UI.hint(I.touch ? TX.valley.clutchTouch : TX.valley.clutchHint, 6); }, 4000);
    }
    solid(tx, ty) {
      const c = this.map.ch(tx, ty);
      if (c === 'v') return this.stage < 3;
      return super.solid(tx, ty);
    }
    get lit() { return this.targets.filter(t => t.lit).length; }

    buildFloor() {
      const m = this.map, r = U.rng(19);
      return E.prerender(m.pw, m.ph, g => {
        for (let ty = 3; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
          const c = m.ch(tx, ty), x = tx * 16, y = ty * 16;
          if (ty === 3) {
            g.fillStyle = '#1a1220'; g.fillRect(x, y + 4, 16, 12);
            g.fillStyle = '#231828'; g.fillRect(x, y + 4 + Math.round(Math.sin(tx * 0.7) * 2), 16, 3);
            continue;
          }
          g.fillStyle = (tx + ty) & 1 ? '#3a2c2a' : '#382a28'; g.fillRect(x, y, 16, 16);
          // cracks in dry earth
          g.fillStyle = '#251b1a';
          if (r() < 0.6) { const cx = x + Math.floor(r() * 10), cy = y + Math.floor(r() * 12); g.fillRect(cx, cy, 5, 1); g.fillRect(cx + 4, cy + 1, 1, 3); g.fillRect(cx + 4, cy + 3, 4, 1); }
          if (r() < 0.3) { g.fillStyle = '#4a3a34'; g.fillRect(x + Math.floor(r() * 14), y + Math.floor(r() * 14), 2, 1); }
          if (c === '#') {
            g.fillStyle = '#20171c'; g.fillRect(x, y, 16, 16);
            g.fillStyle = '#2c2026'; g.beginPath(); g.ellipse(x + 8, y + 8, 8, 6, 0, 0, U.TAU); g.fill();
          }
        }
      });
    }

    update(dt) {
      super.update(dt);
      const p = this.P, G = this.G;
      const playing = !G.locked && !Y.Dialog.active && this.stage === 0;
      // holding the vessel tight
      const nearTarget = this.interactables().length > 0;
      if (playing && I.down.act && !nearTarget) this.holdT += dt; else this.holdT = 0;
      this.clutch = U.damp(this.clutch, this.holdT > 0.25 ? 1 : 0, 6, dt);
      if (playing) {
        let drain = p.moving ? 0.0016 : (p.still > 2 ? 0.008 : 0.003);
        if (this.clutch > 0.5) drain = 0.016;
        this.L = Math.max(0, this.L - drain * dt);
      }
      // drops of light falling from the cracks
      if (this.L > 0.01 && this.clutch < 0.5 && Math.random() < dt * (1.5 + this.L * 3)) {
        const vx = p.x + (p.dir === 'left' ? -5 : 5);
        this.particles.add({ x: vx + U.range(-2, 2), y: p.y - 9, vy: 10, grav: 60, life: 0.35, color: '#bfe8ff', light: 5, rgb: '170,220,255', la: 0.5,
          onDie: d => { if (this.spots.length < 260) this.spots.push({ x: d.x, y: d.y, a: 0.8 }); } });
      }
      for (const s of this.spots) s.a = Math.max(0, s.a - dt * 0.08);
      this.spots = this.spots.filter(s => s.a > 0);
      // empty but not enough given — one more drop from above
      if (this.stage === 0 && this.L <= 0.001 && this.lit < NEED && !Y.Dialog.active) {
        this.emptyT += dt;
        if (this.emptyT > 2.5) {
          this.emptyT = 0;
          G.say(TX.valley.empty).then(() => { this.L = (NEED - this.lit) * COST + 0.1; A.sfx.chime(988, 0.06); });
        }
      }
      for (const t of this.targets) if (t.lit) t.b = Math.min(1, t.b + dt * 0.5);
      for (const s of this.streams) s.t += dt;
      this.streams = this.streams.filter(s => s.t < 1.2);
      const ratio = this.lit / this.targets.length;
      this.darkness = U.lerp(0.76, 0.5, ratio) - this.tree.b * 0.1;
      const birds = this.targets.filter(t => t.kind === 'bird' && t.lit).length;
      A.set('ptici', Math.min(0.75, birds * 0.25 + this.tree.b * 0.2), 2);

      // the end of the path
      if (this.stage === 0 && p.x > 73 * 16 && this.lit >= NEED && !Y.Dialog.active) this.lastDrop();
      if (this.stage === 1) {
        this.L = Math.max(0, this.L - dt * 0.5);
        this.tree.b = Math.min(1, this.tree.b + dt * 0.35);
        if (Math.random() < dt * 20 && this.L > 0) this.streams.push({ x0: p.x, y0: p.y - 9, x1: TREE.x, y1: TREE.y - 20, t: 0 });
      } else if (this.tree.b > 0) this.tree.b = Math.min(1, this.tree.b + dt * 0.35);
      for (const tr of this.travelers) { tr.x += tr.v * dt; tr.y = tr.y0 + Math.sin(tr.x * 0.05 + tr.ph) * 6; tr.anim += dt; }
      if (this.stage === 3 && p.x > 79 * 16) { this.stage = 4; G.goto('workshop'); }
    }

    lastDrop() {
      const G = this.G;
      this.stage = 1;
      G.locked = true;
      A.sfx.musicBox([659, 784, 988, 1175], 0.45, 0.05);
      G.say(TX.valley.last).then(async () => {
        await U.wait(2200);
        this.L = 0;
        this.stage = 2;
        this.P.dir = 'left';
        // a pilgrim with a staff, a wanderer with a child, an old one with a cane
        const pathY = 7 * 16 + U.range(-6, 8);
        [[0, 0, -8, 0, 29], [1, -34, 4, 2, 27], [2, -46, 9, 2, 27], [3, -86, -2, 4, 25]].forEach(([kind, dx, dy, ph, v]) => {
          this.travelers.push({ kind, x: 36 * 16 + dx, y0: pathY + dy, y: 0, v, ph, anim: kind * 0.13, light: null });
        });
        this.camOverride = { x: this.P.x, y: this.P.y - 10, k: 0 };
        await U.wait(9500);
        await G.say(TX.valley.travelers);
        this.camOverride = null;
        this.stage = 3;
        G.locked = false;
        A.sfx.chime(659, 0.06);
      });
    }

    camTarget() {
      if (this.camOverride) {
        const lead = this.travelers[0];
        if (lead) { this.camOverride.x = U.lerp(this.camOverride.x, lead.x + 40, 0.02); this.camOverride.y = 7 * 16; }
        return this.camOverride;
      }
      return { x: this.P.x + 30, y: this.P.y - 10 };
    }

    give(t) {
      if (this.L < 0.015) { A.sfx.blip('narr'); return; }
      t.lit = true;
      this.L = Math.max(0, this.L - COST);
      this.streams.push({ x0: this.P.x, y0: this.P.y - 9, x1: t.x, y1: t.y - 6, t: 0 });
      A.sfx.note(U.pick([523, 587, 659, 784, 880]), { vol: 0.08, dur: 2, echo: 0.35 });
      if (t.kind === 'bird') setTimeout(() => A.sfx.sparkle(0.05), 600);
      for (let i = 0; i < 16; i++) this.particles.add({ x: t.x + U.range(-6, 6), y: t.y - U.range(0, 10), vy: U.range(-20, -5), vx: U.range(-8, 8), life: U.range(1, 2), color: U.pick(['#9ff7e0', '#ffc6f2', '#fff2a8']), light: 6, rgb: '180,255,230', la: 0.5 });
    }

    interactables() {
      if (this.stage !== 0) return [];
      return this.targets.filter(t => !t.lit).map(t => ({ x: t.x, y: t.y - 4, r: 24, label: TX.valley.give, act: () => this.give(t) }));
    }

    drawBack(ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, E.H);
      const k = this.lit / this.targets.length;
      g.addColorStop(0, U.rgb(U.mixc([26, 16, 40], [30, 26, 60], k)));
      g.addColorStop(0.5, U.rgb(U.mixc([70, 34, 60], [90, 50, 90], k)));
      g.addColorStop(1, U.rgb(U.mixc([150, 80, 70], [170, 110, 120], k)));
      ctx.fillStyle = g; ctx.fillRect(0, 0, E.W, E.H);
      // low sun and far hills (parallax)
      const sx = E.W * 0.7 - E.cam.x * 0.03, sy = 30 - (E.cam.y - 112) * 0.3;
      ctx.fillStyle = 'rgba(255,190,140,0.6)'; ctx.beginPath(); ctx.arc(sx, sy, 10, 0, U.TAU); ctx.fill();
      ctx.fillStyle = '#2a1a2e';
      for (let x = -40; x < E.W + 40; x += 6) {
        const wx = x + E.cam.x * 0.15;
        const hh = 18 + U.noise1(wx * 0.02) * 10;
        ctx.fillRect(x, sy + 22 - hh * 0.5, 6, 200);
      }
    }

    drawFloor(ctx) {
      E.blitWorld(ctx, this.floor);
      // living garden spreading from lit things
      for (const t of this.targets) {
        if (!t.lit) continue;
        const r = 30 * U.easeOut(t.b);
        ctx.globalAlpha = 0.55; E.ellipse(ctx, t.x, t.y, r, r * 0.6, '#1d3b33'); ctx.globalAlpha = 1;
        const rr = U.rng(t.i * 17 + 3);
        for (let i = 0; i < 26 * t.b; i++) {
          const a = rr() * U.TAU, d = rr() * r;
          const fx = t.x + Math.cos(a) * d, fy = t.y + Math.sin(a) * d * 0.6;
          ctx.fillStyle = ['#7af0d0', '#ff9be4', '#ffe98a', '#9fc8ff'][i % 4];
          ctx.globalAlpha = 0.6 + 0.4 * Math.sin(this.t * 2 + i);
          ctx.fillRect(Math.round(fx), Math.round(fy), 1, 1);
          ctx.fillStyle = '#2f6a4e'; ctx.globalAlpha = 1; ctx.fillRect(Math.round(fx), Math.round(fy) + 1, 1, 2);
        }
      }
      for (const s of this.spots) { ctx.globalAlpha = s.a * 0.8; ctx.fillStyle = '#bfe8ff'; ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1); }
      ctx.globalAlpha = 1;
      // dry thorny vines that block the end
      if (this.stage < 3) for (let y = 4 * 16; y < 11 * 16; y += 3) { E.rect(ctx, 77 * 16 + 4 + Math.sin(y) * 3, y, 8, 2, '#3a2622'); E.rect(ctx, 77 * 16 + 2 + Math.cos(y) * 4, y + 1, 2, 1, '#5a3a30'); }
    }

    drawTarget(ctx, t) {
      const b = U.easeOut(t.b), x = t.x, y = t.y;
      if (t.kind === 'sprout') {
        if (!t.lit) { E.rect(ctx, x, y - 6, 1, 6, '#5a4232'); E.rect(ctx, x - 2, y - 5, 2, 1, '#5a4232'); E.rect(ctx, x + 1, y - 3, 2, 1, '#5a4232'); return; }
        const h = 6 + b * 18;
        E.rect(ctx, x, y - h, 1, h, '#3f8a64');
        for (let i = 0; i < 4; i++) {
          const yy = y - h * (0.35 + i * 0.2), s = i % 2 ? 1 : -1;
          E.rect(ctx, x + s, yy, s * 4 * b, 1, '#4fa878');
          E.rect(ctx, x + s * (1 + 4 * b), yy - 1, 2, 2, ['#9ff7e0', '#ffc6f2'][i % 2]);
        }
        E.rect(ctx, x - 1, y - h - 2, 3, 3, '#fff2a8');
      } else if (t.kind === 'lamp') {
        E.rect(ctx, x, y - 18, 2, 18, '#2a2226');
        E.rect(ctx, x - 2, y - 24, 6, 6, '#3a3034');
        E.rect(ctx, x - 1, y - 23, 4, 4, t.lit ? (Math.sin(this.t * 9 + t.ph) > 0 ? '#ffd27a' : '#ffbe5a') : '#4c4448');
        E.rect(ctx, x - 3, y - 25, 8, 1, '#2a2226');
      } else if (t.kind === 'bird') {
        const hop = t.lit ? Math.max(0, Math.sin(this.t * 3 + t.ph)) * 3 * b : 0;
        const body = t.lit ? '#b8704a' : '#7a8aa0', head = t.lit ? '#8a4a32' : '#9aaabc';
        E.rect(ctx, x - 3, y - 4 - hop, 6, 4, body);
        E.rect(ctx, x + 2, y - 6 - hop, 3, 3, head);
        E.rect(ctx, x + 5, y - 5 - hop, 1, 1, '#e8b040');
        E.rect(ctx, x - 5, y - 3 - hop, 2, 1, body);
        if (!t.lit) { E.rect(ctx, x - 2, y - 5, 1, 1, '#e8f4ff'); E.rect(ctx, x + 1, y - 2, 1, 1, '#e8f4ff'); }
        else if (Math.sin(this.t * 1.7 + t.ph) > 0.95) E.rect(ctx, x - 1, y - 6 - hop, 2, 1, '#d08a5a');
      }
    }

    drawTree(ctx) {
      const x = TREE.x, y = TREE.y, b = U.easeOut(this.tree.b);
      E.rect(ctx, x - 2, y - 30, 4, 30, '#3a2a26');
      [[-1, 22, 10], [1, 18, 12], [-1, 12, 8], [1, 26, 7]].forEach(([s, yy, l]) => { for (let i = 0; i < l; i++) E.rect(ctx, x + s * (2 + i), y - yy - i * 0.6, 1, 1, '#3a2a26'); });
      if (b <= 0) return;
      const rr = U.rng(5);
      for (let i = 0; i < 70 * b; i++) {
        const a = rr() * U.TAU, d = rr() * 18;
        ctx.fillStyle = ['#7af0d0', '#ff9be4', '#ffe98a', '#c8b4ff'][i % 4];
        ctx.globalAlpha = 0.7 + 0.3 * Math.sin(this.t * 2 + i);
        ctx.fillRect(Math.round(x + Math.cos(a) * d * 1.2), Math.round(y - 30 + Math.sin(a) * d * 0.8), 2, 2);
      }
      ctx.globalAlpha = 1;
    }

    drawables() {
      const out = this.targets.map(t => ({ y: t.y, draw: ctx => this.drawTarget(ctx, t) }));
      out.push({ y: TREE.y, draw: ctx => this.drawTree(ctx) });
      const p = this.P;
      // the crystal vessel in your hands
      out.push({ y: p.y + 0.5, draw: ctx => {
        if (this.stage >= 2) return;
        const vx = p.x + (p.dir === 'left' ? -5 : 5), vy = p.y - 11;
        E.rect(ctx, vx - 2, vy - 1, 5, 5, 'rgba(220,240,255,0.5)');
        const lv = Math.round(4 * this.L);
        if (lv > 0) E.rect(ctx, vx - 1, vy + 4 - lv, 3, lv, this.clutch > 0.5 ? '#8fb8d0' : '#d8f4ff');
        E.rect(ctx, vx - 1, vy - 3, 3, 2, 'rgba(220,240,255,0.6)');
        if (this.clutch > 0.3) E.rect(ctx, vx - 3, vy, 7, 3, '#e4b896');
      } });
      for (const tr of this.travelers) out.push({ y: tr.y, draw: ctx => drawTraveler(ctx, tr, this.t) });
      return out;
    }

    lights() {
      const p = this.P;
      if (this.stage < 2) E.addLight(p.x + (p.dir === 'left' ? -5 : 5), p.y - 10, 18 + 46 * this.L * (1 - this.clutch * 0.6), 0.9 * Math.max(0.15, this.L), '170,220,255', 0.45);
      this.playerLight.r = 34 + 24 * this.L;
      for (const t of this.targets) {
        if (!t.lit) continue;
        const rgb = t.kind === 'lamp' ? '255,200,120' : t.kind === 'bird' ? '255,190,150' : '150,255,220';
        E.addLight(t.x, t.y - 10, 30 + 30 * t.b, 0.75 * t.b, rgb, 0.45);
      }
      if (this.tree.b > 0) E.addLight(TREE.x, TREE.y - 30, 90 * this.tree.b, 0.9, '200,180,255', 0.45);
      for (const s of this.streams) {
        const k = U.clamp(s.t / 0.8, 0, 1);
        for (let i = 0; i < 4; i++) {
          const f = U.clamp(k - i * 0.08, 0, 1);
          E.addLight(U.lerp(s.x0, s.x1, f), U.lerp(s.y0, s.y1, f) - Math.sin(f * Math.PI) * 14, 8, 0.8 * (1 - k * 0.5), '200,240,255', 0.6);
        }
      }
      for (const tr of this.travelers) if (tr.light) E.addLight(tr.light.x, tr.light.y, tr.light.r, 0.75, tr.light.rgb, 0.45);
    }

    drawTop(ctx) {
      for (const s of this.streams) {
        const k = U.clamp(s.t / 0.8, 0, 1);
        for (let i = 0; i < 6; i++) {
          const f = U.clamp(k - i * 0.05, 0, 1);
          E.rect(ctx, U.lerp(s.x0, s.x1, f), U.lerp(s.y0, s.y1, f) - Math.sin(f * Math.PI) * 14, 1, 1, '#e8fbff');
        }
      }
    }

    drawPost(ctx) {
      E.tint(ctx, '#7060a0', 0.2 * (1 - this.lit / this.targets.length), 'multiply');
      if (this.clutch > 0.05) E.tint(ctx, '#304060', this.clutch * 0.25, 'multiply');
    }

    drawHud(h) {
      // vessel indicator
      E.hudScreen();
      const x = E.W - 16, y = 12;
      h.globalAlpha = 0.85;
      h.strokeStyle = 'rgba(220,240,255,0.8)'; h.lineWidth = 0.6;
      h.strokeRect(x - 3, y, 6, 12);
      h.fillStyle = '#cdeeff';
      h.fillRect(x - 2.5, y + 12 - 11.5 * this.L, 5, 11.5 * this.L);
      h.globalAlpha = 1;
      E.hudWorld();
    }
  }
  /* ---------------- travellers walking through the garden ---------------- */
  const WALKERS = [
    // a tall pilgrim with a lantern hanging from a staff
    { h: 20, w: 5, cloak: [78, 56, 98], dark: [50, 35, 66], hood: true, staff: true, lamp: 'staff' },
    // a wanderer with a backpack and a lantern in hand
    { h: 17, w: 4, cloak: [42, 72, 80], dark: [27, 47, 54], hood: true, pack: true, lamp: 'hand' },
    // a child with a jar of fireflies
    { h: 11, w: 3, cloak: [128, 78, 50], dark: [90, 54, 36], hair: [78, 48, 32], jar: true },
    // an old one with a cane and a small lantern
    { h: 16, w: 4, cloak: [80, 64, 48], dark: [54, 42, 32], hood: true, cane: true, lamp: 'hand', hunch: 2 }
  ];
  const OUT = [14, 10, 18], RIM = [196, 138, 92], SKIN = [238, 198, 162], LEGS = [36, 30, 42], BOOT = [22, 17, 22];

  // facing right; returns nothing, but leaves the lantern position in tr.light
  function drawTraveler(ctx, tr, t) {
    const v = WALKERS[tr.kind % WALKERS.length];
    const step = Math.floor(tr.anim * 5) % 2;
    const X = Math.round(tr.x), Y = Math.round(tr.y);
    const legH = v.h > 12 ? 3 : 2;
    const top = Y - legH - v.h - step;
    const px = (x, y, c) => { ctx.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`; ctx.fillRect(x, y, 1, 1); };
    const row = (y, x0, x1, c) => { ctx.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`; ctx.fillRect(x0, y, x1 - x0 + 1, 1); };
    const head = v.hood ? 6 : 5;
    const hunch = v.hunch || 0;
    // silhouette rows: [left, right] offsets from X
    const rows = [];
    const hoodRows = [[-2, 0], [-3, 2], [-3, 3], [-3, 3], [-3, 3], [-2, 2]];
    const hairRows = [[-1, 1], [-2, 2], [-2, 2], [-2, 2], [-1, 1]];
    for (let i = 0; i < v.h; i++) {
      if (i < head) { const [a, b] = (v.hood ? hoodRows : hairRows)[i]; rows.push([a + hunch, b + hunch]); continue; }
      const k = (i - head) / Math.max(1, v.h - head - 1);
      const lean = Math.round(hunch * (1 - k));
      rows.push([-Math.round(2 + (v.w - 1) * k + 0.4) + lean, Math.round(2 + (v.w - 1) * k * 0.8) + lean]);
    }
    // backpack behind (drawn first, under the outline of the body)
    if (v.pack) {
      const [l] = rows[head + 1];
      for (let y = head; y < head + 7; y++) row(top + y, X + l - 3, X + l, y === head ? [156, 126, 92] : [104, 72, 46]);
      row(top + head + 7, X + l - 3, X + l, OUT);
      for (let y = head; y < head + 7; y++) px(X + l - 4, top + y, OUT);
    }
    // outline, then the body
    row(top - 1, X + rows[0][0], X + rows[0][1], OUT);
    rows.forEach(([l, r], i) => row(top + i, X + l - 1, X + r + 1, OUT));
    row(top + v.h, X + rows[v.h - 1][0], X + rows[v.h - 1][1], OUT);
    rows.forEach(([l, r], i) => {
      const y = top + i;
      if (i < head && !v.hood) {
        // a child's hair and face
        row(y, X + l, X + r, i < 2 ? v.hair : v.hair);
        if (i >= 2) { row(y, X + l + 2, X + r, SKIN); if (i === 2) px(X + r - 1, y, OUT); }
        return;
      }
      row(y, X + l, X + r, i < head ? v.cloak : v.cloak);
      px(X + l, y, v.dark);
      if (i > head + 2) px(X + l + 1, y, v.dark);
      if ((i + step) % 3 === 0 && i > head) px(X + Math.round((l + r) / 2) - 1, y, v.dark);
      // warm lantern light on the near edge, fading down the cloak
      const near = 1 - U.clamp((i - head - 2) / 6, 0, 1);
      px(X + r, y, U.mixc(v.cloak.map(c => c * 1.18), RIM, near * 0.7));
    });
    // face inside the hood
    if (v.hood) {
      const fx = X + hunch;
      row(top + 2, fx, fx + 2, [40, 30, 36]);
      px(fx, top + 3, SKIN); px(fx + 1, top + 3, OUT); px(fx + 2, top + 3, SKIN);
      row(top + 4, fx, fx + 1, [210, 170, 140]);
    }
    // tattered hem sways with the step
    const [hl, hr] = rows[v.h - 1];
    for (let x = hl; x <= hr; x++) if ((x + step) % 3 === 0) px(X + x, top + v.h, v.dark);
    // legs and boots
    const body = top + v.h + 1;
    const front = X + (step ? 2 : 1), back = X - (step ? 1 : 2);
    for (let y = body; y < Y; y++) { px(front, y, LEGS); px(back, y, LEGS); }
    row(Y - 1, front, front + 1, BOOT); row(Y - 1, back, back + 1, BOOT);
    // arm and what it holds
    const [, ar] = rows[head + 1];
    const hx = X + ar + 1, hy = top + head + 3;
    for (let y = top + head; y < hy; y++) px(hx, y, v.dark);
    px(hx, hy, SKIN);
    const swing = Math.round(Math.sin(tr.anim * 5) * 1.2);
    if (v.staff) {
      const sx = hx + 1;
      for (let y = top - 3; y < Y; y++) px(sx + (y > hy && step ? 1 : 0), y, [122, 90, 58]);
      px(sx, top - 4, [168, 128, 82]);
      px(sx + 1, top - 3, [122, 90, 58]);                 // the hook
      const lx = sx + 1 + swing, ly = top - 1;
      px(lx + 1, ly - 1, OUT); row(ly, lx, lx + 2, OUT); row(ly + 1, lx, lx + 2, [255, 226, 160]); row(ly + 2, lx, lx + 2, [255, 244, 210]); row(ly + 3, lx, lx + 2, OUT);
      tr.light = { x: lx + 1, y: ly + 2, r: 34, rgb: '255,214,150' };
    } else if (v.lamp === 'hand') {
      const lx = hx - 1 + swing, ly = hy + 1;
      row(ly, lx, lx + 2, OUT); row(ly + 1, lx, lx + 2, [255, 226, 160]); row(ly + 2, lx, lx + 2, [255, 244, 210]); row(ly + 3, lx, lx + 2, OUT);
      tr.light = { x: lx + 1, y: ly + 2, r: v.cane ? 24 : 30, rgb: '255,214,150' };
    } else if (v.jar) {
      const glow = 0.6 + 0.4 * Math.sin(t * 6 + tr.ph);
      row(hy, hx, hx + 1, [180, 200, 210]); row(hy + 1, hx, hx + 1, [150, 190, 120]); row(hy + 2, hx, hx + 1, [180, 200, 210]);
      px(hx + (step ? 1 : 0), hy + 1, [216, 255, 154].map(c => c * glow + 40));
      tr.light = { x: hx + 1, y: hy + 1, r: 18, rgb: '210,255,160' };
    }
    if (v.cane) {
      for (let i = 0; hy + i < Y; i++) px(hx + 1 + Math.floor(i / 4), hy + i, [118, 92, 64]);
    }
  }
  Y.drawTraveler = drawTraveler;

  Y.LOC.valley = Valley;
})(window.Y);

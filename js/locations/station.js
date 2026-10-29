'use strict';
/*
 * VIII. Вокзал тисячі дверей. Кругла площа, десятки напіввідчинених порталів із таймерами.
 * Бігати між ними — картинка пласка й сіра, простір крутиться, втома.
 * Обрати одні двері, увійти й дати їм зачинитися — і світ розгортається, живий і глибокий.
 */
(function (Y) {
  const U = Y.U, E = Y.E, A = Y.Audio, UI = Y.UI, TX = Y.TEXT;
  const N = 25, CX = 12 * 16 + 8, CY = 12 * 16 + 8, R = 10.3 * 16;

  function plazaMap() {
    const rows = [];
    for (let y = 0; y < N; y++) {
      let row = '';
      for (let x = 0; x < N; x++) {
        const d = Math.hypot(x * 16 + 8 - CX, y * 16 + 8 - CY);
        let c = d < 9.4 * 16 ? '.' : '#';
        if (x === 12 && y >= 21) c = '.';
        row += c;
      }
      rows.push(row);
    }
    return rows;
  }

  // flat grey picture of what is behind a door
  function drawScene(g, id, t, w, h, colour) {
    const C = (l, a = 1) => colour ? null : `rgba(${l},${l},${l},${a})`;
    const col = (rgb, l) => colour ? rgb : C(l);
    g.fillStyle = col(id === 'sea' ? '#3a7ab8' : id === 'party' ? '#2a1040' : '#203048', 70); g.fillRect(0, 0, w, h);
    switch (id) {
      case 'party':
        for (let i = 0; i < 5; i++) { g.fillStyle = col(U.hsl(t * 200 + i * 70, 90, 60), 120 + (i * 30) % 90); g.fillRect(4 + i * 6, h - 10 - (Math.sin(t * 8 + i) > 0 ? 2 : 0), 3, 8); }
        g.fillStyle = col('#ff6ad5', 200); g.fillRect(w / 2 - 2, 2, 4, 4); break;
      case 'travel':
        g.fillStyle = col('#f0c070', 180); g.fillRect(w - 10, 4, 5, 5);
        g.fillStyle = col('#e8f0ff', 220); g.fillRect((t * 14) % w, 8, 8, 2); g.fillRect((t * 14) % w + 3, 6, 2, 6);
        g.fillStyle = col('#2a5a8a', 90); g.fillRect(0, h - 7, w, 7); break;
      case 'career':
        for (let i = 0; i < 5; i++) { g.fillStyle = col('#8a9ab0', 110 + i * 20); g.fillRect(3 + i * 7, h - 4 - i * 3, 6, 4 + i * 3); }
        g.fillStyle = col('#ffd040', 240); g.fillRect(32, 3, 3, 3); break;
      case 'victory':
        g.fillStyle = col('#ffd040', 210); g.fillRect(w / 2 - 4, 5, 8, 6); g.fillRect(w / 2 - 1, 11, 2, 4); g.fillRect(w / 2 - 3, 15, 6, 2);
        for (let i = 0; i < 8; i++) { g.fillStyle = col(U.hsl(i * 45, 90, 65), 150 + i * 10); g.fillRect((i * 13 + t * 20) % w, (i * 7 + t * 25) % h, 1, 2); } break;
      case 'concert':
        g.fillStyle = col('#ffffff', 230); g.fillRect(w / 2 - 1, h - 12, 3, 8);
        for (let i = -2; i <= 2; i++) { g.fillStyle = col(U.hsl(t * 90 + i * 40, 90, 70, 0.5), 200); g.beginPath(); g.moveTo(w / 2 + i * 9, 0); g.lineTo(w / 2 + i * 4 - 3, h); g.lineTo(w / 2 + i * 4 + 3, h); g.fill(); } break;
      case 'sea':
        g.fillStyle = col('#ffe080', 230); g.fillRect(w - 12, 3, 6, 6);
        for (let i = 0; i < 4; i++) { g.fillStyle = col('#a8d8ff', 160); g.fillRect((i * 11 + t * 8) % w, h - 8 + i * 2, 6, 1); } break;
      case 'wedding':
        for (let i = 0; i < 7; i++) { g.fillStyle = col('#ffe0a0', 230); g.fillRect(3 + i * 5, 4 + Math.round(Math.sin(i) * 2), 2, 2); }
        g.fillStyle = col('#ffffff', 240); g.fillRect(w / 2 - 5, h - 12, 4, 10); g.fillRect(w / 2 + 2, h - 12, 4, 10); break;
      case 'city':
        for (let i = 0; i < 8; i++) { const bh = 6 + (i * 5) % 12; g.fillStyle = col('#2a3a58', 60); g.fillRect(i * 5, h - bh, 4, bh); g.fillStyle = col('#ffe080', 200); g.fillRect(i * 5 + 1, h - bh + 2, 1, 1); } break;
      case 'peak':
        g.fillStyle = col('#c8d4e8', 170); g.beginPath(); g.moveTo(0, h); g.lineTo(w * 0.4, 4); g.lineTo(w * 0.7, h * 0.5); g.lineTo(w, h); g.fill();
        g.fillStyle = col('#ffffff', 245); g.fillRect(w * 0.4 - 2, 4, 4, 3); break;
      case 'photo':
        g.fillStyle = col('#ffffff', 245); g.fillRect(0, 0, w, h * (Math.sin(t * 6) > 0.9 ? 1 : 0));
        g.fillStyle = col('#ffb0c8', 170); g.fillRect(w / 2 - 6, h / 2 - 4, 12, 8); break;
      default:
        g.strokeStyle = col('#70ff9a', 210); g.lineWidth = 1; g.beginPath(); g.moveTo(2, h - 3);
        for (let i = 0; i < 6; i++) g.lineTo(2 + i * 7, h - 3 - i * 3 - Math.sin(t * 3 + i) * 2); g.stroke();
    }
  }

  class Station extends Y.Loc {
    constructor(G) {
      super(G);
      this.map = new E.TileMap(plazaMap());
      this.map.noClamp = true;
      this.entry = { x: CX, y: 22 * 16 + 4, dir: 'up' };
      this.darkness = 0.7; this.darkRGB = '10,8,16';
      this.vignette = 0.5;
      this.stepOpts = { vol: 0.05, tone: 1200, echo: 0.25 };
      this.doors = [];
      for (let i = 0; i < 12; i++) {
        const a = -Math.PI / 2 + i * U.TAU / 12;
        if (Math.abs(a - Math.PI / 2) < 0.1) continue;
        const k = this.doors.length;
        this.doors.push({ i: k, a, x: CX + Math.cos(a) * R, y: CY + Math.sin(a) * R + 8, theme: TX.doors[k % TX.doors.length], timer: U.range(4, 14), open: U.range(0.3, 1), closedT: 0, dark: 0, c: U.canvas(36, 22) });
      }
      this.rush = 0; this.lastPeek = null; this.lastPeekT = -10; this.peek = null;
      this.tickAcc = 0; this.chosen = null; this.spin = 0;
      this.floor = this.buildFloor();
    }
    enter() {
      A.scene({ gala: 0.75 }, 3);
      A.lowpass('gala', 1600);
      A.rate('gala', 1);
    }
    speedMul() { return 1 - this.rush * 0.5; }

    buildFloor() {
      const m = this.map;
      return E.prerender(m.pw, m.ph, g => {
        g.fillStyle = '#0a0810'; g.fillRect(0, 0, m.pw, m.ph);
        g.save(); g.beginPath(); g.arc(CX, CY, 9.6 * 16, 0, U.TAU); g.clip();
        for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
          g.fillStyle = (tx + ty) & 1 ? '#262230' : '#221e2c'; g.fillRect(tx * 16, ty * 16, 16, 16);
        }
        for (let r = 30; r < 160; r += 28) { g.strokeStyle = 'rgba(200,180,255,0.07)'; g.beginPath(); g.arc(CX, CY, r, 0, U.TAU); g.stroke(); }
        g.restore();
        g.fillStyle = '#221e2c'; g.fillRect(12 * 16, 21 * 16, 16, 64);
        g.strokeStyle = '#3a3448'; g.lineWidth = 2; g.beginPath(); g.arc(CX, CY, 9.6 * 16, 0, U.TAU); g.stroke();
        // station clock in the middle of the floor
        g.fillStyle = '#16131e'; g.beginPath(); g.arc(CX, CY, 22, 0, U.TAU); g.fill();
        g.strokeStyle = '#5a5070'; g.lineWidth = 1; g.beginPath(); g.arc(CX, CY, 22, 0, U.TAU); g.stroke();
        for (let i = 0; i < 12; i++) { const a = i / 12 * U.TAU; g.fillStyle = '#8a80a0'; g.fillRect(Math.round(CX + Math.cos(a) * 18), Math.round(CY + Math.sin(a) * 18), 1, 1); }
      });
    }

    update(dt) {
      super.update(dt);
      const p = this.P, G = this.G;
      for (const d of this.doors) {
        if (this.chosen) { if (d !== this.chosen) d.dark = Math.min(1, d.dark + dt * (0.6 + d.i * 0.1)); continue; }
        d.timer -= dt * (1 + this.rush * 1.5);
        if (d.timer > 0) d.open = U.damp(d.open, d.timer > 1.5 ? 0.85 + 0.15 * Math.sin(this.t * 2 + d.i) : 0, 4, dt);
        else { d.open = U.damp(d.open, 0, 6, dt); d.closedT += dt; if (d.closedT > 1.2) { d.closedT = 0; d.timer = U.range(5, 14); } }
      }
      // peeking
      let pk = null;
      if (!this.chosen) for (const d of this.doors) if (U.dist(p.x, p.y, d.x, d.y + 6) < 30) pk = d;
      if (pk && pk !== this.peek) {
        if (this.lastPeek && this.lastPeek !== pk && this.t - this.lastPeekT < 7) this.rush = Math.min(1, this.rush + 0.24);
        this.lastPeek = pk; this.lastPeekT = this.t;
        A.sfx.whisper(0, 0.03);
      }
      this.peek = pk;
      if (!this.chosen) {
        if (p.moving && Math.hypot(p.vx, p.vy) > 40) this.rush = Math.min(1, this.rush + dt * 0.012);
        if (p.still > 1.2) this.rush = Math.max(0, this.rush - dt * 0.22);
        else this.rush = Math.max(0, this.rush - dt * 0.02);
      } else this.rush = Math.max(0, this.rush - dt * 0.8);
      // the plaza spins
      this.spin += this.rush * this.rush * dt * 0.9;
      if (this.rush < 0.08) this.spin = U.damp(this.spin, Math.round(this.spin / U.TAU) * U.TAU, 1.5, dt);
      E.cam.rot = this.spin + Math.sin(this.t * 1.7) * this.rush * 0.06;
      // ticking clocks
      this.tickAcc += dt * (1.5 + this.rush * 9);
      if (this.tickAcc > 1) { this.tickAcc = 0; A.sfx.tick(0.025 + this.rush * 0.03, U.range(-0.8, 0.8)); }
      if (pk && Math.random() < dt * 2) pk.theme.id === 'party' ? A.sfx.thud(0.05) : A.sfx.whisper(U.range(-0.3, 0.3), 0.02);
      A.rate('gala', 1 - this.rush * 0.05 + Math.sin(this.t * 2.3) * this.rush * 0.025);
      A.lowpass('gala', 1600 - this.rush * 900);
    }

    choose(d) {
      const G = this.G, p = this.P;
      if (this.chosen) return;
      this.chosen = d;
      G.locked = true;
      G.state.door = d.theme.id;
      A.sfx.whoosh(0.08);
      const x0 = p.x, y0 = p.y, t0 = performance.now();
      const step = () => {
        const k = Math.min(1, (performance.now() - t0) / 900);
        p.x = U.lerp(x0, d.x, k); p.y = U.lerp(y0, d.y + 2, k); p.alpha = 1 - k; p.moving = true; p.anim += 0.02;
        if (k < 1) requestAnimationFrame(step);
        else {
          d.open = 0; A.sfx.thud(0.4); E.shake(0.3, 2);
          setTimeout(() => G.goto('forest', { out: 1.6, door: d.theme.id }), 1400);
        }
      };
      requestAnimationFrame(step);
    }

    interactables() {
      if (this.chosen) return [];
      return this.doors.map(d => ({ x: d.x, y: d.y + 4, r: 26, label: TX.enter, px: d.x, py: d.y - 26, act: () => this.choose(d) }));
    }

    camTarget() { return { x: this.P.x, y: this.P.y - 10 }; }

    drawFloor(ctx) {
      E.blitWorld(ctx, this.floor);
      // clock hands spin faster when you rush
      const a1 = this.t * (0.2 + this.rush * 6), a2 = this.t * (0.02 + this.rush * 0.8);
      ctx.strokeStyle = '#c8bce0'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(CX, CY); ctx.lineTo(CX + Math.cos(a1) * 16, CY + Math.sin(a1) * 16); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(CX, CY); ctx.lineTo(CX + Math.cos(a2) * 10, CY + Math.sin(a2) * 10); ctx.stroke();
    }

    drawDoor(ctx, d) {
      const x = Math.round(d.x), y = Math.round(d.y);
      const w = 14, h = 22, dark = d.dark;
      // inside: bright and colourful from afar
      const g = d.c.getContext('2d');
      drawScene(g, d.theme.id, this.t + d.i, 36, 22, true);
      ctx.fillStyle = '#05040a'; ctx.fillRect(x - w / 2, y - h, w, h);
      if (d.open > 0.02 && dark < 1) {
        ctx.globalAlpha = (1 - dark);
        ctx.drawImage(d.c, 0, 0, 36, 22, x - w / 2 + 1, y - h + 1, w - 2, h - 2);
        ctx.globalAlpha = 1;
      }
      // the door leaf
      const leaf = Math.round((w - 2) * (1 - d.open));
      ctx.fillStyle = '#3a2a40'; ctx.fillRect(x - w / 2 + 1, y - h + 1, leaf, h - 1);
      ctx.fillStyle = '#4a3a52'; ctx.fillRect(x - w / 2 + 1, y - h + 1, 1, h - 1);
      // frame
      ctx.fillStyle = dark ? U.rgb(U.mixc([110, 100, 130], [30, 26, 36], dark)) : '#7a6c90';
      ctx.fillRect(x - w / 2 - 2, y - h - 2, w + 4, 2); ctx.fillRect(x - w / 2 - 2, y - h, 2, h); ctx.fillRect(x + w / 2, y - h, 2, h);
    }

    drawables() {
      return this.doors.map(d => ({ y: d.y, draw: ctx => this.drawDoor(ctx, d) }));
    }

    lights() {
      for (const d of this.doors) {
        if (d.dark >= 1) continue;
        const rgb = U.hslToRgb((this.t * 60 + d.i * 33) % 360, 80, 65).map(v => v | 0).join(',');
        E.addLight(d.x, d.y - 10, 36 + d.open * 20, (0.4 + d.open * 0.5) * (1 - d.dark), rgb, 0.4);
      }
      E.addLight(CX, CY, 50, 0.35, '200,190,255', 0.2);
    }

    drawPost(ctx) {
      E.tint(ctx, '#808080', this.rush * 0.5, 'saturation');
      this.vignette = 0.5 + this.rush * 0.4;
    }

    drawHud(h) {
      for (const d of this.doors) {
        if (d.dark >= 1) continue;
        const s = Math.max(0, Math.ceil(d.timer));
        E.text(h, '00:' + String(s).padStart(2, '0'), d.x, d.y - 27, { size: 5, color: s <= 2 ? '#ff8a8a' : '#d8d0e8', alpha: 0.85 * (1 - d.dark), font: "'Tiny5', monospace" });
      }
      // peek: up close the bright picture turns grey and flat, like someone else's photo
      const d = this.peek;
      if (d && !this.chosen) {
        const pic = Y.Peeks.frame(d.theme.id, this.t);
        E.hudScreen();
        const size = 46, sp = E.toScreen(d.x, d.y - 26);
        const x = U.clamp(sp.x - size / 2, 4, E.W - size - 4), y = U.clamp(sp.y - size - 8, 4, E.H - size - 14);
        h.save();
        h.imageSmoothingEnabled = true; h.imageSmoothingQuality = 'high';
        h.fillStyle = '#000'; h.fillRect(x - 1.5, y - 1.5, size + 3, size + 3);
        h.strokeStyle = '#5a5466'; h.lineWidth = 0.6; h.strokeRect(x - 1.5, y - 1.5, size + 3, size + 3);
        h.globalAlpha = 0.95;
        h.drawImage(pic, x, y, size, size);
        h.globalAlpha = 0.7; h.fillStyle = '#000'; h.fillRect(x, y + size - 8, size, 8);
        h.restore();
        E.text(h, d.theme.title, x + size / 2, y + size - 3.8, { size: 5, color: '#d8d2e2', alpha: 0.95 });
        E.hudWorld();
      }
    }
  }
  Y.LOC.station = Station;

  /* ---------------- the world behind the chosen door ---------------- */
  const FW = 40, FH = 26;
  const RACCOON = { x: 2 * 16 + 4, y: 2 * 16 + 12 };  // easter egg: Енот Земляной, digging in the top-left corner
  function forestMap() {
    const r = U.rng(66), rows = [];
    const pathY = x => 22 - (x / FW) * 19 + Math.sin(x * 0.3) * 2;
    for (let y = 0; y < FH; y++) {
      let row = '';
      for (let x = 0; x < FW; x++) {
        let c = '.';
        const border = x < 1 || y < 1 || x > FW - 2 || y > FH - 2;
        const onPath = Math.abs(y - pathY(x)) < 2.2;
        const clearing = Math.hypot(x - 20, (y - 13) * 1.2) < 5;
        if (border) c = 'T';
        else if (!onPath && !clearing && r() < 0.16) c = 'T';
        if (x >= FW - 2 && Math.abs(y - pathY(x)) < 1.6) c = '.';
        if (x === 2 && y === 4) c = '.';  // a small clearing, so the pine doesn't hide the raccoon
        row += c;
      }
      rows.push(row);
    }
    return rows;
  }

  class Forest extends Y.Loc {
    constructor(G, opts = {}) {
      super(G);
      this.map = new E.TileMap(forestMap());
      this.solidChars = 'T';
      this.entry = { x: 2 * 16 + 8, y: 21 * 16 + 8, dir: 'right' };
      this.savePos = false;
      this.theme = TX.doors.find(d => d.id === (opts.door || G.state.door)) || TX.doors[0];
      this.darkness = 0.22; this.darkRGB = '40,24,10';
      this.vignette = 0.3;
      this.playerLight = { r: 60, a: 0.6, rgb: '255,226,180', ca: 0.1 };
      this.stepOpts = { vol: 0.035, tone: 420 };
      this.trees = this.map.find('T').map(t => ({ x: t.x, y: t.y + 6, s: 0.8 + U.hash(t.tx * 31 + t.ty * 7) * 0.5, h: U.hash(t.tx + t.ty * 13) }));
      this.prop = { x: 20 * 16 + 8, y: 13 * 16 + 8 };
      this.pollen = [];
      for (let i = 0; i < 70; i++) this.pollen.push({ x: Math.random() * FW * 16, y: Math.random() * FH * 16, ph: Math.random() * 6 });
      this.flies = new E.Fireflies(10, { x: 200, y: 120, w: 260, h: 140 }, 4, { rgb: '255,240,180', radius: 10, spread: 30 });
      this.floor = this.buildFloor();
      this.done = false;
    }
    enter() {
      A.scene({ gala: 0.85, ptici: 0.25 }, 3);
      A.lowpass('gala', 20000, 3);
      A.rate('gala', 1);
      A.loop('wind', 0.07, 3);
      setTimeout(() => { if (this.G.loc === this) this.G.say(TX.forestIn); }, 2600);
    }

    buildFloor() {
      const m = this.map, r = U.rng(8);
      return E.prerender(m.pw, m.ph, g => {
        for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
          const x = tx * 16, y = ty * 16;
          g.fillStyle = (tx + ty) & 1 ? '#3f6a34' : '#3c6632'; g.fillRect(x, y, 16, 16);
          for (let i = 0; i < 6; i++) { g.fillStyle = U.pick(['#4f7e3e', '#355c2c', '#5a8a44'], r); g.fillRect(x + Math.floor(r() * 15), y + Math.floor(r() * 15), 1, 2); }
          if (r() < 0.08) { g.fillStyle = U.pick(['#ffe36a', '#ffffff', '#ff9ad0', '#9ad0ff'], r); g.fillRect(x + Math.floor(r() * 14), y + Math.floor(r() * 14), 1, 1); }
        }
        // the path
        for (let x = 0; x < m.pw; x += 2) {
          const py = (22 - (x / 16 / FW) * 19 + Math.sin(x / 16 * 0.3) * 2) * 16 + 8;
          g.fillStyle = '#8a6e4a'; g.fillRect(x, py - 6, 2, 12);
          g.fillStyle = '#9a7e56'; g.fillRect(x, py - 3, 2, 5);
        }
        g.fillStyle = 'rgba(160,190,90,0.25)'; g.beginPath(); g.ellipse(20 * 16 + 8, 13 * 16 + 8, 80, 64, 0, 0, U.TAU); g.fill();
      });
    }

    update(dt) {
      super.update(dt);
      this.flies.update(dt, this.t);
      for (const p of this.pollen) { p.x += (14 + Math.sin(this.t + p.ph) * 6) * dt; p.y += Math.sin(this.t * 0.7 + p.ph) * 4 * dt; if (p.x > FW * 16) p.x = 0; }
      const p = this.P;
      if (!this.done && p.x > (FW - 1.5) * 16) { this.done = true; this.G.goto('stars', { out: 2, color: '#000' }); }
      // a little dirt flies from under the raccoon's paws
      if (Math.random() < dt * 1.6) this.particles.add({ x: RACCOON.x + 8, y: RACCOON.y - 3, vx: U.range(-6, 14), vy: U.range(-26, -12), grav: 90, life: 0.6, size: 1, color: '#6a4a2a' });
    }

    interactables() {
      return [
        { x: this.prop.x, y: this.prop.y, r: 30, label: TX.look, act: () => this.G.say([this.theme.prop]) },
        { x: RACCOON.x, y: RACCOON.y, r: 22, label: TX.look, py: RACCOON.y - 12,
          act: () => this.G.say(TX.eggs.raccoon).then(() => this.G.egg('raccoon')) }
      ];
    }

    drawFloor(ctx) {
      E.blitWorld(ctx, this.floor);
      // tree shadows
      for (const t of this.trees) {
        if (!E.inView(t.x, t.y, 30)) continue;
        ctx.globalAlpha = 0.25; E.ellipse(ctx, t.x + 6, t.y + 2, 11 * t.s, 4 * t.s, '#0a1a08'); ctx.globalAlpha = 1;
      }
      this.drawProp(ctx);
    }

    drawProp(ctx) {
      const x = this.prop.x, y = this.prop.y, t = this.t, id = this.theme.id;
      const R = (c, dx, dy, w, h) => E.rect(ctx, x + dx, y + dy, w, h, c);
      if (id === 'party') {
        R('#5a3a24', -6, 2, 12, 3);
        R(Math.sin(t * 12) > 0 ? '#ffb040' : '#ff7a20', -3, -4, 6, 6); R('#ffe080', -1, -3, 2, 3);
        [[-16, 0], [14, 2], [-2, 12]].forEach(([dx, dy]) => { R('#3a2a3a', dx - 2, dy - 8, 5, 8); R('#3a2a3a', dx - 2, dy - 12, 5, 4); });
      } else if (id === 'travel') { R('#6a4a2a', -6, -2, 12, 6); R('#f0e6c8', -5, -6, 10, 6); R('#c84a4a', -2, -4, 4, 1); R('#4a7ac8', -4, -5, 1, 4); }
      else if (id === 'career') { R('#7a5a3a', -10, -4, 20, 6); R('#d8b080', -2, -8, 5, 4); R('#c89060', 2, -9, 2, 2); }
      else if (id === 'victory') { R('#c84a4a', -1, -10, 2, 6); R('#ffd040', -3, -4, 6, 6); R('#fff0a0', -1, -3, 2, 2); }
      else if (id === 'concert') { R('#3a2a3a', -2, -14, 5, 10); R('#3a2a3a', -2, -18, 5, 4); R('#c87a3a', 2, -10, 6, 4); R('#c87a3a', 7, -14, 1, 5); }
      else if (id === 'sea') { ctx.fillStyle = '#3a7ab0'; ctx.beginPath(); ctx.ellipse(x, y, 30, 14, 0, 0, U.TAU); ctx.fill(); for (let i = 0; i < 4; i++) R('#a8d8ff', -20 + ((i * 13 + t * 6) % 36), -6 + i * 4, 5, 1); }
      else if (id === 'wedding') { for (let i = 0; i < 9; i++) R(i % 2 ? '#ffd0a0' : '#ffa0c0', -24 + i * 6, -16 + Math.round(Math.sin(i * 0.8) * 3), 3, 3); }
      else if (id === 'city') { for (let i = 0; i < 9; i++) R('#ffe080', -24 + i * 6, -2 + (i % 3), 1, 1); R('#6a5a4a', -12, 4, 24, 2); }
      else if (id === 'peak') { ctx.fillStyle = '#5a8a4a'; ctx.beginPath(); ctx.ellipse(x, y, 24, 12, 0, 0, U.TAU); ctx.fill(); R('#7aa86a', -8, -6, 16, 4); }
      else if (id === 'photo') { R('#6a4a2a', -12, 0, 24, 5); R('#2a2a30', -4, -6, 8, 6); R('#8a8aa0', -2, -5, 4, 4); }
      else { for (let i = 0; i < 5; i++) { R('#5a3a24', -14 + i * 7, 0, 5, 3); R('#7ad06a', -13 + i * 7, -3 - (i % 2), 1, 3); R('#9ae08a', -12 + i * 7, -4, 1, 1); } }
    }

    drawables() {
      const out = [];
      for (const t of this.trees) {
        if (!E.inView(t.x, t.y, 50)) continue;
        out.push({ y: t.y, draw: ctx => {
          const s = t.s, x = t.x, y = t.y;
          E.rect(ctx, x - 1, y - 7 * s, 3, 7 * s, '#5a3a24');
          const layers = 3;
          for (let i = 0; i < layers; i++) {
            const w = (14 - i * 3) * s, yy = y - 6 * s - i * 7 * s;
            ctx.fillStyle = i === 0 ? '#1f4a2a' : i === 1 ? '#265a32' : '#2f6a3a';
            ctx.beginPath(); ctx.moveTo(x - w, yy); ctx.lineTo(x + w, yy); ctx.lineTo(x + 0.5, yy - 12 * s); ctx.fill();
            ctx.fillStyle = 'rgba(160,220,120,0.18)';
            ctx.beginPath(); ctx.moveTo(x - w * 0.6, yy - 1); ctx.lineTo(x, yy - 1); ctx.lineTo(x + 0.5, yy - 11 * s); ctx.fill();
          }
        } });
      }
      out.push({ y: RACCOON.y, draw: ctx => drawRaccoon(ctx, RACCOON.x, RACCOON.y, this.t) });
      out.push({ y: 9999, draw: ctx => this.flies.draw(ctx) });
      return out;
    }

    drawTop(ctx) {
      for (const p of this.pollen) {
        if (!E.inView(p.x, p.y, 4)) continue;
        ctx.globalAlpha = 0.5 + 0.4 * Math.sin(this.t * 2 + p.ph);
        ctx.fillStyle = '#fff6c0'; ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
      }
      ctx.globalAlpha = 1;
    }

    lights() {
      this.flies.lights();
      // sun shafts
      for (let i = 0; i < 6; i++) E.addLight(80 + i * 110, 60 + (i % 3) * 120, 90, 0.5, '255,220,150', 0.18);
      if (this.theme.id === 'party') E.addLight(this.prop.x, this.prop.y - 2, 50, 0.8, '255,170,80', 0.4);
    }

    drawPost(ctx) {
      E.tint(ctx, '#ffd090', 0.12, 'soft-light');
    }
  }
  // Енот Земляной, side view facing right, busy with a little mound of earth
  function drawRaccoon(ctx, x, y, t) {
    const dig = Math.sin(t * 9) > 0.3 ? 1 : 0, bob = Math.round(Math.abs(Math.sin(t * 4.5)));
    ctx.globalAlpha = 0.3; E.ellipse(ctx, x, y, 9, 2, '#0a1a08'); ctx.globalAlpha = 1;
    E.rect(ctx, x + 7, y - 2, 6, 2, '#6a4a2a'); E.rect(ctx, x + 8, y - 3, 4, 1, '#7a5a34');               // mound
    for (let i = 0; i < 5; i++) E.rect(ctx, x - 10 + i, y - 7 + (i < 2 ? 1 : 0), 1, 3, i % 2 ? '#2e2c34' : '#8e8c98');  // ringed tail
    E.rect(ctx, x - 5, y - 7 + bob, 9, 5, '#7c7a86'); E.rect(ctx, x - 4, y - 8 + bob, 7, 1, '#6a6874');   // body
    E.rect(ctx, x - 4, y - 2, 2, 2, '#3a3842'); E.rect(ctx, x + 2, y - 2 - dig, 2, 2, '#3a3842');          // paws
    E.rect(ctx, x + 3, y - 10 + bob, 5, 4, '#8e8c98');                                                  // head
    E.rect(ctx, x + 3, y - 11 + bob, 1, 1, '#6a6874'); E.rect(ctx, x + 6, y - 11 + bob, 1, 1, '#6a6874'); // ears
    E.rect(ctx, x + 3, y - 9 + bob, 5, 1, '#1e1c24');                                                   // mask
    E.rect(ctx, x + 6, y - 9 + bob, 1, 1, '#f2f0f4');                                                   // eye
    E.rect(ctx, x + 4, y - 7 + bob, 4, 1, '#e6e4ea');                                                   // white muzzle
    E.rect(ctx, x + 8, y - 8 + bob, 1, 1, '#1e1c24');                                                   // nose
  }

  Y.LOC.forest = Forest;
})(window.Y);

'use strict';
/* 0 / 0′ — Зоряна зала. Темна зала з колонами серед зір; світло лише від зір, світлячків і персонажа. */
(function (Y) {
  const U = Y.U, E = Y.E, A = Y.Audio, S = Y.S, TX = Y.TEXT;
  const MAP = [
    '~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~A~~~~~~~~~~~',
    '~~~~~~~~~.....~~~~~~~~~',
    '~~~~~~~.........~~~~~~~',
    '~~~~~~...........~~~~~~',
    '~~~~~.............~~~~~',
    '~~~~...............~~~~',
    '~~~~..C.........C..~~~~',
    '~~~~...............~~~~',
    '~~~~...............~~~~',
    '~~~~......,........~~~~',
    '~~~~..C.........C..~~~~',
    '~~~~...............~~~~',
    '~~~~.........,.....~~~~',
    '~~~~...............~~~~',
    '~~~~..C.........C..~~~~',
    '~~~~...............~~~~',
    '~~~~....,..........~~~~',
    '~~~~...............~~~~',
    '~~~~..C.........C..~~~~',
    '~~~~...............~~~~',
    '~~~~...........,...~~~~',
    '~~~~...............~~~~',
    '~~~~..C.........C..~~~~',
    '~~~~...............~~~~',
    '~~~~...............~~~~',
    '~~~~.....,.........~~~~',
    '~~~~..C.........C..~~~~',
    '~~~~...............~~~~',
    '~~~~~.............~~~~~',
    '~~~~~~...........~~~~~~',
    '~~~~~~~.........~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~'
  ];
  // symbols carved on the columns in 0′ — one for every room
  const GLYPHS = ['wave', 'window', 'stone', 'slab', 'flower', 'note', 'mask', 'door', 'star', 'wave', 'window', 'stone'];

  class Hall extends Y.Loc {
    constructor(G, opts = {}) {
      super(G);
      this.ret = !!opts.ret;
      this.title = !!opts.title;
      this.map = new E.TileMap(MAP.slice());
      this.map.noClamp = true;
      this.solidChars = '~CA';
      this.savePos = true;
      this.entry = { x: 11 * 16 + 8, y: 29 * 16 + 12, dir: 'up' };
      this.psy = { x: 11 * 16 + 8, y: 6 * 16 + 10, a: this.title ? 0 : 1 };
      this.arch = { x: 11 * 16 + 8, y: 2 * 16, open: 0 };
      this.starsFar = new E.Starfield(220, 5, { period: 300, parallax: 0.06 });
      this.stars = new E.Starfield(140, 11, { period: 380, parallax: 0.22 });
      this.ff = new E.Fireflies(this.ret ? 42 : 26, { x: 4 * 16, y: 3 * 16, w: 15 * 16, h: 26 * 16 }, this.ret ? 21 : 9, { spread: 50 });
      this.darkness = this.ret ? 0.7 : 0.93;
      this.darkRGB = this.ret ? '12,9,26' : '3,3,10';
      this.vignette = this.ret ? 0.35 : 0.55;
      this.stepOpts = { vol: 0.045, tone: 1000, echo: 0.22 };
      this.columns = this.map.find('C').map((c, i) => ({ x: c.x, y: c.y, i, glyph: GLYPHS[i % GLYPHS.length], candle: this.ret && i % 3 !== 1 }));
      this.bigStars = [
        [-20, 140, 90, '200,215,255'], [390, 90, 100, '255,226,190'], [10, 330, 80, '230,210,255'],
        [370, 310, 90, '200,225,255'], [-10, 470, 80, '255,230,200'], [380, 470, 85, '220,210,255'],
        [184, -60, 120, '255,240,210'], [70, 0, 70, '210,220,255'], [300, 10, 80, '240,215,255']
      ].map(([x, y, r, rgb], i) => ({ x, y, r, rgb, ph: i * 1.7 }));
      this.floor = this.buildFloor();
      this.orb = null;
      if (this.title) { this.showPlayer = false; this.psy.a = 0; }
      if (!this.ret && !this.title && G.seen('hallMeet')) { this.arch.open = 1; this.psy.a = 0; }
      if (this.ret && G.seen('hallReturn')) this.psy.a = 1;
    }

    enter() {
      if (this.title) return;
      A.scene(this.ret ? { final: 0.9 } : { prostranstvo: 0.9 }, 3);
    }

    solid(tx, ty) {
      const c = this.map.ch(tx, ty);
      if (c === 'A') return this.arch.open < 0.6;
      return c === null || this.solidChars.includes(c);
    }

    buildFloor() {
      const m = this.map, ret = this.ret;
      const r = U.rng(ret ? 77 : 42);
      return E.prerender(m.pw, m.ph, g => {
        const base = ret ? ['#232238', '#26253c'] : ['#171628', '#1a192c'];
        for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
          const c = m.ch(tx, ty);
          if (c === '~') {
            // a cliff edge below the platform
            const up = m.ch(tx, ty - 1);
            if (up && up !== '~') {
              const gr = g.createLinearGradient(0, ty * 16, 0, ty * 16 + 12);
              gr.addColorStop(0, ret ? '#1a1828' : '#0c0b14'); gr.addColorStop(1, 'rgba(0,0,0,0)');
              g.fillStyle = gr; g.fillRect(tx * 16, ty * 16, 16, 12);
            }
            continue;
          }
          const x = tx * 16, y = ty * 16;
          g.fillStyle = base[(tx + ty) & 1]; g.fillRect(x, y, 16, 16);
          g.fillStyle = ret ? '#151424' : '#0a0912';
          g.fillRect(x, y + 15, 16, 1); g.fillRect(x + 15, y, 1, 16);
          // star reflections in polished stone
          for (let i = 0; i < 2; i++) if (r() < 0.35) {
            g.fillStyle = `rgba(190,200,255,${0.05 + r() * 0.12})`;
            g.fillRect(x + 1 + Math.floor(r() * 14), y + 1 + Math.floor(r() * 14), 1, 1);
          }
          if (r() < 0.12) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x + 2 + Math.floor(r() * 8), y + 3 + Math.floor(r() * 8), 4, 1); }
          // central runner with an inlaid line of stars
          if (tx >= 9 && tx <= 13 && ty >= 4) {
            g.fillStyle = ret ? 'rgba(80,60,120,0.25)' : 'rgba(40,30,70,0.25)'; g.fillRect(x, y, 16, 16);
            if (tx === 9) { g.fillStyle = ret ? 'rgba(220,190,120,0.35)' : 'rgba(150,130,90,0.18)'; g.fillRect(x, y, 1, 16); }
            if (tx === 13) { g.fillStyle = ret ? 'rgba(220,190,120,0.35)' : 'rgba(150,130,90,0.18)'; g.fillRect(x + 15, y, 1, 16); }
            if (tx === 11 && ty % 2 === 0) {
              g.fillStyle = ret ? 'rgba(255,225,160,0.45)' : 'rgba(200,190,255,0.16)';
              g.fillRect(x + 7, y + 5, 2, 6); g.fillRect(x + 5, y + 7, 6, 2);
            }
          }
          // cracks with tiny flowers
          if (c === ',') {
            g.fillStyle = '#07060c';
            g.fillRect(x + 3, y + 6, 5, 1); g.fillRect(x + 7, y + 7, 4, 1); g.fillRect(x + 10, y + 8, 2, 1);
            g.fillStyle = '#3e6a4a'; g.fillRect(x + 8, y + 5, 1, 2);
            g.fillStyle = ret ? '#ffd2e6' : '#8a7aa6'; g.fillRect(x + 8, y + 4, 1, 1);
          }
          if (ret && r() < 0.18) {
            g.fillStyle = '#2f5a3e'; g.fillRect(x + Math.floor(r() * 13), y + Math.floor(r() * 13), 2, 1);
            if (r() < 0.5) { g.fillStyle = ['#ffe3a3', '#f6c6ff', '#bfe3ff'][Math.floor(r() * 3)]; g.fillRect(x + Math.floor(r() * 14), y + Math.floor(r() * 14), 1, 1); }
          }
          // rim light on top edges
          if (m.ch(tx, ty - 1) === '~') { g.fillStyle = ret ? '#3a3656' : '#25233a'; g.fillRect(x, y, 16, 1); }
        }
        // compass mosaic where Psyche stands
        const cx = this.psy.x, cy = this.psy.y + 2;
        g.strokeStyle = ret ? 'rgba(255,220,150,0.45)' : 'rgba(170,160,230,0.18)'; g.lineWidth = 1;
        g.beginPath(); g.arc(cx, cy, 22, 0, U.TAU); g.stroke();
        g.beginPath(); g.arc(cx, cy, 14, 0, U.TAU); g.stroke();
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * U.TAU, l = i % 2 ? 14 : 22;
          g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * l, cy + Math.sin(a) * l); g.stroke();
        }
      });
    }

    update(dt) {
      super.update(dt);
      this.ff.update(dt, this.t);
      const p = this.P, G = this.G;
      if (this.title) return;
      // first meeting
      if (!this.ret && this.psy.a > 0.5 && !G.seen('hallMeet') && this.near(this.psy.x, this.psy.y, 62) && !G.locked) {
        G.once('hallMeet');
        p.dir = 'up';
        const lines = TX.hallMeet.slice();
        lines[lines.length - 1] = { t: lines[lines.length - 1], fn: () => { this.openArch = true; A.sfx.chime(660, 0.08); } };
        G.say(lines).then(() => {
          this.openArch = true;
          this.orb = { x: this.psy.x, y: this.psy.y - 18, t: 0 };
        });
      }
      if (this.openArch) this.arch.open = Math.min(1, this.arch.open + dt * 0.5);
      if (this.orb) {
        this.psy.a = Math.max(0, this.psy.a - dt * 0.6);
        const o = this.orb; o.t += dt;
        o.x = U.damp(o.x, this.arch.x, 0.6, dt); o.y = U.damp(o.y, this.arch.y - 6, 0.6, dt);
        if (o.t > 9) this.orb = null;
      }
      // arch → corridor
      if (!this.ret && this.arch.open > 0.6 && p.y < this.arch.y + 6 && Math.abs(p.x - this.arch.x) < 14) G.goto('corridor');
      // return: last conversation
      if (this.ret && !G.seen('hallReturn') && this.near(this.psy.x, this.psy.y, 62) && !G.locked) {
        G.once('hallReturn');
        p.dir = 'up';
        G.say(TX.hallReturn).then(() => G.finish());
      }
      if (this.arch.open > 0 && Math.random() < dt * 8 * this.arch.open) {
        this.particles.add({ x: this.arch.x + U.range(-10, 10), y: this.arch.y - U.range(0, 26), vx: U.range(-4, 4), vy: U.range(4, 14), life: 2.5, size: 1, color: '#ffe8c0', light: 6, rgb: '255,220,160', la: 0.4 });
      }
    }

    camTarget() {
      if (this.title) return { x: 184, y: 280 - Math.sin(this.t * 0.06) * 150 };
      return { x: this.P.x, y: this.P.y - 10 };
    }

    drawBack(ctx) {
      this.starsFar.draw(ctx, this.t, this.ret ? 0.9 : 0.7);
      this.stars.draw(ctx, this.t * 1.3, 1);
    }
    cutDark(l) {
      this.drawBack(l);
      E.applyCam(l);
      this.drawStarsBig(l);
      this.ff.draw(l);
    }

    drawFloor(ctx) {
      E.blitWorld(ctx, this.floor);
      this.drawStarsBig(ctx);
    }
    drawStarsBig(ctx) {
      for (const s of this.bigStars) {
        const tw = 0.75 + 0.25 * Math.sin(this.t * 0.9 + s.ph);
        ctx.fillStyle = `rgba(${s.rgb},${0.9 * tw})`;
        ctx.fillRect(Math.round(s.x) - 1, Math.round(s.y) - 1, 3, 3);
        ctx.fillStyle = `rgba(${s.rgb},${0.35 * tw})`;
        ctx.fillRect(Math.round(s.x) - 5, Math.round(s.y), 11, 1);
        ctx.fillRect(Math.round(s.x), Math.round(s.y) - 5, 1, 11);
      }
    }

    drawColumn(ctx, c) {
      const x = c.x, y = c.y + 6, ret = this.ret;
      ctx.globalAlpha = 0.5; E.ellipse(ctx, x, y, 10, 3, '#000'); ctx.globalAlpha = 1;
      E.rect(ctx, x - 8, y - 5, 16, 5, ret ? '#37344a' : '#2b2939');
      E.rect(ctx, x - 8, y - 5, 16, 1, ret ? '#4c4864' : '#3b3850');
      E.rect(ctx, x - 5, y - 42, 10, 37, ret ? '#302d42' : '#24222f');
      E.rect(ctx, x - 5, y - 42, 1, 37, ret ? '#45405e' : '#33304a');
      E.rect(ctx, x - 2, y - 42, 1, 37, ret ? '#272439' : '#1c1a26');
      E.rect(ctx, x + 1, y - 42, 1, 37, ret ? '#272439' : '#1c1a26');
      E.rect(ctx, x + 4, y - 42, 1, 37, ret ? '#211f30' : '#17151f');
      E.rect(ctx, x - 7, y - 46, 14, 4, ret ? '#3a3750' : '#2f2c3e');
      E.rect(ctx, x - 8, y - 48, 16, 2, ret ? '#4a4664' : '#38354c');
      if (!ret) return;
      // carvings, vines, flowers, candles
      const gx = x, gy = y - 26, a = 0.55 + 0.25 * Math.sin(this.t * 1.5 + c.i);
      ctx.fillStyle = `rgba(255,214,150,${a})`;
      drawGlyph(ctx, c.glyph, gx, gy);
      ctx.fillStyle = '#3f7a50';
      for (let k = 0; k < 9; k++) {
        const vy = y - 6 - k * 4, vx = x - 5 + Math.round(Math.sin(k * 1.3 + c.i) * 5 + 5);
        ctx.fillRect(vx, vy, 1, 2);
        if (k % 2 === 0) { ctx.fillStyle = '#5fa06a'; ctx.fillRect(vx + 1, vy, 1, 1); ctx.fillStyle = '#3f7a50'; }
      }
      ctx.fillStyle = '#ffc9e4'; ctx.fillRect(x - 9, y - 2, 1, 1); ctx.fillRect(x + 8, y - 3, 1, 1);
      ctx.fillStyle = '#fff1b8'; ctx.fillRect(x + 7, y - 1, 1, 1);
      if (c.candle) {
        E.rect(ctx, x + 6, y - 9, 2, 4, '#efe4cf');
        const f = Math.sin(this.t * 13 + c.i) > 0 ? '#ffd27a' : '#ffb64a';
        E.rect(ctx, x + 6, y - 11, 2, 2, f);
      }
    }

    drawArch(ctx) {
      const x = this.arch.x, y = this.arch.y, o = this.arch.open;
      const inner = o > 0 ? `rgba(255,${200 + 30 * o | 0},${140 + 60 * o | 0},${0.25 + 0.7 * o})` : '#050409';
      ctx.fillStyle = '#050409';
      ctx.fillRect(x - 10, y - 30, 20, 30);
      ctx.beginPath(); ctx.arc(x, y - 30, 10, Math.PI, 0); ctx.fill();
      if (o > 0) {
        ctx.fillStyle = inner;
        ctx.fillRect(x - 9, y - 30, 18, 30);
        ctx.beginPath(); ctx.arc(x, y - 30, 9, Math.PI, 0); ctx.fill();
      }
      ctx.fillStyle = '#2d2a3d';
      ctx.fillRect(x - 15, y - 34, 5, 34); ctx.fillRect(x + 10, y - 34, 5, 34);
      ctx.fillStyle = '#3a3750'; ctx.fillRect(x - 15, y - 34, 1, 34); ctx.fillRect(x + 10, y - 34, 1, 34);
      ctx.strokeStyle = '#2d2a3d'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(x, y - 32, 12.5, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = o > 0 ? '#ffe7b0' : '#4a4562';
      ctx.fillRect(x - 1, y - 48, 2, 3);
    }

    drawables() {
      const out = this.columns.map(c => ({ y: c.y + 6, draw: ctx => this.drawColumn(ctx, c) }));
      if (!this.ret) out.push({ y: this.arch.y, draw: ctx => this.drawArch(ctx) });
      if (this.psy.a > 0) out.push({ y: this.psy.y, draw: ctx => S.drawPsyche(ctx, this.psy.x, this.psy.y, this.t, this.psy.a) });
      out.push({ y: 9999, draw: ctx => this.ff.draw(ctx) });
      if (this.orb) out.push({ y: 9999, draw: ctx => { E.rect(ctx, this.orb.x - 1, this.orb.y - 1, 2, 2, '#f4ecff'); } });
      return out;
    }

    lights() {
      this.ff.lights();
      for (const s of this.bigStars) E.addLight(s.x, s.y, s.r * (0.9 + 0.1 * Math.sin(this.t + s.ph)), this.ret ? 0.75 : 0.55, s.rgb, 0.25);
      if (this.psy.a > 0) E.addLight(this.psy.x, this.psy.y - 18, 84, 0.95 * this.psy.a, '210,190,255', 0.38);
      if (this.orb) E.addLight(this.orb.x, this.orb.y, 24, 0.8, '220,200,255', 0.5);
      if (this.arch.open > 0) E.addLight(this.arch.x, this.arch.y - 18, 90 * this.arch.open, 0.9, '255,214,150', 0.35);
      if (this.ret) {
        for (const c of this.columns) if (c.candle) E.addLight(c.x + 7, c.y - 6, 30 + Math.sin(this.t * 9 + c.i) * 2, 0.7, '255,190,110', 0.4);
        for (const c of this.columns) E.addLight(c.x, c.y - 20, 22, 0.25, '255,214,150', 0.25);
      }
    }
  }

  function drawGlyph(ctx, kind, x, y) {
    const R = (a, b, w, h) => ctx.fillRect(Math.round(x + a), Math.round(y + b), w, h);
    switch (kind) {
      case 'wave': R(-3, 0, 2, 1); R(-1, -1, 2, 1); R(1, 0, 2, 1); R(-3, 3, 2, 1); R(-1, 2, 2, 1); R(1, 3, 2, 1); break;
      case 'window': R(-3, -3, 6, 1); R(-3, 3, 6, 1); R(-3, -3, 1, 7); R(2, -3, 1, 7); R(-1, -3, 1, 7); R(-3, 0, 6, 1); break;
      case 'stone': R(-2, -1, 4, 3); R(-1, -2, 2, 1); R(-1, 2, 3, 1); break;
      case 'slab': R(-3, 2, 6, 2); R(-2, -1, 4, 2); R(-1, -4, 2, 2); break;
      case 'flower': R(0, -1, 1, 4); R(-2, -3, 2, 2); R(1, -3, 2, 2); R(-1, -4, 2, 1); break;
      case 'note': R(1, -4, 1, 6); R(-1, 1, 3, 2); R(1, -4, 2, 1); break;
      case 'mask': R(-3, -3, 6, 1); R(-3, -2, 1, 1); R(-1, -2, 2, 1); R(2, -2, 1, 1); R(-3, -1, 6, 1); R(-2, 0, 4, 1); R(-1, 1, 2, 1); break;
      case 'door': R(-3, -4, 6, 1); R(-3, -4, 1, 8); R(2, -4, 1, 8); R(1, 0, 1, 1); break;
      default: R(0, -3, 1, 7); R(-3, 0, 7, 1); R(-1, -1, 3, 3);
    }
  }
  Y.drawGlyph = drawGlyph;

  Y.LOC.hall = Hall;
  Y.LOC.hall2 = class extends Hall { constructor(G, o = {}) { super(G, Object.assign({}, o, { ret: true })); } };
})(window.Y);

'use strict';
/*
 * VI. Майстерня луни. Холодні машини креслять прямі лінії й шумлять.
 * Долоня на панелі — і вони синхронізуються з серцем, підхоплюють твій рух і ноту,
 * перетворюючи їх на симфонію світла під куполом.
 */
(function (Y) {
  const U = Y.U, E = Y.E, A = Y.Audio, I = Y.Input, UI = Y.UI, TX = Y.TEXT;
  const MAP = [
    '#####################',
    '#MMMMMMMMMDMMMMMMMMM#',
    '#M.................M#',
    '#M.................M#',
    '#M.................M#',
    '#M.................M#',
    '#M.................M#',
    '#M.................M#',
    '#M.................M#',
    '#M.................M#',
    '#M.................M#',
    '#M.................M#',
    '#M.................M#',
    '#M.................M#',
    '#M.................M#',
    '#####################'
  ];
  const C = { x: 10 * 16 + 8, y: 8 * 16 };       // dome centre
  const PANEL = { x: 10 * 16 + 8, y: 9 * 16 + 4 };
  const SCALE = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3];

  class Workshop extends Y.Loc {
    constructor(G) {
      super(G);
      this.map = new E.TileMap(MAP.slice());
      this.solidChars = '#MD';
      this.entry = { x: 2 * 16 + 12, y: 14 * 16 + 8, dir: 'up' };
      this.darkness = 0.62; this.darkRGB = '4,8,16';
      this.vignette = 0.45;
      this.stepOpts = { vol: 0.05, tone: 1800, echo: 0.2 };
      this.state = 'idle';
      this.lines = []; this.lineAcc = 0;
      this.beat = 0; this.beatT = 0; this.sync = 0;
      this.brush = { x: C.x, y: C.y };
      this.trail = []; this.trailAcc = 0;
      this.bursts = [];
      this.progress = 0; this.doorA = 0; this.auto = 0;
      this.gears = [[2, 3], [18, 5], [2, 11], [18, 12], [6, 1], [14, 1]].map(([tx, ty], i) => ({ x: tx * 16 + 8, y: ty * 16 + 8, r: 7 + (i % 3) * 2, a: 0, sp: (i % 2 ? 1 : -1) * U.range(3, 6) }));
      this.screens = [[3, 1], [8, 1], [12, 1], [16, 1]].map(([tx, ty], i) => ({ x: tx * 16 + 2, y: ty * 16 - 2, w: 24, h: 14, i }));
      this.floor = this.buildFloor();
    }
    enter() {
      A.scene({ breaktime: 0 }, 2);
      A.loop('hum', 0.14, 2); A.loop('white', 0.05, 2);
    }
    solid(tx, ty) {
      if (this.map.ch(tx, ty) === 'D') return this.doorA < 0.6;
      return super.solid(tx, ty);
    }
    rects() { return [{ x: PANEL.x - 6, y: PANEL.y - 10, w: 12, h: 6 }]; }
    blockMove() { return this.state === 'sync' || this.state === 'create'; }

    buildFloor() {
      const m = this.map;
      return E.prerender(m.pw, m.ph, g => {
        for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
          const c = m.ch(tx, ty), x = tx * 16, y = ty * 16;
          if (c === '.') {
            g.fillStyle = (tx + ty) & 1 ? '#3a4352' : '#36404e'; g.fillRect(x, y, 16, 16);
            g.fillStyle = '#2b323e'; g.fillRect(x, y + 15, 16, 1); g.fillRect(x + 15, y, 1, 16);
          } else if (c === 'M' || c === 'D') {
            g.fillStyle = '#1c222c'; g.fillRect(x, y, 16, 16);
            g.fillStyle = '#262e3a'; g.fillRect(x + 1, y + 1, 14, 14);
            g.fillStyle = '#151a22'; g.fillRect(x + 3, y + 6, 10, 1); g.fillRect(x + 3, y + 10, 10, 1);
            g.fillStyle = '#3a4656'; g.fillRect(x + 1, y + 1, 14, 1);
          } else { g.fillStyle = '#0c1016'; g.fillRect(x, y, 16, 16); }
        }
        // dome ring on the floor
        g.strokeStyle = 'rgba(160,200,255,0.18)'; g.lineWidth = 1;
        g.beginPath(); g.arc(C.x, C.y, 96, 0, U.TAU); g.stroke();
        g.beginPath(); g.arc(C.x, C.y, 60, 0, U.TAU); g.stroke();
      });
    }

    update(dt) {
      super.update(dt);
      const p = this.P, G = this.G;
      // machines alone: cold straight lines and noise
      if (this.state === 'idle') {
        this.lineAcc += dt * 7;
        while (this.lineAcc > 1) {
          this.lineAcc--;
          const g = U.pick(this.gears);
          this.lines.push({ x0: g.x, y0: g.y, x1: U.range(40, 300), y1: U.range(40, 220), t: 0, life: U.range(0.3, 0.9), c: '200,225,255' });
        }
        for (const g of this.gears) g.a += g.sp * dt * 2;
      } else {
        for (const g of this.gears) g.a += g.sp * dt * (0.25 + this.beat * 0.8 + this.progress * 0.6);
      }
      for (const l of this.lines) l.t += dt;
      this.lines = this.lines.filter(l => l.t < l.life);

      // heartbeat
      if (this.state !== 'idle') {
        this.beatT -= dt;
        if (this.beatT <= 0) {
          this.beatT = this.state === 'done' ? 0.9 : 1.0;
          this.beat = 1;
          if (this.state !== 'done') A.sfx.heart(0.35 * (1 - this.progress * 0.6));
        }
        this.beat = Math.max(0, this.beat - dt * 2.4);
      }
      if (this.state === 'sync') {
        this.sync += dt;
        if (this.sync > 3.2) {
          this.state = 'create';
          UI.hint(I.touch ? TX.workshop.hintTouch : TX.workshop.hint);
        }
      }
      if (this.state === 'create') {
        const b = this.brush, sp = 95;
        const ox = b.x, oy = b.y;
        b.x += I.axis.x * sp * dt; b.y += I.axis.y * sp * dt;
        const dx = b.x - C.x, dy = b.y - C.y, d = Math.hypot(dx, dy);
        if (d > 104) { b.x = C.x + dx / d * 104; b.y = C.y + dy / d * 104; }
        const moved = Math.hypot(b.x - ox, b.y - oy);
        this.progress = Math.min(1, this.progress + moved / 1500);
        this.trailAcc += dt;
        if (moved > 0.2 && this.trailAcc > 0.025) {
          this.trailAcc = 0;
          this.trail.push({ x: b.x, y: b.y, h: (this.t * 40 + Math.atan2(dy, dx) * 57) % 360, t: 0, brk: false });
        } else if (moved <= 0.2 && this.trail.length && !this.trail[this.trail.length - 1].brk) this.trail[this.trail.length - 1].brk = true;
        if (I.hit.act) this.sing();
        A.set('breaktime', 0.25 + this.progress * 0.65, 1.5);
        if (this.progress >= 1) this.finish();
      }
      if (this.state === 'done') {
        // the machines keep playing what you started
        this.auto += dt;
        if (Math.random() < dt * 30) {
          const a = this.auto * 0.9, r = 60 + Math.sin(this.auto * 0.7) * 34;
          this.trail.push({ x: C.x + Math.cos(a) * r, y: C.y + Math.sin(a * 1.5) * r * 0.8, h: (this.t * 50) % 360, t: 0 });
        }
        this.doorA = Math.min(1, this.doorA + dt * 0.5);
        if (p.y < 2 * 16 + 6 && Math.abs(p.x - (10 * 16 + 8)) < 12) { this.state = 'gone'; G.goto('gallery'); }
      }
      for (const tr of this.trail) tr.t += dt;
      this.trail = this.trail.filter(tr => tr.t < 7);
      for (const b of this.bursts) b.t += dt;
      this.bursts = this.bursts.filter(b => b.t < 1.6);
      const quiet = this.state === 'idle' ? 1 : 0;
      A.loop('white', 0.05 * quiet, 1.2);
      A.loop('hum', this.state === 'idle' ? 0.14 : 0.04, 1.5);
    }

    sing() {
      const b = this.brush;
      const ang = (Math.atan2(b.y - C.y, b.x - C.x) + Math.PI) / U.TAU;
      const f = SCALE[Math.floor(ang * SCALE.length) % SCALE.length];
      A.sfx.note(f, { vol: 0.12, dur: 2.2, echo: 0.55 });
      A.sfx.note(f * 1.25, { vol: 0.06, dur: 2, echo: 0.5, delay: 0.18, type: 'triangle' });
      A.sfx.note(f * 1.5, { vol: 0.05, dur: 2, echo: 0.5, delay: 0.36, type: 'triangle' });
      A.sfx.note(f / 2, { vol: 0.06, dur: 2.4, delay: 0.54 });
      this.bursts.push({ x: b.x, y: b.y, t: 0, h: (ang * 360 + 200) % 360 });
      this.progress = Math.min(1, this.progress + 0.07);
    }

    finish() {
      this.state = 'done';
      UI.hintOff();
      A.set('breaktime', 0.9, 2);
      A.sfx.chime(523, 0.1);
      for (let i = 0; i < 8; i++) this.bursts.push({ x: C.x, y: C.y, t: -i * 0.12, h: i * 45, big: true });
      setTimeout(() => this.G.say(TX.workshop.done), 1800);
    }

    interactables() {
      if (this.state !== 'idle') return [];
      return [{ x: PANEL.x, y: PANEL.y - 4, r: 22, label: TX.workshop.panel, act: () => {
        const p = this.P;
        p.x = PANEL.x; p.y = PANEL.y + 8; p.dir = 'up';
        this.state = 'sync'; this.sync = 0; this.beatT = 0.6;
        this.lines.length = 0;
        A.sfx.thud(0.2);
      } }];
    }

    drawFloor(ctx) {
      E.blitWorld(ctx, this.floor);
      // screens
      for (const s of this.screens) {
        ctx.fillStyle = '#0b1a24'; ctx.fillRect(s.x, s.y, s.w, s.h);
        if (this.state === 'idle') {
          for (let i = 0; i < 5; i++) {
            const w = Math.abs(Math.sin(this.t * 13 + i * 3 + s.i)) * (s.w - 4);
            ctx.fillStyle = 'rgba(120,220,255,0.7)'; ctx.fillRect(s.x + 2, s.y + 2 + i * 2.4, w, 1);
          }
        } else if (this.state === 'sync' || this.progress < 0.15) {
          ctx.fillStyle = 'rgba(255,120,140,0.85)';
          for (let x = 0; x < s.w - 2; x++) {
            const ph = (x / (s.w - 2) + this.t * 0.9) % 1;
            const yy = ph > 0.45 && ph < 0.5 ? -4 : ph > 0.5 && ph < 0.55 ? 3 : 0;
            ctx.fillRect(s.x + 1 + x, s.y + s.h / 2 + yy, 1, 1);
          }
        } else {
          for (let i = 0; i < 6; i++) {
            const hgt = 2 + Math.abs(Math.sin(this.t * 4 + i + s.i)) * (s.h - 4) * (0.4 + this.progress * 0.6);
            ctx.fillStyle = U.hsl(this.t * 40 + i * 50, 80, 65);
            ctx.fillRect(s.x + 2 + i * 3.6, s.y + s.h - 2 - hgt, 3, hgt);
          }
        }
        ctx.fillStyle = '#4a5666'; ctx.fillRect(s.x - 1, s.y - 1, s.w + 2, 1); ctx.fillRect(s.x - 1, s.y + s.h, s.w + 2, 1);
      }
      // gears
      for (const g of this.gears) {
        const hue = this.state === 'idle' ? null : (this.t * 30 + g.x) % 360;
        ctx.fillStyle = hue == null ? '#5a6474' : U.hsl(hue, 30 + this.progress * 50, 45 + this.beat * 20);
        for (let k = 0; k < 8; k++) {
          const a = g.a + k * U.TAU / 8;
          ctx.fillRect(Math.round(g.x + Math.cos(a) * (g.r + 1) - 1), Math.round(g.y + Math.sin(a) * (g.r + 1) - 1), 3, 3);
        }
        E.disc(ctx, g.x, g.y, g.r, hue == null ? '#465060' : U.hsl(hue, 25, 32));
        E.disc(ctx, g.x, g.y, 2, '#1a2028');
      }
      // door
      const dx = 10 * 16, dy = 16;
      E.rect(ctx, dx + 2, dy, 12, 16, this.doorA > 0 ? `rgba(255,${200 + 40 * this.doorA | 0},180,${0.3 + this.doorA * 0.7})` : '#151a22');
      // panel
      E.rect(ctx, PANEL.x - 6, PANEL.y - 12, 12, 8, '#2a323e');
      E.rect(ctx, PANEL.x - 5, PANEL.y - 11, 10, 6, this.state === 'idle' ? `rgba(140,220,255,${0.4 + 0.3 * Math.sin(this.t * 3)})` : `rgba(255,150,170,${0.5 + this.beat * 0.5})`);
      E.rect(ctx, PANEL.x - 1, PANEL.y - 4, 2, 4, '#2a323e');
    }

    drawTop(ctx) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      // cold straight lines
      for (const l of this.lines) {
        const k = l.t / l.life;
        ctx.strokeStyle = `rgba(${l.c},${0.6 * (1 - k)})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(l.x0, l.y0); ctx.lineTo(U.lerp(l.x0, l.x1, Math.min(1, k * 3)), U.lerp(l.y0, l.y1, Math.min(1, k * 3))); ctx.stroke();
      }
      // your light, echoed by the machines (six-fold)
      if (this.trail.length > 1) {
        for (let s = 0; s < 6; s++) {
          const rot = s * U.TAU / 6, c = Math.cos(rot), sn = Math.sin(rot);
          for (let i = 1; i < this.trail.length; i++) {
            const a = this.trail[i - 1], b = this.trail[i];
            if (a.brk) continue;
            const fade = 1 - b.t / 7;
            const ax = a.x - C.x, ay = a.y - C.y, bx = b.x - C.x, by = b.y - C.y;
            ctx.strokeStyle = U.hsl(b.h + s * 30, 85, 62, fade * (s === 0 ? 0.95 : 0.45));
            ctx.lineWidth = s === 0 ? 2 : 1;
            ctx.beginPath();
            ctx.moveTo(C.x + ax * c - ay * sn, C.y + ax * sn + ay * c);
            ctx.lineTo(C.x + bx * c - by * sn, C.y + bx * sn + by * c);
            ctx.stroke();
          }
        }
      }
      for (const b of this.bursts) {
        if (b.t < 0) continue;
        const k = b.t / 1.6;
        ctx.strokeStyle = U.hsl(b.h, 90, 70, 1 - k);
        ctx.lineWidth = b.big ? 2 : 1;
        ctx.beginPath(); ctx.arc(b.x, b.y, k * (b.big ? 140 : 46), 0, U.TAU); ctx.stroke();
      }
      ctx.restore();
      if (this.state === 'create') E.rect(ctx, this.brush.x - 1, this.brush.y - 1, 3, 3, '#ffffff');
    }

    lights() {
      for (const s of this.screens) E.addLight(s.x + s.w / 2, s.y + s.h + 4, 40, 0.5, this.state === 'idle' ? '120,210,255' : '255,170,200', 0.3);
      for (const g of this.gears) E.addLight(g.x, g.y, 24 + this.beat * 10, 0.3 + this.beat * 0.3, this.state === 'idle' ? '160,190,230' : '255,150,170', 0.25);
      if (this.state === 'create' || this.state === 'done') {
        const b = this.brush;
        if (this.state === 'create') E.addLight(b.x, b.y, 40, 0.9, '255,255,255', 0.3);
        const tail = this.trail.slice(-30);
        for (let i = 0; i < tail.length; i += 5) {
          const tr = tail[i];
          E.addLight(tr.x, tr.y, 30, 0.5 * (1 - tr.t / 7), U.hslToRgb(tr.h, 85, 60).map(v => v | 0).join(','), 0.5);
        }
        E.addLight(C.x, C.y, 140 * this.progress, 0.5 * this.progress, U.hslToRgb(this.t * 30, 70, 60).map(v => v | 0).join(','), 0.25);
      }
      for (const b of this.bursts) if (b.t > 0) E.addLight(b.x, b.y, 50, 0.6 * (1 - b.t / 1.6), U.hslToRgb(b.h, 80, 60).map(v => v | 0).join(','), 0.5);
      if (this.doorA > 0) E.addLight(10 * 16 + 8, 26, 70 * this.doorA, 0.9, '255,220,180', 0.35);
      E.addLight(PANEL.x, PANEL.y - 8, 30, 0.5, this.state === 'idle' ? '140,220,255' : '255,150,170', 0.4);
    }

    drawPost(ctx) {
      if (this.state === 'idle') {
        // white noise on the picture
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        for (let i = 0; i < 160; i++) ctx.fillRect(Math.random() * E.W | 0, Math.random() * E.H | 0, 1, 1);
        ctx.restore();
        E.tint(ctx, '#90b0e0', 0.18, 'multiply');
      }
    }
  }
  Y.LOC.workshop = Workshop;
})(window.Y);

'use strict';
/*
 * II. Тиха кімната. Холодна луна від кроків, дощ за вікном, крісло, стіл.
 * Дотик до речей проявляє теплі сліди інших людей. Хвилина тиші в кріслі —
 * і у вікні з'являється тепле відображення, кімната стає бурштиновою.
 */
(function (Y) {
  const U = Y.U, E = Y.E, A = Y.Audio, S = Y.S, I = Y.Input, TX = Y.TEXT;
  const MAP = [
    '###############',
    '#WWWWWWWWWWWWW#',
    '#WWWWWWWWWWWWW#',
    '#.............#',
    '#.............#',
    '#.............#',
    '#.............#',
    '#.............#',
    '#.............#',
    '#.............#',
    '#.............#',
    '###############'
  ];
  const WIN = { x: 40, y: 4, w: 160, h: 40 };
  const CHAIR = { x: 120, y: 98 };
  const TABLE = { x: 150, y: 84, w: 32, h: 14 };

  class Room extends Y.Loc {
    constructor(G) {
      super(G);
      this.map = new E.TileMap(MAP.slice());
      this.solidChars = '#W';
      this.entry = { x: 120, y: 160, dir: 'up' };
      this.darkness = 0.82; this.darkRGB = '6,10,24';
      this.vignette = 0.55;
      this.q = 0; this.warm = 0; this.done = false; this.doorA = 0;
      this.touched = {}; this.prints = []; this.embers = [];
      this.rain = [];
      for (let i = 0; i < 90; i++) this.rain.push({ x: Math.random() * WIN.w, y: Math.random() * WIN.h, s: U.range(90, 160), l: U.range(3, 7) });
      this.drops = [];
      for (let i = 0; i < 26; i++) this.drops.push({ x: Math.random() * WIN.w, y: Math.random() * WIN.h, v: 0, t: Math.random() * 5 });
      this.flash = 0; this.nextFlash = 6;
      this.floor = this.buildFloor();
    }
    enter() {
      A.scene({ forgtn: 0.75, breath: 0 }, 3);
      A.loop('rain', 0.1, 2);
    }
    rects() { return [{ x: TABLE.x, y: TABLE.y, w: TABLE.w, h: TABLE.h }, { x: CHAIR.x - 6, y: CHAIR.y - 6, w: 12, h: 5 }]; }
    solid(tx, ty) {
      if (this.done && tx === 0 && ty === 8) return false;
      return super.solid(tx, ty);
    }

    buildFloor() {
      const r = U.rng(12);
      return E.prerender(this.map.pw, this.map.ph, g => {
        // walls
        g.fillStyle = '#121626'; g.fillRect(0, 0, this.map.pw, 48);
        for (let x = 0; x < this.map.pw; x += 4) { g.fillStyle = (x / 4) & 1 ? '#13182a' : '#111524'; g.fillRect(x, 0, 4, 48); }
        g.fillStyle = '#0b0e1a'; g.fillRect(0, 44, this.map.pw, 4);
        // floorboards
        for (let y = 48; y < 176; y += 8) for (let x = 16; x < 224; x += 32) {
          const off = ((y / 8) & 1) * 16;
          g.fillStyle = r() < 0.5 ? '#1c1a24' : '#1e1c27'; g.fillRect(x, y, 32, 8);
          g.fillStyle = '#141219'; g.fillRect(x, y + 7, 32, 1); g.fillRect(x + off, y, 1, 7);
        }
        // side walls
        g.fillStyle = '#0c0f1c'; g.fillRect(0, 0, 16, 192); g.fillRect(224, 0, 16, 192);
        g.fillStyle = '#0a0c16'; g.fillRect(0, 176, 240, 16);
        // rug
        g.fillStyle = '#2a2232'; g.fillRect(84, 100, 72, 40);
        g.fillStyle = '#332a3d'; g.fillRect(88, 104, 64, 32);
        g.fillStyle = '#2a2232'; for (let i = 0; i < 8; i++) g.fillRect(92 + i * 8, 118, 4, 1);
        // empty picture frames
        [[200, 14], [24, 20]].forEach(([x, y]) => { g.fillStyle = '#2b2a38'; g.fillRect(x, y, 12, 10); g.fillStyle = '#0d0f1a'; g.fillRect(x + 1, y + 1, 10, 8); });
      });
    }

    update(dt) {
      super.update(dt);
      const p = this.P, G = this.G;
      // quiet
      const quiet = p.sit && I.idle > 0.8 && !Y.Dialog.active;
      if (p.sit && (Math.abs(I.axis.x) > 0.3 || Math.abs(I.axis.y) > 0.3) && !Y.Dialog.active) this.stand();
      if (quiet && !this.done) this.q = Math.min(1, this.q + dt / 45);
      if (p.sit) this.sat = true;
      else if (!p.sit && !this.done) this.q = Math.max(0, this.q - dt * 0.015);
      this.warm = U.damp(this.warm, this.done ? 1 : U.smooth(this.q), 1.2, dt);
      const w = this.warm;
      this.darkness = U.lerp(0.82, 0.5, w);
      this.darkRGB = w > 0.5 ? '24,12,4' : '6,10,24';
      this.stepOpts = { vol: 0.05, tone: 1100, echo: U.lerp(0.55, 0.08, w) };
      A.set('breath', quiet ? 0.45 * (1 - w * 0.5) : 0, 2);
      A.loop('rain', 0.1 * (1 - w * 0.7), 1);
      if (this.q >= 1 && !this.done) {
        this.done = true;
        A.sfx.chime(523, 0.08);
        A.sfx.musicBox([523, 659, 784, 1046], 0.4, 0.05);
        G.say(TX.room.reflection);
      }
      if (this.done) this.doorA = Math.min(1, this.doorA + dt * 0.4);
      if (this.done && p.x < 14 && Math.abs(p.y - 140) < 14) { this.done = 2; G.goto('garden'); }
      // rain & lightning
      for (const d of this.rain) { d.y += d.s * dt * (1 - w * 0.5); if (d.y > WIN.h) { d.y = -5; d.x = Math.random() * WIN.w; } }
      for (const d of this.drops) {
        d.t -= dt;
        if (d.t < 0) { d.v = U.range(4, 16); d.t = U.range(1, 5); }
        d.y += d.v * dt; d.v *= Math.pow(0.4, dt);
        if (d.y > WIN.h) { d.y = 0; d.x = Math.random() * WIN.w; }
      }
      this.flash = Math.max(0, this.flash - dt * 2.5);
      this.nextFlash -= dt;
      if (this.nextFlash < 0 && w < 0.5) { this.flash = 1; this.nextFlash = U.range(9, 18); setTimeout(() => A.sfx.thunder(0.18), 700); }
      for (const e of this.embers) e.a = Math.min(1, e.a + dt * 0.8);
      for (const pr of this.prints) pr.a = Math.min(1, pr.a + dt * 0.6);
    }

    stand() {
      const p = this.P;
      p.sit = false; p.y = CHAIR.y + 10; p.dir = 'down';
      A.sfx.step({ vol: 0.06, echo: 0.4 });
    }

    touch(id, prints, ember, notes, lines) {
      if (!this.touched[id]) {
        this.touched[id] = true;
        prints.forEach(([x, y, k]) => this.prints.push({ x, y, a: 0, k: k || 0, flip: Math.random() < 0.5 }));
        this.embers.push({ x: ember[0], y: ember[1], a: 0, ph: Math.random() * 6 });
      }
      A.sfx.musicBox(notes, 0.34, 0.06);
      // after the cup, the book and the window: a quiet nudge towards the chair
      if (!this.restHint && !this.sat && ['cup', 'book', 'glass'].every(k => this.touched[k])) {
        this.restHint = true;
        lines = lines.concat(TX.room.rest);
      }
      this.G.say(lines);
    }

    interactables() {
      const p = this.P, out = [];
      if (p.sit) return [{ x: CHAIR.x, y: CHAIR.y - 6, r: 40, label: TX.room.stand, act: () => this.stand() }];
      out.push({ x: CHAIR.x, y: CHAIR.y - 2, r: 20, label: TX.room.chair, act: () => {
        p.sit = true; p.x = CHAIR.x; p.y = CHAIR.y - 1; p.dir = 'up';
        A.sfx.step({ vol: 0.07, tone: 500, echo: 0.3 });
      } });
      out.push({ x: 158, y: 84, r: 18, label: TX.room.touch, px: 158, py: 80, act: () => this.touch('cup',
        [[155, 79, 0], [161, 80, 0], [158, 77, 1]], [152, 82], [659, 587, 523, 587], TX.room.cup) });
      out.push({ x: 174, y: 84, r: 18, label: TX.room.touch, px: 174, py: 80, act: () => this.touch('book',
        [[172, 80, 0], [177, 81, 1], [170, 83, 0]], [180, 82], [440, 523, 587, 659, 587], TX.room.book) });
      out.push({ x: 92, y: 54, r: 22, label: TX.room.touch, px: 92, py: 40, act: () => this.touch('glass',
        [[60, 22, 0], [70, 30, 1], [86, 18, 0], [104, 26, 1], [130, 20, 0], [148, 30, 1], [166, 16, 0], [180, 26, 1], [96, 34, 0], [140, 36, 1]],
        [92, 50], [392, 494, 587, 784], TX.room.glass) });
      return out;
    }

    drawWindow(ctx) {
      const w = this.warm, x0 = WIN.x, y0 = WIN.y;
      // sky
      const g = ctx.createLinearGradient(0, y0, 0, y0 + WIN.h);
      g.addColorStop(0, U.rgb(U.mixc([18, 24, 48], [48, 30, 40], w)));
      g.addColorStop(1, U.rgb(U.mixc([30, 40, 70], [90, 56, 46], w)));
      ctx.fillStyle = g; ctx.fillRect(x0, y0, WIN.w, WIN.h);
      // far city silhouettes
      ctx.fillStyle = U.rgb(U.mixc([12, 16, 30], [40, 24, 26], w));
      for (let i = 0; i < 16; i++) { const bh = 6 + ((i * 37) % 13); ctx.fillRect(x0 + i * 10, y0 + WIN.h - bh, 9, bh); }
      ctx.fillStyle = `rgba(255,214,140,${0.25 + w * 0.5})`;
      for (let i = 0; i < 14; i++) ctx.fillRect(x0 + 3 + ((i * 29) % 150), y0 + WIN.h - 4 - ((i * 7) % 9), 1, 1);
      if (this.flash > 0) { ctx.fillStyle = `rgba(200,215,255,${this.flash * 0.5})`; ctx.fillRect(x0, y0, WIN.w, WIN.h); }
      // rain
      ctx.fillStyle = `rgba(170,190,230,${0.35 - w * 0.15})`;
      for (const d of this.rain) ctx.fillRect(Math.round(x0 + d.x), Math.round(y0 + d.y), 1, Math.round(d.l));
      // reflection of you
      const ra = U.smooth((this.q - 0.3) / 0.55) * (this.done ? 1 : 0.95);
      if (ra > 0) {
        const p = this.P, rx = U.clamp(p.x, x0 + 8, x0 + WIN.w - 8);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = ra * 0.5;
        ctx.drawImage(E.colorGlow('255,190,120'), rx - 22, y0 + 4, 44, 40);
        ctx.restore();
        ctx.globalAlpha = ra * 0.85;
        ctx.drawImage(S.tint(S.player.down[0], 'rgba(255,200,140,0.55)', 'refl' + Y.T.form), Math.round(rx - S.player.down[0].width / 2), y0 + WIN.h - 20);
        ctx.globalAlpha = 1;
      }
      // drops on the glass
      ctx.fillStyle = 'rgba(200,215,255,0.35)';
      for (const d of this.drops) ctx.fillRect(Math.round(x0 + d.x), Math.round(y0 + d.y), 1, 2);
      // frame
      ctx.fillStyle = '#2a2836';
      ctx.fillRect(x0 - 3, y0 - 3, WIN.w + 6, 3); ctx.fillRect(x0 - 3, y0 + WIN.h, WIN.w + 6, 4);
      ctx.fillRect(x0 - 3, y0, 3, WIN.h); ctx.fillRect(x0 + WIN.w, y0, 3, WIN.h);
      for (let i = 1; i < 4; i++) ctx.fillRect(x0 + i * WIN.w / 4 - 1, y0, 2, WIN.h);
      ctx.fillRect(x0, y0 + WIN.h / 2 - 1, WIN.w, 2);
      ctx.fillStyle = '#3a3848'; ctx.fillRect(x0 - 3, y0 + WIN.h, WIN.w + 6, 1);
    }

    drawFloor(ctx) {
      E.blitWorld(ctx, this.floor);
      this.drawWindow(ctx);
      // the door that appears
      if (this.doorA > 0) {
        ctx.globalAlpha = this.doorA;
        E.rect(ctx, 0, 124, 16, 30, '#3a2a1e');
        E.rect(ctx, 2, 126, 12, 26, '#ffcf8a');
        E.rect(ctx, 4, 128, 8, 22, '#fff0d0');
        ctx.globalAlpha = 1;
      }
      // handprints of the people who were here before you
      for (const pr of this.prints) drawHand(ctx, pr.x, pr.y, pr.a * (0.7 + 0.3 * Math.sin(this.t * 1.5 + pr.x)), pr.flip);
    }

    drawables() {
      const out = [];
      // table with cup & book
      out.push({ y: TABLE.y + TABLE.h, draw: ctx => {
        E.rect(ctx, TABLE.x, TABLE.y - 6, TABLE.w, 8, '#3b2f2a');
        E.rect(ctx, TABLE.x, TABLE.y - 6, TABLE.w, 1, '#55433a');
        E.rect(ctx, TABLE.x + 2, TABLE.y + 2, 2, 12, '#2a211d'); E.rect(ctx, TABLE.x + TABLE.w - 4, TABLE.y + 2, 2, 12, '#2a211d');
        // cup
        E.rect(ctx, 156, 76, 5, 5, '#d9d6e2'); E.rect(ctx, 161, 77, 2, 2, '#d9d6e2'); E.rect(ctx, 157, 76, 3, 1, '#4a3a30');
        // book
        E.rect(ctx, 170, 77, 9, 6, '#6a3a46'); E.rect(ctx, 171, 78, 7, 1, '#e8e0d0');
      } });
      // chair (back towards us)
      out.push({ y: CHAIR.y + 2, draw: ctx => {
        const x = CHAIR.x, y = CHAIR.y;
        E.rect(ctx, x - 7, y - 6, 14, 8, '#40323a');
        E.rect(ctx, x - 7, y - 6, 14, 1, '#5a4650');
        E.rect(ctx, x - 7, y + 2, 2, 4, '#2c2228'); E.rect(ctx, x + 5, y + 2, 2, 4, '#2c2228');
      } });
      // embers left by someone
      for (const e of this.embers) out.push({ y: e.y, draw: ctx => {
        ctx.globalAlpha = e.a;
        E.rect(ctx, e.x - 1, e.y - 3, 2, 3, '#efe6d6');
        E.rect(ctx, e.x - 1, e.y - 5, 2, 2, Math.sin(this.t * 11 + e.ph) > 0 ? '#ffd27a' : '#ffae4a');
        ctx.globalAlpha = 1;
      } });
      // a lamp in the corner that lights up when warm
      out.push({ y: 66, draw: ctx => {
        E.rect(ctx, 212, 50, 2, 16, '#2a2630');
        E.rect(ctx, 207, 44, 12, 7, this.warm > 0.6 ? '#ffd9a0' : '#3a3644');
      } });
      return out;
    }

    lights() {
      const w = this.warm;
      E.addLight(WIN.x + WIN.w / 2, WIN.y + WIN.h, 120, 0.35 + this.flash * 0.6, w > 0.5 ? '255,170,110' : '120,150,230', 0.25);
      for (const e of this.embers) E.addLight(e.x, e.y - 4, 26, 0.6 * e.a, '255,190,110', 0.4);
      for (const pr of this.prints) E.addLight(pr.x, pr.y, 8, 0.4 * pr.a, '255,200,120', 0.4);
      if (w > 0.6) E.addLight(213, 50, 110 * (w - 0.6) / 0.4, 0.8, '255,190,120', 0.35);
      if (this.doorA > 0) E.addLight(8, 140, 60, this.doorA, '255,200,140', 0.4);
      if (this.P.sit) E.addLight(CHAIR.x, CHAIR.y - 10, 40 * w, 0.6 * w, '255,180,110', 0.4);
      // the chair glows softly once you know you should rest
      else if (this.restHint && !this.sat) E.addLight(CHAIR.x, CHAIR.y - 4, 26, 0.35 + 0.2 * Math.sin(this.t * 2), '255,200,140', 0.4);
    }

    drawPost(ctx) {
      const w = this.warm;
      E.tint(ctx, '#5f78b8', 0.32 * (1 - w), 'multiply');
      E.tint(ctx, '#ffae60', 0.22 * w, 'soft-light');
    }
  }

  function drawHand(ctx, x, y, a, flip) {
    if (a <= 0) return;
    ctx.globalAlpha = a;
    ctx.fillStyle = '#ffd38a';
    const s = flip ? -1 : 1;
    ctx.fillRect(Math.round(x - 1), Math.round(y), 3, 3);
    for (let i = 0; i < 4; i++) ctx.fillRect(Math.round(x - 1 + i * s * 0.9), Math.round(y - 2), 1, 2);
    ctx.fillRect(Math.round(x + (flip ? -2 : 2)), Math.round(y + 1), 1, 1);
    ctx.globalAlpha = 1;
  }

  Y.LOC.room = Room;
})(window.Y);

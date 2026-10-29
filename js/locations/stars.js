'use strict';
/*
 * IX. Найближчі зорі. Край світу, стара обсерваторія. Зорі тут — на відстані руки,
 * і кожна з них — рідна дрібниця. Психе́я чекає на краю.
 */
(function (Y) {
  const U = Y.U, E = Y.E, A = Y.Audio, S = Y.S, TX = Y.TEXT;
  const W = 31, H = 26;
  const NOTES = [523.3, 587.3, 659.3, 784, 880, 1046.5, 1174.7, 1318.5];

  function makeMap() {
    const r = U.rng(14), rows = [];
    for (let y = 0; y < H; y++) {
      let row = '';
      for (let x = 0; x < W; x++) {
        const dx = (x - 15) / 14, dy = (y - 13) / 9.5;
        const n = U.noise2(x * 0.35, y * 0.35) * 0.18;
        let c = (dx * dx + dy * dy < 1 + n && y >= 4 && y <= 23) ? '.' : '~';
        if (y < 5) c = '~';
        if (y === 5 && Math.abs(x - 15) > 6 + r() * 3) c = '~';
        row += c;
      }
      rows.push(row);
    }
    // observatory
    for (let y = 8; y <= 10; y++) rows[y] = rows[y].slice(0, 4) + 'OOO' + rows[y].slice(7);
    for (let y = 19; y <= 23; y++) rows[y] = rows[y].slice(0, 14) + '...' + rows[y].slice(17);
    return rows;
  }

  class Stars extends Y.Loc {
    constructor(G) {
      super(G);
      this.map = new E.TileMap(makeMap());
      this.map.noClamp = true;
      this.solidChars = '~O';
      this.savePos = true;
      this.entry = { x: 15 * 16 + 8, y: 22 * 16 + 8, dir: 'up' };
      this.darkness = 0.84; this.darkRGB = '4,4,14';
      this.vignette = 0.45;
      this.stepOpts = { vol: 0.04, tone: 700, echo: 0.15 };
      this.psy = { x: 15 * 16 + 8, y: 6 * 16 + 8, a: 1 };
      this.tele = { x: 9 * 16 + 8, y: 9 * 16 + 8 };
      this.far = new E.Starfield(260, 99, { period: 340, parallax: 0.05 });
      this.mid = new E.Starfield(120, 17, { period: 420, parallax: 0.25 });
      const r = U.rng(41), words = TX.little.slice();
      this.dear = [];
      const floor = this.map.find('.');
      while (this.dear.length < 18 && words.length) {
        const t = floor[Math.floor(r() * floor.length)];
        if (U.dist(t.x, t.y, this.entry.x, this.entry.y) < 50 || U.dist(t.x, t.y, this.psy.x, this.psy.y) < 50 || t.ty < 6) continue;
        if (this.dear.some(s => U.dist(s.x, s.y, t.x, t.y) < 34)) continue;
        this.dear.push({ x: t.x + U.range(-4, 4, r), y: t.y, h: U.range(12, 26, r), r: U.range(1, 2.2, r), word: words.splice(Math.floor(r() * words.length), 1)[0], lit: 0, met: false, ph: r() * 6, note: NOTES[this.dear.length % NOTES.length] });
      }
      this.floor = this.buildFloor();
      this.ff = new E.Fireflies(14, { x: 60, y: 100, w: 380, h: 240 }, 7, { rgb: '200,210,255', core: '#eef2ff', radius: 12 });
      if (G.seen('starsMeet')) this.psy.a = 0;
      this.leaving = false;
    }
    enter() { A.scene({ eternal: 0.85 }, 3); A.restart('eternal'); }

    buildFloor() {
      const m = this.map, r = U.rng(2);
      return E.prerender(m.pw, m.ph, g => {
        for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
          const c = m.ch(tx, ty), x = tx * 16, y = ty * 16;
          if (c === '~') {
            const up = m.ch(tx, ty - 1);
            if (up && up !== '~') {
              const gr = g.createLinearGradient(0, y, 0, y + 14);
              gr.addColorStop(0, '#1a1830'); gr.addColorStop(1, 'rgba(0,0,0,0)');
              g.fillStyle = gr; g.fillRect(x, y, 16, 14);
            }
            continue;
          }
          g.fillStyle = (tx + ty) & 1 ? '#22253a' : '#202336'; g.fillRect(x, y, 16, 16);
          for (let i = 0; i < 4; i++) { g.fillStyle = U.pick(['#2c3048', '#1a1c2c', '#33405a'], r); g.fillRect(x + Math.floor(r() * 15), y + Math.floor(r() * 15), 1, 2); }
          if (r() < 0.12) { g.fillStyle = U.pick(['#bcd4ff', '#ffe4b0', '#f0c8ff'], r); g.fillRect(x + Math.floor(r() * 14), y + Math.floor(r() * 14), 1, 1); }
          if (m.ch(tx, ty - 1) === '~') { g.fillStyle = '#3a3f60'; g.fillRect(x, y, 16, 1); }
        }
      });
    }

    update(dt) {
      super.update(dt);
      this.ff.update(dt, this.t);
      const p = this.P, G = this.G;
      for (const s of this.dear) {
        const d = U.dist(p.x, p.y - 8, s.x, s.y - s.h);
        const want = d < 36 ? 1 : 0;
        s.lit = U.damp(s.lit, want, 3, dt);
        if (want && !s.met) { s.met = true; A.sfx.note(s.note, { vol: 0.06, dur: 2.4, echo: 0.4, type: 'triangle' }); }
        if (!want && d > 60) s.met = false;
      }
      if (this.psy.a > 0.5 && !G.seen('starsMeet') && this.near(this.psy.x, this.psy.y, 58) && !G.locked) {
        G.once('starsMeet');
        p.dir = 'up';
        G.say(TX.starsPsyche).then(() => this.leave());
      }
      if (this.leaving) this.psy.a = Math.max(0, this.psy.a - dt * 0.4);
      if (G.seen('starsMeet') && !this.leaving && this.psy.a === 0 && p.y < 8 * 16) this.leave();
    }

    leave() {
      if (this.leaving) return;
      this.leaving = true;
      A.sfx.chime(523, 0.08);
      this.G.goto('hall2', { out: 4, in: 4, color: '#f4eee4' });
    }

    interactables() {
      return [{ x: this.tele.x, y: this.tele.y, r: 22, label: TX.telescopeLabel, act: () => this.G.say(TX.telescope) }];
    }

    drawBack(ctx) {
      this.far.draw(ctx, this.t, 1);
      this.mid.draw(ctx, this.t * 1.2, 1);
    }
    cutDark(l) {
      this.drawBack(l);
      E.applyCam(l);
      for (const s of this.dear) { l.globalAlpha = 0.9; l.fillRect(Math.round(s.x) - 1, Math.round(s.y - s.h) - 1, 3, 3); }
      this.ff.draw(l);
    }

    drawFloor(ctx) {
      E.blitWorld(ctx, this.floor);
      // reflections of near stars on the ground
      for (const s of this.dear) { ctx.globalAlpha = 0.25 + s.lit * 0.3; E.ellipse(ctx, s.x, s.y, 3 + s.lit * 2, 1, '#cfd8ff'); }
      ctx.globalAlpha = 1;
    }

    drawables() {
      const out = [];
      // observatory ruin
      out.push({ y: 10 * 16 + 14, draw: ctx => {
        const x = 4 * 16, y = 8 * 16;
        E.rect(ctx, x + 2, y - 4, 44, 46, '#2a2c40');
        E.rect(ctx, x + 2, y - 4, 44, 2, '#3c3f58');
        ctx.fillStyle = '#34374f'; ctx.beginPath(); ctx.arc(x + 24, y - 4, 22, Math.PI, 0); ctx.fill();
        E.rect(ctx, x + 20, y - 26, 8, 22, '#14152a');
        E.rect(ctx, x + 18, y + 22, 12, 20, '#14152a');
        E.rect(ctx, x + 6, y + 6, 6, 6, '#ffe2a8');
      } });
      // telescope
      out.push({ y: this.tele.y + 4, draw: ctx => {
        const x = this.tele.x, y = this.tele.y;
        E.rect(ctx, x - 1, y - 8, 2, 12, '#4a4a5a');
        E.rect(ctx, x - 4, y + 2, 8, 2, '#4a4a5a');
        ctx.save(); ctx.translate(x, y - 9); ctx.rotate(-0.6);
        E.rect(ctx, -2, -2, 14, 4, '#8a7a5a'); E.rect(ctx, 11, -3, 3, 6, '#a8946a');
        ctx.restore();
      } });
      for (const s of this.dear) out.push({ y: s.y, draw: ctx => {
        const y = s.y - s.h + Math.sin(this.t * 1.4 + s.ph) * 1.5, b = 0.6 + s.lit * 0.4;
        const tw = 0.85 + 0.15 * Math.sin(this.t * 3 + s.ph);
        ctx.fillStyle = `rgba(255,248,230,${b * tw})`;
        ctx.fillRect(Math.round(s.x) - 1, Math.round(y) - 1, 3, 3);
        ctx.fillStyle = `rgba(255,240,210,${0.4 * b * tw})`;
        const L = Math.round(4 + s.r * 2 + s.lit * 3);
        ctx.fillRect(Math.round(s.x) - L, Math.round(y), L * 2 + 1, 1);
        ctx.fillRect(Math.round(s.x), Math.round(y) - L, 1, L * 2 + 1);
      } });
      if (this.psy.a > 0) out.push({ y: this.psy.y, draw: ctx => S.drawPsyche(ctx, this.psy.x, this.psy.y, this.t, this.psy.a) });
      out.push({ y: 9999, draw: ctx => this.ff.draw(ctx) });
      return out;
    }

    lights() {
      this.ff.lights();
      for (const s of this.dear) E.addLight(s.x, s.y - s.h, 30 + s.r * 8 + s.lit * 26, 0.6 + s.lit * 0.35, '255,236,200', 0.35);
      if (this.psy.a > 0) E.addLight(this.psy.x, this.psy.y - 18, 90, 0.95 * this.psy.a, '210,190,255', 0.4);
      E.addLight(4 * 16 + 9, 8 * 16 + 9, 30, 0.6, '255,210,150', 0.4);
    }

    drawHud(h) {
      for (const s of this.dear) {
        if (s.lit < 0.03) continue;
        E.text(h, s.word, s.x, s.y - s.h - 9, { size: 6, color: '#fff3dc', alpha: s.lit, glow: 'rgba(255,220,170,0.9)', blur: 5 });
      }
    }
  }
  Y.LOC.stars = Stars;
})(window.Y);

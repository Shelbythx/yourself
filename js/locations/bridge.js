'use strict';
/*
 * IV. Міст у тумані. Прірва, густий молочний туман, силуети і грім.
 * Ліхтар, піднятий угору, сліпить і нічого не показує.
 * Опущений під ноги — і з туману з'являється одна плита. Крок — і наступна.
 */
(function (Y) {
  const U = Y.U, E = Y.E, A = Y.Audio, UI = Y.UI, I = Y.Input, TX = Y.TEXT;
  const W = 21, H = 40;
  const PATH = [[10, 31], [10, 30], [10, 29], [9, 29], [9, 28], [9, 27], [9, 26], [10, 26], [11, 26], [11, 25], [11, 24], [11, 23],
    [10, 23], [10, 22], [10, 21], [9, 21], [8, 21], [8, 20], [8, 19], [8, 18], [9, 18], [10, 18], [10, 17], [10, 16], [11, 16],
    [12, 16], [12, 15], [12, 14], [12, 13], [11, 13], [11, 12], [10, 12], [10, 11], [10, 10], [10, 9], [10, 8], [10, 7]];

  function makeMap() {
    const rows = [];
    for (let y = 0; y < H; y++) {
      let row = '';
      for (let x = 0; x < W; x++) {
        let c = ' ';
        if ((y >= 1 && y <= 6) || (y >= 32 && y <= 38)) c = (x >= 3 && x <= 17) ? '.' : '#';
        if (y === 0 || y === 39) c = '#';
        if (y === 6 && (x < 7 || x > 13)) c = '#';
        if (y === 32 && (x < 6 || x > 14)) c = '#';
        row += c;
      }
      rows.push(row);
    }
    return rows;
  }
  function fogTexture() {
    const s = 128, c = U.canvas(s, s), g = c.getContext('2d'), img = g.createImageData(s, s);
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      // tileable-ish noise via wrapped coordinates
      const f = (fx, fy, sc) => U.noise2((fx % s) / sc, (fy % s) / sc);
      let v = 0.55 * f(x, y, 32) + 0.3 * f(x + 50, y + 70, 16) + 0.15 * f(x + 9, y + 3, 8);
      const ex = Math.min(x, s - x) / 20, ey = Math.min(y, s - y) / 20;
      v = v * Math.min(1, ex, ey) ;
      const a = U.clamp(0.45 + v * 0.6, 0, 1);
      const i = (y * s + x) * 4;
      img.data[i] = 225; img.data[i + 1] = 228; img.data[i + 2] = 235; img.data[i + 3] = a * 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  class Bridge extends Y.Loc {
    constructor(G) {
      super(G);
      this.map = new E.TileMap(makeMap());
      this.solidChars = '# ';
      this.entry = { x: 10 * 16 + 8, y: 35 * 16, dir: 'up' };
      this.darkness = 0.86; this.darkRGB = '14,16,24';
      this.vignette = 0.5;
      this.stepOpts = { vol: 0.05, tone: 750 };
      this.slabs = PATH.map(([tx, ty]) => ({ tx, ty, a: 0, on: false }));
      this.revealed = 0;
      this.mode = 'up'; this.lowerT = 0; this.glare = 0; this.raise = 1;
      this.fog = fogTexture();
      this.fogC = U.canvas(4, 4);
      this.flash = 0; this.nextThunder = 5;
      this.shapes = [];
      const r = U.rng(9);
      for (let i = 0; i < 7; i++) this.shapes.push({ x: U.range(-20, 360, r), y: U.range(110, 470, r), h: U.range(40, 80, r), ph: r() * 6, w: U.range(8, 14, r) });
      this.bumped = false; this.done = false;
      this.floor = this.buildFloor();
    }
    enter() {
      A.scene({ final: 0.85 }, 3);
      A.loop('wind', 0.12, 2);
      this.updateHint();
    }
    solid(tx, ty) {
      const c = this.map.ch(tx, ty);
      if (c === ' ') {
        const s = this.slabs.find(s => s.tx === tx && s.ty === ty);
        return !(s && s.on);
      }
      return super.solid(tx, ty);
    }
    updateHint() {
      UI.hint(this.mode === 'up' ? TX.bridge.down : TX.bridge.up);
    }
    actLabel() { return this.mode === 'up' ? TX.bridge.downTouch : TX.bridge.upTouch; }
    onAction() {
      this.mode = this.mode === 'up' ? 'down' : 'up';
      this.lowerT = 0;
      A.sfx.clank(0.06);
      this.updateHint();
    }

    buildFloor() {
      const m = this.map, r = U.rng(4);
      return E.prerender(m.pw, m.ph, g => {
        for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
          const c = m.ch(tx, ty), x = tx * 16, y = ty * 16;
          if (c === '.') {
            g.fillStyle = (tx + ty) & 1 ? '#2a2c30' : '#282a2e'; g.fillRect(x, y, 16, 16);
            for (let i = 0; i < 4; i++) { g.fillStyle = r() < 0.5 ? '#33363a' : '#222428'; g.fillRect(x + Math.floor(r() * 15), y + Math.floor(r() * 15), 2, 1); }
            if (m.ch(tx, ty + 1) === ' ') {
              g.fillStyle = '#1b1c20'; g.fillRect(x, y + 16, 16, 10);
              g.fillStyle = '#111215'; g.fillRect(x, y + 22, 16, 4);
            }
            if (m.ch(tx, ty - 1) === ' ') { g.fillStyle = '#3a3d42'; g.fillRect(x, y, 16, 1); }
          } else if (c === '#') {
            g.fillStyle = '#16171b'; g.fillRect(x, y, 16, 16);
            g.fillStyle = '#202227'; g.beginPath(); g.ellipse(x + 8, y + 8, 8, 6, 0, 0, U.TAU); g.fill();
          }
        }
      });
    }

    currentSlab() {
      const p = this.P, tx = Math.floor(p.x / 16), ty = Math.floor((p.y - 3) / 16);
      if (ty >= 32) return ty === 32 && Math.abs(tx - 10) <= 1 ? -1 : -2;
      return this.slabs.findIndex(s => s.on && s.tx === tx && s.ty === ty);
    }

    update(dt) {
      super.update(dt);
      const p = this.P, G = this.G;
      this.raise = U.damp(this.raise, this.mode === 'up' ? 1 : 0, 6, dt);
      if (this.mode === 'down') this.lowerT += dt;
      this.glare = U.damp(this.glare, this.mode === 'up' ? 0.32 + 0.12 * Math.sin(this.t * 3) : 0, 3, dt);
      // reveal the next slab when you stand on the last one with the light at your feet
      if (this.mode === 'down' && this.lowerT > 0.35 && this.revealed < this.slabs.length) {
        const cur = this.currentSlab();
        if (cur === this.revealed - 1) {
          const s = this.slabs[this.revealed];
          s.on = true; this.revealed++;
          A.sfx.thud(0.18);
          A.sfx.note(U.pick([196, 220, 247, 262, 294]), { vol: 0.05, dur: 1.4, echo: 0.3 });
          for (let i = 0; i < 18; i++) {
            const a = Math.random() * U.TAU, d = U.range(14, 26);
            this.particles.add({ x: s.tx * 16 + 8 + Math.cos(a) * d, y: s.ty * 16 + 8 + Math.sin(a) * d, vx: -Math.cos(a) * d * 1.6, vy: -Math.sin(a) * d * 1.6, life: 0.6, color: '#e8ecf4', drag: 0.9 });
          }
          this.lowerT = 0.1;
        }
      }
      for (const s of this.slabs) if (s.on) s.a = Math.min(1, s.a + dt * 2.5);
      // walking into the void with the lantern raised
      if (!this.bumped && this.mode === 'up' && p.inputting && !p.moving && p.y < 33 * 16 && this.revealed === 0 && !G.locked) {
        this.bumped = true;
        G.say(TX.bridge.edge);
      }
      // thunder
      this.flash = Math.max(0, this.flash - dt * 3);
      this.nextThunder -= dt * (1 + this.raise * 1.5);
      if (this.nextThunder < 0) {
        this.nextThunder = U.range(7, 14);
        this.flash = 0.6 + this.raise * 0.4;
        setTimeout(() => A.sfx.thunder(0.18 + this.raise * 0.2), 400);
      }
      A.loop('wind', 0.08 + this.raise * 0.1, 1);
      if (!this.done && p.y < 6 * 16 + 4) { this.done = true; UI.hintOff(); G.goto('valley'); }
    }

    drawFloor(ctx) {
      E.blitWorld(ctx, this.floor);
      // silhouettes in the fog — they look bigger when you try to see far
      for (const sh of this.shapes) {
        const k = 1 + this.raise * 0.35;
        const a = 0.12 + this.raise * 0.35 + this.flash * 0.3;
        const x = sh.x + Math.sin(this.t * 0.3 + sh.ph) * 6, y = sh.y, hgt = sh.h * k, w = sh.w * k;
        ctx.globalAlpha = a; ctx.fillStyle = '#05060a';
        ctx.fillRect(Math.round(x - w / 2), Math.round(y - hgt), Math.round(w), Math.round(hgt));
        ctx.beginPath(); ctx.ellipse(x, y - hgt - w * 0.4, w * 0.45, w * 0.55, 0, 0, U.TAU); ctx.fill();
        ctx.fillRect(Math.round(x - w / 2 - 4), Math.round(y - hgt * 0.9), 3, Math.round(hgt * 0.7));
        ctx.fillRect(Math.round(x + w / 2 + 1), Math.round(y - hgt * 0.85), 3, Math.round(hgt * 0.75));
      }
      ctx.globalAlpha = 1;
      // slabs
      for (const s of this.slabs) {
        if (s.a <= 0) continue;
        const x = s.tx * 16, y = s.ty * 16, sc = U.lerp(0.6, 1, U.easeOut(s.a));
        ctx.globalAlpha = s.a;
        const w = 16 * sc, o = (16 - w) / 2;
        E.rect(ctx, x + o, y + o + 3, w, w, '#0c0d10');
        E.rect(ctx, x + o, y + o, w, w, '#4a4c52');
        E.rect(ctx, x + o, y + o, w, 1, '#62656c');
        E.rect(ctx, x + o + 2, y + o + 4, 4, 1, '#3c3e44'); E.rect(ctx, x + o + 9, y + o + 10, 4, 1, '#3c3e44');
        ctx.globalAlpha = 1;
      }
    }

    drawables() {
      const p = this.P;
      return [{ y: p.y + 0.5, draw: ctx => {
        // the lantern
        const up = this.raise;
        const lx = p.x + (p.dir === 'left' ? -5 : 5), ly = U.lerp(p.y - 5, p.y - 24, up);
        E.rect(ctx, lx - 1, ly - 3, 3, 4, '#ffe6a8');
        E.rect(ctx, lx - 2, ly - 4, 5, 1, '#3a3020'); E.rect(ctx, lx - 2, ly + 1, 5, 1, '#3a3020');
        E.rect(ctx, lx, ly - 6, 1, 2, '#3a3020');
      } }];
    }

    drawTop(ctx) {
      // fog layer with a hole around you (bigger when the light is low)
      const fc = this.fogC;
      if (fc.width !== E.W || fc.height !== E.H) { fc.width = E.W; fc.height = E.H; }
      const g = fc.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'source-over';
      g.clearRect(0, 0, E.W, E.H);
      const layers = [[0.12, 6, 0.75], [0.25, -9, 0.55], [0.4, 4, 0.4]];
      for (const [par, drift, a] of layers) {
        g.globalAlpha = a;
        const ox = -(((E.cam.x * (1 + par) + this.t * drift) % 128) + 128) % 128;
        const oy = -(((E.cam.y * (1 + par) + this.t * drift * 0.4) % 128) + 128) % 128;
        for (let y = oy - 128; y < E.H; y += 128) for (let x = ox - 128; x < E.W; x += 128) g.drawImage(this.fog, x, y);
      }
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'destination-out';
      const sp = E.toScreen(this.P.x, this.P.y - 6);
      const hole = U.lerp(46, 16, this.raise);
      g.drawImage(E.glow, sp.x - hole, sp.y - hole, hole * 2, hole * 2);
      g.drawImage(E.glow, sp.x - hole, sp.y - hole, hole * 2, hole * 2);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 0.9;
      ctx.drawImage(fc, 0, 0);
      ctx.restore();
    }

    lights() {
      const p = this.P, up = this.raise;
      if (up > 0.05) {
        // the beam goes far ahead and bounces back from the fog
        const dir = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[p.dir] || [0, -1];
        for (let i = 1; i <= 3; i++) E.addLight(p.x + dir[0] * 34 * i, p.y - 12 + dir[1] * 34 * i, 40 + i * 12, 0.75 * up, '240,240,255', 0.2);
      }
      E.addLight(p.x, p.y - 2, 40, 0.95 * (1 - up), '255,214,140', 0.4);
      this.playerLight.r = U.lerp(46, 26, up);
      for (const s of this.slabs) if (s.on) E.addLight(s.tx * 16 + 8, s.ty * 16 + 8, 14, 0.25 * s.a, '200,210,230', 0.2);
      E.addLight(10 * 16 + 8, 3 * 16, 80, 0.3, '255,230,190', 0.2);
    }

    drawPost(ctx) {
      E.tint(ctx, '#f0f2ff', this.glare + this.flash * 0.6, 'screen');
      E.tint(ctx, '#8090b0', 0.18, 'multiply');
    }
  }
  Y.LOC.bridge = Bridge;
})(window.Y);

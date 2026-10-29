'use strict';
/*
 * VII. Галерея чужих масок. При вході на тебе налипають обладунки і ярлики.
 * Вони сповільнюють, а вузький прохід їх не пропускає. Знімаєш одну за одною —
 * страшно, ніби зникаєш. Але у воді відбивається не порожнеча, а твоє власне світло.
 */
(function (Y) {
  const U = Y.U, E = Y.E, A = Y.Audio, S = Y.S, UI = Y.UI, TX = Y.TEXT;
  const MAP = [
    '###############',
    '######...######',
    '######...######',
    '#######n#######',
    '####.......####',
    '###.........###',
    '##...wwwww...##',
    '##...wwwww...##',
    '##...........##',
    '#R...........R#',
    '#R..m.....m..R#',
    '#R...........R#',
    '#.............#',
    '#R...........R#',
    '#R...m...m...R#',
    '#R...........R#',
    '#.............#',
    '#R...........R#',
    '#R..m.....m..R#',
    '#R...........R#',
    '#.............#',
    '#R...........R#',
    '#R...m...m...R#',
    '#R...........R#',
    '#.............#',
    '#R...........R#',
    '#R..m.....m..R#',
    '#R...........R#',
    '#.............#',
    '#.............#',
    '#.............#',
    '#.............#',
    '##...........##',
    '###.........###',
    '###############'
  ];
  const WATER = { x: 5 * 16, y: 6 * 16, w: 80, h: 32 };

  class Gallery extends Y.Loc {
    constructor(G) {
      super(G);
      this.map = new E.TileMap(MAP.slice());
      this.solidChars = '#Rmwn';
      this.entry = { x: 7 * 16 + 8, y: 31 * 16 + 8, dir: 'up' };
      this.darkness = 0.84; this.darkRGB = '8,6,14';
      this.vignette = 0.55;
      this.stepOpts = { vol: 0.05, tone: 1300, echo: 0.35 };
      this.mannequins = this.map.find('m');
      this.mirrors = this.map.find('R');
      const src = this.mannequins.slice().sort((a, b) => b.y - a.y).slice(0, 4);
      this.masks = TX.masks.map((m, i) => ({ label: Y.T.g(m.label), whisper: m.whisper, state: 'wait', t: 0, from: src[i % src.length], x: 0, y: 0, delay: 1.2 + i * 0.7 }));
      this.dropped = [];
      this.whispers = [];
      this.fear = 0; this.revealed = false; this.revealT = 0; this.hueAcc = U.range(0, 360);
      this.bumped = false; this.done = false;
      this.floor = this.buildFloor();
      if (G.state.selfHue != null && G.seen('galleryReveal')) {
        this.masks.forEach(m => { m.state = 'gone'; });
        this.revealed = true;
      }
    }
    enter() {
      A.scene({ magicbus: 0.8 }, 3);
      A.loop('drone', 0, 1);
    }
    get onCount() { return this.masks.filter(m => m.state === 'on' || m.state === 'fly').length; }
    solid(tx, ty) {
      const c = this.map.ch(tx, ty);
      if (c === 'n') return this.onCount > 0;
      return super.solid(tx, ty);
    }
    speedMul() { return 1 - this.onCount * 0.17; }

    buildFloor() {
      const m = this.map, r = U.rng(3);
      return E.prerender(m.pw, m.ph, g => {
        for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
          const c = m.ch(tx, ty), x = tx * 16, y = ty * 16;
          if (c === '#' || c === 'R') {
            g.fillStyle = '#120f1a'; g.fillRect(x, y, 16, 16);
            g.fillStyle = '#1b1726'; g.fillRect(x, y + 12, 16, 4);
            continue;
          }
          // checkered marble
          g.fillStyle = (tx + ty) & 1 ? '#2a2633' : '#1e1b26'; g.fillRect(x, y, 16, 16);
          if (r() < 0.3) { g.fillStyle = 'rgba(255,255,255,0.04)'; g.fillRect(x + Math.floor(r() * 10), y + Math.floor(r() * 14), 6, 1); }
        }
        // red carpet
        g.fillStyle = 'rgba(90,20,40,0.45)'; g.fillRect(6 * 16, 8 * 16, 48, 25 * 16);
        g.fillStyle = 'rgba(200,160,90,0.25)'; g.fillRect(6 * 16, 8 * 16, 1, 25 * 16); g.fillRect(9 * 16 - 1, 8 * 16, 1, 25 * 16);
      });
    }

    update(dt) {
      super.update(dt);
      const p = this.P, G = this.G;
      // masks stick to you on entry
      for (const m of this.masks) {
        m.t += dt;
        if (m.state === 'wait' && m.t > m.delay) { m.state = 'fly'; m.t = 0; m.x = m.from.x; m.y = m.from.y - 20; A.sfx.whoosh(0.06); }
        if (m.state === 'fly') {
          const k = Math.min(1, m.t / 0.6);
          m.x = U.lerp(m.from.x, p.x, U.easeIn(k)); m.y = U.lerp(m.from.y - 20, p.y - 12, U.easeIn(k));
          if (k >= 1) { m.state = 'on'; A.sfx.clank(0.16); E.shake(0.25, 1.5); }
        }
      }
      // removing masks is frightening
      const off = this.masks.filter(m => m.state === 'off').length;
      const target = this.revealed ? 0 : (off / 4) * (off === 4 ? 1 : 0.8);
      this.fear = U.damp(this.fear, target, 1.5, dt);
      p.alpha = 1 - this.fear * 0.78;
      A.loop('drone', this.fear * 0.22, 0.8);
      A.set('magicbus', 0.8 - this.fear * 0.5, 1);
      if (off === 4 && !this.revealed) {
        this.revealT += dt;
        const nearWater = p.y < WATER.y + WATER.h + 34 && p.y > WATER.y - 20;
        if (this.revealT > 1.6 && nearWater) this.reveal();
      }
      // your own colour shifts with how you move
      if (p.moving) this.hueAcc += (p.vx * 0.05 + p.vy * 0.03) * dt * 10;
      if (this.revealed) {
        const hue = (this.G.state.selfHue + Math.sin(this.hueAcc * 0.05) * 25 + p.vx * 0.25) % 360;
        this.liveHue = hue;
        this.playerLight.rgb = U.hslToRgb(hue, 80, 70).map(v => v | 0).join(',');
        this.playerLight.ca = 0.4; this.playerLight.r = 72;
      }
      for (const w of this.whispers) w.t += dt;
      this.whispers = this.whispers.filter(w => w.t < 4.5);
      // narrow passage with armour on
      if (!this.bumped && this.onCount > 0 && p.y < 4 * 16 + 14 && Math.abs(p.x - 120) < 20 && p.inputting && !p.moving) {
        this.bumped = true; G.say(TX.gallery.narrow);
      }
      if (this.onCount > 0 && this.masks.every(m => m.state !== 'wait' && m.state !== 'fly')) {
        if (!this.hinted) { this.hinted = true; UI.hint(Y.Input.touch ? TX.gallery.hintTouch : TX.gallery.hint, 6); }
      }
      if (!this.done && p.y < 2 * 16 + 8) { this.done = true; G.goto('station'); }
    }

    reveal() {
      this.revealed = true;
      const hue = ((this.hueAcc % 360) + 360) % 360;
      this.G.state.selfHue = hue;
      this.G.once('galleryReveal');
      A.sfx.chime(587, 0.1);
      A.sfx.sparkle(0.05);
      for (let i = 0; i < 40; i++) {
        const a = Math.random() * U.TAU;
        this.particles.add({ x: this.P.x, y: this.P.y - 9, vx: Math.cos(a) * 30, vy: Math.sin(a) * 30, life: 1.6, color: U.hsl(hue + i * 4, 80, 75), light: 6, rgb: U.hslToRgb(hue, 80, 70).map(v => v | 0).join(','), la: 0.5 });
      }
      setTimeout(() => this.G.say(TX.gallery.reveal), 1500);
    }

    onAction() {
      const on = this.masks.filter(m => m.state === 'on');
      if (!on.length) return false;
      const m = on[on.length - 1];
      m.state = 'off';
      const p = this.P;
      const d = { x: p.x + U.range(-12, 12), y: p.y + U.range(2, 8), label: m.label, rot: U.range(-0.5, 0.5), a: 1 };
      this.dropped.push(d);
      this.whispers.push({ text: Y.T.g(m.whisper), x: d.x, y: d.y - 14, t: 0 });
      A.sfx.thud(0.15);
      for (let i = 0; i < 6; i++) setTimeout(() => A.sfx.blip('mask'), i * 70);
      A.sfx.whisper(0, 0.06);
      return true;
    }
    actLabel() { return this.masks.some(m => m.state === 'on') ? TX.gallery.remove : ''; }

    drawFloor(ctx) {
      E.blitWorld(ctx, this.floor);
      // calm water
      const w = WATER;
      ctx.fillStyle = '#0d1a28'; ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = 'rgba(120,170,220,0.12)';
      for (let i = 0; i < 6; i++) ctx.fillRect(w.x + 6 + ((i * 23 + this.t * 6) % (w.w - 16)), w.y + 5 + i * 4, 8, 1);
      // reflection in the water
      const p = this.P;
      if (p.y < w.y + w.h + 60 && p.y > w.y - 30) {
        const rx = U.clamp(p.x, w.x + 6, w.x + w.w - 6);
        ctx.save();
        ctx.beginPath(); ctx.rect(w.x, w.y, w.w, w.h); ctx.clip();
        if (this.revealed) {
          const hue = this.liveHue || this.G.state.selfHue;
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.9;
          ctx.drawImage(E.colorGlow(U.hslToRgb(hue, 85, 65).map(v => v | 0).join(',')), rx - 22, w.y + 2, 44, 30);
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 0.85;
          ctx.translate(0, w.y * 2 + 8); ctx.scale(1, -1);
          ctx.drawImage(S.tint(S.player.down[0], U.hsl(hue, 85, 75, 0.6)), Math.round(rx - S.player.down[0].width / 2), w.y - 14);
        } else if (this.onCount > 0) {
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = '#6a6470'; ctx.fillRect(Math.round(rx - 5), w.y + 4, 10, 16); ctx.fillRect(Math.round(rx - 4), w.y + 20, 8, 6);
        }
        ctx.restore();
      }
      ctx.fillStyle = '#2a2836'; ctx.fillRect(w.x - 2, w.y - 2, w.w + 4, 2); ctx.fillRect(w.x - 2, w.y + w.h, w.w + 4, 2);
      ctx.fillRect(w.x - 2, w.y, 2, w.h); ctx.fillRect(w.x + w.w, w.y, 2, w.h);
      // narrow passage
      E.rect(ctx, 7 * 16 - 3, 3 * 16, 3, 16, '#2a2238'); E.rect(ctx, 8 * 16, 3 * 16, 3, 16, '#2a2238');
      // fallen masks
      for (const d of this.dropped) {
        ctx.save(); ctx.translate(Math.round(d.x), Math.round(d.y)); ctx.rotate(d.rot);
        ctx.fillStyle = '#d8d2c8'; ctx.fillRect(-4, -3, 8, 6);
        ctx.fillStyle = '#1a1620'; ctx.fillRect(-3, -1, 2, 1); ctx.fillRect(1, -1, 2, 1); ctx.fillRect(-1, 2, 2, 1);
        ctx.restore();
      }
    }

    drawMirror(ctx, mr) {
      const left = mr.tx === 1;
      const x = left ? mr.x - 2 : mr.x - 6, y = mr.y - 22, w = 8, h = 28;
      E.rect(ctx, x - 1, y - 1, w + 2, h + 2, '#5a4a2a');
      E.rect(ctx, x, y, w, h, '#1c2230');
      E.rect(ctx, x + 1, y + 1, 1, h - 2, 'rgba(200,220,255,0.25)');
      // what the mirror shows
      const p = this.P, dy = U.clamp((p.y - mr.y) * 0.15, -6, 6);
      const near = Math.abs(p.y - mr.y) < 90;
      if (!near) return;
      if (this.onCount > 0) {
        ctx.globalAlpha = 0.75;
        E.rect(ctx, x + 2, y + 8 + dy, 4, 12, '#7a7480');
        E.rect(ctx, x + 2, y + 4 + dy, 4, 4, '#8e8894');
        ctx.globalAlpha = 1;
      } else if (this.revealed) {
        const hue = this.liveHue || 0;
        E.rect(ctx, x + 2, y + 6 + dy, 4, 14, U.hsl(hue, 80, 70, 0.8));
        E.rect(ctx, x + 2, y + 3 + dy, 4, 3, U.hsl(hue + 20, 80, 80, 0.9));
      }
    }

    drawables() {
      const out = [];
      for (const mn of this.mannequins) out.push({ y: mn.y + 6, draw: ctx => {
        const x = mn.x, y = mn.y + 6;
        ctx.globalAlpha = 0.4; E.ellipse(ctx, x, y, 6, 2, '#000'); ctx.globalAlpha = 1;
        E.rect(ctx, x - 1, y - 6, 2, 6, '#3a3440');
        E.rect(ctx, x - 4, y - 18, 8, 12, '#8a8290');
        E.rect(ctx, x - 3, y - 24, 6, 6, '#9a94a0');
        E.rect(ctx, x - 4, y - 18, 8, 1, '#a49eaa');
      } });
      for (const mr of this.mirrors) out.push({ y: mr.y + 8, draw: ctx => this.drawMirror(ctx, mr) });
      const p = this.P;
      // armour & masks on you
      out.push({ y: p.y + 0.5, draw: ctx => {
        const n = this.onCount;
        if (!n) return;
        const x = Math.round(p.x), y = Math.round(p.y);
        ctx.globalAlpha = p.alpha;
        if (n >= 1) { E.rect(ctx, x - 7, y - 9, 14, 6, '#6c6876'); E.rect(ctx, x - 7, y - 9, 14, 1, '#8a8694'); }
        if (n >= 2) { E.rect(ctx, x - 8, y - 12, 3, 5, '#7a7684'); E.rect(ctx, x + 5, y - 12, 3, 5, '#7a7684'); }
        if (n >= 3) { E.rect(ctx, x - 5, y - 5, 10, 3, '#5c5866'); }
        if (n >= 4 && p.dir !== 'up') { E.rect(ctx, x - 4, y - 16, 8, 6, '#e2dcd2'); E.rect(ctx, x - 3, y - 14, 2, 1, '#1a1620'); E.rect(ctx, x + 1, y - 14, 2, 1, '#1a1620'); }
        ctx.globalAlpha = 1;
      } });
      for (const m of this.masks) if (m.state === 'fly') out.push({ y: 9999, draw: ctx => { E.rect(ctx, m.x - 4, m.y - 3, 8, 6, '#e2dcd2'); } });
      return out;
    }

    lights() {
      for (const mr of this.mirrors) E.addLight(mr.x, mr.y - 8, 26, 0.3, '200,210,255', 0.15);
      E.addLight(WATER.x + WATER.w / 2, WATER.y + WATER.h / 2, 60, 0.45, '120,170,230', 0.25);
      E.addLight(120, 30, 50, 0.6, '255,230,200', 0.3);
      if (this.revealed) E.addLight(this.P.x, this.P.y - 10, 50, 0.6, this.playerLight.rgb, 0.4);
      else this.playerLight.r = 62 - this.fear * 34;
    }

    drawPost(ctx) {
      E.tint(ctx, '#202030', this.fear * 0.45, 'multiply');
      this.vignette = 0.55 + this.fear * 0.4;
    }

    drawHud(h) {
      const p = this.P;
      const on = this.masks.filter(m => m.state === 'on');
      on.forEach((m, i) => {
        const a = this.t * 0.7 + i * U.TAU / on.length;
        E.text(h, m.label, p.x + Math.cos(a) * 18, p.y - 14 + Math.sin(a) * 8, { size: 5, color: '#e6dfd4', alpha: 0.85, stroke: '#000', strokeW: 1.2 });
      });
      for (const d of this.dropped) E.text(h, d.label, d.x, d.y + 7, { size: 4.5, color: '#9a92a0', alpha: 0.6 });
      for (const w of this.whispers) {
        const a = Math.min(1, w.t * 2) * Math.min(1, (4.5 - w.t));
        E.text(h, w.text, w.x, w.y - w.t * 3, { size: 6, color: '#cfc3dd', alpha: a, glow: 'rgba(120,90,160,0.8)' });
      }
    }
  }
  Y.LOC.gallery = Gallery;
})(window.Y);

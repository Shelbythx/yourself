'use strict';
/*
 * III. Сад дрібниць. Гігантські моноліти з пульсуючим ядром-спогадом.
 * Якщо тікати від них або дивитися знизу вгору — ростуть.
 * Підійди впритул, вислухай спогад до кінця — і скеля стає камінчиком у долоні.
 */
(function (Y) {
  const U = Y.U, E = Y.E, A = Y.Audio, TX = Y.TEXT;
  const W = 30, H = 34;
  const SPOTS = [[8, 25], [21, 22], [9, 15], [20, 11], [14, 6]];
  const STAR = { x: 3 * 16 + 8, y: 2 * 16 + 12 };  // easter egg: an Undertale save star in the top-left nook

  function makeMap() {
    const r = U.rng(31), rows = [];
    for (let y = 0; y < H; y++) {
      let row = '';
      for (let x = 0; x < W; x++) {
        let c = '.';
        const edge = Math.min(x, W - 1 - x, y, H - 1 - y);
        if (edge < 2) c = '#';
        else if (edge < 3 && r() < 0.45) c = '#';
        else if (r() < 0.025) c = '#';
        if ((x === 14 || x === 15) && y <= 2) c = y <= 1 ? 'g' : '.';
        if ((x === 14 || x === 15) && y >= H - 3) c = '.';
        row += c;
      }
      rows.push(row);
    }
    // keep monolith surroundings and the main path clear
    const clear = (cx, cy, rad) => {
      for (let y = cy - rad; y <= cy + rad; y++) for (let x = cx - rad; x <= cx + rad; x++) {
        if (x < 2 || y < 2 || x > W - 3 || y > H - 3) continue;
        rows[y] = rows[y].slice(0, x) + '.' + rows[y].slice(x + 1);
      }
    };
    SPOTS.forEach(([x, y]) => clear(x, y, 2));
    for (let y = 2; y < H - 1; y++) clear(14, y, 0), clear(15, y, 0);
    return rows;
  }

  class Garden extends Y.Loc {
    constructor(G) {
      super(G);
      this.map = new E.TileMap(makeMap());
      this.solidChars = '#g';
      this.entry = { x: 15 * 16, y: (H - 2) * 16 + 4, dir: 'up' };
      this.darkness = 0.8; this.darkRGB = '4,4,8';
      this.vignette = 0.6;
      this.stepOpts = { vol: 0.04, tone: 600 };
      this.mons = SPOTS.map(([tx, ty], i) => {
        const r = U.rng(100 + i);
        const h = Math.round(74 + r() * 26);
        const rubble = [];
        for (let k = 0; k < 8; k++) {
          const side = k % 2 ? 1 : -1;
          rubble.push({ dx: side * U.range(9, 20, r), dy: U.range(-3, 6, r), w: 1 + Math.floor(r() * 3), h: 1 + Math.floor(r() * 2) });
        }
        return { i, x: tx * 16 + 8, y: ty * 16 + 12, s: 1.15, mem: TX.memories[i], named: false, shrink: 0, ph: r() * 6, h, busy: false, tex: makeMonolith(500 + i * 37, h), rubble };
      });
      this.pocket = [];
      this.got = null;
      this.sky = 0; this.threat = 0;
      this.stars = new E.Starfield(160, 23, { period: 360, parallax: 0.2 });
      this.floor = this.buildFloor();
      this.allDone = false;
    }
    enter() { A.scene({ utra: 0.8, angryutro: 0 }, 3); }
    solid(tx, ty) {
      const c = this.map.ch(tx, ty);
      if (c === 'g') return !this.allDone;
      return super.solid(tx, ty);
    }
    rects() {
      return this.mons.filter(m => !m.named).map(m => ({ x: m.x - 12, y: m.y - 8, w: 24, h: 8 }));
    }

    buildFloor() {
      const r = U.rng(77), m = this.map;
      return E.prerender(m.pw, m.ph, g => {
        for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
          const x = tx * 16, y = ty * 16, c = m.ch(tx, ty);
          g.fillStyle = (tx * 7 + ty * 3) % 5 === 0 ? '#16181c' : '#15171a';
          g.fillRect(x, y, 16, 16);
          for (let i = 0; i < 5; i++) {
            g.fillStyle = r() < 0.5 ? '#1d2420' : '#20221f';
            g.fillRect(x + Math.floor(r() * 15), y + Math.floor(r() * 15), 1, 1 + Math.floor(r() * 2));
          }
          if (r() < 0.2) { g.fillStyle = '#2a2b2e'; g.fillRect(x + Math.floor(r() * 13), y + Math.floor(r() * 13), 2, 1); }
          if (c === '#') {
            g.fillStyle = '#0b0c0f'; g.fillRect(x, y, 16, 16);
            g.fillStyle = '#1b1c22'; g.beginPath(); g.ellipse(x + 8, y + 9, 8 + r() * 2, 7, 0, 0, U.TAU); g.fill();
            g.fillStyle = '#25262e'; g.fillRect(x + 3, y + 3, 6, 2);
          }
        }
      });
    }

    update(dt) {
      super.update(dt);
      const p = this.P, G = this.G, playing = !G.locked && !Y.Dialog.active;
      let threat = 0;
      for (const m of this.mons) {
        if (m.named) { m.shrink = Math.min(1, m.shrink + dt * 1.1); continue; }
        const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy) || 1;
        if (playing && d < 120) {
          const vr = (p.vx * dx + p.vy * dy) / d;
          const k = 1 - d / 120;
          if (vr > 20) m.s += dt * 0.28 * k;                         // running away
          else if (vr < -20) m.s -= dt * 0.18;                       // walking towards
          if (p.still > 1.1 && d > 34 && d < 95) m.s += dt * 0.08;   // staring from below
        }
        m.s = U.clamp(m.s, 1, 2.3);
        threat = Math.max(threat, (m.s - 1) / 1.3);
      }
      this.threat = U.damp(this.threat, threat, 2, dt);
      const named = this.mons.filter(m => m.named).length;
      this.sky = U.damp(this.sky, this.allDone ? 1 : named / 5 * 0.5, 0.8, dt);
      this.darkness = U.lerp(0.8, 0.52, this.sky) + this.threat * 0.08;
      // one track at a time: the angry one while the rocks loom, the calm one when they settle
      if (this.threat > 0.5) A.music('angryutro', 0.8, 1, 0.8);
      else if (this.threat < 0.3) A.music('utra', 0.8, 1.5, 0.8);
      if (this.got) { this.got.t += dt; if (this.got.t > 3) this.got = null; }
      if (!this.allDone && named === 5 && !Y.Dialog.active) {
        this.allDone = true;
        A.sfx.chime(784, 0.09);
        setTimeout(() => G.say(TX.gardenSky), 1200);
      }
      if (this.allDone && p.y < 26) G.goto('bridge');
      if (this.allDone && Math.random() < dt * 6) this.particles.add({ x: 240 + U.range(-16, 16), y: U.range(4, 40), vy: U.range(-6, 2), life: 2.4, color: '#dfe8ff', light: 5, rgb: '200,220,255', la: 0.4 });
    }

    listen(m) {
      m.busy = true;
      this.P.dir = this.P.y < m.y ? 'down' : 'up';
      A.sfx.chime(330, 0.05);
      this.G.say(m.mem.lines).then(() => {
        m.named = true;
        A.sfx.whoosh(0.1, false);
        E.shake(0.4, 1.5);
        for (let i = 0; i < 40; i++) this.particles.add({ x: m.x + U.range(-14, 14), y: m.y - U.range(0, m.h * m.s), vx: U.range(-20, 20), vy: U.range(-10, 30), life: U.range(0.8, 2), size: 1, color: '#8a8ea0', grav: 30 });
        this.pocket.push(m.mem);
        this.got = { mem: m.mem, t: 0 };
        A.sfx.sparkle(0.04);
      });
    }

    interactables() {
      const out = this.mons.filter(m => !m.named && !m.busy).map(m => ({
        x: m.x, y: m.y - 4, r: 30, label: TX.listen, px: m.x, py: m.y - m.h * m.s * 0.45, act: () => this.listen(m)
      }));
      out.push({ x: STAR.x, y: STAR.y, r: 20, label: TX.eggs.save, py: STAR.y - 8, act: () => {
        A.sfx.musicBox([523, 784, 1046], 0.12, 0.05);
        this.G.save();
        this.G.say(TX.eggs.saveLines).then(() => this.G.egg('save'));
      } });
      return out;
    }

    drawFloor(ctx) {
      E.blitWorld(ctx, this.floor);
      // the gate at the top
      for (const [gx, side] of [[14, -1], [15, 1]]) {
        const off = this.allDone ? side * 10 * U.smooth(this.sky) : 0;
        E.rect(ctx, gx * 16 + 2 + off, 4, 12, 26, this.allDone ? '#2c3040' : '#1e1f26');
        E.rect(ctx, gx * 16 + 2 + off, 4, 12, 2, '#35374a');
      }
      // shadows of monoliths and the rubble at their feet
      for (const m of this.mons) {
        const s = m.named ? U.lerp(m.s, 0.1, U.easeOut(m.shrink)) : m.s;
        for (const b of m.rubble) {
          E.rect(ctx, m.x + b.dx, m.y + b.dy, b.w, b.h, '#23252f');
          E.rect(ctx, m.x + b.dx, m.y + b.dy, b.w, 1, '#3a3d4c');
        }
        if (s < 0.15) continue;
        ctx.globalAlpha = 0.55;
        E.ellipse(ctx, m.x, m.y, 18 * s, 6 * s, '#000');
        ctx.globalAlpha = 0.25;
        E.ellipse(ctx, m.x + 8 * s, m.y + 10 * s, 26 * s, 12 * s, '#000');
        ctx.globalAlpha = 1;
      }
      // named things lie where the rocks stood
      for (const m of this.mons) if (m.named && m.shrink > 0.6) drawItem(ctx, m.mem.icon, m.x, m.y - 2, (m.shrink - 0.6) / 0.4);
    }

    // where the glowing core sits right now (world coordinates)
    coreAt(m, s) {
      const T = m.tex, w = Math.round(T.W * s), h = Math.round(T.H * s);
      return { x: Math.round(m.x - w / 2) + (T.core.x + 0.5) * w / T.W, y: Math.round(m.y - h) + T.core.y * h / T.H };
    }

    drawMon(ctx, m) {
      const k = m.named ? U.easeOut(m.shrink) : 0;
      const s = m.named ? U.lerp(m.s, 0.05, k) : m.s;
      if (s < 0.08) return;
      const T = m.tex, w = Math.round(T.W * s), h = Math.round(T.H * s);
      const x0 = Math.round(m.x - w / 2), y0 = Math.round(m.y - h);
      ctx.globalAlpha = 1 - k * 0.8;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(T.c, x0, y0, w, h);
      const angry = U.clamp((m.s - 1.2) / 0.8, 0, 1);
      const pulse = 0.55 + 0.45 * Math.sin(this.t * (2 + (m.s - 1) * 4) + m.ph);
      const px = Math.max(1, Math.round(s));
      // light seeping through the cracks, brighter close to the core
      const vein = U.mixc([196, 168, 255], [255, 112, 120], angry).map(v => v | 0).join(',');
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const v of T.veins) {
        const wave = 0.5 + 0.5 * Math.sin(this.t * 3 - v.k * 6 + m.ph);
        ctx.fillStyle = `rgba(${vein},${(0.2 + 0.55 * pulse * wave) * (1 - v.k * 0.6) * (1 - k)})`;
        ctx.fillRect(Math.round(x0 + v.x * w / T.W), Math.round(y0 + v.y * h / T.H), px, px);
      }
      ctx.restore();
      ctx.globalAlpha = 1 - k * 0.8;
      // the core: an orb in a hollow, a slowly turning ring of runes and the memory's sign
      const c = this.coreAt(m, s), cr = 4.5 * s;
      const glow = U.mixc([206, 186, 255], [255, 128, 140], angry).map(v => v | 0).join(',');
      ctx.fillStyle = `rgba(${glow},${0.55 + 0.45 * pulse})`;
      ctx.beginPath(); ctx.arc(c.x, c.y, cr + 1.2, 0, U.TAU); ctx.fill();
      ctx.fillStyle = '#f6f1ff';
      ctx.beginPath(); ctx.arc(c.x, c.y, cr * 0.82, 0, U.TAU); ctx.fill();
      const p = Math.max(1, Math.floor(s * 0.9));
      drawIcon(ctx, m.mem.icon, c.x, c.y, p, angry > 0.4 ? '#7a1f34' : '#3e2c6e');
      ctx.fillStyle = `rgba(${glow},${0.35 + 0.4 * pulse})`;
      for (let i = 0; i < 8; i++) {
        const a = this.t * (0.6 + angry) + m.ph + i * U.TAU / 8, rr = cr + 3 * s;
        ctx.fillRect(Math.round(c.x + Math.cos(a) * rr), Math.round(c.y + Math.sin(a) * rr * 0.9), px, px);
      }
      ctx.globalAlpha = 1;
    }

    drawables() {
      const out = this.mons.map(m => ({ y: m.y, draw: ctx => this.drawMon(ctx, m) }));
      out.push({ y: STAR.y, draw: ctx => drawSaveStar(ctx, STAR.x, STAR.y, this.t) });
      if (this.got) {
        const p = this.P, g = this.got;
        out.push({ y: p.y + 1, draw: ctx => drawItem(ctx, g.mem.icon, p.x, p.y - 24 - Math.min(1, g.t * 2) * 4, Math.min(1, g.t * 3) * (g.t > 2.5 ? (3 - g.t) * 2 : 1)) });
      }
      return out;
    }

    lights() {
      for (const m of this.mons) {
        const k = m.named ? U.easeOut(m.shrink) : 0;
        const s = m.named ? U.lerp(m.s, 0.05, k) : m.s;
        const angry = U.clamp((m.s - 1.2) / 0.8, 0, 1);
        if (!m.named) {
          const c = this.coreAt(m, s), rgb = angry > 0.3 ? '255,120,120' : '190,170,255';
          E.addLight(c.x, c.y, 30 + 22 * s, 0.68, rgb, 0.4);
          // a faint glow from the cracks shows the stone around them
          const T = m.tex, w = Math.round(T.W * s), h = Math.round(T.H * s), x0 = Math.round(m.x - w / 2), y0 = Math.round(m.y - h);
          for (let i = 0; i < T.veins.length; i += 6) { const v = T.veins[i]; E.addLight(x0 + v.x * w / T.W, y0 + v.y * h / T.H, 10 * s, 0.25, rgb, 0.3); }
        }
        else E.addLight(m.x, m.y - 2, 14, 0.5 * k, '255,230,190', 0.4);
      }
      if (this.allDone) E.addLight(240, 16, 70 * this.sky, 0.8, '200,220,255', 0.3);
      E.addLight(STAR.x, STAR.y - 6, 20 + 4 * Math.sin(this.t * 3), 0.7, '255,225,110', 0.45);
    }

    drawPost(ctx) {
      // heavy shadows cast on the ground in front of big rocks
      for (const m of this.mons) {
        if (m.named) continue;
        const r = 40 + 50 * (m.s - 1);
        ctx.globalAlpha = U.clamp((m.s - 1) * 0.9, 0, 0.75);
        ctx.drawImage(E.colorGlow('0,0,0'), m.x - r, m.y - r * 0.2, r * 2, r * 1.2);
      }
      ctx.globalAlpha = 1;
      E.tint(ctx, '#7a4060', this.threat * 0.3, 'multiply');
      E.tint(ctx, '#6070a0', (1 - this.sky) * 0.25, 'multiply');
      // the save star shines through the gloom, unless you stand right in front of it
      const p = this.P;
      if (!(Math.abs(p.x - STAR.x) < 9 && p.y > STAR.y && p.y - STAR.y < 22)) drawSaveStar(ctx, STAR.x, STAR.y, this.t);
      // the sky opens: stars shine over the garden
      if (this.sky > 0.3) {
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'lighter';
        this.stars.draw(ctx, this.t, (this.sky - 0.3) * 0.8);
        ctx.restore();
      }
    }

    drawHud(h) {
      if (this.got) {
        const p = this.P, g = this.got;
        const a = Math.min(1, g.t * 2) * (g.t > 2.5 ? (3 - g.t) * 2 : 1);
        E.text(h, g.mem.item, p.x, p.y - 36, { size: 7, color: '#fff3dc', alpha: a, glow: 'rgba(255,220,170,0.8)' });
      }
      for (const m of this.mons) if (m.named && m.shrink > 0.8) E.text(h, m.mem.item, m.x, m.y + 8, { size: 5, color: '#cfc6b8', alpha: 0.6 });
      // pocket
      E.hudScreen();
      this.pocket.forEach((mem, i) => {
        h.globalAlpha = 0.85;
        E.text(h, '· ' + mem.item, 8, 10 + i * 8, { size: 5.5, align: 'left', color: '#e6dccb' });
      });
      E.hudWorld();
    }
  }

  // 7×7 signs of the memories inside the cores
  const ICONS = {
    cup: ['.......', '.####..', '.####.#', '.####.#', '.#####.', '..###..', '.......'],
    talk: ['.#####.', '#.....#', '#.#.#.#', '#.....#', '.##.###', '.#.....', '.......'],
    clock: ['..###..', '.#...#.', '#..#..#', '#..##.#', '#.....#', '.#...#.', '..###..'],
    mail: ['.......', '#######', '##...##', '#.#.#.#', '#..#..#', '#######', '.......'],
    mark: ['...#...', '...#...', '...#...', '...#...', '.......', '...#...', '.......']
  };
  // a small yellow twinkle, the kind you save at
  function drawSaveStar(ctx, x, y, t) {
    const k = Math.sin(t * 3) > 0 ? 1 : 0, by = y - 6 + Math.round(Math.sin(t * 2));
    E.rect(ctx, x - 1, by - 1, 3, 3, '#ffe14a');
    E.rect(ctx, x, by - 3 - k, 1, 2 + k, '#ffe14a'); E.rect(ctx, x, by + 2, 1, 2 + k, '#ffe14a');
    E.rect(ctx, x - 3 - k, by, 2 + k, 1, '#ffe14a'); E.rect(ctx, x + 2, by, 2 + k, 1, '#ffe14a');
    E.rect(ctx, x, by, 1, 1, '#fffbe0');
  }

  function drawIcon(ctx, kind, x, y, p, color) {
    const rows = ICONS[kind] || ICONS.mark;
    const x0 = Math.round(x - 3.5 * p), y0 = Math.round(y - 3.5 * p);
    ctx.fillStyle = color;
    rows.forEach((row, j) => { for (let i = 0; i < 7; i++) if (row[i] === '#') ctx.fillRect(x0 + i * p, y0 + j * p, p, p); });
  }

  // a tall broken slab: lit face, shadow face, ridge, strata, cracks with veins, a hollow for the core, moss
  function makeMonolith(seed, height) {
    const r = U.rng(seed), W = 32, H = height + 1, cx = W / 2;
    const c = U.canvas(W, H), g = c.getContext('2d');
    const img = g.createImageData(W, H), d = img.data;
    const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
    const set = (x, y, col) => { if (!inside(x, y)) return; const i = (y * W + x) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255; };
    const solid = (x, y) => inside(x, y) && d[(y * W + x) * 4 + 3] > 0;
    const n1 = r() * 100, n2 = r() * 100;
    const L = [], R = [], ridge = [];
    for (let y = 1; y < H; y++) {
      const t = (y - 1) / (H - 2);
      let hw = 6 + 7.5 * Math.pow(t, 0.55) + U.noise1(y * 0.18 + n1) * 1.4;
      const off = U.noise1(y * 0.07 + n2) * 1.6;
      if (t < 0.14) hw *= 0.3 + 0.7 * (t / 0.14);
      const jag = t < 0.16 ? Math.round((r() - 0.5) * 3) : 0;
      L[y] = Math.round(cx + off - hw) + jag;
      R[y] = Math.round(cx + off + hw * 0.92) + (t < 0.16 ? Math.round((r() - 0.5) * 2) : 0);
      ridge[y] = Math.round(cx + off - hw * 0.12 + U.noise1(y * 0.25 + n1 + 7) * 1.2);
    }
    const shade = (col, k) => col.map(v => Math.min(255, v * k));
    for (let y = 1; y < H; y++) {
      const t = (y - 1) / (H - 2);
      const lit = U.mixc([88, 92, 118], [56, 59, 78], t), dark = U.mixc([40, 42, 58], [24, 25, 35], t);
      const strata = Math.floor(y + U.noise1(y * 0.3 + n2) * 2.5) % 9 === 0;
      for (let x = L[y]; x <= R[y]; x++) {
        let col = x < ridge[y] ? lit : dark;
        if (x === ridge[y]) col = U.mixc([118, 124, 156], lit, t * 0.8);
        if (strata && x !== ridge[y]) col = shade(col, 0.8);
        const sp = r();
        if (sp < 0.08) col = shade(col, 0.86); else if (sp > 0.95) col = shade(col, 1.12);
        set(x, y, col);
      }
      if (r() < 0.65) set(L[y], y, U.mixc([124, 130, 164], [70, 74, 96], t));
    }
    // cracks around the core carry the veins of light
    const core = { x: Math.round(cx + U.noise1(n2) * 1.5 - 1), y: Math.round(H * 0.55) };
    const veins = [];
    for (let k = 0; k < 5; k++) {
      let x = core.x + Math.round((r() - 0.5) * 6), y = core.y + (k % 2 ? 5 : -6);
      const dy = k % 2 ? 1 : -1, len = 8 + Math.floor(r() * Math.min(22, H * 0.3));
      for (let i = 0; i < len; i++) {
        if (solid(x, y)) { set(x, y, [12, 12, 18]); veins.push({ x, y, k: i / len }); }
        y += dy;
        const q = r();
        x += q < 0.3 ? -1 : q < 0.6 ? 1 : 0;
      }
    }
    for (let k = 0; k < 3; k++) {
      let x = Math.round(cx + (r() - 0.5) * 12), y = Math.round(H * (0.12 + r() * 0.7));
      for (let i = 0, n = 5 + r() * 7; i < n; i++) { if (solid(x, y)) set(x, y, [16, 16, 22]); y++; if (r() < 0.4) x += r() < 0.5 ? 1 : -1; }
    }
    // the hollow where the core rests
    for (let y = -6; y <= 6; y++) for (let x = -5; x <= 5; x++) {
      if ((x * x) / 26 + (y * y) / 38 > 1) continue;
      const px = core.x + x, py = core.y + y;
      if (solid(px, py)) set(px, py, y > 4 ? [78, 82, 108] : y < -4 ? [20, 20, 28] : [10, 9, 16]);
    }
    // moss and lichen at the foot
    for (let y = H - 11; y < H; y++) for (let x = L[y]; x <= R[y]; x++) {
      const p = (y - (H - 11)) / 11;
      if (r() < p * 0.55 * (x < ridge[y] ? 1 : 0.5)) set(x, y, r() < 0.5 ? [61, 90, 62] : [86, 124, 82]);
    }
    for (let k = 0; k < 6; k++) { const y = Math.round(H * (0.3 + r() * 0.5)); const x = L[y] + 1 + Math.floor(r() * 3); if (solid(x, y)) set(x, y, [96, 118, 96]); }
    // dark outline for a clean silhouette
    const edge = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) edge.push([x, y]);
    for (const [x, y] of edge) set(x, y, [8, 8, 12]);
    g.putImageData(img, 0, 0);
    return { c, veins, core, W, H };
  }
  Y.makeMonolith = makeMonolith;
  function drawItem(ctx, kind, x, y, a = 1) {
    if (a <= 0) return;
    ctx.globalAlpha = U.clamp(a, 0, 1);
    const R = (c, dx, dy, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x + dx), Math.round(y + dy), w, h); };
    if (kind === 'cup') { R('#e8e6ef', -2, -1, 4, 2); R('#e8e6ef', -1, -2, 2, 1); R('#9aa', 1, 0, 1, 1); }
    else if (kind === 'talk') { R('#f0ead8', -2, -2, 4, 3); R('#c9c0aa', -1, -1, 2, 1); }
    else if (kind === 'clock') { R('#b8bcc8', -2, -2, 4, 1); R('#b8bcc8', -2, -2, 1, 4); R('#b8bcc8', -2, 1, 3, 1); R('#b8bcc8', 1, -1, 1, 2); }
    else if (kind === 'mail') { R('#f2ecdc', -3, -2, 6, 4); R('#c8bea8', -2, -1, 1, 1); R('#c8bea8', 1, -1, 1, 1); R('#c8bea8', -1, 0, 2, 1); }
    else { R('#8d8f98', -2, -1, 4, 3); R('#a9abb4', -1, -1, 2, 1); }
    ctx.globalAlpha = 1;
  }
  Y.drawItem = drawItem;
  Y.LOC.garden = Garden;
})(window.Y);

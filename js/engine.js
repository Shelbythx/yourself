'use strict';
/*
 * Рушій: низькороздільний піксельний canvas + чіткий HUD-canvas для тексту,
 * камера, світло (темний шар із «вирізаними» градієнтами), тайлові карти і колізії,
 * частинки, зоряне небо, світлячки.
 */
(function (Y) {
  const U = Y.U;
  const E = Y.E = { W: 320, H: 180, zoom: 3, dpr: 1, lights: [], cam: { x: 0, y: 0, rot: 0, shake: 0, sx: 0, sy: 0 } };
  E.T = 16;

  E.init = function () {
    E.canvas = document.getElementById('game');
    E.ctx = E.canvas.getContext('2d');
    E.hud = document.getElementById('hud');
    E.hctx = E.hud.getContext('2d');
    E.light = U.canvas(4, 4);
    E.lctx = E.light.getContext('2d');
    E.glow = makeGlow('255,255,255');
    E.resize();
    window.addEventListener('resize', E.resize);
    window.addEventListener('orientationchange', () => setTimeout(E.resize, 200));
  };

  E.resize = function () {
    const w = window.innerWidth, h = window.innerHeight;
    const zoom = Math.max(1, Math.round(Math.min(w, h * 1.25) / 250));
    E.zoom = zoom;
    E.W = Math.ceil(w / zoom); E.H = Math.ceil(h / zoom);
    E.canvas.width = E.W; E.canvas.height = E.H;
    E.canvas.style.width = E.W * zoom + 'px'; E.canvas.style.height = E.H * zoom + 'px';
    E.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    E.hs = zoom * E.dpr;
    E.hud.width = Math.round(E.W * E.hs); E.hud.height = Math.round(E.H * E.hs);
    E.hud.style.width = E.W * zoom + 'px'; E.hud.style.height = E.H * zoom + 'px';
    E.light.width = E.W; E.light.height = E.H;
    E.ctx.imageSmoothingEnabled = false;
    E.vignette = makeVignette(E.W, E.H);
  };

  function makeGlow(rgb) {
    const s = 64, c = U.canvas(s, s), g = c.getContext('2d');
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, `rgba(${rgb},1)`);
    gr.addColorStop(0.22, `rgba(${rgb},0.85)`);
    gr.addColorStop(0.5, `rgba(${rgb},0.42)`);
    gr.addColorStop(0.78, `rgba(${rgb},0.12)`);
    gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    return c;
  }
  const glowCache = new Map();
  E.colorGlow = function (rgb) {
    if (!glowCache.has(rgb)) glowCache.set(rgb, makeGlow(rgb));
    return glowCache.get(rgb);
  };
  function makeVignette(w, h) {
    const c = U.canvas(w, h), g = c.getContext('2d');
    const r = Math.hypot(w, h) / 2;
    const gr = g.createRadialGradient(w / 2, h / 2, r * 0.35, w / 2, h / 2, r);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    return c;
  }

  /* ---------------- camera ---------------- */
  E.camSnap = function (x, y, map) { E.cam.x = x; E.cam.y = y; E.camClamp(map); };
  E.camFollow = function (x, y, dt, map, k = 5) {
    E.cam.x = U.damp(E.cam.x, x, k, dt);
    E.cam.y = U.damp(E.cam.y, y, k, dt);
    E.camClamp(map);
    if (E.cam.shake > 0) {
      E.cam.shake = Math.max(0, E.cam.shake - dt);
      const a = Math.min(1, E.cam.shake) * (E.cam.shakeAmp || 2);
      E.cam.sx = (Math.random() * 2 - 1) * a; E.cam.sy = (Math.random() * 2 - 1) * a;
    } else { E.cam.sx = 0; E.cam.sy = 0; }
  };
  E.camClamp = function (map) {
    if (!map || map.noClamp) return;
    const pw = map.pw, ph = map.ph, hw = E.W / 2, hh = E.H / 2;
    E.cam.x = pw <= E.W ? pw / 2 : U.clamp(E.cam.x, hw, pw - hw);
    E.cam.y = ph <= E.H ? ph / 2 : U.clamp(E.cam.y, hh, ph - hh);
  };
  E.shake = function (t, amp = 2) { E.cam.shake = Math.max(E.cam.shake, t); E.cam.shakeAmp = amp; };
  E.applyCam = function (ctx, s = 1) {
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.translate(E.W / 2, E.H / 2);
    if (E.cam.rot) ctx.rotate(E.cam.rot);
    ctx.translate(-Math.round(E.cam.x + E.cam.sx), -Math.round(E.cam.y + E.cam.sy));
  };
  E.screen = function (ctx, s = 1) { ctx.setTransform(s, 0, 0, s, 0, 0); };
  // world → screen (game pixels)
  E.toScreen = function (x, y) {
    let dx = x - Math.round(E.cam.x + E.cam.sx), dy = y - Math.round(E.cam.y + E.cam.sy);
    if (E.cam.rot) {
      const c = Math.cos(E.cam.rot), s = Math.sin(E.cam.rot);
      [dx, dy] = [dx * c - dy * s, dx * s + dy * c];
    }
    return { x: dx + E.W / 2, y: dy + E.H / 2 };
  };
  E.inView = function (x, y, m = 32) {
    if (E.cam.rot) return true;
    return Math.abs(x - E.cam.x) < E.W / 2 + m && Math.abs(y - E.cam.y) < E.H / 2 + m;
  };

  /* ---------------- light ---------------- */
  // r — радіус у пікселях, a — сила (0..1), rgb — колір ореолу 'r,g,b', ca — сила кольорового ореолу
  E.addLight = function (x, y, r, a = 1, rgb = null, ca = 0.22) {
    if (r <= 0 || a <= 0) return;
    E.lights.push({ x, y, r, a, rgb, ca });
  };
  // cut — необов'язкова функція, що «прорізає» темряву самосвітними речами (зорі тощо)
  E.renderLights = function (ctx, darkness, darkRGB, cut) {
    const l = E.lctx;
    l.setTransform(1, 0, 0, 1, 0, 0);
    l.globalCompositeOperation = 'source-over';
    l.clearRect(0, 0, E.W, E.H);
    if (darkness > 0) {
      l.globalAlpha = U.clamp(darkness, 0, 1);
      l.fillStyle = `rgb(${darkRGB})`;
      l.fillRect(0, 0, E.W, E.H);
      l.globalAlpha = 1;
      l.globalCompositeOperation = 'destination-out';
      E.applyCam(l);
      for (const li of E.lights) {
        l.globalAlpha = U.clamp(li.a, 0, 1);
        l.drawImage(E.glow, li.x - li.r, li.y - li.r, li.r * 2, li.r * 2);
      }
      l.setTransform(1, 0, 0, 1, 0, 0);
      l.globalAlpha = 1;
      if (cut) { l.save(); cut(l); l.restore(); }
      l.globalCompositeOperation = 'source-over';
      l.globalAlpha = 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(E.light, 0, 0);
    }
    // coloured halos
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    E.applyCam(ctx);
    for (const li of E.lights) {
      if (!li.rgb) continue;
      ctx.globalAlpha = U.clamp(li.ca * li.a, 0, 1);
      ctx.drawImage(E.colorGlow(li.rgb), li.x - li.r, li.y - li.r, li.r * 2, li.r * 2);
    }
    ctx.restore();
    E.lights.length = 0;
  };
  E.drawVignette = function (ctx, a) {
    if (a <= 0) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = U.clamp(a, 0, 1);
    ctx.drawImage(E.vignette, 0, 0);
    ctx.globalAlpha = 1;
  };
  E.tint = function (ctx, css, a, mode = 'multiply') {
    if (a <= 0) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = mode; ctx.globalAlpha = U.clamp(a, 0, 1);
    ctx.fillStyle = css; ctx.fillRect(0, 0, E.W, E.H);
    ctx.restore();
  };

  /* ---------------- tile map ---------------- */
  class TileMap {
    constructor(rows, T = 16) {
      this.rows = rows; this.T = T;
      this.h = rows.length; this.w = Math.max(...rows.map(r => r.length));
      this.pw = this.w * T; this.ph = this.h * T;
    }
    ch(tx, ty) {
      if (ty < 0 || ty >= this.h || tx < 0 || tx >= this.w) return null;
      return this.rows[ty][tx] || ' ';
    }
    set(tx, ty, c) {
      const r = this.rows[ty];
      this.rows[ty] = r.slice(0, tx) + c + r.slice(tx + 1);
    }
    find(c) {
      const out = [];
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.rows[y][x] === c) out.push({ tx: x, ty: y, x: x * this.T + this.T / 2, y: y * this.T + this.T / 2 });
      return out;
    }
    first(c) { return this.find(c)[0]; }
  }
  E.TileMap = TileMap;

  // collision: the box spans x±hw and [y-hh, y] (the feet)
  E.hits = function (loc, x, y, hw, hh) {
    const T = loc.map.T;
    const x0 = Math.floor((x - hw) / T), x1 = Math.floor((x + hw - 0.01) / T);
    const y0 = Math.floor((y - hh) / T), y1 = Math.floor((y - 0.01) / T);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (loc.solid(tx, ty)) return true;
    }
    if (loc.rects) {
      for (const r of loc.rects()) {
        if (x + hw > r.x && x - hw < r.x + r.w && y > r.y && y - hh < r.y + r.h) return true;
      }
    }
    return false;
  };
  E.move = function (ent, dx, dy, loc) {
    const hw = ent.hw || 4, hh = ent.hh || 4;
    let bx = false, by = false;
    if (dx) {
      if (!E.hits(loc, ent.x + dx, ent.y, hw, hh)) ent.x += dx;
      else {
        bx = true;
        // slide around corners
        if (!dy) for (const o of [1, -1, 2, -2, 3, -3, 4, -4]) {
          if (!E.hits(loc, ent.x + dx, ent.y + o, hw, hh) && !E.hits(loc, ent.x, ent.y + o, hw, hh)) { ent.y += Math.sign(o) * Math.min(Math.abs(dx), 1); break; }
        }
      }
    }
    if (dy) {
      if (!E.hits(loc, ent.x, ent.y + dy, hw, hh)) ent.y += dy;
      else {
        by = true;
        if (!dx) for (const o of [1, -1, 2, -2, 3, -3, 4, -4]) {
          if (!E.hits(loc, ent.x + o, ent.y + dy, hw, hh) && !E.hits(loc, ent.x + o, ent.y, hw, hh)) { ent.x += Math.sign(o) * Math.min(Math.abs(dy), 1); break; }
        }
      }
    }
    return { bx, by };
  };

  E.prerender = function (w, h, fn) {
    const c = U.canvas(w, h), g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    fn(g, c);
    return c;
  };
  // draw only the visible part of a big pre-rendered layer
  E.blitWorld = function (ctx, img, ox = 0, oy = 0) {
    if (E.cam.rot) { ctx.drawImage(img, ox, oy); return; }
    const x0 = Math.max(0, Math.floor(E.cam.x - E.W / 2 - 2 - ox)), y0 = Math.max(0, Math.floor(E.cam.y - E.H / 2 - 2 - oy));
    const w = Math.min(img.width - x0, E.W + 4), h = Math.min(img.height - y0, E.H + 4);
    if (w > 0 && h > 0) ctx.drawImage(img, x0, y0, w, h, x0 + ox, y0 + oy, w, h);
  };

  /* ---------------- particles ---------------- */
  class Particles {
    constructor() { this.list = []; }
    add(p) {
      p.life = p.life || 1; p.t = 0; p.vx = p.vx || 0; p.vy = p.vy || 0;
      p.size = p.size || 1; p.drag = p.drag == null ? 0.98 : p.drag;
      this.list.push(p);
      return p;
    }
    update(dt) {
      const L = this.list;
      for (let i = L.length - 1; i >= 0; i--) {
        const p = L[i];
        p.t += dt;
        if (p.t >= p.life) { if (p.onDie) p.onDie(p); L.splice(i, 1); continue; }
        if (p.update) p.update(p, dt);
        p.vy += (p.grav || 0) * dt;
        const d = Math.pow(p.drag, dt * 60);
        p.vx *= d; p.vy *= d;
        p.x += p.vx * dt; p.y += p.vy * dt;
      }
    }
    alpha(p) {
      const k = p.t / p.life;
      const fin = p.fadeIn ? U.clamp(p.t / p.fadeIn, 0, 1) : 1;
      return fin * (p.keep ? 1 : 1 - k * k) * (p.a == null ? 1 : p.a);
    }
    draw(ctx) {
      for (const p of this.list) {
        const a = this.alpha(p);
        if (a <= 0.01) continue;
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color || '#fff';
        const s = p.size;
        ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s);
      }
      ctx.globalAlpha = 1;
    }
    lights() {
      for (const p of this.list) {
        if (!p.light) continue;
        const a = this.alpha(p);
        E.addLight(p.x, p.y, p.light, a * (p.la || 0.6), p.rgb || null, 0.35);
      }
    }
  }
  E.Particles = Particles;

  /* ---------------- starfield (screen space, parallax) ---------------- */
  class Starfield {
    constructor(n = 160, seed = 7, opts = {}) {
      const r = U.rng(seed);
      this.P = opts.period || 420;
      this.par = opts.parallax == null ? 0.12 : opts.parallax;
      this.stars = [];
      const cols = opts.colors || ['255,250,235', '220,230,255', '255,225,200', '235,220,255'];
      for (let i = 0; i < n; i++) {
        this.stars.push({
          x: r() * this.P, y: r() * this.P,
          s: r() < 0.08 ? 2 : 1, b: 0.35 + r() * 0.65,
          tw: 0.5 + r() * 2.5, ph: r() * U.TAU, c: cols[Math.floor(r() * cols.length)]
        });
      }
    }
    draw(ctx, t, alpha = 1, ox = 0, oy = 0) {
      const P = this.P;
      const cx = E.cam.x * this.par + ox, cy = E.cam.y * this.par + oy;
      for (const s of this.stars) {
        const tw = 0.6 + 0.4 * Math.sin(t * s.tw + s.ph);
        const a = s.b * tw * alpha;
        if (a < 0.03) continue;
        let x = ((s.x - cx) % P + P) % P, y = ((s.y - cy) % P + P) % P;
        for (let yy = y; yy < E.H; yy += P) for (let xx = x; xx < E.W; xx += P) {
          ctx.fillStyle = `rgba(${s.c},${a})`;
          ctx.fillRect(Math.round(xx), Math.round(yy), s.s, s.s);
          if (s.s === 2 && a > 0.5) {
            ctx.fillStyle = `rgba(${s.c},${a * 0.35})`;
            ctx.fillRect(Math.round(xx) - 1, Math.round(yy), 4, 2);
            ctx.fillRect(Math.round(xx), Math.round(yy) - 1, 2, 4);
          }
        }
      }
    }
  }
  E.Starfield = Starfield;

  /* ---------------- fireflies (move by noise, flicker) ---------------- */
  class Fireflies {
    constructor(n, area, seed = 3, opts = {}) {
      const r = U.rng(seed);
      this.list = [];
      this.rgb = opts.rgb || '255,236,150';
      this.core = opts.core || '#fff6c8';
      this.radius = opts.radius || 18;
      this.spread = opts.spread || 40;
      for (let i = 0; i < n; i++) {
        const hx = area.x + r() * area.w, hy = area.y + r() * area.h;
        this.list.push({ hx, hy, x: hx, y: hy, vx: 0, vy: 0, seed: r() * 100, ph: r() * U.TAU, b: 1, alpha: opts.alpha == null ? 1 : opts.alpha });
      }
    }
    update(dt, t) {
      for (const f of this.list) {
        const ang = U.noise1(t * 0.22 + f.seed) * Math.PI * 2.2;
        f.vx += Math.cos(ang) * 22 * dt; f.vy += Math.sin(ang) * 22 * dt;
        const dx = f.hx - f.x, dy = f.hy - f.y, d = Math.hypot(dx, dy);
        if (d > this.spread) { f.vx += dx / d * 14 * dt; f.vy += dy / d * 14 * dt; }
        f.vx *= Math.pow(0.97, dt * 60); f.vy *= Math.pow(0.97, dt * 60);
        f.x += f.vx * dt; f.y += f.vy * dt;
        const n = U.noise1(t * 1.7 + f.seed * 3);
        f.b = U.clamp(0.55 + 0.35 * Math.sin(t * 2.4 + f.ph) + 0.25 * n, 0.05, 1);
      }
    }
    draw(ctx) {
      for (const f of this.list) {
        const a = f.b * f.alpha;
        ctx.globalAlpha = a;
        ctx.fillStyle = this.core;
        ctx.fillRect(Math.round(f.x), Math.round(f.y), 1, 1);
        ctx.globalAlpha = a * 0.4;
        ctx.fillRect(Math.round(f.x) - 1, Math.round(f.y), 3, 1);
        ctx.fillRect(Math.round(f.x), Math.round(f.y) - 1, 1, 3);
      }
      ctx.globalAlpha = 1;
    }
    lights() {
      for (const f of this.list) E.addLight(f.x, f.y, this.radius * (0.7 + f.b * 0.5), 0.55 * f.b * f.alpha, this.rgb, 0.45);
    }
  }
  E.Fireflies = Fireflies;

  /* ---------------- HUD text (crisp, in world space) ---------------- */
  E.hudWorld = function () { E.applyCam(E.hctx, E.hs); return E.hctx; };
  E.hudScreen = function () { E.hctx.setTransform(E.hs, 0, 0, E.hs, 0, 0); return E.hctx; };
  E.text = function (ctx, str, x, y, o = {}) {
    const size = o.size || 7;
    ctx.font = `${o.weight || 400} ${size}px ${o.font || "'Tiny5', monospace"}`;
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = o.base || 'middle';
    ctx.globalAlpha = U.clamp(o.alpha == null ? 1 : o.alpha, 0, 1);
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = (o.blur || 6) * E.hs; }
    if (o.stroke) { ctx.lineWidth = o.strokeW || 2; ctx.strokeStyle = o.stroke; ctx.strokeText(str, x, y); }
    ctx.fillStyle = o.color || '#fff';
    ctx.fillText(str, x, y);
    ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
    ctx.globalAlpha = 1;
  };

  // pixel helpers
  E.rect = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  E.disc = (ctx, x, y, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, U.TAU); ctx.fill(); };
  E.ellipse = (ctx, x, y, rx, ry, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, U.TAU); ctx.fill(); };
})(window.Y);

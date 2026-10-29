'use strict';
window.Y = window.Y || {};

(function (Y) {
  const U = Y.U = {};
  U.TAU = Math.PI * 2;
  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
  U.smooth = t => { t = U.clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  U.easeOut = t => 1 - Math.pow(1 - U.clamp(t, 0, 1), 3);
  U.easeIn = t => Math.pow(U.clamp(t, 0, 1), 3);
  U.easeInOut = t => { t = U.clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  U.dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
  U.approach = (v, target, step) => (v < target ? Math.min(v + step, target) : Math.max(v - step, target));

  // deterministic RNG (mulberry32)
  U.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  U.pick = (arr, rnd = Math.random) => arr[Math.floor(rnd() * arr.length)];
  U.range = (a, b, rnd = Math.random) => a + (b - a) * rnd();

  // value noise
  function hash1(n) {
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n ^= n >>> 15; n = Math.imul(n, 0x85ebca6b); n ^= n >>> 13;
    return (n >>> 0) / 4294967295;
  }
  U.hash = hash1;
  U.noise1 = function (x) {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return U.lerp(hash1(i), hash1(i + 1), u) * 2 - 1;
  };
  U.noise2 = function (x, y) {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const h = (a, b) => hash1(Math.imul(a, 374761393) + Math.imul(b, 668265263));
    const a = U.lerp(h(ix, iy), h(ix + 1, iy), ux);
    const b = U.lerp(h(ix, iy + 1), h(ix + 1, iy + 1), ux);
    return U.lerp(a, b, uy) * 2 - 1;
  };

  U.hsl = (h, s, l, a = 1) => `hsla(${((h % 360) + 360) % 360},${s}%,${l}%,${a})`;
  U.rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  U.mixc = (c1, c2, t) => [U.lerp(c1[0], c2[0], t), U.lerp(c1[1], c2[1], t), U.lerp(c1[2], c2[2], t)];
  U.hslToRgb = function (h, s, l) {
    h = ((h % 360) + 360) % 360 / 360; s /= 100; l /= 100;
    const f = n => {
      const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l);
      return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
    };
    return [f(0), f(8), f(4)];
  };

  U.canvas = function (w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
    return c;
  };

  // localStorage wrapped in try/catch
  U.store = {
    get(key, fallback = null) {
      try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); }
      catch (e) { return fallback; }
    },
    set(key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; }
    },
    del(key) { try { localStorage.removeItem(key); } catch (e) { /* ignore */ } }
  };

  U.wait = ms => new Promise(r => setTimeout(r, ms));
})(window.Y);

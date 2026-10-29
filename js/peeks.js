'use strict';
/*
 * VIII. Вокзал тисячі дверей — що видно, коли зазираєш у двері.
 * Кожна сцена малюється детально в 128×128, а потім стає сірою, пласкою і трохи вицвілою,
 * як чуже фото. 8 кадрів легкої анімації на сцену, рендеряться один раз при першому погляді.
 */
(function (Y) {
  const U = Y.U, TAU = Math.PI * 2, N = 128, FRAMES = 8, STEP = 0.25;

  /* ---------- drawing helpers ---------- */
  const grad = (g, y0, y1, c0, c1, x0 = 0, x1 = N) => {
    const gr = g.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, c0); gr.addColorStop(1, c1);
    g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  };
  const disc = (g, x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
  const poly = (g, pts, c) => { g.fillStyle = c; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); };
  const line = (g, x0, y0, x1, y1, c, w = 1) => { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
  // a figure standing with feet at (x, y); arms: 'down' | 'up' | 'one' (one hand raised)
  function person(g, x, y, h, c, o = {}) {
    const hr = h * 0.11, sh = y - h + hr * 2.3, bw = h * 0.15;
    g.lineCap = 'round';
    disc(g, x, y - h + hr, hr, c);
    if (o.dress) {
      poly(g, [[x - bw, sh], [x + bw, sh], [x + bw * 2.6, y], [x - bw * 2.6, y]], c);
      if (o.outline) {
        g.strokeStyle = o.outline; g.lineWidth = 0.8;
        g.beginPath(); g.moveTo(x - bw, sh); g.lineTo(x - bw * 2.6, y); g.lineTo(x + bw * 2.6, y); g.lineTo(x + bw, sh); g.stroke();
        g.beginPath(); g.arc(x, y - h + hr, hr, 0, TAU); g.stroke();
      }
    } else {
      poly(g, [[x - bw, sh], [x + bw, sh], [x + bw * 0.85, y - h * 0.4], [x - bw * 0.85, y - h * 0.4]], c);
      g.fillStyle = c;
      g.fillRect(x - bw * 0.85, y - h * 0.42, bw * 0.75, h * 0.42);
      g.fillRect(x + bw * 0.1, y - h * 0.42, bw * 0.75, h * 0.42);
    }
    const aw = Math.max(1, bw * 0.6), arms = o.arms || 'down';
    const L = arms === 'up' ? [x - bw * 2.2, sh - h * 0.3] : [x - bw * 1.4, y - h * 0.42];
    const R = arms === 'up' || arms === 'one' ? [x + bw * 2.2, sh - h * 0.3] : [x + bw * 1.4, y - h * 0.42];
    line(g, x - bw, sh + 1, L[0], L[1], c, aw);
    line(g, x + bw, sh + 1, R[0], R[1], c, aw);
    return { hand: R, head: [x, y - h + hr] };
  }

  /* ---------- the scenes ---------- */
  const SCENES = {
    party(g, t, r) {
      grad(g, 0, 96, '#21142f', '#4a2a5e');
      grad(g, 92, N, '#1c1426', '#0e0a14');
      g.strokeStyle = 'rgba(255,255,255,0.07)'; g.lineWidth = 1;
      for (let i = -4; i <= 4; i++) { g.beginPath(); g.moveTo(64 + i * 6, 92); g.lineTo(64 + i * 30, N); g.stroke(); }
      for (const y of [98, 106, 117]) line(g, 0, y, N, y, 'rgba(255,255,255,0.06)');
      // spotlights sweeping
      for (const [x, k] of [[8, 1], [120, -1]]) {
        const tx = 64 + Math.sin(t * 1.4 * k) * 34;
        poly(g, [[x, 0], [tx - 16, 112], [tx + 16, 112]], 'rgba(255,240,220,0.12)');
      }
      // disco ball and its rays
      for (let i = 0; i < 14; i++) {
        const a = i / 14 * TAU + t * 0.6;
        line(g, 64, 22, 64 + Math.cos(a) * 90, 22 + Math.sin(a) * 90, 'rgba(255,255,255,0.10)', 1.2);
      }
      line(g, 64, 0, 64, 12, '#666');
      g.save(); g.beginPath(); g.arc(64, 22, 10, 0, TAU); g.clip();
      for (let y = 10; y < 34; y += 3) for (let x = 52; x < 76; x += 3) { g.fillStyle = ((x + y + Math.floor(t * 4)) % 2) ? '#e8e8f0' : '#8a8a98'; g.fillRect(x, y, 3, 3); }
      g.restore();
      // string of lights
      g.strokeStyle = '#4a4050'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 6); g.quadraticCurveTo(64, 34, N, 6); g.stroke();
      for (let i = 0; i <= 12; i++) {
        const s = i / 12, x = s * N, y = (1 - s) * (1 - s) * 6 + 2 * (1 - s) * s * 34 + s * s * 6;
        disc(g, x, y + 3, 2.2, Math.sin(t * 5 + i * 1.7) > 0 ? '#fff6c0' : '#8a7a60');
      }
      // dancing crowd
      for (let i = 0; i < 10; i++) {
        const x = 6 + i * 13 + r(i) * 4, h = 26 + r(i + 20) * 10;
        const jump = i % 3 === 0 ? Math.abs(Math.sin(t * 6 + i)) * 3 : 0;
        person(g, x, N - 4 - jump, h, '#0b0810', { arms: i % 3 === 0 ? 'up' : i % 4 === 1 ? 'one' : 'down' });
      }
    },

    travel(g, t) {
      g.fillStyle = '#c9c6cc'; g.fillRect(0, 0, N, N);
      for (const x of [10, 118]) line(g, x, 0, x, N, '#b8b4bc');
      g.fillStyle = '#9a98a0'; g.beginPath(); g.roundRect(22, 12, 84, 104, 38); g.fill();
      g.fillStyle = '#e4e2e8'; g.beginPath(); g.roundRect(26, 16, 76, 96, 34); g.fill();
      g.save(); g.beginPath(); g.roundRect(32, 22, 64, 84, 28); g.clip();
      grad(g, 22, 106, '#4f82c6', '#d6e8f8');
      disc(g, 80, 40, 14, 'rgba(255,250,224,0.35)'); disc(g, 80, 40, 8, '#fffbe6');
      for (let row = 0; row < 3; row++) for (let i = -1; i < 7; i++) {
        const x = ((i * 20 + t * (6 + row * 4)) % 140) - 10, y = 84 + row * 9;
        disc(g, x, y, 8 + row * 2, row === 2 ? '#ffffff' : '#eef4fb');
        disc(g, x + 9, y + 2, 6 + row * 2, '#f6f9fd');
      }
      poly(g, [[30, 100], [104, 74], [104, 80], [30, 112]], '#e9ebef');
      line(g, 30, 100, 104, 74, '#a8acb4', 1.5);
      g.fillStyle = '#b9bcc4'; g.beginPath(); g.ellipse(56, 100, 9, 4, -0.33, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.18)'; poly(g, [[40, 22], [56, 22], [36, 106], [32, 106]], 'rgba(255,255,255,0.14)');
      g.restore();
      g.fillStyle = '#d8d6dc'; g.beginPath(); g.roundRect(32, 22, 64, 14, [28, 28, 0, 0]); g.fill();
      line(g, 34, 36, 94, 36, '#b0aeb6');
    },

    career(g, t, r) {
      grad(g, 0, N, '#1d2340', '#7a6684');
      for (let i = 0; i < 18; i++) disc(g, r(i) * N, r(i + 50) * 50, 0.6, 'rgba(255,255,255,0.6)');
      // the city below
      for (let i = 0; i < 12; i++) {
        const w = 10 + r(i + 7) * 8, h = 20 + r(i + 3) * 30, x = i * 11 - 4;
        g.fillStyle = '#151830'; g.fillRect(x, N - h, w, h);
        for (let y = N - h + 4; y < N - 2; y += 5) for (let xx = x + 2; xx < x + w - 2; xx += 4) if (r(xx * 7 + y) > 0.55) { g.fillStyle = '#c8b46a'; g.fillRect(xx, y, 2, 2); }
      }
      // the stairs up
      for (let i = 0; i < 6; i++) {
        const x = 8 + i * 17, h = 14 + i * 13;
        g.fillStyle = '#3c405e'; g.fillRect(x, N - h, 18, h);
        g.fillStyle = '#7a80a8'; g.fillRect(x, N - h, 18, 2);
        g.fillStyle = '#2c3048'; g.fillRect(x + 15, N - h + 2, 3, h - 2);
      }
      // the spotlight and someone at the very top
      const sx = 100 + Math.sin(t * 0.9) * 4;
      poly(g, [[sx - 4, 0], [sx + 4, 0], [sx + 20, 50], [sx - 20, 50]], 'rgba(255,250,230,0.16)');
      const p = person(g, 102, N - 79, 18, '#0e1020', { arms: 'one' });
      line(g, p.hand[0], p.hand[1], p.hand[0], p.hand[1] - 14, '#d0c8b0', 1);
      poly(g, [[p.hand[0], p.hand[1] - 14], [p.hand[0] + 10, p.hand[1] - 11], [p.hand[0], p.hand[1] - 8]], '#e8e0c8');
    },

    victory(g, t, r) {
      grad(g, 0, N, '#1e2436', '#3c4560');
      for (let y = 14; y < 70; y += 5) for (let x = (y % 10) / 2; x < N; x += 5) disc(g, x, y, 1.8, r(x * 3 + y) > 0.5 ? '#2c3348' : '#373e56');
      for (const x of [6, 122]) { g.fillStyle = '#f8f6e8'; g.fillRect(x - 5, 4, 10, 4); poly(g, [[x - 5, 8], [x + 5, 8], [64, 90], [64, 90]], 'rgba(255,255,240,0.07)'); }
      // podium
      const block = (x0, x1, y, n) => {
        g.fillStyle = '#d6d6de'; g.fillRect(x0, y, x1 - x0, N - y);
        g.fillStyle = '#ecebf2'; g.fillRect(x0, y, x1 - x0, 3);
        g.fillStyle = '#9a9aa6'; g.font = 'bold 14px sans-serif'; g.textAlign = 'center'; g.fillText(n, (x0 + x1) / 2, y + 20);
      };
      block(26, 50, 92, '2'); block(78, 102, 100, '3'); block(50, 78, 80, '1');
      person(g, 38, 92, 22, '#262a3c', { arms: 'down' });
      person(g, 90, 100, 21, '#262a3c', { arms: 'down' });
      const w = person(g, 64, 80, 25, '#121520', { arms: 'up' });
      // the trophy overhead
      const tx = 64, ty = w.head[1] - 15;
      g.fillStyle = '#f0d070';
      g.beginPath(); g.moveTo(tx - 6, ty - 6); g.lineTo(tx + 6, ty - 6); g.quadraticCurveTo(tx + 6, ty + 3, tx, ty + 4); g.quadraticCurveTo(tx - 6, ty + 3, tx - 6, ty - 6); g.fill();
      g.fillRect(tx - 1, ty + 3, 2, 4); g.fillRect(tx - 4, ty + 7, 8, 2);
      line(g, w.hand[0], w.hand[1], tx + 4, ty + 6, '#121520', 2);
      // confetti
      for (let i = 0; i < 46; i++) {
        const x = (r(i) * N + Math.sin(t * 2 + i) * 4) % N, y = (r(i + 99) * N + t * 22) % N;
        g.fillStyle = ['#ffffff', '#f0d070', '#e07080', '#70a0e0'][i % 4];
        g.save(); g.translate(x, y); g.rotate(t * 3 + i); g.fillRect(-1.5, -1, 3, 2); g.restore();
      }
    },

    concert(g, t, r) {
      g.fillStyle = '#0b0a12'; g.fillRect(0, 0, N, N);
      // truss and lights
      g.fillStyle = '#34343e'; g.fillRect(0, 8, N, 4);
      for (let x = 0; x < N; x += 8) line(g, x, 8, x + 8, 12, '#4a4a56');
      for (let i = 0; i < 6; i++) {
        const lx = 12 + i * 21, a = Math.sin(t * 1.3 + i) * 0.5;
        const ex = lx + Math.sin(a) * 120, ey = 12 + Math.cos(a) * 110;
        poly(g, [[lx - 2, 12], [lx + 2, 12], [ex + 14, ey], [ex - 14, ey]], 'rgba(230,230,255,0.10)');
        disc(g, lx, 13, 3, '#f8f8ff');
      }
      // stage
      g.fillStyle = '#2a2632'; g.fillRect(0, 74, N, 18);
      g.fillStyle = '#4a4458'; g.fillRect(0, 74, N, 2);
      // the performer with a guitar
      const p = person(g, 64, 76, 28, '#050508', { arms: 'down' });
      g.fillStyle = '#050508'; g.beginPath(); g.ellipse(60, 62, 6, 4.5, -0.4, 0, TAU); g.fill();
      line(g, 62, 61, 78, 50, '#050508', 2);
      line(g, 48, 76, 48, 52, '#3a3a44', 1); disc(g, 48, 51, 1.6, '#5a5a66');
      disc(g, p.head[0], p.head[1], 7, 'rgba(255,255,255,0.08)');
      // the crowd
      g.fillStyle = '#040306'; g.fillRect(0, 100, N, 28);
      for (let x = 2; x < N; x += 7) disc(g, x + r(x) * 3, 100 + r(x + 5) * 3, 4, '#040306');
      for (let i = 0; i < 9; i++) {
        const x = 6 + i * 14 + r(i + 11) * 6, up = Math.abs(Math.sin(t * 4 + i)) * 4;
        line(g, x, 100, x + 2, 86 - up, '#040306', 2.2); disc(g, x + 2, 85 - up, 2, '#040306');
        if (i % 3 === 1) { g.fillStyle = '#d8e0ff'; g.fillRect(x + 1, 82 - up, 3, 4); }
      }
    },

    sea(g, t) {
      grad(g, 0, 70, '#5f88c4', '#f8d0a0');
      g.save(); g.beginPath(); g.rect(0, 0, N, 70); g.clip();
      disc(g, 64, 66, 18, 'rgba(255,240,200,0.35)'); disc(g, 64, 66, 11, '#fff2c8');
      g.restore();
      grad(g, 70, 104, '#2e5d8a', '#1c3c60');
      for (let i = 0; i < 12; i++) {
        const y = 72 + i * 2.6, w = 18 - i * 0.8 + Math.sin(t * 3 + i) * 3;
        g.fillStyle = 'rgba(255,240,200,0.7)'; g.fillRect(64 - w / 2 + Math.sin(t * 2 + i) * 2, y, w, 1);
      }
      for (let i = 0; i < 9; i++) {
        const y = 76 + i * 3.4, off = (t * 10 + i * 17) % 30;
        for (let x = -30 + off; x < N; x += 30) line(g, x, y, x + 10, y, 'rgba(170,205,235,0.45)');
      }
      grad(g, 104, N, '#e8d2a0', '#d6bc84');
      g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 1.5; g.beginPath();
      for (let x = 0; x <= N; x += 4) g.lineTo(x, 104 + Math.sin(x * 0.1 + t * 2) * 1.5);
      g.stroke();
      // a palm
      g.strokeStyle = '#5a4030'; g.lineWidth = 4; g.beginPath(); g.moveTo(112, N); g.quadraticCurveTo(116, 90, 98, 56); g.stroke();
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI * 0.9 + i * 0.32 + Math.sin(t * 1.5 + i) * 0.05;
        g.strokeStyle = '#24402a'; g.lineWidth = 3; g.beginPath(); g.moveTo(98, 56);
        g.quadraticCurveTo(98 + Math.cos(a) * 14, 56 + Math.sin(a) * 14 - 6, 98 + Math.cos(a) * 26, 56 + Math.sin(a) * 26 + 6); g.stroke();
      }
      for (const [x, y] of [[26, 28], [38, 22], [48, 32]]) { const f = Math.sin(t * 4 + x) * 2; line(g, x - 4, y - f, x, y, '#3a3a40', 1.2); line(g, x, y, x + 4, y - f, '#3a3a40', 1.2); }
    },

    wedding(g, t, r) {
      grad(g, 0, N, '#d8e8d0', '#8fb08a');
      for (let i = 0; i < 8; i++) disc(g, i * 18 + r(i) * 6, 70 + r(i + 4) * 6, 16, '#7a9a72');
      // garland
      g.strokeStyle = '#6a6a60'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 8); g.quadraticCurveTo(64, 26, N, 8); g.stroke();
      for (let i = 0; i <= 10; i++) { const s = i / 10, y = (1 - s) * (1 - s) * 8 + 2 * (1 - s) * s * 26 + s * s * 8; disc(g, s * N, y + 3, 2.4, Math.sin(t * 3 + i) > -0.3 ? '#fff8d8' : '#c8c0a0'); }
      // aisle and chairs
      poly(g, [[56, 104], [72, 104], [92, N], [36, N]], '#f2ece0');
      for (let row = 0; row < 2; row++) for (let i = 0; i < 4; i++) {
        for (const side of [-1, 1]) {
          const x = 64 + side * (24 + i * 9 + row * 3), y = 110 + row * 9;
          g.fillStyle = '#f4efe6'; g.fillRect(x - 3, y, 6, 4); g.fillRect(x - 3, y - 4, 1.5, 4); g.fillRect(x + 1.5, y - 4, 1.5, 4);
        }
      }
      // the flower arch
      g.strokeStyle = '#f8f4ec'; g.lineWidth = 5; g.beginPath(); g.arc(64, 104, 30, Math.PI, 0); g.stroke();
      for (let i = 0; i <= 20; i++) { const a = Math.PI + i / 20 * Math.PI; disc(g, 64 + Math.cos(a) * 30, 104 + Math.sin(a) * 30, 2.6, i % 3 ? '#f0b0c0' : '#ffffff'); }
      line(g, 34, 104, 34, 106, '#f8f4ec', 5); line(g, 94, 104, 94, 106, '#f8f4ec', 5);
      // the couple
      person(g, 57, 104, 30, '#fbf9f4', { dress: true, arms: 'down', outline: '#8e8a82' });
      person(g, 72, 104, 32, '#25252c', { arms: 'down' });
      line(g, 61, 92, 68, 92, '#c8b8a8', 1.5);
      for (let i = 0; i < 16; i++) { const x = (r(i) * N + Math.sin(t + i) * 6) % N, y = (r(i + 40) * N + t * 12) % N; disc(g, x, y, 1.2, '#f6c8d4'); }
    },

    city(g, t, r) {
      grad(g, 0, 96, '#090d22', '#2c2c4c');
      for (let i = 0; i < 30; i++) disc(g, r(i) * N, r(i + 30) * 50, 0.6, 'rgba(255,255,255,0.7)');
      disc(g, 102, 22, 9, '#f4f0d8'); disc(g, 99, 20, 1.6, '#d8d2b8'); disc(g, 105, 25, 1.2, '#d8d2b8');
      for (let i = 0; i < 15; i++) {
        const w = 8 + r(i + 1) * 7, h = 30 + r(i + 2) * 50, x = i * 9 - 2;
        g.fillStyle = i % 2 ? '#141830' : '#1b2038'; g.fillRect(x, 96 - h, w, h);
        for (let y = 96 - h + 3; y < 94; y += 4) for (let xx = x + 1.5; xx < x + w - 2; xx += 3) {
          const on = r(xx * 13 + y * 7) > 0.5 !== (r(xx + y + Math.floor(t * 2)) > 0.93);
          if (on) { g.fillStyle = '#f2d47c'; g.fillRect(xx, y, 1.6, 1.8); }
        }
      }
      // bridge
      g.fillStyle = '#0b0d18'; g.fillRect(0, 92, N, 3);
      for (const px of [30, 98]) { g.fillRect(px - 1, 70, 3, 22); g.strokeStyle = '#2a2e48'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(px - 30, 92); g.quadraticCurveTo(px, 60, px + 30, 92); g.stroke(); }
      for (let x = 2; x < N; x += 8) disc(g, x, 91, 0.9, '#ffe2a0');
      // reflections
      grad(g, 95, N, '#0b0e1e', '#05060e');
      for (let i = 0; i < 40; i++) { const x = r(i * 3) * N, y = 98 + r(i * 5) * 28; g.fillStyle = `rgba(242,212,124,${0.25 + 0.2 * Math.sin(t * 3 + i)})`; g.fillRect(x + Math.sin(t * 2 + i) * 1.5, y, 1.5, 3); }
    },

    peak(g, t) {
      grad(g, 0, N, '#8db6e6', '#eef5fc');
      disc(g, 26, 24, 14, 'rgba(255,255,240,0.4)'); disc(g, 26, 24, 8, '#fffef4');
      poly(g, [[0, 86], [20, 60], [40, 74], [62, 50], [88, 70], [110, 54], [N, 66], [N, N], [0, N]], '#b8c8dc');
      poly(g, [[0, 100], [26, 74], [48, 90], [70, 66], [N, 96], [N, N], [0, N]], '#8094ae');
      // the main peak
      poly(g, [[22, N], [78, 30], [N, 108], [N, N]], '#4c5a70');
      poly(g, [[78, 30], [N, 108], [N, N], [96, N]], '#3a4658');
      poly(g, [[64, 46], [78, 30], [92, 50], [84, 46], [78, 52], [70, 46]], '#f4f6fa');
      for (let i = 0; i < 6; i++) { const x = ((i * 26 + t * 6) % 160) - 20; disc(g, x, 82, 7, 'rgba(255,255,255,0.8)'); disc(g, x + 8, 84, 6, 'rgba(255,255,255,0.75)'); }
      // someone at the top with a flag
      person(g, 78, 30, 10, '#16181e', { arms: 'one' });
      line(g, 81, 25, 81, 12, '#202020', 1);
      poly(g, [[81, 12], [91, 15 + Math.sin(t * 5)], [81, 18]], '#d04848');
      g.fillStyle = '#2a3040'; g.fillRect(0, 120, N, 8);
    },

    photo(g, t) {
      grad(g, 0, 80, '#7a5a9a', '#f2b07a');
      disc(g, 64, 80, 16, '#ffe0a8');
      grad(g, 80, N, '#3a4a6a', '#1e2a40');
      // someone posing
      const p = person(g, 64, 112, 50, '#14101c', { arms: 'one' });
      line(g, p.hand[0], p.hand[1], p.hand[0] - 1, p.hand[1] - 6, '#14101c', 1.6);
      line(g, p.hand[0], p.hand[1], p.hand[0] + 3, p.hand[1] - 6, '#14101c', 1.6);
      g.fillStyle = '#14101c'; g.beginPath(); g.ellipse(p.head[0], p.head[1] - 1, 8, 7, 0, 0, TAU); g.fill();
      // the viewfinder
      g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 2;
      for (const [x, y, dx, dy] of [[10, 10, 1, 1], [118, 10, -1, 1], [10, 118, 1, -1], [118, 118, -1, -1]]) {
        g.beginPath(); g.moveTo(x, y + dy * 12); g.lineTo(x, y); g.lineTo(x + dx * 12, y); g.stroke();
      }
      g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,0.25)';
      for (const k of [1, 2]) { line(g, k * N / 3, 10, k * N / 3, 118, 'rgba(255,255,255,0.18)'); line(g, 10, k * N / 3, 118, k * N / 3, 'rgba(255,255,255,0.18)'); }
      g.strokeStyle = 'rgba(255,255,255,0.8)'; g.strokeRect(52, 38, 24, 24);
      if (Math.floor(t * 2) % 2 === 0) disc(g, 20, 20, 3, '#e04040');
      g.fillStyle = '#ffffff'; g.font = 'bold 8px sans-serif'; g.textAlign = 'left'; g.fillText('REC', 26, 23);
      g.strokeStyle = '#ffffff'; g.strokeRect(96, 16, 14, 7); g.fillRect(110, 18, 2, 3); g.fillRect(98, 18, 8, 3);
      if (t % 2 < 0.3) { g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(0, 0, N, N); }
    },

    start(g, t, r) {
      g.fillStyle = '#e8ecf2'; g.fillRect(0, 0, N, N);
      for (let x = 8; x < N; x += 10) line(g, x, 0, x, N, '#d4dae4');
      for (let y = 8; y < N; y += 10) line(g, 0, y, N, y, '#d4dae4');
      line(g, 12, 116, 120, 116, '#5a6478', 1.5); line(g, 12, 116, 12, 14, '#5a6478', 1.5);
      for (let i = 0; i < 9; i++) { const h = 10 + i * 9 + r(i) * 6; g.fillStyle = '#c2cede'; g.fillRect(18 + i * 11, 116 - h, 7, h); }
      const pts = [];
      for (let i = 0; i <= 12; i++) pts.push([14 + i * 8.5, 108 - Math.pow(i / 12, 1.8) * 80 + Math.sin(i * 1.7) * 5]);
      g.fillStyle = 'rgba(80,120,180,0.25)'; g.beginPath(); g.moveTo(14, 116); pts.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(pts[pts.length - 1][0], 116); g.fill();
      g.strokeStyle = '#2a4a7a'; g.lineWidth = 2; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
      const [ex, ey] = pts[pts.length - 1];
      poly(g, [[ex - 5, ey + 2], [ex + 4, ey - 8], [ex + 5, ey + 4]], '#2a4a7a');
      g.fillStyle = '#2a4a7a'; g.font = 'bold 11px sans-serif'; g.textAlign = 'left'; g.fillText('+300%', 20, 26);
      // a rocket going up
      for (let i = 0; i < 7; i++) disc(g, 92 - i * 5 + Math.sin(t * 3 + i), 40 + i * 5, 3 + i * 0.7, `rgba(255,255,255,${0.9 - i * 0.1})`);
      g.save(); g.translate(104, 26); g.rotate(Math.PI / 4);
      g.fillStyle = '#f4f4f8'; g.beginPath(); g.ellipse(0, 0, 4, 10, 0, 0, TAU); g.fill();
      g.strokeStyle = '#5a6478'; g.lineWidth = 0.8; g.stroke();
      disc(g, 0, -3, 1.6, '#5a8ac0');
      poly(g, [[-4, 5], [-7, 10], [-3, 8]], '#d05050'); poly(g, [[4, 5], [7, 10], [3, 8]], '#d05050');
      poly(g, [[-2, 10], [2, 10], [0, 15 + Math.sin(t * 20) * 2]], '#ffb040');
      g.restore();
    }
  };

  /* ---------- grey, flat, a little faded ---------- */
  function fade(c, seed) {
    const g = c.getContext('2d'), img = g.getImageData(0, 0, N, N), d = img.data, r = U.rng(seed);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = (y * N + x) * 4;
      let l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      l = 26 + l * 0.8;                                         // lifted blacks, softer whites
      const dx = (x - N / 2) / (N / 2), dy = (y - N / 2) / (N / 2);
      l *= 1 - 0.26 * (dx * dx + dy * dy) / 2;                    // vignette
      l += (r() - 0.5) * 10;                                      // film grain
      d[i] = d[i + 1] = d[i + 2] = U.clamp(l, 0, 255);
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  const cache = {};
  function render(id, t) {
    const c = U.canvas(N, N), g = c.getContext('2d');
    const rr = U.rng(id.length * 977 + 13);
    const rnd = []; for (let i = 0; i < 400; i++) rnd.push(rr());
    const r = i => rnd[Math.abs(Math.floor(i)) % rnd.length];
    g.save();
    (SCENES[id] || SCENES.start)(g, t, r);
    g.restore();
    return fade(c, Math.floor(t * 100) + id.length);
  }

  Y.Peeks = {
    size: N,
    ids: Object.keys(SCENES),
    // the current frame of a door's picture (rendered once, then looped)
    frame(id, t) {
      if (!cache[id]) { cache[id] = []; for (let k = 0; k < FRAMES; k++) cache[id].push(render(id, k * STEP)); }
      return cache[id][Math.floor(t / STEP) % FRAMES];
    },
    render
  };
})(window.Y);

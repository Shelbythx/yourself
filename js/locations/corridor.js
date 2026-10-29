'use strict';
/*
 * I. Коридор думок. Тривожні фрази-голограми виринають із темряви.
 * Зупинка або дотик множать їх, вони чіпляються й ідуть слідом, коридор звужується й видовжується.
 * Утримуючи E (ігнорувати), фрази розсипаються на теплий пил, що світить під ногами.
 * Двері в кінці відчиняються лише тоді, коли розвіяно всі думки.
 */
(function (Y) {
  const U = Y.U, E = Y.E, A = Y.Audio, I = Y.Input, UI = Y.UI, TX = Y.TEXT;
  const LEN = 132, BASE_EXIT = 74, TOP = 32, BOT = 80;
  const MAX_THOUGHTS = 22;   // жорстка межа — більше думок на екрані не буває
  const MAX_MOTES = 300;

  class Corridor extends Y.Loc {
    constructor(G) {
      super(G);
      const rows = [];
      for (let y = 0; y < 7; y++) rows.push((y >= 2 && y <= 4 ? '#' + '.'.repeat(LEN - 2) + '#' : '#'.repeat(LEN)));
      this.map = new E.TileMap(rows);
      this.entry = { x: 40, y: 3 * 16 + 10, dir: 'right' };
      this.darkness = 0.96; this.darkRGB = '2,3,8';
      this.vignette = 0.6;
      this.playerLight = { r: 48, a: 0.95, rgb: '255,222,180', ca: 0.1 };
      this.stepOpts = { vol: 0.045, tone: 800, echo: 0.3 };
      this.anx = 0; this.anxShow = 0; this.ign = 0;
      this.exitX = BASE_EXIT * 16;
      this.thoughts = [];
      this.motes = [];
      this.spawnAcc = 0; this.swarmAcc = 0; this.whisperAcc = 0; this.dissolveCd = 0; this.nearAcc = 0;
      this.lastX = this.entry.x;
      // every phrase has to be let go once; the ones you outrun come back later
      this.total = TX.thoughts.length;
      this.remaining = new Set(TX.thoughts.map((_, i) => i));
      this.open = 0; this.closedHint = false;
      this.floor = this.buildFloor();
      this.done = false;
      for (let i = 0; i < 4; i++) this.spawn(this.entry.x + 70 + i * 45, null);
    }
    enter() {
      A.scene({ missilost: 0.85, suspence: 0 }, 3);
      setTimeout(() => { if (this.G.loc === this && !this.done) UI.hint(I.touch ? TX.corridor.hintTouch : TX.corridor.hint); }, 2500);
    }
    actLabel() { return TX.corridor.ignore; }
    get isOpen() { return this.remaining.size === 0; }
    rects() {
      return this.isOpen ? [] : [{ x: this.exitX, y: 0, w: 400, h: 112 }];
    }

    buildFloor() {
      const r = U.rng(5);
      return E.prerender(this.map.pw, this.map.ph, g => {
        g.fillStyle = '#05050a'; g.fillRect(0, 0, this.map.pw, this.map.ph);
        // top wall face
        g.fillStyle = '#0d0d16'; g.fillRect(0, 16, this.map.pw, 16);
        for (let x = 0; x < this.map.pw; x += 32) { g.fillStyle = '#08080f'; g.fillRect(x, 16, 1, 16); g.fillStyle = '#14141f'; g.fillRect(x + 1, 16, 1, 16); }
        g.fillStyle = '#1a1a28'; g.fillRect(0, 16, this.map.pw, 1);
        // floor
        for (let ty = 2; ty <= 4; ty++) for (let tx = 0; tx < LEN; tx++) {
          const x = tx * 16, y = ty * 16;
          g.fillStyle = (tx + ty) & 1 ? '#0f0f18' : '#11111b'; g.fillRect(x, y, 16, 16);
          g.fillStyle = '#09090f'; g.fillRect(x, y + 15, 16, 1); g.fillRect(x + 15, y, 1, 16);
          if (r() < 0.2) { g.fillStyle = 'rgba(120,200,255,0.05)'; g.fillRect(x + Math.floor(r() * 14), y + Math.floor(r() * 14), 2, 1); }
        }
        // bottom wall edge
        g.fillStyle = '#16162a'; g.fillRect(0, BOT, this.map.pw, 1);
      });
    }

    live() { let n = 0; for (const t of this.thoughts) if (t.state !== 'dust') n++; return n; }
    // a phrase that is still unresolved and not on screen right now
    pickIdx() {
      const shown = new Set();
      for (const t of this.thoughts) if (t.state !== 'dust') shown.add(t.idx);
      const free = [...this.remaining].filter(i => !shown.has(i));
      return free.length ? U.pick(free) : -1;
    }
    spawn(x, y, state = 'emerge', near = null) {
      if (this.live() >= MAX_THOUGHTS) return null;
      const idx = this.pickIdx();
      if (idx < 0) return null;
      const th = {
        idx, text: Y.T.g(TX.thoughts[idx]), x, y: y == null ? U.range(18, 96) : y, a: 0, t: 0, ph: Math.random() * 10,
        state, orbitA: Math.random() * U.TAU, orbitR: U.range(22, 46), touchCd: 1, glitch: 0,
        hue: Math.random() < 0.6 ? '140,230,255' : '200,170,255'
      };
      if (near) { th.x = near.x + U.range(-30, 30); th.y = near.y + U.range(-26, 18); }
      if (!this.isOpen) th.x = Math.min(th.x, this.exitX - 10);
      this.thoughts.push(th);
      return th;
    }
    dissolve(th) {
      th.state = 'dust'; th.t = 0;
      this.remaining.delete(th.idx);
      A.sfx.note(U.pick([392, 440, 523, 587, 659]), { vol: 0.025, dur: 1.2, echo: 0.2 });
      for (let i = 0; i < 10; i++) {
        const fy = U.range(TOP + 4, BOT - 2);
        this.particles.add({
          x: th.x + U.range(-20, 20), y: th.y + U.range(-3, 3), vx: U.range(-6, 6), vy: U.range(-4, 4),
          life: 1.6 + Math.random(), size: 1, color: '#ffd59a', drag: 0.96, light: 5, rgb: '255,200,130', la: 0.5,
          update: (p, dt) => { p.vy += (fy - p.y) * 1.2 * dt; },
          onDie: p => {
            if (this.motes.length >= MAX_MOTES) this.motes.shift();
            this.motes.push({ x: p.x, y: U.clamp(p.y, TOP + 2, BOT - 2), a: 0.9, ph: Math.random() * 6 });
          }
        });
      }
      if (this.isOpen) {
        A.sfx.chime(523, 0.09);
        A.sfx.musicBox([523, 659, 784, 1046], 0.35, 0.05);
        UI.hintOff();
      }
    }

    update(dt) {
      super.update(dt);
      const p = this.P, G = this.G;
      const playing = !G.locked && !Y.Dialog.active;
      const ignoring = playing && !!I.down.act;
      this.ign = U.damp(this.ign, ignoring ? 1 : 0, 6, dt);
      const fwd = p.vx > 22 && Math.abs(p.vy) < p.vx * 1.2;

      // anxiety: grows when you stop, turn back or let thoughts cling; melts while you ignore them
      if (playing) {
        if (ignoring) this.anx -= dt * (fwd ? 0.24 : 0.08);
        else if (p.still > 0.45 && !this.isOpen) this.anx += dt * 0.3;
        else if (p.vx < -18) this.anx += dt * 0.15;
        else this.anx -= dt * 0.015;
      }
      if (this.isOpen) this.anx -= dt * 0.3;
      this.anx = U.clamp(this.anx, 0, 1);
      this.anxShow = U.damp(this.anxShow, this.anx, 2.5, dt);
      const ax = this.anxShow;

      // corridor narrows: soft clamp
      const top = TOP + 6 + ax * 9, bot = BOT - 1 - ax * 9;
      if (p.y < top + 4) p.y = U.damp(p.y, top + 4, 6, dt);
      if (p.y > bot) p.y = U.damp(p.y, bot, 6, dt);
      // and lengthens (the closed door never moves into you)
      this.exitX = U.damp(this.exitX, (BASE_EXIT + ax * 46) * 16, 1.2, dt);
      if (!this.isOpen) this.exitX = Math.max(this.exitX, p.x + p.hw);
      this.open = U.damp(this.open, this.isOpen ? 1 : 0, 2, dt);

      // new thoughts surface ahead while you walk
      const dx = p.x - this.lastX; this.lastX = p.x;
      if (dx > 0) this.spawnAcc += dx;
      let ahead = 0;
      for (const t of this.thoughts) if (t.x > p.x && t.state !== 'dust') ahead++;
      if (this.spawnAcc > 34 && ahead < 8) {
        this.spawnAcc = 0;
        this.spawn(Math.min(p.x + U.range(90, 160), this.exitX - 14), null);
      }
      // near the door the unresolved ones surface around you
      if (!this.isOpen && p.x > this.exitX - 200) {
        this.nearAcc += dt;
        if (this.nearAcc > 0.9) { this.nearAcc = 0; this.spawn(0, 0, 'emerge', { x: p.x - 10, y: p.y - 8 }); }
      }
      // stopping breeds thoughts around you
      if (playing && !ignoring && (p.still > 0.45 || ax > 0.5)) {
        this.swarmAcc += dt * (0.8 + ax * 2.5);
        if (this.swarmAcc > 1) { this.swarmAcc = 0; this.spawn(0, 0, 'swarm', { x: p.x, y: p.y - 8 }); }
      }

      // holding E: walking on lets them go quickly, standing still — one by one
      this.dissolveCd -= dt;
      if (ignoring && this.dissolveCd <= 0) {
        let target = null;
        if (fwd) {
          for (const th of this.thoughts) if (th.state !== 'dust' && th.a > 0.2 && th.x < p.x + 26) { target = th; break; }
          if (target) this.dissolveCd = 0.12;
        } else if (p.vx > -18) {
          let bd = 70;
          for (const th of this.thoughts) {
            if (th.state === 'dust' || th.a < 0.2) continue;
            const d = U.dist(th.x, th.y, p.x, p.y - 8);
            if (d < bd) { bd = d; target = th; }
          }
          if (target) this.dissolveCd = 0.5;
        }
        if (target) this.dissolve(target);
      }

      for (const th of this.thoughts) {
        th.t += dt; th.touchCd -= dt; th.glitch = Math.max(0, th.glitch - dt);
        if (th.state === 'dust') { th.a = Math.max(0, th.a - dt * 1.8); continue; }
        if (th.state === 'emerge') { th.a = Math.min(1, th.a + dt * 1.2); if (th.a >= 1) th.state = 'float'; }
        const d = U.dist(th.x, th.y, p.x, p.y - 8);
        if (th.state === 'float' || th.state === 'emerge') {
          th.y += Math.sin(th.t * 1.3 + th.ph) * 3 * dt;
          if (!ignoring && ax > 0.4 && d < 90) th.state = 'swarm';
        } else if (th.state === 'swarm') {
          th.a = Math.min(1, th.a + dt * 2);
          th.orbitA += dt * (0.7 + ax * 1.3);
          // while ignoring, they lose their grip and drift a little further
          const r = th.orbitR * (1.1 - ax * 0.3) + this.ign * 18;
          const tx = p.x + Math.cos(th.orbitA) * r * 1.4, ty = p.y - 10 + Math.sin(th.orbitA) * r * 0.7;
          const k = ignoring ? 0.8 : 2.2;
          th.x = U.damp(th.x, tx, k, dt); th.y = U.damp(th.y, ty, k, dt);
          if (ax < 0.12 && !ignoring) { th.state = 'float'; th.x -= U.range(14, 30); }
        }
        if (!this.isOpen) th.x = Math.min(th.x, this.exitX - 6);
        // without ignoring, thoughts you brush against cling and multiply
        if (playing && !ignoring && th.touchCd <= 0 && d < 10) {
          th.touchCd = 2.2; th.state = 'swarm'; th.glitch = 0.4;
          this.anx = Math.min(1, this.anx + 0.08);
          this.spawn(0, 0, 'swarm', th);
          A.sfx.whisper(0, 0.05);
          E.shake(0.2, 1);
        }
      }
      // faded dust goes away; thoughts left far behind sink back and will surface again later
      this.thoughts = this.thoughts.filter(t => !(t.state === 'dust' && t.a <= 0) && t.x > p.x - 300);
      if (this.thoughts.length > MAX_THOUGHTS + 12) this.thoughts.splice(0, this.thoughts.length - MAX_THOUGHTS - 12);

      // whispers
      const live = this.live();
      this.whisperAcc += dt * (0.25 + ax * 2.5) * (1 - this.ign * 0.8) * (live ? 1 : 0);
      if (this.whisperAcc > 1) {
        this.whisperAcc = 0;
        const th = U.pick(this.thoughts);
        if (th) A.sfx.whisper(U.clamp((th.x - p.x) / 120, -1, 1), 0.025 + ax * 0.05);
      }
      // one track at a time: tense music while thoughts swarm, the calm one otherwise
      if (!this.isOpen && ax > 0.55 && !ignoring) A.music('suspence', 0.75, 1, 0.8);
      else if (ax < 0.3 || this.isOpen) A.music('missilost', 0.85 - ax * 0.4, 1.5, 0.8);
      this.playerLight.r = 48 + this.ign * 14;

      // motes fade very slowly
      for (const m of this.motes) m.a = Math.max(0.25, m.a - dt * 0.004);

      // the closed door
      if (!this.isOpen && !this.closedHint && p.x > this.exitX - 24) {
        this.closedHint = true;
        UI.hint(I.touch ? TX.corridor.closedTouch : TX.corridor.closed);
      }
      if (!this.done && this.isOpen && p.x > this.exitX - 6) { this.done = true; UI.hintOff(); G.goto('room', { out: 1.6 }); }
    }

    camTarget() { return { x: this.P.x + 40, y: this.P.y - 10 }; }

    drawFloor(ctx) {
      E.blitWorld(ctx, this.floor);
      for (const m of this.motes) {
        if (!E.inView(m.x, m.y, 8)) continue;
        ctx.globalAlpha = m.a * (0.75 + 0.25 * Math.sin(this.t * 2 + m.ph));
        ctx.fillStyle = '#ffcf8a'; ctx.fillRect(Math.round(m.x), Math.round(m.y), 1, 1);
      }
      ctx.globalAlpha = 1;
      // the door: cold and shut until every thought is let go, then warm and open
      const ex = Math.round(this.exitX), o = this.open;
      const fl = 0.85 + 0.15 * Math.sin(this.t * 2);
      ctx.fillStyle = '#05050a'; ctx.fillRect(ex + 6, 0, this.map.pw, this.map.ph);
      ctx.fillStyle = U.rgb(U.mixc([28, 30, 48], [255, 214, 150], o), 0.4 + 0.45 * o * fl);
      ctx.fillRect(ex, TOP - 14, 6, BOT - TOP + 14);
      ctx.fillStyle = U.rgb(U.mixc([60, 70, 100], [255, 240, 210], o), 0.5 + 0.5 * o * fl);
      ctx.fillRect(ex + 1, TOP - 12, 3, BOT - TOP + 10);
      // a bar across the door while it is shut
      if (o < 0.95) {
        ctx.globalAlpha = 1 - o;
        ctx.fillStyle = '#3a4060';
        for (let y = TOP - 10; y < BOT; y += 9) ctx.fillRect(ex - 1, y, 8, 2);
        ctx.globalAlpha = 1;
      }
    }

    drawTop(ctx) {
      // narrowing walls
      const ax = this.anxShow;
      if (ax < 0.02) return;
      const x0 = Math.floor(E.cam.x - E.W / 2 - 4), x1 = x0 + E.W + 8;
      for (let x = x0; x < x1; x += 2) {
        const w = U.noise1(x * 0.05 + this.t * 0.8) * 3;
        const h = ax * 11 + w * ax;
        ctx.fillStyle = '#04040a';
        ctx.fillRect(x, TOP - 2, 2, Math.max(0, h + 2));
        ctx.fillRect(x, BOT - h, 2, Math.max(0, h + 1));
      }
    }

    lights() {
      for (const m of this.motes) if (E.inView(m.x, m.y, 12)) E.addLight(m.x, m.y, 9, 0.35 * m.a, '255,190,120', 0.3);
      for (const th of this.thoughts) if (th.a > 0.05 && th.state !== 'dust' && E.inView(th.x, th.y, 30)) E.addLight(th.x, th.y, 22, 0.28 * th.a * (1 - this.ign * 0.5), th.hue, 0.45);
      const o = this.open;
      E.addLight(this.exitX + 3, (TOP + BOT) / 2, 40 + 60 * o, 0.4 + 0.5 * o, o > 0.5 ? '255,214,150' : '120,140,200', 0.35);
      if (this.ign > 0.05) E.addLight(this.P.x, this.P.y - 10, 30, 0.5 * this.ign, '255,200,140', 0.4);
    }

    drawPost(ctx) {
      E.tint(ctx, '#3a5a90', this.anxShow * 0.25, 'multiply');
    }

    drawHud(h) {
      const fade = 1 - this.ign * 0.45;
      for (const th of this.thoughts) {
        if (th.a <= 0.02 || !E.inView(th.x, th.y, 80)) continue;
        if (th.state === 'dust') {
          E.text(h, th.text, th.x, th.y + (1 - th.a) * 4, { size: 6.5, color: '#ffd9a0', alpha: th.a * 0.8 });
          continue;
        }
        const flick = 0.85 + 0.15 * Math.sin(th.t * 23 + th.ph);
        const jx = th.glitch > 0 ? U.range(-2, 2) : 0;
        const size = 6.5 + (th.state === 'swarm' ? this.anxShow * 1.2 : 0);
        const a = th.a * flick * fade;
        const cool = th.hue === '140,230,255';
        E.text(h, th.text, th.x + jx + 0.6, th.y, { size, color: cool ? 'rgba(255,90,140,0.5)' : 'rgba(90,200,255,0.5)', alpha: a * 0.6 });
        E.text(h, th.text, th.x + jx, th.y, { size, color: cool ? '#a6f1ff' : '#d8c4ff', alpha: a });
      }
      // how many thoughts are still with you
      const left = this.remaining.size;
      if (left > 0 || this.open < 0.99) {
        E.hudScreen();
        const a = left > 0 ? 0.75 : 1 - this.open;
        E.text(h, left > 0 ? TX.corridor.left + left : TX.corridor.free, E.W / 2, 10, { size: 6, color: left > 0 ? '#b8c6e6' : '#ffe2b0', alpha: a });
        E.hudWorld();
      }
    }
  }
  Y.LOC.corridor = Corridor;
})(window.Y);

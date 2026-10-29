'use strict';
/* Гравець і базовий клас локації. */
(function (Y) {
  const U = Y.U, E = Y.E;
  Y.LOC = {};

  class Player {
    constructor() { this.reset(); }
    reset() {
      Object.assign(this, {
        x: 0, y: 0, dir: 'up', moving: false, anim: 0, speed: 58, visible: true, alpha: 1,
        sit: false, hw: 4, hh: 4, vx: 0, vy: 0, stepT: 0, tint: null, inputting: false, still: 0
      });
    }
    update(dt, G, loc) {
      const I = Y.Input;
      let ax = I.axis.x, ay = I.axis.y;
      if (G.locked || Y.Dialog.active || this.sit || (loc.blockMove && loc.blockMove())) { ax = 0; ay = 0; }
      const spd = this.speed * (loc.speedMul ? loc.speedMul() : 1);
      const px = this.x, py = this.y;
      if (ax || ay) {
        E.move(this, ax * spd * dt, ay * spd * dt, loc);
        if (Math.abs(ax) > Math.abs(ay) + 0.05) this.dir = ax > 0 ? 'right' : 'left';
        else this.dir = ay > 0 ? 'down' : 'up';
      }
      this.vx = (this.x - px) / dt; this.vy = (this.y - py) / dt;
      const sp = Math.hypot(this.vx, this.vy);
      this.moving = sp > 4;
      this.inputting = !!(ax || ay);
      this.still = this.moving ? 0 : this.still + dt;
      if (this.moving) {
        const k = sp / 58;
        this.anim += dt * k;
        this.stepT -= dt * k;
        if (this.stepT <= 0) { this.stepT = 0.3; if (loc.onStep) loc.onStep(); else Y.Audio.sfx.step(loc.stepOpts); }
      } else { this.anim = 0; this.stepT = 0.1; }
    }
    draw(ctx) {
      if (!this.visible || this.alpha <= 0) return;
      ctx.globalAlpha = 0.35 * this.alpha;
      E.ellipse(ctx, this.x, this.y - 1, 5, 2, '#000');
      ctx.globalAlpha = 1;
      Y.S.drawPlayer(ctx, this);
    }
  }
  Y.Player = Player;

  class Loc {
    constructor(G) {
      this.G = G; this.t = 0;
      this.darkness = 0.92; this.darkRGB = '3,3,10';
      this.vignette = 0.55;
      this.particles = new E.Particles();
      this.playerLight = { r: 62, a: 0.97, rgb: '255,226,180', ca: 0.12 };
      this.stepOpts = { vol: 0.05, tone: 900 };
      this.solidChars = '#';
    }
    get P() { return this.G.player; }
    solid(tx, ty) {
      const c = this.map.ch(tx, ty);
      return c === null || this.solidChars.includes(c);
    }
    tileCenter(tx, ty) { return { x: tx * E.T + E.T / 2, y: ty * E.T + E.T / 2 }; }
    enter() {}
    update(dt) { this.t += dt; this.particles.update(dt); }
    drawBack() {}
    drawFloor() {}
    drawables() { return []; }
    drawTop() {}
    lights() {}
    drawPost() {}
    drawHud() {}
    interactables() { return []; }
    onAction() { return false; }
    near(x, y, r) { return U.dist(this.P.x, this.P.y, x, y) < r; }
  }
  Y.Loc = Loc;
})(window.Y);

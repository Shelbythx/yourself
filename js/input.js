'use strict';
/* Керування: клавіатура (WASD / стрілки, E / Enter, Esc), сенсорний джойстик і тап, геймпад. */
(function (Y) {
  const U = Y.U;
  const I = Y.Input = {
    down: {}, hit: {}, axis: { x: 0, y: 0 }, touch: false, joy: null, idle: 0
  };
  const MAP = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    KeyE: 'act', Enter: 'act', NumpadEnter: 'act', KeyZ: 'act', Space: 'act',
    Escape: 'pause', KeyP: 'pause', KeyM: 'mute'
  };
  const keyDown = {};

  window.addEventListener('keydown', e => {
    const a = MAP[e.code];
    if (!a) return;
    if (['up', 'down', 'left', 'right', 'act'].includes(a) && !(e.target && e.target.tagName === 'INPUT')) e.preventDefault();
    keyDown[e.code] = true;
    I.down[a] = true;
    if (!e.repeat) I.hit[a] = true;
    I.idle = 0;
  });
  window.addEventListener('keyup', e => {
    const a = MAP[e.code];
    if (!a) return;
    keyDown[e.code] = false;
    I.down[a] = Object.keys(MAP).some(k => MAP[k] === a && keyDown[k]);
  });
  window.addEventListener('blur', () => { for (const k in keyDown) keyDown[k] = false; I.down = {}; });

  /* ---- touch / mouse on the stage ---- */
  const stage = document.getElementById('stage');
  const taps = {};
  function markTouch() {
    if (!I.touch) { I.touch = true; document.body.classList.add('touch'); }
  }
  stage.addEventListener('pointerdown', e => {
    I.idle = 0;
    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
      markTouch();
      if (!I.joy && e.clientX < window.innerWidth * 0.62) {
        I.joy = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY, t0: performance.now(), moved: false };
      } else {
        taps[e.pointerId] = { x: e.clientX, y: e.clientY, t0: performance.now() };
      }
    } else {
      taps[e.pointerId] = { x: e.clientX, y: e.clientY, t0: performance.now() };
    }
  });
  window.addEventListener('pointermove', e => {
    if (I.joy && e.pointerId === I.joy.id) {
      I.joy.x = e.clientX; I.joy.y = e.clientY;
      if (Math.hypot(I.joy.x - I.joy.ox, I.joy.y - I.joy.oy) > 10) I.joy.moved = true;
      // the base follows the finger if it drifts too far
      const max = 56, dx = I.joy.x - I.joy.ox, dy = I.joy.y - I.joy.oy, d = Math.hypot(dx, dy);
      if (d > max * 1.4) { I.joy.ox = I.joy.x - dx / d * max * 1.4; I.joy.oy = I.joy.y - dy / d * max * 1.4; }
    }
  });
  function endPointer(e) {
    if (I.joy && e.pointerId === I.joy.id) {
      const j = I.joy;
      if (!j.moved && performance.now() - j.t0 < 320) I.hit.act = true; // tap
      I.joy = null;
      return;
    }
    const t = taps[e.pointerId];
    if (t) {
      if (performance.now() - t.t0 < 400 && Math.hypot(e.clientX - t.x, e.clientY - t.y) < 16) I.hit.act = true;
      delete taps[e.pointerId];
    }
  }
  window.addEventListener('pointerup', endPointer);
  window.addEventListener('pointercancel', e => { if (I.joy && e.pointerId === I.joy.id) I.joy = null; delete taps[e.pointerId]; });

  /* ---- on-screen buttons ---- */
  const bAct = document.getElementById('t-act');
  const bPause = document.getElementById('t-pause');
  bAct.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); markTouch(); I.down.act = true; I.hit.act = true; I.idle = 0; });
  const up = () => { I.down.act = false; };
  bAct.addEventListener('pointerup', up); bAct.addEventListener('pointerleave', up); bAct.addEventListener('pointercancel', up);
  bPause.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); I.hit.pause = true; });
  window.addEventListener('touchstart', markTouch, { passive: true, once: true });

  I.setActLabel = function (txt) {
    const s = bAct.querySelector('small');
    if (s.textContent !== txt) s.textContent = txt || '';
    bAct.classList.toggle('on', !!txt);
  };

  /* ---- gamepad ---- */
  let padPrev = {};
  function pollPad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const p = pads && Array.from(pads).find(Boolean);
    if (!p) return null;
    const b = i => p.buttons[i] && p.buttons[i].pressed;
    const now = { act: b(0), pause: b(9) };
    for (const k in now) { if (now[k] && !padPrev[k]) I.hit[k] = true; }
    if (now.act) I.down.act = true; else if (padPrev.act) I.down.act = false;
    padPrev = now;
    let x = p.axes[0] || 0, y = p.axes[1] || 0;
    if (b(14)) x = -1; if (b(15)) x = 1; if (b(12)) y = -1; if (b(13)) y = 1;
    if (Math.hypot(x, y) < 0.25) return null;
    I.idle = 0;
    return { x, y };
  }

  I.update = function (dt) {
    let x = (I.down.right ? 1 : 0) - (I.down.left ? 1 : 0);
    let y = (I.down.down ? 1 : 0) - (I.down.up ? 1 : 0);
    if (I.joy && I.joy.moved) {
      const max = 50, dx = I.joy.x - I.joy.ox, dy = I.joy.y - I.joy.oy, d = Math.hypot(dx, dy);
      if (d > 8) { const m = U.clamp(d / max, 0, 1); x = dx / d * m; y = dy / d * m; }
    }
    const pad = pollPad();
    if (pad) { x = pad.x; y = pad.y; }
    const l = Math.hypot(x, y);
    if (l > 1) { x /= l; y /= l; }
    I.axis.x = x; I.axis.y = y;
    if (l > 0.05) I.idle = 0; else I.idle += dt;
  };
  I.endFrame = function () { I.hit = {}; };
  I.clear = function () { I.hit = {}; I.down.act = false; };
})(window.Y);

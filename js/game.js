'use strict';
/* Стан гри, збереження, перемикання локацій, головний цикл. */
(function (Y) {
  const U = Y.U, E = Y.E, A = Y.Audio, I = Y.Input, UI = Y.UI, D = Y.Dialog;
  const SAVE_KEY = 'yourself.save.v1', SET_KEY = 'yourself.settings.v1';

  const G = Y.G = {
    player: new Y.Player(), loc: null, locId: null, mode: 'boot',
    locked: false, busy: false, t: 0, state: null, focus: null
  };

  function freshState(form) {
    return { v: 1, loc: 'hall', pos: null, seen: {}, form, selfHue: null, door: null, done: false };
  }

  /* ---------- state helpers ---------- */
  G.once = id => { if (G.state.seen[id]) return false; G.state.seen[id] = true; G.save(); return true; };
  G.seen = id => !!(G.state && G.state.seen[id]);
  G.save = function () {
    if (!G.state || G.mode !== 'play') return;
    G.state.loc = G.locId;
    G.state.pos = G.loc && G.loc.savePos ? { x: Math.round(G.player.x), y: Math.round(G.player.y) } : null;
    U.store.set(SAVE_KEY, G.state);
  };
  G.saveSettings = () => U.store.set(SET_KEY, { sound: A.enabled, vol: A.volume, lang: G.langChosen ? Y.T.lang : null });
  G.toggleSound = () => { A.setEnabled(!A.enabled); G.saveSettings(); };
  G.say = lines => D.play(lines);
  G.selfRGB = function (l = 72) {
    if (G.state.selfHue == null) return null;
    return U.hslToRgb(G.state.selfHue, 75, l).map(v => v | 0).join(',');
  };

  /* ---------- easter eggs: five of them and one achievement; kept apart from the save, so a restart keeps them ---------- */
  const EGG_KEY = 'yourself.eggs.v1', EGGS = ['cat', 'save', 'flower', 'skull', 'raccoon'];
  G.eggs = U.store.get(EGG_KEY) || {};
  if (!G.eggs.found) G.eggs.found = {};
  G.eggTotal = EGGS.length;
  G.eggCount = () => EGGS.filter(k => G.eggs.found[k]).length;
  G.hasAch = () => G.eggCount() === EGGS.length;
  G.egg = function (id) {
    if (G.eggs.found[id] || G.mode !== 'play') return false;
    G.eggs.found[id] = true;
    U.store.set(EGG_KEY, G.eggs);
    UI.egg(G.eggCount(), EGGS.length);
    return true;
  };

  /* ---------- locations ---------- */
  G.enter = function (id, opts = {}) {
    const Cls = Y.LOC[id];
    const p = G.player;
    p.reset();
    G.loc = new Cls(G, opts);
    G.locId = id;
    const e = G.loc.entry || { x: G.loc.map.pw / 2, y: G.loc.map.ph / 2, dir: 'up' };
    p.x = e.x; p.y = e.y; p.dir = e.dir || 'up';
    if (opts.pos && G.loc.savePos) { p.x = opts.pos.x; p.y = opts.pos.y; }
    const self = G.selfRGB();
    if (self && G.loc.useSelfHue !== false) { G.loc.playerLight.rgb = self; G.loc.playerLight.ca = 0.3; }
    G.loc.enter(opts);
    E.cam.rot = 0;
    const c = camTarget();
    E.camSnap(c.x, c.y, G.loc.map);
    if (G.mode === 'play') {
      setTimeout(() => { if (G.locId === id) UI.locTitle(Y.TEXT.titles[id]); }, 900);
      G.save();
    }
  };
  G.goto = async function (id, opts = {}) {
    if (G.busy) return;
    G.busy = true; G.locked = true;
    A.sfx.whoosh(0.07);
    // the old track fades out together with the picture, so the next one starts without overlap
    A.fadeMusic(Math.max(0.6, (opts.out || 1.4) - 0.2));
    await UI.fadeTo(1, opts.out || 1.4, opts.color || '#000');
    UI.hintOff();
    A.loopsOff(0.8);
    G.enter(id, opts);
    await U.wait(350);
    G.locked = false; G.busy = false;
    await UI.fadeTo(0, opts.in || 1.8, opts.color || '#000');
  };
  function camTarget() {
    if (G.loc.camTarget) return G.loc.camTarget();
    return { x: G.player.x, y: G.player.y - 10 };
  }

  /* ---------- flow ---------- */
  G.titleScreen = function () {
    G.mode = 'title';
    G.locked = true;
    Y.T.form = 'm';
    G.state = freshState('m');
    G.enter('hall', { title: true });
    A.scene({}, 1);
    UI.fadeTo(0.25, 2.5);
    const save = U.store.get(SAVE_KEY);
    const hasSave = !!(save && save.v === 1 && save.loc && Y.LOC[save.loc] && !save.done && (save.loc !== 'hall' || save.seen.hallMeet));
    UI.title({
      hasSave,
      ach: G.hasAch(),
      askLang: !G.langChosen,
      onLang: lang => { Y.T.setLang(lang); G.langChosen = true; G.saveSettings(); },
      onNew: form => G.start(form),
      onContinue: () => G.resume(save)
    });
  };
  G.start = async function (form) {
    if (G.busy) return;
    G.busy = true;
    A.unlock();
    Y.T.form = form;
    G.state = freshState(form);
    U.store.set(SAVE_KEY, G.state);
    UI.hideTitle();
    await UI.fadeTo(1, 1.4);
    G.mode = 'play';
    G.enter('hall', { intro: true });
    G.locked = true;
    await U.wait(700);
    G.busy = false;
    UI.fadeTo(0, 6.5); // the screen slowly brightens
    await U.wait(3200);
    G.locked = false;
    UI.hint(I.touch ? Y.TEXT.ui.hintMoveTouch : Y.TEXT.ui.hintMove, 7);
  };
  G.resume = async function (save) {
    if (G.busy) return;
    G.busy = true;
    A.unlock();
    Y.T.form = save.form || 'm';
    G.state = save;
    UI.hideTitle();
    await UI.fadeTo(1, 1.4);
    G.mode = 'play';
    G.enter(save.loc, { pos: save.pos, resumed: true });
    G.locked = false;  // the title screen locked the controls
    G.busy = false;
    await UI.fadeTo(0, 2.5);
  };
  G.restart = async function () {
    U.store.del(SAVE_KEY);
    G.busy = true;
    await UI.fadeTo(1, 1.2);
    A.scene({}, 1.2); A.loopsOff(0.5);
    UI.hintOff();
    G.busy = false;
    G.titleScreen();
  };
  G.finish = async function () {
    G.locked = true;
    UI.hintOff();
    await UI.support();
    G.state.done = true;
    U.store.set(SAVE_KEY, G.state);
    await UI.fadeTo(1, 2);
    G.mode = 'credits';
    await UI.credits();
    A.scene({}, 3);
    await U.wait(1500);
    G.titleScreen();
  };

  // для тестування з консолі: Y.G.debugJump('garden')
  G.debugJump = function (id, opts = {}) {
    UI.hideTitle(); A.unlock();
    if (!G.state || G.mode !== 'play') G.state = freshState(opts.form || 'm');
    Y.T.form = G.state.form;
    G.mode = 'play'; G.locked = false; G.busy = false;
    D.active && D.close && D.close();
    G.enter(id, opts);
    UI.fadeTo(0, 0.2);
  };

  /* ---------- main loop ---------- */
  let last = performance.now(), saveT = 0;
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    try { update(dt); render(); } catch (err) { console.error(err); }
    requestAnimationFrame(frame);
  }

  // для тестування у фоновій вкладці, де requestAnimationFrame стоїть: Y.G.debugStep(600)
  G.debugStep = function (n = 60, dt = 1 / 60) { for (let i = 0; i < n; i++) update(dt); render(); };

  function update(dt) {
    G.t += dt;
    I.update(dt);
    UI.update(dt);
    A.update(dt);
    if (I.hit.mute) G.toggleSound();
    if (G.mode === 'credits') UI.creditsUpdate(dt);
    if (G.mode === 'play' && !G.busy) {
      if (UI.pauseOpen) { if (I.hit.pause) UI.unpause(); }
      else if (I.hit.pause) UI.pause(G);
    }
    const loc = G.loc;
    if (loc && !UI.pauseOpen && G.mode !== 'credits') {
      D.update(dt);
      G.focus = null;
      if (G.mode === 'play') {
        if (D.active) { if (I.hit.act) D.advance(); I.setActLabel(''); }
        else if (!G.locked) interact();
        else I.setActLabel('');
        G.player.update(dt, G, loc);
      }
      loc.update(dt);
      const c = camTarget();
      E.camFollow(c.x, c.y, dt, loc.map, loc.camK || 5);
      saveT += dt;
      if (saveT > 5) { saveT = 0; G.save(); }
    }
    I.endFrame();
  }

  function interact() {
    const loc = G.loc, p = G.player;
    let best = null, bd = 1e9;
    for (const it of loc.interactables()) {
      if (!it || it.enabled === false) continue;
      const d = U.dist(p.x, p.y - 4, it.x, it.y);
      if (d < (it.r || 20) && d < bd) { best = it; bd = d; }
    }
    G.focus = best;
    I.setActLabel(best ? Y.T.g(best.label) : (loc.actLabel ? loc.actLabel() : ''));
    if (I.hit.act) {
      if (best) best.act();
      else loc.onAction();
    }
  }

  function render() {
    const ctx = E.ctx, loc = G.loc;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, E.W, E.H);
    const h = E.hctx;
    h.setTransform(1, 0, 0, 1, 0, 0);
    h.clearRect(0, 0, E.hud.width, E.hud.height);
    if (!loc) return;
    ctx.save();
    loc.drawBack(ctx);
    ctx.restore();
    E.applyCam(ctx);
    loc.drawFloor(ctx);
    const list = loc.drawables();
    const p = G.player;
    if (G.mode === 'play' && loc.showPlayer !== false) list.push({ y: p.y, draw: c => p.draw(c) });
    list.sort((a, b) => a.y - b.y);
    for (const d of list) d.draw(ctx);
    loc.particles.draw(ctx);
    loc.drawTop(ctx);
    if (G.mode === 'play' && loc.showPlayer !== false && p.visible) {
      const L = loc.playerLight;
      E.addLight(p.x, p.y - 9, L.r, L.a * p.alpha, L.rgb, L.ca);
    }
    loc.particles.lights();
    loc.lights();
    E.renderLights(ctx, loc.darkness, loc.darkRGB, loc.cutDark ? l => loc.cutDark(l) : null);
    E.applyCam(ctx);
    loc.drawPost(ctx);
    E.drawVignette(ctx, loc.vignette);

    // HUD
    E.hudWorld();
    loc.drawHud(h);
    if (G.focus && !D.active && G.mode === 'play') drawPrompt(h, G.focus);
    if (I.joy && I.joy.moved) {
      h.setTransform(E.dpr, 0, 0, E.dpr, 0, 0);
      h.globalAlpha = 0.35; h.strokeStyle = '#fff'; h.lineWidth = 2;
      h.beginPath(); h.arc(I.joy.ox, I.joy.oy, 46, 0, U.TAU); h.stroke();
      const dx = I.joy.x - I.joy.ox, dy = I.joy.y - I.joy.oy, d = Math.hypot(dx, dy), m = Math.min(d, 46);
      h.globalAlpha = 0.5; h.fillStyle = '#fff';
      h.beginPath(); h.arc(I.joy.ox + (d ? dx / d * m : 0), I.joy.oy + (d ? dy / d * m : 0), 18, 0, U.TAU); h.fill();
      h.globalAlpha = 1;
    }
  }

  function drawPrompt(h, it) {
    const x = it.px != null ? it.px : it.x, y = (it.py != null ? it.py : it.y) - 18 + Math.sin(G.t * 4) * 1;
    if (I.touch) {
      h.globalAlpha = 0.85; h.fillStyle = '#fff';
      h.beginPath(); h.moveTo(x - 2.5, y - 2); h.lineTo(x + 2.5, y - 2); h.lineTo(x, y + 1.5); h.fill();
      h.globalAlpha = 1;
      return;
    }
    const label = Y.T.g(it.label || '');
    h.font = "400 6px 'Tiny5', monospace";
    const tw = h.measureText(label).width;
    const w = 9 + (label ? tw + 4 : 0), x0 = x - w / 2;
    h.globalAlpha = 0.82; h.fillStyle = '#000'; h.fillRect(x0 - 1, y - 5, w + 2, 10);
    h.globalAlpha = 1; h.strokeStyle = '#fff'; h.lineWidth = 0.6; h.strokeRect(x0 + 0.5, y - 4, 8, 8);
    E.text(h, 'E', x0 + 4.5, y + 0.3, { size: 6 });
    if (label) E.text(h, label, x0 + 10, y + 0.3, { size: 6, align: 'left', color: '#e8e2d8' });
  }

  /* ---------- boot ---------- */
  async function boot() {
    E.init();
    const set = U.store.get(SET_KEY);
    if (set) { A.enabled = set.sound !== false; A.volume = set.vol == null ? 0.8 : set.vol; }
    if (set && set.lang) { Y.T.setLang(set.lang); G.langChosen = true; }
    UI.applyLang();
    requestAnimationFrame(frame);
    UI.loading(0.15);
    try {
      await Promise.race([
        Promise.all([document.fonts.load("16px 'Pixelify Sans'"), document.fonts.load("12px 'Tiny5'")]),
        U.wait(4000)
      ]);
    } catch (e) { /* fonts are optional */ }
    UI.loading(0.7);
    await U.wait(250);
    UI.loading(1);
    await U.wait(450);
    if (!A.oggOk) {
      const n = document.getElementById('sound-note');
      n.textContent = Y.TEXT.ui.soundNote;
      n.hidden = false;
      setTimeout(() => { n.hidden = true; }, 9000);
    }
    UI.loadingDone();
    G.titleScreen();
  }
  window.addEventListener('load', boot);
})(window.Y);

'use strict';
/* Діалоги: вікно знизу, ім'я мовця, ефект друкування, пропуск натисканням. */
(function (Y) {
  const names = () => Y.TEXT.names || {};
  const SPEED = { psyche: 34, author: 40, memory: 30, narr: 46, mask: 26 };
  const root = document.getElementById('dialog');
  const box = root.querySelector('.dlg-box');
  const nameEl = root.querySelector('.dlg-name');
  const textEl = root.querySelector('.dlg-text');

  const D = Y.Dialog = { active: false };
  let lines = [], idx = 0, text = '', shown = 0, timer = 0, resolve = null, guard = 0, cur = null, blipN = 0;

  function norm(l) {
    if (typeof l === 'string') return { w: null, t: l };
    return l;
  }
  function show(i) {
    cur = norm(lines[i]);
    text = Y.T.g(cur.t);
    shown = 0; timer = 0.05; guard = 0.15; blipN = 0;
    const w = cur.w || 'narr';
    nameEl.textContent = cur.name ? Y.T.g(cur.name) : (names()[cur.w] || '');
    nameEl.className = 'dlg-name ' + (cur.w || '');
    textEl.className = 'dlg-text ' + (cur.w || '');
    textEl.textContent = '';
    box.classList.remove('done');
    cur.voice = cur.voice || w;
    cur.speed = cur.speed || SPEED[w] || 40;
    if (cur.fn) cur.fn();
  }
  D.play = function (list) {
    if (!list || !list.length) return Promise.resolve();
    lines = list; idx = 0;
    D.active = true;
    root.hidden = false;
    show(0);
    return new Promise(r => { resolve = r; });
  };
  D.say = (t, w = null) => D.play([w ? { w, t } : t]);

  D.update = function (dt) {
    if (!D.active) return;
    if (guard > 0) guard -= dt;
    if (shown >= text.length) return;
    timer -= dt;
    while (timer <= 0 && shown < text.length) {
      shown++;
      const ch = text[shown - 1];
      let d = 1 / cur.speed;
      if ('.!?…'.includes(ch) && text[shown] !== '.' && text[shown] !== '»') d += 0.32;
      else if (',;:—'.includes(ch)) d += 0.11;
      else if (ch === '\n') d += 0.25;
      timer += d;
      if (/[^\s.,!?…—«»"]/.test(ch) && (blipN++ % 2 === 0)) Y.Audio.sfx.blip(cur.voice);
    }
    textEl.textContent = text.slice(0, shown);
    if (shown >= text.length) box.classList.add('done');
  };
  D.advance = function () {
    if (!D.active || guard > 0) return;
    if (shown < text.length) {
      shown = text.length; textEl.textContent = text; box.classList.add('done');
      guard = 0.08;
      return;
    }
    idx++;
    if (idx < lines.length) { show(idx); return; }
    D.active = false;
    root.hidden = true;
    const r = resolve; resolve = null;
    if (r) r();
  };
  D.close = function () {
    if (!D.active) return;
    D.active = false; root.hidden = true;
    const r = resolve; resolve = null;
    if (r) r();
  };
  box.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); D.advance(); });
})(window.Y);

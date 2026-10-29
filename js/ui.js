'use strict';
/* Інтерфейс: затемнення, підказки, назви локацій, завантаження, титульний екран, пауза, підтримка, титри. */
(function (Y) {
  const U = Y.U;
  const $ = id => document.getElementById(id);
  const UI = Y.UI = { menu: null };
  const CFG = window.YOURSELF_CONFIG || {};

  /* ---------- fade ---------- */
  const fadeEl = $('fade');
  const fade = { v: 1, target: 1, speed: 1, res: null, color: '#000' };
  UI.fadeTo = function (v, sec = 1, color = '#000') {
    if (fade.res) { const r = fade.res; fade.res = null; r(); }
    fade.target = v; fade.speed = Math.abs(v - fade.v) / Math.max(0.01, sec);
    if (color !== fade.color) { fade.color = color; fadeEl.style.background = color; }
    if (fade.v === v) return Promise.resolve();
    return new Promise(r => { fade.res = r; });
  };
  UI.fadeValue = () => fade.v;
  UI.update = function (dt) {
    if (fade.v !== fade.target) {
      fade.v = U.approach(fade.v, fade.target, fade.speed * dt);
      fadeEl.style.opacity = U.smooth(fade.v).toFixed(3);
      if (fade.v === fade.target && fade.res) { const r = fade.res; fade.res = null; r(); }
    }
  };

  /* ---------- hint & location title ---------- */
  const hintEl = $('hint');
  let hintTimer = null, hintText = '';
  UI.hint = function (text, dur = 0) {
    clearTimeout(hintTimer);
    if (text !== hintText) { hintEl.textContent = text; hintText = text; }
    hintEl.classList.add('show');
    if (dur) hintTimer = setTimeout(UI.hintOff, dur * 1000);
  };
  UI.hintOff = function () { clearTimeout(hintTimer); hintEl.classList.remove('show'); hintText = ''; };

  const titleEl = $('loc-title');
  let titleTimer = null;
  UI.locTitle = function (pair) {
    if (!pair) return;
    clearTimeout(titleTimer);
    titleEl.querySelector('.n').textContent = pair[0];
    titleEl.querySelector('.t').textContent = pair[1];
    titleEl.classList.add('show');
    titleTimer = setTimeout(() => titleEl.classList.remove('show'), 3600);
  };

  /* ---------- menus ---------- */
  class Menu {
    constructor(el, items, opts = {}) {
      this.el = el; this.items = items; this.sel = 0; this.opts = opts;
      el.innerHTML = '';
      if (opts.q) { const q = document.createElement('div'); q.className = 'q'; q.textContent = opts.q; el.appendChild(q); }
      const wrap = document.createElement('div');
      wrap.className = opts.row ? 'row' : 'menu';
      this.btns = items.map((it, i) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'mi'; b.textContent = it.label;
        b.addEventListener('pointerenter', () => this.select(i));
        b.addEventListener('click', e => { e.preventDefault(); this.select(i); this.fire(); });
        wrap.appendChild(b);
        return b;
      });
      el.appendChild(wrap);
      this.select(0);
      UI.menu = this;
    }
    select(i) {
      this.sel = (i + this.items.length) % this.items.length;
      this.btns.forEach((b, k) => b.classList.toggle('sel', k === this.sel));
    }
    fire() {
      const it = this.items[this.sel];
      Y.Audio.sfx.blip('psyche');
      if (it && it.fn) it.fn(this.btns[this.sel]);
    }
    key(code) {
      if (['ArrowLeft', 'ArrowUp', 'KeyA', 'KeyW'].includes(code)) { this.select(this.sel - 1); Y.Audio.sfx.blip('narr'); return true; }
      if (['ArrowRight', 'ArrowDown', 'KeyD', 'KeyS'].includes(code)) { this.select(this.sel + 1); Y.Audio.sfx.blip('narr'); return true; }
      if (['Enter', 'NumpadEnter', 'Space', 'KeyE', 'KeyZ'].includes(code)) { this.fire(); return true; }
      return false;
    }
  }
  UI.Menu = Menu;
  window.addEventListener('keydown', e => {
    const m = UI.menu;
    if (!m || e.repeat) return;
    if (m.el.closest('[hidden]')) return;
    if (m.key(e.code)) { e.preventDefault(); Y.Input.clear(); }
  });

  /* ---------- loading ---------- */
  UI.loading = p => { $('loading').querySelector('.load-bar i').style.transform = 'scaleX(' + Math.max(0, Math.min(1, p)) + ')'; };
  UI.loadingDone = () => {
    const el = $('loading');
    el.classList.add('gone');
    setTimeout(() => { el.hidden = true; }, 1300);
  };

  /* ---------- language ---------- */
  const ui = () => Y.TEXT.ui;
  // fills every [data-i18n] element with the current language
  UI.applyLang = function () {
    const t = ui();
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const v = t[el.dataset.i18n];
      if (typeof v === 'string') el.textContent = v;
    });
    $('fs-pc-name').textContent = Y.T.lang === 'en' ? 'PC' : 'ПК';
    $('lang-btn').textContent = `${t.lang}: ${Y.T.langNames[Y.T.lang]}`;
  };

  /* ---------- title ---------- */
  UI.title = function (opts) {
    const el = $('title');
    el.hidden = false; el.classList.remove('gone');
    UI.applyLang();
    const menuEl = $('title-menu');
    const askForm = () => {
      const f = ui().forms;
      new Menu(menuEl, [
        { label: f[0], fn: () => opts.onNew('m') },
        { label: f[1], fn: () => opts.onNew('f') },
        { label: f[2], fn: () => opts.onNew('n') }
      ], { q: ui().formQ, row: true });
    };
    const main = () => {
      if (opts.hasSave) {
        new Menu(menuEl, [
          { label: ui().cont, fn: () => opts.onContinue() },
          { label: ui().restart, fn: askForm }
        ]);
      } else askForm();
    };
    const askLang = () => new Menu(menuEl, Y.T.langs.map(l => ({
      label: Y.T.langNames[l], fn: () => { opts.onLang(l); UI.applyLang(); main(); }
    })), { q: 'мова · language · язык', row: true });
    $('lang-btn').onclick = e => { e.preventDefault(); askLang(); };
    if (opts.askLang) askLang(); else main();
  };
  UI.hideTitle = function () {
    const el = $('title');
    el.classList.add('gone');
    UI.menu = null;
    setTimeout(() => { el.hidden = true; }, 1500);
  };

  /* ---------- full screen (F, F11 or the button on the title screen) ---------- */
  const root = document.documentElement;
  const canFullscreen = !!(root.requestFullscreen || root.webkitRequestFullscreen);
  UI.toggleFullscreen = function () {
    const d = document;
    if (d.fullscreenElement || d.webkitFullscreenElement) {
      const exit = d.exitFullscreen || d.webkitExitFullscreen;
      if (exit) exit.call(d);
      return;
    }
    const req = root.requestFullscreen || root.webkitRequestFullscreen;
    if (!req) return;
    const p = req.call(root, { navigationUI: 'hide' });
    if (p && p.catch) p.catch(() => {});
  };
  $('fs-btn').hidden = !canFullscreen;
  $('fs-btn').addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); UI.toggleFullscreen(); });
  window.addEventListener('keydown', e => {
    if (e.code === 'KeyF' && !e.repeat && !(e.target && e.target.tagName === 'INPUT')) UI.toggleFullscreen();
  });

  /* ---------- pause ---------- */
  const pauseEl = $('pause');
  UI.pauseOpen = false;
  function authorLine() {
    const el = $('pause-author');
    el.innerHTML = '';
    const s = document.createElement('div'); s.textContent = `by ${CFG.author || ''}`; el.appendChild(s);
    const links = [['github', CFG.github], ['patreon', CFG.patreon]].filter(l => l[1]);
    if (links.length) {
      const d = document.createElement('div'); d.style.marginTop = '6px';
      links.forEach(([n, href], i) => {
        const a = document.createElement('a'); a.href = href; a.target = '_blank'; a.rel = 'noopener'; a.textContent = n;
        if (i) d.appendChild(document.createTextNode(' · '));
        d.appendChild(a);
      });
      el.appendChild(d);
    }
  }
  UI.pause = function (G) {
    if (UI.pauseOpen) return;
    UI.pauseOpen = true;
    pauseEl.hidden = false;
    authorLine();
    const t = ui(), sound = () => t.sound + (Y.Audio.enabled ? t.on : t.off);
    const build = () => new Menu($('pause-menu'), [
      { label: t.resume, fn: () => UI.unpause(G) },
      { label: sound(), fn: b => { G.toggleSound(); b.textContent = sound(); } },
      { label: t.restart, fn: () => new Menu($('pause-menu'), [
        { label: t.no, fn: build },
        { label: t.yesRestart, fn: () => { UI.unpause(G); G.restart(); } }
      ], { q: t.restartQ, row: true }) }
    ]);
    build();
    const vol = $('vol');
    vol.value = Math.round(Y.Audio.volume * 100);
    vol.oninput = () => { Y.Audio.setVolume(vol.value / 100); G.saveSettings(); };
  };
  UI.unpause = function () {
    UI.pauseOpen = false;
    pauseEl.hidden = true;
    UI.menu = null;
    Y.Input.clear();
  };

  /* ---------- support (Patreon) ---------- */
  UI.support = function () {
    return new Promise(resolve => {
      const el = $('support');
      el.hidden = false;
      const pat = $('sup-patreon');
      pat.hidden = !CFG.patreon;
      if (CFG.patreon) pat.href = CFG.patreon;
      const t = ui();
      UI.applyLang();
      const url = CFG.siteUrl || location.href.split('#')[0];
      new Menu($('support-menu'), [
        { label: t.share, fn: b => {
          const data = { title: 'yourself.', text: t.shareText, url };
          if (navigator.share) navigator.share(data).catch(() => {});
          else { try { navigator.clipboard.writeText(url).then(() => { b.textContent = t.linkCopied; }); } catch (e) { /* ignore */ } }
        } },
        { label: t.next, fn: () => { el.hidden = true; UI.menu = null; Y.Input.clear(); resolve(); } }
      ], { row: true });
    });
  };

  /* ---------- credits ---------- */
  UI.credits = function () {
    return new Promise(resolve => {
      const T = Y.TEXT.credits, t = ui(), g = Y.T.g;
      const el = $('credits'), roll = $('credits-roll');
      const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      const link = (n, href) => `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(n)}</a>`;
      let h = '';
      h += `<div class="c-block"><p style="font-size:clamp(30px,6vw,52px)">yourself.</p></div>`;
      h += `<div class="c-block loc-list"><h3>${esc(t.cRooms)}</h3>` +
        T.locations.map(([a, b]) => `<p><b>${esc(a)}</b><span>${esc(b)}</span></p>`).join('') + '</div>';
      h += `<div class="c-block"><h3>${esc(t.cAuthor)}</h3><p>by ${esc(CFG.author || '')}</p>`;
      const links = [];
      if (CFG.github) links.push(link('GitHub', CFG.github));
      if (CFG.patreon) links.push(link('Patreon', CFG.patreon));
      if (links.length) h += `<p class="dim">${links.join(' · ')}</p>`;
      h += `<p class="dim">${esc(t.cAuthorLine)}</p></div>`;
      h += `<div class="c-block"><h3>${esc(t.cMusic)}</h3>` + T.music.map(m => `<p>${esc(m)}</p>`).join('');
      if (CFG.otherMusicCredit) h += `<p class="dim">${esc(CFG.otherMusicCredit)}</p>`;
      h += `</div>`;
      h += `<div class="c-block"><h3>${esc(T.special.title)}</h3>` + T.special.lines.map(l => `<p>${esc(l)}</p>`).join('') + `</div>`;
      h += `<div class="c-block"><h3>${esc(t.cFonts)}</h3><p class="dim">Pixelify Sans, Tiny5 — Google Fonts (SIL Open Font License)</p></div>`;
      h += `<div class="c-block">` + T.thanks.map(l => `<p>${esc(g(l))}</p>`).join('') + `</div>`;
      const stanzas = list => list.map(s => `<div class="stanza">${s.map(l => `<p>${esc(l)}</p>`).join('')}</div>`).join('');
      h += `<div class="c-block poem">` + stanzas(T.poem.stanzas) + `<p class="sign">${esc(T.poem.sign)}</p>`;
      if (T.poem.translation) h += `<div class="translation">${stanzas(T.poem.translation)}<p class="sign">${esc(T.poem.translationSign)}</p></div>`;
      h += `</div>`;
      h += `<div class="c-block"><p class="dim">${esc(t.rights.replace('{author}', CFG.author || ''))}</p><p class="dim">${esc(t.rightsSub)}</p></div>`;
      h += `<div class="final">yourself.</div>`;
      roll.innerHTML = h;
      el.hidden = false;
      el.style.opacity = '0';
      el.style.transition = 'opacity 2s ease';
      requestAnimationFrame(() => { el.style.opacity = '1'; });
      credits = { el, roll, fin: roll.querySelector('.final'), y: 0, done: false, wait: 0, resolve };
    });
  };
  let credits = null;
  // called from the main loop (before input is cleared)
  UI.creditsUpdate = function (dt) {
    const c = credits;
    if (!c) return;
    const I = Y.Input;
    const target = c.fin.offsetTop - (window.innerHeight / 2 - c.fin.offsetHeight / 2);
    const fast = I.down.act || (I.joy && I.joy.moved);
    if (c.y < target) c.y = Math.min(target, c.y + dt * (fast ? 170 : 34));
    else if (!c.done) c.done = true;
    if (I.hit.pause && !c.done) c.y = target;
    c.roll.style.transform = `translateY(${-c.y}px)`;
    if (c.done) {
      c.wait += dt;
      if (c.wait > 2.5 && (I.hit.act || I.hit.pause)) {
        credits = null;
        c.el.style.opacity = '0';
        setTimeout(() => { c.el.hidden = true; c.resolve(); }, 2000);
      }
    }
  };
})(window.Y);

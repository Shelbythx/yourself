'use strict';
/*
 * Звук: музика (HTMLAudio, при http(s) — через WebAudio для плавних фейдів і фільтрів)
 * та процедурні звуки (друк тексту, кроки, шепіт, грім, серце, ноти).
 * Нічого не грає до першої взаємодії гравця.
 */
(function (Y) {
  const U = Y.U;
  const BASE = 'music/';
  const TRACKS = {
    prostranstvo: 'prostranstvo.ogg',
    missilost: 'missilost.ogg',
    suspence: 'suspence.ogg',
    forgtn: 'forgtn.ogg',
    breath: 'breath.ogg',
    utra: 'utra.ogg',
    angryutro: 'angryutro.ogg',
    final: 'final.ogg',
    vrata: 'vrata.ogg',
    ptici: 'ptici.ogg',
    breaktime: 'breaktime.ogg',
    magicbus: 'AJ_DiSpirito_-_Magic_School_Bus_Murder_Drones_OST_(mp3.pm).mp3',
    gala: 'AJ_DiSpirito_-_The_HuMaN_Gala_Murder_Drones_OST_(mp3.pm).mp3',
    eternal: 'Aj Dispirito Eternal Dream (Feat. Elsie Lovelock).mp3'
  };

  const A = Y.Audio = {
    unlocked: false, enabled: true, volume: 0.8, graph: false, ctx: null,
    oggOk: true, failed: {}
  };
  const tracks = {};
  let ctx = null, master = null, musicBus = null, sfxBus = null, echoIn = null, noiseBuf = null;
  const loops = {};

  try { A.oggOk = !!new Audio().canPlayType('audio/ogg; codecs="vorbis"'); } catch (e) { A.oggOk = false; }

  function silentWav() {
    const n = 400, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    w(36, 'data'); v.setUint32(40, n * 2, true);
    return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  }

  function track(name) {
    if (tracks[name]) return tracks[name];
    const el = new Audio();
    el.loop = true; el.preload = 'none';
    const t = tracks[name] = { name, el, cur: 0, target: 0, fade: 2, gain: null, filter: null, real: false, pending: false };
    if (A.graph) {
      try {
        const src = ctx.createMediaElementSource(el);
        t.filter = ctx.createBiquadFilter(); t.filter.type = 'lowpass'; t.filter.frequency.value = 20000;
        t.gain = ctx.createGain(); t.gain.gain.value = 0;
        src.connect(t.filter); t.filter.connect(t.gain); t.gain.connect(musicBus);
      } catch (e) { t.gain = null; t.filter = null; }
    }
    el.addEventListener('error', () => { if (t.real) A.failed[name] = true; });
    return t;
  }

  function isOgg(name) { return /\.ogg$/.test(TRACKS[name]); }
  function realize(t) {
    if (t.real) return;
    if (isOgg(t.name) && !A.oggOk) { A.failed[t.name] = true; return; }
    t.real = true;
    t.el.src = BASE + encodeURI(TRACKS[t.name]);
    t.el.preload = 'auto';
  }

  // must be called from inside a user gesture
  A.unlock = function () {
    if (A.unlocked) return;
    A.unlocked = true;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; }
    A.ctx = ctx;
    if (ctx) {
      master = ctx.createGain(); master.connect(ctx.destination);
      musicBus = ctx.createGain(); musicBus.connect(master);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
      // shared echo ("луна")
      echoIn = ctx.createGain();
      const d = ctx.createDelay(1.5); d.delayTime.value = 0.24;
      const fb = ctx.createGain(); fb.gain.value = 0.42;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1900;
      echoIn.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(sfxBus);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      if (ctx.state === 'suspended') ctx.resume();
    }
    A.graph = !!ctx && location.protocol !== 'file:';
    const silent = silentWav();
    for (const name in TRACKS) {
      const t = track(name);
      if (t.real) continue;
      t.el.src = silent;
      const p = t.el.play();
      if (p && p.then) p.then(() => { if (!t.real) t.el.pause(); }).catch(() => {});
    }
    A.applyMaster();
  };

  A.applyMaster = function () {
    if (master) master.gain.value = A.enabled ? 1 : 0;
    if (musicBus) musicBus.gain.value = A.volume;
    if (sfxBus) sfxBus.gain.value = 0.9 * A.volume;
  };
  A.setEnabled = function (on) { A.enabled = on; A.applyMaster(); };
  A.setVolume = function (v) { A.volume = U.clamp(v, 0, 1); A.applyMaster(); };

  /*
   * Музика ексклюзивна: одночасно звучить лише один трек. Новий трек стартує тільки тоді,
   * коли попередній повністю затих. Поверх музики можуть лягати лише фонові шари (AMBIENT).
   */
  const AMBIENT = { ptici: 1, breath: 1 };
  const isMusic = name => !AMBIENT[name];
  let want = { name: null, vol: 0, fadeIn: 2, fadeOut: 1 };

  A.music = function (name, vol = 0.8, fadeIn = 2, fadeOut = 1) {
    if (!name || vol <= 0) { want = { name: null, vol: 0, fadeIn, fadeOut }; return; }
    if (want.name === name) { want.vol = U.clamp(vol, 0, 1); want.fadeIn = fadeIn; return; }
    want = { name, vol: U.clamp(vol, 0, 1), fadeIn, fadeOut };
    realize(track(name));
  };
  A.fadeMusic = function (time = 1.2) { want = { name: null, vol: 0, fadeIn: 2, fadeOut: time }; };
  A.currentMusic = () => want.name;
  // for testing: the audible tracks and their levels
  A.levels = function () {
    const out = {};
    for (const n in tracks) if (tracks[n].cur > 0.002) out[n] = +tracks[n].cur.toFixed(2);
    return out;
  };
  A.audibleMusic = () => Object.keys(A.levels()).filter(isMusic);

  // the whole "scene": {trackName: volume}; one music track wins, ambient layers mix in, the rest fades out
  A.scene = function (map, fade = 2.5) {
    let best = null;
    for (const name in map) if (isMusic(name) && map[name] > 0 && (!best || map[name] > map[best])) best = name;
    A.music(best, best ? map[best] : 0, fade, Math.min(fade, 1.2));
    for (const name in TRACKS) if (!isMusic(name)) A.set(name, map[name] || 0, fade);
  };
  A.set = function (name, v, fade = 1.5) {
    if (isMusic(name)) {
      // a music track: change the volume of the current one, or switch to it (never layer)
      if (name === want.name) want.vol = U.clamp(v, 0, 1);
      else if (v > 0) A.music(name, v, fade, Math.min(fade, 1));
      return;
    }
    const t = track(name);
    t.target = U.clamp(v, 0, 1); t.fade = fade;
    if (v > 0) realize(t);
  };
  A.restart = function (name) {
    const t = track(name);
    try { t.el.currentTime = 0; } catch (e) { /* not loaded yet */ }
  };
  A.lowpass = function (name, hz, time = 0.6) {
    const t = track(name);
    if (t.filter && ctx) t.filter.frequency.setTargetAtTime(hz, ctx.currentTime, time / 3);
  };
  A.rate = function (name, r) {
    const t = track(name);
    try { t.el.preservesPitch = false; t.el.mozPreservesPitch = false; t.el.webkitPreservesPitch = false; } catch (e) { /* ignore */ }
    if (Math.abs(t.el.playbackRate - r) > 0.004) t.el.playbackRate = r;
  };
  A.preload = function (names) { names.forEach(n => { const t = track(n); realize(t); }); };

  A.update = function (dt) {
    if (!A.unlocked) return;
    // validation: the wanted track waits in silence while any other music is still audible
    let otherAudible = false;
    for (const name in tracks) if (isMusic(name) && name !== want.name && tracks[name].cur > 0.002) otherAudible = true;
    for (const name in tracks) {
      if (!isMusic(name)) continue;
      const t = tracks[name];
      if (name === want.name) { t.target = otherAudible ? 0 : want.vol; t.fade = want.fadeIn; }
      else { t.target = 0; t.fade = want.fadeOut; }
    }
    for (const name in tracks) {
      const t = tracks[name];
      if (t.cur !== t.target) t.cur = U.approach(t.cur, t.target, dt / Math.max(0.05, t.fade));
      const v = A.enabled ? t.cur : 0;
      if (t.gain) t.gain.gain.value = v;
      else t.el.volume = U.clamp(v * A.volume, 0, 1);
      if (!t.real || A.failed[name] || document.hidden) continue;
      if (t.cur > 0.002 && t.el.paused && !t.pending) {
        t.pending = true;
        const p = t.el.play();
        if (p && p.then) p.then(() => { t.pending = false; }).catch(() => { t.pending = false; t.retry = 1; });
        else t.pending = false;
      } else if (t.cur <= 0.002 && t.target === 0 && !t.el.paused) {
        t.el.pause();
      }
    }
  };

  document.addEventListener('visibilitychange', () => {
    if (!A.unlocked) return;
    if (document.hidden) {
      for (const n in tracks) if (!tracks[n].el.paused) tracks[n].el.pause();
      if (ctx) ctx.suspend();
    } else if (ctx) ctx.resume();
  });

  /* ---------------- procedural sfx ---------------- */
  function ok() { return ctx && A.enabled && ctx.state !== 'closed'; }
  function noiseSrc() { const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; return s; }
  function env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function out(node, echo = 0, pan = 0) {
    let last = node;
    if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = U.clamp(pan, -1, 1); node.connect(p); last = p; }
    last.connect(sfxBus);
    if (echo > 0) { const e = ctx.createGain(); e.gain.value = echo; last.connect(e); e.connect(echoIn); }
  }

  const VOICES = {
    psyche: { type: 'sine', f: 760, v: 0.07, var: 40 },
    author: { type: 'triangle', f: 520, v: 0.07, var: 20 },
    memory: { type: 'sine', f: 400, v: 0.08, var: 30 },
    mask: { type: 'sawtooth', f: 160, v: 0.025, var: 10 },
    narr: { type: 'square', f: 300, v: 0.025, var: 0 }
  };

  A.sfx = {
    blip(kind = 'narr') {
      if (!ok()) return;
      const c = VOICES[kind] || VOICES.narr, t = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = c.type; o.frequency.value = c.f + (Math.random() * 2 - 1) * c.var;
      env(g, t, 0.004, c.v, 0.06);
      o.connect(g); out(g); o.start(t); o.stop(t + 0.09);
    },
    step(opts = {}) {
      if (!ok()) return;
      const t = ctx.currentTime, s = noiseSrc(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = 'lowpass'; f.frequency.value = (opts.tone || 900) * (0.85 + Math.random() * 0.3);
      env(g, t, 0.004, opts.vol || 0.09, 0.07);
      s.connect(f); f.connect(g); out(g, opts.echo || 0);
      s.start(t, Math.random()); s.stop(t + 0.12);
    },
    whisper(pan = 0, vol = 0.05) {
      if (!ok()) return;
      const t = ctx.currentTime, dur = 0.5 + Math.random() * 0.7;
      const s = noiseSrc(), f = ctx.createBiquadFilter(), g = ctx.createGain(), trem = ctx.createGain();
      f.type = 'bandpass'; f.frequency.value = 1300 + Math.random() * 2200; f.Q.value = 2.2;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.15);
      g.gain.linearRampToValueAtTime(vol * 0.7, t + dur - 0.2);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      const lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = 7 + Math.random() * 9; lg.gain.value = 0.5; trem.gain.value = 0.5;
      lfo.connect(lg); lg.connect(trem.gain);
      s.connect(f); f.connect(trem); trem.connect(g); out(g, 0.3, pan);
      s.start(t, Math.random()); s.stop(t + dur + 0.05); lfo.start(t); lfo.stop(t + dur + 0.05);
    },
    thunder(vol = 0.35) {
      if (!ok()) return;
      const t = ctx.currentTime, s = noiseSrc(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = 'lowpass'; f.frequency.setValueAtTime(420, t); f.frequency.exponentialRampToValueAtTime(90, t + 3);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.08);
      g.gain.linearRampToValueAtTime(vol * 0.6, t + 0.5);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.6);
      s.connect(f); f.connect(g); out(g, 0.2, Math.random() * 1.2 - 0.6);
      s.start(t); s.stop(t + 3.8);
    },
    heart(vol = 0.5) {
      if (!ok()) return;
      const t = ctx.currentTime;
      [0, 0.26].forEach((dt, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(95, t + dt); o.frequency.exponentialRampToValueAtTime(42, t + dt + 0.14);
        env(g, t + dt, 0.008, vol * (i ? 0.7 : 1), 0.22);
        o.connect(g); out(g); o.start(t + dt); o.stop(t + dt + 0.3);
      });
    },
    note(freq, o = {}) {
      if (!ok()) return;
      const t = ctx.currentTime + (o.delay || 0), dur = o.dur || 1.3, vol = o.vol || 0.12;
      const g = ctx.createGain();
      env(g, t, o.attack || 0.01, vol, dur);
      [[1, 1], [2, 0.18], [0.5, 0.25]].forEach(([m, a]) => {
        const osc = ctx.createOscillator(), og = ctx.createGain();
        osc.type = m === 1 ? (o.type || 'sine') : 'sine';
        osc.frequency.value = freq * m; og.gain.value = a;
        osc.connect(og); og.connect(g); osc.start(t); osc.stop(t + dur + 0.1);
      });
      out(g, o.echo || 0, o.pan || 0);
    },
    chime(base = 880, vol = 0.08) {
      if (!ok()) return;
      [1, 2.76, 5.4].forEach((m, i) => A.sfx.note(base * m, { vol: vol / (i + 1), dur: 1.6 - i * 0.4, echo: 0.25 }));
    },
    musicBox(notes, gap = 0.32, vol = 0.07) {
      if (!ok()) return;
      notes.forEach((n, i) => A.sfx.note(n, { type: 'triangle', vol, dur: 1.4, delay: i * gap, echo: 0.3 }));
    },
    thud(vol = 0.4) {
      if (!ok()) return;
      const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(80, t); o.frequency.exponentialRampToValueAtTime(32, t + 0.35);
      env(g, t, 0.005, vol, 0.45); o.connect(g); out(g, 0.2); o.start(t); o.stop(t + 0.5);
      const s = noiseSrc(), f = ctx.createBiquadFilter(), g2 = ctx.createGain();
      f.type = 'lowpass'; f.frequency.value = 260; env(g2, t, 0.003, vol * 0.5, 0.2);
      s.connect(f); f.connect(g2); out(g2); s.start(t); s.stop(t + 0.3);
    },
    clank(vol = 0.18) {
      if (!ok()) return;
      const t = ctx.currentTime, s = noiseSrc(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 7;
      env(g, t, 0.002, vol, 0.25); s.connect(f); f.connect(g); out(g, 0.3); s.start(t); s.stop(t + 0.3);
      const o = ctx.createOscillator(), g2 = ctx.createGain();
      o.type = 'square'; o.frequency.value = 170; env(g2, t, 0.002, vol * 0.25, 0.12);
      o.connect(g2); out(g2); o.start(t); o.stop(t + 0.15);
    },
    tick(vol = 0.05, pan = 0) {
      if (!ok()) return;
      const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square'; o.frequency.value = 2400 + Math.random() * 600;
      env(g, t, 0.001, vol, 0.02); o.connect(g); out(g, 0, pan); o.start(t); o.stop(t + 0.04);
    },
    whoosh(vol = 0.12, up = true) {
      if (!ok()) return;
      const t = ctx.currentTime, s = noiseSrc(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = 'bandpass'; f.Q.value = 1.4;
      f.frequency.setValueAtTime(up ? 300 : 2400, t); f.frequency.exponentialRampToValueAtTime(up ? 2400 : 300, t + 1.1);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
      s.connect(f); f.connect(g); out(g, 0.2); s.start(t); s.stop(t + 1.3);
    },
    sparkle(vol = 0.05) {
      if (!ok()) return;
      for (let i = 0; i < 5; i++) A.sfx.note(1400 + Math.random() * 1600, { vol: vol, dur: 0.4, delay: i * 0.05 + Math.random() * 0.04, echo: 0.2 });
    }
  };

  /* --------------- continuous synth loops --------------- */
  function buildLoop(name) {
    const g = ctx.createGain(); g.gain.value = 0;
    const nodes = [];
    if (name === 'rain') {
      const s = noiseSrc(), hp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = 500; lp.type = 'lowpass'; lp.frequency.value = 3800;
      s.connect(hp); hp.connect(lp); lp.connect(g); s.start(); nodes.push(s);
    } else if (name === 'white') {
      const s = noiseSrc(), f = ctx.createBiquadFilter();
      f.type = 'highpass'; f.frequency.value = 900;
      s.connect(f); f.connect(g); s.start(); nodes.push(s);
    } else if (name === 'hum') {
      [55, 110, 165, 220.5].forEach((fr, i) => {
        const o = ctx.createOscillator(), og = ctx.createGain();
        o.type = i === 0 ? 'sine' : 'triangle'; o.frequency.value = fr; og.gain.value = [0.6, 0.25, 0.12, 0.06][i];
        o.connect(og); og.connect(g); o.start(); nodes.push(o);
      });
    } else if (name === 'wind') {
      const s = noiseSrc(), f = ctx.createBiquadFilter(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      f.type = 'lowpass'; f.frequency.value = 520; f.Q.value = 0.8;
      lfo.frequency.value = 0.13; lg.gain.value = 260; lfo.connect(lg); lg.connect(f.frequency);
      s.connect(f); f.connect(g); s.start(); lfo.start(); nodes.push(s, lfo);
    } else if (name === 'drone') {
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
      [[73.4, 'sawtooth', 0.18], [110, 'sine', 0.4], [77.8, 'sawtooth', 0.12]].forEach(([fr, ty, a]) => {
        const o = ctx.createOscillator(), og = ctx.createGain();
        o.type = ty; o.frequency.value = fr; og.gain.value = a; o.connect(og); og.connect(lp); o.start(); nodes.push(o);
      });
      lp.connect(g);
    }
    out(g);
    return { gain: g, nodes };
  }
  A.loop = function (name, v, time = 0.8) {
    if (!ctx) return;
    if (!loops[name]) loops[name] = buildLoop(name);
    loops[name].gain.gain.setTargetAtTime(Math.max(0, v), ctx.currentTime, time / 3);
  };
  A.loopsOff = function (time = 1) { for (const n in loops) A.loop(n, 0, time); };
})(window.Y);

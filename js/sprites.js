'use strict';
/*
 * Піксельні спрайти, згенеровані з рядків-карт. Кожен символ — колір з палітри, '.' — прозорий.
 * Щоб замінити на власні спрайти, достатньо підмінити S.player / S.psyche на зображення того ж розміру.
 */
(function (Y) {
  const U = Y.U;
  const S = Y.S = {};

  S.fromRows = function (rows, pal) {
    const w = Math.max(...rows.map(r => r.length)), h = rows.length;
    const c = U.canvas(w, h), g = c.getContext('2d');
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const col = pal[row[x]];
        if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
      }
    });
    return c;
  };
  S.mirror = function (src) {
    const c = U.canvas(src.width, src.height), g = c.getContext('2d');
    g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0);
    return c;
  };
  const tintCache = new Map();
  S.tint = function (src, color, key) {
    const k = key ? key + color : null;
    if (k && tintCache.has(k)) return tintCache.get(k);
    const c = U.canvas(src.width, src.height), g = c.getContext('2d');
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
    if (k) tintCache.set(k, c);
    return c;
  };

  /* ---------------- player ---------------- */
  const PP = {
    k: '#1b1424', h: '#4a3040', H: '#6e4a5c', s: '#f3cfae', S: '#d8a98a', e: '#241a2c',
    r: '#c9505c', R: '#8e3442', c: '#ecdcb6', C: '#c2ad86', p: '#3e4a6e', P: '#2c3552', b: '#2a1e2a'
  };
  const HEAD_DOWN = [
    '....kkkk....',
    '..kkhhhhkk..',
    '.khhHhhhhhk.',
    '.khHhhhhhhk.',
    '.khhhhhhhhk.',
    '.khsshhsshk.',
    '.kssssssssk.',
    '.ksessssesk.',
    '.kSssssssSk.',
    '..kSSSSSSk..'
  ];
  const BODY_DOWN = [
    '..krrrrrrk..',
    '.kcRrrrrRck.',
    '.kcccccccck.',
    '.kcCccccCck.',
    '.ksCccccCsk.',
    '..kppppppk..'
  ];
  const HEAD_UP = [
    '....kkkk....',
    '..kkhhhhkk..',
    '.khhhhhhhhk.',
    '.khhHhhHhhk.',
    '.khhhhhhhhk.',
    '.khhhhhhhhk.',
    '.khhhhhhhhk.',
    '.khhhhhhhhk.',
    '.kShhhhhhSk.',
    '..kSSSSSSk..'
  ];
  const BODY_UP = [
    '..krrrrrrk..',
    '.kcrrRrrrck.',
    '.kccccRrcck.',
    '.kcCccRrCck.',
    '.ksCccccCsk.',
    '..kppppppk..'
  ];
  const HEAD_SIDE = [
    '....kkkk....',
    '..kkhhhhkk..',
    '.khhhhHhhhk.',
    '.khhhHhhhhk.',
    '.khhhhhhhhk.',
    '.khhhhhsshk.',
    '.khhhsssssk.',
    '.khhssssesk.',
    '.khhsssssSk.',
    '..khSSSSSk..'
  ];
  const BODY_SIDE = [
    '.RkrrrrrrRk.',
    '.Rkccccccck.',
    '..kccccccck.',
    '..kcCcsCcck.',
    '..kcCcsCcck.',
    '..kppppppk..'
  ];
  const LEGS = {
    idle: ['..kpPkkPpk..', '..kbbkkbbk..'],
    a: ['..kpPkkbbk..', '..kbbk......'],
    b: ['..kbbkkPpk..', '......kbbk..'],
    sideIdle: ['...kpPPpk...', '...kbbbbbk..'],
    sideA: ['..kpk..kpk..', '.kbbk..kbbk.']
  };

  function makeSet(pal, H, B, L) {
    const build = (head, body, legs) => S.fromRows(head.concat(body, legs), pal);
    const set = {
      down: [build(H.down, B.down, L.idle), build(H.down, B.down, L.a), build(H.down, B.down, L.b)],
      up: [build(H.up, B.up, L.idle), build(H.up, B.up, L.b), build(H.up, B.up, L.a)],
      right: [build(H.side, B.side, L.sideIdle), build(H.side, B.side, L.sideA), build(H.side, B.side, L.sideIdle)]
    };
    set.left = set.right.map(S.mirror);
    set.sit = S.fromRows(H.up.concat(B.up.slice(0, 5)), pal);
    set.w = 12; set.h = 18;
    return set;
  }
  // «ти прийшов»
  S.playerM = makeSet(PP,
    { down: HEAD_DOWN, up: HEAD_UP, side: HEAD_SIDE },
    { down: BODY_DOWN, up: BODY_UP, side: BODY_SIDE }, LEGS);

  // «ти прийшла»: довге каштанове волосся, заколка-зірочка, той самий шарф, спідниця
  const PF = Object.assign({}, PP, { h: '#5c3226', H: '#86503c', y: '#ffd27a', q: '#5a4378', Q: '#46335f', l: '#3a3348' });
  S.playerF = makeSet(PF, {
    down: [
      '...kkkkkk...',
      '..khhhhhhk..',
      '.khhHhhhhhk.',
      '.khHhhhhhyk.',
      '.khhhhhhhhk.',
      '.khsshhsshk.',
      '.khsssssshk.',
      '.khsesseshk.',
      '.khSssssShk.',
      '.khhSSSShhk.'
    ],
    up: [
      '...kkkkkk...',
      '..khhhhhhk..',
      '.khhhhhhhhk.',
      '.khhHhhHhyk.',
      '.khhhhhhhhk.',
      '.khhhhhhhhk.',
      '.khhHhhhhhk.',
      '.khhhhhhhhk.',
      '.khhhhhhhhk.',
      '.khhhhHhhhk.'
    ],
    side: [
      '...kkkkkk...',
      '..khhhhhhk..',
      '.khhhhHhhhk.',
      '.khhhHhhhyk.',
      '.khhhhhhhhk.',
      '.khhhhhsshk.',
      '.khhhsssssk.',
      '.khhssssesk.',
      '.khhsssssSk.',
      '.khhhSSSSk..'
    ]
  }, {
    down: [
      '.khrrrrrrhk.',
      '.khcRrrRchk.',
      '.kcccccccck.',
      '.ksCccccCsk.',
      '.kqqqqqqqqk.',
      'kqqQqqqqQqqk'
    ],
    up: [
      '.khhhhhhhhk.',
      '.kchhhhhhck.',
      '.kccchhccck.',
      '.ksCccccCsk.',
      '.kqqqqqqqqk.',
      'kqqQqqqqQqqk'
    ],
    side: [
      '.khhkrrrrRk.',
      '.khhcccccck.',
      '..kccccccck.',
      '..kcCcsCcck.',
      '..kqqqqqqqk.',
      '.kqqQqqqqQqk'
    ]
  }, {
    idle: ['..kllkkllk..', '..kbbkkbbk..'],
    a: ['..kllkkbbk..', '..kbbk......'],
    b: ['..kbbkkllk..', '......kbbk..'],
    sideIdle: ['...kllllk...', '...kbbbbbk..'],
    sideA: ['..klk..klk..', '.kbbk..kbbk.']
  });

  // «ти прийшли»: пишне кучеряве волосся, фіолетовий шарф, жовтий светр (за моделлю автора)
  const PN = {
    k: '#1a1222', h: '#44345a', H: '#6c5490', s: '#b98262', S: '#98644a', e: '#1a1222',
    p: '#9c6cd0', P: '#7a4fae', c: '#ecd88e', C: '#c8ae68', t: '#e6dccd', T: '#c4b8a6', b: '#2a1e2a'
  };
  const CURLS_TOP = ['....kk..kk....', '..kkHhkkhHkk..', '.khhhhHhhhhhk.', 'khHhhhhhhhHhhk', 'khhhhhhhhhhhhk'];
  S.playerN = makeSet(PN, {
    down: CURLS_TOP.concat([
      'khhhsssssshhhk',
      'khhsssssssshhk',
      'khhssessesshhk',
      'khhssessesshhk',
      'khhSssssssShhk',
      '.khhSSSSSShhk.'
    ]),
    up: CURLS_TOP.concat([
      'khhhHhhhhhhhhk',
      'khhhhhhhHhhhhk',
      'khHhhhhhhhhhhk',
      'khhhhhhhhhHhhk',
      'khhhhhHhhhhhhk',
      '.khhhhhhhhhhk.'
    ]),
    side: CURLS_TOP.concat([
      'khhhhhhhhssshk',
      'khhhhhhhssssk.',
      'khhhhhhhssesk.',
      'khhhhhhhssesk.',
      'khhhhhhhSsssk.',
      '.khhhhhhSSSk..'
    ])
  }, {
    down: ['..kkppppppkk..', '..kpPppppPpk..', '.kcccccccccck.', '.kCccccccccCk.', '.ksCccccccCsk.', '..kttttttttk..'],
    up: ['..kkppppppkk..', '..kpppPPpppk..', '.kcccccccccck.', '.kCccccccccCk.', '.ksCccccccCsk.', '..kttttttttk..'],
    side: ['..kkkppppppk..', '..kpPpppppPk..', '..kcccccccck..', '..kcCccsCcck..', '..kcCccsCcck..', '...kttttttk...']
  }, {
    idle: ['..kttTkkTttk..', '..kbbbkkbbbk..'],
    a: ['..kttTkkbbbk..', '..kbbbk.......'],
    b: ['..kbbbkkTttk..', '.......kbbbk..'],
    sideIdle: ['...kttTTtk....', '...kbbbbbk....'],
    sideA: ['..ktk..ktk....', '.kbbk..kbbk...']
  });

  // the current hero follows the form chosen on the title screen
  Object.defineProperty(S, 'player', {
    get: () => {
      const f = Y.T && Y.T.form;
      return f === 'f' ? S.playerF : f === 'n' ? S.playerN : S.playerM;
    }
  });

  /* ---------------- Psyche ---------------- */
  const PSY = {
    k: '#6a58a0', h: '#f2ebff', H: '#c9b8f4', g: '#ffe3a3', s: '#fff2e6', S: '#f1d2c4', e: '#8270b4',
    w: '#fdfbff', W: '#dcd0f6', V: '#b8a8e6'
  };
  S.psyche = S.fromRows([
    '......kkkk......',
    '....kkhhhhkk....',
    '...khhhhhhhhk...',
    '..khhgghhgghhk..',
    '..khhhhhhhhhhk..',
    '..kHhssssssHhk..',
    '..kHhsessesHhk..',
    '..kHhssssssHhk..',
    '..kHhSssssSHhk..',
    '..kHhhSSSShhHk..',
    '.kHhhkwwwwkhhHk.',
    '.kHhkwwggwwkhHk.',
    '.kHhkwwwwwwkhHk.',
    '.kHkwwwwwwwwkHk.',
    '.kHkwWwwwwWwkHk.',
    '.kkswWwwwwWwskk.',
    '..kwwWwwwwWwwk..',
    '..kwwWwwwwWwwk..',
    '..kwWWwwwwWWwk..',
    '.kwwWwwwwwwWwwk.',
    '.kwwWwwwwwwWwwk.',
    '.kwWVwwwwwwVWwk.',
    '.kwWVwwwwwwVWwk.',
    'kwwWVwwwwwwVWwwk',
    'kwwWVwwwwwwVWwwk',
    'kwWVVwwwwwwVVWwk',
    'kWWVVWwwwwWVVWWk',
    '.kkkkkkkkkkkkkk.'
  ], PSY);

  /* small helper: draw the player sprite with feet at (x, y) */
  S.drawPlayer = function (ctx, p) {
    if (!p.visible) return;
    let img;
    if (p.sit) img = S.player.sit;
    else {
      const set = S.player[p.dir] || S.player.down;
      const f = p.moving ? (Math.floor(p.anim * 7) % 4) : 0;
      img = set[f === 1 ? 1 : f === 3 ? 2 : 0];
    }
    const x = Math.round(p.x - img.width / 2), y = Math.round(p.y - img.height + (p.sit ? -2 : 0));
    ctx.globalAlpha = p.alpha;
    if (p.tint) ctx.drawImage(S.tint(img, p.tint, 'pt'), x, y);
    else ctx.drawImage(img, x, y);
    ctx.globalAlpha = 1;
    return { x, y, img };
  };

  /* Psyche: robe + butterfly wings of light, floating */
  S.drawPsyche = function (ctx, x, y, t, alpha = 1) {
    if (alpha <= 0) return;
    const fy = Math.round(y - 30 + Math.sin(t * 1.3) * 1.5);
    ctx.save();
    ctx.globalAlpha = alpha;
    // wings
    const flap = 0.75 + Math.sin(t * 2.1) * 0.25;
    ctx.globalCompositeOperation = 'lighter';
    [[-1], [1]].forEach(([s]) => {
      ctx.fillStyle = 'rgba(200,180,255,0.20)';
      ctx.beginPath(); ctx.ellipse(x + s * 9 * flap, fy + 13, 9 * flap, 11, s * 0.5, 0, U.TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,220,170,0.16)';
      ctx.beginPath(); ctx.ellipse(x + s * 7 * flap, fy + 24, 6 * flap, 7, -s * 0.4, 0, U.TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath(); ctx.ellipse(x + s * 8 * flap, fy + 12, 4 * flap, 6, s * 0.5, 0, U.TAU); ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(S.psyche, Math.round(x - 8), fy);
    ctx.restore();
  };
})(window.Y);

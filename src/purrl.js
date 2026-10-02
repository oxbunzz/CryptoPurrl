// CryptoPurrls — 10,000 generative 24×24 pixel cats grown from the Purrl logo.
//
// Purrls are small chibi creatures whose big head is exactly the logo: a
// 14×14 block with a tall left peak, a shorter right peak and a notched chin.
// They stand small in the middle of a 32×32 canvas, so a round profile-picture
// crop keeps all of them. Pale flat backgrounds, soft three-tone shading, an
// outline in the body's own hue, glossy eyes and rosy cheeks.
// There are 20 Purrls and every trait value is worn by exactly one of them.
//
// The whole collection is reproducible from SEED, so anyone can regenerate it
// and check it against the provenance hash. Plain ES module with no
// dependencies: the same file renders in Node and in the browser.

export const SIZE = 32;
export const SUPPLY = 20;
export const SEED = 0x50555252; // "PURR"

export const INK = '#0b0b0d';   // logo background
export const CREAM = '#f3efe7'; // logo foreground
const WHITE = '#ffffff';
const PUPIL = '#140c1f';

// ---------------------------------------------------------------------------
// Silhouette

// The logo, one character per logo cell, placed 1:1 as the head of a chibi
// body in the middle of a 32×32 canvas, with room around it for a round crop.
const LOGO = [
  '####..........',
  '####......####',
  '####......####',
  ...Array(10).fill('##############'),
  '.############.',
];
const HEAD_X = 9, HEAD_Y = 6;
// Soften the outer top corner of each peak.
const ROUNDED = new Set([6 * 32 + 9, 7 * 32 + 22]);

// A small body under the big head: torso with arm nubs, then two feet.
const BODY = [
  '            ########            ',
  '           ##########           ',
  '           ##########           ',
  '            ########            ',
  '            ########            ',
  '            ###  ###            ',
].map((r) => r.replace(/ /g, '.'));
const BODY_Y = 20;

const inHead = (x, y) => LOGO[y - HEAD_Y]?.[x - HEAD_X] === '#' && !ROUNDED.has(y * SIZE + x);
const inBody = (x, y) => BODY[y - BODY_Y]?.[x] === '#';
const inCat = (x, y) => inHead(x, y) || inBody(x, y);
const inOutline = (x, y) => !inCat(x, y) && (inCat(x - 1, y) || inCat(x + 1, y) || inCat(x, y - 1) || inCat(x, y + 1));
const solid = (x, y) => inCat(x, y) || inOutline(x, y);

const cells = (test) => {
  const out = [];
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (test(x, y)) out.push([x, y]);
  return out;
};
const HEAD_CELLS = cells(inHead);
const CAT_CELLS = cells(inCat);
const OUTLINE_CELLS = cells(inOutline);
// One pixel beyond the outline, for glows.
const HALO_CELLS = cells((x, y) => !solid(x, y) && (inOutline(x - 1, y) || inOutline(x + 1, y) || inOutline(x, y - 1) || inOutline(x, y + 1)));

// Three soft tones: a shine on the upper left of the head, base, and shade
// on the right edge, under the head and along the bottom of every part.
const TONE = new Int8Array(SIZE * SIZE).fill(-1);
const SHINE = new Set([10 * 32 + 11, 10 * 32 + 12, 11 * 32 + 11]);
for (const [x, y] of CAT_CELLS) {
  const edge = !inCat(x + 1, y) || !inCat(x, y + 1) || (inHead(x, y) && y === HEAD_Y + 13);
  const tucked = !inHead(x, y) && y === BODY_Y;
  TONE[y * SIZE + x] = SHINE.has(y * SIZE + x) ? 0 : edge || tucked ? 2 : 1;
}
const FLAT_TONE = [0, 1, 2, 3];

// ---------------------------------------------------------------------------
// Colour

const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgbToHex = (rgb) => '#' + rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');
const clamp01 = (v) => Math.min(1, Math.max(0, v));

const MIXES = new Map();
export function mix(a, b, t) {
  let byB = MIXES.get(a);
  if (!byB) MIXES.set(a, (byB = new Map()));
  let byT = byB.get(b);
  if (!byT) byB.set(b, (byT = new Map()));
  let c = byT.get(t);
  if (c === undefined) {
    const rb = hexToRgb(b);
    byT.set(t, (c = rgbToHex(hexToRgb(a).map((v, i) => v + (rb[i] - v) * t))));
  }
  return c;
}

function toHsl(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function fromHsl(h, s, l) {
  h = (((h % 360) + 360) % 360) / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t) => {
    t = (t + 1) % 1;
    return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p;
  };
  return rgbToHex([f(h + 1 / 3), f(h), f(h - 1 / 3)].map((v) => v * 255));
}
const turn = (h, target, t) => h + (((((target - h) % 360) + 540) % 360) - 180) * t;

// Four tones from one colour, hue-shifted the way pixel artists shade: warm
// light, cool shadow.
const RAMPS = new Map();
export function ramp(base) {
  if (!RAMPS.has(base)) {
    const [h, s, l] = toHsl(base);
    RAMPS.set(base, [
      fromHsl(turn(h, 60, 0.15), clamp01(s * 0.95), clamp01(l + 0.1 + (1 - l) * 0.08)),
      base,
      fromHsl(turn(h, 255, 0.14), clamp01(s * 1.05 + 0.05), clamp01(l - 0.13)),
      fromHsl(turn(h, 265, 0.28), clamp01(s * 1.1 + 0.08), clamp01(l - 0.26)),
    ]);
  }
  return RAMPS.get(base);
}

// Deterministic per-pixel randomness and smooth value noise.
function hash(x, y, s) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x, y, s, scale) {
  const gx = x / scale, gy = y / scale, x0 = Math.floor(gx), y0 = Math.floor(gy);
  const sx = (gx - x0) ** 2 * (3 - 2 * (gx - x0)), sy = (gy - y0) ** 2 * (3 - 2 * (gy - y0));
  const top = hash(x0, y0, s) + (hash(x0 + 1, y0, s) - hash(x0, y0, s)) * sx;
  const bottom = hash(x0, y0 + 1, s) + (hash(x0 + 1, y0 + 1, s) - hash(x0, y0 + 1, s)) * sx;
  return top + (bottom - top) * sy;
}

// Flat colour bands joined by a narrow strip of ordered (Bayer 4×4) dithering.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function gradient(stops, t, x, y) {
  const v = clamp01(t) * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(v));
  const f = clamp01((v - i - 0.5) * 3 + 0.5);
  return f > (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16 ? stops[i + 1] : stops[i];
}

// ---------------------------------------------------------------------------
// Canvas

class Grid {
  constructor(seed) {
    this.px = new Array(SIZE * SIZE).fill(null);
    this.seed = seed;
    this.outlineColor = INK;
    this.ox = 0;
    this.oy = 0;
  }
  // Trait art was drawn for a head at a reference position; ox/oy move it onto this one.
  at(ox, oy, draw) {
    this.ox = ox; this.oy = oy;
    draw?.(this);
    this.ox = 0; this.oy = 0;
  }
  // Run `draw` in absolute canvas coordinates, ignoring the current offset.
  abs(draw) {
    const [ox, oy] = [this.ox, this.oy];
    this.at(0, 0, draw);
    this.ox = ox; this.oy = oy;
  }
  get(x, y) {
    x += this.ox; y += this.oy;
    return x < 0 || y < 0 || x >= SIZE || y >= SIZE ? null : this.px[y * SIZE + x];
  }
  set(x, y, c) {
    x += this.ox; y += this.oy;
    if (c && x >= 0 && y >= 0 && x < SIZE && y < SIZE) this.px[y * SIZE + x] = c;
  }
  blend(x, y, c, t) { const under = this.get(x, y); if (under) this.set(x, y, mix(under, c, t)); }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  // ASCII sprite: '.' and ' ' are transparent, every other char is looked up in `map`.
  // A map value of ['blend', colour, t] tints what is underneath instead.
  sprite(x, y, rows, map) {
    for (let j = 0; j < rows.length; j++)
      for (let i = 0; i < rows[j].length; i++) {
        const ch = rows[j][i], c = map[ch];
        if (ch === '.' || ch === ' ' || !c) continue;
        if (Array.isArray(c)) this.blend(x + i, y + j, c[1], c[2]);
        else this.set(x + i, y + j, c);
      }
  }
  // Sprite plus an automatic 1px outline wherever it borders open background.
  shape(x, y, rows, map, edge = this.outlineColor) {
    x += this.ox; y += this.oy;
    this.abs(() => this.shapeAbs(x, y, rows, map, edge));
  }
  shapeAbs(x, y, rows, map, edge) {
    const filled = new Set();
    rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.' && ch !== ' ') filled.add((y + j) * SIZE + x + i); }));
    const ring = new Set();
    for (const p of filled) {
      const px = p % SIZE, py = Math.floor(p / SIZE);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = px + dx, ny = py + dy;
        if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) continue;
        const q = ny * SIZE + nx;
        if (!filled.has(q) && !inCat(nx, ny)) ring.add(q);
      }
    }
    for (const q of ring) this.set(q % SIZE, Math.floor(q / SIZE), edge);
    this.sprite(x, y, rows, map);
  }
  glow(x, y, c, t = 0.3, r = 1) {
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i || j) this.blend(x + i, y + j, c, t / Math.max(Math.abs(i), Math.abs(j)));
  }
}

// ---------------------------------------------------------------------------
// Backgrounds

// One pale flat colour each, so the cat carries all the colour.
const flat = (c) => ({ paint: () => c });
const BACKGROUNDS = [
  ['Bubblegum', 10, flat('#ffdcee')],
  ['Tangerine', 10, flat('#ffe2c7')],
  ['Lemon', 10, flat('#fff5c2')],
  ['Lime', 9, flat('#e4f7c8')],
  ['Mint', 9, flat('#d2f5ea')],
  ['Sky', 10, flat('#d6eeff')],
  ['Periwinkle', 9, flat('#dfe3ff')],
  ['Lavender', 9, flat('#ebdfff')],
  ['Coral', 8, flat('#ffdcdb')],
  ['Peach', 8, flat('#ffeadb')],
  ['Purrl Blue', 6, flat('#dbe5ec')],
  ['Cloud', 6, flat('#f3f2f7')],
  ['Gold', 1, flat('#f7e3a3')],
  ['Pearl', 1, flat('#f6eefb')],
  ['Aqua', 1, flat('#d2f6f6')],
  ['Sage', 1, flat('#e2ecd8')],
  ['Sand', 1, flat('#f3e9d6')],
  ['Mauve', 1, flat('#efdce9')],
  ['Butter', 1, flat('#fdf0d0')],
];

function paintBackground(g, bg) {
  g.rect(0, 0, SIZE, SIZE, bg.paint());
}

// ---------------------------------------------------------------------------
// Bodies. Each has a base colour (expanded to a ramp) and optionally a
// pattern (extra materials) or a procedural painter. Patterned bodies vary per Purrl.

const FURS = {
  Cream:     { base: CREAM },
  Smoke:     { base: '#9ea9c8' },
  Midnight:  { base: '#2c2645' },
  Bubblegum: { base: '#ff9fd0' },
  Mint:      { base: '#87e9cd' },
  Lilac:     { base: '#b9a4ff' },
  Tiger:     { base: '#ff8a1f', pattern: tiger, stripe: '#2a1622', bib: '#fff1dc' },
  Leopard:   { base: '#f3c55b', pattern: leopard, spot: '#3a2418', spotCore: '#cf8a36' },
  Moo:       { base: '#fbfbff', pattern: moo, spot: '#25222f' },
  Neon:      { base: '#211a3b', pattern: neon, stripeA: '#ff4fd8', stripeB: '#3ff2ff' },
  Rainbow:   { base: '#ff6b8b', pattern: rainbow },
  Zombie:    { base: '#8fc27a', pattern: zombie, stitch: '#3a2a3a', patch: '#79b0a8' },
  Glitch:    { base: '#5b5bff', paint: glitchFur, post: glitchPost },
  Lava:      { base: '#2e1d26', paint: lavaFur },
  Crystal:   { base: '#bff4ff', paint: crystalFur },
  Chrome:    { base: '#c8d3e0', paint: chromeFur },
  Cosmic:    { base: '#251654', paint: cosmicFur },
  Gold:      { base: '#f0b72f', paint: goldFur, ramp: ['#fff0a3', '#f0b72f', '#c27a17', '#7f4211'] },
  Void:      { base: '#06050b', ramp: ['#17112a', '#08070f', '#040309', '#000000'], outline: '#a37bff', glow: '#8a5cff' },
  Pearl:     { base: '#f8f4ff', paint: pearlFur },
};
for (const [name, fur] of Object.entries(FURS)) fur.name = name;

// Pattern helpers write materials into the material map.
function tiger(m, f) {
  m.def('s', f.stripe); m.def('w', f.bib);
  m.sprite(5, 12, ['..............', '....wwwwww....', '...wwwwwwww...', '...wwwwwwww...', '....wwwwww....'], 'w');
  m.sprite(5, 7, ['...s.s..s.s...', '...s.s..s.s...', '....s....s....'], 's');
  m.sprite(5, 11, ['sss........sss', '..............', 'ss..........ss', '..............', 's............s'], 's');
  m.sprite(5, 19, ['..ss......ss..', '.s..........s.', '.sss......sss.', 's............s', 'ss..........ss'], 's');
}
function leopard(m, f, seed) {
  m.def('s', f.spot); m.def('c', f.spotCore);
  const spots = [[6, 8], [15, 8], [9, 7], [5, 12], [17, 13], [6, 15], [16, 16], [8, 20], [14, 21], [11, 22], [6, 22], [17, 20]];
  for (const [x, y] of spots) {
    const dx = Math.floor(hash(x, y, seed) * 2), dy = Math.floor(hash(y, x, seed) * 2);
    m.sprite(x + dx - 1, y + dy - 1, hash(x, y, seed + 1) < 0.5 ? ['s.', 'cs'] : ['ss', 's.'], 'sc');
  }
}
function moo(m, f, seed) {
  m.def('s', f.spot);
  for (const [x, y] of CAT_CELLS) if (noise(x, y, seed, 3.5) > 0.64) m.set(x, y, 's');
}
function neon(m, f) {
  m.def('a', f.stripeA); m.def('b', f.stripeB);
  m.sprite(5, 7, ['....a.bb.a....', '....a....a....'], 'ab');
  m.sprite(5, 12, ['aa..........bb', '..............', 'b............a'], 'ab');
  m.sprite(5, 19, ['..a........b..', '.aa........bb.', '..............', 'bb..........aa'], 'ab');
}
function rainbow(m) {
  const bands = ['#ff5f7e', '#ff9f43', '#ffd93d', '#6bdc8a', '#4fb3ff', '#9b7bff'];
  bands.forEach((c, i) => m.def('r' + i, c));
  for (const [x, y] of CAT_CELLS) m.set(x, y, 'r' + (Math.floor((y - 4) / 3.4) % bands.length));
}
function zombie(m, f) {
  m.def('k', f.stitch); m.def('p', f.patch);
  m.sprite(14, 14, ['ppp', 'ppp', '.pp'], 'p');
  m.sprite(13, 8, ['.k.k.', 'kkkkk', '.k.k.'], 'k');
  m.sprite(6, 19, ['.k.', 'kkk', '.k.', 'kkk', '.k.'], 'k');
}

// Procedural painters: (x, y, tone, seed, under) → colour, for 'fur' pixels.
const q = (v, steps = 6) => Math.round(clamp01(v) * steps) / steps;
function glitchFur(x, y, tone, seed) {
  const band = Math.floor(hash(0, Math.floor(y / 2), seed) * 3);
  return ramp(['#5b5bff', '#ff3df2', '#2ee8ff'][band])[tone];
}
function lavaFur(x, y, tone, seed) {
  const n = Math.abs(noise(x, y, seed, 4) - 0.5);
  if (n < 0.035) return tone < 2 ? '#fff1a0' : '#ffd23f';
  if (n < 0.075) return tone < 2 ? '#ff8a1f' : '#e8501a';
  return ramp('#2e1d26')[tone];
}
function crystalFur(x, y, tone, seed, under) {
  if (hash(x, y, seed) < 0.02) return WHITE;
  const facet = ['#effdff', '#bff4ff', '#8fd8ff', '#cdb8ff'][Math.floor(noise(x, y, seed, 5) * 4)];
  return mix(under, ramp(facet)[tone], 0.82);
}
function chromeFur(x, y, tone) {
  // Horizon-reflection bands, like polished chrome.
  const bands = { 4: '#f2f8ff', 7: '#dfeaf7', 10: '#a9bdd4', 12: '#384861', 14: '#d0a77f', 16: '#8a6a52', 18: '#384861', 20: '#bccde0', 22: '#eef5ff' };
  let c = '#f2f8ff';
  for (const [from, col] of Object.entries(bands)) if (y >= +from) c = col;
  return ramp(c)[tone];
}
function cosmicFur(x, y, tone, seed) {
  const r = hash(x, y, seed);
  if (r < 0.035) return '#fff4c8';
  if (r < 0.06) return '#a99cff';
  let c = ramp('#251654')[tone];
  const a = noise(x, y, seed, 4), b = noise(x + 40, y, seed, 5);
  if (a > 0.58) c = mix(c, '#d43fd0', q((a - 0.58) * 2.2, 5));
  if (b > 0.62) c = mix(c, '#36d6f0', q((b - 0.62) * 2.2, 5));
  return c;
}
function goldFur(x, y, tone) {
  if (x - y === 3 || x - y === 4) return tone < 2 ? '#fff6c8' : '#ffe08a';
  return FURS.Gold.ramp[tone];
}
function pearlFur(x, y, tone, seed) {
  const bands = ['#ffd9ee', '#fff1dc', '#d9fff1', '#d9ecff', '#ecdcff'];
  return ramp(bands[(Math.floor((x + y) / 3) + (seed % 5)) % bands.length])[tone];
}

// Chromatic aberration plus a few torn scanlines.
function glitchPost(g) {
  const copy = g.px.slice();
  for (const [x, y] of OUTLINE_CELLS) {
    if (!solid(x - 1, y)) g.blend(x - 1, y, '#ff2a6d', 0.7);
    if (!solid(x + 1, y)) g.blend(x + 1, y, '#2af5ff', 0.7);
  }
  for (let k = 0; k < 3; k++) {
    const y = 8 + Math.floor(hash(k, 9, g.seed) * (SIZE - 10)), shift = [-2, -1, 1, 2][Math.floor(hash(k, 10, g.seed) * 4)];
    for (let x = 2; x < SIZE - 2; x++) g.set(x, y, copy[y * SIZE + Math.min(SIZE - 3, Math.max(2, x - shift))]);
  }
}


// ---------------------------------------------------------------------------
// Traits. Each option: [name, weight, draw?, flags?]

// --- Eyes: 3×4 at both anchors, big and glossy ---------------------------------

const EYE_L = [12, 13], EYE_R = [17, 13];
const both = (draw, right = draw) => (g) => { draw(g, EYE_L); right(g, EYE_R); };
const eyeArt = (rows, map) => (g, [x, y]) => g.sprite(x, y, rows, map);
// Dark at the top fading into a bright iris, with a big and a small highlight.
const sparkle = (iris) => eyeArt(['kkk', 'wkk', 'kIw', 'iii'], { k: PUPIL, w: WHITE, I: ramp(iris)[2], i: iris });
const happy = eyeArt(['...', '.k.', 'k.k', '...'], { k: PUPIL });
const MAP_K = { k: PUPIL };

const EYES = [
  ['Sky Sparkle', 1, both(sparkle('#4fb3ff'))],
  ['Rose Sparkle', 1, both(sparkle('#ff5fa2'))],
  ['Leaf Sparkle', 1, both(sparkle('#3fd17a'))],
  ['Grape Sparkle', 1, both(sparkle('#a46bff'))],
  ['Honey Sparkle', 1, both(sparkle('#ffb52e'))],
  ['Hearts', 1, both(eyeArt(['h.h', 'hHh', 'hhh', '.h.'], { h: '#ff3d8b', H: '#ffc2dc' }))],
  ['Stars', 1, both(eyeArt(['.y.', 'yWy', '.y.', 'y.y'], { y: '#ffc93d', W: WHITE }))],
  ['Happy', 1, both(happy)],
  ['Sleepy', 1, both(eyeArt(['...', '...', 'kkk', '...'], MAP_K))],
  ['Wink', 1, both(sparkle('#4fb3ff'), happy)],
  ['Teary', 1, (g) => {
    both(sparkle('#7fd6ff'))(g);
    g.sprite(11, 16, ['t', 't'], { t: '#8fdcff' });
    g.sprite(20, 16, ['t', 't'], { t: '#8fdcff' });
  }],
  ['Dizzy', 1, both(eyeArt(['kkk', '..k', 'k.k', 'kkk'], MAP_K))],
  ['Squint', 1, both(eyeArt(['k..', '.k.', 'k..', '...'], MAP_K), eyeArt(['..k', '.k.', '..k', '...'], MAP_K))],
  ['Cyclops', 1, (g) => g.sprite(13, 12, ['.kkkk.', 'kwkkkk', 'kkkkwk', 'kiiiik', '.iiii.'], { k: PUPIL, w: WHITE, i: '#ff4f8b' })],
  ['Odd Eyes', 1, both(sparkle('#4fb3ff'), sparkle('#ffb52e'))],
  ['Laser', 1, (g) => {
    for (const [x, y] of [EYE_L, EYE_R]) {
      const out = x < 15 ? -1 : 1;
      for (let i = 1; i < SIZE; i++) {
        const bx = out < 0 ? x - i : x + 2 + i;
        g.set(bx, y + 2, '#fff2b0');
        g.blend(bx, y + 1, '#ff2a4a', 0.7);
        g.blend(bx, y + 3, '#ff2a4a', 0.7);
      }
      g.sprite(x, y, ['rrr', 'rwr', 'rrr', 'rrr'], { r: '#ff2a1f', w: '#fff3ef' });
    }
  }],
  ['Galaxy', 1, both(eyeArt(['kkk', 'wkk', 'kgy', 'ggg'], { k: '#120a2e', w: WHITE, g: '#5a3fd6', y: '#ffe36b' }))],
  ['Shades', 1, (g) => g.sprite(10, 13, [
    'kkkkkkkkkkkk',
    '.kgLLkkgLLk.',
    '..kkk..kkk..',
  ], { k: INK, g: '#6f7f99', L: '#2b3340' })],
  ['Heart Glasses', 1, (g) => g.sprite(10, 13, [
    'HH.HH.HH.HH',
    'HHHHHkHHHHH',
    '.HHH...HHH.',
    '..H.....H..',
  ], { H: '#ff3d8b', k: '#b0185a' })],
  ['Round Specs', 1, (g) => {
    both(sparkle('#3fd17a'))(g);
    g.sprite(11, 12, ['.kkk..kkk.', 'k...kk...k', 'k...k....k'.replace('k....k', 'k...k'), 'k...kk...k', '.kkk..kkk.'].map((r) => r.slice(0, 10)), { k: '#4a2a18' });
  }],
];

// --- Mouth: tiny and centred under the eyes ---------------------------------------

const MOUTHS = [
  ['Smile', 1, (g) => g.sprite(14, 17, ['k..k', '.kk.'], MAP_K)],
  ['Open', 1, (g) => g.sprite(14, 17, ['kkkk', 'krpk', '.kk.'], { k: PUPIL, r: '#8e2b3a', p: '#ff7a9a' })],
  ['Blep', 1, (g) => g.sprite(14, 17, ['.kk.', '.pp.'], { k: PUPIL, p: '#ff6f91' })],
  ['Fang', 1, (g) => g.sprite(14, 17, ['k..k', '.kk.', '.w..'], { k: PUPIL, w: WHITE })],
  ['Tiny O', 1, (g) => g.sprite(15, 17, ['kk', 'kk'], MAP_K)],
  ['Grin', 1, (g) => g.sprite(13, 17, ['kkkkkk', 'kwwwwk', '.kkkk.'], { k: PUPIL, w: WHITE })],
  ['Pout', 1, (g) => g.sprite(15, 17, ['kk', '.k', 'kk'], MAP_K)],
  ['Wavy', 1, (g) => g.sprite(13, 17, ['k.k.k', '.k.k.'], MAP_K)],
  ['Kiss', 1, (g) => g.sprite(14, 17, ['.rr.', 'rRRr', '.rr.'], { r: '#ff3d6e', R: '#ff9cb8' })],
  ['Bubblegum', 1, (g) => g.sprite(13, 16, ['.pppp.', 'pPwPPp', 'pPPPPp', '.pppp.'], { p: '#f27ab0', P: '#fbb8d6', w: WHITE })],
  ['Lollipop', 1, (g) => g.sprite(14, 15, ['....pPp', '....PwP', 'k..kpPp', '.kk.w..', '....w..'], { k: PUPIL, p: '#ff5fa2', P: '#ffd23f', w: WHITE })],
  ['Drool', 1, (g) => g.sprite(14, 17, ['k..k', '.kkd', '...d'], { k: PUPIL, d: '#8fdcff' })],
  ['Surprised', 1, (g) => g.sprite(14, 17, ['.kk.', 'krrk', '.kk.'], { k: PUPIL, r: '#8e2b3a' })],
  ['Smirk', 1, (g) => g.sprite(14, 17, ['...k', 'kkk.'], MAP_K)],
  ['Gold Grill', 1, (g) => g.sprite(14, 17, ['kkkk', 'kgGk', '.kk.'], { k: PUPIL, g: '#ffd75e', G: '#fff3b8' })],
  ['Rainbow Tongue', 1, (g) => g.sprite(14, 17, ['kkkk', '.RO.', '.YG.', '.BB.'], { k: PUPIL, R: '#ff5f7e', O: '#ff9f43', Y: '#ffd93d', G: '#6bdc8a', B: '#4fb3ff' })],
  ['Diamond Grill', 1, (g) => g.sprite(14, 17, ['kkkk', 'kdDk', '.kk.'], { k: PUPIL, d: '#8ff3ff', D: WHITE })],
  ['Fish', 1, (g) => g.sprite(14, 16, ['..kkkk..k', '.kssssSkk', 'kwkssSSkk', '.kssssSkk', '..kkkk..k'], { k: PUPIL, s: '#b3d3e6', S: '#7ea9c4', w: WHITE })],
  ['Zipper', 1, (g) => g.sprite(13, 17, ['kskskk', '.....s'], { k: PUPIL, s: '#c9d3e6' })],
  ['Fire Breath', 1, (g) => g.sprite(14, 16, ['.kk...rr..', 'kooorrooor', 'kyywyyyyor', 'kooooyyoor', '.kk.rrooo.'], { k: PUPIL, w: WHITE, y: '#ffe36b', o: '#ff8a1f', r: '#e83a2a' })],
];

const EYE_STYLES = EYES;

// --- Headwear (optional). Hats sit in the logo's notch, between the ears. ----------------

const HEADWEAR = [
  ['None', 34],
  ['Top Hat', 5, (g) => g.sprite(8, 0, [
    '.kkkkkk.',
    '.kHHhHk.',
    '.kHHhHk.',
    '.kHHhHk.',
    '.krrrrk.',
    'kkkkkkkk',
    'kHHHHHHk',
  ], { k: INK, H: '#2f2f3d', h: '#4a4a5e', r: '#d23a52' })],
  ['Crown', 1, (g) => g.sprite(8, 0, [
    '.k.kk.k.',
    'kgkggkgk',
    'kgWgggGk',
    'kgrggbGk',
    'kggggggk',
    'kGGGGGGk',
    'kkkkkkkk',
  ], { k: INK, g: '#ffd35a', G: '#c9902a', W: '#fff6c8', r: '#ff3d5a', b: '#3d8bff' })],
  ['Halo', 3, (g) => {
    for (let x = 7; x < 17; x++) { g.blend(x, 3, '#fff3a8', 0.25); }
    g.sprite(7, 0, ['.yyyyyyyy.', 'y.wwwwww.y', '.yyyyyyyy.'], { y: '#ffe27a', w: ['blend', '#fff7c2', 0.45] });
  }],
  ['Party Hat', 4, (g) => g.sprite(8, 0, [
    '...ww...',
    '...kk...',
    '..kypk..',
    '..kpyk..',
    '.kyypyk.',
    '.kpyypk.',
    'kkkkkkkk',
  ], { k: INK, y: '#ffd166', p: '#ef476f', w: WHITE })],
  ['Wizard Hat', 3, (g) => g.sprite(7, 0, [
    '......kk..',
    '.....kpk..',
    '....kppk..',
    '....kpyk..',
    '...kpppk..',
    '...kppPPk.',
    'kkkkkkkkkk',
  ], { k: INK, p: '#6a46c9', P: '#4a2e99', y: '#ffd166' })],
  ['Beanie', 5, (g) => g.sprite(8, 0, [
    '...ww...',
    '..kwwk..',
    '.kbbbBk.',
    '.kbbbBk.',
    '.kbbbBk.',
    'kcCcCcCk',
    'kCcCcCck',
  ], { k: INK, w: WHITE, b: '#2fb8a0', B: '#1f8a78', c: '#ffd166', C: '#ff9f43' })],
  ['Headphones', 5, (g) => {
    g.sprite(4, 1, ['...kkkkkkkkkk...', '..k..........k..', '.k............k.'], { k: INK });
    g.sprite(2, 9, ['.kk', 'kpk', 'kPk', 'kpk', '.kk'], { k: INK, p: '#ff6bd6', P: '#3ff2ff' });
    g.sprite(19, 9, ['kk.', 'kpk', 'kPk', 'kpk', 'kk.'], { k: INK, p: '#ff6bd6', P: '#3ff2ff' });
  }],
  ['Bow', 4, (g) => g.sprite(14, 2, ['kk...kk', 'kpk.kPk', 'kppkpPk', 'kpk.kPk', 'kk...kk'], { k: INK, p: '#ff7ab8', P: '#e04f92' })],
  ['Flower', 4, (g) => g.shape(4, 2, ['.p.', 'pyp', '.p.', '.g.'], { p: '#ff9fd0', y: '#ffd166', g: '#5abf6a' })],
  ['Devil Horns', 3, (g) => {
    g.shape(4, 0, ['h...', 'rr..', '.rR.', '..rR'], { h: '#ff9a9a', r: '#e8283c', R: '#9a1024' });
    g.shape(16, 1, ['...h', '..rr', '.rR.', 'rR..'], { h: '#ff9a9a', r: '#e8283c', R: '#9a1024' });
  }],
  ['Unicorn Horn', 2, (g) => {
    g.glow(12, 2, '#fff3a8', 0.25, 2);
    g.shape(11, 0, ['.w', '.p', 'yp', 'pc', 'cy', 'yp'], { w: WHITE, p: '#ff8fd8', y: '#ffe36b', c: '#7ff3ff' });
  }],
  ['Mushroom', 3, (g) => g.shape(8, 0, [
    '..RRRR..',
    '.RwRRwR.',
    'RRRRwRRr',
    '.rrrrrr.',
    '...sS...',
    '...sS...',
  ], { R: '#ff3b4f', r: '#b81f3a', w: '#fff4e8', s: '#f5e6d0', S: '#d4bfa0' })],
  ['Flame', 2, (g) => {
    const map = { r: '#e8283c', o: '#ff8a1f', y: '#ffd23f', w: '#fff3b0' };
    g.sprite(5, 0, ['.r..', 'ror.', 'oyo.', 'oyoo'], map);
    g.sprite(9, 0, ['..r...', '.ror..', '.oyor.', 'roywor', 'roywyo', '.oyyo.'], map);
    g.sprite(15, 1, ['..r.', '.ror', 'royo', 'oyyo'], map);
    for (let x = 4; x < 20; x++) g.blend(x, 0, '#ff8a1f', 0.15);
  }],
  ['Antenna', 3, (g) => {
    for (const x of [9, 14]) g.glow(x, 1, '#c6ff4f', 0.35);
    g.sprite(9, 0, ['g....g', 'G....G', 'k....k', '.k..k.', '.k..k.', '.k..k.'], { g: '#e8ff9a', G: '#a8f03a', k: INK });
  }],
  ['Crystal Shards', 2, (g) => {
    g.glow(11, 2, '#7ff3ff', 0.25, 2);
    g.shape(8, 0, ['...cC...', '...cC...', '..ccCm..', 'c.ccCmM.', 'cCccCmM.', 'cC.cCmM.'], { c: '#9ff6ff', C: '#3fbde0', m: '#ffa6f0', M: '#d94fd0' });
  }],
  ['Brain Jar', 1, (g) => {
    for (let y = 1; y < 6; y++) for (let x = 9; x < 15; x++) g.blend(x, y, '#c8f6ff', 0.3);
    g.sprite(8, 0, [
      '..gggg..',
      '.g....g.',
      'g..pp..g',
      'g.pPpp.g',
      'g.ppPp.g',
      'mmmmmmmm',
      'MMMMMMMM',
    ], { g: '#e6fcff', p: '#ff9fc4', P: '#d9557f', m: '#c9d3e6', M: '#7d8aa3' });
  }],
  ['Orbit', 2, (g) => orbit(g, 'front'), { back: (g) => orbit(g, 'back') }],
  ['Sprout', 1, (g) => g.shape(10, 0, ['GG..', 'gGgg', '..gG', '..s.', '..s.', '..s.'], { g: '#5fd16a', G: '#2f9a4a', s: '#2f9a4a' })],
  ['Propeller Cap', 1, (g) => g.sprite(8, 0, [
    'rrrkbbbb',
    '...k....',
    '..kkkk..',
    '.krryyk.',
    'kyybbrrk',
    'kkkkkkkk',
  ], { k: INK, r: '#ff3d5a', b: '#3d8bff', y: '#ffd23f' })],
  ['Bandana', 1, (g) => g.sprite(4, 7, [
    'kkkkkkkkkkkkkkkk..',
    'krrwwrrrrwrrrrrrkk',
    'kkkkkkkkkkkkkkkkrk',
    '.................k',
  ], { k: INK, r: '#3d8bff', w: WHITE })],
];

// A ring that circles the head: the far half is drawn behind the cat, the near half in front.
function orbit(g, side) {
  for (let a = 0; a < 360; a += 2) {
    const rad = (a * Math.PI) / 180, front = Math.sin(rad) >= 0;
    if (front !== (side === 'front')) continue;
    g.set(Math.round(11.5 + 10.5 * Math.cos(rad)), Math.round(5 + 2.4 * Math.sin(rad)), front ? '#ffd166' : '#b9852f');
  }
  if (side === 'front') g.sprite(3, 5, ['cc', 'Cc'], { c: '#7ff3ff', C: '#2fa6d9' });
  else g.sprite(18, 2, ['p'], { p: '#ff7ad9' });
}

// --- Outfit (body). Cloth outfits are materials, so they pick up the shading. ---------

const OUTFITS = [
  ['None', 26],
  ['Collar & Bell', 14, (g) => {
    g.rect(7, 18, 10, 1, '#e8344f');
    g.sprite(11, 18, ['yW', 'Yy'], { y: '#ffd35a', Y: '#b5862a', W: '#fff6c8' });
  }],
  ['Gold Chain', 8, (g) => g.sprite(7, 18, ['g........g', 'G........G', '.g......g.', '..GgWgGg..', '....yy....'], { g: '#ffd35a', G: '#c9902a', W: '#fff6c8', y: '#ffd35a' })],
  ['Pearl Necklace', 3, (g) => g.sprite(7, 18, ['k........k', 'p........p', 'kp......pk', '.kpqpqpqk.', '..kkkkkk..'], { p: '#fdfbf7', q: '#e6def0', k: '#8f87a3' })],
  ['Bow Tie', 8, (g) => g.sprite(9, 18, ['kk..kk', 'kbkkbk', 'kbBBbk', 'kbkkbk', 'kk..kk'], { k: INK, b: '#e8344f', B: '#ff8095' })],
  ['Hoodie', 8, { mat: { '#': '#7b5cff' }, rows: 'body' }, (g) => g.sprite(9, 20, ['w....w', 'w....w', '..kk..'], { w: '#f2eeff', k: '#4a33b0' })],
  ['Suit', 6, { mat: { '#': '#2a2d3d' }, rows: 'body' }, (g) => g.sprite(9, 18, ['.wwww.', '.wrrw.', '..wr..', '..rr..', '..rr..', '..rr..'], { w: '#f4f4f4', r: '#e8344f' })],
  ['Scarf', 6, (g) => g.sprite(6, 17, ['.ssssssssss.', 'ssSsSsSsSsss', '.......sSs..', '.......sSs..', '.......c.c..'], { s: '#ff9f43', S: '#e86a2a', c: '#fff1dc' })],
  ['Astronaut', 3, { mat: { '#': '#eef1f8' }, rows: 'body' }, (g) => {
    g.rect(7, 18, 10, 1, '#9aa6c0');
    g.sprite(8, 20, ['bbr', 'rbb'], { b: '#3d6fff', r: '#ff3d5a' });
    g.sprite(14, 21, ['oo', 'og'], { o: '#ff9f43', g: '#3fd17a' });
  }],
  ['Armor', 3, { mat: { '#': '#9aa8bf' }, rows: 'body' }, (g) => {
    g.rect(7, 18, 10, 1, '#ffd35a');
    g.sprite(6, 20, ['g..........g', '.r........r.', 'gggggggggggg', '.r........r.'], { g: '#ffd35a', r: '#e6ecf5' });
  }],
  ['Kimono', 3, { mat: { '#': '#e8344f' }, rows: 'body' }, (g) => {
    g.sprite(7, 18, ['ww......ww', '.ww....ww.', '..ww..ww..'], { w: '#fff1dc' });
    g.rect(5, 22, 14, 1, '#ffd35a');
    g.sprite(8, 20, ['f', '.', '.', 'f'], { f: '#ffc2dc' });
    g.sprite(15, 19, ['f'], { f: '#ffc2dc' });
  }],
  ['Puffer', 4, { mat: { '#': '#3fc8ff' }, rows: 'body' }, (g) => g.abs(() => {
    for (const [x, y] of CAT_CELLS) if (y >= BODY_Y && (y - BODY_Y) % 2 === 1) g.blend(x, y, '#1a3f9a', 0.35);
    g.rect(15, BODY_Y, 2, 5, '#3a3a4a');
  })],
  ['Tie-Dye', 1, (g) => g.abs(() => {
    const cs = ['#ff7ab8', '#ffd23f', '#3fc8ff', '#8f7bff'];
    for (const [x, y] of CAT_CELLS) if (y >= BODY_Y) g.set(x, y, ramp(cs[Math.floor((x + 2 * y) / 3) % cs.length])[TONE[y * SIZE + x] > 1 ? 2 : 1]);
  })],
  ['Overalls', 1, { mat: { '#': '#3d6fff' }, rows: 'body' }, (g) => {
    g.sprite(7, 18, ['wkwwwwwwkw', 'wkwwwwwwkw'], { w: '#fff1dc', k: '#2a4fc9' });
    g.set(8, 20, '#ffd35a'); g.set(15, 20, '#ffd35a');
  }],
  ['Hawaiian Shirt', 1, { mat: { '#': '#2fc0a0' }, rows: 'body' }, (g) => {
    for (const [x, y] of [[7, 20], [10, 22], [14, 19], [16, 22], [12, 20], [6, 22]]) { g.set(x, y, '#ff7ab8'); g.set(x + 1, y, '#ffd23f'); }
  }],
  ['Jersey', 1, { mat: { '#': '#e8344f' }, rows: 'body' }, (g) => {
    g.rect(7, 18, 10, 1, WHITE);
    g.sprite(10, 20, ['www', '..w', '.ww', '..w', 'www'].slice(0, 4), { w: WHITE });
    g.sprite(13, 20, ['w', 'w', 'w', 'w'], { w: WHITE });
  }],
  ['Lab Coat', 1, { mat: { '#': '#f4f6fb' }, rows: 'body' }, (g) => {
    g.sprite(9, 18, ['k....k', '.k..k.', '..kk..'], { k: '#9aa6c0' });
    g.sprite(7, 20, ['b', 'b'], { b: '#3d6fff' });
  }],
  ['Striped Sweater', 1, { mat: { '#': '#ffd23f' }, rows: 'body' }, (g) => {
    g.abs(() => { for (const [x, y] of CAT_CELLS) if (y > BODY_Y && (y - BODY_Y) % 2 === 0) g.set(x, y, '#e8344f'); });
  }],
  ['Cape', 1, { mat: { '#': '#7a2fd6' }, rows: 'body' }, (g) => {
    g.sprite(9, 18, ['.gggg.'], { g: '#ffd35a' });
    for (let y = 19; y < 24; y++) { g.set(y < 20 ? 7 : 6, y, '#e8344f'); g.set(y < 20 ? 16 : 17, y, '#e8344f'); }
  }],
  ['Medal', 1, (g) => g.sprite(10, 18, ['r..b', '.rb.', '.gg.', 'gWgg', '.gg.'], { r: '#e8344f', b: '#3d8bff', g: '#ffd35a', W: '#fff6c8' })],
  ['Rune Robe', 2, { mat: { '#': '#3a2266' }, rows: 'body' }, (g) => {
    for (const [x, y] of [[7, 20], [9, 22], [14, 20], [16, 22], [12, 21]]) { g.set(x, y, '#3ff2ff'); g.glow(x, y, '#3ff2ff', 0.2); }
    g.rect(7, 18, 10, 1, '#ffd35a');
  }],
];


// ---------------------------------------------------------------------------
// Generation

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}


const byName = (list) => Object.fromEntries(list.map((o) => [o[0], o]));
const TABLES = {
  Background: byName(BACKGROUNDS),
  Eyes: byName(EYE_STYLES),
  Mouth: byName(MOUTHS),
  Headwear: byName(HEADWEAR),
  Outfit: byName(OUTFITS),
};

export const TRAIT_TYPES = ['Body', 'Background', 'Eyes', 'Mouth', 'Headwear', 'Outfit'];

// Every trait value in these pools is worn by exactly one Purrl.
const BODIES = ['Cream', 'Smoke', 'Midnight', 'Bubblegum', 'Mint', 'Lilac', 'Tiger', 'Leopard', 'Moo', 'Neon',
  'Rainbow', 'Zombie', 'Glitch', 'Lava', 'Crystal', 'Chrome', 'Cosmic', 'Gold', 'Void', 'Pearl'];
const POOLS = {
  Body: BODIES,
  Background: BACKGROUNDS.map((o) => o[0]),
  Eyes: EYE_STYLES.map((o) => o[0]),
  Mouth: MOUTHS.map((o) => o[0]),
  Headwear: HEADWEAR.map((o) => o[0]).filter((n) => n !== 'None'),
  Outfit: OUTFITS.map((o) => o[0]).filter((n) => n !== 'None'),
};

// Purrl #0 is the logo itself, extruded into a prism.
export const GENESIS = { id: 0, Body: 'Genesis', Background: 'Ink' };

// Traits that would vanish into a body of the same colour.
const CLASHES = {
  Gold: ['Gold Chain', 'Gold Grill', 'Medal', 'Gold', 'Lemon', 'Tangerine', 'Butter', 'Sand'],
  Void: ['Shades', 'Void'],
  Neon: ['Neon Visor'],
  Bubblegum: ['Bubblegum', 'Coral', 'Mauve', 'Bubblegum'],
  Mint: ['Mint', 'Aqua', 'Sage', 'Lime'],
  Lilac: ['Lavender', 'Periwinkle', 'Mauve'],
  Tiger: ['Tangerine', 'Peach'],
  Cream: ['Cloud', 'Pearl', 'Sand', 'Butter'],
  Moo: ['Cloud', 'Pearl', 'Sand'],
  Pearl: ['Cloud', 'Pearl', 'Lavender', 'Mauve'],
  Chrome: ['Armor', 'Cloud'],
  Smoke: ['Purrl Blue', 'Cloud'],
  Crystal: ['Sky', 'Aqua'],
};

// The full, deterministic collection: Genesis plus SUPPLY - 1 Purrls. Each pool
// is shuffled and dealt out, so no trait value appears twice; the deal is
// redone until no Purrl wears a trait that clashes with its body.
export function generateCollection(seed = SEED) {
  const rand = mulberry32(seed);
  const shuffle = (list) => {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  for (;;) {
    const dealt = Object.fromEntries(TRAIT_TYPES.map((k) => [k, shuffle(POOLS[k])]));
    const items = [GENESIS];
    for (let i = 0; i < SUPPLY - 1; i++) items.push({ id: i + 1, ...Object.fromEntries(TRAIT_TYPES.map((k) => [k, dealt[k][i]])) });
    if (items.every((t) => !TRAIT_TYPES.some((k) => k !== 'Body' && CLASHES[t.Body]?.includes(t[k])))) return items;
  }
}

// ---------------------------------------------------------------------------
// Rendering

// Build-up stages, for showing how a Purrl grows out of the logo.
export const STAGES = ['Logo', 'Silhouette', 'Light', 'Face', 'Traits'];

// Genesis: the logo extruded three pixels deep through a prism, on ink.
function genesis(g) {
  g.rect(0, 0, SIZE, SIZE, INK);
  const prismStops = ['#ff5fa2', '#ffb36b', '#ffe66b', '#6bf0a8', '#4fc3ff', '#a98bff'];
  for (let depth = 3; depth >= 1; depth--)
    for (const [x, y] of HEAD_CELLS) {
      const c = prismStops[Math.floor((x + y + depth) / 3) % prismStops.length];
      g.set(x + depth, y + depth, mix(c, INK, depth * 0.17));
    }
  for (const [x, y] of HEAD_CELLS) {
    const edgeL = !inHead(x - 1, y) || !inHead(x, y - 1), edgeR = !inHead(x + 1, y) || !inHead(x, y + 1);
    g.set(x, y, edgeL ? WHITE : edgeR ? '#e2d8ca' : CREAM);
  }
}

// Returns SIZE×SIZE hex colours, row-major. `stage` stops the build early.
export function renderGrid(t, stage = STAGES.length - 1) {
  const g = new Grid(t.id ?? 0);
  if (t.Body === 'Genesis' || stage === 0) {
    genesis(g);
    return g.px;
  }
  const fur = FURS[t.Body];
  const bg = TABLES.Background[t.Background][2];
  const option = (type) => TABLES[type][t[type] ?? 'None'];
  const traits = stage >= 4;
  paintBackground(g, bg);

  // Back plane: Void's glow and the far half of a hat.
  if (stage >= 2) {
    if (fur.glow) for (const [x, y] of HALO_CELLS) g.blend(x, y, fur.glow, 0.45);
  }
  if (traits) g.at(4, 2, option('Headwear')[3]?.back);

  // The body: materials resolved through the tone map.
  const under = g.px.slice();
  const mat = new Array(SIZE * SIZE).fill(null);
  const ramps = { fur: fur.ramp ?? ramp(fur.base) };
  const m = {
    def: (k, c) => { ramps[k] = ramp(c); },
    set: (x, y, k) => { if (inCat(x, y)) mat[y * SIZE + x] = k; },
    // Pattern sprites are drawn for the reference head, so shift them like traits.
    sprite: (x, y, rows, keys, key) => rows.forEach((row, j) => [...row].forEach((ch, i) => {
      if (ch !== '.' && ch !== ' ' && keys.includes(ch)) m.set(x + i + 4, y + j + 2, key ?? ch);
    })),
  };
  for (const [x, y] of CAT_CELLS) mat[y * SIZE + x] = 'fur';
  if (stage >= 2) {
    fur.pattern?.(m, fur, g.seed);
    const cloth = traits && option('Outfit')[2];
    if (cloth?.mat) {
      m.def('cloth', cloth.mat['#']);
      for (const [x, y] of CAT_CELLS) if (y >= BODY_Y) m.set(x, y, 'cloth');
    }
  }
  for (const [x, y] of CAT_CELLS) {
    const i = y * SIZE + x, k = mat[i], tone = FLAT_TONE[TONE[i]];
    if (stage < 2) g.set(x, y, fur.base);
    else if (k === 'fur' && fur.paint) g.set(x, y, fur.paint(x, y, tone, g.seed, under[i]));
    else g.set(x, y, ramps[k][tone]);
  }
  // A dark outline in the body's own hue instead of flat black.
  g.outlineColor = fur.outline ?? mix(ramps.fur[3], INK, 0.45);
  for (const [x, y] of OUTLINE_CELLS) g.set(x, y, g.outlineColor);

  // Front plane.
  if (traits) {
    const outfit = option('Outfit');
    // Neckwear is clipped to the neck and its outline.
    const before = g.px.slice();
    g.at(4, 2, typeof outfit[2] === 'function' ? outfit[2] : outfit[3]);
    for (let i = 0; i < g.px.length; i++) if (!solid(i % SIZE, Math.floor(i / SIZE))) g.px[i] = before[i];
  }
  if (stage >= 3) {
    // Rosy cheeks under the outer corners of the eyes.
    for (const x of [10, 11, 20, 21]) g.blend(x, 17, '#ff6f9a', 0.4);
    const bare = g.px.slice();
    option('Eyes')?.[2]?.(g);
    option('Mouth')[2]?.(g);
    // On dark bodies the face is drawn in a light ink so it stays readable.
    if (toHsl(ramps.fur[1])[2] < 0.3)
      for (let i = 0; i < g.px.length; i++) if (g.px[i] === PUPIL && bare[i] !== PUPIL) g.px[i] = '#f6ecff';
  }
  if (traits) {
    g.at(4, 2, option('Headwear')[2]);
  }
  if (stage >= 2) fur.post?.(g);
  return g.px;
}

const RGB_CACHE = new Map();
export function renderRGBA(t, stage) {
  const px = renderGrid(t, stage), out = new Uint8Array(SIZE * SIZE * 4);
  for (let i = 0; i < px.length; i++) {
    let rgb = RGB_CACHE.get(px[i]);
    if (!rgb) RGB_CACHE.set(px[i], (rgb = hexToRgb(px[i])));
    out[i * 4] = rgb[0];
    out[i * 4 + 1] = rgb[1];
    out[i * 4 + 2] = rgb[2];
    out[i * 4 + 3] = 255;
  }
  return out;
}

// ERC-721 style attribute list ("None" traits are left out).
export function attributes(t) {
  return TRAIT_TYPES.filter((k) => t[k] && t[k] !== 'None').map((k) => ({ trait_type: k, value: t[k] }));
}

// Every value of every trait, for galleries and filters.
export const TRAITS = POOLS;

// --- Rarity ------------------------------------------------------------------

const ACCESSORIES = ['Headwear', 'Outfit'];
export const accessoryCount = (t) => ACCESSORIES.filter((k) => t[k] && t[k] !== 'None').length;

// Trait counts and a rarity.tools style rank: the score sums SUPPLY / count for
// every trait type ("None" counts as a value) plus the accessory count.
export function rarity(collection) {
  const counts = Object.fromEntries([...TRAIT_TYPES, 'Accessories'].map((k) => [k, {}]));
  const value = (t, k) => (k === 'Accessories' ? accessoryCount(t) : t[k] ?? 'None');
  const keys = Object.keys(counts);
  for (const t of collection) for (const k of keys) counts[k][value(t, k)] = (counts[k][value(t, k)] ?? 0) + 1;
  const score = (t) => keys.reduce((s, k) => s + collection.length / counts[k][value(t, k)], 0);
  const ranked = collection.map((t) => [t.id, score(t)]).sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  return { counts, rank: new Map(ranked.map(([id], i) => [id, i + 1])) };
}

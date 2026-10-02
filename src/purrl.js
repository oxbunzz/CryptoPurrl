// CryptoPurrls — 20 small pixel creatures grown from the Purrl logo.
//
// Each Purrl stands at the bottom of a 24×24 canvas: a 10×10 head that is the
// logo scaled down (tall left peak, short right peak, notched chin) on a tiny
// body whose feet touch the bottom edge. The style is kept quiet on purpose:
// one flat body colour, a black outline, a small face turned to the right and
// a pale flat background, so each Purrl reads clearly at avatar size.
//
// There are 20 Purrls (Genesis plus 19) and every trait value is worn by
// exactly one of them. The collection is reproducible from SEED. Plain ES
// module with no dependencies: it renders in Node and in the browser.

export const SIZE = 24;
export const SUPPLY = 20;
export const SEED = 0x50555252; // "PURR"

export const INK = '#0b0b0d';   // logo background
export const CREAM = '#f3efe7'; // logo foreground
const WHITE = '#ffffff';
const FACE_DARK = '#1a1420';
const FACE_LIGHT = '#f6f0ff';

// ---------------------------------------------------------------------------
// Silhouette

// The logo at 10×10: same peaks, same notch, same chin.
const HEAD = [
  '###.......',
  '###....###',
  ...Array(7).fill('##########'),
  '.########.',
];
const HEAD_X = 7, HEAD_Y = 10;

// A tiny body: torso with arm nubs, then two feet on the bottom row.
const BODY = [
  '.........######.........',
  '........########........',
  '.........######.........',
  '.........##..##.........',
];
const BODY_Y = 20;

// A one-pixel snout on the right shows which way the head is turned.
const inHead = (x, y) => HEAD[y - HEAD_Y]?.[x - HEAD_X] === '#' || (x === 17 && y === 16);
const inBody = (x, y) => BODY[y - BODY_Y]?.[x] === '#';
const inCat = (x, y) => inHead(x, y) || inBody(x, y);
const inOutline = (x, y) => !inCat(x, y) && (inCat(x - 1, y) || inCat(x + 1, y) || inCat(x, y - 1) || inCat(x, y + 1));

const cells = (test) => {
  const out = [];
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (test(x, y)) out.push([x, y]);
  return out;
};
const CAT_CELLS = cells(inCat);
const OUTLINE_CELLS = cells(inOutline);
const TORSO_CELLS = cells((x, y) => inBody(x, y) && y < BODY_Y + 3);

// Flat colour; only the feet take a shade so they read as separate.
const SHADED = new Set(CAT_CELLS.filter(([, y]) => y === BODY_Y + 3).map(([x, y]) => y * SIZE + x));

// The full-size logo, used for Genesis.
const LOGO = ['####..........', '####......####', '####......####', ...Array(10).fill('##############'), '.############.'];
const LOGO_CELLS = cells((x, y) => LOGO[y - 5]?.[x - 5] === '#');

// ---------------------------------------------------------------------------
// Colour

const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgbToHex = (rgb) => '#' + rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');

const MIXES = new Map();
export function mix(a, b, t) {
  const key = a + b + t;
  if (!MIXES.has(key)) {
    const rb = hexToRgb(b);
    MIXES.set(key, rgbToHex(hexToRgb(a).map((v, i) => v + (rb[i] - v) * t)));
  }
  return MIXES.get(key);
}
// The single shade: a little darker and a little cooler.
export const shade = (c) => mix(mix(c, '#2a2350', 0.18), INK, 0.12);
const luminance = (c) => { const [r, g, b] = hexToRgb(c); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
const distance = (a, b) => Math.hypot(...hexToRgb(a).map((v, i) => v - hexToRgb(b)[i]));

// ---------------------------------------------------------------------------
// Canvas

class Grid {
  constructor() { this.px = new Array(SIZE * SIZE).fill(null); this.ox = 0; }
  get(x, y) { return x < 0 || y < 0 || x >= SIZE || y >= SIZE ? null : this.px[y * SIZE + x]; }
  // `ox` shifts face art sideways so the face sits toward the right.
  set(x, y, c) { x += this.ox; if (c && x >= 0 && y >= 0 && x < SIZE && y < SIZE) this.px[y * SIZE + x] = c; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  // ASCII sprite: '.' is transparent, every other char is looked up in `map`.
  sprite(x, y, rows, map) {
    rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.' && map[ch]) this.set(x + i, y + j, map[ch]); }));
  }
  // Sprite plus a 1px ink outline wherever it borders open background.
  shape(x, y, rows, map) {
    const filled = new Set();
    rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') filled.add((y + j) * SIZE + x + i); }));
    for (const p of filled) {
      const px = p % SIZE, py = Math.floor(p / SIZE);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = px + dx, ny = py + dy;
        if (!filled.has(ny * SIZE + nx) && !inCat(nx, ny)) this.set(nx, ny, INK);
      }
    }
    this.sprite(x, y, rows, map);
  }
}

// ---------------------------------------------------------------------------
// Traits

const BACKGROUNDS = [
  ['Bubblegum', '#ffdcee'], ['Tangerine', '#ffe2c7'], ['Lemon', '#fff5c2'], ['Lime', '#e4f7c8'],
  ['Mint', '#d2f5ea'], ['Sky', '#d6eeff'], ['Periwinkle', '#dfe3ff'], ['Lavender', '#ebdfff'],
  ['Coral', '#ffdcdb'], ['Peach', '#ffeadb'], ['Purrl Blue', '#dbe5ec'], ['Cloud', '#f1f0f5'],
  ['Gold', '#f7e3a3'], ['Pearl', '#f6eefb'], ['Aqua', '#d2f6f6'], ['Sage', '#e2ecd8'],
  ['Sand', '#f3e9d6'], ['Mauve', '#efdce9'], ['Butter', '#fdf0d0'],
];

const BODIES = [
  ['Cream', CREAM], ['Snow', '#fbfbff'], ['Ash', '#b8bcc6'], ['Charcoal', '#4a4a55'], ['Midnight', '#2c2645'],
  ['Blush', '#ffb3c8'], ['Peach', '#ffc49b'], ['Coral', '#ff7a6b'], ['Tangerine', '#ff9a3d'], ['Mustard', '#f2c14e'],
  ['Lime', '#b6e35a'], ['Mint', '#87e9cd'], ['Teal', '#2fb8a0'], ['Sky', '#7cc8ff'], ['Cobalt', '#3d6fff'],
  ['Lilac', '#b9a4ff'], ['Grape', '#7a4fd6'], ['Mocha', '#9a6b4f'], ['Gold', '#f0b72f'], ['Rose', '#e8577f'],
];

// --- Eyes: a 3×2 box per eye, both drawn the same way so the gaze points right ---

const EYE_L = [8, 14], EYE_R = [12, 14];
const pair = (rows, map, right = rows) => (g, ink) => {
  const m = { k: ink, ...map };
  g.sprite(...EYE_L, rows, m);
  g.sprite(...EYE_R, right, m);
};
const coloured = (c) => pair(['.wc', '.cc'], { w: WHITE, c });

const EYES = [
  ['Dots', pair(['..k', '..k'], {})],
  ['Round', pair(['.kk', '.kk'], {})],
  ['Shiny', pair(['.wk', '.kk'], { w: WHITE })],
  ['Sleepy', pair(['...', '.kk'], {})],
  ['Happy', pair(['.k.', 'k.k'], {})],
  ['Wink', pair(['.wk', '.kk'], { w: WHITE }, ['.k.', 'k.k'])],
  ['Angry', pair(['k..', '.kk'], {})],
  ['Wide', pair(['kkk', 'kwk'], { w: WHITE })],
  ['Blue', coloured('#3d8bff')],
  ['Green', coloured('#2fbf5a')],
  ['Red', coloured('#e8344f')],
  ['Hearts', pair(['h.h', '.h.'], { h: '#ff3d8b' })],
  ['Stars', (g) => { for (const x of [8, 12]) g.sprite(x, 13, ['.y.', 'yWy', '.y.'], { y: '#f5b400', W: '#fff3b0' }); }],
  ['KO', (g, ink) => { for (const x of [8, 12]) g.sprite(x, 13, ['k.k', '.k.', 'k.k'], { k: ink }); }],
  ['Cyclops', (g, ink) => g.sprite(10, 14, ['.kk.', 'kwkk'], { k: ink, w: WHITE })],
  ['Shades', (g) => g.sprite(7, 14, ['kkkkkkkkkk', '.kkk..kkk.'], { k: INK })],
  ['Specs', (g, ink) => {
    g.sprite(7, 13, ['.bbb..bbb.', 'bb.bbbb.bb', '.bbb..bbb.'], { b: '#8a5a2b' });
    g.set(10, 14, ink); g.set(14, 14, ink);
  }],
  ['3D Glasses', (g) => g.sprite(7, 14, ['wwwwwwwwww', '.rrw..wbb.'], { w: WHITE, r: '#e8413c', b: '#38b6e8' })],
  ['Visor', (g) => g.sprite(7, 14, ['kkkkkkkkkk', 'kppppcccck'], { k: INK, p: '#ff4fd8', c: '#3ff2ff' })],
  ['Laser', (g) => {
    for (let x = 15; x < SIZE - 1; x++) g.set(x, 15, '#ff2a3d');
    g.sprite(...EYE_L, ['.rr', '.rr'], { r: '#ff2a3d' });
    g.sprite(...EYE_R, ['.rr', '.rr'], { r: '#ff2a3d' });
  }],
];

// --- Mouth: small, centred on row 17 -------------------------------------------------

const MOUTHS = [
  ['Line', (g, k) => g.sprite(11, 17, ['kk'], { k })],
  ['Smile', (g, k) => g.sprite(10, 17, ['k..k', '.kk.'], { k })],
  ['Grin', (g, k) => g.sprite(10, 17, ['kkkk', '.ww.'], { k, w: WHITE })],
  ['O', (g, k) => g.sprite(11, 17, ['kk', 'kk'], { k })],
  ['Tongue', (g, k) => g.sprite(11, 17, ['kk', 'pp'], { k, p: '#ff6f91' })],
  ['Fang', (g, k) => g.sprite(10, 17, ['kkkk', '.w..'], { k, w: WHITE })],
  ['Frown', (g, k) => g.sprite(10, 17, ['.kk.', 'k..k'], { k })],
  ['Wavy', (g, k) => g.sprite(10, 17, ['k.k.', '.k.k'], { k })],
  ['Kiss', (g) => g.sprite(11, 17, ['rr', 'rr'], { r: '#ff3d6e' })],
  ['Bubblegum', (g) => g.sprite(10, 16, ['.pp.', 'pwpp', 'pppp', '.pp.'], { p: '#f27ab0', w: WHITE })],
  ['Pipe', (g, k) => g.sprite(11, 16, ['....b', 'kkbbb', '...bb'], { k, b: '#7a4a2c' })],
  ['Lollipop', (g, k) => g.sprite(11, 14, ['...pp', '...pp', '...w.', 'kkw..'], { k, p: '#ff5fa2', w: WHITE })],
  ['Gold Tooth', (g, k) => g.sprite(10, 17, ['kkkk', '..y.'], { k, y: '#f5b400' })],
  ['Mustache', (g) => g.sprite(10, 16, ['m..m', 'mmmm'], { m: '#5a3418' })],
  ['Drool', (g, k) => g.sprite(10, 17, ['k..k', '.kkd'], { k, d: '#7fd0ff' })],
  ['Zipper', (g, k) => g.sprite(10, 17, ['kskk'], { k, s: '#b8bcc6' })],
  ['Smirk', (g, k) => g.sprite(10, 17, ['...k', 'kkk.'], { k })],
  ['Surprised', (g, k) => g.sprite(10, 16, ['.kk.', 'k..k', '.kk.'], { k })],
  ['Teeth', (g, k) => g.sprite(10, 17, ['kkkk', 'kwwk'], { k, w: WHITE })],
  ['Fish', (g, k) => g.sprite(11, 16, ['...sss.s', 'kkssssss', '...sss.s'], { k, s: '#8fb8d0' })],
];

// --- Headwear: small hats that sit in the notch between the peaks ----------------------

const HEADWEAR = [
  ['Top Hat', (g) => g.shape(9, 6, ['.HHHH.', '.HHHH.', '.HHHH.', '.rrrr.', 'HHHHHH'], { H: '#2f2f3d', r: '#e8344f' })],
  ['Crown', (g) => g.shape(10, 8, ['y..y', 'yyyy', 'yryy'], { y: '#f5c242', r: '#e8344f' })],
  ['Halo', (g) => g.sprite(9, 7, ['.yyyy.', 'y....y', '.yyyy.'], { y: '#f5c242' })],
  ['Party Hat', (g) => g.shape(10, 6, ['.ww.', '.py.', '.yp.', 'pyyp', 'yppy'], { w: WHITE, p: '#ef476f', y: '#ffd166' })],
  ['Beanie', (g) => g.shape(9, 7, ['..ww..', '.bbbb.', 'bbbbbb', 'cccccc'], { w: WHITE, b: '#2fb8a0', c: '#1f8a78' })],
  ['Cap', (g) => g.shape(9, 8, ['.bbbb..', 'bbbbbbbb'], { b: '#e8344f' })],
  ['Bow', (g) => g.shape(14, 8, ['p.p', 'pPp', 'p.p'], { p: '#ff7ab8', P: '#c2185b' })],
  ['Flower', (g) => g.shape(7, 7, ['.p.', 'pyp', '.p.'], { p: '#ff9fd0', y: '#ffd166' })],
  ['Sprout', (g) => g.shape(10, 6, ['gg.g', '.ggg', '..s.', '..s.', '..s.'], { g: '#5fd16a', s: '#2f9a4a' })],
  ['Devil Horns', (g) => { g.shape(7, 8, ['r.', 'rr'], { r: '#e8283c' }); g.shape(15, 9, ['.r', 'rr'], { r: '#e8283c' }); }],
  ['Antenna', (g) => g.sprite(10, 6, ['g..g', 'k..k', 'k..k', 'k..k', 'k..k'], { g: '#b6e35a', k: INK })],
  ['Unicorn Horn', (g) => g.shape(11, 5, ['.w', '.p', 'yp', 'py', 'yp', 'py'], { w: WHITE, p: '#ff8fd8', y: '#ffe36b' })],
  ['Mushroom', (g) => g.shape(9, 7, ['.RRRR.', 'RwRRwR', '..ss..', '..ss..'], { R: '#ff3b4f', w: WHITE, s: '#f5e6d0' })],
  ['Propeller Cap', (g) => g.shape(9, 7, ['rr.bb.', '..k...', '.ryyb.', 'ryybbr'], { r: '#ff3d5a', b: '#3d8bff', y: '#ffd23f', k: INK })],
  ['Headphones', (g) => {
    g.sprite(6, 8, ['.kkkkkkkkkk.', 'k..........k', 'k..........k', 'k..........k'], { k: INK });
    g.shape(5, 12, ['p', 'p', 'p'], { p: '#ff6bd6' });
    g.shape(18, 12, ['p', 'p', 'p'], { p: '#ff6bd6' });
  }],
  ['Bandana', (g) => { g.rect(7, 12, 10, 1, '#3d8bff'); g.set(9, 12, WHITE); g.set(13, 12, WHITE); g.shape(17, 12, ['b.', '.b'], { b: '#3d8bff' }); }],
  ['Wizard Hat', (g) => g.shape(9, 5, ['....p.', '...pp.', '..pyp.', '..ppp.', '.pppp.', 'PPPPPP'], { p: '#6a46c9', P: '#4a2e99', y: '#ffd166' })],
  ['Flame', (g) => g.sprite(9, 6, ['..r...', '.ror.r', 'royor.', 'oyyoro', 'oyyyyo'], { r: '#e8283c', o: '#ff8a1f', y: '#ffd23f' })],
  ['Chef Hat', (g) => g.shape(9, 5, ['.wwww.', 'wwwwww', 'wwwwww', '.wwww.', '.gggg.'], { w: WHITE, g: '#c9cdd6' })],
  ['Cherries', (g) => g.sprite(10, 7, ['.gg.', 'g..g', 'r..r'], { g: '#2f9a4a', r: '#e8283c' })],
];

// --- Outfit: a colour for the torso plus a detail or two -----------------------------

const cloth = (c, detail) => ({ cloth: c, detail });
const OUTFITS = [
  ['Red Tee', cloth('#e8344f')],
  ['Hoodie', cloth('#3d6fff', (g) => { g.set(10, 21, WHITE); g.set(13, 21, WHITE); })],
  ['Striped Shirt', cloth('#f4f4f8', (g) => g.rect(8, 21, 8, 1, '#e8344f'))],
  ['Overalls', cloth('#3d6fff', (g) => g.sprite(9, 20, ['w.ww.w'], { w: '#fff1dc' }))],
  ['Suit', cloth('#2a2d3d', (g) => g.sprite(11, 20, ['ww', 'rr', '.r'], { w: WHITE, r: '#e8344f' }))],
  ['Bow Tie', cloth(null, (g) => g.sprite(10, 20, ['rRRr'], { r: '#e8344f', R: '#a3142b' }))],
  ['Scarf', cloth(null, (g) => { g.rect(9, 20, 6, 1, '#ff9f43'); g.set(13, 21, '#ff9f43'); g.set(13, 22, '#e86a2a'); })],
  ['Gold Chain', cloth(null, (g) => g.sprite(10, 21, ['y..y', '.yy.'], { y: '#f5c242' }))],
  ['Bell Collar', cloth(null, (g) => { g.rect(9, 20, 6, 1, '#e8344f'); g.sprite(11, 21, ['yy'], { y: '#f5c242' }); })],
  ['Medal', cloth(null, (g) => g.sprite(11, 20, ['rb', 'yy', 'yy'], { r: '#e8344f', b: '#3d8bff', y: '#f5c242' }))],
  ['Jersey', cloth('#2fbf5a', (g) => { g.rect(9, 20, 6, 1, WHITE); g.set(12, 21, WHITE); g.set(12, 22, WHITE); })],
  ['Lab Coat', cloth('#f4f6fb', (g) => { g.set(10, 20, '#9aa6c0'); g.set(13, 20, '#9aa6c0'); g.set(9, 21, '#3d6fff'); })],
  ['Kimono', cloth('#e8344f', (g) => { g.sprite(10, 20, ['w..w', '.ww.'], { w: '#fff1dc' }); g.rect(9, 22, 6, 1, '#f5c242'); })],
  ['Armor', cloth('#9aa8bf', (g) => g.rect(8, 21, 8, 1, '#f5c242'))],
  ['Astronaut', cloth('#eef1f8', (g) => { g.set(10, 21, '#3d6fff'); g.set(11, 21, '#e8344f'); })],
  ['Puffer', cloth('#ffd23f', (g) => { g.rect(8, 21, 8, 1, '#e8b000'); g.rect(11, 20, 2, 3, '#3a3a4a'); })],
  ['Sweater', cloth('#7a4fd6', (g) => g.rect(9, 22, 6, 1, '#ffd23f'))],
  ['Cape', cloth(null, (g) => { g.set(8, 21, '#e8344f'); g.set(15, 21, '#e8344f'); g.rect(9, 20, 6, 1, '#e8344f'); g.sprite(11, 20, ['yy'], { y: '#f5c242' }); })],
  ['Hawaiian', cloth('#2fb8a0', (g) => { g.set(10, 20, '#ff7ab8'); g.set(13, 21, '#ffd23f'); g.set(9, 22, '#ff7ab8'); })],
  ['Pearl Necklace', cloth(null, (g) => g.sprite(9, 20, ['p.pp.p', '..pp..'], { p: '#fdfbf7' }))],
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

const byName = (list) => Object.fromEntries(list.map((o) => [o[0], o[1]]));
const TABLES = {
  Body: byName(BODIES),
  Background: byName(BACKGROUNDS),
  Eyes: byName(EYES),
  Mouth: byName(MOUTHS),
  Headwear: byName(HEADWEAR),
  Outfit: byName(OUTFITS),
};

export const TRAIT_TYPES = ['Body', 'Background', 'Eyes', 'Mouth', 'Headwear', 'Outfit'];

// Every value of every trait. Each is worn by exactly one Purrl.
export const TRAITS = Object.fromEntries(TRAIT_TYPES.map((k) => [k, Object.keys(TABLES[k])]));

// Purrl #0 is the logo itself, full size and extruded into a prism.
export const GENESIS = { id: 0, Body: 'Genesis', Background: 'Ink' };

// A body must stand out from its background and its clothes.
const clashes = (t) => {
  const body = TABLES.Body[t.Body];
  if (distance(body, TABLES.Background[t.Background]) < 70) return true;
  const c = TABLES.Outfit[t.Outfit].cloth;
  return Boolean(c && distance(body, c) < 70);
};

// Genesis plus SUPPLY - 1 Purrls. Each trait list is shuffled and dealt out
// once, so no value appears twice; a deal with a clash is redone.
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
    const dealt = Object.fromEntries(TRAIT_TYPES.map((k) => [k, shuffle(TRAITS[k])]));
    const items = [GENESIS];
    for (let i = 0; i < SUPPLY - 1; i++) items.push({ id: i + 1, ...Object.fromEntries(TRAIT_TYPES.map((k) => [k, dealt[k][i]])) });
    if (!items.slice(1).some(clashes)) return items;
  }
}

// ---------------------------------------------------------------------------
// Rendering

// Build-up stages, for showing how a Purrl grows out of the logo.
export const STAGES = ['Logo', 'Silhouette', 'Light', 'Face', 'Traits'];

// Genesis: the full-size logo extruded three pixels deep through a prism, on ink.
function genesis(g) {
  g.rect(0, 0, SIZE, SIZE, INK);
  const prism = ['#ff5fa2', '#ffb36b', '#ffe66b', '#6bf0a8', '#4fc3ff', '#a98bff'];
  for (let depth = 3; depth >= 1; depth--)
    for (const [x, y] of LOGO_CELLS) g.set(x + depth, y + depth, mix(prism[Math.floor((x + y + depth) / 3) % prism.length], INK, depth * 0.17));
  const inLogo = (x, y) => LOGO[y - 5]?.[x - 5] === '#';
  for (const [x, y] of LOGO_CELLS) {
    const lit = !inLogo(x - 1, y) || !inLogo(x, y - 1), dim = !inLogo(x + 1, y) || !inLogo(x, y + 1);
    g.set(x, y, lit ? WHITE : dim ? '#e2d8ca' : CREAM);
  }
}

// Returns SIZE×SIZE hex colours, row-major. `stage` stops the build early.
export function renderGrid(t, stage = STAGES.length - 1) {
  const g = new Grid();
  if (t.Body === 'Genesis' || stage === 0) {
    genesis(g);
    return g.px;
  }
  const body = TABLES.Body[t.Body];
  const outfit = stage >= 4 ? TABLES.Outfit[t.Outfit] : null;
  g.rect(0, 0, SIZE, SIZE, TABLES.Background[t.Background]);
  for (const [x, y] of CAT_CELLS) g.set(x, y, stage >= 2 && SHADED.has(y * SIZE + x) ? shade(body) : body);
  if (outfit?.cloth)
    for (const [x, y] of TORSO_CELLS) g.set(x, y, SHADED.has(y * SIZE + x) ? shade(outfit.cloth) : outfit.cloth);
  for (const [x, y] of OUTLINE_CELLS) g.set(x, y, INK);
  outfit?.detail?.(g);
  if (stage >= 3) {
    const ink = luminance(body) < 0.4 ? FACE_LIGHT : FACE_DARK;
    g.ox = 1;
    TABLES.Eyes[t.Eyes](g, ink);
    g.ox = 2;
    TABLES.Mouth[t.Mouth](g, ink);
    g.ox = 0;
  }
  if (stage >= 4) TABLES.Headwear[t.Headwear](g);
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

// ERC-721 style attribute list.
export function attributes(t) {
  return TRAIT_TYPES.filter((k) => t[k]).map((k) => ({ trait_type: k, value: t[k] }));
}

// --- Rarity ------------------------------------------------------------------

const ACCESSORIES = ['Headwear', 'Outfit'];
export const accessoryCount = (t) => ACCESSORIES.filter((k) => t[k] && t[k] !== 'None').length;

// Trait counts (every value is 1/1 here) and a rank kept for API compatibility.
export function rarity(collection) {
  const counts = Object.fromEntries([...TRAIT_TYPES, 'Accessories'].map((k) => [k, {}]));
  const value = (t, k) => (k === 'Accessories' ? accessoryCount(t) : t[k] ?? 'None');
  const keys = Object.keys(counts);
  for (const t of collection) for (const k of keys) counts[k][value(t, k)] = (counts[k][value(t, k)] ?? 0) + 1;
  return { counts, rank: new Map(collection.map((t, i) => [t.id, i + 1])) };
}

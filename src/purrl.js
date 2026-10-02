// CryptoPurrls — 20 pixel PFPs grown from the Purrl logo.
//
// Each Purrl is a bust portrait on a 32×32 canvas, turned three-quarters to
// the right. The head is the logo at 1:1 (a 14×14 block with a tall left peak,
// a short right peak and a notched chin) with a lighter face and muzzle on the
// front, big eyes looking right, and shoulders cropped by the bottom edge.
// Thick ink outline, flat colours with one light and one shade, solid
// background.
//
// There are 20 Purrls: Genesis plus 19 dealt from six trait lists. Each list
// is shuffled once with SEED and dealt out, so no trait value is ever worn
// twice. Plain ES module with no dependencies: it renders in Node and in the
// browser.

export const SIZE = 32;
export const SUPPLY = 20;
export const SEED = 0x50555252; // "PURR"

export const INK = '#0b0b0d';   // logo background
export const CREAM = '#f3efe7'; // logo foreground
const WHITE = '#ffffff';
const K = '#141018'; // line colour for features

// ---------------------------------------------------------------------------
// Silhouette

const LOGO = [
  '####..........',
  '####......####',
  '####......####',
  ...Array(10).fill('##############'),
  '.############.',
];
const HEAD_X = 11, HEAD_Y = 4;
const MUZZLE = new Set([[25, 12], [25, 13], [25, 14]].map(([x, y]) => y * SIZE + x));

// Shoulders, cropped by the bottom edge.
const BODY_ROWS = { 18: [14, 21], 19: [13, 22], 20: [10, 25], 21: [8, 27] };
for (let y = 22; y < SIZE; y++) BODY_ROWS[y] = [6, 29];

const inHead = (x, y) => LOGO[y - HEAD_Y]?.[x - HEAD_X] === '#' || MUZZLE.has(y * SIZE + x);
const inBody = (x, y) => BODY_ROWS[y] && x >= BODY_ROWS[y][0] && x <= BODY_ROWS[y][1];
const inFig = (x, y) => inHead(x, y) || inBody(x, y);
const inOutline = (x, y) => !inFig(x, y) && (inFig(x - 1, y) || inFig(x + 1, y) || inFig(x, y - 1) || inFig(x, y + 1));

const cells = (test) => {
  const out = [];
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (test(x, y)) out.push([x, y]);
  return out;
};
const HEAD_CELLS = cells(inHead);
const BODY_CELLS = cells((x, y) => inBody(x, y) && !inHead(x, y));
const OUTLINE_CELLS = cells(inOutline);

// The lighter face: the front of the head plus the muzzle.
const FACE_ROWS = { 9: [17, 23], 10: [16, 24], 11: [16, 24], 12: [16, 25], 13: [16, 25], 14: [16, 25], 15: [16, 24], 16: [16, 24], 17: [17, 23] };
const inFace = (x, y) => FACE_ROWS[y] && x >= FACE_ROWS[y][0] && x <= FACE_ROWS[y][1];

// Light from the front: shine at the top front of the head, shade on the back.
const LIGHT = new Set([[22, 7], [23, 7], [23, 8]].map(([x, y]) => y * SIZE + x));
const rowStart = (x, y, test) => { while (test(x - 1, y)) x--; return x; };
const tone = (x, y, test) => {
  if (LIGHT.has(y * SIZE + x)) return 0;
  if (x - rowStart(x, y, test) < 2) return 2;
  if (test === inHead && y === HEAD_Y + 13) return 2;
  return 1;
};

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
export const ramp = (c) => [mix(c, '#fffbe8', 0.3), c, mix(mix(c, '#2a2350', 0.25), INK, 0.12)];
const luminance = (c) => { const [r, g, b] = hexToRgb(c); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
const distance = (a, b) => Math.hypot(...hexToRgb(a).map((v, i) => v - hexToRgb(b)[i]));

// ---------------------------------------------------------------------------
// Canvas

class Grid {
  constructor() { this.px = new Array(SIZE * SIZE).fill(null); }
  get(x, y) { return x < 0 || y < 0 || x >= SIZE || y >= SIZE ? null : this.px[y * SIZE + x]; }
  set(x, y, c) { if (c && x >= 0 && y >= 0 && x < SIZE && y < SIZE) this.px[y * SIZE + x] = c; }
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
        if (nx >= 0 && nx < SIZE && !filled.has(ny * SIZE + nx) && !inFig(nx, ny)) this.set(nx, ny, INK);
      }
    }
    this.sprite(x, y, rows, map);
  }
  // Fill clothing over the shoulders (rows from y0 down) with shading.
  cloth(c, y0 = 20, keep = () => true) {
    const r = ramp(c);
    for (const [x, y] of BODY_CELLS) if (y >= y0 && keep(x, y)) this.set(x, y, r[tone(x, y, inBody)]);
  }
}

// ---------------------------------------------------------------------------
// Traits. The back eye is 2×3 at (17, 10), the front eye 3×3 at (21, 10).

const BACKGROUNDS = [
  ['Slate', '#7f9cb0'], ['Seafoam', '#8fd3c3'], ['Rose', '#f2a7b8'], ['Sun', '#f6d36b'], ['Cornflower', '#9fb7ff'],
  ['Lilac', '#c7a6ff'], ['Salmon', '#ff9f80'], ['Lime', '#b5e07a'], ['Sky', '#7fd6ff'], ['Bone', '#e7e3d9'],
  ['Apricot', '#ffcf9f'], ['Orchid', '#d4a5e0'], ['Fern', '#9ad0a0'], ['Coral', '#f28b8b'], ['Steel', '#a0a8b8'],
  ['Blossom', '#ffd6e8'], ['Teal', '#6fb0b8'], ['Wheat', '#e6c48c'], ['Powder', '#b0c4de'],
];

const FURS = [
  ['Brown', '#8a5a3c'], ['Cocoa', '#5a3a28'], ['Black', '#2e2a30'], ['Gray', '#8f909c'], ['White', '#efece6'],
  ['Golden', '#d9a441'], ['Orange', '#e8823a'], ['Red', '#c94a3a'], ['Pink', '#f29bb8'], ['Purple', '#8a6ad6'],
  ['Blue', '#5a8ae0'], ['Teal', '#3fb8a8'], ['Green', '#6fc05a'], ['Yellow', '#f2d24a'], ['Zombie', '#9fc28a'],
  ['Ice', '#a8dcf0'], ['Maroon', '#7a2a2a'], ['Silver', '#b8c4d4'], ['Gold', '#e8b830'], ['Cyan', '#3fd8e8'],
];
const faceOf = (fur) => mix(fur, '#fde8d2', 0.55);

const eyesWith = (pupil, opts = {}) => (g, f) => {
  const lid = opts.lid ? ramp(f)[2] : null;
  g.sprite(17, 10, ['ww', 'wp', 'wp'], { w: WHITE, p: pupil });
  g.sprite(21, 10, ['www', 'wpp', 'wpp'], { w: WHITE, p: pupil });
  if (lid) { g.rect(17, 10, 2, 1, lid); g.rect(21, 10, 3, 1, lid); }
  g.rect(17, 9, 2, 1, K); g.rect(21, 9, 3, 1, K);
};
const frame = (map, rows) => (g, f) => { eyesWith(K)(g, f); g.sprite(15, 9, rows, map); };

const EYES = [
  ['Classic', eyesWith(K)],
  ['Blue', eyesWith('#2d5bd6')],
  ['Green', eyesWith('#2f9a4a')],
  ['Red', eyesWith('#d6253a')],
  ['Sleepy', eyesWith(K, { lid: true })],
  ['Angry', (g, f) => { eyesWith(K)(g, f); g.rect(17, 9, 2, 1, faceOf(f)); g.rect(21, 9, 3, 1, faceOf(f)); g.sprite(16, 8, ['kk.....', '..k..kk', '.....k.'].map((r) => r), { k: K }); g.set(18, 10, K); g.set(21, 10, K); }],
  ['Wide', (g) => { g.sprite(17, 10, ['ww', 'ww', 'wk'], { w: WHITE, k: K }); g.sprite(21, 10, ['www', 'www', 'wwk'], { w: WHITE, k: K }); }],
  ['Shades', (g) => g.sprite(15, 10, ['kkkkkkkkkkk', '..kkk.kkkkk', '..kgk.kkgkk', '...k...kkk.'].map((r) => r), { k: K, g: '#4a5468' })],
  ['Aviators', (g) => g.sprite(15, 9, ['yyyyyyyyyyy', '..ybby.ybbby', '..ybby.ybbby', '...yy...yyy.'], { y: '#d9a441', b: '#5a3a28' })],
  ['3D Glasses', (g) => g.sprite(15, 9, ['wwwwwwwwwww', '..wrrw.wbbbw', '..wrrw.wbbbw', '..wwww.wwwww'], { w: WHITE, r: '#e8413c', b: '#38b6e8' })],
  ['Nerd Glasses', frame({ k: K }, ['..kkkk.kkkkk', 'kkk..kkk...k', '..k..k.k...k', '..kkkk.kkkkk'])],
  ['Heart Glasses', (g) => g.sprite(15, 9, ['..hh.h.hh.hh', 'kkhhhhkhhhhh', '...hhh..hhh.', '....h....h..'], { h: '#ff3d8b', k: K })],
  ['Visor', (g) => g.sprite(14, 10, ['kkkkkkkkkkkkk', 'kcccccccccccc', 'kkkkkkkkkkkkk'], { k: K, c: '#3ff2ff' })],
  ['Eye Patch', (g, f) => { eyesWith(K)(g, f); g.rect(11, 9, 14, 1, K); g.sprite(21, 9, ['kkk', 'kkk', 'kkk', '.k.'], { k: K }); }],
  ['Monocle', (g, f) => { eyesWith(K)(g, f); g.sprite(20, 9, ['yyyyy', 'y...y', 'y...y', 'y...y', 'yyyyy', '....y', '....y'], { y: '#f5c242' }); }],
  ['Laser', (g) => {
    g.sprite(17, 10, ['rr', 'rw', 'rr'], { r: '#ff2a3d', w: '#fff0f0' });
    g.sprite(21, 10, ['rrr', 'rww', 'rrr'], { r: '#ff2a3d', w: '#fff0f0' });
    for (let x = 24; x < SIZE; x++) { g.set(x, 11, '#ff2a3d'); g.set(x, 10, '#ff8a95'); g.set(x, 12, '#ff8a95'); }
  }],
  ['Stars', (g) => { g.sprite(16, 10, ['.y.', 'yyy', '.y.'], { y: '#f5b400' }); g.sprite(21, 10, ['.y.', 'yWy', '.y.'], { y: '#f5b400', W: '#fff3b0' }); }],
  ['Happy', (g) => { g.sprite(17, 10, ['.k', 'k.'].map((r, i) => (i ? 'kk' : '..')), { k: K }); g.sprite(21, 10, ['.k.', 'k.k'], { k: K }); g.sprite(17, 10, ['.k', 'k.'], { k: K }); }],
  ['Tired', (g, f) => { eyesWith(K)(g, f); g.rect(17, 13, 2, 1, '#8a6ad6'); g.rect(21, 13, 3, 1, '#8a6ad6'); }],
  ['Ski Goggles', (g) => g.sprite(13, 9, ['wwwwwwwwwwwww', 'wooooooooooow', 'woooooooooooo', 'wwwwwwwwwwwww'], { w: WHITE, o: '#ff8a1f' })],
];

const MOUTHS = [
  ['Line', (g) => g.rect(20, 15, 5, 1, K)],
  ['Smile', (g) => { g.rect(19, 15, 5, 1, K); g.set(24, 14, K); }],
  ['Grin', (g) => g.sprite(19, 14, ['kkkkkk', 'wwwwww', 'kkkkkk'].map((r, i) => (i === 1 ? 'kwwwww' : r)), { k: K, w: WHITE })],
  ['Open', (g) => g.sprite(20, 14, ['kkkk', 'krrk', 'kkkk'], { k: K, r: '#8e2b3a' })],
  ['Tongue', (g) => { g.rect(20, 15, 5, 1, K); g.sprite(22, 16, ['pp', 'p.'], { p: '#ff6f91' }); }],
  ['Frown', (g) => { g.rect(20, 15, 4, 1, K); g.set(24, 16, K); g.set(19, 16, K); }],
  ['Smirk', (g) => { g.rect(19, 15, 4, 1, K); g.set(23, 14, K); g.set(24, 14, K); }],
  ['Cigarette', (g) => { g.rect(20, 15, 4, 1, K); g.shape(24, 15, ['wwwwo'], { w: WHITE, o: '#ff8a1f' }); g.sprite(29, 12, ['g', '.', 'g'], { g: '#c9cdd6' }); }],
  ['Pipe', (g) => { g.rect(20, 15, 4, 1, K); g.shape(24, 13, ['...bb', '...bb', 'bbbbb'], { b: '#6b3f26' }); }],
  ['Lollipop', (g) => { g.rect(20, 15, 4, 1, K); g.shape(24, 12, ['..pp', '..pp', '.w..', 'w...'], { p: '#ff5fa2', w: WHITE }); }],
  ['Bubblegum', (g) => g.shape(21, 12, ['.ppp.', 'pwppp', 'ppppp', '.ppp.'], { p: '#f27ab0', w: WHITE })],
  ['Gold Grill', (g) => g.sprite(19, 14, ['kkkkkk', 'kyyyyy', 'kkkkkk'], { k: K, y: '#f5c242' })],
  ['Fangs', (g) => { g.rect(19, 15, 6, 1, K); g.set(20, 16, WHITE); g.set(23, 16, WHITE); }],
  ['Mustache', (g) => { g.sprite(19, 14, ['mmmmmm', 'm....m'], { m: '#4a2a18' }); g.rect(20, 16, 3, 1, K); }],
  ['Beard', (g) => { g.rect(20, 15, 4, 1, K); g.sprite(15, 16, ['.....bbbbbb', '....bbbbbbb', '..bbbbbbbbb', '....bbbbbb.'], { b: '#6b3f26' }); }],
  ['Face Mask', (g) => g.sprite(15, 13, ['.wwwwwwwwwww', 'kwwwwwwwwwww', '.wwwwwwwwww.', '..wwwwwwww..'], { w: '#e8f0f6', k: K })],
  ['Bandana Mask', (g) => g.sprite(15, 13, ['.rrrrrrrrrrr', 'rrwrrrwrrrwr', '.rrrrrrrrrr.', '...rrrrrrr..'], { r: '#d6334a', w: WHITE })],
  ['Kiss', (g) => g.sprite(22, 14, ['.rr', 'rrr', '.rr'], { r: '#ff3d6e' })],
  ['Toothpick', (g) => { g.rect(20, 15, 4, 1, K); g.sprite(24, 14, ['..t', '.t.', 't..'], { t: '#d9b37a' }); }],
  ['Drool', (g) => { g.rect(19, 15, 5, 1, K); g.set(24, 14, K); g.sprite(21, 16, ['d', 'd'], { d: '#7fd0ff' }); }],
];

const HEADWEAR = [
  ['Cap', (g) => g.shape(11, 2, ['..cccccccc', '.cccccccccccc', 'cccccccccccccc', 'cccccccccccccc', 'ccccccccccccwc', 'SSSSSSSSSSSSSSbbbbb'], { c: '#d6334a', S: '#a31f35', b: '#a31f35', w: WHITE })],
  ['Backwards Cap', (g) => g.shape(6, 2, ['.......bbbbbbbb', '......bbbbbbbbbbbb', '.....bbbbbbbbbbbbbb', '.....bbbbbbbbbbbbbb', '.....bbbbbbbbbbbbbb', 'BBBBBBBBBBBBBBBBBBB'], { b: '#3d6fff', B: '#2a4fc9' })],
  ['Beanie', (g) => g.shape(11, 1, ['....oooooo', '..oooooooooo', '.oooooooooooo', 'oooooooooooooo', 'oooooooooooooo', 'OoOoOoOoOoOoOo', 'oOoOoOoOoOoOoO'], { o: '#ff8a1f', O: '#c96a10' })],
  ['Bucket Hat', (g) => g.shape(9, 2, ['....gggggggggg', '...gggggggggggg', '...gggggggggggg', '...GGGGGGGGGGGG', 'gggggggggggggggggg', '.gggggggggggggggg'], { g: '#5fae5a', G: '#3d7a3a' })],
  ['Fedora', (g) => g.shape(9, 1, ['.....ffffffff', '....ffffffffff', '....ffffffffff', '....kkkkkkkkkk', 'ffffffffffffffffff', '.ffffffffffffffff'], { f: '#7a5a42', k: K })],
  ['Cowboy Hat', (g) => g.shape(6, 1, ['.......tttttttttt', '.......tttttttttt', '.......TTTTTTTTTT', 't.....tttttttttttt.....t', 'tttttttttttttttttttttttt', '.tttttttttttttttttttttt'], { t: '#c99a5e', T: '#7a5a32' })],
  ['Crown', (g) => g.shape(13, 1, ['y...yy...y', 'yy..yy..yy', 'yyyyyyyyyy', 'yryyybyyry', 'yyyyyyyyyy', 'YYYYYYYYYY'], { y: '#ffd35a', Y: '#c9902a', r: '#e8344f', b: '#3d8bff' })],
  ['Headband', (g) => { g.rect(11, 7, 14, 2, '#3d8bff'); g.rect(11, 7, 14, 1, '#6aa8ff'); g.shape(7, 7, ['bbbb', '.b..', 'b...'], { b: '#3d8bff' }); }],
  ['Bandana', (g) => g.shape(8, 3, ['....rrrrrrrrrr', '...rrrrwrrrrwrr', '...rwrrrrwrrrrr', 'rr.rrrrrrrrrrrr', '.rrrrrrrrrrrrrr', 'r..'], { r: '#d6334a', w: WHITE })],
  ['Beret', (g) => g.shape(11, 2, ['........k', '...bbbbbbbbb', '.bbbbbbbbbbbbb', 'bbbbbbbbbbbbbbbb', '.BBBBBBBBBBBBB'], { b: '#c0392b', B: '#8a2a1f', k: K })],
  ['Top Hat', (g) => g.shape(11, 0, ['..kkkkkkkkkk', '..kHkkkkkkkk', '..kHkkkkkkkk', '..kHkkkkkkkk', '..rrrrrrrrrr', '..kkkkkkkkkk', 'kkkkkkkkkkkkkkkk'], { k: '#25232c', H: '#4a4a5e', r: '#d6334a' })],
  ['Bowler', (g) => g.shape(11, 2, ['....bbbbbb', '...bbbbbbbb', '..bbbbbbbbbb', '..bbbbbbbbbb', 'bbbbbbbbbbbbbb'], { b: '#3a2a20' })],
  ['Halo', (g) => g.sprite(12, 0, ['..yyyyyyyy..', 'yy........yy', '..yyyyyyyy..'], { y: '#ffe27a' })],
  ['Headphones', (g) => { g.sprite(10, 1, ['....kkkkkk....', '..kk......kk..', '.k..........k.', 'k............k'], { k: K }); g.shape(9, 8, ['pp', 'pp', 'pp', 'pp'], { p: '#ff6bd6' }); }],
  ['Sailor Cap', (g) => g.shape(11, 2, ['...wwwwwwww', '..wwwwwwwwww', '.wwwwwwwwwwww', 'bbbbbbbbbbbbbb', 'wwwwwwwwwwwwww'], { w: '#f4f6fb', b: '#2a4fc9' })],
  ['Mohawk', (g) => g.shape(14, 0, ['.p.p.p.p', 'pppppppp', 'pppppppp', 'pppppppp', 'pppppppp', 'PPPPPPPP'], { p: '#ff3d8b', P: '#c2185b' })],
  ['Spiky Hair', (g) => g.shape(10, 1, ['..k..k..k..k', '.kk.kkk.kk.kk', 'kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk', '.kkkk.kkkk.kkk.'], { k: '#25232c' })],
  ['Flower', (g) => g.shape(10, 0, ['.p.', 'pyp', '.p.', '.g.'], { p: '#ff9fd0', y: '#ffd166', g: '#3fa45a' })],
  ['Propeller Cap', (g) => { g.sprite(14, 0, ['rrr.bbb', '...k...'], { r: '#ff3d5a', b: '#3d8bff', k: K }); g.shape(11, 2, ['...yyyyyyyy', '.yyrrrbbbbyyy', 'yyrrrrbbbbbyyy', 'yyyyyyyyyyyyyy', 'yyyyyyyyyyyyyy'], { y: '#ffd23f', r: '#ff3d5a', b: '#3d8bff' }); }],
  ['Party Hat', (g) => g.shape(14, 0, ['...w..', '..pp..', '..yp..', '.pyyp.', '.ypyp.', 'pyyppy', 'pppppp'], { w: WHITE, p: '#ef476f', y: '#ffd166' })],
];

const C = { red: '#d6334a', white: '#f4f4f8', gold: '#f5c242', navy: '#22305e', blue: '#3d6fff' };
const OUTFITS = [
  ['Hoodie', (g) => { g.cloth('#ff8a1f', 19); g.sprite(12, 18, ['oo........oo', 'oo........oo'], { o: '#c96a10' }); g.sprite(16, 21, ['w..w', 'w..w', 'w..w'], { w: WHITE }); }],
  ['T-Shirt', (g, s) => { g.cloth(C.white); g.sprite(15, 20, ['ssss', '.ss.'], { s }); }],
  ['Leather Jacket', (g) => { g.cloth('#25232c'); g.cloth(C.white, 20, (x) => x >= 16 && x <= 19); g.sprite(12, 20, ['kk......kk', '.kk....kk.', '..k....k..'], { k: '#4a4a5e' }); }],
  ['Denim Jacket', (g) => { g.cloth('#4a6fb0'); g.cloth(C.white, 20, (x) => x >= 16 && x <= 19); g.sprite(11, 20, ['dddd....dddd', '.ddd....ddd.'], { d: '#7fa0d8' }); }],
  ['Suit', (g) => { g.cloth(C.navy); g.cloth(C.white, 20, (x, y) => x >= 15 && x <= 20 && y < 25 - Math.abs(x - 17.5) / 2); g.sprite(17, 20, ['rr', 'rr', 'rr', 'rr', '.r'], { r: C.red }); }],
  ['Tracksuit', (g) => { g.cloth('#2f9a4a'); g.rect(17, 20, 1, 12, '#c9d1dd'); for (let y = 21; y < 32; y++) { g.set(7 + (y > 22 ? 0 : 1), y, WHITE); g.set(28 - (y > 22 ? 0 : 1), y, WHITE); } }],
  ['Hawaiian Shirt', (g) => { g.cloth('#2fb8a0'); for (const [x, y] of [[9, 23], [13, 26], [19, 22], [23, 25], [26, 29], [11, 29], [17, 28], [21, 30]]) g.sprite(x, y, ['.p.', 'pyp', '.p.'], { p: '#ff7ab8', y: '#ffd23f' }); }],
  ['Puffer', (g) => { g.cloth('#e8344f'); for (const y of [23, 26, 29]) g.rect(7, y, 22, 1, '#a31f35'); g.rect(17, 20, 1, 12, '#3a3a4a'); }],
  ['Sweater', (g) => { g.cloth('#7a4fd6'); g.rect(13, 20, 10, 1, '#a98bff'); g.rect(6, 25, 24, 2, '#ffd23f'); }],
  ['Tank Top', (g) => g.cloth(C.white, 21, (x) => x >= 12 && x <= 23)],
  ['Jersey', (g) => { g.cloth('#3d6fff'); g.rect(14, 20, 8, 1, WHITE); g.sprite(17, 23, ['www', '..w', '.w.', '.w.', '.w.'], { w: WHITE }); }],
  ['Lab Coat', (g) => { g.cloth(C.white); g.sprite(13, 20, ['kk......kk', '.kk....kk.', '..kk..kk..', '...k..k...'], { k: '#b8bfcc' }); g.sprite(22, 24, ['bkr', 'kkk'], { b: C.blue, r: C.red, k: '#b8bfcc' }); }],
  ['Kimono', (g) => { g.cloth('#c0392b'); g.sprite(13, 20, ['ww......ww', '.ww....ww.', '..ww..ww..', '...wwww...'], { w: '#fff1dc' }); g.rect(6, 28, 24, 2, '#f5c242'); }],
  ['Raincoat', (g) => { g.cloth('#ffd23f'); for (const y of [23, 26, 29]) g.set(19, y, '#3a3a4a'); g.rect(13, 20, 10, 1, '#e8b000'); }],
  ['Overalls', (g) => { g.cloth(C.white); g.cloth('#4a6fb0', 24); g.rect(12, 20, 2, 4, '#4a6fb0'); g.rect(22, 20, 2, 4, '#4a6fb0'); g.set(12, 24, C.gold); g.set(23, 24, C.gold); }],
  ['Turtleneck', (g) => { g.cloth('#25232c', 18); g.rect(14, 18, 8, 2, '#3a3842'); }],
  ['Varsity Jacket', (g) => { g.cloth('#c0392b'); g.cloth(C.white, 21, (x) => x < 10 || x > 25); g.sprite(12, 23, ['ww.', 'w.w', 'ww.', 'w..'], { w: WHITE }); }],
  ['Trench Coat', (g) => { g.cloth('#c9a26b'); g.rect(6, 27, 24, 1, '#7a5a32'); g.sprite(14, 20, ['dd....dd', '.dd..dd.', '..dddd..'], { d: '#a8844a' }); }],
  ['Tie-Dye', (g) => { const cs = ['#ff7ab8', '#ffd23f', '#3fc8ff', '#8f7bff']; for (const [x, y] of BODY_CELLS) if (y >= 20) g.set(x, y, cs[Math.floor(Math.hypot(x - 17, y - 27) / 2) % 4]); }],
  ['Gold Chain', (g) => g.sprite(13, 20, ['y........y', '.y......y.', '..yyyyyy..', '....YY....', '....YY....'], { y: '#f5c242', Y: '#c9902a' })],
];

// ---------------------------------------------------------------------------
// Collection

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
  Fur: byName(FURS),
  Background: byName(BACKGROUNDS),
  Eyes: byName(EYES),
  Mouth: byName(MOUTHS),
  Headwear: byName(HEADWEAR),
  Outfit: byName(OUTFITS),
};
export const TRAIT_TYPES = ['Fur', 'Background', 'Eyes', 'Mouth', 'Headwear', 'Outfit'];
export const TRAITS = Object.fromEntries(TRAIT_TYPES.map((k) => [k, Object.keys(TABLES[k])]));

// Purrl #0 is the logo itself: a cream head on ink, nothing else.
export const GENESIS = { id: 0, Fur: 'Genesis', Background: 'Ink' };

// The fur must stand apart from the background.
const clashes = (t) => distance(TABLES.Fur[t.Fur], TABLES.Background[t.Background]) < 80;

// Each trait list is shuffled once and dealt out, so no value repeats.
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

export const STAGES = ['Logo', 'Silhouette', 'Light', 'Face', 'Traits'];

// Returns SIZE×SIZE hex colours, row-major. `stage` stops the build early.
export function renderGrid(t, stage = STAGES.length - 1) {
  const g = new Grid();
  const genesis = t.Fur === 'Genesis' || stage === 0;
  const fur = genesis ? CREAM : TABLES.Fur[t.Fur];
  const bg = genesis ? INK : TABLES.Background[t.Background];
  const face = faceOf(fur);
  g.rect(0, 0, SIZE, SIZE, bg);
  const rf = ramp(fur), rface = ramp(face);
  for (const [x, y] of HEAD_CELLS) g.set(x, y, stage >= 2 ? (inFace(x, y) ? rface[LIGHT.has(y * SIZE + x) ? 0 : 1] : rf[tone(x, y, inHead)]) : fur);
  for (const [x, y] of BODY_CELLS) g.set(x, y, stage >= 2 ? rf[tone(x, y, inBody)] : fur);
  if (stage >= 2) for (let x = 14; x <= 21; x++) g.set(x, 18, rf[2]); // the chin's shadow on the neck
  if (bg !== INK) for (const [x, y] of OUTLINE_CELLS) g.set(x, y, INK);
  if (stage < 3) return g.px;
  if (genesis) { eyesWith(K)(g, fur); TABLES.Mouth.Line(g); return g.px; }
  g.set(25, 13, mix(face, K, 0.6)); // nostril
  if (stage >= 4) TABLES.Outfit[t.Outfit](g, face);
  TABLES.Eyes[t.Eyes](g, fur);
  TABLES.Mouth[t.Mouth](g, fur);
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

// Trait counts (every value is 1/1) and a rank kept for API compatibility.
export function rarity(collection) {
  const counts = Object.fromEntries([...TRAIT_TYPES, 'Accessories'].map((k) => [k, {}]));
  const value = (t, k) => (k === 'Accessories' ? accessoryCount(t) : t[k] ?? 'None');
  for (const t of collection) for (const k of Object.keys(counts)) counts[k][value(t, k)] = (counts[k][value(t, k)] ?? 0) + 1;
  return { counts, rank: new Map(collection.map((t, i) => [t.id, i + 1])) };
}

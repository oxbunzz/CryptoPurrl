// CryptoPurrls — 10,000 generative 24×24 pixel cats grown from the Purrl logo.
//
// Every Purrl shares the exact silhouette of the logo: a 14×14 block head with
// a tall left ear, a shorter right ear and a notched chin. Traits are layered
// on top of it in a fixed order, and the whole collection is reproducible from
// SEED, so anyone can regenerate it and check it against the provenance hash.
//
// Plain ES module with no dependencies: the same file renders in Node (build
// scripts) and in the browser (gallery).

export const SIZE = 24;
export const SUPPLY = 10000;
export const SEED = 0x50555252; // "PURR"

export const INK = '#0b0b0d';   // logo background, used for every outline
export const CREAM = '#f3efe7'; // logo foreground
const WHITE = '#ffffff';

// ---------------------------------------------------------------------------
// Silhouette

// The logo, one character per logo cell, placed 1:1 on the 24×24 canvas.
const LOGO = [
  '####..........',
  '####......####',
  '####......####',
  ...Array(10).fill('##############'),
  '.############.',
];
const HEAD_X = 5, HEAD_Y = 4;

const BODY = [
  '.......##########.......',
  '.......##########.......',
  '......############......',
  '......############......',
  '.....##############.....',
  '.....##############.....',
];
const BODY_Y = 18;

const inHead = (x, y) => LOGO[y - HEAD_Y]?.[x - HEAD_X] === '#';
const inBody = (x, y) => BODY[y - BODY_Y]?.[x] === '#';
const inCat = (x, y) => inHead(x, y) || inBody(x, y);

// Pixel lists, computed once. The outline is every empty pixel touching the
// cat (4-neighbourhood keeps the logo's stepped corners crisp).
const cells = (test) => {
  const out = [];
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (test(x, y)) out.push([x, y]);
  return out;
};
const HEAD_CELLS = cells(inHead);
const CAT_CELLS = cells(inCat);
const OUTLINE_CELLS = cells((x, y) => !inCat(x, y) && (inCat(x - 1, y) || inCat(x + 1, y) || inCat(x, y - 1) || inCat(x, y + 1)));

// ---------------------------------------------------------------------------
// Drawing

const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgbToHex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const MIXES = new Map();
export function mix(a, b, t) {
  const key = a + b + t;
  if (!MIXES.has(key)) MIXES.set(key, rgbToHex(hexToRgb(a).map((v, i) => v + (hexToRgb(b)[i] - v) * t)));
  return MIXES.get(key);
}

class Grid {
  constructor() { this.px = new Array(SIZE * SIZE).fill(null); }
  get(x, y) { return x < 0 || y < 0 || x >= SIZE || y >= SIZE ? null : this.px[y * SIZE + x]; }
  set(x, y, c) { if (c && x >= 0 && y >= 0 && x < SIZE && y < SIZE) this.px[y * SIZE + x] = c; }
  blend(x, y, c, t) { const under = this.get(x, y); if (under) this.set(x, y, mix(under, c, t)); }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  // ASCII sprite: '.' and ' ' are transparent, any other char is looked up in `map`.
  sprite(x, y, rows, map) {
    for (let j = 0; j < rows.length; j++)
      for (let i = 0; i < rows[j].length; i++) {
        const ch = rows[j][i];
        if (ch !== '.' && ch !== ' ') this.set(x + i, y + j, map[ch]);
      }
  }
}

// ---------------------------------------------------------------------------
// Fur

// Rare furs have exact supplies (like the punks' 9 aliens), the rest are rolled.
const FURS = {
  Cream:    { weight: 20, base: CREAM,     shade: '#ddd5c7', ear: '#efb3ae', nose: '#e3878a' },
  Ginger:   { weight: 18, base: '#ec9548', shade: '#cf7634', ear: '#f7bba5', nose: '#c95f5a', stripe: '#b8601f' },
  Silver:   { weight: 14, base: '#bcc1c9', shade: '#9ca2ab', ear: '#e7b0b6', nose: '#c98a92', stripe: '#737985' },
  Midnight: { weight: 12, base: '#2b2b33', shade: '#202027', ear: '#5f4552', nose: '#8a5d6e' },
  Tuxedo:   { weight: 10, base: '#2b2b33', shade: '#202027', ear: '#5f4552', nose: '#e3878a', bib: CREAM, bibShade: '#ddd5c7' },
  Siamese:  { weight: 8,  base: '#f1e6d2', shade: '#dccbb0', ear: '#5c4234', nose: '#3a2a22', point: '#5c4234', pointLight: '#9a7a62' },
  Calico:   { weight: 8,  base: '#f7f2ea', shade: '#e2dacd', ear: '#efb3ae', nose: '#e3878a', patchA: '#e58c40', patchB: '#2e2d34' },
  Blue:     { weight: 8,  base: '#8a99ae', shade: '#717f94', ear: '#c99aa6', nose: '#a87885' },
  Zombie:   { supply: 88, base: '#9fb78d', shade: '#809b70', ear: '#c48f8f', nose: '#8a4f55', stitch: '#3f3236' },
  Gold:     { supply: 24, base: '#e9b640', shade: '#c08a22', ear: '#fbe08c', nose: '#9c6416', shine: '#fde9a6' },
  Pearl:    { supply: 9,  base: '#f7f4fb', shade: '#ddd5ec', ear: '#f4cbe0', nose: '#d993b6', sheenA: '#f6d7ea', sheenB: '#d5eef2', sheenC: '#e4dcf7' },
};
for (const [name, fur] of Object.entries(FURS)) fur.name = name;

function drawCat(g, fur) {
  for (const [x, y] of CAT_CELLS) g.set(x, y, fur.base);
  PATTERNS[fur.name]?.(g, fur);
  // Light from the upper left: shade the right edge, the chin and the neck.
  for (let y = HEAD_Y + 1; y < 17; y++) g.set(18, y, fur.shade);
  g.rect(6, 17, 12, 1, fur.shade);
  g.rect(7, 18, 10, 1, fur.shade);
  g.rect(18, 22, 1, 2, fur.shade);
  // Inner ears: the logo's tall left ear and short right ear.
  g.rect(6, 5, 2, 2, fur.ear);
  g.rect(16, 6, 2, 1, fur.ear);
}

const PATTERNS = {
  Ginger: tabby,
  Silver: tabby,
  Tuxedo(g, f) {
    g.sprite(5, 8, [
      '......##......',
      '......##......',
      '......##......',
      '......##......',
      '.....####.....',
      '....######....',
      '...########...',
      '...########...',
      '....######....',
    ], { '#': f.bib });
    g.sprite(0, 18, [
      '..........####..........',
      '.........######.........',
      '.........######.........',
      '..........####..........',
      '..........####..........',
      '...........##...........',
    ], { '#': f.bib });
    g.rect(10, 17, 4, 1, f.bibShade);
  },
  Siamese(g, f) {
    g.sprite(5, 4, [
      '####..........',
      '####......####',
      '####......####',
      'oooo......oooo',
    ], { '#': f.point, o: f.pointLight });
    g.sprite(5, 11, [
      '.....oooo.....',
      '....oooooo....',
      '...ooPPPPoo...',
      '...ooPPPPoo...',
      '....oooooo....',
      '......oo......',
    ], { o: f.pointLight, P: f.point });
    g.rect(5, 22, 14, 2, f.pointLight);
  },
  Calico(g, f) {
    g.sprite(5, 4, [
      'aaaa..........',
      'aaaa......bbbb',
      'aaaa......bbbb',
      'aaaaa......bbb',
      'aaaa........bb',
      'aa...........b',
    ], { a: f.patchA, b: f.patchB });
    g.sprite(5, 19, [
      '..bbb.........',
      '.bbbb....aaa..',
      '..bb....aaaa..',
      '.........aa...',
    ], { a: f.patchA, b: f.patchB });
  },
  Zombie(g, f) {
    g.sprite(13, 8, ['.s.s.', 'sssss', '.s.s.'], { s: f.stitch });
    g.sprite(6, 19, ['.s.', 'sss', '.s.', 'sss', '.s.'], { s: f.stitch });
    g.set(5, 7, f.shade); g.set(6, 7, f.shade); g.set(5, 8, f.shade);
  },
  Gold(g, f) {
    // Polished metal: a bright rim on the lit side and a diagonal glint.
    for (let y = 4; y < 17; y++) g.set(5, y, f.shine);
    g.rect(6, 7, 2, 1, f.shine);
    g.rect(15, 5, 3, 1, f.shine);
    for (let y = 20; y < 24; y++) g.set(y < 22 ? 6 : 5, y, f.shine);
    [[13, 8], [14, 8], [12, 9], [13, 9]].forEach(([x, y]) => g.set(x, y, f.shine));
  },
  Pearl(g, f) {
    // Nacre: soft diagonal bands of pink, lilac and blue across the coat.
    const bands = [null, f.sheenA, f.sheenC, null, f.sheenB, f.sheenC];
    for (const [x, y] of CAT_CELLS) g.set(x, y, bands[Math.floor((x + y) / 3) % bands.length] ?? f.base);
    g.rect(6, 8, 2, 1, WHITE);
    g.set(6, 9, WHITE);
  },
};

function tabby(g, f) {
  // Forehead "M", cheek stripes and a striped chest.
  g.sprite(5, 7, [
    '....#.##.#....',
    '....#....#....',
  ], { '#': f.stripe });
  g.sprite(5, 13, ['##..........##', '..............', '#............#'], { '#': f.stripe });
  g.sprite(5, 20, ['.##........##.', '..............', '##..........##'], { '#': f.stripe });
}

function outline(g) {
  for (const [x, y] of OUTLINE_CELLS) g.set(x, y, INK);
}

function whiskers(g) {
  for (const [x, y] of [[3, 13], [2, 13], [3, 15], [2, 16], [20, 13], [21, 13], [20, 15], [21, 16]]) g.blend(x, y, WHITE, 0.7);
}

// ---------------------------------------------------------------------------
// Traits. Each option: [name, weight, draw?, flags?]

const BACKGROUNDS = [
  ['Purrl Blue', 15, '#6f8fa6'],
  ['Sage', 12, '#a5b8a2'],
  ['Blush', 12, '#e9bfb6'],
  ['Butter', 12, '#efd9a2'],
  ['Lilac', 10, '#bdb2d9'],
  ['Mint', 10, '#b4dccb'],
  ['Sky', 10, '#b0cce8'],
  ['Terracotta', 8, '#cf9b7d'],
  ['Fog', 8, '#cac7c0'],
  ['Pearl', 2, '#ece9f5'],
  ['Gold Leaf', 1, '#d9b44a'],
];

// --- Eyes: 2×3, drawn at both anchors --------------------------------------------

const EYE_L = [7, 10], EYE_R = [15, 10];
const OPEN = ['iw', 'ik', 'ii'];
const CLOSED = ['..', 'kk', '..'];
const eye = (g, [x, y], rows, iris) => g.sprite(x, y, rows, { w: WHITE, i: iris, k: INK });
const pair = (left, right = left) => (g) => {
  eye(g, EYE_L, ...left);
  eye(g, EYE_R, ...right);
};

const EYES = [
  ['Emerald', 24, pair([OPEN, '#5fbf62'])],
  ['Amber', 22, pair([OPEN, '#f2b33a'])],
  ['Sapphire', 18, pair([OPEN, '#4f95e0'])],
  ['Copper', 14, pair([OPEN, '#d8793a'])],
  ['Sleepy', 10, pair([CLOSED])],
  ['Amethyst', 6, pair([OPEN, '#a27fe6'])],
  ['Odd Eyes', 5, pair([OPEN, '#4f95e0'], [OPEN, '#f2b33a'])],
  ['Wink', 4, pair([OPEN, '#5fbf62'], [CLOSED])],
  ['Laser', 1, (g) => {
    for (const [x, y] of [EYE_L, EYE_R]) {
      for (let j = -1; j < 4; j++) for (let i = -1; i < 3; i++) g.blend(x + i, y + j, '#ff3b30', 0.35);
      g.sprite(x, y, ['rw', 'rr', 'rr'], { r: '#ff2a1f', w: '#fff3ef' });
    }
  }],
];

// --- Mouth (the nose is always drawn first at 11–12, 13) --------------------------

const MOUTHS = [
  ['Purr', 32, (g) => g.sprite(9, 14, ['k.kk.k', '.k..k.'], { k: INK })],
  ['Smile', 18, (g) => g.sprite(9, 14, ['k....k', '.kkkk.'], { k: INK })],
  ['Blep', 16, (g) => g.sprite(9, 14, ['k.kk.k', '.kppk.', '..pp..'], { k: INK, p: '#ef6f86' })],
  ['Hiss', 8, (g) => g.sprite(9, 14, ['kkkkkk', 'kwrrwk', '.kkkk.'], { k: INK, w: WHITE, r: '#8e2b3a' })],
  ['Bubblegum', 8, (g) => g.sprite(9, 14, [
    '..pppp..',
    '.pPPPPp.',
    '.pPwPPp.',
    '..pppp..',
  ].map((r) => r.slice(0, 7)), { p: '#f27ab0', P: '#f9b6d3', w: WHITE })],
  ['Pipe', 6, (g) => g.sprite(9, 11, [
    '.........ss',
    '..........s',
    '........kkkk',
    'k.kk.k..kbbk',
    '.k..kbbbbbbk',
    '......kkkkk.',
  ], { k: INK, b: '#7a4a2c', s: '#d9d9d9' })],
  ['Fish', 4, (g) => g.sprite(10, 13, [
    '..kkkkk..k.',
    '.kssssSk.kk',
    'kwksssSSkSk',
    '.kssssSk.kk',
    '..kkkkk..k.',
  ], { k: INK, s: '#b3d3e6', S: '#7ea9c4', w: WHITE })],
];

// --- Eyewear (optional) -------------------------------------------------------------

const shades = (frame, lens, glare) => (g) => g.sprite(4, 10, [
  'kkkkkkkkkkkkkkkk',
  '..kgLLk..kgLLk..',
  '..kLLLk..kLLLk..',
  '...kkk....kkk...',
].map((r) => r), { k: frame, L: lens, g: glare });

const EYEWEAR = [
  ['None', 60],
  ['Shades', 10, shades(INK, '#2b3340', '#5c6b80'), { hidesEyes: true }],
  ['Gold Shades', 2, shades('#b8892a', '#3a2f1c', '#f6d77a'), { hidesEyes: true }],
  ['Specs', 8, (g) => g.sprite(4, 9, [
    '..kkkk....kkkk..',
    'kkk..kkkkkk..kkk',
    '..k..k....k..k..',
    '..k..k....k..k..',
    '..kkkk....kkkk..',
  ], { k: INK })],
  ['3D Glasses', 6, (g) => g.sprite(4, 9, [
    '..wwww....wwww..',
    'wwwrrwwwwwwbbwww',
    '..wrrw....wbbw..',
    '..wrrw....wbbw..',
    '..wwww....wwww..',
  ], { w: '#f4f4f4', r: '#e8413c', b: '#38b6e8' }), { hidesEyes: true }],
  ['Monocle', 5, (g) => g.sprite(14, 9, [
    'gggg.',
    'g..g.',
    'g..g.',
    'g..g.',
    'gggg.',
    '...g.',
    '....g',
    '....g',
  ], { g: '#e0b445' })],
  ['VR Headset', 4, (g) => g.sprite(4, 9, [
    'kkkkkkkkkkkkkkkk',
    'kwwwwwwwwwwwwwwk',
    'kwbbwwwwwwwwbbwk',
    'kwwwwwwwwwwwwwwk',
    'kkkkkkkkkkkkkkkk',
  ], { k: INK, w: '#e9e9ee', b: '#5ccbf0' }), { hidesEyes: true }],
  ['Eye Patch', 5, (g) => g.sprite(4, 8, [
    'k..............k',
    '.k...........kk.',
    '..kkkkkkkkkkk...',
    '..kkkk..........',
    '..kkkk..........',
    '...kk...........',
  ], { k: INK })],
];

// --- Headwear (optional). Hats sit in the logo's notch, between the ears. -------------

const HEADWEAR = [
  ['None', 40],
  ['Top Hat', 7, (g) => g.sprite(8, 0, [
    '.kkkkkk.',
    '.kHHHHk.',
    '.kHHHHk.',
    '.kHHHHk.',
    '.krrrrk.',
    'kkkkkkkk',
    'kHHHHHHk',
  ], { k: INK, H: '#2f2f38', r: '#b23a48' })],
  ['Crown', 1, (g) => g.sprite(8, 0, [
    '.k.kk.k.',
    'kgkggkgk',
    'kggggggk',
    'kgrggbgk',
    'kggggggk',
    'kGGGGGGk',
    'kkkkkkkk',
  ], { k: INK, g: '#f5cd4f', G: '#c99a2e', r: '#e04848', b: '#4a7be0' })],
  ['Halo', 3, (g) => g.sprite(7, 0, [
    '.yyyyyyyy.',
    'y........y',
    '.yyyyyyyy.',
  ], { y: '#ffe27a' })],
  ['Party Hat', 5, (g) => g.sprite(8, 0, [
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
    '...kppppk.',
    'kkkkkkkkkk',
  ], { k: INK, p: '#5b3fa8', y: '#ffd166' })],
  ['Beanie', 7, (g) => g.sprite(8, 0, [
    '...ww...',
    '..kwwk..',
    '.kbbbbk.',
    '.kbbbbk.',
    '.kbbbbk.',
    'kcCcCcCk',
    'kCcCcCck',
  ], { k: INK, w: WHITE, b: '#e0574f', c: '#b8403c', C: '#f08a7d' })],
  ['Headphones', 6, (g) => {
    g.sprite(4, 1, [
      '...kkkkkkkkkk...',
      '..k..........k..',
      '.k............k.',
    ], { k: INK });
    g.sprite(2, 9, ['.kk', 'kpk', 'kpk', 'kpk', '.kk'], { k: INK, p: '#ef6f86' });
    g.sprite(19, 9, ['kk.', 'kpk', 'kpk', 'kpk', 'kk.'], { k: INK, p: '#ef6f86' });
  }],
  ['Headband', 6, (g) => g.sprite(4, 7, [
    'kkkkkkkkkkkkkkkk..',
    'krrwwrrrrrrrrrrrkk',
    'kkkkkkkkkkkkkkkkrk',
    '.................k',
  ], { k: INK, r: '#d64545', w: WHITE })],
  ['Bow', 5, (g) => g.sprite(14, 2, [
    'kk...kk',
    'kpk.kpk',
    'kppkppk',
    'kpk.kpk',
    'kk...kk',
  ], { k: INK, p: '#f27ab0' })],
  ['Flower', 5, (g) => g.sprite(3, 2, [
    '.kpk.',
    'kpypk',
    '.kpk.',
    '..g..',
  ], { k: INK, p: '#f9a8c9', y: '#ffd166', g: '#5a9e5a' })],
];

// --- Outfit (body) ----------------------------------------------------------------

const OUTFITS = [
  ['None', 30],
  ['Collar & Bell', 18, (g) => {
    g.rect(7, 18, 10, 1, '#d64545');
    g.sprite(11, 18, ['yy', 'Yy'], { y: '#f5cd4f', Y: '#b5862a' });
  }],
  ['Gold Chain', 10, (g) => g.sprite(7, 18, [
    'g........g',
    'G........G',
    '.g......g.',
    '..GgGgGg..',
    '....yy....',
  ], { g: '#f5cd4f', G: '#c99a2e', y: '#f5cd4f' })],
  ['Pearl Necklace', 4, (g) => g.sprite(7, 18, [
    'k........k',
    'p........p',
    'kp......pk',
    '.kpqpqpqk.',
    '..kkkkkk..',
  ], { p: '#fdfbf7', q: '#e6def0', k: '#8f87a3' })],
  ['Bow Tie', 10, (g) => g.sprite(9, 18, [
    'kk..kk',
    'kbkkbk',
    'kbbbbk',
    'kbkkbk',
    'kk..kk',
  ], { k: INK, b: '#c0392b' })],
  ['Hoodie', 10, (g) => g.sprite(0, 18, [
    '.......hhhhhhhhhh.......',
    '.......HhhhhhhhhH.......',
    '......hhhwhhhhwhhh......',
    '......hhhwhhhhwhhh......',
    '.....hhhhhhhhhhhhhh.....',
    '.....hhhhhhhhhhhhhH.....',
  ], { h: '#4b5563', H: '#3b4350', w: '#e5e7eb' })],
  ['Suit', 8, (g) => g.sprite(0, 18, [
    '.......sssswwssss.......',
    '.......ssswrrwsss.......',
    '......ssssswrwssss......',
    '......sssssrrsssss......',
    '.....ssssssrrssssss.....',
    '.....ssssssrrsssssS.....',
  ], { s: '#23252d', S: '#16171c', w: '#f4f4f4', r: '#b23a48' })],
  ['Scarf', 8, (g) => {
    g.sprite(6, 17, [
      '.ssssssssss.',
      'ssSsSsSsSsss',
      '.......sSs..',
      '.......sSs..',
      '.......c.c..',
    ], { s: '#2f855a', S: '#276b49', c: '#f4f4f4' });
  }],
];

// --- Earring (optional): dangles from the right side of the head ----------------------

const EARRINGS = [
  ['None', 90],
  ['Pearl Earring', 5, (g) => g.sprite(19, 7, ['g.', 'wp', 'pq'], { g: '#d4a93f', w: WHITE, p: '#f3eee6', q: '#c9c0d4' })],
  ['Gold Hoop', 4, (g) => g.sprite(19, 7, ['g.', '.g', 'g.'], { g: '#f5cd4f' })],
  ['Diamond Stud', 1, (g) => g.sprite(19, 7, ['d', 'D'], { d: '#e8fbff', D: '#8fdcf2' })],
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

function pick(rand, options) {
  const total = options.reduce((s, o) => s + o[1], 0);
  let r = rand() * total;
  for (const o of options) if ((r -= o[1]) < 0) return o;
  return options[options.length - 1];
}

const byName = (list) => Object.fromEntries(list.map((o) => [o[0], o]));
const TABLES = {
  Eyes: byName(EYES),
  Mouth: byName(MOUTHS),
  Eyewear: byName(EYEWEAR),
  Headwear: byName(HEADWEAR),
  Outfit: byName(OUTFITS),
  Earring: byName(EARRINGS),
};

export const TRAIT_TYPES = ['Fur', 'Background', 'Eyes', 'Mouth', 'Eyewear', 'Headwear', 'Outfit', 'Earring'];

// Purrl #0 is the logo itself: the bare silhouette on ink.
export const GENESIS = { id: 0, Fur: 'Genesis', Background: 'Ink' };

// Traits that would vanish into a fur of the same colour.
const CLASHES = { Gold: ['Gold Shades', 'Gold Chain', 'Gold Hoop', 'Gold Leaf'] };

function roll(rand, fur) {
  const clash = CLASHES[fur] ?? [];
  const draw = (table) => {
    let o;
    do o = pick(rand, table); while (clash.includes(o[0]));
    return o;
  };
  const t = { Fur: fur, Background: draw(BACKGROUNDS)[0] };
  const eyes = draw(EYES)[0];
  const eyewear = eyes === 'Laser' ? EYEWEAR[0] : draw(EYEWEAR);
  if (!eyewear[3]?.hidesEyes) t.Eyes = eyes;
  t.Mouth = draw(MOUTHS)[0];
  t.Eyewear = eyewear[0];
  t.Headwear = draw(HEADWEAR)[0];
  t.Outfit = draw(OUTFITS)[0];
  // Headphones, the headband knot and the eye patch strap cover the right ear.
  const earBusy = t.Headwear === 'Headphones' || t.Headwear === 'Headband' || t.Eyewear === 'Eye Patch';
  t.Earring = earBusy ? 'None' : draw(EARRINGS)[0];
  return t;
}

const dna = (t) => TRAIT_TYPES.map((k) => t[k] ?? '-').join('|');

// The full, deterministic collection: [{ id, Fur, Background, Eyes, ... }].
export function generateCollection(seed = SEED) {
  const rand = mulberry32(seed);
  const rare = Object.values(FURS).filter((f) => f.supply);
  const common = Object.values(FURS).filter((f) => f.weight).map((f) => [f.name, f.weight]);
  const furs = rare.flatMap((f) => Array(f.supply).fill(f.name));
  while (furs.length < SUPPLY - 1) furs.push(pick(rand, common)[0]);
  for (let i = furs.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [furs[i], furs[j]] = [furs[j], furs[i]];
  }
  const seen = new Set();
  const items = [GENESIS];
  for (const fur of furs) {
    let t;
    do t = roll(rand, fur); while (seen.has(dna(t)));
    seen.add(dna(t));
    items.push({ id: items.length, ...t });
  }
  return items;
}

// ---------------------------------------------------------------------------
// Rendering

const BG = Object.fromEntries(BACKGROUNDS.map(([n, , c]) => [n, c]));
BG.Ink = INK;

// Build-up stages, for showing how a Purrl grows out of the logo.
export const STAGES = ['Logo', 'Silhouette', 'Fur', 'Face', 'Traits'];

// Returns SIZE×SIZE hex colours, row-major. `stage` stops the build early.
export function renderGrid(t, stage = STAGES.length - 1) {
  const g = new Grid();
  if (t.Fur === 'Genesis' || stage === 0) {
    g.rect(0, 0, SIZE, SIZE, INK);
    for (const [x, y] of HEAD_CELLS) g.set(x, y, CREAM);
    return g.px;
  }
  const fur = FURS[t.Fur];
  const layer = (type) => TABLES[type][t[type] ?? 'None']?.[2]?.(g, fur);
  g.rect(0, 0, SIZE, SIZE, BG[t.Background]);
  if (stage === 1) {
    for (const [x, y] of CAT_CELLS) g.set(x, y, fur.base);
    outline(g);
    return g.px;
  }
  drawCat(g, fur);
  outline(g);
  whiskers(g);
  if (stage >= 4) layer('Outfit');
  if (stage >= 3) {
    layer('Eyes');
    g.rect(11, 13, 2, 1, fur.nose);
    layer('Mouth');
  }
  if (stage >= 4) {
    layer('Earring');
    layer('Eyewear');
    layer('Headwear');
  }
  return g.px;
}

const RGB_CACHE = new Map();
export function renderRGBA(t, stage) {
  const out = new Uint8Array(SIZE * SIZE * 4);
  renderGrid(t, stage).forEach((c, i) => {
    if (!RGB_CACHE.has(c)) RGB_CACHE.set(c, hexToRgb(c));
    out.set(RGB_CACHE.get(c), i * 4);
    out[i * 4 + 3] = 255;
  });
  return out;
}

// ERC-721 style attribute list ("None" traits are left out).
export function attributes(t) {
  return TRAIT_TYPES.filter((k) => t[k] && t[k] !== 'None').map((k) => ({ trait_type: k, value: t[k] }));
}

// Every option in every trait table, for galleries and filters.
export const TRAITS = {
  Fur: Object.keys(FURS),
  Background: BACKGROUNDS.map((o) => o[0]),
  ...Object.fromEntries(Object.entries(TABLES).map(([k, v]) => [k, Object.keys(v)])),
};

// --- Rarity ------------------------------------------------------------------

const ACCESSORIES = ['Eyewear', 'Headwear', 'Outfit', 'Earring'];
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

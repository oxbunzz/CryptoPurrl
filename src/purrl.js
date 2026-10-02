// CryptoPurrls — 20 hand-designed pixel characters grown from the Purrl logo.
//
// Every Purrl is a small creature whose head is the logo (tall left peak,
// short right peak, notched chin) drawn at 12×12, standing on the bottom edge
// of a 32×32 canvas and turned to the right. Each of the 20 is its own design
// with its own theme, body colour, background, eyes, headwear, outfit and
// held item, and no value of any trait appears twice in the collection.
//
// Plain ES module with no dependencies: it renders in Node and in the browser.

export const SIZE = 32;
export const SUPPLY = 20;
export const SEED = 0x50555252; // "PURR"

export const INK = '#0b0b0d';   // logo background
export const CREAM = '#f3efe7'; // logo foreground
const WHITE = '#ffffff';
const FACE = '#1a1420';
const FACE_LIGHT = '#f6f0ff';

// ---------------------------------------------------------------------------
// Silhouette

const HEAD = [
  '###.........',
  '###......###',
  '###......###',
  ...Array(8).fill('############'),
  '.##########.',
];
const HEAD_X = 10, HEAD_Y = 13;
const SNOUT = [22, 20]; // a one-pixel nose: the head faces right

const BODY = [
  '............########............',
  '...........##########...........',
  '...........##########...........',
  '...........##########...........',
  '............########............',
  '............###..###............',
  '............###..####...........',
];
const BODY_Y = 25;

const inHead = (x, y) => HEAD[y - HEAD_Y]?.[x - HEAD_X] === '#' || (x === SNOUT[0] && y === SNOUT[1]);
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

// Light comes from the front (the right): shine near the top right of the head,
// shade along the back edge, the chin and the bottom of each part.
const SHINE = new Set([[19, 16], [20, 16], [20, 17]].map(([x, y]) => y * SIZE + x));
const toneAt = (x, y) => {
  if (SHINE.has(y * SIZE + x)) return 0;
  if (!inCat(x - 1, y) || !inCat(x, y + 1) || (inHead(x, y) && y === HEAD_Y + 11)) return 2;
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
// Three tones from one colour: a warm light, the colour, a cool shade.
export const ramp = (c) => [mix(c, '#fffbe8', 0.35), c, mix(mix(c, '#2a2350', 0.22), INK, 0.12)];
const luminance = (c) => { const [r, g, b] = hexToRgb(c); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };

// ---------------------------------------------------------------------------
// Canvas and drawing helpers

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
        if (nx >= 0 && nx < SIZE && !filled.has(ny * SIZE + nx) && !inCat(nx, ny)) this.set(nx, ny, INK);
      }
    }
    this.sprite(x, y, rows, map);
  }
  // Paint the body's cells in rows [y0, y1] with a shaded colour (clothes).
  cloth(c, y0, y1, keep = () => true) {
    const r = ramp(c);
    for (const [x, y] of CAT_CELLS) if (!inHead(x, y) && y >= y0 && y <= y1 && keep(x, y)) this.set(x, y, r[toneAt(x, y)]);
  }
}

// --- Faces ----------------------------------------------------------------------
// The back eye sits at x 14, the front eye at x 18; both look right.

const EYES = {
  plain: (g, k) => { g.sprite(14, 18, ['wk', 'wk'], { w: WHITE, k }); g.sprite(18, 18, ['wk', 'wk'], { w: WHITE, k }); },
  starry: (g, k) => { g.sprite(14, 18, ['wk', 'kk'], { w: WHITE, k }); g.sprite(18, 18, ['wk', 'kk'], { w: WHITE, k }); g.set(21, 17, '#ffd23f'); },
  fierce: (g, k) => { EYES.plain(g, k); g.set(14, 17, k); g.rect(18, 17, 2, 1, k); },
  lidded: (g, k) => { g.sprite(14, 18, ['kk', 'wk'], { k, w: WHITE }); g.sprite(18, 18, ['kk', 'wk'], { k, w: WHITE }); },
  closed: (g, k) => { g.rect(14, 19, 2, 1, k); g.rect(18, 19, 2, 1, k); },
  happy: (g, k) => { g.sprite(14, 18, ['.k', 'k.'], { k }); g.sprite(18, 18, ['.k', 'k.'], { k }); g.set(16, 19, k); g.set(20, 19, k); },
  proud: (g, k) => { g.rect(14, 19, 2, 1, k); g.rect(18, 19, 2, 1, k); g.set(15, 18, k); g.set(19, 18, k); },
  wide: (g, k) => { g.sprite(14, 17, ['ww', 'wk', 'wk'], { w: WHITE, k }); g.sprite(18, 17, ['ww', 'wk', 'wk'], { w: WHITE, k }); },
  wink: (g, k) => { g.sprite(14, 18, ['wk', 'wk'], { w: WHITE, k }); g.sprite(18, 18, ['k.', '.k'], { k }); },
  focused: (g, k) => { g.rect(14, 18, 2, 1, k); g.sprite(18, 18, ['wk', 'kk'], { w: WHITE, k }); },
  dot: (g, k) => { g.set(15, 19, k); g.set(19, 19, k); },
};
const MOUTHS = {
  smile: (g, k) => g.sprite(18, 21, ['k..', '.kk'], { k }),
  grin: (g, k) => g.sprite(18, 21, ['kkk', '.ww'], { k, w: WHITE }),
  flat: (g, k) => g.rect(19, 22, 2, 1, k),
  open: (g, k) => g.sprite(19, 21, ['kk', 'kr'], { k, r: '#c2304a' }),
  smirk: (g, k) => g.sprite(18, 21, ['..k', 'kk.'], { k }),
  o: (g, k) => g.sprite(20, 21, ['k', 'k'], { k }),
  tongue: (g, k) => g.sprite(19, 21, ['kk', '.p'], { k, p: '#ff6f91' }),
};

// ---------------------------------------------------------------------------
// The 20 characters. Each lists its traits and draws its own costume.

const C = {
  red: '#d6334a', deepRed: '#a31f35', gold: '#f5c242', goldDark: '#c9902a', white: '#f7f7fb', silver: '#c9d1dd',
  steel: '#8e9aae', black: '#25232c', brown: '#7a4a2c', tan: '#c9a26b', blue: '#3d6fff', navy: '#22305e',
  green: '#3fa45a', pink: '#ff7ab8', purple: '#5b3fb0', cyan: '#3fd1ff', yellow: '#ffd23f', orange: '#ff8a1f',
};

const CHARACTERS = [
  {
    Character: 'Genesis', Body: ['Cream', CREAM], Background: ['Ink', INK], Eyes: 'Plain', Headwear: 'None', Outfit: 'None', Item: 'None',
    face: ['plain', 'flat'],
  },
  {
    Character: 'Astronaut', Body: ['Sky', '#7cc8ff'], Background: ['Periwinkle', '#dfe3ff'], Eyes: 'Starry', Headwear: 'Antenna Helmet', Outfit: 'Space Suit', Item: 'Flag',
    face: ['starry', 'smile'],
    draw(g) {
      g.cloth(C.white, 25, 31);
      g.sprite(13, 26, ['rb', '..', 'gg'], { r: C.red, b: C.blue, g: C.silver });
      g.rect(12, 25, 8, 1, C.silver);
      g.shape(20, 9, ['r', 'k', 'k', 'k'], { r: C.red, k: C.steel });
      g.rect(10, 16, 12, 1, mix(C.cyan, WHITE, 0.4));
      g.shape(22, 21, ['rrw', 'rww', 'k..', 'k..', 'k..', 'k..', 'k..'], { r: C.red, w: WHITE, k: C.steel });
    },
  },
  {
    Character: 'Samurai', Body: ['Tangerine', '#ff9a3d'], Background: ['Sand', '#f3e9d6'], Eyes: 'Fierce', Headwear: 'Hachimaki', Outfit: 'Red Armor', Item: 'Katana',
    face: ['fierce', 'flat'],
    draw(g) {
      g.cloth(C.deepRed, 25, 29);
      for (const y of [26, 28]) g.rect(11, y, 10, 1, C.gold);
      g.cloth(C.black, 30, 31);
      g.rect(10, 16, 12, 1, C.white);
      g.set(17, 16, C.red);
      g.shape(7, 16, ['ww.', '.ww'], { w: C.white });
      g.shape(22, 14, ['.....s', '....s.', '...s..', '..s...', '.k....', 'k.....'], { s: C.silver, k: C.black });
    },
  },
  {
    Character: 'Wizard', notch: '#5b3fb0', Body: ['Lilac', '#b9a4ff'], Background: ['Mint', '#d2f5ea'], Eyes: 'Wise', Headwear: 'Star Hat', Outfit: 'Robe', Item: 'Orb Staff',
    face: ['lidded', 'smile'],
    draw(g) {
      g.cloth(C.purple, 25, 31);
      for (const [x, y] of [[13, 27], [17, 29], [15, 26]]) g.set(x, y, C.gold);
      g.shape(11, 5, ['.......p..', '......pp..', '.....ppp..', '....pyp...', '....ppp...', '...pppp...', '...pppp...', '..pppppp..', 'PPPPPPPPPP'], { p: C.purple, P: '#3a2585', y: C.gold });
      g.shape(23, 12, ['.cc', 'cWc', '.cc', '.b.', '.b.', '.b.', '.b.', '.b.', '.b.', '.b.', '.b.', '.b.', '.b.', '.b.', '.b.', '.b.', '.b.', '.b.', '.b.'], { c: C.cyan, W: WHITE, b: C.brown });
    },
  },
  {
    Character: 'DJ', Body: ['Teal', '#2fb8a0'], Background: ['Bubblegum', '#ffdcee'], Eyes: 'Vibing', Headwear: 'Headphones', Outfit: 'Hoodie & Chain', Item: 'Vinyl',
    face: ['closed', 'grin'],
    draw(g) {
      g.cloth(C.black, 25, 29);
      g.sprite(13, 25, ['y....y', '.y..y.', '..yy..'], { y: C.gold });
      g.cloth(C.navy, 30, 31);
      g.sprite(9, 11, ['..kkkkkkkkkk..', '.k..........k.', 'k............k'], { k: INK });
      g.shape(8, 16, ['pp', 'pp', 'pp'], { p: C.pink });
      g.shape(22, 16, ['pp', 'pp', 'pp'], { p: C.pink });
      g.shape(23, 24, ['.kkk.', 'kkkkk', 'kkrkk', 'kkkkk', '.kkk.'], { k: '#3a3842', r: C.red });
    },
  },
  {
    Character: 'Chef', notch: '#ffffff', Body: ['Peach', '#ffc49b'], Background: ['Butter', '#fdf0d0'], Eyes: 'Proud', Headwear: 'Toque', Outfit: 'Chef Coat', Item: 'Spoon',
    face: ['proud', null],
    draw(g) {
      g.cloth(C.white, 25, 29);
      g.sprite(14, 26, ['k.k', '...', 'k.k'], { k: C.steel });
      g.rect(12, 25, 8, 1, C.red);
      g.cloth('#4a4a55', 30, 31);
      g.sprite(17, 21, ['kk.kk', 'k...k'], { k: '#5a3418' });
      g.shape(11, 5, ['..wwww..', '.wwwwww.', 'wwwwwwww', 'wwwwwwww', '.wwwwww.', '.wwwwww.', '.gggggg.'], { w: WHITE, g: '#d6dae3' });
      g.shape(23, 19, ['bb', 'bb', '.b', '.b', '.b', '.b', '.b'], { b: C.tan });
    },
  },
  {
    Character: 'Pirate', notch: '#2b2733', Body: ['Mint', '#87e9cd'], Background: ['Sky', '#d6eeff'], Eyes: 'Eye Patch', Headwear: 'Tricorn', Outfit: 'Striped Shirt', Item: 'Cutlass',
    face: ['dot', 'smirk'],
    draw(g) {
      g.cloth(C.white, 25, 29);
      for (const y of [26, 28]) g.rect(11, y, 10, 1, C.red);
      g.rect(12, 29, 8, 1, C.brown);
      g.cloth(C.navy, 30, 31);
      g.rect(18, 18, 3, 2, INK);
      g.rect(10, 17, 8, 1, INK);
      g.shape(9, 10, ['.kk.......kk.', 'kkkkkkkkkkkkk', '.kkkkkwkkkkk.', '..kkkkkkkkk..'], { k: '#2b2733', w: WHITE });
      g.shape(23, 19, ['...s', '..s.', '.s..', 'gs..', '.g..'], { s: C.silver, g: C.gold });
    },
  },
  {
    Character: 'Knight', Body: ['Rose', '#e8577f'], Background: ['Lime', '#e4f7c8'], Eyes: 'Brave', Headwear: 'Plume', Outfit: 'Plate Armor', Item: 'Shield',
    face: ['focused', 'flat'],
    draw(g) {
      g.cloth(C.steel, 25, 31);
      g.rect(11, 27, 10, 1, '#6c778a');
      g.shape(14, 8, ['..rr', '.rr.', 'rrr.', 'rr..', '.s..', '.s..', '.s..'], { r: C.red, s: C.steel });
      g.shape(6, 23, ['bbbb', 'bybb', 'yyyy', 'bybb', 'bybb', '.bb.'], { b: C.blue, y: C.gold });
      g.shape(23, 19, ['.s', '.s', '.s', '.s', 'gg', '.b'], { s: C.silver, g: C.gold, b: C.brown });
    },
  },
  {
    Character: 'Detective', notch: '#5a3e2b', Body: ['Mocha', '#9a6b4f'], Background: ['Aqua', '#d2f6f6'], Eyes: 'Curious', Headwear: 'Fedora', Outfit: 'Trench Coat', Item: 'Magnifier',
    face: ['wide', 'o'],
    draw(g) {
      g.cloth(C.tan, 25, 31);
      g.rect(11, 28, 10, 1, '#8a6a3a');
      g.sprite(14, 25, ['k..k', '.kk.'], { k: '#8a6a3a' });
      g.shape(9, 11, ['...bbbbbbb...', '...brrrrrb...', 'bbbbbbbbbbbbb'], { b: '#5a3e2b', r: '#2b1d14' });
      g.shape(23, 17, ['.ggg.', 'gcccg', 'gcwcg', 'gcccg', '.ggg.', '...b.', '....b'], { g: C.goldDark, c: '#bdeeff', w: WHITE, b: C.brown });
    },
  },
  {
    Character: 'Painter', notch: '#d6334a', Body: ['Blush', '#ffb3c8'], Background: ['Cloud', '#f1f0f5'], Eyes: 'Dreamy', Headwear: 'Beret', Outfit: 'Paint Smock', Item: 'Brush',
    face: ['happy', 'smile'],
    draw(g) {
      g.cloth('#8ea6c8', 25, 29);
      for (const [x, y, c] of [[13, 26, C.red], [16, 27, C.yellow], [18, 26, C.blue], [14, 28, C.green]]) g.set(x, y, c);
      g.cloth('#3a3a4a', 30, 31);
      g.shape(11, 11, ['.....k..', '.rrrrrr.', 'rrrrrrrr', '.rrrrrr.'], { r: C.red, k: INK });
      g.shape(23, 18, ['...r', '..b.', '.b..', 'b...'], { r: C.red, b: C.tan });
    },
  },
  {
    Character: 'Skater', notch: '#3d6fff', Body: ['Lime', '#b6e35a'], Background: ['Coral', '#ffdcdb'], Eyes: 'Chill', Headwear: 'Backwards Cap', Outfit: 'Graphic Tee', Item: 'Skateboard',
    face: ['lidded', 'grin'],
    draw(g) {
      g.cloth(C.orange, 25, 29);
      g.sprite(14, 26, ['ww', 'w.'], { w: WHITE });
      g.cloth('#3a5aa8', 30, 31);
      g.shape(8, 12, ['..bbbbbbbb..', 'bbbbbbbbbbbb'], { b: C.blue });
      g.shape(24, 20, ['w.', 'pk', 'pk', 'pk', 'pk', 'pk', 'pk', 'pk', 'w.'], { p: C.pink, k: '#2c2a33', w: WHITE });
    },
  },
  {
    Character: 'Gardener', notch: '#ecc764', Body: ['Coral', '#ff7a6b'], Background: ['Sage', '#e2ecd8'], Eyes: 'Gentle', Headwear: 'Straw Hat', Outfit: 'Overalls', Item: 'Watering Can',
    face: ['plain', 'smile'],
    draw(g) {
      g.cloth('#f4f4f8', 25, 26);
      g.cloth('#4a6fb0', 27, 31);
      g.sprite(13, 25, ['b....b', 'b....b'], { b: '#4a6fb0' });
      g.shape(7, 11, ['....yyrryy....', 'yyyyyyyyyyyyyyy'], { y: '#ecc764', r: C.red });
      g.shape(23, 24, ['gg..g', 'gggg.', 'ggg..', 'ggg..'], { g: C.green });
      g.set(28, 22, C.cyan); g.set(29, 24, C.cyan);
    },
  },
  {
    Character: 'Rockstar', notch: '#ff3d8b', Body: ['Charcoal', '#4a4a55'], Background: ['Peach', '#ffeadb'], Eyes: 'Wild', Headwear: 'Mohawk', Outfit: 'Leather Jacket', Item: 'Guitar',
    face: ['wink', 'tongue'],
    draw(g) {
      g.cloth('#1d1b22', 25, 29);
      g.rect(16, 25, 1, 5, C.silver);
      g.set(12, 26, C.silver); g.set(19, 26, C.silver);
      g.cloth('#2f3a5e', 30, 31);
      g.shape(13, 9, ['.p.p.p', 'pppppp', 'pppppp', 'pppppp'], { p: '#ff3d8b' });
      g.shape(20, 21, ['......kk', '.....k..', 'rrr.k...', 'rwrk....', 'rrrr....', '.rr.....'], { r: C.red, w: WHITE, k: C.black });
    },
  },
  {
    Character: 'Scientist', Body: ['Mustard', '#f2c14e'], Background: ['Purrl Blue', '#dbe5ec'], Eyes: 'Goggles', Headwear: 'Lab Goggles', Outfit: 'Lab Coat', Item: 'Flask',
    face: ['plain', 'open'],
    draw(g) {
      g.cloth(C.white, 25, 31);
      g.sprite(14, 25, ['k..k', '.kk.'], { k: '#b8bfcc' });
      g.sprite(12, 27, ['bc'], { b: C.blue, c: C.red });
      g.sprite(13, 17, ['kkkkkkkkk', 'kccckccck', 'kccckccck', 'kkkkkkkkk'], { k: '#3a3a4a', c: mix(C.cyan, WHITE, 0.45) });
      g.set(15, 18, INK); g.set(19, 18, INK);
      g.shape(23, 22, ['.w.', '.w.', 'wgw', 'ggg', 'ggg'], { w: '#e6f4ff', g: '#58e07a' });
      g.set(24, 20, '#9af0b0'); g.set(25, 19, '#9af0b0');
    },
  },
  {
    Character: 'Ninja', notch: '#2b2b36', Body: ['Cobalt', '#3d6fff'], Background: ['Pearl', '#f6eefb'], Eyes: 'Narrow', Headwear: 'Ninja Hood', Outfit: 'Gi', Item: 'Shuriken',
    face: ['dot', null],
    draw(g) {
      const hood = ramp('#2b2b36');
      for (const [x, y] of CAT_CELLS) if (inHead(x, y) && !(y >= 18 && y <= 20 && x >= 13)) g.set(x, y, hood[toneAt(x, y)]);
      g.cloth('#2b2b36', 25, 31);
      g.rect(11, 28, 10, 1, C.red);
      g.shape(7, 16, ['rr.', '.rr'], { r: C.red });
      g.shape(25, 17, ['.s.', 'sks', '.s.'], { s: C.silver, k: INK });
    },
  },
  {
    Character: 'King', notch: '#ffd35a', Body: ['Gold', '#f0b72f'], Background: ['Mauve', '#efdce9'], Eyes: 'Regal', Headwear: 'Crown', Outfit: 'Royal Cape', Item: 'Scepter',
    face: ['proud', 'smirk'],
    draw(g) {
      g.cloth(C.deepRed, 25, 31);
      g.sprite(11, 25, ['wkwwkwwkww'], { w: WHITE, k: INK });
      g.shape(13, 10, ['y.y.y.', 'yyyyyy', 'yrybyy', 'yyyyyy'], { y: '#ffd35a', r: C.red, b: C.blue });
      g.shape(23, 17, ['.b.', 'bWb', '.b.', '.g.', '.g.', '.g.', '.g.', '.g.', '.g.'], { b: C.blue, W: WHITE, g: C.gold });
    },
  },
  {
    Character: 'Diver', Body: ['Grape', '#7a4fd6'], Background: ['Lavender', '#ebdfff'], Eyes: 'Snorkel Mask', Headwear: 'Snorkel', Outfit: 'Swim Ring', Item: 'Rubber Duck',
    face: ['plain', 'o'],
    draw(g) {
      g.sprite(13, 17, ['kkkkkkkkk', 'kccckccck', 'kccckccck', 'kkkkkkkkk'], { k: C.orange, c: mix(C.cyan, WHITE, 0.4) });
      g.set(15, 18, INK); g.set(19, 18, INK);
      g.shape(12, 9, ['yyy', '..y', '..y', '..y', '..y', '..y', '..y'], { y: C.yellow });
      g.shape(9, 27, ['.rwrwrwrwrwrw.', 'rwrwrwrwrwrwrw', '.rwrwrwrwrwrw.'], { r: C.red, w: WHITE });
      g.shape(24, 27, ['.yy.', '.yko', 'yyy.', 'yyyy'], { y: C.yellow, o: C.orange, k: INK });
    },
  },
  {
    Character: 'Firefighter', notch: '#d6334a', Body: ['Ash', '#b8bcc6'], Background: ['Gold', '#f7e3a3'], Eyes: 'Alert', Headwear: 'Fire Helmet', Outfit: 'Turnout Coat', Item: 'Axe',
    face: ['wide', 'flat'],
    draw(g) {
      g.cloth('#3a3a44', 25, 31);
      for (const y of [27, 29]) g.rect(11, y, 10, 1, '#e8ff3d');
      g.shape(9, 11, ['...rrrrrr....', '..rrryyrrr...', 'rrrrrrrrrrrrr'], { r: C.red, y: C.gold });
      g.shape(23, 19, ['ss.', 'sbb', 's.b', '..b', '..b', '..b'], { s: C.silver, b: C.red });
    },
  },
  {
    Character: 'Cowboy', notch: '#9a6b3f', Body: ['Snow', '#fbfbff'], Background: ['Tangerine', '#ffe2c7'], Eyes: 'Squint', Headwear: 'Ten-Gallon Hat', Outfit: 'Sheriff Vest', Item: 'Lasso',
    face: ['focused', 'smirk'],
    draw(g) {
      g.cloth('#d6e2ef', 25, 29);
      g.cloth('#8a5a32', 25, 29, (x) => x < 14 || x > 17);
      g.set(15, 27, C.gold); g.set(16, 26, C.gold); g.set(16, 28, C.gold);
      g.cloth('#3a5aa8', 30, 31);
      g.shape(7, 9, ['.....bbbbbb....', '.....bbbbbb....', '.....rrrrrr....', 'b..bbbbbbbbbb.b', '.bbbbbbbbbbbbb.'], { b: '#9a6b3f', r: '#5a3a20' });
      g.shape(23, 22, ['.rrr.', 'r...r', 'r...r', '.rrr.', '..r..', '...r.'], { r: '#c9a26b' });
    },
  },
  {
    Character: 'Dreamer', notch: '#4a6fd6', Body: ['Midnight', '#2c2645'], Background: ['Lemon', '#fff5c2'], Eyes: 'Sleepy', Headwear: 'Nightcap', Outfit: 'Star Pajamas', Item: 'Teddy',
    face: ['closed', 'o'],
    draw(g) {
      g.cloth('#9ec5ff', 25, 31);
      for (const [x, y] of [[13, 26], [18, 28], [15, 30]]) g.set(x, y, C.yellow);
      g.shape(10, 9, ['..........ww', '........bbww', '......bbbb..', '...bbbbbbb..', 'bbbbbbbbbbb.', 'wwwwwwwwwwww'], { b: '#4a6fd6', w: WHITE });
      g.shape(23, 24, ['b..b', 'bbbb', 'bbkb', 'bbbb', '.bb.', 'b..b'], { b: '#b07a4a', k: INK });
      g.sprite(25, 10, ['zzz', '.z.', 'zzz'], { z: '#7a6fb0' });
      g.sprite(28, 6, ['zz', 'zz'], { z: '#a59ad6' });
    },
  },
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

export const TRAIT_TYPES = ['Character', 'Body', 'Background', 'Eyes', 'Headwear', 'Outfit', 'Item'];
const valueOf = (c, k) => (Array.isArray(c[k]) ? c[k][0] : c[k]);
const traitsOf = (c, id) => ({ id, ...Object.fromEntries(TRAIT_TYPES.map((k) => [k, valueOf(c, k)])) });

// Every trait value is worn by exactly one character.
for (const k of TRAIT_TYPES) {
  const values = CHARACTERS.map((c) => valueOf(c, k));
  const dupes = values.filter((v, i) => values.indexOf(v) !== i);
  if (dupes.length) throw new Error(`${k} repeats: ${dupes.join(', ')}`);
}

export const GENESIS = traitsOf(CHARACTERS[0], 0);
export const TRAITS = Object.fromEntries(TRAIT_TYPES.map((k) => [k, CHARACTERS.map((c) => valueOf(c, k))]));

// The collection is hand-designed, so there is nothing to roll.
export function generateCollection() {
  return CHARACTERS.map((c, id) => traitsOf(c, id));
}

// ---------------------------------------------------------------------------
// Rendering

export const STAGES = ['Logo', 'Silhouette', 'Light', 'Face', 'Traits'];
const byName = new Map(CHARACTERS.map((c) => [c.Character, c]));
// Eyewear that replaces the drawn eyes.
const COVERED = new Set(['Eye Patch', 'Goggles', 'Snorkel Mask', 'Narrow']);

// Returns SIZE×SIZE hex colours, row-major. `stage` stops the build early.
export function renderGrid(t, stage = STAGES.length - 1) {
  const c = byName.get(t.Character) ?? CHARACTERS[0];
  const g = new Grid();
  const logo = stage === 0;
  const body = logo ? CREAM : c.Body[1];
  const bg = logo ? INK : c.Background[1];
  g.rect(0, 0, SIZE, SIZE, bg);
  const r = ramp(body);
  for (const [x, y] of CAT_CELLS) g.set(x, y, stage >= 2 ? r[toneAt(x, y)] : body);
  if (bg !== INK) for (const [x, y] of OUTLINE_CELLS) g.set(x, y, INK);
  if (stage < 2) return g.px;
  const ink = luminance(body) < 0.4 ? FACE_LIGHT : FACE;
  if (stage >= 4) {
    // A hat fills the notch between the peaks so it sits on the head.
    c.draw?.(g);
    if (c.notch)
      for (let y = 13; y <= 15; y++)
        for (let x = 13; x <= 18; x++) if ([INK, c.Background[1]].includes(g.get(x, y))) g.set(x, y, ramp(c.notch)[1]);
  }
  if (stage >= 3) {
    const [eyes, mouth] = c.face;
    if (stage < 4 || !COVERED.has(c.Eyes)) EYES[eyes]?.(g, ink);
    else if (c.Eyes === 'Eye Patch') EYES.dot(g, ink);
    if (c.Character === 'Ninja' && stage >= 4) { g.rect(14, 19, 2, 1, FACE_LIGHT); g.rect(18, 19, 2, 1, FACE_LIGHT); g.set(15, 19, INK); g.set(19, 19, INK); }
    if (mouth) MOUTHS[mouth](g, ink);
  }
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

// --- Rarity ------------------------------------------------------------------

const ACCESSORIES = ['Headwear', 'Outfit', 'Item'];
export const accessoryCount = (t) => ACCESSORIES.filter((k) => t[k] && t[k] !== 'None').length;

// Trait counts (every value is 1/1) and a rank kept for API compatibility.
export function rarity(collection) {
  const counts = Object.fromEntries([...TRAIT_TYPES, 'Accessories'].map((k) => [k, {}]));
  const value = (t, k) => (k === 'Accessories' ? accessoryCount(t) : t[k] ?? 'None');
  for (const t of collection) for (const k of Object.keys(counts)) counts[k][value(t, k)] = (counts[k][value(t, k)] ?? 0) + 1;
  return { counts, rank: new Map(collection.map((t, i) => [t.id, i + 1])) };
}

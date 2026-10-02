// Builds the CryptoPurrls collection into dist/.
//
//   node scripts/build.mjs          mosaic, collection JSON, rarity, provenance, previews
//   node scripts/build.mjs --all    also every Purrl as a 480px PNG + ERC-721 metadata JSON
//
// Hashes are taken over raw RGBA pixels (not PNG bytes, which vary between
// zlib versions), so anyone can reproduce them from src/purrl.js alone.

import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { attributes, generateCollection, LEGENDARY, rarity, renderRGBA, SEED, SIZE, SUPPLY } from '../src/purrl.js';
import { encodePNG, upscale } from './png.mjs';

const DIST = new URL('../dist/', import.meta.url);
const path = (p) => new URL(p, DIST);
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const writeJSON = (p, data) => writeFileSync(path(p), JSON.stringify(data, null, 2) + '\n');

mkdirSync(DIST, { recursive: true });
const collection = generateCollection();
const pixels = collection.map((t) => renderRGBA(t));

const { counts, rank } = rarity(collection);
writeJSON('rarity.json', counts);
writeFileSync(path('purrls.json'), '[\n' + collection.map((t) => JSON.stringify({ ...t, rank: rank.get(t.id) })).join(',\n') + '\n]\n');

// --- The mosaic: all 10,000 at 1×, 100 per row, 2400×2400.
const COLS = 100, W = COLS * SIZE;
const mosaic = new Uint8Array(W * W * 4);
pixels.forEach((px, id) => {
  const ox = (id % COLS) * SIZE, oy = Math.floor(id / COLS) * SIZE;
  for (let y = 0; y < SIZE; y++) mosaic.set(px.subarray(y * SIZE * 4, (y + 1) * SIZE * 4), ((oy + y) * W + ox) * 4);
});
writeFileSync(path('purrls.png'), encodePNG(W, W, mosaic));

// --- Provenance.
const provenance = {
  collection: 'CryptoPurrls',
  supply: SUPPLY,
  seed: '0x' + SEED.toString(16),
  // sha256 over the concatenated per-Purrl sha256 hex digests, in id order.
  provenanceHash: sha256(pixels.map((px) => sha256(px)).join('')),
  // sha256 of the mosaic's raw RGBA pixels (row-major, 2400×2400).
  mosaicSha256: sha256(mosaic),
};
writeJSON('provenance.json', provenance);

// The gallery in site/ loads these two files from beside itself.
copyFileSync(new URL('../src/purrl.js', import.meta.url), new URL('../site/purrl.js', import.meta.url));
copyFileSync(path('provenance.json'), new URL('../site/provenance.json', import.meta.url));

// --- Previews.
function sheet(file, ids, cols, scale, gap = 0, bg = [11, 11, 13]) {
  const rows = Math.ceil(ids.length / cols), cell = SIZE * scale + gap;
  const w = cols * cell + gap, h = rows * cell + gap;
  const out = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) out.set([...bg, 255], i * 4);
  ids.forEach((id, i) => {
    const big = upscale(SIZE, SIZE, pixels[id], scale), ox = gap + (i % cols) * cell, oy = gap + Math.floor(i / cols) * cell;
    for (let y = 0; y < SIZE * scale; y++) out.set(big.subarray(y * SIZE * scale * 4, (y + 1) * SIZE * scale * 4), ((oy + y) * w + ox) * 4);
  });
  writeFileSync(path(file), encodePNG(w, h, out));
}
const byFur = (fur) => collection.filter((t) => t.Fur === fur).sort((a, b) => rank.get(a.id) - rank.get(b.id)).map((t) => t.id);
sheet('preview.png', Array.from({ length: 40 }, (_, i) => i + 1), 10, 8);
sheet('legendary.png', [0, ...byFur('Pearl')], 5, 12, 12);
// One column per fixed-supply fur, rarest on the left, its four rarest Purrls stacked.
const tiers = LEGENDARY.slice(1);
sheet('tiers.png', [0, 1, 2, 3].flatMap((row) => tiers.map((fur) => byFur(fur)[row])), tiers.length, 6, 6);

// --- Optional: every Purrl as a 480px PNG plus ERC-721 metadata, ready for IPFS.
if (process.argv.includes('--all')) {
  mkdirSync(path('images'), { recursive: true });
  mkdirSync(path('metadata'), { recursive: true });
  for (const t of collection) {
    writeFileSync(path(`images/${t.id}.png`), encodePNG(480, 480, upscale(SIZE, SIZE, pixels[t.id], 20)));
    writeJSON(`metadata/${t.id}.json`, {
      name: `CryptoPurrl #${t.id}`,
      description: t.id === 0
        ? 'Genesis. The Purrl logo itself, the silhouette every other Purrl is grown from.'
        : 'One of 10,000 CryptoPurrls: 24×24 pixel cats grown from the Purrl logo.',
      image: `ipfs://<IMAGES_CID>/${t.id}.png`,
      attributes: [...attributes(t), { trait_type: 'Rarity Rank', value: rank.get(t.id) }],
    });
  }
}

const top = [...rank].filter(([, r]) => r <= 5).map(([id]) => `#${id}`).join(', ');
console.log(`Built ${collection.length} Purrls → dist/  (rarest: ${top})`);
console.log(`Provenance ${provenance.provenanceHash}`);

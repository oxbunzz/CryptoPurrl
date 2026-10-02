// Renders a hand-drawn pixel map (art/*.txt) to a PNG using a named palette.
//   node scripts/draw.mjs art/purrl-01.txt out.png [scale]
import { readFileSync, writeFileSync } from 'node:fs';
import { encodePNG, upscale } from './png.mjs';

export const PALETTE = {
  '.': '#7f9cb0', // background
  k: '#141018',   // outline
  F: '#8a5a3c', f: '#6b4430', h: '#a8724c', // fur
  S: '#f2c9a0', s: '#d9a77e',               // face
  W: '#ffffff',
  O: '#ff8a1f', o: '#c96a10', w: '#ffffff', // hoodie
};

export function drawMap(text, palette = PALETTE) {
  const rows = text.trimEnd().split('\n');
  const h = rows.length, w = rows[0].length, out = new Uint8Array(w * h * 4);
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const hex = palette[ch];
    if (!hex) throw new Error(`no colour for "${ch}" at ${x},${y}`);
    out.set([...[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)), 255], (y * w + x) * 4);
  }));
  return { w, h, rgba: out };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [src, dst, scale = 16] = process.argv.slice(2);
  const { w, h, rgba } = drawMap(readFileSync(src, 'utf8'));
  writeFileSync(dst, encodePNG(w * scale, h * scale, upscale(w, h, rgba, +scale)));
}

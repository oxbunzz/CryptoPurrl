// node renderN.mjs <dir name under art/> <size> <cols> <scale>
import { readFileSync, writeFileSync } from 'node:fs';
import { drawMap } from '/home/user/CryptoPurrl/scripts/draw.mjs';
import { encodePNG, upscale } from '/home/user/CryptoPurrl/scripts/png.mjs';
const [name0, N0, C0, S0] = process.argv.slice(2), N = +N0, cols = +C0, S = +S0;
const dir = `/home/user/CryptoPurrl/art/${name0}/`;
const pals = JSON.parse(readFileSync(dir + 'palettes.json', 'utf8'));
const gap = 8, cell = N * S, names = Object.keys(pals);
const rows = Math.ceil(names.length / cols), Wd = cols * cell + (cols + 1) * gap, Hd = rows * cell + (rows + 1) * gap;
const out = new Uint8Array(Wd * Hd * 4).fill(40);
names.forEach((name, i) => {
  const { rgba } = drawMap(readFileSync(dir + name + '.txt', 'utf8'), pals[name]);
  const big = upscale(N, N, rgba, S);
  writeFileSync(dir + name + '.png', encodePNG(N * 10, N * 10, upscale(N, N, rgba, 10)));
  const ox = gap + (i % cols) * (cell + gap), oy = gap + Math.floor(i / cols) * (cell + gap);
  for (let y = 0; y < cell; y++) out.set(big.subarray(y * cell * 4, (y + 1) * cell * 4), ((oy + y) * Wd + ox) * 4);
});
for (let i = 3; i < out.length; i += 4) out[i] = 255;
writeFileSync(`/home/user/CryptoPurrl/art/${name0}.png`, encodePNG(Wd, Hd, out));

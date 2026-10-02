// Local preview for the gallery: serves site/ and wraps index.html (a page
// fragment, as published) in a full HTML document.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

const ROOT = new URL('../site/', import.meta.url);
const PORT = Number(process.env.PORT ?? 4173);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json' };

createServer(async (req, res) => {
  const name = new URL(req.url, 'http://x').pathname.slice(1) || 'index.html';
  try {
    if (name.includes('..')) throw new Error('bad path');
    let body = await readFile(new URL(name, ROOT));
    if (name === 'index.html') {
      body = '<!doctype html><html lang="vi"><head><meta charset="utf-8">'
        + '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
        + `</head><body>${body}</body></html>`;
    }
    res.writeHead(200, { 'content-type': TYPES[extname(name)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found. Run `npm run build` first if purrl.js or provenance.json is missing.');
  }
}).listen(PORT, () => console.log(`CryptoPurrls gallery → http://localhost:${PORT}`));

// Zero-dependency static server: `npm start` then open http://localhost:5200
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const port = Number(process.env.PORT) || 5200;

createServer(async (req, res) => {
  let path;
  try { path = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400).end('bad request'); return; }
  const file = normalize(join(root, path === '/' ? 'index.html' : path));
  // only files inside the project, known types, no dotfiles, not the server or tests
  if (!file.startsWith(root) || !types[extname(file)] || file.slice(root.length).split(sep).some(p => p.startsWith('.')) || /(server|test)\.js$/.test(file)) {
    res.writeHead(404).end('not found'); return;
  }
  try {
    res.writeHead(200, { 'content-type': types[extname(file)] + '; charset=utf-8', 'x-content-type-options': 'nosniff' }).end(await readFile(file));
  } catch { res.writeHead(404).end('not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Window Marbles -> http://localhost:${port}`));

import { resolve, extname } from 'path';
import { existsSync, readFileSync } from 'fs';

const PORT = 3000;
const ROOT = resolve(import.meta.dir);

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.mjs':  'application/javascript',
  '.css':  'text/css',
  '.map':  'application/json',
  '.ts':   'application/javascript',
};

Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/') {
      return Response.redirect(`http://localhost:${PORT}/example/index.html`, 302);
    }
    const pathname = url.pathname;
    const filePath = resolve(ROOT, '.' + pathname);

    if (!filePath.startsWith(ROOT) || !existsSync(filePath)) {
      return new Response('Not found', { status: 404 });
    }

    const type = MIME[extname(filePath)] ?? 'application/octet-stream';
    return new Response(readFileSync(filePath), { headers: { 'Content-Type': type } });
  },
});

console.log(`Dev server: http://localhost:${PORT}`);

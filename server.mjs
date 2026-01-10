import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const port = Number.parseInt(process.env.PORT ?? '8080', 10);
const publicDir = path.resolve(process.cwd(), 'gallery', 'dist');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
};

function safeResolve(requestPath) {
  const decoded = decodeURIComponent(requestPath);
  const cleaned = decoded.split('?')[0]?.split('#')[0] ?? '/';
  const relative = cleaned.replace(/^\/+/, '');
  const joined = path.join(publicDir, relative);
  const resolved = path.resolve(joined);
  if (!resolved.startsWith(publicDir)) {
    return publicDir;
  }
  return resolved;
}

function setCommonHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
}

function setCacheHeaders(res, filePath) {
  const ext = path.extname(filePath);
  if (ext === '.html') {
    res.setHeader('Cache-Control', 'no-cache');
    return;
  }

  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
}

const server = http.createServer(async (req, res) => {
  try {
    setCommonHeaders(res);

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Method Not Allowed');
      return;
    }

    const url = req.url ?? '/';

    if (url === '/healthz') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('ok');
      return;
    }

    let filePath = safeResolve(url);

    if (existsSync(filePath) && statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      filePath = path.join(publicDir, 'index.html');
      if (!existsSync(filePath)) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Build output not found');
        return;
      }
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] ?? 'application/octet-stream';

    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    setCacheHeaders(res, filePath);

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    if (ext === '.html') {
      const html = await readFile(filePath);
      res.end(html);
      return;
    }

    const stream = createReadStream(filePath);
    stream.on('error', () => {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Server Error');
    });
    stream.pipe(res);
  } catch {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Server Error');
  }
});

server.listen(port, () => {
  if (!existsSync(publicDir) || !statSync(publicDir).isDirectory()) {
    console.error(`Expected build output directory not found: ${publicDir}`);
  }
  console.log(`Listening on ${port}`);
});

// Serves the production build with an SPA fallback, for Playwright, and passes /api (HTTP and
// WebSocket upgrades) to the API Worker running locally, as the service binding will in production.
// Usage: node scripts/serve-dist.mjs [port]; API_ORIGIN overrides http://localhost:8787.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, request as forward } from 'node:http';
import { connect } from 'node:net';
import { extname, join, normalize } from 'node:path';

const ROOT = join('dist', 'super-tic-tac-toe', 'browser');
const PORT = Number(process.argv[2] ?? 4400);
const API = new URL(process.env.API_ORIGIN ?? 'http://localhost:8787');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
};

const isApi = (url = '/') => url === '/api' || url.startsWith('/api/');

/** An API request, passed through as it came. */
function proxy(request, response) {
  const upstream = forward(
    {
      hostname: API.hostname,
      port: API.port,
      path: request.url,
      method: request.method,
      headers: { ...request.headers, host: API.host },
    },
    (reply) => {
      response.writeHead(reply.statusCode ?? 502, reply.headers);
      reply.pipe(response);
    },
  );
  upstream.on('error', () => {
    response.writeHead(502).end('The API is not running (task api:dev).');
  });
  request.pipe(upstream);
}

const server = createServer((request, response) => {
  if (isApi(request.url)) {
    proxy(request, response);
    return;
  }
  const path = normalize(decodeURIComponent(new URL(request.url ?? '/', 'http://x').pathname));
  let file = join(ROOT, path);
  if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) {
    file = join(ROOT, 'index.html');
  }
  response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(response);
});

// A room's socket: the upgrade request goes to the API as raw bytes, then both sides are piped.
server.on('upgrade', (request, socket, head) => {
  if (!isApi(request.url)) {
    socket.destroy();
    return;
  }
  const upstream = connect(Number(API.port), API.hostname, () => {
    const headers = Object.entries({ ...request.headers, host: API.host })
      .map(([name, value]) => `${name}: ${Array.isArray(value) ? value.join(', ') : value}`)
      .join('\r\n');
    upstream.write(`${request.method} ${request.url} HTTP/1.1\r\n${headers}\r\n\r\n`);
    upstream.write(head);
    upstream.pipe(socket);
    socket.pipe(upstream);
  });
  upstream.on('error', () => socket.destroy());
  socket.on('error', () => upstream.destroy());
});

server.listen(PORT, () =>
  console.log(`Serving ${ROOT} on http://localhost:${PORT}, /api → ${API}`),
);

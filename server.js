#!/usr/bin/env node
/* ============================================================================
 * FELIX — optional local server
 * ----------------------------------------------------------------------------
 * Serves the app AND proxies OpenAI, so your API key stays on this machine and
 * never reaches the browser. This is the recommended way to run the OpenAI
 * engine; pasting a key into the settings sheet works too, but then the key
 * lives in the browser.
 *
 *   export OPENAI_API_KEY=sk-...
 *   node server.js
 *   # open http://localhost:8000, gear → OpenAI → Proxy URL: /api
 *
 * Node 18+ (needs global fetch). No dependencies.
 *
 * Routes:
 *   POST /api/chat            → /v1/chat/completions
 *   POST /api/speech          → /v1/audio/speech
 *   POST /api/realtime-token  → /v1/realtime/client_secrets
 *   everything else           → static files from this directory
 * ==========================================================================*/

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8000;
const KEY  = process.env.OPENAI_API_KEY;
const OA   = 'https://api.openai.com/v1';

if (!KEY) {
  console.warn('\x1b[33mOPENAI_API_KEY is not set — the /api routes will return 500.\x1b[0m');
  console.warn('The app still serves fine; the browser and ElevenLabs engines do not need it.\n');
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md':   'text/markdown; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png'
};

const readBody = req => new Promise((resolve, reject) => {
  let b = '';
  req.on('data', c => {
    b += c;
    if (b.length > 1e6) { reject(new Error('Body too large')); req.destroy(); }
  });
  req.on('end', () => resolve(b));
  req.on('error', reject);
});

/* Forward to OpenAI with the server-held key. */
async function forward(res, upstream, body, binary) {
  if (!KEY) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: { message: 'OPENAI_API_KEY is not set on the server' } }));
  }

  try {
    const r = await fetch(OA + upstream, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
      body
    });

    if (binary) {
      const buf = Buffer.from(await r.arrayBuffer());
      res.writeHead(r.status, { 'Content-Type': r.headers.get('content-type') || 'audio/mpeg' });
      return res.end(buf);
    }

    const text = await r.text();
    res.writeHead(r.status, { 'Content-Type': 'application/json' });
    res.end(text);
  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { message: 'Upstream request failed: ' + err.message } }));
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const route = url.pathname;

  if (route.startsWith('/api/')) {
    if (req.method !== 'POST') { res.writeHead(405).end('Method Not Allowed'); return; }

    let body;
    try { body = await readBody(req); }
    catch { res.writeHead(413).end('Payload Too Large'); return; }

    if (route === '/api/chat')           return forward(res, '/chat/completions', body, false);
    if (route === '/api/speech')         return forward(res, '/audio/speech', body, true);
    if (route === '/api/realtime-token') return forward(res, '/realtime/client_secrets', body, false);

    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: { message: 'Unknown API route ' + route } }));
  }

  // Static files, confined to this directory.
  const rel = route === '/' ? 'index.html' : decodeURIComponent(route).replace(/^\/+/, '');
  const file = path.resolve(__dirname, rel);
  if (!file.startsWith(__dirname)) { res.writeHead(403).end('Forbidden'); return; }

  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`FELIX on http://localhost:${PORT}`);
  console.log(KEY ? 'OpenAI proxy ready — set Proxy URL to /api in the gear panel.'
                  : 'OpenAI proxy disabled (no OPENAI_API_KEY).');
});

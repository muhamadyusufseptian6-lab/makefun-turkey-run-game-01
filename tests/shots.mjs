// Screenshot harness: serves game/ on localhost, drives the Playwright
// headless shell over CDP with Node's global WebSocket, captures 4 JPEGs.
// Each shot opens ?shot=N, which stages a frozen, deterministic scene.
// Usage: node tests/shots.mjs
import { createServer } from 'node:http';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
const gameDir = join(root, 'game');
const shotDir = join(root, 'screenshots');
const SHELL = `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell`;
const PORT = 8124;
const CDP_PORT = 9334;

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg' };

const server = createServer(async (req, res) => {
  try {
    const path = req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0];
    const file = join(gameDir, decodeURIComponent(path));
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME['.' + file.split('.').pop()] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const chrome = spawn(SHELL, [
  '--headless',
  `--remote-debugging-port=${CDP_PORT}`,
  '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
  '--window-size=1280,720', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cdpVersion() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
      if (res.ok) return await res.json();
    } catch { /* not up yet */ }
    await sleep(250);
  }
  throw new Error('headless shell did not start CDP');
}

const SHOTS = [
  { n: 1, file: '1-title.jpg' },
  { n: 2, file: '2-farmyard.jpg' },
  { n: 3, file: '3-kitchen.jpg' },
  { n: 4, file: '4-escaped.jpg' },
];

let failures = 0;
try {
  await cdpVersion();
  for (const shot of SHOTS) {
    const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?http://127.0.0.1:${PORT}/index.html?shot=${shot.n}`, { method: 'PUT' });
    const target = await res.json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
    let id = 0;
    const pending = new Map();
    const errors = [];
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
      if (msg.method === 'Runtime.exceptionThrown') errors.push(JSON.stringify(msg.params.exceptionDetails).slice(0, 400));
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        errors.push(msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 300));
      }
    };
    const send = (method, params = {}) => new Promise((resolve) => {
      const mid = ++id;
      pending.set(mid, resolve);
      ws.send(JSON.stringify({ id: mid, method, params }));
    });
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
    for (let i = 0; i < 30; i++) {
      const r = await send('Runtime.evaluate', { expression: 'window.__ready === true', returnByValue: true });
      if (r.result?.result?.value) break;
      await sleep(200);
    }
    await sleep(1800);
    const shotRes = await send('Page.captureScreenshot', { format: 'jpeg', quality: 88 });
    const buf = Buffer.from(shotRes.result.data, 'base64');
    await writeFile(join(shotDir, shot.file), buf);
    const st = await stat(join(shotDir, shot.file));
    const status = errors.length === 0 ? 'OK ' : 'ERR';
    console.log(`${status} shot ${shot.n} -> ${shot.file} (${st.size} bytes)${errors.length ? ' console errors: ' + errors.join(' | ') : ''}`);
    if (errors.length) failures++;
    if (st.size > 262144) { console.log(`FAIL shot ${shot.n} over 256 KiB`); failures++; }
    ws.close();
    await fetch(`http://127.0.0.1:${CDP_PORT}/json/close/${target.id}`).catch(() => {});
    await sleep(300);
  }
} finally {
  chrome.kill();
  server.close();
}

console.log(failures === 0 ? 'ALL SHOTS OK' : `${failures} SHOT PROBLEM(S)`);
process.exit(failures === 0 ? 0 : 1);

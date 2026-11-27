// Playtest harness: boots the game with no ?shot, presses Enter to start,
// holds Right + jumps a few times, and reports the live state via
// window.__debug. Fails on console errors or if the run never advances.
// Usage: node tests/playtest.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
const gameDir = join(root, 'game');
const SHELL = `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell`;
const PORT = 8125;
const CDP_PORT = 9335;

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

const server = createServer(async (req, res) => {
  try {
    const path = req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0];
    const data = await readFile(join(gameDir, decodeURIComponent(path)));
    res.writeHead(200, { 'Content-Type': MIME['.' + path.split('.').pop()] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const chrome = spawn(SHELL, [
  '--headless', `--remote-debugging-port=${CDP_PORT}`,
  '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
  '--window-size=1280,720', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
function fail(msg) { console.log('FAIL  ' + msg); failures++; }

try {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
      if (res.ok) break;
    } catch { /* not up yet */ }
    await sleep(250);
  }
  const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?http://127.0.0.1:${PORT}/index.html`, { method: 'PUT' });
  const target = await res.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0;
  const pending = new Map();
  const errors = [];
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    if (msg.method === 'Runtime.exceptionThrown') errors.push(JSON.stringify(msg.params.exceptionDetails).slice(0, 300));
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      errors.push(msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 200));
    }
  };
  const send = (method, params = {}) => new Promise((resolve) => {
    const mid = ++id;
    pending.set(mid, resolve);
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
  const evalJs = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    return r.result?.result?.value;
  };
  const key = async (type, code, keyName, vk) => {
    await send('Input.dispatchKeyEvent', { type, code, key: keyName, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  for (let i = 0; i < 30; i++) {
    if (await evalJs('window.__ready === true')) break;
    await sleep(200);
  }
  const before = await evalJs('window.__debug.getState()');
  console.log('before start:', JSON.stringify(before));
  if (!before || before.screen !== 'title') fail('expected title screen, got ' + JSON.stringify(before));

  // Start the run with Enter, then run right and jump twice.
  await key('keyDown', 'Enter', 'Enter', 13);
  await key('keyUp', 'Enter', 'Enter', 13);
  await sleep(300);
  await key('keyDown', 'ArrowRight', 'ArrowRight', 39);
  await sleep(1200);
  await key('keyDown', 'Space', ' ', 32);
  await key('keyUp', 'Space', ' ', 32);
  await sleep(900);
  await key('keyDown', 'Space', ' ', 32);
  await key('keyUp', 'Space', ' ', 32);
  await sleep(1500);
  const mid = await evalJs('window.__debug.getState()');
  console.log('mid-run:    ', JSON.stringify(mid));
  await key('keyUp', 'ArrowRight', 'ArrowRight', 39);
  if (!mid || mid.screen !== 'play') fail('expected play screen, got ' + JSON.stringify(mid));
  if (mid && mid.turkeyX <= 130) fail('turkey did not move right (x=' + mid?.turkeyX + ')');
  if (mid && mid.distanceYards <= 0) fail('distance never increased');
  if (mid && mid.hazards < 5) fail('too few hazards generated: ' + mid.hazards);
  if (errors.length) fail('console errors: ' + errors.join(' | '));
  console.log(errors.length === 0 ? 'no console errors' : 'console errors seen');
  ws.close();
} finally {
  chrome.kill();
  server.close();
}

console.log(failures === 0 ? 'PLAYTEST OK' : `${failures} PLAYTEST PROBLEM(S)`);
process.exit(failures === 0 ? 0 : 1);

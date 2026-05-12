/**
 * Captura as 5 screenshots da Play Store usando Puppeteer.
 * Resolução: 1080x1920 (padrão Google Play).
 *
 * Uso: node store-assets/capture.mjs
 */

import puppeteer from 'puppeteer';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' };
const WIDTH  = 1080;
const HEIGHT = 1920;

// ─── Servidor HTTP local ───────────────────────────────────────────────────
const server = createServer((req, res) => {
  const filePath = join(__dirname, req.url === '/' ? '/index.html' : req.url + (extname(req.url) ? '' : '.html'));
  if (existsSync(filePath)) {
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'text/plain' });
    res.end(readFileSync(filePath));
  } else {
    res.writeHead(404); res.end('Not found');
  }
});

await new Promise(r => server.listen(9999, r));
console.log('Servidor rodando em http://localhost:9999');

// ─── Puppeteer ────────────────────────────────────────────────────────────
const browser = await puppeteer.launch({ headless: true });
const page    = await browser.newPage();
await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });

const assets = [
  { url: 's1',       label: '01-identificar', w: 1080, h: 1920 },
  { url: 's2',       label: '02-cuidados',    w: 1080, h: 1920 },
  { url: 's3',       label: '03-jardim',      w: 1080, h: 1920 },
  { url: 's4',       label: '04-rega',        w: 1080, h: 1920 },
  { url: 's5',       label: '05-historico',   w: 1080, h: 1920 },
  { url: 'icon512',  label: 'icon-512',       w:  512, h:  512  },
  { url: 'feature',  label: 'feature-1024x500', w: 1024, h: 500  },
];

for (const asset of assets) {
  await page.setViewport({ width: asset.w, height: asset.h, deviceScaleFactor: 1 });
  await page.goto(`http://localhost:9999/${asset.url}`, { waitUntil: 'networkidle0' });
  const out = join(__dirname, `${asset.label}.png`);
  await page.screenshot({ path: out, fullPage: false });
  console.log(`✅  ${asset.label}.png`);
}

await browser.close();
server.close();
console.log('\n🎉 Todas as screenshots salvas em store-assets/');

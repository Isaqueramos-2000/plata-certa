/**
 * Captura todos os assets v2 da Play Store usando Puppeteer.
 * Inclui ícone (512), banner (1024×500) e 5 screenshots (1080×1920).
 */

import puppeteer from 'puppeteer';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml' };

// Static server pra Puppeteer carregar via http (necessário pro Google Fonts)
const server = createServer((req, res) => {
  const filePath = join(__dirname, req.url === '/' ? '/index.html' : (req.url + (extname(req.url) ? '' : '.html')));
  if (existsSync(filePath)) {
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'text/plain' });
    res.end(readFileSync(filePath));
  } else {
    res.writeHead(404); res.end('Not found');
  }
});
await new Promise(r => server.listen(9999, r));
console.log('Servidor rodando em http://localhost:9999');

const browser = await puppeteer.launch({ headless: true });
const page    = await browser.newPage();

const assets = [
  { url: 'icon',     label: 'icon-512',         w:  512, h:  512 },
  { url: 'feature',  label: 'feature-1024x500', w: 1024, h:  500 },
  { url: 's1',       label: '01-identificar',   w: 1080, h: 1920 },
  { url: 's2',       label: '02-cuidados',      w: 1080, h: 1920 },
  { url: 's3',       label: '03-jardim',        w: 1080, h: 1920 },
  { url: 's4',       label: '04-rega',          w: 1080, h: 1920 },
  { url: 's5',       label: '05-historico',     w: 1080, h: 1920 },
];

for (const a of assets) {
  await page.setViewport({ width: a.w, height: a.h, deviceScaleFactor: 1 });
  await page.goto(`http://localhost:9999/${a.url}`, { waitUntil: 'networkidle0' });
  // Espera fontes carregarem
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 200));
  const out = join(__dirname, `${a.label}.png`);
  await page.screenshot({ path: out, fullPage: false });
  console.log(`✅  ${a.label}.png`);
}

await browser.close();
server.close();
console.log('\n🎉 Assets v2 salvos em store-assets/v2/');

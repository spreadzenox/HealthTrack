// Rendu de l'esquisse 2 « Figurine de collection » (Pilou plus réaliste, 10 s).
// Prérequis : servir /home/user/halcya-videos sur le port 8122 :
//   python3 -m http.server 8122 --bind 127.0.0.1 --directory /home/user/halcya-videos
// Usage :
//   node render.mjs                      → pilou-figurine.mp4 puis apercu.png et petit.png
//   node render.mjs --stills 1000,5200   → captures PNG dans _travail/stills
//   node render.mjs --apercu [--t 5200]  → apercu.png seul (rendu ×2 puis réduit, Lanczos)
//   node render.mjs --petit              → petit.png seul (taille de l'écran d'accueil, fond de l'app)
// La vidéo est rendue par tranches reprenables (_travail/seg) : si le navigateur tombe, la tranche est refaite.
import { createRequire } from 'module';
import { spawn, execFileSync } from 'child_process';
import { mkdirSync, existsSync, renameSync, writeFileSync, appendFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const DIR = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://127.0.0.1:8122/pilou-realiste-2-figurine/prototype.html';
const FPS = 30, OUT = path.join(DIR, 'pilou-figurine.mp4'), LOG = path.join(DIR, '_travail', 'render.log');
const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const log = m => { console.log(m); appendFileSync(LOG, m + '\n'); };
mkdirSync(path.join(DIR, '_travail'), { recursive: true });

async function open(query = '?render=1', viewport = { width: 1920, height: 1080 }, dsf = 1) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport, deviceScaleFactor: dsf });
  page.on('pageerror', e => log('Erreur page : ' + e.message));
  await page.goto(BASE + query, { waitUntil: 'load' });
  await page.evaluate(async () => { await document.fonts.ready; await window.__ready; });
  return { browser, page };
}

async function apercu() {
  const t = +arg('--t', 5200);
  const { browser, page } = await open('?render=1&ss=2', { width: 1920, height: 1080 }, 2);
  await page.evaluate(t => window.seek(t), t);
  const big = path.join(DIR, '_travail', 'apercu-x2.png');
  await page.screenshot({ path: big });
  await browser.close();
  execFileSync('convert', [big, '-filter', 'Lanczos', '-resize', '1920x1080', path.join(DIR, 'apercu.png')]);
  log('Aperçu : apercu.png (t = ' + t + ' ms, rendu 3840×2160 réduit)');
}
async function petit() {
  const { browser, page } = await open('?petit=1', { width: 390, height: 330 }, 1);
  await page.evaluate(() => window.seek(9200));
  await page.locator('#stage').screenshot({ path: path.join(DIR, 'petit.png') });
  await browser.close();
  log('Petit : petit.png (390×330, Pilou ≈ 240 px)');
}

if (args.includes('--apercu')) { await apercu(); process.exit(0); }
if (args.includes('--petit')) { await petit(); process.exit(0); }
if (args.includes('--stills')) {
  const out = path.join(DIR, '_travail', 'stills'); mkdirSync(out, { recursive: true });
  const { browser, page } = await open();
  for (const t of arg('--stills', '0').split(',').map(Number)) {
    await page.evaluate(t => window.seek(t), t);
    await page.screenshot({ path: path.join(out, `t${String(t).padStart(5, '0')}.png`) });
  }
  await browser.close(); log('Captures dans ' + out); process.exit(0);
}

// vidéo : tranches de 50 images, encodées à la volée (JPEG → ffmpeg par l'entrée standard)
const N = Math.round(10 * FPS), CH = +arg('--chunk', 50);
const segDir = path.join(DIR, '_travail', 'seg'); mkdirSync(segDir, { recursive: true });
const t0 = Date.now(); let ctx = null; const segs = [];
for (let c0 = 0; c0 < N; c0 += CH) {
  const c1 = Math.min(N, c0 + CH), seg = path.join(segDir, `s${String(c0).padStart(4, '0')}.mp4`); segs.push(seg);
  if (existsSync(seg) && !args.includes('--force')) { log('déjà fait : ' + path.basename(seg)); continue; }
  for (let attempt = 0; ; attempt++) {
    try {
      if (!ctx) ctx = await open();
      const tmp = seg + '.tmp.mp4';
      const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-r', String(FPS), tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
      const done = new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg ' + c))));
      for (let f = c0; f < c1; f++) {
        await ctx.page.evaluate(t => window.seek(t), f * 1000 / FPS);
        const buf = await ctx.page.screenshot({ type: 'jpeg', quality: 94 });
        if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      }
      ff.stdin.end(); await done; renameSync(tmp, seg);
      const el = (Date.now() - t0) / 1000;
      log(`images ${c0}–${c1 - 1} faites · ${el.toFixed(0)} s · ${(el / (c1) ).toFixed(1)} s/image (cumul)`);
      break;
    } catch (e) {
      log(`tranche ${c0} : ${e.message.split('\n')[0]} → relance (${attempt + 1})`);
      try { await ctx.browser.close(); } catch {}
      ctx = null; if (attempt > 5) throw e;
    }
  }
}
if (ctx) await ctx.browser.close();
writeFileSync(path.join(segDir, 'liste.txt'), segs.map(f => `file '${f}'`).join('\n'));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(segDir, 'liste.txt'), '-c', 'copy', '-movflags', '+faststart', OUT]);
log(`Vidéo : ${OUT} (${((Date.now() - t0) / 60000).toFixed(1)} min)`);
if (!args.includes('--video-only')) { await apercu(); await petit(); }

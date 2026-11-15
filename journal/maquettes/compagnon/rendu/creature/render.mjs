// Rendu de l'esquisse 3 « Créature de film d'animation » (Pilou réaliste).
// Prérequis : python3 -m http.server 8123 --bind 127.0.0.1 --directory /home/user/halcya-videos
// Usage :
//   node render.mjs                       → pilou-creature.mp4 (300 images, par tranches reprenables)
//   node render.mjs --stills 0,5000,9000  → captures PNG dans _travail/stills (+ temps par image)
//   node render.mjs --apercu 6400         → apercu.png (rendu ×2 puis réduit en 1920×1080, lanczos)
//   node render.mjs --petit 3200          → petit.png (Pilou ≈ 240 px de haut, sur le fond de l'app)
//   options : --from F --to F (images), --q 1 (densité de l'île), --force
import { createRequire } from 'module';
import { spawn, spawnSync } from 'child_process';
import { mkdirSync, existsSync, renameSync, writeFileSync, unlinkSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('/opt/node-tools/node_modules/playwright'); }

const DIR = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://127.0.0.1:8123/pilou-realiste-3-creature/prototype.html';
const FPS = 30, FRAMES = 300;
const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const extra = (arg('--q') ? '&q=' + arg('--q') : '') + (arg('--qs') ? '&' + arg('--qs') : '');

async function open(qs, vw = 1920, vh = 1080) {
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('Erreur page :', e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.error('console :', m.text().slice(0, 300)); });
  await page.goto(BASE + '?render=1' + qs + extra, { waitUntil: 'load' });
  await page.evaluate(async () => { await window.__ready; });
  return { browser, page };
}
const ff = (a) => { const r = spawnSync('ffmpeg', a, { stdio: 'inherit' }); if (r.status !== 0) throw new Error('ffmpeg ' + r.status); };

if (args.includes('--stills')) {
  const { browser, page } = await open('');
  const out = path.join(DIR, '_travail', 'stills'); mkdirSync(out, { recursive: true });
  for (const t of arg('--stills', '0').split(',').map(Number)) {
    const ms = await page.evaluate(t => window.timeFrame(t), t);
    const t0 = Date.now(); await page.screenshot({ path: path.join(out, `t${String(t).padStart(5, '0')}.png`) });
    console.log(`t=${t} ms : rendu ${ms.toFixed(0)} ms, capture ${Date.now() - t0} ms`);
  }
  console.log(await page.evaluate(() => window.info()));
  await browser.close();
} else if (args.includes('--apercu')) {
  const t = +arg('--apercu', 6400);
  const { browser, page } = await open('&ss=2&msaa=4');
  await page.evaluate(t => window.seek(t), t);
  const url = await page.evaluate(() => document.getElementById('c').toDataURL('image/png'));
  const tmp = path.join(DIR, '_travail', 'apercu-2x.png'); writeFileSync(tmp, Buffer.from(url.split(',')[1], 'base64'));
  await browser.close();
  // le cartouche n'est pas dans le canevas : l'aperçu est l'image pure
  ff(['-y', '-loglevel', 'error', '-i', tmp, '-vf', 'scale=1920:1080:flags=lanczos', path.join(DIR, 'apercu.png')]);
  console.log('Aperçu : apercu.png (t = ' + t + ' ms, rendu 3840×2160 puis réduit)');
} else if (args.includes('--petit')) {
  const t = +arg('--petit', 3200);
  const { browser, page } = await open('&petit=1&ss=2', 420, 360);
  await page.evaluate(t => window.seek(t), t);
  const url = await page.evaluate(() => document.getElementById('c').toDataURL('image/png'));
  const tmp = path.join(DIR, '_travail', 'petit-2x.png'); writeFileSync(tmp, Buffer.from(url.split(',')[1], 'base64'));
  await browser.close();
  ff(['-y', '-loglevel', 'error', '-i', tmp, '-vf', 'scale=420:360:flags=lanczos', path.join(DIR, 'petit.png')]);
  console.log('Petit : petit.png (420×360, rendu ×2 puis réduit)');
} else {
  // vidéo : tranches de 50 images reprenables (si le navigateur tombe, on refait la tranche)
  const F0 = +arg('--from', 0), F1 = Math.min(+arg('--to', FRAMES), FRAMES), CH = +arg('--chunk', 50);
  const segDir = path.join(DIR, '_travail', 'seg'); mkdirSync(segDir, { recursive: true });
  const t0 = Date.now(); let ctx = null; const segs = [];
  for (let c0 = F0; c0 < F1; c0 += CH) {
    const c1 = Math.min(F1, c0 + CH), seg = path.join(segDir, `s${String(c0).padStart(4, '0')}_${c1}.mp4`); segs.push(seg);
    if (existsSync(seg) && !args.includes('--force')) { console.log('déjà fait :', path.basename(seg)); continue; }
    for (let attempt = 0; ; attempt++) {
      try {
        if (!ctx) ctx = await open('');
        const tmp = seg + '.tmp.mp4';
        const p = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
          '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-r', String(FPS), tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
        const done = new Promise((res, rej) => p.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg ' + c))));
        for (let f = c0; f < c1; f++) {
          await ctx.page.evaluate(t => window.seek(t), f * 1000 / FPS);
          const buf = await ctx.page.screenshot({ type: 'jpeg', quality: 94 });
          if (!p.stdin.write(buf)) await new Promise(r => p.stdin.once('drain', r));
        }
        p.stdin.end(); await done; renameSync(tmp, seg);
        const el = (Date.now() - t0) / 1000, k = (c1 - F0) / (F1 - F0);
        console.log(`tranche ${c0}–${c1} faite · ${el.toFixed(0)} s · ${(el / (c1 - F0)).toFixed(1)} s/image · reste ≈ ${(el / k - el).toFixed(0)} s`);
        break;
      } catch (e) {
        console.error(`tranche ${c0} : ${e.message.split('\n')[0]} → relance (${attempt + 1})`);
        try { await ctx?.browser.close(); } catch { }
        ctx = null; if (attempt > 5) throw e;
      }
    }
  }
  if (ctx) await ctx.browser.close();
  const list = path.join(segDir, 'liste.txt'); writeFileSync(list, segs.map(f => `file '${f}'`).join('\n'));
  const outFile = path.join(DIR, (F0 === 0 && F1 === FRAMES) ? 'pilou-creature.mp4' : '_travail/partiel.mp4');
  ff(['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', outFile]);
  console.log('Vidéo :', outFile, `(${((Date.now() - t0) / 60000).toFixed(1)} min)`);
}
process.exit(0);

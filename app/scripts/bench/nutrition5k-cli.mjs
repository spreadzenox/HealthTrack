#!/usr/bin/env node
/**
 * Banc Silver / Gold (GOLD-b5) : lancé par .github/workflows/bench-gold.yml (workflow_dispatch sur main).
 *
 *   BENCH_ID_TOKEN=<jeton OIDC de gh-deployer> node scripts/bench/nutrition5k-cli.mjs --relay=<url> --dishes=40 --out=<dossier>
 *
 * Pour chaque assiette (ordre fixe, voir candidateDishes) : télécharge la photo vue de dessus dans un dossier
 * temporaire, la convertit en JPEG 1 280 px (ImageMagick, comme l'app avant l'envoi), demande l'analyse au relais en
 * Silver puis en Gold (route /v1/bench/analyze, plafonds habituels), note les erreurs. Les photos ne quittent jamais
 * le dossier temporaire ; seuls les chiffres sont écrits dans <out>/results.json et <out>/report.md.
 * Un 429 (plafond du jour ou budget du mois) arrête le banc proprement : le rapport porte sur ce qui a été mesuré.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { METADATA_URL, candidateDishes, imageUrl, markdownReport, parseMetadata, predictTotals, scoreDish, summarize } from './nutrition5k.mjs'

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')))
const relay = args.relay
const wanted = Number(args.dishes ?? 40)
const out = args.out ?? 'bench-out'
const pauseMs = Number(args.pause ?? 7000)
const token = process.env.BENCH_ID_TOKEN
if (!relay || !token) {
  console.error('Usage : BENCH_ID_TOKEN=… node nutrition5k-cli.mjs --relay=<url> [--dishes=40] [--out=dossier]')
  process.exit(2)
}

const table = JSON.parse(readFileSync(new URL('../../src/data/ingredientsNutrition.json', import.meta.url), 'utf8'))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const tmp = mkdtempSync(join(tmpdir(), 'n5k-'))
mkdirSync(out, { recursive: true })

async function analyze(tier, dish, jpeg) {
  const res = await fetch(`${relay}/v1/bench/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ tier, dish, kind: 'photo', image: { mimeType: 'image/jpeg', data: jpeg.toString('base64') } }),
    signal: AbortSignal.timeout(90_000),
  })
  const body = await res.json().catch(() => ({}))
  return { status: res.status, body }
}

const rows = []
let costEur = 0
let servedLite = 0
let stop = null
try {
  const meta = await fetch(METADATA_URL)
  if (!meta.ok) throw new Error(`Métadonnées Nutrition5k : HTTP ${meta.status}`)
  const candidates = candidateDishes(parseMetadata(await meta.text()))
  for (const dish of candidates) {
    if (rows.length >= wanted || stop) break
    const img = await fetch(imageUrl(dish.id))
    if (!img.ok) continue
    const png = join(tmp, 'rgb.png')
    const jpg = join(tmp, 'rgb.jpg')
    writeFileSync(png, Buffer.from(await img.arrayBuffer()))
    execFileSync('convert', [png, '-resize', '1280x1280>', '-strip', '-quality', '85', jpg])
    const jpeg = readFileSync(jpg)
    const row = { dish: dish.id, truth: { mass: dish.mass, kcal: dish.kcal, protein: dish.protein, carb: dish.carb, fat: dish.fat }, silver: null, gold: null, raw: {} }
    for (const tier of ['silver', 'gold']) {
      const { status, body } = await analyze(tier, dish.id, jpeg)
      if (status === 429) {
        stop = `${tier} : HTTP 429 (${body.scope ?? 'plafond'}${body.reason ? `, ${body.reason}` : ''})`
        break
      }
      if (status !== 200) {
        row.raw[tier] = { status }
      } else {
        costEur += Number(body.eur) || 0
        const predicted = predictTotals(body.parsed, table)
        row.raw[tier] = { status, served: body.served, ms: body.ms, predicted }
        const valid = tier === 'silver' || body.served === 'gold'
        if (tier === 'gold' && body.served !== 'gold') servedLite += 1
        if (valid) row[tier] = scoreDish(row.truth, predicted)
      }
      await sleep(pauseMs)
    }
    rows.push(row)
    console.log(`${rows.length}/${wanted} ${dish.id} silver=${row.raw.silver?.status ?? '—'} gold=${row.raw.gold?.status ?? '—'}/${row.raw.gold?.served ?? '—'}`)
  }
} finally {
  rmSync(tmp, { recursive: true, force: true })
}

const summary = summarize(rows)
let report = markdownReport(summary, { costEur, servedLite })
if (stop) report += `\n\nBanc arrêté avant la fin : ${stop}.`
writeFileSync(join(out, 'results.json'), JSON.stringify({ date: new Date().toISOString(), summary, costEur, servedLite, stop, rows }, null, 2))
writeFileSync(join(out, 'report.md'), report + '\n')
console.log(report)

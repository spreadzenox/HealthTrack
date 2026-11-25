// Banc ESSAI-SANS : jours « sans » dont la mesure dépasse le seuil. Vérité connue, 20 000 essais de 10 jours (5 avec, 5 sans).
let seed = 7; const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296 }
const norm = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd())
const ms = (xs) => { const n = xs.length, m = xs.reduce((a, b) => a + b, 0) / n; return { n, m, v: n > 1 ? xs.reduce((s, x) => s + (x - m) ** 2, 0) / (n - 1) : 0 } }
function trial({ effect, center, conf }) {
  const flags = [true, true, true, true, true, false, false, false, false, false].sort(() => rnd() - 0.5)
  return flags.map((w) => { const z = norm(); const sleep = center + (w ? 30 : 0) + 35 * norm() - conf * 15 * z; const above = sleep >= 450
    return { w, above, y: 3 + effect * (sleep - 420) / 30 - conf * 0.3 * z + 0.7 * norm() } })
}
const rules = {
  actuel: (d) => (d.w ? (d.above ? 'with' : null) : (d.above ? null : 'without')),
  sansToujours: (d) => (d.w ? (d.above ? 'with' : null) : 'without'),
  calendrier: (d) => (d.w ? 'with' : 'without'),
}
for (const sc of [
  { name: 'effet 0,3 / 30 min, habitude 7 h 00', effect: 0.3, center: 420, conf: 0 },
  { name: 'effet 0,3, habitude 7 h 30', effect: 0.3, center: 450, conf: 0 },
  { name: 'effet nul, habitude 7 h 30, facteur caché', effect: 0, center: 450, conf: 1 },
  { name: 'effet nul, habitude 7 h 00, facteur caché', effect: 0, center: 420, conf: 1 },
]) {
  const N = 20000; const out = {}
  for (const r in rules) out[r] = { conclu: 0, oui: 0, non: 0, diff: 0, sansVide4: 0 }
  for (let i = 0; i < N; i++) { const days = trial(sc)
    for (const [r, f] of Object.entries(rules)) { const g = { with: [], without: [] }
      days.forEach((d) => { const k = f(d); if (k) g[k].push(d.y) })
      const first3 = days.slice(0, 3).filter((d) => !d.w && f(d) === 'without').length
      if (days.slice(0, 3).some((d) => !d.w) && first3 === 0) out[r].sansVide4++
      if (g.with.length >= 3 && g.without.length >= 3) { const a = ms(g.with), b = ms(g.without), diff = a.m - b.m, se = Math.sqrt(a.v / a.n + b.v / b.n)
        out[r].conclu++; out[r].diff += diff; if (diff - 2 * se > 0) out[r].oui++; if (diff + 2 * se < 0) out[r].non++ } } }
  console.log(`\n${sc.name}`)
  for (const [r, o] of Object.entries(out)) console.log(`  ${r.padEnd(13)} conclut ${(100 * o.conclu / N).toFixed(0)} % · « plutôt oui » ${(100 * o.oui / N).toFixed(1)} % · « plutôt non » ${(100 * o.non / N).toFixed(1)} % · écart moyen ${(o.diff / Math.max(1, o.conclu)).toFixed(2)} · « Sans » vide au jour 4 ${(100 * o.sansVide4 / N).toFixed(0)} %`)
}

// Banc de l'essai 5/5 (REFONTE-6c-3) : bilan « Plutôt oui » à tort, Welch ± 2 SE comme trials.js, contre Student.
let s = 7; const r = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648 }
const g = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r())
const tq = { 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571, 6: 2.447, 7: 2.365, 8: 2.306 }
function run({ n = 5, effect = 0, ar = 0.4, sd = 0.5, keep = 1, reps = 100000, minEach = 3 }) {
  let yes = 0, no = 0, yesT = 0, few = 0
  for (let k = 0; k < reps; k++) {
    const flags = [...Array(n).fill(true), ...Array(n).fill(false)]
    for (let i = flags.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [flags[i], flags[j]] = [flags[j], flags[i]] }
    let e = g(); const W = [], O = []
    for (let i = 0; i < 2 * n + 1; i++) {
      e = ar * e + Math.sqrt(1 - ar * ar) * g()
      if (i === 0) continue
      const f = flags[i - 1]; if (r() > keep) continue
      const y = 3 + sd * e + (f ? effect : 0)
      ;(f ? W : O).push(y)
    }
    if (W.length < minEach || O.length < minEach) { few++; continue }
    const m = (a) => a.reduce((x, y) => x + y, 0) / a.length
    const v = (a) => { const mm = m(a); return a.reduce((x, y) => x + (y - mm) ** 2, 0) / (a.length - 1) }
    const d = m(W) - m(O), se = Math.sqrt(v(W) / W.length + v(O) / O.length)
    const df = Math.max(2, Math.min(8, Math.floor((se ** 4) / ((v(W) / W.length) ** 2 / (W.length - 1) + (v(O) / O.length) ** 2 / (O.length - 1)))))
    if (d - 2 * se > 0) yes++; if (d + 2 * se < 0) no++
    if (d - tq[df] * se > 0) yesT++
  }
  const p = (x) => (100 * x / reps).toFixed(1) + ' %'
  return `n=${n}+${n} effet=${effect} tenue/notée=${keep} : « Plutôt oui » ±2SE ${p(yes)} · Student (Welch) ${p(yesT)} · « Plutôt non » ${p(no)} · trop peu ${p(few)}`
}
for (const keep of [1, 0.8]) {
  console.log(run({ effect: 0, keep })); console.log(run({ effect: 0.25, keep })); console.log(run({ effect: 0.5, keep }))
}
console.log(run({ effect: 0, ar: 0.7 }))
console.log(run({ n: 7, effect: 0 })); console.log(run({ n: 7, effect: 0.5 }))

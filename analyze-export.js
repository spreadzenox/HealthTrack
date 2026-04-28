#!/usr/bin/env node
/**
 * Diagnostic script for HealthTrack export files.
 * Usage: node analyze-export.js healthtrack-export-YYYY-MM-DD.json
 */

const fs = require('fs')
const path = require('path')

const file = process.argv[2]
if (!file) {
  console.error('Usage: node analyze-export.js <path-to-export.json>')
  process.exit(1)
}

const raw = fs.readFileSync(path.resolve(file), 'utf8')
const data = JSON.parse(raw)
const entries = Array.isArray(data) ? data : data.entries

console.log(`\n====== HealthTrack Export Analysis ======`)
console.log(`Exported at: ${data.exportedAt || 'unknown'}`)
console.log(`Total entries: ${entries.length}\n`)

// ── 1. Count by type ─────────────────────────────────────────────────────────
const byType = {}
for (const e of entries) {
  byType[e.type] = (byType[e.type] || 0) + 1
}
console.log('── Entries by type ──')
for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${type.padEnd(20)} ${count}`)
}

// ── 2. localDateKey (same logic as analysisEngine.js) ────────────────────────
function localDateKey(iso) {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ── 3. Wellbeing entries per day ─────────────────────────────────────────────
const wellbeingEntries = entries.filter((e) => e.type === 'wellbeing')
const wellbeingByDay = {}
for (const e of wellbeingEntries) {
  if (!e.at) continue
  const dk = localDateKey(e.at)
  if (!wellbeingByDay[dk]) wellbeingByDay[dk] = []
  wellbeingByDay[dk].push({ score: e.payload?.score, at: e.at })
}

const wellbeingDays = Object.keys(wellbeingByDay).sort()
console.log(`\n── Wellbeing days (${wellbeingDays.length} days with wellbeing score) ──`)
for (const day of wellbeingDays) {
  const records = wellbeingByDay[day]
  const avg = records.reduce((s, r) => s + (r.score ?? 0), 0) / records.length
  const times = records.map((r) => new Date(r.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })).join(', ')
  console.log(`  ${day}  scores: [${records.map((r) => r.score).join(', ')}]  avg: ${avg.toFixed(2)}  times: ${times}`)
}

// ── 4. All data days ──────────────────────────────────────────────────────────
const allDays = new Set(entries.filter((e) => e.at).map((e) => localDateKey(e.at)))
const sortedAllDays = [...allDays].sort()
console.log(`\n── All data days (${sortedAllDays.length} days with any data) ──`)
for (const day of sortedAllDays) {
  const dayEntries = entries.filter((e) => e.at && localDateKey(e.at) === day)
  const typeCounts = {}
  for (const e of dayEntries) typeCounts[e.type] = (typeCounts[e.type] || 0) + 1
  const hasWellbeing = !!wellbeingByDay[day]
  const marker = hasWellbeing ? '✓ wellbeing' : '✗ no wellbeing'
  const summary = Object.entries(typeCounts).map(([t, c]) => `${t}:${c}`).join(' ')
  console.log(`  ${day}  [${marker}]  ${summary}`)
}

// ── 5. Days with data but NO wellbeing ───────────────────────────────────────
const daysWithoutWellbeing = sortedAllDays.filter((d) => !wellbeingByDay[d])
if (daysWithoutWellbeing.length > 0) {
  console.log(`\n── Days with data but no wellbeing score (${daysWithoutWellbeing.length}) ──`)
  for (const day of daysWithoutWellbeing) {
    const dayEntries = entries.filter((e) => e.at && localDateKey(e.at) === day)
    const typeCounts = {}
    for (const e of dayEntries) typeCounts[e.type] = (typeCounts[e.type] || 0) + 1
    const summary = Object.entries(typeCounts).map(([t, c]) => `${t}:${c}`).join(' ')
    console.log(`  ${day}  ${summary}`)
  }
}

// ── 6. Possible timezone issues ───────────────────────────────────────────────
console.log(`\n── Timezone check ──`)
console.log(`  Server local timezone offset: UTC${-new Date().getTimezoneOffset() / 60 >= 0 ? '+' : ''}${-new Date().getTimezoneOffset() / 60}`)
const wellbeingAtMidnight = wellbeingEntries.filter((e) => {
  if (!e.at) return false
  const d = new Date(e.at)
  return d.getHours() === 0 || d.getHours() === 23
})
if (wellbeingAtMidnight.length > 0) {
  console.log(`  WARNING: ${wellbeingAtMidnight.length} wellbeing entries near midnight — possible day boundary issue`)
  for (const e of wellbeingAtMidnight) {
    console.log(`    at: ${e.at}  localDay: ${localDateKey(e.at)}`)
  }
} else {
  console.log(`  No wellbeing entries near midnight — no timezone boundary issue detected`)
}

console.log('\n=========================================\n')

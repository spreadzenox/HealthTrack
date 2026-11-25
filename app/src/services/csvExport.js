/**
 * Export CSV de toutes les saisies (EXPORT-CSV, décision du 20/10 : « export CSV / JSON » gratuit pour toujours).
 * Une ligne par saisie, pour un tableur : point-virgule, virgule décimale et BOM UTF-8 (Excel en français lit les
 * accents et les colonnes sans réglage). La sauvegarde JSON reste le seul format qu'on peut réimporter.
 */
import { APP_NAME } from '../config/brand'

const SEP = ';'
const FIXED = ['Date', 'Heure', 'Quoi', 'Type', 'Source', 'Aliments']
// Au-delà, une chaîne est une image ou un blob technique : rien d'utile dans un tableur.
const MAX_TEXT = 1000
// Le fuseau du jour, noté seul par l'app : pas une saisie (comme dans le compte de Données › Sauvegarde).
const SKIPPED_TYPES = new Set(['context'])

const TYPE_LABELS = {
  food: 'Repas',
  wellbeing: 'Bien-être',
  gut: 'Digestion',
  stool: 'Selles',
  symptom: 'Symptôme',
  habit: 'Habitude',
  cigarette: 'Cigarette',
  cycle: 'Cycle',
  period: 'Règles',
  steps: 'Pas',
  sleep: 'Sommeil',
  heart_rate: 'Cœur',
  weight: 'Poids',
  height: 'Taille',
  body_composition: 'Composition corporelle',
  body_temperature: 'Température',
  blood_pressure: 'Tension',
  respiratory_rate: 'Respiration',
  watch_stress: 'Stress (montre)',
  activity: 'Activité',
  calories: 'Calories',
  phone_usage: 'Temps d’écran',
  phone_apps: 'Applications',
  weather: 'Météo',
  face_burst: 'Lecture du visage',
  trial: 'Essai',
  fodmap_challenge: 'Réintroduction',
  note: 'Note',
}

// Une entrée `heart_rate` porte aussi l'oxygène et la variabilité (POLISH-SIM-163) : son sous-type la nomme.
const HEART_SUBTYPES = {
  heartRate: 'Cœur',
  restingHeartRate: 'Cœur au repos',
  heartRateVariability: 'Variabilité cardiaque',
  heartRateVariabilitySdnn: 'Variabilité cardiaque, app Santé',
  oxygenSaturation: 'Oxygène du sang',
}

const kindOf = (e) => (e.type === 'heart_rate' && HEART_SUBTYPES[e.payload?.subtype]) || TYPE_LABELS[e.type] || e.type

const pad = (n) => String(n).padStart(2, '0')
const dayOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const timeOf = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

/** « halcya-donnees-2026-11-22.csv » */
export function csvFileName(now = new Date()) {
  return `${APP_NAME.toLowerCase()}-donnees-${dayOf(now)}.csv`
}

function scalarText(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? String(v).replace('.', ',') : ''
  if (typeof v === 'boolean') return v ? 'oui' : 'non'
  if (typeof v === 'string') return v.length > MAX_TEXT ? null : v
  return null
}

/** Feuilles d'un payload : { "estimate.bristol": 3.5, tags: "a, b" } ; les tableaux d'objets restent en JSON. */
function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj || {})) {
    if (v === null || v === undefined) continue
    const key = prefix ? `${prefix}.${k}` : k
    if (Array.isArray(v)) {
      const text = v.every((x) => typeof x !== 'object' || x === null)
        ? v.map((x) => scalarText(x) ?? '').join(', ')
        : JSON.stringify(v)
      if (text.length <= MAX_TEXT) out[key] = text
    } else if (typeof v === 'object') {
      flatten(v, key, out)
    } else {
      const text = scalarText(v)
      if (text !== null) out[key] = text
    }
  }
  return out
}

/** « Riz blanc cuit (180 g) + Oignon, cru (80 g) » */
function mealText(items) {
  if (!Array.isArray(items)) return ''
  return items
    .filter((it) => it && typeof it === 'object' && it.ingredient)
    .map((it) => {
      const qty = it.quantity || (Number.isFinite(it.quantity_g) ? `${it.quantity_g} g` : '')
      return qty ? `${it.ingredient} (${qty})` : String(it.ingredient)
    })
    .join(' + ')
}

function cell(text) {
  let s = text ?? ''
  // Un tableur exécuterait « =… » comme une formule (texte saisi ou rendu par l'IA)
  if (typeof s === 'string' && /^[=+\-@\t\r]/.test(s) && Number.isNaN(Number(s.replace(',', '.')))) s = `'${s}`
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Les saisies qui font une ligne, dans l'ordre chronologique. */
function exportedRows(entries) {
  const rows = []
  for (const e of entries || []) {
    if (!e || SKIPPED_TYPES.has(e.type)) continue
    const date = new Date(e.at)
    if (!e.at || Number.isNaN(date.getTime())) continue
    rows.push({ date, e })
  }
  return rows.sort((a, b) => a.date - b.date)
}

/**
 * Ce que contient le fichier, dit après l'export (POLISH-SIM-163 : « sans savoir si cœur et oxygène sont dedans »).
 * @returns {{ rows: number, from: string|null, to: string|null, kinds: Array<{label: string, count: number}> }}
 */
export function csvContents(entries) {
  const rows = exportedRows(entries)
  const counts = new Map()
  for (const { e } of rows) counts.set(kindOf(e), (counts.get(kindOf(e)) || 0) + 1)
  const kinds = [...counts].map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'fr'))
  return {
    rows: rows.length,
    from: rows.length ? dayOf(rows[0].date) : null,
    to: rows.length ? dayOf(rows[rows.length - 1].date) : null,
    kinds,
  }
}

/**
 * @param {Array<{type: string, source: string, at: string, payload?: object}>} entries
 * @returns {string} CSV avec BOM, lignes séparées par CRLF
 */
export function entriesToCsv(entries) {
  const rows = exportedRows(entries).map(({ date, e }) => {
    const payload = e.payload && typeof e.payload === 'object' ? e.payload : {}
    const { items, ...rest } = payload
    return { date, e, meal: e.type === 'food' ? mealText(items) : '', fields: flatten(e.type === 'food' ? rest : payload) }
  })
  const keys = [...new Set(rows.flatMap((r) => Object.keys(r.fields)))].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
  const lines = [[...FIXED, ...keys].map(cell).join(SEP)]
  for (const { date, e, meal, fields } of rows) {
    const values = [dayOf(date), timeOf(date), kindOf(e), e.type, e.source || '', meal, ...keys.map((k) => fields[k] ?? '')]
    lines.push(values.map(cell).join(SEP))
  }
  return `\uFEFF${lines.join('\r\n')}\r\n`
}

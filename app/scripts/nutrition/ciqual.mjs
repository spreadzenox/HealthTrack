/**
 * Lecture de la table Ciqual officielle de l'ANSES (format XML : fichiers alim_*.xml,
 * compo_*.xml et const_*.xml du zip publié sur https://ciqual.anses.fr) et construction de
 * la table de l'app { nom Ciqual: valeurs pour 100 g }. Pur : aucune lecture de fichier.
 *
 * Règles (demande du propriétaire du 26/10) : chaque valeur vient de Ciqual ou vaut null
 * (« inconnue »), jamais inventée.
 * - « - » ou vide → null ;
 * - « traces » → 0, marqué `traces` dans `_q` ;
 * - « < x » → x / 2 (convention « middle bound » des tables de composition), marqué `<x` dans `_q`.
 * Champs calculés (documentés, jamais devinés) :
 * - vitamin_a_ug = rétinol + bêta-carotène / 6 (équivalents rétinol, EFSA) ; null si l'un manque ;
 * - omega3_g = ALA + EPA + DHA ; null si l'ALA manque ; EPA ou DHA inconnus comptent 0 et le
 *   champ est marqué `partiel` dans `_q`.
 * Licence : Licence Ouverte / Etalab 2.0 (réutilisation commerciale permise avec attribution,
 * voir CIQUAL_ATTRIBUTION).
 */

export const CIQUAL_ATTRIBUTION = (version) =>
  `Anses. ${version}. Table de composition nutritionnelle des aliments Ciqual (Licence Ouverte / Etalab).`

/** Constituants lus directement : champ de l'app → motif du nom français Ciqual. */
export const DIRECT_FIELDS = {
  energy_kcal: /^Energie, Règlement UE N° 1169\/2011 \(kcal\/100 ?g\)/i,
  protein_g: /^Protéines, N x facteur de Jones \(g\/100 ?g\)/i,
  carbohydrates_g: /^Glucides \(g\/100 ?g\)/i,
  fat_g: /^Lipides \(g\/100 ?g\)/i,
  sugar_g: /^Sucres \(g\/100 ?g\)/i,
  fiber_g: /^Fibres alimentaires \(g\/100 ?g\)/i,
  saturated_fat_g: /^AG saturés \(g\/100 ?g\)/i,
  alcohol_g: /^Alcool \(g\/100 ?g\)/i,
  fructose_g: /^Fructose \(g\/100 ?g\)/i,
  glucose_g: /^Glucose \(g\/100 ?g\)/i,
  lactose_g: /^Lactose \(g\/100 ?g\)/i,
  sucrose_g: /^Saccharose \(g\/100 ?g\)/i,
  polyols_g: /^Polyols totaux \(g\/100 ?g\)/i,
  vitamin_c_mg: /^Vitamine C \(mg\/100 ?g\)/i,
  vitamin_d_ug: /^Vitamine D \(µg\/100 ?g\)/i,
  vitamin_b12_ug: /^Vitamine B12 \(µg\/100 ?g\)/i,
  vitamin_b9_ug: /^Vitamine B9 ou Folates totaux \(µg\/100 ?g\)/i,
  vitamin_e_mg: /^Vitamine E \(mg\/100 ?g\)/i,
  calcium_mg: /^Calcium \(mg\/100 ?g\)/i,
  iron_mg: /^Fer \(mg\/100 ?g\)/i,
  magnesium_mg: /^Magnésium \(mg\/100 ?g\)/i,
  zinc_mg: /^Zinc \(mg\/100 ?g\)/i,
  potassium_mg: /^Potassium \(mg\/100 ?g\)/i,
  sodium_mg: /^Sodium \(mg\/100 ?g\)/i,
}

/** Constituants qui ne servent qu'aux champs calculés. */
const HELPER_FIELDS = {
  retinol_ug: /^Rétinol \(µg\/100 ?g\)/i,
  beta_carotene_ug: /^Beta-Carotène \(µg\/100 ?g\)/i,
  ala_g: /^AG 18:3 c9,c12,c15 \(n-3\)/i,
  epa_g: /^AG 20:5 5c,8c,11c,14c,17c \(n-3\)/i,
  dha_g: /^AG 22:6 4c,7c,10c,13c,16c,19c \(n-3\)/i,
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', apos: "'", quot: '"' }
const decodeEntities = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|apos|quot);/gi, (_, e) =>
    e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : ENTITIES[e.toLowerCase()])

/** Décode un fichier XML Ciqual selon l'encodage annoncé dans son prologue (windows-1252 en 2020). */
export function decodeXml(bytes) {
  const head = new TextDecoder('latin1').decode(bytes.subarray(0, 200))
  const enc = (head.match(/encoding=["']([^"']+)["']/i) || [])[1] || 'utf-8'
  return new TextDecoder(enc.toLowerCase()).decode(bytes)
}

/** Enregistrements `<TAG>…</TAG>` d'un XML plat → objets { enfant: texte }. */
export function parseRecords(xml, tag) {
  const out = []
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'gi')
  let m
  while ((m = re.exec(xml))) {
    const rec = {}
    const child = /<([A-Za-z_][\w-]*)(\s[^>]*)?(?:\/>|>([\s\S]*?)<\/\1>)/g
    let c
    while ((c = child.exec(m[1]))) rec[c[1].toLowerCase()] = c[3] == null ? '' : decodeEntities(c[3]).trim()
    out.push(rec)
  }
  return out
}

/** Teneur Ciqual (texte) → { value, q } ; q vaut null, 'traces' ou '<x'. */
export function parseTeneur(raw) {
  const s = (raw ?? '').toString().trim().replace(/ /g, ' ')
  if (s === '' || s === '-') return { value: null, q: null }
  if (/^traces$/i.test(s)) return { value: 0, q: 'traces' }
  const lt = s.match(/^<\s*([\d.,]+)$/)
  if (lt) {
    const limit = Number(lt[1].replace(',', '.'))
    return { value: round(limit / 2), q: `<${limit}` }
  }
  const n = Number(s.replace(',', '.'))
  return Number.isFinite(n) ? { value: n, q: null } : { value: null, q: null }
}

const round = (x) => Math.round(x * 1000) / 1000

export const normalizeName = (s) => s.normalize('NFC').replace(/\s+/g, ' ').trim()

/**
 * @param {{ alims: object[], compos: object[], consts: object[] }} raw enregistrements Ciqual
 * @param {{ version: string, keep?: Record<string, object>, keepFields?: string[] }} opts
 *   `keep` : ancienne table, dont on recopie seulement `keepFields` (ex. fodmap_score) pour les
 *   aliments au même nom, le temps que leur remplacement soit livré.
 */
export function buildTable(raw, { version, keep = {}, keepFields = [] }) {
  const all = { ...DIRECT_FIELDS, ...HELPER_FIELDS }
  const constToField = new Map()
  const missingConstituents = []
  for (const [field, re] of Object.entries(all)) {
    const c = raw.consts.find((k) => re.test(normalizeName(k.const_nom_fr || '')))
    if (c) constToField.set(String(c.const_code).trim(), field)
    else missingConstituents.push(field)
  }

  const values = new Map() // alim_code → { field: { value, q } }
  for (const row of raw.compos) {
    const field = constToField.get(String(row.const_code).trim())
    if (!field) continue
    const code = String(row.alim_code).trim()
    if (!values.has(code)) values.set(code, {})
    values.get(code)[field] = parseTeneur(row.teneur)
  }

  const table = {}
  const duplicates = []
  for (const a of raw.alims) {
    const name = normalizeName(a.alim_nom_fr || '')
    const code = String(a.alim_code).trim()
    if (!name) continue
    if (table[name]) {
      duplicates.push(name)
      continue
    }
    const v = values.get(code) || {}
    const food = { ciqual_code: code }
    const q = {}
    for (const field of Object.keys(DIRECT_FIELDS)) {
      const t = v[field] || { value: null, q: null }
      food[field] = t.value
      if (t.q) q[field] = t.q
    }
    const get = (f) => (v[f] ? v[f].value : null)
    const ret = get('retinol_ug')
    const beta = get('beta_carotene_ug')
    food.vitamin_a_ug = ret != null && beta != null ? round(ret + beta / 6) : null
    const ala = get('ala_g')
    if (ala == null) food.omega3_g = null
    else {
      const epa = get('epa_g')
      const dha = get('dha_g')
      food.omega3_g = round(ala + (epa ?? 0) + (dha ?? 0))
      if (epa == null || dha == null) q.omega3_g = 'partiel'
    }
    for (const f of keepFields) if (keep[name] && f in keep[name]) food[f] = keep[name][f]
    if (Object.keys(q).length) food._q = q
    table[name] = food
  }

  const previousNames = Object.keys(keep)
  const missingFromCiqual = previousNames.filter((n) => !table[normalizeName(n)])
  return {
    table,
    meta: { version, attribution: CIQUAL_ATTRIBUTION(version), foods: Object.keys(table).length, missingConstituents, duplicates, missingFromCiqual },
  }
}

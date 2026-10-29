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
 * - vitamin_a_ug = « Activité vitaminique A, équivalents rétinol » publiée par Ciqual (2025) ; à défaut
 *   (2020), rétinol + bêta-carotène / 6 (équivalents rétinol, EFSA) ; null si l'un manque ;
 * - energy_kcal non publiée = protéines × 4 + glucides × 4 + lipides × 9 + fibres × 2 + alcool × 7
 *   (facteurs UE 1169/2011), seulement si protéines, glucides et lipides sont connus ; marqué `calculé` ;
 * - vitamin_e_mg = « Vitamine E », ou à défaut « Alpha-tocophérol (vitamine E) » (marqué dans `_q`) ;
 * - omega3_g = ALA + EPA + DHA ; null si l'ALA manque ; EPA ou DHA inconnus comptent 0 et le
 *   champ est marqué `partiel` dans `_q`.
 * Valeurs suspectes (`suspects`, voir suspects.mjs) : publiées par Ciqual mais manifestement fausses ;
 *   deviennent null, marquées `suspect` ; une entrée dont la valeur Ciqual a changé est signalée périmée.
 * Alias (`aliases`) : noms simples de l'ancienne table → aliment Ciqual dont ils copient les valeurs
 *   (marqués `alias_of`), pour que les repas déjà saisis restent calculés.
 * Licence : Licence Ouverte / Etalab 2.0 (site ciqual.anses.fr) ; Ciqual 2025 est publiée par l'Anses
 * sur Zenodo sous CC BY 4.0 (doi:10.5281/zenodo.17550133). Les deux permettent la réutilisation
 * commerciale avec attribution (voir CIQUAL_ATTRIBUTION).
 */

import { energyFromMacros } from './audit.mjs'

export const CIQUAL_ATTRIBUTION = (version, license = 'Licence Ouverte / Etalab') =>
  `Anses. ${version}. Table de composition nutritionnelle des aliments Ciqual (${license}).`

/** Constituants lus directement : champ de l'app → motif du nom français Ciqual. */
export const DIRECT_FIELDS = {
  energy_kcal: /^Energie, Règlement UE N° 1169\/2011 \(kcal\/100 ?g\)/i,
  protein_g: /^Protéines, N x facteur de Jones \(g\/100 ?g\)/i,
  carbohydrates_g: /^Glucides \(g\/100 ?g\)/i,
  fat_g: /^Lipides \(g\/100 ?g\)/i,
  sugar_g: /^Sucres \(g\/100 ?g\)/i,
  fiber_g: /^Fibres alimentaires \(g\/100 ?g\)/i,
  saturated_fat_g: /^AG saturés \(g\/100 ?g\)/i,
  alcohol_g: /^Alcool( \(éthanol\))? \(g\/100 ?g\)/i,
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
  alpha_tocopherol_mg: /^Alpha-tocophérol \(vitamine E\) \(mg\/100 ?g\)/i,
  vitamin_a_re_ug: /^Activité vitaminique A, équivalents rétinol \(µg\/100 ?g\)/i,
  retinol_ug: /^Rétinol \(µg\/100 ?g\)/i,
  beta_carotene_ug: /^Beta-Carotène \(µg\/100 ?g\)/i,
  ala_g: /^AG 18:3 c9,c12,c15 \(n-3\)/i,
  epa_g: /^AG 20:5 5c,8c,11c,14c,17c \(n-3\)/i,
  dha_g: /^AG 22:6 4c,7c,10c,13c,16c,19c \(n-3\)/i,
}

/** Absents des anciennes versions (2020) : on retombe alors sur le calcul. */
const OPTIONAL_HELPERS = new Set(['vitamin_a_re_ug', 'alpha_tocopherol_mg'])

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
export function buildTable(raw, { version, license, source, keep = {}, keepFields = [], aliases = {}, suspects = [] }) {
  const all = { ...DIRECT_FIELDS, ...HELPER_FIELDS }
  const constToField = new Map()
  const missingConstituents = []
  for (const [field, re] of Object.entries(all)) {
    const c = raw.consts.find((k) => re.test(normalizeName(k.const_nom_fr || '')))
    if (c) constToField.set(String(c.const_code).trim(), field)
    else if (!OPTIONAL_HELPERS.has(field)) missingConstituents.push(field)
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
  const staleSuspects = []
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
    // Ciqual 2025 publie la vitamine E soit en « Vitamine E », soit en « Alpha-tocophérol », jamais les deux
    const alphaToco = get('alpha_tocopherol_mg')
    if (food.vitamin_e_mg == null && alphaToco != null) {
      food.vitamin_e_mg = alphaToco
      q.vitamin_e_mg = v.alpha_tocopherol_mg.q || 'alpha-tocophérol'
    }
    // Énergie non publiée : recalculée depuis les macros publiées (facteurs UE 1169/2011), marquée
    if (food.energy_kcal == null) {
      const calc = energyFromMacros(food)
      if (calc != null) {
        food.energy_kcal = Math.round(calc)
        q.energy_kcal = 'calculé'
      }
    }
    const re = get('vitamin_a_re_ug')
    food.vitamin_a_ug = re != null ? re : ret != null && beta != null ? round(ret + beta / 6) : null
    const ala = get('ala_g')
    if (ala == null) food.omega3_g = null
    else {
      const epa = get('epa_g')
      const dha = get('dha_g')
      food.omega3_g = round(ala + (epa ?? 0) + (dha ?? 0))
      if (epa == null || dha == null) q.omega3_g = 'partiel'
    }
    for (const s of suspects) {
      if (s.code !== code || !(s.field in food)) continue
      if (food[s.field] === s.ciqual) {
        food[s.field] = null
        q[s.field] = 'suspect'
      } else staleSuspects.push(`${s.code} ${s.field}`)
    }
    for (const f of keepFields) if (keep[name] && f in keep[name]) food[f] = keep[name][f]
    if (Object.keys(q).length) food._q = q
    table[name] = food
  }

  const missingAliasTargets = []
  for (const [alias, target] of Object.entries(aliases)) {
    const base = table[normalizeName(target)]
    if (!base) {
      missingAliasTargets.push(target)
      continue
    }
    const food = { ...base, alias_of: normalizeName(target) }
    delete food.fodmap_score
    for (const f of keepFields) if (keep[alias] && f in keep[alias]) food[f] = keep[alias][f]
    table[alias] = food
  }

  const previousNames = Object.keys(keep)
  const missingFromCiqual = previousNames.filter((n) => !table[normalizeName(n)])
  return {
    table,
    meta: { version, attribution: CIQUAL_ATTRIBUTION(version, license), source: source || null, foods: Object.keys(table).length, missingConstituents, duplicates, missingFromCiqual, missingAliasTargets, staleSuspects, aliases: Object.keys(aliases).length },
  }
}

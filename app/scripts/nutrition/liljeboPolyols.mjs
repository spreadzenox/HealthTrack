#!/usr/bin/env node
/**
 * Sorbitol et mannitol des fruits et légumes d'après Liljebo et al. 2020 (BMC Nutrition 6:47, supplément 1,
 * tableau 6, CC BY 4.0, données CC0), ramenés aux noms Ciqual (N3g, journal/IDEES.md I193).
 *
 * Règle « Ciqual d'abord » (src/services/fodmapGroups.js) :
 * - Ciqual mesure les polyols totaux de l'aliment : Liljebo ne sert qu'à dire de quel polyol il s'agit
 *   (`share`, confiance `analogie`) ; le total reste celui de Ciqual ;
 * - Ciqual ne les mesure pas : la teneur citée par Liljebo (`g`, confiance `citée`, article primaire non relu) ;
 * - Ciqual donne « < 0,5 » et Liljebo plus (mûre 4,76, chou-fleur 2,96, avocat 0,65, nectarine 1,01, abricot 1,2) :
 *   contradiction, rien n'est ajouté (fodmapGroups l'ignorerait de toute façon) ; voir le compte rendu du run.
 *
 * node scripts/nutrition/liljeboPolyols.mjs [--write]   (met à jour src/data/fodmapMeasurements.json)
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatMeasurements } from './legumeGos.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const TABLE_PATH = join(here, '..', '..', 'src', 'data', 'ingredientsNutrition.json')
const MEASUREMENTS_PATH = join(here, '..', '..', 'src', 'data', 'fodmapMeasurements.json')

const SHARE = 'Polyols totaux Ciqual attribués à ce polyol, le seul que Liljebo 2020 indique pour ce fruit.'

/**
 * Lignes du tableau 6 reprises : `group`, `g` (g pour 100 g), `ref`, `foods` (nom Ciqual sans mesure des polyols →
 * `citée`), `analogies` (nom Ciqual → note ; teneur reprise telle quelle), `shares` (nom Ciqual dont Ciqual mesure
 * les polyols → note ; part 1 de ce total).
 */
export const ROWS = [
  { group: 'sorbitol', g: 2.4, ref: 'suppl. tableau 6, Plum (d’après Yao 2014)',
    foods: ['Prune, sans noyau, crue'],
    analogies: { 'Prune violette, sans noyau, crue': 'Prune violette non mesurée : teneur de la prune reprise.' },
    shares: { 'Prune mirabelle, sans noyau, crue': SHARE, 'Prune Reine-Claude, sans noyau, crue': SHARE } },
  { group: 'sorbitol', g: 6.0, ref: 'suppl. tableau 6, Dried apricot (d’après Yao 2014)', foods: [], analogies: {},
    shares: {
      'Abricot, dénoyauté, sec': `${SHARE} Écart : Ciqual 22,6 g de polyols, Liljebo 6,0 g de sorbitol ; le total Ciqual est gardé.`,
      'Abricot, dénoyauté, sec, moelleux (réhydraté à 35-45%)': SHARE } },
  { group: 'sorbitol', g: 1.2, ref: 'suppl. tableau 6, Canned apricot (valeur de l’abricot, d’après Yao 2014)', foods: [], analogies: {},
    shares: {
      'Abricot au sirop (sans précision sur léger ou classique), appertisé, égoutté (aliment moyen)': SHARE,
      'Abricot au sirop léger, appertisé, égoutté': SHARE,
      'Abricot au sirop, appertisé, égoutté': SHARE } },
  { group: 'mannitol', g: 1.16, ref: 'suppl. tableau 6, Snow peas (d’après Muir 2009)',
    foods: ['Pois mange-tout ou pois gourmand, cru'], analogies: {}, shares: {} },
]

/**
 * Champignon de Paris : Ciqual mesure les polyols de chaque préparation ; la répartition du champignon cru (mannitol,
 * MEXT 2020) est reprise. Liljebo (Muir 2009) indique « sorbitol et mannitol » sans les séparer.
 */
const MUSHROOM_RAW = 'Champignon de Paris ou champignon de couche, cru'
const MUSHROOM_FORMS = [
  'Champignon de Paris ou champignon de couche, sauté/poêlé, sans matière grasse',
  'Champignon de Paris ou champignon de couche, bouilli/cuit à l\'eau',
  'Champignon de Paris ou champignon de couche, surgelé, cru',
  'Champignon de Paris ou champignon de couche, appertisé, égoutté',
]

const ciqualPolyolsMeasured = (food) => typeof food?.polyols_g === 'number' && food.polyols_g > 0 && !food._q?.polyols_g

/** Entrées sorbitol / mannitol de fodmapMeasurements.json : { [nom Ciqual]: { [groupe]: entrée } }. */
export function buildLiljeboPolyolEntries(table, measurements) {
  const out = {}
  const put = (name, group, e) => {
    const f = table[name]
    if (!f || f.alias_of) throw new Error(`Aliment Ciqual absent ou alias : ${name}`)
    const measured = ciqualPolyolsMeasured(f)
    if (measured !== ('share' in e)) throw new Error(`${name} : ${measured ? 'Ciqual mesure les polyols, part attendue' : 'pas de total Ciqual, teneur attendue'}`)
    out[name] = { ...out[name], [group]: e }
  }
  for (const row of ROWS) {
    const base = { source: 'liljebo2020', ref: row.ref }
    for (const name of row.foods) put(name, row.group, { g: row.g, ...base, confidence: 'citée' })
    for (const [name, notes] of Object.entries(row.analogies)) {
      put(name, row.group, { g: row.g, ...base, confidence: 'analogie', analogy_of: row.foods[0], notes })
    }
    for (const [name, notes] of Object.entries(row.shares)) put(name, row.group, { share: 1, ...base, confidence: 'analogie', notes })
  }
  const raw = measurements.foods[MUSHROOM_RAW]?.mannitol
  if (raw) {
    const { source, ref } = raw
    for (const name of MUSHROOM_FORMS) {
      put(name, 'mannitol', { share: 1, source, ref, confidence: 'analogie', analogy_of: MUSHROOM_RAW,
        notes: 'Répartition du champignon cru reprise (polyols totaux Ciqual attribués au mannitol) ; Liljebo 2020 indique sorbitol et mannitol sans les séparer.' })
    }
  }
  return out
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  const table = JSON.parse(readFileSync(TABLE_PATH, 'utf8'))
  const m = JSON.parse(readFileSync(MEASUREMENTS_PATH, 'utf8'))
  const entries = buildLiljeboPolyolEntries(table, m)
  for (const [n, groups] of Object.entries(entries)) {
    for (const [g, e] of Object.entries(groups)) console.log(`${g} ${e.g ?? `part ${e.share}`}  ${e.confidence}  ${n}`)
  }
  if (process.argv.includes('--write')) {
    for (const [n, groups] of Object.entries(entries)) m.foods[n] = { ...m.foods[n], ...groups }
    writeFileSync(MEASUREMENTS_PATH, formatMeasurements(m))
    console.log(`Écrit : ${MEASUREMENTS_PATH}`)
  }
}

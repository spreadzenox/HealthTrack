#!/usr/bin/env node
/**
 * Fructanes des céréales, des pains, de l'ail et du topinambour d'après Liljebo et al. 2020 (BMC Nutrition 6:47,
 * supplément 1, CC BY 4.0, données CC0), ramenés aux noms Ciqual (N3f, journal/IDEES.md I193).
 *
 * Liljebo compile des mesures publiées (Muir 2007, Haskå 2008, Andersson 2009, Biesiekierski 2011, Whelan 2011) :
 * confiance `citée` (article primaire non relu), donc basse. Analogies (`analogie`) :
 * - produit sec mesuré, servi cuit : teneur ramenée au cuit par le rapport des glucides Ciqual cuit / sec
 *   (dérivation recalculable depuis la table) ;
 * - aliment proche (pain de mie complet ← pain complet…), teneur reprise telle quelle.
 *
 * node scripts/nutrition/liljeboFructans.mjs [--write]   (met à jour src/data/fodmapMeasurements.json)
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatMeasurements } from './legumeGos.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const TABLE_PATH = join(here, '..', '..', 'src', 'data', 'ingredientsNutrition.json')
const MEASUREMENTS_PATH = join(here, '..', '..', 'src', 'data', 'fodmapMeasurements.json')

const round2 = (x) => Math.round(x * 100) / 100

const COOKED = 'Ramené au cuit par les glucides Ciqual (cuit / sec) : une partie des fructanes passe dans l’eau, estimation plutôt haute.'

/**
 * Lignes du supplément reprises : `g` (g pour 100 g), `ref`, `foods` (nom Ciqual → `citée`),
 * `analogies` (nom Ciqual → { note, scaleFrom? }) ; `scaleFrom` = aliment sec dont les glucides servent au rapport.
 */
export const ROWS = [
  { g: 17.4, ref: 'suppl. tableau 3, Garlic (d’après Muir 2007)', foods: ['Ail, cru'], analogies: {
    'Ail, grillé/poêlé, sans matière grasse': { scaleFrom: 'Ail, cru', note: 'Ramené par les glucides Ciqual (cuit / cru) : ail seul, sans autre ingrédient.' },
    'Ail, rôti/cuit au four': { scaleFrom: 'Ail, cru', note: 'Ramené par les glucides Ciqual (cuit / cru) : ail seul, sans autre ingrédient.' },
    'Ail séché, poudre': { scaleFrom: 'Ail, cru', note: 'Ramené par les glucides Ciqual (poudre / cru).' } } },
  { g: 12.2, ref: 'suppl. tableau 3, Jerusalem artichoke (d’après Muir 2007)', foods: ['Topinambour, cru'], analogies: {} },
  { g: 12.2, ref: 'suppl. tableau 3, Jerusalem artichoke puré and boiled (d’après Muir 2007)', foods: ['Topinambour, cuit'], analogies: {} },
  { g: 3.7, ref: 'suppl. tableau 3, Wheat bran (d’après Haskå 2008)', foods: ['Son de blé'], analogies: {} },
  { g: 2.25, ref: 'suppl. tableau 3, Wheat germ (d’après Haskå 2008)', foods: ['Germe de blé'], analogies: {} },
  { g: 2.25, ref: 'suppl. tableau 3, Semolina (d’après Haskå 2008)', foods: ['Semoule de blé dur, crue'], analogies: {
    'Semoule ou graine de couscous, cuite, sans sel ajouté': { scaleFrom: 'Semoule de blé dur, crue', note: COOKED },
    'Semoule ou graine de couscous semi-complète, cuite, sans sel ajouté': { scaleFrom: 'Semoule de blé dur, crue', note: COOKED },
    'Semoule ou graine de couscous complète, cuite, sans sel ajouté': { scaleFrom: 'Semoule de blé dur, crue', note: `${COOKED} Semoule complète non mesurée : celle de la semoule reprise.` } } },
  { g: 2.0, ref: 'suppl. tableau 3, Bulgur (valeur du couscous, d’après Biesiekierski 2011)', foods: [], analogies: {
    'Boulgour de blé, cru': { note: 'Liljebo reprend pour le boulgour la mesure du couscous.' },
    'Boulgour de blé, cuit, sans sel ajouté': { scaleFrom: 'Boulgour de blé, cru', note: `${COOKED} Liljebo reprend pour le boulgour la mesure du couscous.` } } },
  { g: 0.79, ref: 'suppl. tableau 1, Wheat whole meal bread 6 % fiber (moyenne Whelan 2011 et Biesiekierski 2011)', foods: ['Pain complet ou intégral (à la farine T150)'], analogies: {
    'Pain de mie complet, préemballé': { note: null },
    'Pain pour burger ou hot dog (bun) complet, préemballé': { note: null } } },
  { g: 1.14, ref: 'suppl. tableau 3, Whole meal rye bread (d’après Andersson 2009)', foods: ['Pain complet au seigle, préemballé'], analogies: {
    'Pain de seigle et froment': { note: 'Seigle et blé mélangés : teneur du pain de seigle complet, estimation plutôt haute.' } } },
  { g: 3.52, ref: 'suppl. tableau 3, Whole meal rye and crushed rye (d’après Andersson 2009)', foods: ['Seigle complet, cru'], analogies: {
    'Farine de seigle T170': { note: 'Farine de seigle intégrale.' } } },
  { g: 3.2, ref: 'suppl. tableau 3, Crisp Bread, yeast, sourdough (d’après Andersson 2009)', foods: [], analogies: {
    'Tartine croustillante au seigle, source ou riche en fibres': { note: 'Pain croustillant de seigle (type suédois).' } } },
]

/**
 * Pain bis (farine T80 ou T110) : entre le pain blanc (Ferjančič 2024, borne haute Liljebo) et le pain complet
 * (0,79 g) : la fourchette du pain blanc est reprise (N3d), la valeur du complet y tient.
 */
const WHITE_BREAD = 'Pain blanc (par ex. : baguette, boule…)'
function painBis(measurements) {
  const white = measurements.foods[WHITE_BREAD]?.fructans
  if (!white) return null
  const { g, source, ref, g_high, source_high, ref_high } = white
  return { g, source, ref, confidence: 'analogie', analogy_of: WHITE_BREAD, g_high, source_high, ref_high,
    notes: 'Farine T80 ou T110, entre le pain blanc et le pain complet (0,79 g, Liljebo 2020) : fourchette du pain blanc reprise.' }
}

function scaled(row, table, name, from) {
  const cooked = table[name]?.carbohydrates_g
  const dry = table[from]?.carbohydrates_g
  if (!(cooked > 0 && dry > 0)) throw new Error(`Glucides Ciqual manquants : ${name} / ${from}`)
  return round2((row.g * cooked) / dry)
}

/** Entrées `fructans` de fodmapMeasurements.json, par nom Ciqual. */
export function buildLiljeboEntries(table, measurements) {
  const out = {}
  for (const row of ROWS) {
    const base = { source: 'liljebo2020', ref: row.ref }
    for (const name of row.foods) out[name] = { g: row.g, ...base, confidence: 'citée' }
    for (const [name, { note, scaleFrom }] of Object.entries(row.analogies)) {
      const e = { g: scaleFrom ? scaled(row, table, name, scaleFrom) : row.g, ...base, confidence: 'analogie' }
      const of = scaleFrom ?? row.foods[0]
      if (of) e.analogy_of = of
      if (note) e.notes = note
      out[name] = e
    }
  }
  const bis = painBis(measurements)
  if (bis) out['Pain bis (à la farine T80 ou T110)'] = bis
  return out
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  const table = JSON.parse(readFileSync(TABLE_PATH, 'utf8'))
  const m = JSON.parse(readFileSync(MEASUREMENTS_PATH, 'utf8'))
  const entries = buildLiljeboEntries(table, m)
  for (const [n, e] of Object.entries(entries)) console.log(`${e.g}${e.g_high ? `–${e.g_high}` : ''} g/100 g  ${e.confidence}  ${n}`)
  if (process.argv.includes('--write')) {
    for (const [n, fructans] of Object.entries(entries)) m.foods[n] = { ...m.foods[n], fructans }
    writeFileSync(MEASUREMENTS_PATH, formatMeasurements(m))
    console.log(`Écrit : ${MEASUREMENTS_PATH}`)
  }
}

#!/usr/bin/env node
/**
 * Fructanes des aliments courants d'après Ferjančič et al. 2024 (Front. Nutr. 11:1446771, CC BY 4.0, tableau 1),
 * ramenés aux noms Ciqual (N3e, journal/IDEES.md I192).
 *
 * Le tableau donne les fructanes en % de matière fraîche (AOAC 999.03). « ND » (non détectable) n'est pas un zéro :
 * l'article fixe la limite en absorbance, pas en grammes. Borne haute prudente : 0,3 % de matière sèche, soit environ
 * 4 fois la plus petite teneur quantifiée du tableau (polenta, 0,07 % MS), les prises d'essai variant de 0,1 à 0,4 g.
 * Ramenée au frais par l'eau mesurée dans l'article (« / » : échantillon analysé tel quel, la borne vaut 0,3).
 * Une entrée « ND » vaut `{ g: 0, lt }` : un repas n'est dit pauvre que si le total, limites comprises, reste sous
 * le repère.
 * Analogies (`analogie`, confiance basse) : variété proche, ou cuisson à l'eau ou à la vapeur d'un légume mesuré cru
 * (teneur du cru reprise telle quelle : une partie des fructanes passe dans l'eau, estimation plutôt haute). Pas de
 * rôti, ni de produit aromatisé ou cuisiné (oignon, ail possibles).
 *
 * node scripts/nutrition/ferjancicFructans.mjs [--write]   (met à jour src/data/fodmapMeasurements.json)
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatMeasurements } from './legumeGos.mjs'

/** Limite de quantification supposée, en % de matière sèche (voir plus haut). */
export const ND_LIMIT_DW = 0.3

const round3 = (x) => Math.round(x * 1000) / 1000

/** Borne haute d'un « ND » pour 100 g d'aliment frais ; `water` = eau du tableau 1 (null pour « / »). */
export function ndLimit(water) {
  return round3(water == null ? ND_LIMIT_DW : (ND_LIMIT_DW * (100 - water)) / 100)
}

const COOKED = 'Cuit : on reprend la teneur du cru (une partie des fructanes passe dans l’eau de cuisson), estimation plutôt haute.'

/**
 * Lignes du tableau 1 reprises : `fw` (% de matière fraîche) ou `nd: true`, `water` (%, null pour « / »),
 * `foods` (nom Ciqual mesuré), `analogies` (nom Ciqual → note).
 */
export const ROWS = [
  { row: 'carotte', fw: 0.11, water: 88, foods: ['Carotte, crue'], analogies: {
    'Carotte, cuite (aliment moyen)': COOKED, "Carotte, bouillie/cuite à l'eau (aliment moyen)": COOKED, 'Carotte, cuite à la vapeur': COOKED } },
  { row: 'chou-rave', nd: true, water: 91, foods: ['Chou-rave, cru'], analogies: { "Chou-rave, bouilli/cuit à l'eau": COOKED } },
  { row: 'tomate', fw: 0.01, water: 95, foods: ['Tomate sans précision, crue (aliment moyen)'], analogies: {
    'Tomate ronde, crue': null, 'Tomate cerise, crue': null, 'Tomate grappe, crue': null } },
  { row: 'laitue', fw: 0.01, water: 98, foods: ['Laitue, crue'], analogies: { 'Laitue iceberg, crue': null, 'Laitue romaine, crue': null } },
  { row: 'poivron', fw: 0.02, water: 90, foods: ['Poivron, vert, jaune ou rouge, cru'], analogies: {
    'Poivron rouge, cru': null, 'Poivron vert, cru': null, 'Poivron jaune, cru': null } },
  { row: 'chou-fleur', fw: 0.09, water: 89, foods: ['Chou-fleur, cru'], analogies: {
    "Chou-fleur, bouilli/cuit à l'eau": COOKED, 'Chou-fleur, cuit à la vapeur': COOKED } },
  { row: 'brocoli', fw: 0.02, water: 87, foods: ['Brocoli, cru'], analogies: {
    'Brocoli, cuit (aliment moyen)': COOKED, "Brocoli, bouilli/cuit à l'eau (aliment moyen)": COOKED, 'Brocoli, cuit à la vapeur': COOKED } },
  { row: 'concombre', nd: true, water: 95, foods: ['Concombre, chair et peau, cru'], analogies: { 'Concombre, chair sans peau, cru': null } },
  { row: 'chou', fw: 0.03, water: 91, foods: ['Chou blanc, cru'], analogies: { "Chou blanc, bouilli/cuit à l'eau": COOKED, 'Chou vert, cru': null } },
  { row: 'courgette', fw: 0.01, water: 95, foods: ['Courgette, chair et peau, crue'], analogies: { 'Courgette, chair et peau, cuite': COOKED } },
  { row: 'cornichon', nd: true, water: 94, foods: ['Cornichon, au vinaigre'], analogies: {} },
  { row: 'pomme de terre cuite', nd: true, water: 84, foods: ["Pomme de terre, bouillie/cuite à l'eau"], analogies: {
    'Pomme de terre, cuite (aliment moyen)': null } },
  { row: 'frites', nd: true, water: 85, foods: ['Frites de pommes de terre, surgelées, cuites en friteuse'], analogies: {},
    notes: 'Eau et matières grasses comptées ensemble dans l’article.' },
  { row: 'riz cuit', nd: true, water: 79, foods: ['Riz blanc, cuit, sans sel ajouté'], analogies: {
    'Riz basmati, cuit, sans sel ajouté': null, 'Riz blanc étuvé, cuit, sans sel ajouté': null } },
  { row: 'pétales de maïs', nd: true, water: null, foods: ['Pétales de maïs nature, non enrichis en vitamines et minéraux'], analogies: {
    'Pétales de maïs nature, enrichis en vitamines et minéraux': null } },
  { row: 'polenta cuite', fw: 0.04, water: 53, foods: ['Polenta ou semoule de maïs, cuite, sans sel ajouté'], analogies: {} },
  { row: 'orge mondé', fw: 0.47, water: null, foods: ['Orge complète, crue'], analogies: { 'Orge perlée, crue': null } },
  { row: 'petits pois en conserve', fw: 0.33, water: 81, foods: ['Petits pois, appertisés, égouttés'], analogies: {} },
  { row: 'haricots verts', fw: 0.03, water: 92, foods: ['Haricot vert, cuit'], analogies: {
    "Haricot vert, bouilli/cuit à l'eau": null, 'Haricot vert, appertisé, égoutté': null } },
  { row: 'haricots en conserve', fw: 0.24, water: 87, foods: [], analogies: {
    'Haricot blanc, appertisé, égoutté': 'Espèce des haricots en conserve non précisée dans l’article.',
    'Haricot rouge, appertisé, égoutté': 'Espèce des haricots en conserve non précisée dans l’article.' } },
]

function entry(row, confidence, analogyOf, note) {
  const nd = row.nd === true
  const e = nd ? { g: 0, lt: ndLimit(row.water) } : { g: row.fw }
  Object.assign(e, { source: 'ferjancic2024', ref: `tableau 1, ${row.row}${nd ? ' (ND)' : ''}`, confidence })
  if (analogyOf) e.analogy_of = analogyOf
  const notes = [nd ? `Non détectable : moins de ${String(e.lt).replace('.', ',')} g pour 100 g (borne haute prudente).` : null, row.notes, note]
    .filter(Boolean)
  if (notes.length) e.notes = notes.join(' ')
  return e
}

/** Entrées `fructans` de fodmapMeasurements.json, par nom Ciqual. */
export function buildFerjancicEntries() {
  const out = {}
  for (const row of ROWS) {
    for (const name of row.foods) out[name] = entry(row, 'mesure', null, null)
    for (const [name, note] of Object.entries(row.analogies)) out[name] = entry(row, 'analogie', row.foods[0] ?? null, note)
  }
  return out
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  const path = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'data', 'fodmapMeasurements.json')
  const entries = buildFerjancicEntries()
  for (const [n, e] of Object.entries(entries)) console.log(`${e.lt != null ? `< ${e.lt}` : e.g} g/100 g  ${e.confidence}  ${n}`)
  if (process.argv.includes('--write')) {
    const m = JSON.parse(readFileSync(path, 'utf8'))
    for (const [n, fructans] of Object.entries(entries)) m.foods[n] = { ...m.foods[n], fructans }
    writeFileSync(path, formatMeasurements(m))
    console.log(`Écrit : ${path}`)
  }
}

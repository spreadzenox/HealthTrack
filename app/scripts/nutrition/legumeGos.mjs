#!/usr/bin/env node
/**
 * GOS (raffinose + stachyose) des légumineuses cuites, estimés depuis leur mesure à sec (N3b-2).
 *
 * Ciqual ne mesure pas les GOS. Siva et al. 2019 (Front. Nutr. 6:38, CC BY, tableau 5) les mesure sur
 * légumineuses sèches, en mg/100 g à 10 % d'humidité. On ramène au cuit par l'eau Ciqual de l'aliment cuit,
 * puis on applique les pertes de Njoumi et al. 2019 (Int J Food Sci Nutr 70:551, facteurs chiffrés seulement) :
 * trempage −10 % (lentille) à −40 % (pois chiche), cuisson −32 % (raffinose) et −25 % (stachyose).
 * Règle de calcul : journal/IDEES.md I178 (règle 3). Toujours en confiance basse (`analogie`).
 *
 * node scripts/nutrition/legumeGos.mjs --dir <dossier XML Ciqual> [--write]
 * Relit l'eau (constituant 400) dans compo_*.xml et, avec --write, met à jour src/data/fodmapMeasurements.json.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const SIVA_MOISTURE = 10
const COOK_LOSS = { raffinose: 0.32, stachyose: 0.25 }

/** Moyennes Siva 2019 par espèce (mg/100 g à 10 % d'humidité) ; la verbascose est notée, non comptée. */
const DRY = {
  lentille: { raffinose_mg: 496, stachyose_mg: 2292, verbascose_mg: 1354, ref: 'tableau 5, lentilles (moyenne des classes)' },
  pois_chiche: { raffinose_mg: 441, stachyose_mg: 1533, verbascose_mg: 120, ref: 'tableau 5, pois chiches (moyenne des classes)' },
  haricot: { raffinose_mg: 662, stachyose_mg: 2218, verbascose_mg: 168, ref: 'tableau 5, haricots communs (moyenne des classes)' },
}

/** Perte au trempage (Njoumi 2019). Haricots non mesurés : on prend la plus faible publiée, estimation haute. */
const SOAK = { lentille: 0.1, pois_chiche: 0.4, haricot: 0.1 }

const CANNED = 'Conserve : perte supplémentaire dans le jus d’égouttage non chiffrée, la valeur réelle est sans doute plus basse.'
const BEAN_SOAK = 'Perte au trempage des haricots non mesurée : on prend la plus faible publiée (10 %), estimation plutôt haute.'

/** Aliments cuits de la table (noms Ciqual exacts) → espèce mesurée par Siva. */
export const LEGUMES = {
  "Lentille, bouillie/cuite à l'eau (aliment moyen)": { species: 'lentille' },
  "Lentille verte, bouillie/cuite à l'eau": { species: 'lentille' },
  "Lentille blonde, bouillie/cuite à l'eau": { species: 'lentille' },
  "Lentille corail, bouillie/cuite à l'eau": { species: 'lentille' },
  "Pois chiche, bouilli/cuit à l'eau": { species: 'pois_chiche' },
  'Pois chiche, appertisé, égoutté': { species: 'pois_chiche', canned: true },
  "Haricot blanc, bouilli/cuit à l'eau": { species: 'haricot' },
  'Haricot blanc, appertisé, égoutté': { species: 'haricot', canned: true },
  "Haricot rouge, bouilli/cuit à l'eau": { species: 'haricot' },
  'Haricot rouge, appertisé, égoutté': { species: 'haricot', canned: true },
  "Haricot flageolet, bouilli/cuit à l'eau": { species: 'haricot' },
  "Haricot flageolet, vert, bouilli/cuit à l'eau": { species: 'haricot' },
  'Haricot flageolet, appertisé, égoutté': { species: 'haricot', canned: true },
}

const round3 = (x) => Math.round(x * 1000) / 1000

/**
 * g de GOS pour 100 g d'aliment cuit.
 * @param {{ raffinose_mg: number, stachyose_mg: number }} dry mesure à sec (base 10 % d'humidité)
 * @param {{ water_g: number, soak_loss: number }} cooked eau Ciqual du cuit et perte au trempage
 */
export function cookedGos(dry, { water_g, soak_loss }) {
  const factor = Math.max(0, 100 - water_g) / (100 - SIVA_MOISTURE)
  const mg = dry.raffinose_mg * (1 - COOK_LOSS.raffinose) + dry.stachyose_mg * (1 - COOK_LOSS.stachyose)
  return round3((mg * factor * (1 - soak_loss)) / 1000)
}

/** Entrées `gos` de fodmapMeasurements.json, depuis l'eau Ciqual de chaque aliment cuit. */
export function buildLegumeEntries(waterByName, table) {
  const out = {}
  for (const [name, { species, canned }] of Object.entries(LEGUMES)) {
    const water_g = waterByName[name]
    if (typeof water_g !== 'number') throw new Error(`Eau Ciqual manquante : ${name}`)
    const { ref, ...dryValues } = DRY[species]
    const dry = { raffinose_mg: dryValues.raffinose_mg, stachyose_mg: dryValues.stachyose_mg }
    const derivation = {
      dry,
      water_g,
      soak_loss: SOAK[species],
      cook_loss: COOK_LOSS,
      ciqual_code: table[name]?.ciqual_code ?? null,
      losses: 'njoumi2019',
    }
    const notes = [
      `Calculé depuis le sec : eau Ciqual ${String(water_g).replace('.', ',')} g, pertes au trempage et à la cuisson (Njoumi 2019).`,
      `Verbascose (${dryValues.verbascose_mg} mg/100 g à sec) non comptée.`,
      species === 'haricot' && !name.startsWith('Haricot rouge') && !name.startsWith('Haricot blanc')
        ? 'Flageolet : même espèce que les haricots mesurés (Phaseolus vulgaris).'
        : null,
      species === 'haricot' ? BEAN_SOAK : null,
      canned ? CANNED : null,
    ].filter(Boolean)
    out[name] = {
      g: cookedGos(dry, derivation),
      source: 'siva2019',
      ref: `${ref}, raffinose ${dry.raffinose_mg} + stachyose ${dry.stachyose_mg} mg/100 g à sec`,
      confidence: 'analogie',
      notes: notes.join(' '),
      derivation,
    }
  }
  return out
}

export const SOURCES = {
  siva2019: {
    title: 'Siva N. et al., Variability in prebiotic carbohydrates in different market classes of chickpea, common bean, and lentil collected from the American local market, Front. Nutr. 2019;6:38',
    cite: 'Siva 2019 (pertes : Njoumi 2019)',
    doi: '10.3389/fnut.2019.00038',
    license: 'CC BY 4.0',
    method: 'HPAE-PAD ; mg/100 g de légumineuse sèche à 10 % d’humidité ; GOS = raffinose + stachyose',
  },
  njoumi2019: {
    title: 'Njoumi S. et al., Soaking and cooking modify the alpha-galacto-oligosaccharide and dietary fibre content in five Mediterranean legumes, Int J Food Sci Nutr 2019;70(5):551–561',
    cite: 'Njoumi 2019',
    doi: '10.1080/09637486.2018.1544229',
    license: 'CC BY-NC-ND 4.0 : seuls des facteurs chiffrés (non protégés) sont repris, cités',
    method: 'pertes au trempage et à la cuisson',
  },
}

/** Même mise en forme que le fichier livré : une ligne par groupe d'un aliment. */
export function formatMeasurements(m) {
  const inline = (v) => JSON.stringify(v).replace(/^\{/, '{ ').replace(/\}$/, ' }').replace(/","/g, '", "').replace(/,"/g, ', "').replace(/":/g, '": ')
  const foods = Object.entries(m.foods).map(([name, groups]) => {
    const lines = Object.entries(groups).map(([g, v]) => `      ${JSON.stringify(g)}: ${inline(v)}`)
    return `    ${JSON.stringify(name)}: {\n${lines.join(',\n')}\n    }`
  })
  const head = JSON.stringify({ ...m, foods: '@@FOODS@@' }, null, 2)
  return head.replace('"@@FOODS@@"', `{\n${foods.join(',\n')}\n  }`) + '\n'
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  const { decodeXml, parseRecords } = await import('./ciqual.mjs')
  const args = process.argv.slice(2)
  const dir = args[args.indexOf('--dir') + 1]
  if (!args.includes('--dir') || !dir) {
    console.error('Usage : legumeGos.mjs --dir <dossier XML Ciqual> [--write]')
    process.exit(2)
  }
  const appDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
  const table = JSON.parse(readFileSync(join(appDir, 'src', 'data', 'ingredientsNutrition.json'), 'utf8'))
  const byCode = new Map(Object.keys(LEGUMES).map((n) => [table[n]?.ciqual_code, n]))
  const water = {}
  for (const f of readdirSync(dir).filter((f) => /^compo_.*\.xml$/i.test(f))) {
    for (const r of parseRecords(decodeXml(readFileSync(join(dir, f))), 'COMPO')) {
      if (r.const_code === '400' && byCode.has(r.alim_code)) water[byCode.get(r.alim_code)] = Number(r.teneur.replace(',', '.'))
    }
  }
  const entries = buildLegumeEntries(water, table)
  for (const [n, e] of Object.entries(entries)) console.log(`${e.g.toFixed(3)} g/100 g  eau ${e.derivation.water_g}  ${n}`)
  if (args.includes('--write')) {
    const path = join(appDir, 'src', 'data', 'fodmapMeasurements.json')
    const m = JSON.parse(readFileSync(path, 'utf8'))
    for (const [k, v] of Object.entries(SOURCES)) m.sources[k] = { ...m.sources[k], ...v }
    for (const [n, gos] of Object.entries(entries)) m.foods[n] = { ...m.foods[n], gos }
    writeFileSync(path, formatMeasurements(m))
    console.log(`Écrit : ${path}`)
  }
}

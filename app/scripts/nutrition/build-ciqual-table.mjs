#!/usr/bin/env node
/**
 * Reconstruit src/data/ingredientsNutrition.json depuis la table Ciqual officielle (ANSES).
 *
 * 1. Télécharger les XML de la dernière version : Ciqual 2025 est publiée par l'Anses sur Zenodo
 *    (https://zenodo.org/records/17550133 : alim_*, compo_*, const_*.xml ; vérifier les md5 de la page),
 *    ou le zip de https://ciqual.anses.fr (rubrique « Téléchargement »), dans un dossier (ex. /tmp/ciqual).
 * 2. node scripts/nutrition/build-ciqual-table.mjs --dir /tmp/ciqual --version "Ciqual 2025" \
 *      --license "CC BY 4.0" --source "doi:10.5281/zenodo.17550133" [--write]
 *
 * Sans --write : affiche le bilan (aliments, constituants trouvés, audit avant / après) sans rien
 * écrire. Échoue si un constituant attendu manque (format changé) plutôt que de laisser des trous.
 * Écrit aussi src/data/ciqualMeta.json (version, attribution, aliments de l'ancienne table absents).
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildTable, decodeXml, parseRecords } from './ciqual.mjs'
import { auditTable } from './audit.mjs'
import { ALIASES } from './aliases.mjs'

const args = process.argv.slice(2)
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null }
const dir = arg('--dir')
const version = arg('--version')
if (!dir || !version) {
  console.error('Usage : build-ciqual-table.mjs --dir <dossier XML Ciqual> --version "Ciqual AAAA" [--write]')
  process.exit(2)
}

const appDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const tablePath = join(appDir, 'src', 'data', 'ingredientsNutrition.json')
const files = readdirSync(dir)
const read = (re, tag) =>
  files.filter((f) => re.test(f)).flatMap((f) => parseRecords(decodeXml(readFileSync(join(dir, f))), tag))

const raw = {
  alims: read(/^alim_(?!grp).*\.xml$/i, 'ALIM'),
  compos: read(/^compo_.*\.xml$/i, 'COMPO'),
  consts: read(/^const_.*\.xml$/i, 'CONST'),
}
const previous = JSON.parse(readFileSync(tablePath, 'utf8'))
const { table, meta } = buildTable(raw, {
  version,
  license: arg('--license') || undefined,
  source: arg('--source'),
  keep: previous,
  keepFields: ['fodmap_score'],
  aliases: ALIASES,
})

console.log(`${meta.foods} aliments, ${raw.compos.length} teneurs lues`)
if (meta.missingConstituents.length) {
  console.error(`Constituants introuvables (format changé ?) : ${meta.missingConstituents.join(', ')}`)
  process.exit(1)
}
if (meta.missingAliasTargets.length) {
  console.error(`Alias vers des aliments absents de ${version} : ${meta.missingAliasTargets.join(' | ')}`)
  process.exit(1)
}
console.log(`Alias : ${meta.aliases}`)
// Aucun nom de l'ancienne table ne doit disparaître : les repas déjà saisis seraient mal calculés.
if (meta.missingFromCiqual.length) {
  console.error(`Noms de l'ancienne table sans équivalent (à ajouter dans aliases.mjs) : ${meta.missingFromCiqual.join(' | ')}`)
  process.exit(1)
}
console.log('Audit avant :', auditTable(previous).summary)
const after = auditTable(table)
console.log('Audit après :', after.summary, `valeurs inconnues ${(after.unknownShare * 100).toFixed(1)} %`)

// Même ordre que l'ancienne table (alphabétique : recherche et prompt de l'IA), nouveaux aliments triés à la suite
const ordered = {}
for (const name of Object.keys(previous)) if (table[name]) ordered[name] = table[name]
for (const name of Object.keys(table).sort((a, b) => a.localeCompare(b, 'fr'))) if (!ordered[name]) ordered[name] = table[name]

if (args.includes('--write')) {
  writeFileSync(tablePath, JSON.stringify(ordered))
  writeFileSync(join(appDir, 'src', 'data', 'ciqualMeta.json'), JSON.stringify(meta, null, 2) + '\n')
  console.log(`Écrit : ${tablePath}`)
}

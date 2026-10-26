#!/usr/bin/env node
/** Bilan de cohérence d'une table : node scripts/nutrition/audit-cli.mjs [chemin.json] */
import { readFileSync } from 'node:fs'
import { auditTable } from './audit.mjs'

const path = process.argv[2] || new URL('../../src/data/ingredientsNutrition.json', import.meta.url)
const r = auditTable(JSON.parse(readFileSync(path, 'utf8')))
console.log(`${r.foods} aliments ; valeurs inconnues ${(r.unknownShare * 100).toFixed(1)} %`)
console.log(r.summary)
for (const g of r.issues.identicalMicros.slice(0, 10)) console.log(`  ${g.length} aliments au même vecteur : ${g.slice(0, 3).join(' | ')}…`)

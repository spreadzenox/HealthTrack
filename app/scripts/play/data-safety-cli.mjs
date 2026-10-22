#!/usr/bin/env node
/**
 * CLI du workflow « Play — sécurité des données » : `node scripts/play/data-safety-cli.mjs [--write]` (depuis app/).
 * --write réécrit store/data-safety/data-safety.csv (le CSV prêt à importer à la main dans la Play Console).
 * Variables : PLAY_ACCESS_TOKEN (jeton androidpublisher ; absent → vérification seulement),
 * PLAY_PACKAGE (fr.jpesquet.sante par défaut), GITHUB_STEP_SUMMARY (facultatif).
 * Code de sortie : 0 envoyé (ou vérifié), 2 refusé par Play (droit ou formulaire préalable manquant), 1 erreur.
 */
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fillTemplate, validateDataSafety, declaredTypes, publishDataSafety, toCsv } from './dataSafety.mjs'
import { isAccessDenied, PlayApiError } from './publish.mjs'
import { DATA_SAFETY_ANSWERS } from '../../store/data-safety/answers.mjs'

const { PLAY_ACCESS_TOKEN: token, GITHUB_STEP_SUMMARY: summaryFile } = process.env
const packageName = process.env.PLAY_PACKAGE || 'fr.jpesquet.sante'
const dir = resolve(process.cwd(), 'store/data-safety')

const summary = (lines) => {
  if (summaryFile) appendFileSync(summaryFile, `${lines.join('\n')}\n`)
  console.log(lines.join('\n'))
}

const { rows, errors: fillErrors } = fillTemplate(readFileSync(resolve(dir, 'template.csv'), 'utf8'), DATA_SAFETY_ANSWERS)
const errors = [...fillErrors, ...validateDataSafety(rows)]
if (errors.length) {
  for (const e of errors) console.log(`::error title=Sécurité des données invalide::${e}`)
  summary(['### Sécurité des données : formulaire invalide', '', ...errors.map((e) => `- ${e}`)])
  process.exit(1)
}
const csv = toCsv(rows)
if (process.argv.includes('--write')) writeFileSync(resolve(dir, 'data-safety.csv'), csv)
const what = `types déclarés : ${declaredTypes(rows).join(', ')}`
if (!token) {
  summary([`### Sécurité des données vérifiée (${what})`, '', 'Aucun jeton : rien n’est envoyé.'])
  process.exit(0)
}

try {
  await publishDataSafety({ packageName, csv, token })
  summary([`### Sécurité des données envoyée sur Google Play`, '', `- ${what}`, '- Visible dans Play Console → Contenu de l’app → Sécurité des données.'])
} catch (err) {
  if (isAccessDenied(err) || (err instanceof PlayApiError && err.status === 400)) {
    console.log(`::warning title=Sécurité des données refusée par Google Play::${err.message}. Repli : importer app/store/data-safety/data-safety.csv dans Play Console → Contenu de l’app → Sécurité des données → Importer depuis un fichier CSV (journal/PRODUIT.md P16).`)
    summary(['### Sécurité des données : refusée par Google Play', '', `- ${err.message}`, '- Repli : importer `app/store/data-safety/data-safety.csv` à la main (journal/PRODUIT.md P16).'])
    process.exit(2)
  }
  console.log(`::error title=Sécurité des données : envoi impossible::${err.message}`)
  summary(['### Sécurité des données : envoi impossible', '', `- ${err.message}`])
  process.exit(1)
}

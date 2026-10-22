#!/usr/bin/env node
/**
 * CLI du workflow « Play — fiche du Store » : `node scripts/play/listing-cli.mjs` (depuis app/).
 * Variables : PLAY_ACCESS_TOKEN (jeton androidpublisher ; absent → vérification de la fiche seulement),
 * PLAY_PACKAGE (fr.jpesquet.sante par défaut), PLAY_WEBSITE (site web de la fiche), GITHUB_STEP_SUMMARY (facultatif).
 * Code de sortie : 0 envoyée (ou vérifiée), 2 accès refusé (à réessayer), 1 fiche invalide ou autre erreur.
 */
import { readFileSync, appendFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { readListing, validateListing, publishListing, IMAGE_TYPES } from './listing.mjs'
import { isAccessDenied } from './publish.mjs'

const { PLAY_ACCESS_TOKEN: token, GITHUB_STEP_SUMMARY: summaryFile } = process.env
const packageName = process.env.PLAY_PACKAGE || 'fr.jpesquet.sante'
const website = process.env.PLAY_WEBSITE || 'https://spreadzenox.github.io/HealthTrack/'

const summary = (lines) => {
  if (summaryFile) appendFileSync(summaryFile, `${lines.join('\n')}\n`)
  console.log(lines.join('\n'))
}

const listing = readListing(resolve(process.cwd(), 'store'))
const errors = validateListing(listing)
if (errors.length) {
  for (const e of errors) console.log(`::error title=Fiche du Store invalide::${e}`)
  summary(['### Fiche du Store invalide', '', ...errors.map((e) => `- ${e}`)])
  process.exit(1)
}
const counts = `titre « ${listing.title} », ${listing.images.phoneScreenshots.length} captures`
if (!token) {
  summary([`### Fiche du Store vérifiée (${listing.language}) : ${counts}`, '', 'Aucun jeton : rien n’est envoyé.'])
  process.exit(0)
}

const images = Object.fromEntries(IMAGE_TYPES.map((t) => [t, listing.images[t].map((p) => readFileSync(p))]))
try {
  const r = await publishListing({ packageName, listing, images, website, token, log: console.log })
  summary([
    `### Fiche du Store envoyée sur Google Play (${r.language}) : ${counts}`,
    '',
    `- Langue par défaut de la fiche dans la Play Console : ${r.defaultLanguage ?? '?'}${r.defaultLanguage && r.defaultLanguage !== r.language ? ` ⚠️ (la fiche ${r.language} est une traduction ; mettre ${r.language} par défaut dans Présence sur le Store → Fiche principale)` : ''}`,
    ...IMAGE_TYPES.map((t) => `- ${t} : ${r.images[t] === 'inchangées' ? 'inchangées' : `${r.images[t]} envoyée(s)`}`),
    `- Site web (${website}) : ${r.website}`,
    r.notSentForReview ? '- Validée sans envoi automatique pour examen : Play Console → Vue d’ensemble de la publication → « Envoyer pour examen ».' : '- Validée.',
  ])
} catch (err) {
  if (isAccessDenied(err)) {
    console.log(`::warning title=Google Play : accès refusé à la fiche::${err.message}. gh-deployer n’a peut-être pas le droit « Gérer la présence sur le Store » (action du propriétaire, journal/PRODUIT.md).`)
    summary(['### Fiche du Store : accès refusé', '', `- ${err.message}`])
    process.exit(2)
  }
  console.log(`::error title=Fiche du Store : envoi impossible::${err.message}`)
  summary(['### Fiche du Store : envoi impossible', '', `- ${err.message}`])
  process.exit(1)
}

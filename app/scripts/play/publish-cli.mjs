#!/usr/bin/env node
/**
 * CLI du workflow « Play — AAB » : `node scripts/play/publish-cli.mjs <fichier.aab>` (depuis app/).
 * Variables : PLAY_ACCESS_TOKEN (jeton androidpublisher), VERSION_CODE, PLAY_TRACK (internal par défaut),
 * PLAY_PACKAGE (fr.jpesquet.sante par défaut), GITHUB_STEP_SUMMARY (facultatif).
 * Code de sortie : 0 publié (ou déjà envoyé), 2 accès refusé (à réessayer au run suivant), 1 autre erreur.
 */
import { readFileSync, readdirSync, appendFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { publishBundle, buildReleaseNotes, isAccessDenied } from './publish.mjs'

const aabPath = process.argv[2]
const { PLAY_ACCESS_TOKEN: token, VERSION_CODE: versionCode, GITHUB_STEP_SUMMARY: summaryFile } = process.env
const track = process.env.PLAY_TRACK || 'internal'
const packageName = process.env.PLAY_PACKAGE || 'fr.jpesquet.sante'

const summary = (lines) => {
  if (summaryFile) appendFileSync(summaryFile, `${lines.join('\n')}\n`)
  console.log(lines.join('\n'))
}

if (!aabPath || !token || !versionCode) {
  console.error('Usage : PLAY_ACCESS_TOKEN=… VERSION_CODE=… node scripts/play/publish-cli.mjs <fichier.aab>')
  process.exit(1)
}

const dir = resolve(process.cwd(), 'src/data/changelog')
const entries = readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => ({ id: f, ...JSON.parse(readFileSync(resolve(dir, f), 'utf8')) }))
const notes = buildReleaseNotes(entries)

try {
  const r = await publishBundle({ packageName, aab: readFileSync(aabPath), versionCode, track, notes, token, log: console.log })
  if (r.outcome === 'already-uploaded') {
    summary(['', `### Google Play : versionCode ${versionCode} déjà envoyé`, '', 'Rien à faire (relance d’un run déjà publié).'])
  } else {
    summary([
      '',
      `### Google Play : versionCode ${versionCode} envoyé sur la piste « ${track} »`,
      '',
      r.status === 'draft'
        ? '- ⚠️ Version créée **en brouillon** (Play n’accepte que des brouillons tant que l’app n’est pas prête) : Play Console → Tester → Test interne → « Modifier la version » → « Déployer ».'
        : track === 'alpha'
          ? '- Déployée sur le test fermé (alpha) : Google l’examine d’abord (quelques heures à quelques jours), puis les membres du groupe des testeurs peuvent l’installer.'
          : '- Déployée auprès des testeurs internes (installation depuis le Play Store, quelques minutes après).',
      ...(r.reusedBundle ? ['- Même AAB que la version déjà envoyée en test interne (promotion de la version candidate).'] : []),
      ...(r.testersAdded ? ['- Groupe halcya-testeurs@googlegroups.com ajouté aux testeurs de la piste alpha.'] : []),
      r.notSentForReview ? '- Validée sans envoi automatique pour examen (des modifications attendent un envoi manuel dans la Play Console).' : '- Validée.',
      `- Notes de version (${r.language}) :`,
      '',
      ...notes.split('\n').map((l) => `  ${l}`),
    ])
  }
} catch (err) {
  if (isAccessDenied(err)) {
    console.log(`::warning title=Google Play : accès refusé::${err.message}. gh-deployer n’a pas encore accès à l’app dans la Play Console (l’invitation d’un compte de service peut mettre 24 à 48 h à s’appliquer). Réessai automatique à la prochaine version ; l’AAB reste en artefact.`)
    summary(['', '### Google Play : accès refusé', '', `- ${err.message}`, '- L’AAB reste disponible en artefact ; nouvel essai à la prochaine version.'])
    process.exit(2)
  }
  console.log(`::error title=Google Play : envoi impossible::${err.message}`)
  summary(['', '### Google Play : envoi impossible', '', `- ${err.message}`])
  process.exit(1)
}

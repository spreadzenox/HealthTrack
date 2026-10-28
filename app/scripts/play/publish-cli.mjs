#!/usr/bin/env node
/**
 * CLI du workflow « Play — AAB » : `node scripts/play/publish-cli.mjs <fichier.aab> [mapping.txt]` (depuis app/).
 * mapping.txt (R8, POL-PLAY-10) : facultatif ; envoyé avec l'AAB s'il existe.
 * Variables : PLAY_ACCESS_TOKEN (jeton androidpublisher), VERSION_CODE, PLAY_TRACK (internal par défaut),
 * PLAY_PACKAGE (fr.jpesquet.sante par défaut), GITHUB_STEP_SUMMARY (facultatif).
 * Déclaration P28 (workflow « Play — brouillon P28 ») : PLAY_DRAFT=1 crée la version en brouillon, jamais déployée,
 * sous le nom PLAY_RELEASE_NAME, avec les notes PLAY_NOTES au lieu des Nouveautés.
 * Lecture au déverrouillage allumée en test interne (P28, 27/10) : PLAY_FACE_UNLOCK=1 (AAB avec l'interrupteur
 * allumé : test interne au seul propriétaire vérifié), PLAY_NO_REUSE=1 (alpha : jamais l'AAB du test interne).
 * Code de sortie : 0 publié (ou déjà envoyé), 2 accès refusé (à réessayer au run suivant), 1 autre erreur.
 */
import { readFileSync, readdirSync, appendFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { publishBundle, buildReleaseNotes, isAccessDenied } from './publish.mjs'

const aabPath = process.argv[2]
const mappingPath = process.argv[3]
const { PLAY_ACCESS_TOKEN: token, VERSION_CODE: versionCode, GITHUB_STEP_SUMMARY: summaryFile } = process.env
const track = process.env.PLAY_TRACK || 'internal'
const packageName = process.env.PLAY_PACKAGE || 'fr.jpesquet.sante'
const draft = process.env.PLAY_DRAFT === '1'
const releaseName = process.env.PLAY_RELEASE_NAME || String(versionCode)
const faceUnlock = process.env.PLAY_FACE_UNLOCK === '1'
const noReuse = process.env.PLAY_NO_REUSE === '1'

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
const notes = process.env.PLAY_NOTES || buildReleaseNotes(entries)

try {
  const r = await publishBundle({ packageName, aab: readFileSync(aabPath), mapping: mappingPath && existsSync(mappingPath) ? readFileSync(mappingPath) : undefined, versionCode, track, notes, token, draft, releaseName, privateTrack: faceUnlock, noReuse, log: console.log })
  if (r.outcome === 'already-uploaded') {
    summary(['', `### Google Play : versionCode ${versionCode} déjà envoyé`, '', 'Rien à faire (relance d’un run déjà publié).'])
  } else {
    summary([
      '',
      `### Google Play : versionCode ${versionCode} envoyé sur la piste « ${track} »`,
      '',
      draft
        ? `- Version **${releaseName}** créée **en brouillon**, jamais déployée : elle ne sert qu’à faire apparaître la déclaration « Autorisations des services de premier plan » (Play Console → Contenu de l’app). Les versions déjà en test interne restent en place.`
        : r.status === 'draft'
        ? '- ⚠️ Version créée **en brouillon** (Play n’accepte que des brouillons tant que l’app n’est pas prête) : Play Console → Tester → Test interne → « Modifier la version » → « Déployer ».'
        : track === 'alpha'
          ? '- Déployée sur le test fermé (alpha) : Google l’examine d’abord (quelques heures à quelques jours), puis les membres du groupe des testeurs peuvent l’installer.'
          : '- Déployée auprès des testeurs internes (installation depuis le Play Store, quelques minutes après).',
      ...(r.keptDrafts ? [r.draftDropped ? `- ⚠️ Play a refusé de garder le brouillon ${r.keptDrafts.join(', ')} à côté : il a été retiré de la piste (relancer « Play — brouillon P28 » si la déclaration n’est pas encore faite).` : `- Brouillon ${r.keptDrafts.join(', ')} gardé sur la piste (déclaration P28).`] : []),
      ...(faceUnlock
        ? [
            '- **Lecture du bien-être au déverrouillage allumée** (service de premier plan caméra, P28) : version réservée au test interne.',
            `- Groupes testeurs du test interne : ${r.internalGroups == null ? 'illisibles par l’API (liste d’adresses e-mail seulement ?)' : r.internalGroups.length ? r.internalGroups.join(', ') : 'aucun (liste d’adresses e-mail seulement)'}.`,
          ]
        : []),
      ...(r.reusedBundle ? ['- Même AAB que la version déjà envoyée en test interne (promotion de la version candidate).'] : []),
      ...(r.mapping === 'uploaded' ? ['- Fichier de correspondance R8 envoyé (traces de plantage lisibles dans Android vitals).'] : []),
      ...(r.mapping === 'failed' ? [`- ⚠️ Fichier de correspondance R8 refusé (${r.mappingError}) : les traces de plantage de cette version resteront obscurcies.`] : []),
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
  summary([
    '',
    '### Google Play : envoi impossible',
    '',
    `- ${err.message}`,
    ...(faceUnlock ? ['- AAB avec la lecture au déverrouillage : si Google le refuse faute de déclaration P28, couper l’interrupteur `FACE_UNLOCK_INTERNAL` de `.github/workflows/play-bundle.yml` pour débloquer les versions suivantes.'] : []),
  ])
  process.exit(1)
}

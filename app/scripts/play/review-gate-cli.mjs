#!/usr/bin/env node
/**
 * Porte des envois examinés pour « Play — fiche du Store » et « Play — abonnements » (CD-ALPHA-5) :
 * `node scripts/play/review-gate-cli.mjs listing|subscriptions` (depuis app/, clone complet).
 * Variables : GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_RUN_ID, GITHUB_EVENT_NAME, PLAY_ACCESS_TOKEN, PLAY_PACKAGE,
 * REVIEW_MIN_HOURS (24 par défaut ; 0 coupe le délai), GITHUB_OUTPUT (send=true|false), GITHUB_STEP_SUMMARY.
 * N'envoie que si le contenu (fiche ou abonnements) a changé depuis le dernier envoi réussi : un envoi reporté part
 * ainsi au passage quotidien, et un changement du seul workflow n'envoie rien. Erreur de lecture → on n'envoie pas
 * (l'envoi sera retenté au passage suivant), code 0.
 */
import { appendFileSync } from 'node:fs'
import { decideReviewed, hasNewContent, REVIEWED_WORKFLOWS, DEFAULT_MIN_HOURS } from './reviewGate.mjs'
import { fetchReviewedSends, readFreezeUntil, shaOfVersion, commitDate, filesSince } from './reviewIo.mjs'
import { readTracks } from './publish.mjs'

const kind = process.argv[2]
const own = REVIEWED_WORKFLOWS[kind]
const { GITHUB_TOKEN: ghToken, GITHUB_REPOSITORY: repo, GITHUB_RUN_ID: runId, GITHUB_EVENT_NAME: event, PLAY_ACCESS_TOKEN: token, GITHUB_OUTPUT: outFile, GITHUB_STEP_SUMMARY: summaryFile } = process.env
const packageName = process.env.PLAY_PACKAGE || 'fr.jpesquet.sante'
const minEnv = Number(process.env.REVIEW_MIN_HOURS)
const minHours = process.env.REVIEW_MIN_HOURS && Number.isFinite(minEnv) ? minEnv : DEFAULT_MIN_HOURS

const output = (send, lines) => {
  if (outFile) appendFileSync(outFile, `send=${send}\n`)
  if (summaryFile) appendFileSync(summaryFile, `${lines.join('\n')}\n`)
  console.log(lines.join('\n'))
}

if (!own) {
  console.error('Usage : review-gate-cli.mjs listing|subscriptions')
  process.exit(1)
}

try {
  const others = await fetchReviewedSends({ repo, ghToken, excludeId: runId })
  const mine = others.find((o) => o.kind === kind)
  if (!hasNewContent(kind, filesSince(mine.sha))) {
    output(false, ['## Envoi examiné par Google', '', `- ${event === 'schedule' ? 'Passage quotidien : ' : ''}rien de neuf dans ${own.label} depuis le dernier envoi (\`${mine.sha?.slice(0, 7)}\`) : pas d’envoi.`])
    process.exit(0)
  }
  const alphaCodes = (await readTracks({ packageName, token })).find((t) => t.track === 'alpha')?.releases?.flatMap((r) => r.versionCodes ?? []).map(Number) ?? []
  const alphaCode = alphaCodes.length ? Math.max(...alphaCodes) : null
  const sends = [{ what: `${alphaCode} sur l’alpha`, at: alphaCode ? commitDate(shaOfVersion(alphaCode)) : null }, ...others.map(({ what, at }) => ({ what, at }))]
  const d = decideReviewed({ sends, minHours, freezeUntil: readFreezeUntil() })
  output(d.send, [
    '## Envoi examiné par Google',
    '',
    `- ${sends.map((s) => `${s.what} : ${s.at ? s.at.slice(0, 16).replace('T', ' ') : 'aucun'}`).join(' · ')}`,
    `- Décision : **${d.send ? `envoi de ${own.label}` : `${own.label} : envoi reporté`}**${d.reason ? ` (${d.reason} ; le passage quotidien l’enverra)` : ''}`,
  ])
} catch (err) {
  output(false, ['## Envoi examiné par Google', '', `- ⚠️ Lecture des envois impossible (${err.message}) : envoi reporté au passage suivant.`])
}

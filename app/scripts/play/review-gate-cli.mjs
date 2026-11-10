#!/usr/bin/env node
/**
 * Porte des envois examinés pour « Play — fiche du Store » et « Play — abonnements » (CD-ALPHA-5, puis CD-ALPHA-7) :
 * `node scripts/play/review-gate-cli.mjs listing|subscriptions` (depuis app/, clone complet).
 * Variables : GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_RUN_ID, GITHUB_EVENT_NAME, GITHUB_OUTPUT (send=true|false),
 * GITHUB_STEP_SUMMARY. N'envoie que si le contenu (fiche ou abonnements) a changé depuis le dernier envoi réussi, au
 * passage du soir (juste avant l'alpha) ou à la main ; un merge attend le soir ; un changement du seul workflow
 * n'envoie rien. Erreur de lecture → on n'envoie pas
 * (l'envoi sera retenté au passage suivant), code 0.
 */
import { appendFileSync } from 'node:fs'
import { decideEvening, hasNewContent, REVIEWED_WORKFLOWS } from './reviewGate.mjs'
import { fetchReviewedSends, readFreezeUntil, filesSince } from './reviewIo.mjs'

const kind = process.argv[2]
const own = REVIEWED_WORKFLOWS[kind]
const { GITHUB_TOKEN: ghToken, GITHUB_REPOSITORY: repo, GITHUB_RUN_ID: runId, GITHUB_EVENT_NAME: event, GITHUB_OUTPUT: outFile, GITHUB_STEP_SUMMARY: summaryFile } = process.env

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
  const d = decideEvening({ event, freezeUntil: readFreezeUntil() })
  output(d.send, [
    '## Envoi examiné par Google',
    '',
    `- Dernier envoi de ${own.label} : ${mine.at ? mine.at.slice(0, 16).replace('T', ' ') : 'aucun'} ; contenu modifié depuis.`,
    `- Décision : **${d.send ? `envoi de ${own.label}` : `${own.label} : envoi reporté`}**${d.reason ? ` (${d.reason})` : ''}`,
  ])
} catch (err) {
  output(false, ['## Envoi examiné par Google', '', `- ⚠️ Lecture des envois impossible (${err.message}) : envoi reporté au passage suivant.`])
}

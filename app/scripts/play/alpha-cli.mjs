#!/usr/bin/env node
/**
 * CLI du workflow « Play — Alpha (livraison continue) » : `node scripts/play/alpha-cli.mjs` (depuis app/).
 * Variables : HEAD_SHA (commit de main), GITHUB_TOKEN, GITHUB_REPOSITORY, PLAY_ACCESS_TOKEN, ALPHA_AUTO ("false"
 * coupe l'envoi), PLAY_PACKAGE, GITHUB_STEP_SUMMARY. Décision : alphaGate.mjs. Code de sortie : 0 (envoyé, ou rien à
 * faire), 1 erreur d'envoi (l'erreur exacte est dans le résumé ; rien n'est contourné).
 */
import { execFileSync } from 'node:child_process'
import { appendFileSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { decideAlpha, commitCountOf, findCommitByCount, VERSION_OFFSET } from './alphaGate.mjs'
import { publishBundle, readTracks, formatTracks, buildReleaseNotes, isAccessDenied } from './publish.mjs'

const { HEAD_SHA: sha, GITHUB_TOKEN: ghToken, GITHUB_REPOSITORY: repo, PLAY_ACCESS_TOKEN: token, GITHUB_STEP_SUMMARY: summaryFile } = process.env
const packageName = process.env.PLAY_PACKAGE || 'fr.jpesquet.sante'
const enabled = process.env.ALPHA_AUTO !== 'false'
const summary = (lines) => {
  if (summaryFile) appendFileSync(summaryFile, `${lines.join('\n')}\n`)
  console.log(lines.join('\n'))
}
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()
const maxCode = (track) => {
  const codes = (track?.releases ?? []).flatMap((r) => r.versionCodes ?? []).map(Number).filter(Number.isFinite)
  return codes.length ? Math.max(...codes) : null
}

if (!sha || !ghToken || !repo || !token) {
  console.error('HEAD_SHA, GITHUB_TOKEN, GITHUB_REPOSITORY et PLAY_ACCESS_TOKEN sont requis.')
  process.exit(1)
}

const res = await fetch(`https://api.github.com/repos/${repo}/actions/runs?head_sha=${sha}&per_page=100`, {
  headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json' },
})
if (!res.ok) throw new Error(`Lecture des workflows du commit : HTTP ${res.status}`)
const runs = ((await res.json()).workflow_runs ?? []).map((r) => ({ name: r.name, event: r.event, status: r.status, conclusion: r.conclusion }))

const candidateVersionCode = VERSION_OFFSET + Number(git('rev-list', '--count', sha))
const tracks = await readTracks({ packageName, token })
const alphaVersionCode = maxCode(tracks.find((t) => t.track === 'alpha'))
const internalVersionCode = maxCode(tracks.find((t) => t.track === 'internal'))

let changedFiles = null
const n = commitCountOf(alphaVersionCode)
if (n) {
  const chain = git('rev-list', '--reverse', '--first-parent', sha).split('\n')
  const alphaSha = findCommitByCount(chain, (c) => Number(git('rev-list', '--count', c)), n)
  if (alphaSha) changedFiles = git('diff', '--name-only', alphaSha, sha).split('\n').filter(Boolean)
}

const decision = decideAlpha({ runs, candidateVersionCode, alphaVersionCode, internalVersionCode, changedFiles, enabled })
summary(['## Livraison continue vers l’alpha', '', `- Commit \`${sha.slice(0, 7)}\` · versionCode ${candidateVersionCode} · alpha : ${alphaVersionCode ?? 'vide'} · test interne : ${internalVersionCode ?? 'vide'}`, `- Décision : **${decision.send ? 'envoi' : decision.wait ? 'en attente' : 'pas d’envoi'}** (${decision.reason})`])
if (!decision.send) process.exit(0)

const dir = resolve(process.cwd(), 'src/data/changelog')
const entries = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => ({ id: f, ...JSON.parse(readFileSync(resolve(dir, f), 'utf8')) }))
try {
  const r = await publishBundle({ packageName, versionCode: candidateVersionCode, track: 'alpha', reuseOnly: true, notes: buildReleaseNotes(entries), token, log: console.log })
  summary([
    `- ✅ versionCode ${candidateVersionCode} placé sur l’alpha (même AAB que le test interne). Google l’examine (quelques heures à 2 jours) ; les testeurs le reçoivent ensuite.`,
    ...(r.testersAdded ? ['- Groupe des testeurs ajouté à la piste alpha.'] : []),
    ...(r.notSentForReview ? ['- ⚠️ Validée sans envoi automatique pour examen : un envoi manuel est attendu dans la Play Console.'] : []),
  ])
  summary(formatTracks(await readTracks({ packageName, token })))
} catch (err) {
  console.log(`::error title=Alpha : envoi impossible::${err.message}`)
  summary(['', `### ❌ Envoi sur l’alpha impossible${isAccessDenied(err) ? ' (accès refusé)' : ''}`, '', `- Erreur exacte : ${err.message}`, '- Rien n’est contourné : à noter en tête du résumé de la semaine.'])
  process.exit(1)
}

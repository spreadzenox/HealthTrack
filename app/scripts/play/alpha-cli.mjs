#!/usr/bin/env node
/**
 * CLI du workflow « Play — Alpha (livraison continue) » : `node scripts/play/alpha-cli.mjs` (depuis app/).
 * Envoi du soir (CD-ALPHA-6) : la plus récente version de main
 * dont « Build & Release » a réussi et qui est prête (decideNightly). Variables : HEAD_SHA (tête de main),
 * GITHUB_TOKEN, GITHUB_REPOSITORY, PLAY_ACCESS_TOKEN, ALPHA_AUTO ("false" coupe l'envoi), ALPHA_MIN_HOURS (écart
 * minimal entre deux envois, 0 par défaut depuis CD-ALPHA-6), PLAY_PACKAGE, GITHUB_STEP_SUMMARY. Décision : alphaGate.mjs. Code de sortie : 0 (envoyé, ou rien à
 * faire), 1 erreur d'envoi (l'erreur exacte est dans le résumé ; rien n'est contourné).
 */
import { execFileSync } from 'node:child_process'
import { appendFileSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { decideNightly, commitCountOf, findCommitByCount, VERSION_OFFSET, NIGHTLY_MIN_HOURS } from './alphaGate.mjs'
import { readFreezeUntil } from './reviewIo.mjs'
import { publishBundle, readTracks, formatTracks, buildReleaseNotes, isAccessDenied } from './publish.mjs'

const { HEAD_SHA: sha, GITHUB_TOKEN: ghToken, GITHUB_REPOSITORY: repo, PLAY_ACCESS_TOKEN: token, GITHUB_STEP_SUMMARY: summaryFile } = process.env
const packageName = process.env.PLAY_PACKAGE || 'fr.jpesquet.sante'
const enabled = process.env.ALPHA_AUTO !== 'false'
const minHoursEnv = Number(process.env.ALPHA_MIN_HOURS)
const minHours = process.env.ALPHA_MIN_HOURS && Number.isFinite(minHoursEnv) ? minHoursEnv : NIGHTLY_MIN_HOURS
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

const gh = async (path) => {
  const r = await fetch(`https://api.github.com/repos/${repo}/${path}`, { headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json' } })
  if (!r.ok) throw new Error(`GitHub ${path} : HTTP ${r.status}`)
  return r.json()
}

const tracks = await readTracks({ packageName, token })
const alphaVersionCode = maxCode(tracks.find((t) => t.track === 'alpha'))
const internalVersionCode = maxCode(tracks.find((t) => t.track === 'internal'))

const chain = git('rev-list', '--reverse', '--first-parent', sha).split('\n')
const shaOf = (versionCode) => {
  const n = commitCountOf(versionCode)
  return n ? findCommitByCount(chain, (c) => Number(git('rev-list', '--count', c)), n) : null
}
const filesSince = (from, to) => git('diff', '--name-only', from, to).split('\n').filter(Boolean)
const alphaSha = shaOf(alphaVersionCode)
const alphaSentAt = alphaSha ? git('show', '-s', '--format=%cI', alphaSha) : null
const internalSha = shaOf(internalVersionCode)
const freezeUntil = readFreezeUntil()

// Envoi du soir (CD-ALPHA-6) : commits de main dont « Build & Release » a réussi, du plus récent au plus ancien.
const releases = (await gh('actions/workflows/build-release.yml/runs?branch=main&event=push&status=success&per_page=15')).workflow_runs ?? []
const shas = [...new Set(releases.map((r) => r.head_sha))].filter((c) => {
  try { git('merge-base', '--is-ancestor', c, sha); return true } catch { return false }
})
const candidates = []
for (const c of shas) {
  const runs = ((await gh(`actions/runs?head_sha=${c}&per_page=100`)).workflow_runs ?? []).map((r) => ({ name: r.name, event: r.event, status: r.status, conclusion: r.conclusion }))
  candidates.push({
    sha: c,
    runs,
    candidateVersionCode: VERSION_OFFSET + Number(git('rev-list', '--count', c)),
    alphaVersionCode,
    internalVersionCode,
    changedFiles: alphaSha ? filesSince(alphaSha, c) : null,
    inherited: internalSha ? { versionCode: internalVersionCode, filesSince: filesSince(internalSha, c) } : null,
    enabled,
    alphaSentAt,
    minHours,
    freezeUntil,
  })
}
const decision = decideNightly(candidates)
const chosen = candidates.find((c) => c.sha === decision.sha)
const candidateVersionCode = chosen?.candidateVersionCode ?? null
const versionCode = decision.versionCode ?? candidateVersionCode
summary(['## Livraison continue vers l’alpha (envoi du soir, 23:45 heure de Paris)', '', `- Commit \`${(decision.sha ?? sha).slice(0, 7)}\` · versionCode ${candidateVersionCode ?? '—'} · alpha : ${alphaVersionCode ?? 'vide'} · test interne : ${internalVersionCode ?? 'vide'}`, ...decision.skipped.map((k) => `- Pas prêt : \`${k.sha.slice(0, 7)}\` (${k.reason})`),
  `- Décision : **${decision.send ? `envoi de ${versionCode}` : decision.wait ? 'en attente' : decision.frozen ? 'envois gelés' : decision.spaced ? 'envoi espacé' : 'pas d’envoi'}** (${decision.reason})`])
if (!decision.send) process.exit(0)

const dir = resolve(process.cwd(), 'src/data/changelog')
const entries = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => ({ id: f, ...JSON.parse(readFileSync(resolve(dir, f), 'utf8')) }))
try {
  const r = await publishBundle({ packageName, versionCode, track: 'alpha', reuseOnly: true, notes: buildReleaseNotes(entries), token, log: console.log })
  summary([
    `- ✅ versionCode ${versionCode} placé sur l’alpha (même AAB que le test interne). Google l’examine (quelques heures à 2 jours) ; les testeurs le reçoivent ensuite.`,
    ...(r.testersAdded ? ['- Groupe des testeurs ajouté à la piste alpha.'] : []),
    ...(r.notSentForReview ? ['- ⚠️ Validée sans envoi automatique pour examen : un envoi manuel est attendu dans la Play Console.'] : []),
  ])
  summary(formatTracks(await readTracks({ packageName, token })))
} catch (err) {
  console.log(`::error title=Alpha : envoi impossible::${err.message}`)
  summary(['', `### ❌ Envoi sur l’alpha impossible${isAccessDenied(err) ? ' (accès refusé)' : ''}`, '', `- Erreur exacte : ${err.message}`, '- Rien n’est contourné : à noter en tête du résumé de la semaine.'])
  process.exit(1)
}

/**
 * Lecture des envois examinés (CD-ALPHA-5) : exécutions des workflows « Play — fiche du Store » et « Play —
 * abonnements » (API GitHub Actions, étapes comprises) et date de la version de l'alpha (son commit sur main).
 * Décisions pures dans reviewGate.mjs et alphaGate.mjs.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { commitCountOf, findCommitByCount } from './alphaGate.mjs'
import { REVIEWED_WORKFLOWS, lastSent } from './reviewGate.mjs'

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()

/** Gel des envois (review-freeze.json) : date ISO ou null. */
export function readFreezeUntil(url = new URL('./review-freeze.json', import.meta.url)) {
  return JSON.parse(readFileSync(url, 'utf8')).until ?? null
}

/** Exécutions terminées sur main d'un workflow, avec leurs étapes (sans l'exécution `excludeId`). */
export async function fetchRuns({ repo, ghToken, file, excludeId = null, perPage = 15 }) {
  const headers = { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github+json' }
  const get = async (path) => {
    const res = await fetch(`https://api.github.com/repos/${repo}/${path}`, { headers })
    if (!res.ok) throw new Error(`GitHub ${path} : HTTP ${res.status}`)
    return res.json()
  }
  const { workflow_runs: runs = [] } = await get(`actions/workflows/${file}/runs?branch=main&status=completed&per_page=${perPage}`)
  const out = []
  for (const r of runs) {
    if (String(r.id) === String(excludeId)) continue
    const { jobs = [] } = await get(`actions/runs/${r.id}/jobs`)
    out.push({ head_sha: r.head_sha, event: r.event, conclusion: r.conclusion, created_at: r.created_at, updated_at: r.updated_at, steps: jobs.flatMap((j) => j.steps ?? []) })
  }
  return out
}

/** Derniers envois de la fiche et des abonnements : [{ kind, what, at, sha }]. */
export async function fetchReviewedSends({ repo, ghToken, excludeId = null }) {
  const out = []
  for (const [kind, w] of Object.entries(REVIEWED_WORKFLOWS)) {
    const runs = await fetchRuns({ repo, ghToken, file: w.file, excludeId })
    const last = lastSent(runs, w.step)
    out.push({ kind, what: w.label, at: last?.at ?? null, sha: last?.sha ?? null })
  }
  return out
}

/** Commit de main d'un versionCode play (null si hors historique). Nécessite un clone complet. */
export function shaOfVersion(versionCode, head = 'HEAD') {
  const n = commitCountOf(versionCode)
  if (!n) return null
  const chain = git('rev-list', '--reverse', '--first-parent', head).split('\n')
  return findCommitByCount(chain, (c) => Number(git('rev-list', '--count', c)), n)
}

/** Date (ISO) du commit d'un sha, null si inconnu. */
export const commitDate = (sha) => (sha ? git('show', '-s', '--format=%cI', sha) : null)

/** Fichiers modifiés entre `from` et HEAD (null si `from` est inconnu ou absent du clone). */
export function filesSince(from) {
  if (!from) return null
  try {
    return git('diff', '--name-only', from, 'HEAD').split('\n').filter(Boolean)
  } catch {
    return null
  }
}

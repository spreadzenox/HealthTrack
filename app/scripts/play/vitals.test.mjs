import { describe, it, expect, vi } from 'vitest'
import { readErrorIssues, formatErrorIssues, explainVitalsError, REPORTING_API } from './vitals.mjs'
import { PlayApiError } from './publish.mjs'

const PKG = 'fr.jpesquet.sante'
const SEARCH = `${REPORTING_API}/apps/${PKG}/errorIssues:search`

function fakeReporting(pages) {
  const calls = []
  const fetchImpl = vi.fn(async (url, init) => {
    calls.push({ url, init })
    const r = pages.shift() ?? { status: 404, body: { error: { message: 'plus de page' } } }
    const status = r.status ?? 200
    return { ok: status < 300, status, text: async () => JSON.stringify(r.body ?? {}) }
  })
  return { fetchImpl, calls }
}

const issue = (over = {}) => ({
  name: `apps/${PKG}/errorIssues/1`,
  type: 'CRASH',
  cause: 'java.lang.IllegalStateException',
  location: 'fr.jpesquet.sante.FaceUnlockService.onCreate',
  errorReportCount: '3',
  distinctUsers: '2',
  lastErrorReportTime: '2026-11-03T08:12:00Z',
  firstAppVersion: { versionCode: '100719' },
  lastAppVersion: { versionCode: '100721' },
  ...over,
})

describe('readErrorIssues', () => {
  it('lit toutes les pages des problèmes des 30 derniers jours, en lecture seule', async () => {
    const { fetchImpl, calls } = fakeReporting([
      { body: { errorIssues: [issue()], nextPageToken: 'P2' } },
      { body: { errorIssues: [issue({ name: 'x/2', type: 'ANR' })] } },
    ])
    const issues = await readErrorIssues({ packageName: PKG, token: 'tok', fetchImpl, sleep: async () => {} })
    expect(issues).toHaveLength(2)
    expect(calls[0].url).toBe(`${SEARCH}?pageSize=50`)
    expect(calls[1].url).toBe(`${SEARCH}?pageSize=50&pageToken=P2`)
    expect(calls.every((c) => c.init.method === 'GET')).toBe(true)
    expect(calls[0].init.headers.Authorization).toBe('Bearer tok')
  })

  it('rend une liste vide quand Google ne renvoie aucun problème', async () => {
    const { fetchImpl } = fakeReporting([{ body: {} }])
    expect(await readErrorIssues({ packageName: PKG, token: 't', fetchImpl, sleep: async () => {} })).toEqual([])
  })

  it('s’arrête à 5 pages au plus', async () => {
    const pages = Array.from({ length: 8 }, () => ({ body: { errorIssues: [issue()], nextPageToken: 'N' } }))
    const { fetchImpl, calls } = fakeReporting(pages)
    await readErrorIssues({ packageName: PKG, token: 't', fetchImpl, sleep: async () => {} })
    expect(calls).toHaveLength(5)
  })

  it('lève une PlayApiError sur un refus', async () => {
    const { fetchImpl } = fakeReporting([{ status: 403, body: { error: { message: 'Play Developer Reporting API has not been used in project 81378799481 before or it is disabled.' } } }])
    await expect(readErrorIssues({ packageName: PKG, token: 't', fetchImpl, sleep: async () => {} })).rejects.toBeInstanceOf(PlayApiError)
  })
})

describe('formatErrorIssues', () => {
  it('dit clairement quand rien n’est signalé', () => {
    const text = formatErrorIssues([], { versionCode: '100736' }).join('\n')
    expect(text).toMatch(/#### Plantages et ANR \(Android vitals, 30 derniers jours\)/)
    expect(text).toMatch(/Aucun plantage ni ANR signalé/)
  })

  it('trie par nombre de rapports, compte les types et signale ceux qui touchent la version envoyée', () => {
    const lines = formatErrorIssues(
      [
        issue({ type: 'ANR', errorReportCount: '1', distinctUsers: '1', lastAppVersion: { versionCode: '100600' }, cause: 'Input dispatching timed out', location: 'android.os.MessageQueue.nativePollOnce' }),
        issue({ errorReportCount: '12', distinctUsers: '4', lastAppVersion: { versionCode: '100736' } }),
        issue({ type: 'NON_FATAL', errorReportCount: '50' }),
      ],
      { versionCode: '100736' },
    )
    const text = lines.join('\n')
    expect(text).toMatch(/1 plantage, 1 ANR/)
    expect(text).toMatch(/⚠️ 1 touche la version 100736/)
    const rows = lines.filter((l) => l.startsWith('| Plantage') || l.startsWith('| ANR'))
    expect(rows[0]).toMatch(/\| Plantage \| java\.lang\.IllegalStateException \| `fr\.jpesquet\.sante\.FaceUnlockService\.onCreate` \| 100719 → 100736 \| 12 \| 4 \| 03\/11 09:12 \|/)
    expect(rows[1]).toMatch(/^\| ANR \|/)
    // les erreurs non fatales ne sont pas des plantages : pas de ligne
    expect(rows).toHaveLength(2)
  })

  it('ne recopie jamais un texte de plus de 120 caractères ni de barre verticale (tableau intact)', () => {
    const text = formatErrorIssues([issue({ cause: `a|b${'x'.repeat(300)}` })], {}).join('\n')
    expect(text).not.toMatch(/a\|b/)
    expect(text).not.toMatch(/x{121}/)
  })
})

describe('explainVitalsError', () => {
  it('API désactivée : geste exact du propriétaire', () => {
    const err = new PlayApiError('Lecture des plantages', 403, 'Google Play Developer Reporting API has not been used in project 81378799481 before or it is disabled. Enable it by visiting …')
    const text = explainVitalsError(err).join('\n')
    expect(text).toMatch(/gcloud services enable playdeveloperreporting\.googleapis\.com --project=healthtrack-824b26/)
  })

  it('droit manquant dans la Play Console', () => {
    const err = new PlayApiError('Lecture des plantages', 403, 'The caller does not have permission')
    expect(explainVitalsError(err).join('\n')).toMatch(/Afficher les informations de l’application/)
  })

  it('autre erreur : message recopié, rien de bloquant', () => {
    const text = explainVitalsError(new Error('réseau coupé')).join('\n')
    expect(text).toMatch(/réseau coupé/)
    expect(text).toMatch(/n’empêche pas l’envoi/)
  })
})

describe('explainVitalsError (jeton)', () => {
  it('401 : pas de geste Play Console trompeur', () => {
    const text = explainVitalsError(new PlayApiError('Lecture', 401, 'Request had invalid authentication credentials')).join('\n')
    expect(text).not.toMatch(/Utilisateurs et autorisations/)
    expect(text).toMatch(/invalid authentication/)
  })
})

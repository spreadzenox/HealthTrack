import { describe, it, expect, vi } from 'vitest'
import { publishBundle, buildReleaseNotes, isAccessDenied, isMissingDeclaration, withRetry, PlayApiError, API, UPLOAD_API } from './publish.mjs'

const PKG = 'fr.jpesquet.sante'
const EDITS = `${API}/${PKG}/edits`

/** Faux serveur Android Publisher : `routes` associe « MÉTHODE url » à une réponse (ou une fonction). */
function fakePlay(routes) {
  const calls = []
  const fetchImpl = vi.fn(async (url, init) => {
    const key = `${init.method} ${url}`
    calls.push({ key, init })
    let r = routes[key]
    if (typeof r === 'function') r = r(init)
    if (Array.isArray(r)) r = r.shift()
    if (!r) r = { status: 404, body: { error: { message: `route inconnue ${key}` } } }
    const status = r.status ?? 200
    return { ok: status < 300, status, text: async () => JSON.stringify(r.body ?? {}) }
  })
  return { fetchImpl, calls }
}

const happy = () => ({
  [`POST ${EDITS}`]: { body: { id: 'E1' } },
  [`GET ${EDITS}/E1/details`]: { body: { defaultLanguage: 'fr-FR' } },
  [`POST ${UPLOAD_API}/${PKG}/edits/E1/bundles?uploadType=media`]: { body: { versionCode: 350, sha256: 'ab' } },
  [`PUT ${EDITS}/E1/tracks/internal`]: { body: {} },
  [`POST ${EDITS}/E1:commit`]: { body: { id: 'E1' } },
  [`DELETE ${EDITS}/E1`]: { body: {} },
})

const args = (fetchImpl, extra = {}) => ({ packageName: PKG, aab: new Uint8Array([1, 2, 3]), versionCode: 350, notes: '• Nouveau', token: 'tok', fetchImpl, sleep: async () => {}, ...extra })

describe('envoi Google Play (jalon 3c)', () => {
  it('ouvre un edit, importe l’AAB, crée la version de test interne avec ses notes, puis valide', async () => {
    const { fetchImpl, calls } = fakePlay(happy())
    const r = await publishBundle(args(fetchImpl))
    expect(r).toEqual({ outcome: 'published', versionCode: 350, track: 'internal', status: 'completed', language: 'fr-FR', notSentForReview: false })
    expect(calls.map((c) => c.key.split(' ')[0])).toEqual(['POST', 'GET', 'POST', 'GET', 'PUT', 'POST'])
    const upload = calls[2].init
    expect(upload.headers).toEqual({ Authorization: 'Bearer tok', 'Content-Type': 'application/octet-stream' })
    expect(upload.body).toEqual(new Uint8Array([1, 2, 3]))
    expect(JSON.parse(calls[4].init.body)).toEqual({
      track: 'internal',
      releases: [{ name: '350', versionCodes: ['350'], status: 'completed', releaseNotes: [{ language: 'fr-FR', text: '• Nouveau' }] }],
    })
  })

  it('refuse toute piste autre que les pistes de test (jamais la production)', async () => {
    const { fetchImpl } = fakePlay(happy())
    await expect(publishBundle(args(fetchImpl, { track: 'production' }))).rejects.toThrow(/refusée/)
    await expect(publishBundle(args(fetchImpl, { track: 'beta' }))).rejects.toThrow(/refusée/)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('app encore brouillon côté Play : recrée la version en brouillon', async () => {
    const routes = happy()
    routes[`PUT ${EDITS}/E1/tracks/internal`] = [
      { status: 400, body: { error: { message: 'Only releases with status draft may be created on draft app.' } } },
      { body: {} },
    ]
    const { fetchImpl, calls } = fakePlay(routes)
    const r = await publishBundle(args(fetchImpl))
    expect(r.status).toBe('draft')
    expect(JSON.parse(calls[5].init.body).releases[0].status).toBe('draft')
  })

  it('validation qui exige changesNotSentForReview : relance avec le paramètre', async () => {
    const routes = happy()
    routes[`POST ${EDITS}/E1:commit`] = {
      status: 400,
      body: { error: { message: 'Changes cannot be sent for review automatically. Please set the query parameter changesNotSentForReview to true.' } },
    }
    routes[`POST ${EDITS}/E1:commit?changesNotSentForReview=true`] = { body: {} }
    const { fetchImpl } = fakePlay(routes)
    expect((await publishBundle(args(fetchImpl))).notSentForReview).toBe(true)
  })

  it('versionCode déjà envoyé (relance d’un run) : abandonne l’edit sans erreur', async () => {
    const routes = happy()
    routes[`POST ${UPLOAD_API}/${PKG}/edits/E1/bundles?uploadType=media`] = {
      status: 403,
      body: { error: { message: 'APK specifies a version code that has already been used.' } },
    }
    const { fetchImpl, calls } = fakePlay(routes)
    expect((await publishBundle(args(fetchImpl))).outcome).toBe('already-uploaded')
    expect(calls.at(-1).key).toBe(`DELETE ${EDITS}/E1`)
  })

  const alphaRoutes = (testers = { googleGroups: ['halcya-testeurs@googlegroups.com'] }) => {
    const routes = happy()
    delete routes[`PUT ${EDITS}/E1/tracks/internal`]
    routes[`PUT ${EDITS}/E1/tracks/alpha`] = { body: {} }
    routes[`GET ${EDITS}/E1/testers/alpha`] = { body: testers }
    routes[`PUT ${EDITS}/E1/testers/alpha`] = { body: {} }
    return routes
  }

  it('alpha, versionCode déjà envoyé en test interne : la même version est placée sur la piste alpha', async () => {
    const routes = alphaRoutes()
    routes[`POST ${UPLOAD_API}/${PKG}/edits/E1/bundles?uploadType=media`] = {
      status: 403,
      body: { error: { message: 'APK specifies a version code that has already been used.' } },
    }
    const { fetchImpl, calls } = fakePlay(routes)
    const r = await publishBundle(args(fetchImpl, { track: 'alpha' }))
    expect(r).toMatchObject({ outcome: 'published', track: 'alpha', status: 'completed', reusedBundle: true, testersAdded: false })
    const put = calls.find((c) => c.key === `PUT ${EDITS}/E1/tracks/alpha`)
    expect(JSON.parse(put.init.body).releases[0].versionCodes).toEqual(['350'])
    expect(calls.at(-1).key).toBe(`POST ${EDITS}/E1:commit`)
  })

  it('alpha : ajoute le groupe des testeurs s’il manque, sans retirer les autres', async () => {
    const { fetchImpl, calls } = fakePlay(alphaRoutes({ googleGroups: ['autre@googlegroups.com'] }))
    const r = await publishBundle(args(fetchImpl, { track: 'alpha' }))
    expect(r.testersAdded).toBe(true)
    const put = calls.find((c) => c.key === `PUT ${EDITS}/E1/testers/alpha`)
    expect(JSON.parse(put.init.body)).toEqual({ googleGroups: ['autre@googlegroups.com', 'halcya-testeurs@googlegroups.com'] })
  })

  it('alpha : groupe déjà présent, la liste des testeurs n’est pas réécrite', async () => {
    const { fetchImpl, calls } = fakePlay(alphaRoutes())
    expect((await publishBundle(args(fetchImpl, { track: 'alpha' }))).testersAdded).toBe(false)
    expect(calls.some((c) => c.key === `PUT ${EDITS}/E1/testers/alpha`)).toBe(false)
  })

  it('test interne : la liste des testeurs n’est jamais touchée', async () => {
    const { fetchImpl, calls } = fakePlay(happy())
    await publishBundle(args(fetchImpl))
    expect(calls.some((c) => c.key.includes('/testers/'))).toBe(false)
  })

  const live = { name: '410', versionCodes: ['410'], status: 'completed', releaseNotes: [{ language: 'fr-FR', text: '• Avant' }] }
  const p28 = { name: 'p28-100410', versionCodes: ['100410'], status: 'draft' }
  const putBody = (calls, i = 0) => JSON.parse(calls.filter((c) => c.key === `PUT ${EDITS}/E1/tracks/internal`)[i].init.body)

  it('P28 : brouillon jamais déployé, nommé à part, la version en test interne reste en place', async () => {
    const routes = happy()
    routes[`GET ${EDITS}/E1/tracks/internal`] = { body: { track: 'internal', releases: [live, { name: 'vieux', versionCodes: ['3'], status: 'draft' }] } }
    const { fetchImpl, calls } = fakePlay(routes)
    const r = await publishBundle(args(fetchImpl, { versionCode: 100411, draft: true, releaseName: 'p28-100411', notes: '• Technique' }))
    expect(r).toMatchObject({ outcome: 'published', status: 'draft', track: 'internal' })
    expect(r.keptDrafts).toBeUndefined()
    expect(putBody(calls).releases).toEqual([
      live,
      { name: 'p28-100411', versionCodes: ['100411'], status: 'draft', releaseNotes: [{ language: 'fr-FR', text: '• Technique' }] },
    ])
  })

  it('version normale : le brouillon P28 déjà sur la piste est gardé, les autres brouillons remplacés', async () => {
    const routes = happy()
    routes[`GET ${EDITS}/E1/tracks/internal`] = { body: { releases: [live, p28, { name: 'vieux', versionCodes: ['3'], status: 'draft' }] } }
    const { fetchImpl, calls } = fakePlay(routes)
    const r = await publishBundle(args(fetchImpl))
    expect(r).toMatchObject({ status: 'completed', keptDrafts: ['p28-100410'], draftDropped: false })
    expect(putBody(calls).releases.map((x) => x.name)).toEqual(['350', 'p28-100410'])
  })

  it('Play refuse de garder le brouillon P28 : la version normale passe seule, sans échec', async () => {
    const routes = happy()
    routes[`GET ${EDITS}/E1/tracks/internal`] = { body: { releases: [live, p28] } }
    routes[`PUT ${EDITS}/E1/tracks/internal`] = [{ status: 400, body: { error: { message: 'Too many releases' } } }, { body: {} }]
    const { fetchImpl, calls } = fakePlay(routes)
    const r = await publishBundle(args(fetchImpl))
    expect(r).toMatchObject({ status: 'completed', keptDrafts: ['p28-100410'], draftDropped: true })
    expect(putBody(calls, 1).releases.map((x) => x.name)).toEqual(['350'])
  })

  it('P28 : un refus de Play remonte tel quel (erreur exacte à noter)', async () => {
    const routes = happy()
    routes[`PUT ${EDITS}/E1/tracks/internal`] = { status: 403, body: { error: { message: 'You must complete the foreground service declaration' } } }
    const { fetchImpl, calls } = fakePlay(routes)
    const err = await publishBundle(args(fetchImpl, { draft: true, releaseName: 'p28-1' })).catch((e) => e)
    expect(err.message).toMatch(/Piste internal \(brouillon\) : HTTP 403 — You must complete the foreground service declaration/)
    expect(calls.at(-1).key).toBe(`DELETE ${EDITS}/E1`)
  })

  it('accès refusé : erreur reconnaissable, rien n’est laissé ouvert', async () => {
    const { fetchImpl } = fakePlay({ [`POST ${EDITS}`]: { status: 403, body: { error: { message: 'The caller does not have permission' } } } })
    const err = await publishBundle(args(fetchImpl)).catch((e) => e)
    expect(err).toBeInstanceOf(PlayApiError)
    expect(isAccessDenied(err)).toBe(true)
    expect(err.message).toMatch(/HTTP 403 — The caller does not have permission/)
  })

  it('erreur au milieu : l’edit est abandonné et l’erreur remonte', async () => {
    const routes = happy()
    routes[`PUT ${EDITS}/E1/tracks/internal`] = { status: 500, body: { error: { message: 'boom' } } }
    const { fetchImpl, calls } = fakePlay(routes)
    const err = await publishBundle(args(fetchImpl)).catch((e) => e)
    expect(isAccessDenied(err)).toBe(false)
    expect(err.message).toMatch(/Piste internal : HTTP 500 — boom/)
    expect(calls.at(-1).key).toBe(`DELETE ${EDITS}/E1`)
  })
})

describe('notes de version', () => {
  const e = (id, title) => ({ id, title })

  it('titres des Nouveautés, du plus récent au plus ancien', () => {
    expect(buildReleaseNotes([e('2026-10-20-a.json', 'Ancien'), e('2026-10-21-b.json', 'Récent')])).toBe('• Récent\n• Ancien')
  })

  it('jamais plus de 500 caractères, sans couper une ligne', () => {
    const many = Array.from({ length: 40 }, (_, i) => e(`2026-10-${String(i).padStart(2, '0')}.json`, `Titre numéro ${i} assez long pour remplir`))
    const notes = buildReleaseNotes(many)
    expect(notes.length).toBeLessThanOrEqual(500)
    expect(notes.split('\n').every((l) => /^• Titre numéro \d+ assez long pour remplir$/.test(l))).toBe(true)
  })
})

describe('réessais sur les pannes passagères de Play (5xx, 429)', () => {
  const res = (status) => ({ ok: status < 300, status, text: async () => '{}' })
  const noWait = vi.fn(async () => {})

  it('réessaie un 503 puis réussit, sans réessayer ce qui a réussi', async () => {
    const f = vi.fn().mockResolvedValueOnce(res(503)).mockResolvedValueOnce(res(200))
    const r = await withRetry(f, { delays: [1, 2, 3], sleep: noWait })('u', {})
    expect(r.status).toBe(200)
    expect(f).toHaveBeenCalledTimes(2)
  })

  it('abandonne après le dernier délai et rend la dernière réponse', async () => {
    const f = vi.fn().mockResolvedValue(res(500))
    const r = await withRetry(f, { delays: [1, 2], sleep: noWait })('u', {})
    expect(r.status).toBe(500)
    expect(f).toHaveBeenCalledTimes(3)
  })

  it('ne réessaie pas les refus (4xx hors 429)', async () => {
    const f = vi.fn().mockResolvedValue(res(403))
    await withRetry(f, { delays: [1], sleep: noWait })('u', {})
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('l’envoi survit à un 503 passager sur la lecture de la fiche', async () => {
    const routes = happy()
    routes[`GET ${EDITS}/E1/details`] = [{ status: 503, body: { error: { message: 'The service is currently unavailable.' } } }, { body: { defaultLanguage: 'fr-FR' } }]
    const { fetchImpl } = fakePlay(routes)
    const r = await publishBundle(args(fetchImpl, { sleep: noWait }))
    expect(r.outcome).toBe('published')
  })
})

describe('lecture au déverrouillage en test interne (P28, 27/10)', () => {
  it('test interne au seul propriétaire : lit les groupes testeurs puis envoie en completed', async () => {
    const routes = happy()
    routes[`GET ${EDITS}/E1/testers/internal`] = { body: {} }
    const { fetchImpl, calls } = fakePlay(routes)
    const r = await publishBundle(args(fetchImpl, { privateTrack: true }))
    expect(r).toMatchObject({ outcome: 'published', status: 'completed', internalGroups: [] })
    expect(calls.some((c) => c.key === `PUT ${EDITS}/E1/tracks/internal`)).toBe(true)
  })

  it('refuse si le groupe du test fermé est testeur interne, sans rien valider', async () => {
    const routes = happy()
    routes[`GET ${EDITS}/E1/testers/internal`] = { body: { googleGroups: ['halcya-testeurs@googlegroups.com'] } }
    const { fetchImpl, calls } = fakePlay(routes)
    await expect(publishBundle(args(fetchImpl, { privateTrack: true }))).rejects.toThrow(/seul propriétaire/)
    expect(calls.some((c) => c.key.startsWith('PUT'))).toBe(false)
    expect(calls.some((c) => c.key === `POST ${EDITS}/E1:commit`)).toBe(false)
    expect(calls.at(-1).key).toBe(`DELETE ${EDITS}/E1`)
  })

  it('testeurs illisibles (400) : envoi poursuivi, groupes inconnus', async () => {
    const routes = happy()
    routes[`GET ${EDITS}/E1/testers/internal`] = { status: 400, body: { error: { message: 'Testers not supported' } } }
    const { fetchImpl } = fakePlay(routes)
    expect(await publishBundle(args(fetchImpl, { privateTrack: true }))).toMatchObject({ status: 'completed', internalGroups: null })
  })

  it('alpha : refuse de promouvoir un versionCode déjà envoyé en test interne (interrupteur allumé)', async () => {
    const routes = happy()
    routes[`POST ${UPLOAD_API}/${PKG}/edits/E1/bundles?uploadType=media`] = { status: 400, body: { error: { message: 'APK specifies a version code that has already been used.' } } }
    const { fetchImpl, calls } = fakePlay(routes)
    await expect(publishBundle(args(fetchImpl, { track: 'alpha', noReuse: true }))).rejects.toThrow(/journal/)
    expect(calls.some((c) => c.key.startsWith('PUT'))).toBe(false)
  })
})

describe('déclaration manquante (P28, 27/10)', () => {
  it('le 403 « You must let us know … Foreground Service » n’est pas un accès refusé', () => {
    const err = new PlayApiError('Validation de l’edit', 403, 'You must let us know whether your app uses any Foreground Service permissions.')
    expect(isMissingDeclaration(err)).toBe(true)
    expect(isAccessDenied(err)).toBe(false)
    expect(isAccessDenied(new PlayApiError('Ouverture de l’edit', 403, 'The caller does not have permission'))).toBe(true)
  })
})

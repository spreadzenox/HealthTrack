import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { publishListing, readListing, validateListing, pngSize, sha256, isMissingContactEmail, LIMITS } from './listing.mjs'
import { API, UPLOAD_API, PlayApiError, isAccessDenied } from './publish.mjs'
import { FORBIDDEN_WORDING } from '../../src/data/wordingRules.js'
import { APP_NAME } from '../../src/config/brand.js'

const PKG = 'fr.jpesquet.sante'
const EDITS = `${API}/${PKG}/edits`
const L = `${EDITS}/E1/listings/fr-FR`
const UP = `${UPLOAD_API}/${PKG}/edits/E1/listings/fr-FR`
const STORE = resolve(import.meta.dirname, '../../store')

function fakePlay(routes) {
  const calls = []
  const fetchImpl = vi.fn(async (url, init) => {
    const key = `${init.method} ${url}`
    calls.push({ key, init })
    let r = routes[key]
    if (Array.isArray(r)) r = r.shift()
    if (!r) r = { status: 404, body: { error: { message: `route inconnue ${key}` } } }
    const status = r.status ?? 200
    return { ok: status < 300, status, text: async () => JSON.stringify(r.body ?? {}) }
  })
  return { fetchImpl, calls }
}

const bytes = (...b) => new Uint8Array(b)
const listing = { language: 'fr-FR', title: 'Halcya', shortDescription: 'Court', fullDescription: 'Long' }
const images = { icon: [bytes(1)], featureGraphic: [bytes(2)], phoneScreenshots: [bytes(3), bytes(4)] }

const happy = (remote = {}) => ({
  [`POST ${EDITS}`]: { body: { id: 'E1' } },
  [`GET ${EDITS}/E1/details`]: { body: { defaultLanguage: 'fr-FR', contactEmail: 'x@example.org' } },
  [`PUT ${L}`]: { body: {} },
  [`GET ${L}/icon`]: { body: { images: remote.icon ?? [] } },
  [`GET ${L}/featureGraphic`]: { body: { images: remote.featureGraphic ?? [] } },
  [`GET ${L}/phoneScreenshots`]: { body: { images: remote.phoneScreenshots ?? [] } },
  [`DELETE ${L}/icon`]: { body: {} },
  [`DELETE ${L}/featureGraphic`]: { body: {} },
  [`DELETE ${L}/phoneScreenshots`]: { body: {} },
  [`POST ${UP}/icon?uploadType=media`]: { body: {} },
  [`POST ${UP}/featureGraphic?uploadType=media`]: { body: {} },
  [`POST ${UP}/phoneScreenshots?uploadType=media`]: { body: {} },
  [`PATCH ${EDITS}/E1/details`]: { body: {} },
  [`POST ${EDITS}/E1:commit`]: { body: { id: 'E1' } },
  [`DELETE ${EDITS}/E1`]: { body: {} },
})

const args = (fetchImpl, extra = {}) => ({ packageName: PKG, listing, images, website: 'https://site.example/', token: 'tok', fetchImpl, sleep: async () => {}, ...extra })

describe('fiche du Store par l’API (jalon 10)', () => {
  it('envoie textes, images et site web dans un edit, puis valide', async () => {
    const { fetchImpl, calls } = fakePlay(happy())
    const r = await publishListing(args(fetchImpl))
    expect(r).toEqual({ language: 'fr-FR', defaultLanguage: 'fr-FR', images: { icon: 1, featureGraphic: 1, phoneScreenshots: 2 }, website: 'mis à jour', notSentForReview: false })
    expect(JSON.parse(calls.find((c) => c.key === `PUT ${L}`).init.body)).toEqual({ language: 'fr-FR', ...{ title: 'Halcya', shortDescription: 'Court', fullDescription: 'Long' } })
    const shots = calls.filter((c) => c.key === `POST ${UP}/phoneScreenshots?uploadType=media`)
    expect(shots.map((c) => [...c.init.body])).toEqual([[3], [4]])
    expect(shots[0].init.headers['Content-Type']).toBe('image/png')
    expect(JSON.parse(calls.find((c) => c.key === `PATCH ${EDITS}/E1/details`).init.body)).toEqual({ defaultLanguage: 'fr-FR', contactEmail: 'x@example.org', contactWebsite: 'https://site.example/' })
    expect(calls.at(-1).key).toBe(`POST ${EDITS}/E1:commit`)
    // Aucune piste ni version touchée
    expect(calls.some((c) => /tracks|bundles/.test(c.key))).toBe(false)
  })

  it('ne réenvoie pas des images identiques (empreintes SHA-256), remplace celles qui ont changé', async () => {
    const remote = {
      icon: [{ sha256: sha256(bytes(1)) }],
      featureGraphic: [{ sha256: sha256(bytes(9)) }],
      phoneScreenshots: [{ sha256: sha256(bytes(3)) }, { sha256: sha256(bytes(4)) }],
    }
    const { fetchImpl, calls } = fakePlay(happy(remote))
    const r = await publishListing(args(fetchImpl))
    expect(r.images).toEqual({ icon: 'inchangées', featureGraphic: 1, phoneScreenshots: 'inchangées' })
    expect(calls.filter((c) => c.key.startsWith('DELETE')).map((c) => c.key)).toEqual([`DELETE ${L}/featureGraphic`])
  })

  it('site web déjà à jour : pas de PATCH ; refusé par Play : signalé sans faire échouer la fiche', async () => {
    const routes = happy()
    routes[`GET ${EDITS}/E1/details`] = { body: { defaultLanguage: 'fr-FR', contactWebsite: 'https://site.example/' } }
    let { fetchImpl, calls } = fakePlay(routes)
    expect((await publishListing(args(fetchImpl))).website).toBe('inchangé')
    expect(calls.some((c) => c.key.startsWith('PATCH'))).toBe(false)

    const refused = happy()
    refused[`PATCH ${EDITS}/E1/details`] = { status: 400, body: { error: { message: 'Contact email is required.' } } }
    ;({ fetchImpl } = fakePlay(refused))
    expect((await publishListing(args(fetchImpl))).website).toBe('refusé par Play : Contact email is required.')
  })

  it('validation qui demande changesNotSentForReview : revalide avec ce paramètre', async () => {
    const routes = happy()
    routes[`POST ${EDITS}/E1:commit`] = { status: 400, body: { error: { message: 'Please set the query parameter changesNotSentForReview to true.' } } }
    routes[`POST ${EDITS}/E1:commit?changesNotSentForReview=true`] = { body: {} }
    const { fetchImpl } = fakePlay(routes)
    expect((await publishListing(args(fetchImpl))).notSentForReview).toBe(true)
  })

  it('accès refusé : abandonne l’edit et lève une erreur reconnue comme telle', async () => {
    const routes = happy()
    routes[`PUT ${L}`] = { status: 403, body: { error: { message: 'The caller does not have permission' } } }
    const { fetchImpl, calls } = fakePlay(routes)
    const err = await publishListing(args(fetchImpl)).catch((e) => e)
    expect(err).toBeInstanceOf(PlayApiError)
    expect(isAccessDenied(err)).toBe(true)
    expect(calls.at(-1).key).toBe(`DELETE ${EDITS}/E1`)
  })
})

it('e-mail de contact absent (réponse réelle de Play le 22/10) : reconnu, edit abandonné', async () => {
  const routes = happy()
  routes[`POST ${EDITS}/E1:commit`] = { status: 403, body: { error: { message: 'This app does not have a contact email address set.' } } }
  const { fetchImpl, calls } = fakePlay(routes)
  const err = await publishListing(args(fetchImpl)).catch((e) => e)
  expect(isMissingContactEmail(err)).toBe(true)
  expect(isMissingContactEmail(new PlayApiError('x', 403, 'The caller does not have permission'))).toBe(false)
  expect(calls.at(-1).key).toBe(`DELETE ${EDITS}/E1`)
})

describe('validation de la fiche', () => {
  const png = (w, h) => {
    const b = new Uint8Array(24)
    b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    const dv = new DataView(b.buffer)
    dv.setUint32(16, w)
    dv.setUint32(20, h)
    return b
  }
  const files = { icon: png(512, 512), fg: png(1024, 500), s1: png(1080, 1920), s2: png(412, 915), bad: bytes(1, 2) }
  const ok = { ...listing, images: { icon: ['icon'], featureGraphic: ['fg'], phoneScreenshots: ['s1', 's1'] } }

  it('lit la taille d’un PNG', () => {
    expect(pngSize(files.s1)).toEqual({ width: 1080, height: 1920 })
    expect(pngSize(files.bad)).toBeNull()
  })

  it('accepte une fiche conforme, refuse textes trop longs, mauvaises tailles et captures au ratio > 2', () => {
    expect(validateListing(ok, (p) => files[p])).toEqual([])
    const errors = validateListing(
      { ...ok, title: 'x'.repeat(31), images: { icon: ['fg'], featureGraphic: ['bad'], phoneScreenshots: ['s2'] } },
      (p) => files[p],
    )
    expect(errors).toEqual([
      'title : 31 caractères (maximum 30)',
      'fg : 1024×500, attendu 512×512',
      "bad n'est pas un PNG",
      '1 captures de téléphone (entre 2 et 8)',
      's2 : 412×915, attendu côtés de 320 à 3840 px, le plus long au plus 2 fois le plus court',
    ])
  })
})

describe('fiche française du dépôt (app/store/listing/fr-FR)', () => {
  const fr = readListing(STORE, 'fr-FR')
  const all = [fr.title, fr.shortDescription, fr.fullDescription].join('\n')

  it('respecte les limites de Play et a ses images aux bonnes tailles', () => {
    expect(validateListing(fr)).toEqual([])
    expect(fr.images.phoneScreenshots.length).toBeGreaterThanOrEqual(4)
    expect(fr.images.phoneScreenshots.every((p) => pngSize(readFileSync(p)).width === 1080)).toBe(true)
    expect([...fr.title].length).toBeLessThanOrEqual(LIMITS.title)
  })

  it('porte le nom de l’app et le titre décidé par le propriétaire', () => {
    expect(fr.title).toBe(`${APP_NAME} — ventre et bien-être`)
  })

  it('respecte le vocabulaire (ni « humeur », ni « 100 % privé », ni affirmation médicale)', () => {
    for (const { re, why } of FORBIDDEN_WORDING) expect(re.test(all), why).toBe(false)
  })

  it('dit ce que l’app n’est pas, que l’IA est facultative, et l’âge minimum (politique Play santé)', () => {
    expect(fr.fullDescription).toMatch(/pas un dispositif médical/)
    expect(fr.fullDescription).toMatch(/estimation, pas un diagnostic/)
    expect(fr.fullDescription).toMatch(/facultative/)
    expect(fr.fullDescription).toMatch(/18 ans et plus/)
    expect(fr.fullDescription).toMatch(/Compatible avec les montres Huawei/)
  })

  it('reste fidèle à l’app : sauvegarde Android gardée, onglet « Analyses » (LISTING-1)', () => {
    expect(fr.fullDescription).not.toMatch(/tout s['’]efface en désinstallant/i)
    expect(fr.fullDescription).toMatch(/sauvegarde Google du téléphone/)
    expect(fr.fullDescription).not.toMatch(/^• Pistes :/m)
    expect(fr.fullDescription).toMatch(/^• Analyses :/m)
  })

  it('parle des mots que cherchent les personnes concernées, sans liste de mots-clés (LISTING-1)', () => {
    expect(fr.fullDescription).toMatch(/côlon irritable \(SII\)/)
    expect(fr.fullDescription).toMatch(/journal alimentaire/)
    expect(fr.fullDescription).toMatch(/FODMAP/)
    // Google Play refuse les listes de mots-clés : aucune ligne faite seulement de mots séparés par des virgules.
    expect(fr.fullDescription.split('\n').some((l) => /^([\wÀ-ÿ' -]+,\s*){4,}[\wÀ-ÿ' -]+$/.test(l.trim()))).toBe(false)
  })

  it('n’emploie pas d’arguments interdits par Google Play (classements, superlatifs, appels aux avis)', () => {
    expect(all).not.toMatch(/n°\s*1|#1|meilleure? app|gratuit pour toujours|téléchargez maintenant|5 étoiles|top \d/i)
  })
})

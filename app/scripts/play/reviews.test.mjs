import { describe, it, expect, vi } from 'vitest'
import { readReviews, summarizeReviews, formatReviewSummary, explainReviewsError } from './reviews.mjs'
import { PlayApiError, API } from './publish.mjs'

const PKG = 'fr.jpesquet.sante'

function fakePlay(pages) {
  const calls = []
  const fetchImpl = vi.fn(async (url, init) => {
    calls.push({ url, init })
    const r = pages.shift() ?? { status: 404, body: { error: { message: 'plus de page' } } }
    const status = r.status ?? 200
    return { ok: status < 300, status, text: async () => JSON.stringify(r.body ?? {}) }
  })
  return { fetchImpl, calls }
}

// Avis synthétiques (aucune donnée réelle) : nom et texte inventés, pour vérifier qu'ils ne sortent jamais.
const review = ({ star = 5, text = '', version = 100809, api = 34, replied = false, seconds = 1793000000, author = 'Camille Testeur' } = {}) => ({
  reviewId: `gp:AOqpTO${star}${version}`,
  authorName: author,
  comments: [
    { userComment: { text, starRating: star, appVersionCode: version, androidOsVersion: api, device: 'a56x', lastModified: { seconds: String(seconds) } } },
    ...(replied ? [{ developerComment: { text: 'Merci', lastModified: { seconds: String(seconds + 60) } } }] : []),
  ],
})

describe('readReviews', () => {
  it('lit toutes les pages des avis, en lecture seule (GET)', async () => {
    const { fetchImpl, calls } = fakePlay([
      { body: { reviews: [review()], tokenPagination: { nextPageToken: 'P2' } } },
      { body: { reviews: [review({ star: 2 })] } },
    ])
    const reviews = await readReviews({ packageName: PKG, token: 'tok', fetchImpl, sleep: async () => {} })
    expect(reviews).toHaveLength(2)
    expect(calls[0].url).toBe(`${API}/${PKG}/reviews?maxResults=100`)
    expect(calls[1].url).toBe(`${API}/${PKG}/reviews?maxResults=100&token=P2`)
    expect(calls.every((c) => c.init.method === 'GET')).toBe(true)
  })

  it('rend une erreur Play exploitable sur un refus', async () => {
    const { fetchImpl } = fakePlay([{ status: 403, body: { error: { message: 'The caller does not have permission' } } }])
    await expect(readReviews({ packageName: PKG, token: 'tok', fetchImpl, sleep: async () => {} })).rejects.toBeInstanceOf(PlayApiError)
  })

  it('aucune réponse : liste vide', async () => {
    const { fetchImpl } = fakePlay([{ body: {} }])
    expect(await readReviews({ packageName: PKG, token: 'tok', fetchImpl, sleep: async () => {} })).toEqual([])
  })
})

describe('summarizeReviews', () => {
  const reviews = [
    review({ star: 5, text: 'Super appli, merci !', replied: true }),
    review({ star: 2, text: "L'app plante quand je prends une photo du repas", version: 100800, api: 30 }),
    review({ star: 3, text: '' }),
    review({ star: 1, text: 'Ma montre Huawei ne remonte pas le sommeil', seconds: 1793100000 }),
  ]

  it('compte étoiles, moyenne, versions, Android et réponses', () => {
    const s = summarizeReviews(reviews)
    expect(s.total).toBe(4)
    expect(s.stars).toEqual({ 1: 1, 2: 1, 3: 1, 4: 0, 5: 1 })
    expect(s.average).toBe(2.8)
    expect(s.answered).toBe(1)
    expect(s.lowUnanswered).toBe(3)
    expect(s.byVersion).toEqual({ 100809: 3, 100800: 1 })
    expect(s.byAndroid).toEqual({ 'API 34': 3, 'API 30': 1 })
    expect(s.latest).toBe(new Date(1793100000 * 1000).toISOString())
  })

  it('repère les thèmes avec les mots-clés de « Votre avis »', () => {
    const s = summarizeReviews(reviews)
    expect(s.withText).toBe(3)
    expect(s.themes.merci).toBe(1)
    expect(s.themes.plantage).toBe(1)
    expect(s.themes.repas).toBe(1)
    expect(s.themes.sources).toBe(1)
  })

  it('ignore un avis sans commentaire utilisateur', () => {
    expect(summarizeReviews([{ reviewId: 'x', comments: [] }]).total).toBe(0)
  })

  it('le bilan publié ne contient ni texte, ni nom, ni identifiant, ni appareil', () => {
    const out = formatReviewSummary(summarizeReviews(reviews)).join('\n')
    for (const secret of ['Camille', 'Super appli', 'plante quand', 'Huawei ne remonte', 'gp:AOqp', 'a56x', 'Merci']) {
      expect(out).not.toContain(secret)
    }
    expect(out).toContain('4 avis, note moyenne 2,8 / 5')
    expect(out).toContain('3 avis à 3 étoiles ou moins sans réponse')
    expect(out).toContain('| Plantage ou blocage | 1 |')
  })
})

describe('formatReviewSummary et explainReviewsError', () => {
  it('aucun avis : explique pourquoi (pas encore en production)', () => {
    const out = formatReviewSummary(summarizeReviews([])).join('\n')
    expect(out).toContain('Aucun avis public ces 7 derniers jours')
  })

  it('refus 403 : donne le geste du propriétaire', () => {
    const out = explainReviewsError(new PlayApiError('Lecture des avis du Play Store', 403, 'The caller does not have permission')).join('\n')
    expect(out).toContain('HTTP 403')
    expect(out).toContain('Répondre aux avis')
  })

  it('autre erreur : message court, sans casser le tableau', () => {
    const out = explainReviewsError(new Error('réseau | coupé\nici')).join('\n')
    expect(out).toContain('Lecture impossible : réseau   coupé ici')
  })
})

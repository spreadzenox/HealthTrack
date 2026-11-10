import { describe, it, expect } from 'vitest'
import { decideReviewed, lastSent, hasNewContent, REVIEWED_WORKFLOWS } from './reviewGate.mjs'
import freeze from './review-freeze.json'

const step = REVIEWED_WORKFLOWS.listing.step
const run = (head_sha, created_at, sendConclusion, completed_at = created_at) => ({
  head_sha, created_at, updated_at: completed_at,
  steps: [{ name: 'Checkout', conclusion: 'success' }, { name: step, conclusion: sendConclusion, completed_at: sendConclusion === 'success' ? completed_at : null }],
})

describe('envois examinés par Google, espacés (CD-ALPHA-5)', () => {
  const now = Date.parse('2026-11-06T12:00:00Z')
  const h = (n) => new Date(now - n * 3600e3).toISOString()

  it('aucun envoi connu : on envoie', () => {
    expect(decideReviewed({ sends: [], now }).send).toBe(true)
    expect(decideReviewed({ sends: [{ what: 'x', at: null }], now }).send).toBe(true)
  })

  it('le plus récent des envois compte, avec la date du prochain', () => {
    const d = decideReviewed({ sends: [{ what: '100811 sur l’alpha', at: h(20) }, { what: 'les abonnements', at: h(2) }], now })
    expect(d).toMatchObject({ send: false, spaced: true, nextAt: '2026-11-07T10:00:00.000Z' })
    expect(d.reason).toMatch(/^les abonnements : envoi d’il y a 2 h/)
  })

  it('24 h écoulées, ou délai à 0 : envoi', () => {
    expect(decideReviewed({ sends: [{ what: 'a', at: h(24) }], now }).send).toBe(true)
    expect(decideReviewed({ sends: [{ what: 'a', at: h(1) }], now, minHours: 0 }).send).toBe(true)
  })

  it('gel : rien avant la date, puis normal', () => {
    expect(decideReviewed({ sends: [], now, freezeUntil: '2026-11-08T00:00:00Z' })).toMatchObject({ send: false, frozen: true })
    expect(decideReviewed({ sends: [], now, freezeUntil: '2026-11-01T00:00:00Z' }).send).toBe(true)
    expect(decideReviewed({ sends: [], now, freezeUntil: 'n’importe quoi' }).send).toBe(true)
  })

  it('le gel livré : inactif, ou daté et justifié ; celui de 100918 bloque l’envoi Alpha du 08/11 23:45, pas celui du 09/11', () => {
    if (freeze.until == null) return
    expect(Number.isFinite(Date.parse(freeze.until))).toBe(true)
    expect(freeze.why).not.toBe('')
    if (freeze.until !== '2026-11-09T21:00:00Z') return
    // Envoi du soir de « Play — Alpha » (cron 22:45 UTC, NIGHTLY_MIN_HOURS = 0) : seul le gel peut le retenir.
    const nightly = (iso) => decideReviewed({ sends: [], now: Date.parse(iso), minHours: 0, freezeUntil: freeze.until })
    expect(nightly('2026-11-08T22:45:00Z')).toMatchObject({ send: false, frozen: true })
    expect(nightly('2026-11-09T22:45:00Z').send).toBe(true)
  })

  it('le gel livré, prolongé (100918 toujours en examen) : retient l’envoi Alpha du 09/11 23:45, pas celui du 10/11', () => {
    if (freeze.until == null) return
    expect(Number.isFinite(Date.parse(freeze.until))).toBe(true)
    expect(freeze.why).not.toBe('')
    if (freeze.until !== '2026-11-10T21:00:00Z') return
    // Envoi du soir de « Play — Alpha » (cron 22:45 UTC, NIGHTLY_MIN_HOURS = 0) : seul le gel peut le retenir.
    const nightly = (iso) => decideReviewed({ sends: [], now: Date.parse(iso), minHours: 0, freezeUntil: freeze.until })
    expect(nightly('2026-11-09T22:45:00Z')).toMatchObject({ send: false, frozen: true })
    expect(nightly('2026-11-10T22:45:00Z').send).toBe(true)
  })

  it('gel levé (until = null) : l’envoi Alpha part tout de suite', () => {
    expect(decideReviewed({ sends: [], now: Date.parse('2026-11-10T09:00:00Z'), minHours: 0, freezeUntil: null }).send).toBe(true)
  })

  it('dernier envoi : seule l’étape d’envoi réussie compte', () => {
    const runs = [
      run('aaa', '2026-11-03T10:00:00Z', 'success', '2026-11-03T10:05:00Z'),
      run('bbb', '2026-11-05T10:00:00Z', 'skipped'),
      run('ccc', '2026-11-05T11:00:00Z', 'failure'),
    ]
    expect(lastSent(runs, step)).toEqual({ at: '2026-11-03T10:05:00Z', sha: 'aaa' })
    expect(lastSent([], step)).toBe(null)
  })

  it('quelque chose à envoyer : seulement le contenu de la fiche ou des abonnements', () => {
    expect(hasNewContent('listing', null)).toBe(true)
    expect(hasNewContent('listing', ['app/store/fr-FR/full-description.txt'])).toBe(true)
    expect(hasNewContent('listing', ['app/scripts/play/listing.mjs'])).toBe(true)
    expect(hasNewContent('listing', ['.github/workflows/play-listing.yml', 'journal/README.md', 'app/src/pages/Home.jsx'])).toBe(false)
    expect(hasNewContent('listing', [])).toBe(false)
    expect(hasNewContent('listing', ['app/store/data-safety/answers.mjs'])).toBe(false)
    expect(hasNewContent('subscriptions', ['app/src/config/premiumBenefits.js'])).toBe(true)
    expect(hasNewContent('subscriptions', ['app/store/x.png', 'app/scripts/play/subscriptions.test.mjs'])).toBe(false)
  })
})

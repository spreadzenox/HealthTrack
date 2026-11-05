import { describe, it, expect } from 'vitest'
import { decideAlpha, affectsApp, commitCountOf, findCommitByCount, REQUIRED_WORKFLOWS } from './alphaGate.mjs'

const ok = (extra = []) => [...REQUIRED_WORKFLOWS.map((name) => ({ name, event: 'push', status: 'completed', conclusion: 'success' })), ...extra]
const base = { candidateVersionCode: 100694, alphaVersionCode: 100693, changedFiles: ['app/src/pages/Home.jsx'] }

describe('livraison continue vers l’alpha (04/11)', () => {
  it('tout vert, app modifiée, version plus récente : envoi', () => {
    expect(decideAlpha({ ...base, runs: ok() })).toMatchObject({ send: true, versionCode: 100694 })
  })

  it('un workflow encore en cours : on attend, sans envoyer', () => {
    const runs = ok().map((r) => (r.name === 'Tests' ? { ...r, status: 'in_progress', conclusion: null } : r))
    expect(decideAlpha({ ...base, runs })).toMatchObject({ send: false, wait: true })
  })

  it('émulateurs (Android 9) en échec ou annulés : pas d’envoi', () => {
    for (const conclusion of ['failure', 'cancelled']) {
      const runs = ok().map((r) => (r.name.startsWith('Test — émulateur') ? { ...r, conclusion } : r))
      expect(decideAlpha({ ...base, runs })).toMatchObject({ send: false })
      expect(decideAlpha({ ...base, runs }).wait).toBeUndefined()
    }
  })

  it('une relance réussie suffit si l’autre exécution a échoué', () => {
    const runs = ok([{ name: 'Tests', event: 'push', status: 'completed', conclusion: 'failure' }])
    expect(decideAlpha({ ...base, runs }).send).toBe(true)
  })

  it('les exécutions manuelles (envoi alpha à la main) ne comptent pas comme le build du commit', () => {
    const runs = ok().filter((r) => r.name !== 'Play — AAB').concat({ name: 'Play — AAB', event: 'workflow_dispatch', status: 'completed', conclusion: 'success' })
    expect(decideAlpha({ ...base, runs })).toMatchObject({ send: false, reason: expect.stringMatching(/journal/) })
  })

  it('jamais de retour en arrière : alpha déjà au même numéro ou plus haut', () => {
    expect(decideAlpha({ ...base, runs: ok(), alphaVersionCode: 100694 }).send).toBe(false)
    expect(decideAlpha({ ...base, runs: ok(), alphaVersionCode: 100700 }).send).toBe(false)
  })

  it('seuls le journal, le relais, les scripts ou les tests ont changé : pas de nouvel examen Google', () => {
    const changedFiles = ['journal/README.md', 'relay/src/index.js', 'app/scripts/play/publish.mjs', 'app/src/x.test.jsx', '.github/workflows/tests.yml']
    expect(decideAlpha({ ...base, runs: ok(), changedFiles })).toMatchObject({ send: false })
  })

  it('alpha vide ou version introuvable dans l’historique : envoi', () => {
    expect(decideAlpha({ ...base, runs: ok(), alphaVersionCode: null, changedFiles: null }).send).toBe(true)
  })

  it('version absente du test interne (accès refusé à l’envoi) : rien ne part', () => {
    expect(decideAlpha({ ...base, runs: ok(), internalVersionCode: 100693 }).send).toBe(false)
    expect(decideAlpha({ ...base, runs: ok(), internalVersionCode: null }).send).toBe(false)
    expect(decideAlpha({ ...base, runs: ok(), internalVersionCode: 100695 }).send).toBe(true)
  })

  describe('commit de journal après une version de l’app (émulateur de celle-ci annulé, 05/11)', () => {
    const journalOnly = () => ok().filter((r) => r.name !== 'Play — AAB')
    const inherited = { versionCode: 100787, filesSince: ['journal/README.md', 'journal/runs/x.md'] }
    const j = { runs: journalOnly(), candidateVersionCode: 100788, alphaVersionCode: 100786, internalVersionCode: 100787, changedFiles: ['app/src/pages/Recommendations.jsx', 'journal/README.md'], inherited }

    it('reprend la version du test interne, validée par les tests et l’émulateur de ce commit', () => {
      expect(decideAlpha(j)).toMatchObject({ send: true, versionCode: 100787 })
    })

    it('l’app a changé depuis la version du test interne : pas d’héritage', () => {
      const d = decideAlpha({ ...j, inherited: { ...inherited, filesSince: ['app/src/pages/Home.jsx'] } })
      expect(d).toMatchObject({ send: false, reason: expect.stringMatching(/journal/) })
    })

    it('émulateur encore en cours ou en échec sur ce commit : attente ou rien', () => {
      const runs = journalOnly().map((r) => (r.name.startsWith('Test — émulateur') ? { ...r, status: 'in_progress', conclusion: null } : r))
      expect(decideAlpha({ ...j, runs })).toMatchObject({ send: false, wait: true })
      const failed = journalOnly().map((r) => (r.name.startsWith('Test — émulateur') ? { ...r, conclusion: 'cancelled' } : r))
      expect(decideAlpha({ ...j, runs: failed }).send).toBe(false)
    })

    it('l’alpha a déjà cette version : rien ne part', () => {
      expect(decideAlpha({ ...j, alphaVersionCode: 100787 }).send).toBe(false)
    })

    it('sans version héritée connue : comme avant, aucun AAB', () => {
      expect(decideAlpha({ ...j, inherited: null })).toMatchObject({ send: false, reason: expect.stringMatching(/journal/) })
    })
  })

  describe('envois espacés pour laisser Google finir son examen (CD-ALPHA-2, 05/11)', () => {
    const now = Date.parse('2026-11-05T19:00:00Z')
    const h = (n) => new Date(now - n * 3600e3).toISOString()

    it('version de l’alpha envoyée il y a moins de 24 h : pas d’envoi, date du prochain envoi donnée', () => {
      const d = decideAlpha({ ...base, runs: ok(), alphaSentAt: h(3), now })
      expect(d).toMatchObject({ send: false, spaced: true, nextAt: '2026-11-06T16:00:00.000Z' })
      expect(d.wait).toBeUndefined()
      expect(d.reason).toMatch(/il y a 3 h/)
      expect(d.reason).toMatch(/24 h/)
    })

    it('24 h passées : envoi', () => {
      expect(decideAlpha({ ...base, runs: ok(), alphaSentAt: h(24), now })).toMatchObject({ send: true, versionCode: 100694 })
    })

    it('délai réglable (ALPHA_MIN_HOURS), 0 le coupe', () => {
      expect(decideAlpha({ ...base, runs: ok(), alphaSentAt: h(7), now, minHours: 6 }).send).toBe(true)
      expect(decideAlpha({ ...base, runs: ok(), alphaSentAt: h(1), now, minHours: 0 }).send).toBe(true)
      expect(decideAlpha({ ...base, runs: ok(), alphaSentAt: h(7), now, minHours: 12 }).send).toBe(false)
    })

    it('date inconnue (alpha vide, version introuvable) : envoi comme avant', () => {
      expect(decideAlpha({ ...base, runs: ok(), alphaSentAt: null, now }).send).toBe(true)
      expect(decideAlpha({ ...base, runs: ok(), alphaSentAt: 'pas une date', now }).send).toBe(true)
    })

    it('le délai ne masque pas les autres raisons (rien de l’app modifié, workflow en cours)', () => {
      expect(decideAlpha({ ...base, runs: ok(), changedFiles: ['journal/README.md'], alphaSentAt: h(1), now }).spaced).toBeUndefined()
      const runs = ok().map((r) => (r.name === 'Tests' ? { ...r, status: 'in_progress', conclusion: null } : r))
      expect(decideAlpha({ ...base, runs, alphaSentAt: h(1), now })).toMatchObject({ wait: true })
    })
  })

  it('interrupteur coupé : rien ne part', () => {
    expect(decideAlpha({ ...base, runs: ok(), enabled: false }).send).toBe(false)
  })

  it('fichiers qui changent l’app', () => {
    expect(affectsApp('app/src/data/changelog/x.json')).toBe(true)
    expect(affectsApp('app/android/app/build.gradle')).toBe(true)
    expect(affectsApp('.github/workflows/play-bundle.yml')).toBe(true)
    expect(affectsApp('app/src/hooks/__tests__/a.js')).toBe(false)
    expect(affectsApp('app/BUILD_APK.md')).toBe(false)
  })

  it('versionCode → nombre de commits de main', () => {
    expect(commitCountOf(100721)).toBe(721)
    expect(commitCountOf('100000')).toBe(null)
    expect(commitCountOf(null)).toBe(null)
  })

  it('retrouve le commit d’un versionCode malgré les anciens merges (comptes non contigus)', () => {
    const counts = { a: 1, b: 2, m: 7, c: 8, d: 9 }
    const chain = ['a', 'b', 'm', 'c', 'd']
    expect(findCommitByCount(chain, (x) => counts[x], 8)).toBe('c')
    expect(findCommitByCount(chain, (x) => counts[x], 5)).toBe(null)
  })
})

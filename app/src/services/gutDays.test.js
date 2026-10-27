import { describe, it, expect } from 'vitest'
import { NULL_SCENARIOS, simulateRealistic } from './gutWindows.sim'
import { GUT_DAY_WINDOWS, TTS_SHIFT_DAYS, analyzeGutDays } from './gutDays'
import { MAX_TESTED_FOODS, analyzeGutWindows, selectTestedFactors } from './gutWindows'
import { FODMAP_SUBGROUPS } from './fodmapGroups'

const DAY_ONLY = { timedNotes: false, dayNotes: true }
const find = (res, factor, window) => res.results.find((r) => r.factor === factor && r.window === window)
const meal = (iso, ingredient) => ({ type: 'food', at: iso, payload: { items: [{ ingredient, quantity_g: 100 }] } })
const bilan = (iso, level) => ({ type: 'gut', at: iso, payload: { level, scope: 'day' } })

describe('GUT_DAY_WINDOWS', () => {
  it('deux expositions fixées d’avance : le jour même et la veille', () => {
    expect(GUT_DAY_WINDOWS.map((w) => [w.id, w.lagDays])).toEqual([['jour', 0], ['veille', 1]])
  })
})

describe('analyzeGutDays (I170 étape 3)', () => {
  it('un effet net le jour même est repéré dans « le jour même » en 13 semaines, presque jamais ailleurs', () => {
    let found = 0
    let elsewhere = 0
    for (let seed = 1; seed <= 10; seed++) {
      const res = analyzeGutDays(simulateRealistic({ seed: seed * 31, days: 90, ...DAY_ONLY, dayEffect: { food: 'oignon', day: 0, odds: 8 } }))
      if (find(res, 'oignon', 'jour').status === 'link') found += 1
      elsewhere += res.results.filter((r) => r.status === 'link' && !(r.factor === 'oignon' && r.window === 'jour')).length
    }
    expect(found).toBeGreaterThanOrEqual(5)
    // Correction de Benjamini-Hochberg à 10 % : une fausse piste à côté d'une vraie reste possible, rarement.
    expect(elsewhere).toBeLessThanOrEqual(1)
  })

  it('un effet de la veille est repéré dans « la veille »', () => {
    let found = 0
    for (let seed = 1; seed <= 10; seed++) {
      const res = analyzeGutDays(simulateRealistic({ seed: seed * 31, days: 90, ...DAY_ONLY, dayEffect: { food: 'oignon', day: 1, odds: 8 } }))
      if (find(res, 'oignon', 'veille').status === 'link') found += 1
    }
    expect(found).toBeGreaterThanOrEqual(5)
  })

  it('les quatre difficultés réalistes ensemble, sans effet : moins d’un jeu sur dix avec une piste', () => {
    let kept = 0
    const n = 40
    for (let seed = 1; seed <= n; seed++) {
      const res = analyzeGutDays(simulateRealistic({ seed: seed * 7919 + 63, days: 63, ...NULL_SCENARIOS.tous, ...DAY_ONLY }))
      if (res.results.some((r) => r.status === 'link')) kept += 1
    }
    expect(kept / n).toBeLessThan(0.1)
  })

  it('le jour même ne compte que les repas pris AVANT le bilan ; la veille, toute la journée d’avant', () => {
    const entries = []
    for (let d = 1; d <= 9; d++) {
      const day = `2026-09-${String(d).padStart(2, '0')}`
      entries.push(meal(`${day}T22:30:00`, 'Oignon')) // après le bilan : pas « le jour même », mais « la veille » du lendemain
      entries.push(bilan(`${day}T21:00:00`, 'calm'))
    }
    const res = analyzeGutDays(entries)
    expect(find(res, 'oignon', 'jour')).toBeUndefined()
    expect(find(res, 'oignon', 'veille').exposed.days).toBe(8)
    expect(find(res, 'oignon', 'veille').unexposed.days).toBe(1)
  })

  it('un seul bilan par jour, le plus récent ; ignore les notes horodatées', () => {
    const res = analyzeGutDays([
      meal('2026-09-02T12:00:00', 'Riz'),
      bilan('2026-09-02T20:00:00', 'pain'),
      bilan('2026-09-02T21:00:00', 'calm'),
      { type: 'gut', at: '2026-09-02T15:00:00', payload: { level: 'pain' } },
    ])
    expect(res.days).toBe(1)
    expect(find(res, 'riz', 'jour').exposed).toEqual({ days: 1, symptoms: 0 })
  })

  it('les notes horodatées n’influencent pas l’analyse par jour, et les bilans pas l’analyse par fenêtres', () => {
    const days = simulateRealistic({ seed: 5, days: 63, ...DAY_ONLY })
    const timed = simulateRealistic({ seed: 6, days: 63 }).filter((e) => e.type === 'gut')
    expect(analyzeGutDays([...days, ...timed])).toEqual(analyzeGutDays(days))
    expect(analyzeGutWindows(days).notes).toBe(0)
  })

  it('moins de 2 × r + 10 jours de bilans : même un effet net reste « trop tôt pour dire »', () => {
    const res = analyzeGutDays(simulateRealistic({ seed: 3, days: 2 * TTS_SHIFT_DAYS + 6, ...DAY_ONLY, dayEffect: { food: 'oignon', day: 0, odds: 40 } }))
    expect(res.results.filter((r) => r.status === 'link')).toEqual([])
  })

  it('avec peu de bilans, tout est « trop tôt pour dire »', () => {
    const res = analyzeGutDays(simulateRealistic({ seed: 9, days: 5, ...DAY_ONLY }))
    expect(res.results.length).toBeGreaterThan(0)
    expect(res.results.every((r) => r.status === 'too_early')).toBe(true)
    expect(res.tested).toBe(0)
  })

  it('rien à analyser : réponse vide', () => {
    expect(analyzeGutDays([])).toEqual({ days: 0, tested: 0, adjustedFor: [], results: [] })
    expect(analyzeGutDays([bilan('2026-09-02T21:00:00', 'bizarre'), { type: 'food', at: '2026-09-02T10:00:00', payload: {} }]))
      .toEqual({ days: 0, tested: 0, adjustedFor: [], results: [] })
  })
})

describe('moins de comparaisons (I173)', () => {
  const days = (n, from = 1) => Array.from({ length: n }, (_, i) => `2026-09-${String(from + i).padStart(2, '0')}`)

  it('selectTestedFactors : sous-groupes FODMAP toujours, puis les aliments les mieux répartis', () => {
    const meals = [
      ...days(20).map((day) => ({ day, factors: ['pain'] })), // tous les jours : peu informatif
      ...days(10).map((day) => ({ day, factors: ['riz'] })), // un jour sur deux : le mieux réparti
      ...days(4).map((day) => ({ day, factors: ['pomme', 'fodmap:fructose', 'fodmap:sorbitol'] })),
      { day: '2026-09-05', factors: ['kiwi'] },
    ]
    expect(selectTestedFactors(meals, 2)).toEqual(['fodmap:fructose', 'fodmap:sorbitol', 'pomme', 'riz'])
    expect(selectTestedFactors(meals, 3)).toEqual(['fodmap:fructose', 'fodmap:sorbitol', 'kiwi', 'pomme', 'riz'])
    expect(selectTestedFactors(meals, 10)).toEqual(['fodmap:fructose', 'fodmap:sorbitol', 'kiwi', 'pain', 'pomme', 'riz'])
  })

  it(`au plus ${MAX_TESTED_FOODS} aliments testés par fenêtre, quelle que soit la longueur de la liste`, () => {
    const entries = simulateRealistic({ seed: 5, days: 63, ...DAY_ONLY, extraFoods: 30 })
    const factors = new Set(analyzeGutDays(entries).results.map((r) => r.factor))
    expect([...factors].filter((f) => !f.startsWith('fodmap:')).length).toBeLessThanOrEqual(MAX_TESTED_FOODS)
    expect(factors.size).toBeLessThanOrEqual(MAX_TESTED_FOODS + FODMAP_SUBGROUPS.length)
  })

  it('deux aliments toujours mangés ensemble ne comptent qu’une comparaison et reçoivent le même verdict', () => {
    const entries = simulateRealistic({ seed: 11, days: 63, ...DAY_ONLY }).map((e) => (e.type !== 'food' ? e : {
      ...e,
      payload: { items: e.payload.items.flatMap((it) => (it.ingredient === 'Oignon' ? [it, { ingredient: 'Échalote', quantity_g: 10 }] : [it])) },
    }))
    const res = analyzeGutDays(entries)
    const solo = analyzeGutDays(simulateRealistic({ seed: 11, days: 63, ...DAY_ONLY }))
    expect(res.tested).toBe(solo.tested)
    for (const w of ['jour', 'veille']) {
      const [a, b] = [find(res, 'oignon', w), find(res, 'échalote', w)]
      expect(b).toMatchObject({ q: a.q, u: a.u, status: a.status, p: a.p })
      expect(b).not.toHaveProperty('twinOf')
    }
  })
})

describe('analyzeGutDays — la nuit d’avant en covariable (I134 étape 1)', () => {
  /** Journal où seule la nuit joue sur le ventre ; le café suit les nuits courtes (on en boit plus quand on a mal dormi). */
  function confounded(seed, { withSleep = true, coffeeFollowsNight = true, onionOdds = 1 } = {}) {
    let s = seed >>> 0
    const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32)
    const entries = []
    for (let d = 0; d < 91; d++) {
      const day = new Date(Date.UTC(2026, 6, 1 + d)).toISOString().slice(0, 10)
      const prev = new Date(Date.UTC(2026, 6, d)).toISOString().slice(0, 10)
      const short = rnd() < 0.4
      if (withSleep) {
        entries.push({ type: 'sleep', at: `${prev}T23:00:00`, payload: { durationMinutes: short ? 300 : 480, endDate: `${day}T${short ? '04' : '07'}:00:00` } })
      }
      const coffee = rnd() < (coffeeFollowsNight ? (short ? 0.85 : 0.15) : 0.4)
      if (coffee) entries.push(meal(`${day}T08:00:00`, 'Café'))
      const onion = rnd() < 0.4
      if (onion) entries.push(meal(`${day}T12:30:00`, 'Oignon'))
      if (rnd() < 0.5) entries.push(meal(`${day}T19:00:00`, 'Riz'))
      const base = short ? 0.75 : 0.1
      const odds = (base / (1 - base)) * (onion ? onionOdds : 1)
      entries.push(bilan(`${day}T21:00:00`, rnd() < odds / (1 + odds) ? 'discomfort' : 'calm'))
    }
    return entries
  }
  const linked = (res, factor) => res.results.some((r) => r.factor === factor && r.status === 'link')

  it('sans données de sommeil, le café des nuits courtes passe pour une piste (le piège à éviter)', () => {
    let found = 0
    for (let seed = 1; seed <= 10; seed++) if (linked(analyzeGutDays(confounded(seed * 97, { withSleep: false })), 'café')) found += 1
    expect(found).toBeGreaterThanOrEqual(7)
  })

  it('avec la nuit d’avant en covariable, le café n’est plus accusé', () => {
    let found = 0
    for (let seed = 1; seed <= 10; seed++) {
      const res = analyzeGutDays(confounded(seed * 97))
      expect(res.adjustedFor).toEqual(['sleep'])
      if (linked(res, 'café')) found += 1
    }
    expect(found).toBeLessThanOrEqual(1)
  })

  it('quand la nuit joue aussi, un vrai effet d’un aliment ressort plus souvent à nuit comparable', () => {
    // Mesure du 26/10 (60 jeux, effet ×6) : 22/60 sans les nuits, 31/60 avec ; si la nuit ne joue pas : 51 → 45/60.
    let adjusted = 0
    let plain = 0
    for (let seed = 1; seed <= 20; seed++) {
      const opts = { coffeeFollowsNight: false, onionOdds: 6 }
      if (linked(analyzeGutDays(confounded(seed * 131, opts)), 'oignon')) adjusted += 1
      if (linked(analyzeGutDays(confounded(seed * 131, { ...opts, withSleep: false })), 'oignon')) plain += 1
    }
    expect(adjusted).toBeGreaterThanOrEqual(plain)
    expect(adjusted).toBeGreaterThanOrEqual(6)
  })

  it('trop peu de nuits connues : pas de covariable, analyse inchangée', () => {
    const entries = confounded(5)
    const sparse = entries.filter((e, i) => e.type !== 'sleep' || i % 5 === 0)
    const noSleep = entries.filter((e) => e.type !== 'sleep')
    const res = analyzeGutDays(sparse)
    expect(res.adjustedFor).toEqual([])
    expect(res.results).toEqual(analyzeGutDays(noSleep).results)
  })
})

describe('analyzeGutDays — stress et temps d’écran de la veille (I134 étape 2)', () => {
  /**
   * Journal synthétique de 13 semaines : nuit, stress de la montre (3 relevés par jour) et temps d'écran (journée
   * terminée). `driver` dit ce qui gêne vraiment le ventre ; le café suit ce même facteur (piège) sauf si
   * `coffeeFollows` est faux.
   */
  function journal(seed, { driver = 'none', coffeeFollows = true, onionOdds = 1 } = {}) {
    let s = seed >>> 0
    const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32)
    const entries = []
    let prevStress = false
    let prevScreen = false
    for (let d = 0; d < 91; d++) {
      const day = new Date(Date.UTC(2026, 6, 1 + d)).toISOString().slice(0, 10)
      const prev = new Date(Date.UTC(2026, 6, d)).toISOString().slice(0, 10)
      const short = rnd() < 0.4
      const stress = rnd() < 0.4
      const screen = rnd() < 0.4
      entries.push({ type: 'sleep', at: `${prev}T23:00:00`, payload: { durationMinutes: short ? 300 : 480, endDate: `${day}T${short ? '04' : '07'}:00:00` } })
      for (const h of ['10', '15', '18']) {
        entries.push({ type: 'watch_stress', at: `${day}T${h}:00:00`, payload: { value: (stress ? 60 : 20) + rnd() * 20 } })
      }
      // Minutes ex aequo exprès : 60 % des jours à 120 min (la coupure à la médiane doit rester équilibrée).
      entries.push({ type: 'phone_usage', at: `${day}T23:59:00`, payload: { date: day, screenMinutes: screen ? 300 : 120 } })
      const bad = { none: false, sleep: short, stress: prevStress, screen: prevScreen, both: short || prevStress }[driver]
      if (rnd() < (coffeeFollows ? (bad ? 0.85 : 0.15) : 0.4)) entries.push(meal(`${day}T08:00:00`, 'Café'))
      const onion = rnd() < 0.4
      if (onion) entries.push(meal(`${day}T12:30:00`, 'Oignon'))
      if (rnd() < 0.5) entries.push(meal(`${day}T19:00:00`, 'Riz'))
      const base = bad ? 0.75 : 0.1
      const odds = (base / (1 - base)) * (onion ? onionOdds : 1)
      entries.push(bilan(`${day}T21:00:00`, rnd() < odds / (1 + odds) ? 'discomfort' : 'calm'))
      prevStress = stress
      prevScreen = screen
    }
    return entries
  }
  const linked = (res, factor) => res.results.some((r) => r.factor === factor && r.status === 'link')
  const count = (n, fn) => { let k = 0; for (let seed = 1; seed <= n; seed++) if (fn(seed)) k += 1; return k }

  // Mesure du 26/10 (30 jeux par piège, 60 par puissance) : piège café 26–29/30 sans ajustement → 0 à 3/30 ;
  // puissance (effet ×6) : rien ne joue 45/60 (inchangé), la nuit 27 → 34, le stress 28 → 27, nuit + stress 14/60.
  for (const driver of ['stress', 'screen']) {
    it(`le café qui suit le ${driver === 'stress' ? 'stress' : 'temps d’écran'} de la veille n’est plus accusé`, () => {
      expect(count(10, (seed) => linked(analyzeGutDays(journal(seed * 97, { driver }), { maxCovariates: 0 }), 'café'))).toBeGreaterThanOrEqual(7)
      expect(count(10, (seed) => {
        const res = analyzeGutDays(journal(seed * 97, { driver }))
        expect(res.adjustedFor).toContain(driver)
        return linked(res, 'café')
      })).toBeLessThanOrEqual(1)
    })
  }

  it('nuit ET stress en cause : le café n’est presque plus accusé', () => {
    expect(count(10, (seed) => linked(analyzeGutDays(journal(seed * 97, { driver: 'both' }), { maxCovariates: 1 }), 'café'))).toBeGreaterThanOrEqual(3)
    const runs = Array.from({ length: 10 }, (_, i) => analyzeGutDays(journal((i + 1) * 97, { driver: 'both' })))
    // Le lien de la nuit avec le ventre n'atteint pas toujours |z| ≥ 2 sur 13 semaines (hasard) : 9 fois sur 10 ici.
    expect(runs.filter((res) => res.adjustedFor.includes('sleep')).length).toBeGreaterThanOrEqual(8)
    expect(runs.filter((res) => linked(res, 'café')).length).toBeLessThanOrEqual(2)
  })

  it('une covariable sans lien avec le ventre n’est pas retenue (elle coûterait de la puissance pour rien)', () => {
    for (let seed = 1; seed <= 5; seed++) expect(analyzeGutDays(journal(seed * 131, { driver: 'none' })).adjustedFor).toEqual([])
    const res = analyzeGutDays(journal(97, { driver: 'screen' }))
    expect(res.adjustedFor).toEqual(['screen'])
  })

  it('le choix des covariables ne regarde pas les aliments : un vrai effet garde sa puissance', () => {
    const opts = (driver) => ({ driver, coffeeFollows: false, onionOdds: 6 })
    const free = count(20, (seed) => linked(analyzeGutDays(journal(seed * 131, opts('none')), { maxCovariates: 0 }), 'oignon'))
    const adjusted = count(20, (seed) => linked(analyzeGutDays(journal(seed * 131, opts('none'))), 'oignon'))
    expect(adjusted).toBe(free)
    const night = count(20, (seed) => linked(analyzeGutDays(journal(seed * 131, opts('sleep'))), 'oignon'))
    const nightPlain = count(20, (seed) => linked(analyzeGutDays(journal(seed * 131, opts('sleep')), { maxCovariates: 0 }), 'oignon'))
    expect(night).toBeGreaterThanOrEqual(nightPlain)
  })

  it('sans aucun effet, avec nuit, stress et écran : pas plus de fausses pistes', () => {
    // Mesure du 26/10 (150 jeux) : 5/150 (rien ne joue), 4/150 (la nuit joue), 3/150 (nuit + stress).
    for (const driver of ['none', 'both']) {
      expect(count(40, (seed) => analyzeGutDays(journal(seed * 7919 + 3, { driver, coffeeFollows: false })).results.some((r) => r.status === 'link')))
        .toBeLessThanOrEqual(4)
    }
  })

  it('le stress et l’écran du jour même ne servent pas (ils peuvent être une conséquence du ventre)', () => {
    // Le ventre gêné fait monter le stress et l'écran DU JOUR : rien ne doit être retenu.
    const entries = journal(7, { driver: 'none' }).filter((e) => e.type !== 'watch_stress' && e.type !== 'phone_usage' && e.type !== 'sleep')
    for (const b of entries.filter((e) => e.type === 'gut')) {
      const day = b.at.slice(0, 10)
      const bad = b.payload.level !== 'calm'
      entries.push({ type: 'watch_stress', at: `${day}T18:00:00`, payload: { value: bad ? 80 : 20 } })
      entries.push({ type: 'phone_usage', at: `${day}T23:59:00`, payload: { date: day, screenMinutes: bad ? 400 : 100 } })
    }
    expect(analyzeGutDays(entries).adjustedFor).toEqual([])
  })
})

describe('analyzeGutDays — aliments du même jour estimés ensemble (I134 étape 3)', () => {
  /** L'oignon gêne ; l'ail l'accompagne souvent (`together`), parfois seul (`alone`). Trames synthétiques. */
  function coEaten(seed, { onionOdds = 6, garlicOdds = 1, together = 0.8, alone = 0.15 } = {}) {
    let s = seed >>> 0
    const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32)
    const entries = []
    for (let d = 0; d < 91; d++) {
      const day = new Date(Date.UTC(2026, 6, 1 + d)).toISOString().slice(0, 10)
      const onion = rnd() < 0.4
      const garlic = rnd() < (onion ? together : alone)
      if (onion) entries.push(meal(`${day}T12:30:00`, 'Oignon'))
      if (garlic) entries.push(meal(`${day}T19:00:00`, 'Ail'))
      if (rnd() < 0.5) entries.push(meal(`${day}T08:00:00`, 'Pain'))
      if (rnd() < 0.5) entries.push(meal(`${day}T13:00:00`, 'Riz'))
      const odds = (0.2 / 0.8) * (onion ? onionOdds : 1) * (garlic ? garlicOdds : 1)
      if (rnd() < 0.9) entries.push(bilan(`${day}T21:00:00`, rnd() < odds / (1 + odds) ? 'discomfort' : 'calm'))
    }
    return entries
  }
  const linked = (res, factor) => res.results.some((r) => r.factor === factor && r.status === 'link')
  const count = (opts, factor, adjustFoods) => {
    let n = 0
    for (let seed = 1; seed <= 60; seed++) if (linked(analyzeGutDays(coEaten(seed * 211, opts), { adjustFoods }), factor)) n += 1
    return n
  }

  it('l’ail qui accompagne l’oignon n’est plus accusé (mesure du 26/10 : 23 → 1 sur 60)', () => {
    expect(count({}, 'ail', false)).toBeGreaterThanOrEqual(15)
    expect(count({}, 'ail', true)).toBeLessThanOrEqual(3)
    // Ail presque toujours avec l'oignon : le piège est plus fort, l'ajustement le désarme en grande partie (38 → 6).
    expect(count({ together: 0.9, alone: 0.1 }, 'ail', true)).toBeLessThanOrEqual(8)
  })

  it('la vraie piste garde sa puissance, et l’aliment écarté dit par qui il s’explique', () => {
    expect(count({}, 'oignon', true)).toBeGreaterThanOrEqual(count({}, 'oignon', false) - 4)
    let explained = 0
    for (let seed = 1; seed <= 10; seed++) {
      const ail = analyzeGutDays(coEaten(seed * 211)).results.filter((r) => r.factor === 'ail' && r.explainedBy)
      for (const r of ail) {
        expect(r.status).toBe('no_link')
        expect(r.explainedBy.factor).toBe('oignon')
        explained += 1
      }
    }
    expect(explained).toBeGreaterThanOrEqual(1)
  })

  it('une seule piste (rien de mangé avec elle) : résultat identique avec ou sans ajustement', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const entries = coEaten(seed * 211, { together: 0.15 })
      expect(analyzeGutDays(entries)).toEqual(analyzeGutDays(entries, { adjustFoods: false }))
    }
  })

  it('l’ajustement ne fait jamais apparaître de piste : il ne peut qu’en retirer', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const entries = simulateRealistic({ seed: seed * 7919 + 63, days: 90, ...NULL_SCENARIOS.tous, ...DAY_ONLY })
      const keys = (res) => res.results.filter((r) => r.status === 'link').map((r) => `${r.factor}|${r.window}`)
      const plain = keys(analyzeGutDays(entries, { adjustFoods: false }))
      for (const k of keys(analyzeGutDays(entries))) expect(plain).toContain(k)
    }
  })
})

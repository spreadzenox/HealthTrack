import { describe, it, expect } from 'vitest'
import {
  FODMAP_CHALLENGE_SOURCE, FODMAP_CHALLENGE_TYPE, FODMAP_GROUPS, answerTolerable, calmStreak, canStartChallenge,
  challengeStatus, combinationsAvailable, defaultPlan, groupResults, recordDose, restartChallenge, startChallenge,
  verdictSentence,
} from './fodmapChallenge'
import { parseBackup } from '../storage/localHealthStorage'

/** Heure locale du jour `d` (26/10/2026 = jour 0). */
const at = (d, h = 12, m = 0) => new Date(2026, 9, 26 + d, h, m)
const gut = (d, level, h = 21, scope = 'day') => ({
  type: 'gut', source: 'app_gut', at: at(d, h).toISOString(), payload: scope ? { level, scope } : { level },
})
/** Trois bilans calmes avant le départ (jours -3, -2, -1). */
const calmBefore = [gut(-3, 'calm'), gut(-2, 'calm'), gut(-1, 'calm')]
const entry = (payload) => ({ type: FODMAP_CHALLENGE_TYPE, source: FODMAP_CHALLENGE_SOURCE, at: payload.startedAt, payload })

/** Déroule un test : une portion à midi les jours `doseDays`, avec les notes du ventre `notes`. */
function run(doseDays, notes = [], { group = 'fructans', food = 'wheat' } = {}) {
  let ch = startChallenge({ group, food }, at(doseDays[0], 9))
  for (const d of doseDays) ch = recordDose(ch, notes, at(d, 12))
  return ch
}

describe('repères et départ', () => {
  it('portions par défaut : départ, double, triple', () => {
    expect(defaultPlan('fructans', 'wheat')).toMatchObject({ unit: 'tranche', amounts: [1, 2, 3] })
    expect(defaultPlan('fructans', 'garlic').amounts).toEqual([0.5, 1, 1.5])
    expect(defaultPlan('lactose', 'nope')).toBeNull()
  })

  it('chaque groupe a au moins un aliment avec une portion positive', () => {
    for (const g of FODMAP_GROUPS) {
      expect(g.foods.length).toBeGreaterThan(0)
      for (const f of g.foods) expect(f.amount).toBeGreaterThan(0)
    }
  })

  it('refuse un groupe inconnu ou des portions invalides', () => {
    expect(() => startChallenge({ group: 'x', food: 'y' })).toThrow()
    expect(() => startChallenge({ group: 'lactose', food: 'milk', plan: { unit: 'ml', amounts: [1, 0, 2] } })).toThrow()
  })

  it('les portions modifiées par la personne sont gardées', () => {
    const ch = startChallenge({ group: 'lactose', food: 'milk', plan: { unit: 'ml', units: 'ml', amounts: [60, 120, 200] } }, at(0))
    expect(recordDose(ch, [], at(0, 12)).doses[0]).toMatchObject({ day: 1, amount: 60, unit: 'ml' })
  })
})

describe('garde des 3 jours calmes', () => {
  it('3 bilans calmes d’affilée : on peut commencer', () => {
    expect(canStartChallenge([], calmBefore, at(0, 9))).toEqual({ ok: true, reason: null, calmDays: 3 })
  })

  it('une gêne parmi les 3 derniers jours : on attend', () => {
    const notes = [gut(-3, 'calm'), gut(-2, 'discomfort', 15, null), gut(-2, 'calm'), gut(-1, 'calm')]
    expect(canStartChallenge([], notes, at(0, 9))).toMatchObject({ ok: false, reason: 'not_calm', calmDays: 1 })
  })

  it('un jour sans aucune note ne compte pas comme calme', () => {
    expect(calmStreak([gut(-3, 'calm'), gut(-1, 'calm')], at(0, 9))).toBe(1)
  })

  it('aujourd’hui compte s’il est déjà noté calme, et une gêne aujourd’hui casse la série', () => {
    expect(calmStreak([...calmBefore, gut(0, 'calm', 8, null)], at(0, 9))).toBe(4)
    expect(calmStreak([...calmBefore, gut(0, 'pain', 8, null)], at(0, 9))).toBe(0)
  })
})

describe('table de transitions', () => {
  it('sans gêne : J1 → J2 → J3 → pause → terminé, verdict « bien toléré »', () => {
    let ch = startChallenge({ group: 'fructans', food: 'wheat' }, at(0, 9))
    expect(challengeStatus(ch, calmBefore, at(0, 9))).toMatchObject({ state: 'day1', canTakeDose: true })
    ch = recordDose(ch, calmBefore, at(0, 12))
    expect(challengeStatus(ch, calmBefore, at(0, 18))).toMatchObject({ state: 'day1', doseTakenToday: true, canTakeDose: false })
    expect(challengeStatus(ch, calmBefore, at(1, 9))).toMatchObject({ state: 'day2', canTakeDose: true })
    ch = recordDose(ch, calmBefore, at(1, 12))
    ch = recordDose(ch, calmBefore, at(2, 12))
    expect(ch.doses.map((d) => d.amount)).toEqual([1, 2, 3])
    expect(challengeStatus(ch, calmBefore, at(2, 20)).state).toBe('day3')
    const s = challengeStatus(ch, calmBefore, at(3, 13))
    expect(s).toMatchObject({ state: 'washout', verdict: { id: 'tolerated' } })
    const calmAfter = [...calmBefore, gut(3, 'calm'), gut(4, 'calm'), gut(5, 'calm')]
    expect(challengeStatus(ch, calmAfter, at(5, 22))).toMatchObject({ state: 'done', verdict: { id: 'tolerated' } })
  })

  it('une seule portion par jour (aucune portion rattrapée en double)', () => {
    let ch = run([0])
    ch = recordDose(ch, [], at(0, 20))
    expect(ch.doses).toHaveLength(1)
    let full = run([0, 1, 2])
    full = recordDose(full, [], at(3, 12))
    expect(full.doses).toHaveLength(3)
  })

  it('gêne dans les 24 h → question ; « supportable » = on continue', () => {
    const notes = [...calmBefore, gut(0, 'discomfort', 20, null)]
    let ch = run([0], notes)
    expect(challengeStatus(ch, notes, at(0, 21))).toMatchObject({ state: 'question', question: { day: 1 }, canTakeDose: false })
    expect(recordDose(ch, notes, at(1, 12))).toBe(ch)
    ch = answerTolerable(ch, notes, true, at(0, 21))
    expect(challengeStatus(ch, notes, at(1, 12))).toMatchObject({ state: 'day2', canTakeDose: true })
  })

  it.each([
    [1, 'retest', 'Blé : gêne dès la première portion. À retester plus tard, en plus petit.'],
    [2, 'small', 'Blé : une petite portion passe (1 tranche). Au-delà, gêne.'],
    [3, 'medium', 'Blé : une portion moyenne passe (2 tranches). Au-delà, gêne.'],
  ])('arrêt à J%i → %s', (stopDay, verdict, sentence) => {
    const notes = [...calmBefore, gut(stopDay - 1, 'pain', 18, null)]
    let ch = run([0, 1, 2].slice(0, stopDay), notes)
    ch = answerTolerable(ch, notes, false, at(stopDay - 1, 19))
    const s = challengeStatus(ch, notes, at(stopDay, 13))
    expect(s).toMatchObject({ state: 'washout', stoppedAt: stopDay, verdict: { id: verdict } })
    expect(verdictSentence(ch, s.verdict)).toBe(sentence)
    expect(recordDose(ch, notes, at(stopDay, 14))).toBe(ch)
  })

  it('une note de gêne à 25 h de la portion ne compte pas pour ce jour', () => {
    const notes = [...calmBefore, gut(1, 'discomfort', 13, null)]
    const ch = run([0], notes)
    expect(challengeStatus(ch, notes, at(1, 14))).toMatchObject({ state: 'day2', canTakeDose: true })
  })

  it('une gêne notée avant la portion ne compte pas', () => {
    const notes = [...calmBefore, gut(0, 'discomfort', 8, null)]
    const ch = run([0], notes)
    expect(challengeStatus(ch, notes, at(0, 20)).state).toBe('day1')
  })

  it('le bilan du soir « Gêne » du jour de la portion compte', () => {
    const notes = [...calmBefore, gut(0, 'discomfort', 21)]
    expect(challengeStatus(run([0], notes), notes, at(0, 22)).state).toBe('question')
  })

  it('un jour sauté décale le test ; deux jours sautés le mettent en pause', () => {
    const ch = run([0])
    expect(challengeStatus(ch, [], at(2, 12))).toMatchObject({ state: 'day2', canTakeDose: true })
    expect(recordDose(ch, [], at(2, 12)).doses[1]).toMatchObject({ day: 2, amount: 2 })
    expect(challengeStatus(ch, [], at(3, 12))).toMatchObject({ state: 'paused', canTakeDose: false })
    expect(recordDose(ch, [], at(3, 12))).toBe(ch)
  })

  it('après la pause, le test repart de J1 en gardant l’historique', () => {
    const ch = restartChallenge(run([0]), [], at(3, 12))
    expect(ch).toMatchObject({ doses: [], restarts: 1, history: [{ doses: [{ day: 1 }] }] })
    expect(challengeStatus(ch, [], at(3, 13))).toMatchObject({ state: 'day1', canTakeDose: true })
    expect(restartChallenge(ch, [], at(3, 13))).toBe(ch)
  })

  it('jamais commencé : deux jours sans portion après le départ → pause', () => {
    const ch = startChallenge({ group: 'lactose', food: 'milk' }, at(0, 9))
    expect(challengeStatus(ch, [], at(1, 9)).state).toBe('day1')
    expect(challengeStatus(ch, [], at(2, 9)).state).toBe('paused')
  })
})

describe('un seul test à la fois', () => {
  const calmLong = [...calmBefore, ...[0, 1, 2, 3, 4, 5].map((d) => gut(d, 'calm'))]

  it('refusé pendant un test, puis pendant sa pause de fin, accepté après 3 jours calmes', () => {
    const ch = run([0, 1, 2])
    expect(canStartChallenge([entry(ch)], calmLong, at(1, 13))).toMatchObject({ ok: false, reason: 'busy' })
    const shortCalm = [...calmBefore, gut(3, 'calm')]
    expect(canStartChallenge([entry(ch)], shortCalm, at(3, 22))).toMatchObject({ ok: false, reason: 'busy' })
    expect(canStartChallenge([entry(ch)], calmLong, at(5, 22))).toMatchObject({ ok: true })
  })

  it('refusé pendant une pause pour jours sautés', () => {
    expect(canStartChallenge([entry(run([0]))], calmLong, at(4, 22))).toMatchObject({ ok: false, reason: 'busy' })
  })

  it('un test abandonné ne bloque plus', () => {
    const ch = { ...run([0]), abandonedAt: at(1).toISOString() }
    expect(canStartChallenge([entry(ch)], calmLong, at(1, 22))).toMatchObject({ ok: true })
  })
})

describe('résultats par groupe', () => {
  const calmLong = [...calmBefore, ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => gut(d, 'calm'))]

  it('fructanes : le verdict vaut pour l’aliment seulement', () => {
    const r = groupResults([entry(run([0, 1, 2]))], calmLong, at(10, 22))
    expect(r.fructans.verdict).toBeNull()
    expect(r.fructans.byFood).toEqual({ wheat: expect.objectContaining({ id: 'tolerated' }) })
  })

  it('lactose : le verdict vaut pour le groupe ; combinaisons après 2 groupes bien tolérés', () => {
    const lactose = run([0, 1, 2], calmLong, { group: 'lactose', food: 'milk' })
    const gos = run([6, 7, 8], calmLong, { group: 'gos', food: 'chickpeas' })
    const one = groupResults([entry(lactose)], calmLong, at(10, 22))
    expect(one.lactose.verdict).toMatchObject({ id: 'tolerated' })
    expect(combinationsAvailable(one)).toBe(false)
    const two = groupResults([entry(lactose), entry(gos)], calmLong, at(10, 22))
    expect(combinationsAvailable(two)).toBe(true)
  })

  it('un test en cours ne donne aucun verdict', () => {
    expect(groupResults([entry(run([0]))], calmLong, at(0, 20)).fructans.byFood).toEqual({})
  })

  it('le dernier test d’un aliment l’emporte', () => {
    const notes = [...calmLong, gut(0, 'pain', 18, null)]
    let first = run([0], notes, { group: 'lactose', food: 'milk' })
    first = answerTolerable(first, notes, false, at(0, 19))
    const second = run([6, 7, 8], notes, { group: 'lactose', food: 'milk' })
    expect(groupResults([entry(second), entry(first)], notes, at(10, 22)).lactose.verdict).toMatchObject({ id: 'tolerated' })
  })
})

describe('sauvegarde', () => {
  it('un test passe l’export / import tel quel (aucune migration)', () => {
    const ch = run([0, 1])
    const { entries, invalid } = parseBackup(JSON.stringify({ entries: [entry(ch), gut(0, 'calm')] }))
    expect(invalid).toBe(0)
    expect(entries[0]).toMatchObject({ type: FODMAP_CHALLENGE_TYPE, payload: ch })
  })

  it('un ancien fichier sans test reste lisible et ne donne aucun résultat', () => {
    const { entries } = parseBackup(JSON.stringify({ entries: [gut(0, 'calm')] }))
    expect(canStartChallenge(entries, entries, at(0, 22))).toMatchObject({ reason: 'not_calm' })
    expect(groupResults(entries, entries).lactose).toEqual({ verdict: null, byFood: {} })
  })
})

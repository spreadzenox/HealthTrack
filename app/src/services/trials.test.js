import { describe, it, expect } from 'vitest'
import { createTrial, instruction, trialStatus, habitStatus, bilanWords, proposal, TRIAL_DAYS, homeTrial, lanterns, pilouSays } from './trials'

const sleep = { key: 'sleepMinutes', label: 'Sommeil', theme: 'sleep', outcome: 'wellbeing', effect: 0.4, center: 420, usualChange: { amount: 30, unit: 'min', text: '30 min de sommeil de plus' } }
const START = new Date(2026, 10, 1, 9)
const seq = (vals) => { let i = 0; return () => vals[i++ % vals.length] }

describe('Essais (ORG-8)', () => {
  it('REFONTE-6c-2 : 10 jours tirés au sort, 5 avec et 5 sans ; la consigne d’après la piste', () => {
    const t = createTrial(sleep, { now: START, rng: seq([0.3, 0.7, 0.1, 0.9]) })
    expect(TRIAL_DAYS).toBe(10)
    expect(t.schedule).toHaveLength(10)
    expect(t.schedule.filter((d) => d.with)).toHaveLength(5)
    expect(t.schedule[9].date).toBe('2026-11-10')
    expect(proposal(sleep).detail).toBe('Lien repéré : +0,4 point de bien-être pour 30 min de sommeil de plus. 5 jours avec, 5 jours sans, tirés au sort.')
    expect(t.schedule[0].date).toBe('2026-11-01')
    expect(instruction(t)).toBe('Dormir au moins 7 h 30')
    expect(instruction(t, false)).toBe('Comme d’habitude')
    expect(instruction(createTrial({ ...sleep, key: 'fiber_g', label: 'Fibres' }, { now: START }))).toBe('Un peu plus de fibres que d’habitude')
    expect(instruction(createTrial({ ...sleep, key: 'alcohol_g', label: 'Alcool', effect: -0.5 }, { now: START }))).toBe('Un peu moins d’alcool que d’habitude')
  })

  it('la tenue vient des données ; la question seulement si elles manquent', () => {
    const t = { ...createTrial(sleep, { now: START }), schedule: [...Array(14)].map((_, i) => ({ date: `2026-11-${String(i + 1).padStart(2, '0')}`, with: i % 2 === 0 })) }
    const summaries = new Map([['2026-11-01', { sleepMinutes: 460 }], ['2026-11-02', { sleepMinutes: 470 }]])
    const s = trialStatus(t, { summaries, now: new Date(2026, 10, 4, 10) })
    expect(s.calendar[0].held).toBe(true)
    expect(s.calendar[1].held).toBe(false)
    expect(s.ask).toMatchObject({ date: '2026-11-03', missing: 'Nous n’avons pas reçu vos données de sommeil pour hier soir.' })
    expect(s.ask.question).toBe('Hier, dormir au moins 7 h 30 : c’était tenu ?')
    expect(trialStatus({ ...t, answers: { '2026-11-03': true } }, { summaries, now: new Date(2026, 10, 4, 10) }).ask).toBeNull()
  })

  it('résultat en cours : écart et fourchette dès 3 lendemains de chaque sorte ; verdict à la fin', () => {
    const t = { ...createTrial(sleep, { now: START }), schedule: [...Array(14)].map((_, i) => ({ date: `2026-11-${String(i + 1).padStart(2, '0')}`, with: i % 2 === 0 })) }
    const outcome = new Map()
    for (let d = 2; d <= 15; d += 1) outcome.set(`2026-11-${String(d).padStart(2, '0')}`, d % 2 === 0 ? 4 + (d % 4) * 0.05 : 2.5 + (d % 3) * 0.05)
    const mid = trialStatus(t, { outcome, now: new Date(2026, 10, 5, 10) })
    expect(mid.result.diff).toBeNull()
    const end = trialStatus(t, { outcome, now: new Date(2026, 10, 17, 10) })
    expect(end.done).toBe(true)
    expect(end.result.diff).toBeGreaterThan(1)
    expect(end.bilan).toBe('yes')
    const flat = new Map([...outcome].map(([k]) => [k, 3]))
    expect(trialStatus(t, { outcome: flat, now: new Date(2026, 10, 17, 10) }).bilan).toBe('none')
  })

  describe('REFONTE-6c-2 : le défi doux et son bilan en mots', () => {
    const ten = { ...createTrial(sleep, { now: START }), schedule: [...Array(10)].map((_, i) => ({ date: `2026-11-${String(i + 1).padStart(2, '0')}`, with: i % 2 === 0 })) }
    const END = new Date(2026, 10, 12, 10)
    const series = (withV, withoutV) => {
      const m = new Map()
      for (let d = 2; d <= 11; d += 1) m.set(`2026-11-${String(d).padStart(2, '0')}`, (d % 2 === 0 ? withV : withoutV) + (d % 4) * 0.05)
      return m
    }

    it('en cours : le jour sur 10, les jours avec tenus sur 5 ; un jour manqué ne retire rien', () => {
      const summaries = new Map([['2026-11-01', { sleepMinutes: 460 }], ['2026-11-03', { sleepMinutes: 380 }], ['2026-11-05', { sleepMinutes: 455 }]])
      const s = trialStatus(ten, { summaries, now: new Date(2026, 10, 6, 10) })
      expect(s).toMatchObject({ dayIndex: 6, total: 10, goal: 5, kept: 2, missed: 1, done: false, bilan: null })
      // un ancien essai de 14 jours garde son calendrier
      const old = { ...ten, schedule: [...Array(14)].map((_, i) => ({ date: `2026-11-${String(i + 1).padStart(2, '0')}`, with: i % 2 === 0 })) }
      expect(trialStatus(old, { now: new Date(2026, 10, 6, 10) })).toMatchObject({ total: 14, goal: 7 })
    })

    it('fini, mieux les lendemains des jours avec : « Plutôt oui », à confirmer', () => {
      const s = trialStatus(ten, { outcome: series(4, 2.5), now: END })
      expect(s).toMatchObject({ done: true, bilan: 'yes', confirm: true })
      expect(bilanWords(s)).toEqual({ title: 'Plutôt oui', note: 'À confirmer sur plus de jours : 5 jours avec, c’est encore peu.' })
    })

    it('fini, moins bien les lendemains des jours avec : « Plutôt non », jamais « vérifié »', () => {
      const s = trialStatus(ten, { outcome: series(2.5, 4), now: END })
      expect(s.bilan).toBe('no')
      expect(bilanWords(s).title).toBe('Plutôt non')
    })

    it('fini, fourchette à cheval sur zéro : « Pas de différence nette »', () => {
      const s = trialStatus(ten, { outcome: series(3, 3), now: END })
      expect(s.bilan).toBe('none')
      expect(bilanWords(s).title).toBe('Pas de différence nette')
    })

    it('fini avec moins de 3 lendemains d’une sorte : « Trop peu de jours pour conclure », sans « à confirmer »', () => {
      const outcome = new Map([['2026-11-02', 4], ['2026-11-03', 3], ['2026-11-04', 4]])
      const s = trialStatus({ ...ten, endedAt: new Date(2026, 10, 5).toISOString() }, { outcome, now: new Date(2026, 10, 6, 10) })
      expect(s).toMatchObject({ done: true, bilan: 'too_few', confirm: false })
      expect(bilanWords(s)).toEqual({ title: 'Trop peu de jours pour conclure', note: 'Vous pouvez réessayer quand vous voulez.' })
    })

    it('dix jours avec ou plus : plus de « à confirmer »', () => {
      const long = { ...ten, schedule: [...Array(20)].map((_, i) => ({ date: `2026-11-${String(i + 1).padStart(2, '0')}`, with: i % 2 === 0 })) }
      const m = new Map()
      for (let d = 2; d <= 21; d += 1) m.set(`2026-11-${String(d).padStart(2, '0')}`, (d % 2 === 0 ? 4 : 2.5) + (d % 4) * 0.05)
      const s = trialStatus(long, { outcome: m, now: new Date(2026, 10, 23, 10) })
      expect(s).toMatchObject({ bilan: 'yes', confirm: false })
      expect(bilanWords(s).note).toBeNull()
    })
  })

  it('habitude : « vous vous éloignez » à 9 jours sur 14 non tenus, au plus une fois par mois', () => {
    const t = { ...createTrial(sleep, { now: START }), kept: true }
    const summaries = new Map()
    for (let d = 1; d <= 14; d += 1) summaries.set(`2026-11-${String(d).padStart(2, '0')}`, { sleepMinutes: d <= 10 ? 380 : 460 })
    const now = new Date(2026, 10, 15, 10)
    expect(habitStatus(t, { summaries, now }).drifting).toBe(false) // a repris hier
    for (let d = 11; d <= 14; d += 1) summaries.set(`2026-11-${d}`, { sleepMinutes: 380 })
    expect(habitStatus(t, { summaries, now }).drifting).toBe(true)
    expect(habitStatus({ ...t, nudgedAt: new Date(2026, 10, 10).toISOString() }, { summaries, now }).drifting).toBe(false)
  })
})

describe('UPG-1 : l’essai en cours sur la carte Agir de l’Accueil', () => {
  const ten = { ...createTrial(sleep, { now: START }), schedule: [...Array(10)].map((_, i) => ({ date: `2026-11-${String(i + 1).padStart(2, '0')}`, with: i % 2 === 0 })) }
  const row = (id, payload) => ({ id, type: 'trial', at: START.toISOString(), payload })

  it('sans essai en cours : rien (la carte garde « Vérifier une piste par un essai »)', () => {
    expect(homeTrial([], new Date(2026, 10, 4, 10))).toBeNull()
    expect(homeTrial([row(1, ten)], new Date(2026, 10, 20, 10))).toBeNull()
    expect(homeTrial([row(1, { ...ten, removedAt: '2026-11-03' })], new Date(2026, 10, 4, 10))).toBeNull()
    expect(homeTrial([row(1, { ...ten, kept: true, endedAt: '2026-11-03' })], new Date(2026, 10, 4, 10))).toBeNull()
    expect(homeTrial([{ id: 2, type: 'habit', payload: { habit: 'reading' } }], new Date(2026, 10, 4, 10))).toBeNull()
  })

  it('un jour « avec » : la consigne et le jour ; il ouvre la page de l’essai', () => {
    expect(homeTrial([row(7, ten)], new Date(2026, 10, 3, 10))).toEqual({
      to: '/agir/essai/7', title: 'Dormir au moins 7 h 30', detail: 'Essai · jour 3 sur 10 · aujourd’hui, jour avec', withToday: true,
    })
  })

  it('un jour « sans » : comme d’habitude ; deux essais : le plus avancé, et Agir pour voir les deux', () => {
    expect(homeTrial([row(7, ten)], new Date(2026, 10, 4, 10))).toMatchObject({ detail: 'Essai · jour 4 sur 10 · aujourd’hui, jour sans', withToday: false })
    const later = { ...ten, startedAt: '2026-11-02T09:00:00.000Z', schedule: ten.schedule.map((d, i) => ({ date: `2026-11-${String(i + 2).padStart(2, '0')}`, with: !d.with })) }
    const two = homeTrial([row(8, later), row(7, ten)], new Date(2026, 10, 3, 10))
    expect(two).toMatchObject({ to: '/agir', title: 'Dormir au moins 7 h 30', detail: '2 essais en cours · jour 3 sur 10 · aujourd’hui, jour avec' })
  })

  describe('LANT-1 : une lanterne par jour avec', () => {
    const days = (n) => [...Array(n)].map((_, i) => ({ date: `2026-11-${String(i + 1).padStart(2, '0')}`, with: i % 2 === 0 }))
    const t10 = { ...createTrial(sleep, { now: START }), schedule: days(10) }

    it('5 jours avec : 2 tenus, 1 pas tenu, 2 à venir → allumée, allumée, éteinte, en attente, en attente', () => {
      const summaries = new Map([['2026-11-01', { sleepMinutes: 460 }], ['2026-11-03', { sleepMinutes: 470 }], ['2026-11-05', { sleepMinutes: 380 }]])
      const s = trialStatus(t10, { summaries, now: new Date(2026, 10, 6, 10) })
      expect(lanterns(s).map((l) => l.state)).toEqual(['lit', 'lit', 'out', 'pending', 'pending'])
      expect(lanterns(s).map((l) => l.date)).toEqual(['2026-11-01', '2026-11-03', '2026-11-05', '2026-11-07', '2026-11-09'])
    })

    it('un essai ancien de 14 jours (7 avec) garde ses 7 lanternes ; une tenue inconnue reste en attente', () => {
      const s = trialStatus({ ...t10, schedule: days(14) }, { now: new Date(2026, 10, 4, 10) })
      const l = lanterns(s)
      expect(l).toHaveLength(7)
      expect(l[0].state).toBe('pending')
    })
  })
})

describe('LANT-2 : ce que dit Pilou sur la page du défi', () => {
  const st = (over) => ({ done: true, bilan: 'yes', kept: 5, ...over })
  it('au bilan, il salue l’effort : même bulle et même geste quel que soit le résultat', () => {
    const yes = pilouSays(st({ bilan: 'yes' }))
    expect(yes).toEqual({ expr: 'content', move: 'nod', text: 'Bravo pour vos 5 jours avec.' })
    for (const bilan of ['no', 'none', 'too_few']) expect(pilouSays(st({ bilan }))).toEqual(yes)
  })
  it('au bilan : un seul jour tenu, ou aucun', () => {
    expect(pilouSays(st({ kept: 1 })).text).toBe('Bravo pour votre jour avec.')
    expect(pilouSays(st({ kept: 0 })).text).toBe('Merci d’avoir essayé.')
  })
  it('juste après « Commencer » : un saut et la promesse des lanternes ; ensuite il attend, sans bulle', () => {
    expect(pilouSays({ done: false }, { started: true })).toEqual({ expr: 'content', move: 'hop', text: 'C’est parti ! Chaque jour avec tenu allume une lanterne.' })
    expect(pilouSays({ done: false })).toEqual({ expr: 'tranquille', move: 'none', text: null })
  })
})

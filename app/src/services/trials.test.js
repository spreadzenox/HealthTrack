import { describe, it, expect } from 'vitest'
import { createTrial, instruction, trialStatus, habitStatus, bilanWords, proposal, TRIAL_DAYS, homeTrial, homeActIdle, lanterns, pilouSays, morningLantern, withTodayLateScreen, trialOutcome, sleepOutcome, sleepScreenPiste, SLEEP_PISTE_MIN } from './trials'

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

  it('POLISH-SIM-150 : une cible arrondie (pas à la centaine, durées à 5 min), sans fausse précision', () => {
    const steps = { key: 'steps', label: 'Pas', theme: 'activity', outcome: 'wellbeing', effect: 0.3, center: 6683.4, usualChange: { amount: 2000, unit: 'pas', text: '2 000 pas de plus' } }
    expect(createTrial(steps, { now: START }).threshold).toBe(8700)
    expect(instruction(createTrial(steps, { now: START }))).toBe('Faire au moins 8\u202f700 pas')
    expect(createTrial({ ...steps, effect: -0.3 }, { now: START }).threshold).toBe(4700)
    expect(createTrial({ ...sleep, center: 423 }, { now: START }).threshold).toBe(455)
    const screen = { key: 'screen_minutes', label: 'Temps d’écran', theme: 'context', outcome: 'wellbeing', effect: -0.2, center: 187, usualChange: { amount: 30, unit: 'min', text: '30 min d’écran de plus' } }
    expect(createTrial(screen, { now: START }).threshold).toBe(155)
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

  it('POLISH-SIM-176 : sans mesure, les jours manqués se rattrapent jusqu’à 3 jours en arrière, un à la fois', () => {
    const t = { ...createTrial(sleep, { now: START }), schedule: [...Array(14)].map((_, i) => ({ date: `2026-11-${String(i + 1).padStart(2, '0')}`, with: i % 2 === 0 })) }
    const at = new Date(2026, 10, 5, 10)
    const s1 = trialStatus(t, { now: at })
    expect(s1.ask).toMatchObject({ date: '2026-11-04', when: 'hier', question: 'Hier, comme d’habitude : c’était tenu ?' })
    expect(s1.ask.missing).toBe('Nous n’avons pas reçu vos données de sommeil pour hier soir.')
    const s2 = trialStatus({ ...t, answers: { '2026-11-04': true } }, { now: at })
    expect(s2.ask).toMatchObject({ date: '2026-11-03', when: 'avant-hier', question: 'Avant-hier, dormir au moins 7 h 30 : c’était tenu ?' })
    expect(s2.ask.missing).toBe('Nous n’avons pas reçu vos données de sommeil pour cette nuit-là.')
    const s3 = trialStatus({ ...t, answers: { '2026-11-04': true, '2026-11-03': false } }, { now: at })
    expect(s3.ask).toMatchObject({ date: '2026-11-02', when: 'lundi', question: 'Lundi, comme d’habitude : c’était tenu ?' })
    // Au-delà de 3 jours, plus de question : le 1er reste inconnu
    expect(trialStatus({ ...t, answers: { '2026-11-04': true, '2026-11-03': false, '2026-11-02': true } }, { now: at }).ask).toBeNull()
    // Un jour dont la mesure est arrivée ne se demande pas
    const summaries = new Map([['2026-11-04', { sleepMinutes: 400 }]])
    expect(trialStatus(t, { summaries, now: at }).ask.date).toBe('2026-11-03')
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
      expect(bilanWords(s)).toEqual({ title: 'Plutôt oui', note: 'À confirmer sur plus de jours : 5 lendemains mesurés, c’est encore peu.' })
      // LANT-2 : la réserve compte les lendemains mesurés, la bulle de Pilou les jours tenus : deux mots différents
      expect(bilanWords(s).note).not.toMatch(/jours avec/)
    })

    it('POLISH-ESSAI-SANS : les lendemains comptent par calendrier, que le jour ait été tenu ou non', () => {
      // jours sans (2, 4) au-dessus du seuil : « comme d'habitude » était la consigne, ils comptent quand même ;
      // jour avec (3) manqué : il compte aussi (le tirage au sort protège, pas la tenue)
      const summaries = new Map([['2026-11-01', { sleepMinutes: 470 }], ['2026-11-02', { sleepMinutes: 479 }], ['2026-11-03', { sleepMinutes: 380 }], ['2026-11-04', { sleepMinutes: 461 }]])
      const outcome = new Map([['2026-11-02', 4], ['2026-11-03', 3], ['2026-11-04', 3.5], ['2026-11-05', 2.5]])
      const s = trialStatus(ten, { summaries, outcome, now: new Date(2026, 10, 5, 10) })
      expect(s.calendar.slice(0, 4).map((d) => d.held)).toEqual([true, false, false, false])
      expect(s.result.with).toEqual([4, 3.5])
      expect(s.result.without).toEqual([3, 2.5])
      // la tenue reste pour les lanternes et « Consigne tenue »
      expect(s).toMatchObject({ kept: 1, missed: 1 })
    })

    it('POLISH-ESSAI-SANS : tout tenu, bilan inchangé', () => {
      const summaries = new Map()
      for (let d = 1; d <= 10; d += 1) summaries.set(`2026-11-${String(d).padStart(2, '0')}`, { sleepMinutes: d % 2 === 1 ? 470 : 420 })
      const s = trialStatus(ten, { summaries, outcome: series(4, 2.5), now: END })
      expect(s).toMatchObject({ bilan: 'yes', kept: 5, missed: 0 })
      expect(s.result.with).toHaveLength(5)
      expect(s.result.without).toHaveLength(5)
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

  it('sans essai en cours, le sous-titre dit l’état de la page Agir (POLISH-SIM-167)', () => {
    expect(homeActIdle([], null)).toBe('Aucune piste à tester pour l’instant')
    expect(homeActIdle([], { gut: [], levers: [] })).toBe('Aucune piste à tester pour l’instant')
    expect(homeActIdle([row(1, { ...ten, removedAt: '2026-11-03' })], null)).toBe('Aucune piste à tester pour l’instant')
    expect(homeActIdle([], { gut: [], levers: ['Dormir plus'] })).toBe('1 piste à tester')
    expect(homeActIdle([], { gut: ['Oignon → digestion'], levers: ['Dormir plus', 'Marcher'] })).toBe('3 pistes à tester')
    // un essai fini ou une habitude gardée : la page n'est pas vide
    expect(homeActIdle([row(1, ten)], null)).toBe('Vérifier une piste par un essai')
  })

  it('un jour « avec » : la consigne et le jour ; il ouvre la page de l’essai', () => {
    expect(homeTrial([row(7, ten)], new Date(2026, 10, 3, 10))).toEqual({
      to: '/agir/essai/7', title: 'Dormir au moins 7 h 30', detail: 'Essai · jour 3 sur 10 · aujourd’hui, jour avec', withToday: true,
    })
  })

  it('POLISH-SIM-120 : filtré par objectif suivi (un ancien essai sans objectif compte pour le bien-être)', () => {
    const now = new Date(2026, 10, 3, 10)
    const gut = { ...ten, factor: { ...ten.factor, outcome: 'digestion' } }
    expect(homeTrial([row(7, ten)], now, { outcome: 'wellbeing' })).toMatchObject({ to: '/agir/essai/7' })
    expect(homeTrial([row(7, ten)], now, { outcome: 'digestion' })).toBeNull()
    expect(homeTrial([row(7, ten), row(9, gut)], now, { outcome: 'digestion' })).toMatchObject({ to: '/agir/essai/9', detail: 'Essai · jour 3 sur 10 · aujourd’hui, jour avec' })
    const old = { ...ten, factor: { ...ten.factor, outcome: undefined } }
    expect(homeTrial([row(5, old)], now, { outcome: 'wellbeing' })).toMatchObject({ to: '/agir/essai/5' })
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
    expect(yes).toEqual({ expr: 'content', move: 'nod', text: 'Bravo pour vos 5 jours réussis.' })
    for (const bilan of ['no', 'none', 'too_few']) expect(pilouSays(st({ bilan }))).toEqual(yes)
  })
  it('au bilan : un seul jour tenu, ou aucun', () => {
    expect(pilouSays(st({ kept: 1 })).text).toBe('Bravo pour votre jour réussi.')
    expect(pilouSays(st({ kept: 0 })).text).toBe('Merci d’avoir essayé.')
  })
  it('juste après « Commencer » : un saut et la promesse des lanternes ; ensuite il attend, sans bulle', () => {
    expect(pilouSays({ done: false }, { started: true })).toEqual({ expr: 'content', move: 'hop', text: 'C’est parti ! Chaque jour réussi allume une lanterne.' })
    expect(pilouSays({ done: false })).toEqual({ expr: 'tranquille', move: 'none', text: null })
  })
  it('LANT-2b : le lendemain d’un jour avec manqué, il hausse doucement les épaules en souriant ; rien ne repart à zéro', () => {
    const cal = (held, w = true) => [{ date: '2026-11-03', with: w, held }, { date: '2026-11-04', with: false, held: null, today: true }]
    expect(pilouSays({ done: false, calendar: cal(false) })).toEqual({ expr: 'content', move: 'shrug', text: 'Pas grave : la prochaine lanterne vous attend.' })
    expect(pilouSays({ done: false, calendar: cal(true) }).move).toBe('none')
    expect(pilouSays({ done: false, calendar: cal(null) }).move).toBe('none')
    expect(pilouSays({ done: false, calendar: cal(false, false) }).move).toBe('none')
    // juste après « Commencer », le saut passe avant
    expect(pilouSays({ done: false, calendar: cal(false) }, { started: true }).move).toBe('hop')
  })
})

describe('REFONTE-4b-3 : essai sur une habitude', () => {
  const med = { key: 'habit_meditation', label: 'Méditation', theme: 'habit', outcome: 'wellbeing', effect: 0.6, center: 0.4, usualChange: { amount: 1, text: 'un jour « oui »' } }
  const sched = [...Array(4)].map((_, i) => ({ date: `2026-11-0${i + 1}`, with: i % 2 === 0 }))

  it('la consigne nomme l’habitude, sans quantité', () => {
    const t = createTrial(med, { now: START })
    expect(t.threshold).toBeNull()
    expect(instruction(t)).toBe('Méditation')
    expect(instruction(t, false)).toBe('Comme d’habitude')
    expect(instruction(createTrial({ ...med, key: 'habit_stretching', label: 'Étirements', effect: -0.4 }, { now: START }))).toBe('Pas d’étirements')
    expect(proposal(med).title).toBe('Méditation')
  })

  it('la tenue vient de la réponse de Ma journée ; la question seulement sans réponse', () => {
    const t = { ...createTrial(med, { now: START }), schedule: sched }
    const summaries = new Map([['2026-11-01', { habits: { meditation: true } }], ['2026-11-02', { habits: { meditation: false } }], ['2026-11-03', { habits: { meditation: false } }]])
    const s = trialStatus(t, { summaries, now: new Date(2026, 10, 4, 10) })
    expect(s.calendar.map((d) => d.held)).toEqual([true, true, false, null])
    expect(s.calendar[0].fromData).toBe(true)
    expect(s.ask).toBeNull()
    const s2 = trialStatus(t, { summaries: new Map([['2026-11-01', { habits: { meditation: true } }]]), now: new Date(2026, 10, 4, 10) })
    expect(s2.ask.question).toBe('Hier, méditation : c’était tenu ?')
    expect(s2.ask.missing).toBeNull()
  })

  it('une habitude gardée se lit dans Ma journée', () => {
    const t = { ...createTrial(med, { now: START }), kept: true }
    const summaries = new Map([['2026-11-13', { habits: { meditation: true } }]])
    const st = habitStatus(t, { summaries, now: new Date(2026, 10, 14, 10) })
    expect(st.days.at(-1)).toEqual({ date: '2026-11-13', held: true })
  })
})

describe('LANT-3 : la lanterne du matin sur l’îlot', () => {
  const sleep = { key: 'sleepMinutes', label: 'Sommeil', outcome: 'wellbeing', effect: 0.4, direction: 'more', threshold: 450 }
  const START = new Date(2026, 10, 1, 9)
  const days = [...Array(10)].map((_, i) => ({ date: `2026-11-${String(i + 1).padStart(2, '0')}`, with: i % 2 === 0 }))
  const t10 = { ...createTrial(sleep, { now: START }), threshold: 450, direction: 'more', schedule: days }
  const row = (id, payload) => ({ id, type: 'trial', at: START.toISOString(), payload })

  it('hier, jour « avec » tenu d’après la montre : la lanterne s’allume ce matin (une clé par jour)', () => {
    const summaries = new Map([['2026-11-03', { sleepMinutes: 470 }]])
    expect(morningLantern([row(7, t10)], { summaries, now: new Date(2026, 10, 4, 8) })).toEqual({ date: '2026-11-03', key: '2026-11-04' })
  })

  it('hier tenu d’après la réponse « c’était tenu ? » (sans mesure)', () => {
    const answered = { ...t10, answers: { '2026-11-03': true } }
    expect(morningLantern([row(7, answered)], { now: new Date(2026, 10, 4, 8) })).toMatchObject({ date: '2026-11-03' })
  })

  it('rien : hier pas tenu, tenue inconnue, jour « sans », essai retiré ou pas d’essai', () => {
    const now = new Date(2026, 10, 4, 8)
    expect(morningLantern([row(7, t10)], { summaries: new Map([['2026-11-03', { sleepMinutes: 400 }]]), now })).toBeNull()
    expect(morningLantern([row(7, t10)], { now })).toBeNull()
    expect(morningLantern([row(7, t10)], { summaries: new Map([['2026-11-04', { sleepMinutes: 470 }]]), now: new Date(2026, 10, 5, 8) })).toBeNull()
    expect(morningLantern([row(7, { ...t10, removedAt: '2026-11-03' })], { summaries: new Map([['2026-11-03', { sleepMinutes: 470 }]]), now })).toBeNull()
    expect(morningLantern([], { now })).toBeNull()
    expect(morningLantern(null, { now })).toBeNull()
  })

  it('le dernier jour « avec » d’un essai qui vient de finir allume encore sa lanterne le lendemain', () => {
    const last = { ...t10, schedule: days.map((d, i) => ({ ...d, with: i === 9 })) }
    const summaries = new Map([['2026-11-10', { sleepMinutes: 470 }]])
    expect(morningLantern([row(7, last)], { summaries, now: new Date(2026, 10, 11, 8) })).toMatchObject({ date: '2026-11-10' })
  })
})

describe('REFONTE-6c-7 (SPEC comprendre § 6.5 et § 7) : la piste « Écran tard » se teste soir par soir', () => {
  const late = { key: 'screen_late_minutes', label: 'Écran tard (veille au soir, 22 h–4 h)', theme: 'context', outcome: 'wellbeing', effect: -0.5, center: 45, usualChange: { amount: 30, unit: 'min', text: '30 min d’écran le soir de plus' } }
  const sched = [...Array(4)].map((_, i) => ({ date: `2026-11-0${i + 1}`, with: i % 2 === 0 }))

  it('la consigne : « Pas d’écran après 22 h », la même mesure que le reste de l’app (moins de 30 min)', () => {
    const t = createTrial(late, { now: START })
    expect(instruction(t)).toBe('Pas d’écran après 22 h')
    expect(instruction(t, false)).toBe('Comme d’habitude')
    expect(t.threshold).toBe(30)
    expect(proposal(late).title).toBe('Pas d’écran après 22 h')
    expect(instruction(createTrial({ ...late, effect: 0.3 }, { now: START }))).toBe('Écran après 22 h permis')
  })

  it('la tenue d’un soir se lit au résumé du lendemain (écran de 22 h à 4 h rangé au jour du réveil)', () => {
    const t = { ...createTrial(late, { now: START }), schedule: sched }
    // soir du 1er (avec) : 10 min → tenu ; soir du 2 (sans) : 50 min → tenu (comme d'habitude) ; soir du 3 (avec) : 40 min → pas tenu
    const summaries = new Map([['2026-11-02', { lateScreenMinutes: 10 }], ['2026-11-03', { lateScreenMinutes: 50 }], ['2026-11-04', { lateScreenMinutes: 40 }]])
    const s = trialStatus(t, { summaries, now: new Date(2026, 10, 4, 10) })
    expect(s.calendar.map((d) => d.held)).toEqual([true, true, false, null])
    expect(s.ask).toBeNull()
  })

  it('sans écran mesuré : « Hier soir, pas d’écran après 22 h ? » se demande le matin', () => {
    const t = { ...createTrial(late, { now: START }), schedule: sched }
    const s = trialStatus(t, { summaries: new Map([['2026-11-02', { lateScreenMinutes: 0 }], ['2026-11-03', { lateScreenMinutes: 0 }]]), now: new Date(2026, 10, 4, 10) })
    expect(s.ask).toMatchObject({ date: '2026-11-03', question: 'Hier, pas d’écran après 22 h : c’était tenu ?', missing: 'Nous n’avons pas reçu votre temps d’écran d’hier soir.' })
  })
})

describe('REFONTE-6c-7 : le soir d’hier se confirme dès ce matin', () => {
  it('l’écran tard de la journée en cours (réglages du téléphone) complète le résumé du jour, une fois 4 h passées', () => {
    const summaries = new Map([['2026-11-03', { lateScreenMinutes: 50 }]])
    const today = { date: '2026-11-04', screenMinutes: 12, lateScreenMinutes: 5 }
    const out = withTodayLateScreen(summaries, today, new Date(2026, 10, 4, 8))
    expect(out.get('2026-11-04')).toEqual({ lateScreenMinutes: 5 })
    expect(out.get('2026-11-03')).toEqual({ lateScreenMinutes: 50 })
    // avant 4 h, la soirée n'est pas finie : rien
    expect(withTodayLateScreen(summaries, today, new Date(2026, 10, 4, 2)).get('2026-11-04')).toBeUndefined()
    // une journée d'un autre jour, ou sans mesure : rien
    expect(withTodayLateScreen(summaries, { ...today, date: '2026-11-03' }, new Date(2026, 10, 4, 8)).get('2026-11-04')).toBeUndefined()
    expect(withTodayLateScreen(summaries, null, new Date(2026, 10, 4, 8)).get('2026-11-04')).toBeUndefined()
    // une entrée déjà enregistrée garde sa valeur
    const kept = withTodayLateScreen(new Map([['2026-11-04', { steps: 300, lateScreenMinutes: 70 }]]), today, new Date(2026, 10, 4, 8))
    expect(kept.get('2026-11-04')).toEqual({ steps: 300, lateScreenMinutes: 70 })
  })
})

describe('REFONTE-6c-9 (SPEC comprendre § 6.5) : la piste « Pas d’écran après 22 h » proposée par l’écart du sommeil', () => {
  const ev = (diff) => ({ late: 420 + diff, other: 420, lateCount: 4, otherCount: 9, diff })

  it('proposée seulement quand les soirs d’écran tard vont avec au moins 10 min de sommeil en moins', () => {
    expect(SLEEP_PISTE_MIN).toBe(10)
    expect(sleepScreenPiste(null)).toBeNull()
    expect(sleepScreenPiste(ev(-9))).toBeNull()
    expect(sleepScreenPiste(ev(25))).toBeNull()
    const f = sleepScreenPiste(ev(-40))
    expect(f).toMatchObject({ key: 'screen_late_minutes', outcome: 'sleep', theme: 'sleep' })
    const t = createTrial(f, { now: START })
    expect(instruction(t)).toBe('Pas d’écran après 22 h')
    expect(t.direction).toBe('less')
    expect(trialOutcome(t)).toBe('sleep')
  })

  it('le résultat suivi : les nuits mesurées, jamais celles que le téléphone déduit de l’écran (règle 5)', () => {
    const summaries = new Map([
      ['2026-11-02', { sleepMinutes: 450 }],
      ['2026-11-03', { sleepMinutes: 380, sleepEstimated: true }],
      ['2026-11-04', { sleepMinutes: 0 }],
      ['2026-11-05', { steps: 4000 }],
    ])
    expect([...sleepOutcome(summaries)]).toEqual([['2026-11-02', 450]])
  })

  it('le bilan compare la nuit qui suit chaque soir avec ou sans écran', () => {
    const t = { ...createTrial(sleepScreenPiste(ev(-40)), { now: START }), schedule: [...Array(6)].map((_, i) => ({ date: `2026-11-0${i + 1}`, with: i % 2 === 0 })) }
    const nights = [470, 400, 460, 410, 480, 395]
    const summaries = new Map(nights.map((m, i) => [`2026-11-0${i + 2}`, { sleepMinutes: m }]))
    const s = trialStatus(t, { summaries, outcome: sleepOutcome(summaries), now: new Date(2026, 10, 8, 10) })
    expect(s.result.with).toEqual([470, 460, 480])
    expect(s.result.diff).toBeCloseTo(470 - 401.67, 1)
  })

  it('un essai sur le sommeil se range sous « Votre bien-être », où vit la famille Sommeil', () => {
    expect(trialOutcome({ factor: { outcome: 'digestion' } })).toBe('digestion')
    expect(trialOutcome({ factor: {} })).toBe('wellbeing')
    const t = createTrial(sleepScreenPiste(ev(-40)), { now: START })
    expect(homeTrial([{ id: 7, type: 'trial', payload: t }], START, { outcome: 'wellbeing' })?.to).toBe('/agir/essai/7')
    expect(homeTrial([{ id: 7, type: 'trial', payload: t }], START, { outcome: 'digestion' })).toBeNull()
  })
})

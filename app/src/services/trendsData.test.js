import { describe, it, expect } from 'vitest'
import { buildTrendSeries, periodDates, canAdd, unitsOf, detailSource, trendMeasure } from './trendsData'

const NOW = new Date(2026, 10, 7, 20)
const band = (mean) => ({ mean, low: mean - 0.5, high: mean + 0.5, sd: 0.4 })
const state = (date, { future = false, observed = false } = {}) => ({
  date, future, observed: { wellbeing: observed, digestion: false },
  wellbeing: band(3), digestion: band(3.5), digestionOwn: band(3.6),
})

describe('Tendances (ORG-3)', () => {
  it('Semaine : 7 jours jusqu’à aujourd’hui et 3 jours à venir ; Mois : 30 et 7', () => {
    const w = periodDates('week', NOW)
    expect(w.dates).toHaveLength(10)
    expect(w.dates[6]).toBe('2026-11-07')
    expect(periodDates('month', NOW).dates).toHaveLength(37)
  })

  it('bien-être : chaque jour sa fourchette, plein seulement les jours notés ; l’attendu seulement dans le futur', () => {
    const states = { showDigestiveCurve: false, days: [state('2026-11-05'), state('2026-11-06', { observed: true }), state('2026-11-07'), state('2026-11-08', { future: true })] }
    const r = buildTrendSeries({ states, period: 'week', now: NOW })
    const wb = r.series.wellbeing
    expect(wb.map((p) => p.date)).toEqual(['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'])
    expect(wb.map((p) => p.observed)).toEqual([false, true, false, false])
    expect(wb.filter((p) => p.future).map((p) => p.date)).toEqual(['2026-11-08'])
    expect(wb[0].low).toBeLessThan(wb[0].value)
    expect(r.available).toContain('wellbeing')
  })

  it('POLISH-SIM-147 : dit si un état a déjà été observé (une note ou une lecture), sinon pas de chiffre du jour', () => {
    const none = { showDigestiveCurve: true, days: [state('2026-11-06'), state('2026-11-07')] }
    expect(buildTrendSeries({ states: none, period: 'week', now: NOW }).observedAny).toEqual({ wellbeing: false, digestion: false })
    const one = { showDigestiveCurve: true, days: [state('2026-11-06', { observed: true }), state('2026-11-07')] }
    expect(buildTrendSeries({ states: one, period: 'week', now: NOW }).observedAny.wellbeing).toBe(true)
    expect(buildTrendSeries({ period: 'week', now: NOW }).observedAny).toEqual({ wellbeing: false, digestion: false })
  })

  it('confort digestif : sans courbe validée, seulement les jours notés (information digestive seule)', () => {
    const days = [state('2026-11-06'), { ...state('2026-11-07'), observed: { wellbeing: false, digestion: true } }]
    const r = buildTrendSeries({ states: { showDigestiveCurve: false, days }, period: 'week', now: NOW })
    expect(r.series.digestion.map((p) => p.date)).toEqual(['2026-11-07'])
  })

  it('POLISH-NOTE-LOSANGE : la note du jour, telle que donnée, quand l’estimation s’en écarte', () => {
    const pain = { ...state('2026-11-06'), observed: { wellbeing: true, digestion: true },
      noted: { wellbeing: 3.75, digestion: 'pain' }, wellbeing: band(3.8), digestionOwn: band(1.9) }
    const calm = { ...state('2026-11-07'), observed: { wellbeing: false, digestion: true },
      noted: { wellbeing: null, digestion: 'calm' }, digestionOwn: band(5) }
    const r = buildTrendSeries({ states: { showDigestiveCurve: false, days: [state('2026-11-05'), pain, calm] }, period: 'week', now: NOW })
    const gut = r.series.digestion
    expect(gut.map((p) => p.date)).toEqual(['2026-11-06', '2026-11-07'])
    // douleur = 1 (même échelle que « vous avez noté « douleur » (1) »), l'estimation reste la ligne
    expect(gut[0].note).toBe(1)
    expect(gut[0].value).toBeGreaterThan(2)
    // calme = 5 et l'estimation y est : pas de second point
    expect(gut[1].note).toBeUndefined()
    // bien-être : note 3,75 en interne (affichée 4), estimation affichée 4,04 : trop proche pour un second point
    expect(r.series.wellbeing.find((p) => p.date === '2026-11-06').note).toBeUndefined()
    expect(r.series.wellbeing.find((p) => p.date === '2026-11-05').note).toBeUndefined()
  })

  it('POLISH-NOTE-LOSANGE : une note de bien-être loin de l’estimation (visage) a son point', () => {
    const d = { ...state('2026-11-06'), observed: { wellbeing: true, digestion: false },
      noted: { wellbeing: 5, digestion: null }, wellbeing: band(3) }
    const r = buildTrendSeries({ states: { showDigestiveCurve: false, days: [d] }, period: 'week', now: NOW })
    expect(r.series.wellbeing[0].note).toBe(5)
  })

  it('une mesure n’est proposée qu’à partir de 3 points', () => {
    const days = [5, 6, 7].map((d) => ({ dateKey: `2026-11-0${d}`, summary: { sleepMinutes: 420, steps: d === 7 ? 5000 : null } }))
    const r = buildTrendSeries({ days, period: 'week', now: NOW })
    expect(r.series.sleep.map((p) => p.value)).toEqual([7, 7, 7])
    expect(r.available).toEqual(['sleep'])
  })

  it('POLISH-SIM-127 : pas et écran d’aujourd’hui absents des courbes tant que la journée n’est pas finie', () => {
    const days = [4, 5, 6, 7].map((d) => ({ dateKey: `2026-11-0${d}`, summary: { steps: d === 7 ? 163 : 6700, screenMinutes: d === 7 ? 12 : 200, sleepMinutes: 420 } }))
    for (const period of ['week', 'month']) {
      const r = buildTrendSeries({ days, period, now: NOW })
      expect(r.series.steps.map((p) => p.date)).toEqual(['2026-11-04', '2026-11-05', '2026-11-06'])
      expect(r.series.screen.map((p) => p.date)).toEqual(['2026-11-04', '2026-11-05', '2026-11-06'])
      // une mesure de la nuit est finie : aujourd'hui reste
      expect(r.series.sleep.map((p) => p.date)).toContain('2026-11-07')
    }
  })

  it('POLISH-SIM-47 : le poids a sa courbe (kg) dès 3 pesées sur la période', () => {
    const days = [5, 6, 7].map((d) => ({ dateKey: `2026-11-0${d}`, summary: { weightKg: 80 - d / 10 } }))
    const r = buildTrendSeries({ days, period: 'week', now: NOW })
    expect(r.series.weight.map((p) => p.value)).toEqual([79.5, 79.4, 79.3])
    expect(r.available).toEqual(['weight'])
    expect(trendMeasure('weight')).toMatchObject({ label: 'Poids', unit: 'kg', tone: 'rose' })
    expect(trendMeasure('weight').fmt(79.3)).toMatch(/^79,3\s?kg$/)
  })

  it('POLISH-SIM-118 : une pesée tous les 3 jours a sa courbe en Semaine (3 pesées sur le Mois, les points de la semaine)', () => {
    const at = (k, kg) => ({ dateKey: k, summary: { weightKg: kg } })
    const days = [at('2026-10-27', 80), at('2026-10-30', 79.8), at('2026-11-02', 79.6), at('2026-11-05', 79.4)]
    const r = buildTrendSeries({ days, period: 'week', now: NOW })
    expect(r.series.weight.map((p) => p.date)).toEqual(['2026-11-02', '2026-11-05'])
    expect(r.available).toEqual(['weight'])
    // Deux pesées en tout : pas encore de courbe, ni en Semaine ni en Mois
    const two = buildTrendSeries({ days: days.slice(2), period: 'week', now: NOW })
    expect(two.available).toEqual([])
    expect(buildTrendSeries({ days: days.slice(2), period: 'month', now: NOW }).available).toEqual([])
    // Aucune pesée cette semaine : rien à tracer en Semaine (la puce grisée ramène au Mois, POLISH-SIM-81b)
    const old = buildTrendSeries({ days: days.slice(0, 2).concat(at('2026-10-24', 80.2)), period: 'week', now: NOW })
    expect(old.available).toEqual([])
    // Les mesures quotidiennes gardent la règle des 3 points sur la période
    const sleep = [10, 20, 30].map((d) => ({ dateKey: `2026-10-${d}`, summary: { sleepMinutes: 420 } }))
      .concat({ dateKey: '2026-11-06', summary: { sleepMinutes: 400 } })
    expect(buildTrendSeries({ days: sleep, period: 'week', now: NOW }).available).toEqual([])
  })

  it('un axe par unité, deux au plus', () => {
    expect(unitsOf(['wellbeing', 'digestion'])).toEqual(['/5'])
    expect(canAdd(['wellbeing'], 'sleep')).toBe(true)
    expect(canAdd(['wellbeing', 'sleep'], 'screen')).toBe(true)
    expect(canAdd(['wellbeing', 'sleep'], 'steps')).toBe(false)
  })
})

describe('Vue par défaut de Tendances (correction T1 du 07/11)', () => {
  it('le bien-être d’abord : Semaine s’il a 3 jours, sinon Jour s’il a des lectures ou des notes', async () => {
    const { defaultTrendsView } = await import('./trendsData')
    expect(defaultTrendsView({ available: ['wellbeing', 'steps'], hasWellbeing: true })).toEqual({ period: 'week', keys: ['wellbeing'] })
    expect(defaultTrendsView({ available: ['steps'], hasWellbeing: true })).toEqual({ period: 'day', keys: ['wellbeing'] })
  })
  it('sans bien-être, la première mesure qui a une courbe ; rien : Semaine et aucune mesure', async () => {
    const { defaultTrendsView } = await import('./trendsData')
    expect(defaultTrendsView({ available: ['sleep', 'steps'], hasWellbeing: false })).toEqual({ period: 'week', keys: ['sleep'] })
    expect(defaultTrendsView({ available: [], hasWellbeing: false })).toEqual({ period: 'week', keys: [] })
  })
  it('une demande explicite (?mesure, ?vue=jour) prime', async () => {
    const { defaultTrendsView } = await import('./trendsData')
    expect(defaultTrendsView({ asked: 'digestion', available: ['wellbeing'], hasWellbeing: true })).toEqual({ period: 'week', keys: ['digestion'] })
    expect(defaultTrendsView({ askedDay: true, available: ['wellbeing'], hasWellbeing: true })).toEqual({ period: 'day', keys: ['wellbeing'] })
  })
})

describe('detailSource (POLISH-SIM-4) : d’où vient le chiffre d’un jour passé', () => {
  it('bien-être égal à la note arrondie : « votre note », sans second chiffre', () => {
    expect(detailSource('wellbeing', { value: 3.42, note: 3.4, readings: 2 })).toBe('votre note')
  })
  it('bien-être différent de la note : dit ce qui s’y mêle (visage ou jours voisins)', () => {
    expect(detailSource('wellbeing', { value: 3.2, note: 3, noteText: '3', readings: 3 })).toBe('vous avez noté 3 · estimé avec le visage')
    expect(detailSource('wellbeing', { value: 3.2, note: 3, noteText: '3', readings: 0 })).toBe('vous avez noté 3 · estimé avec les jours voisins')
  })
  it('POLISH-SIM-90 : une note choisie de 1 à 5 se dit telle qu’elle a été donnée', () => {
    expect(detailSource('wellbeing', { value: 3.9, note: 4, noteText: '4', readings: 4 })).toBe('vous avez noté 4 · estimé avec le visage')
  })
  it('UPG-6, POLISH-SIM-103 : une note à décimale (ancienne échelle) se dit comme dans « Vos saisies », jamais arrondie', () => {
    // fiche du 12/11 : 2,8 en tête, la saisie dit 2,6 / 5 ; la ligne disait « vous avez noté 3 »
    expect(detailSource('wellbeing', { value: 2.8, note: 2.6, noteText: '2,6', readings: 3 })).toBe('vous avez noté 2,6 · estimé avec le visage')
    // sans le texte (ancien appelant), la note s'écrit à une décimale
    expect(detailSource('wellbeing', { value: 4.0, note: 4.2, readings: 3 })).toBe('vous avez noté 4,2 · estimé avec le visage')
    expect(detailSource('wellbeing', { value: 3.2, note: 4, readings: 5 })).toBe('vous avez noté 4 · estimé avec le visage')
  })
  it('bien-être sans note : lu sur le visage, ou estimé', () => {
    expect(detailSource('wellbeing', { value: 3.2, note: null, readings: 3 })).toBe('d’après le visage')
    expect(detailSource('wellbeing', { value: 3.2, note: null, readings: 0, observed: false })).toBe('estimé')
  })
  it('POLISH-VISAGE-1 : moins de 3 lectures du visage ne comptent pas encore, le chiffre vient des jours voisins', () => {
    // Tendances › Jour, 2 lectures ce matin : 2,7 « d’après le visage », alors que les lectures disent 3,1 et 2,7 et que
    // le modèle n'observe pas le jour (FACE_MOOD_MIN_READINGS) : le chiffre vient des jours voisins.
    expect(detailSource('wellbeing', { value: 2.7, note: null, readings: 2, observed: false }))
      .toBe('estimé avec les jours voisins (il faut 3 lectures)')
    expect(detailSource('wellbeing', { value: 2.7, note: null, readings: 1, observed: false }))
      .toBe('estimé avec les jours voisins (il faut 3 lectures)')
    // avec une note, la même règle : 2 lectures ne se mêlent pas au chiffre
    expect(detailSource('wellbeing', { value: 3.2, note: 3, noteText: '3', readings: 2 })).toBe('vous avez noté 3 · estimé avec les jours voisins')
  })
  it('confort digestif : noté ou estimé, l’échelle est dite sous la courbe (POLISH-SIM-54)', () => {
    expect(detailSource('digestion', { value: 2, gut: 'Gêné', observed: true })).toBe('noté « Gêné »')
    expect(detailSource('digestion', { value: 2, observed: false })).toBe('estimé')
  })
  it('POLISH-SIM-71 : un chiffre qui s’écarte de la note du jour se dit estimé, avec la note', () => {
    expect(detailSource('digestion', { value: 2, gut: 'douleur', gutScore: 1, observed: true })).toBe('vous avez noté « douleur » (1) · estimé avec les jours voisins')
    expect(detailSource('digestion', { value: 1.04, gut: 'douleur', gutScore: 1, observed: true })).toBe('noté « douleur »')
    expect(detailSource('digestion', { value: 3, gut: 'gêne', gutScore: 3, observed: true })).toBe('noté « gêne »')
  })
})

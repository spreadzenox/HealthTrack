import { describe, it, expect } from 'vitest'
import { REPORT_DISCLAIMER, buildReport, reportFileName } from './buildReport'
import { FODMAP_CHALLENGE_SOURCE, FODMAP_CHALLENGE_TYPE, recordDose, startChallenge } from '../fodmapChallenge'
import { fodmapGroupOf, mealFactors } from '../gutWindows'
import { simulateRealistic } from '../gutWindows.sim'

/** Heure locale du jour `d` (26/10/2026 = jour 0, « aujourd'hui »). */
const at = (d, h = 12) => new Date(2026, 9, 26 + d, h, 0)
const NOW = at(0, 22)
const gut = (d, level, h = 21, scope = 'day') => ({ type: 'gut', source: 'app_gut', at: at(d, h).toISOString(), payload: scope ? { level, scope } : { level } })
const meal = (d, ingredient, h = 12, quantity_g = 100) => ({ type: 'food', source: 'app_food', at: at(d, h).toISOString(), payload: { items: [{ ingredient, quantity_g }] } })
const night = (d, minutes, source = 'huawei_watch') => ({
  type: 'sleep', source, at: new Date(at(d, 7).getTime() - minutes * 60000).toISOString(),
  payload: { durationMinutes: minutes, endDate: at(d, 7).toISOString(), sleepState: 'asleep' },
})

describe('buildReport — période et ventre', () => {
  it('journal vide : rapport lisible, rien d’inventé', () => {
    const r = buildReport([], { now: NOW })
    expect(r.period).toMatchObject({ weeks: 4, days: 28, to: '2026-10-26', from: '2026-09-29' })
    expect(r.gut).toMatchObject({ notedDays: 0, calm: 0, discomfort: 0, pain: 0 })
    expect(r.calendar).toHaveLength(28)
    expect(r.calendar.every((d) => d.level === null && !d.fodmap)).toBe(true)
    expect(r.weekly).toHaveLength(4)
    expect(r.challenges).toEqual([])
    expect(r.links.status).toBe('no_notes')
    expect(r.sleep).toBeNull()
    expect(r.topFoods).toEqual([])
    expect(r.wellbeing).toBeNull()
    expect(r.sources).toEqual([])
    expect(r.disclaimer).toBe(REPORT_DISCLAIMER)
  })

  it('période au choix 2, 4 ou 12 semaines ; une autre valeur revient à 4', () => {
    expect(buildReport([], { now: NOW, weeks: 2 }).calendar).toHaveLength(14)
    expect(buildReport([], { now: NOW, weeks: 12 }).weekly).toHaveLength(12)
    expect(buildReport([], { now: NOW, weeks: 3 }).period.weeks).toBe(4)
  })

  it('un jour prend sa note la plus forte ; un jour sans note n’est pas compté calme', () => {
    const r = buildReport([
      gut(0, 'calm'), gut(0, 'pain', 10, null), // douleur l'après-midi, bilan calme le soir → douleur
      gut(-1, 'discomfort'), gut(-1, 'calm', 9, null),
      gut(-2, 'calm'),
      gut(-40, 'pain'), // hors période
    ], { now: NOW })
    expect(r.gut).toMatchObject({ notedDays: 3, calm: 1, discomfort: 1, pain: 1 })
    expect(r.gut.shares.calm).toBeCloseTo(1 / 3)
    expect(r.calendar.at(-1)).toMatchObject({ date: '2026-10-26', level: 'pain' })
    expect(r.calendar.at(-3).level).toBe('calm')
    expect(r.calendar.at(-4).level).toBeNull()
  })

  it('semaine par semaine, de la plus ancienne à la plus récente', () => {
    const r = buildReport([gut(0, 'pain'), gut(-6, 'calm'), gut(-7, 'discomfort'), gut(-27, 'calm')], { now: NOW })
    expect(r.weekly[3]).toMatchObject({ from: '2026-10-20', to: '2026-10-26', notedDays: 2, calm: 1, pain: 1 })
    expect(r.weekly[2]).toMatchObject({ to: '2026-10-19', notedDays: 1, discomfort: 1 })
    expect(r.weekly[0]).toMatchObject({ from: '2026-09-29', notedDays: 1, calm: 1 })
  })
})

describe('buildReport — repas, sommeil, sources', () => {
  it('aliments les plus fréquents comptés en jours ; jours riches en FODMAP marqués au calendrier', () => {
    const entries = [meal(0, 'Oignon'), meal(0, 'Oignon', 19), meal(-1, 'Oignon'), meal(-1, 'Riz'), meal(-50, 'Riz')]
    const r = buildReport(entries, { now: NOW })
    expect(r.topFoods[0]).toEqual({ label: 'Oignon', days: 2 })
    expect(r.topFoods[1]).toEqual({ label: 'Riz', days: 1 })
    expect(r.topFoods.some((f) => f.label === 'Repas riches en FODMAP')).toBe(false)
    const fodmapToday = mealFactors(meal(0, 'Oignon')).some(fodmapGroupOf)
    expect(r.calendar.at(-1).fodmap).toBe(fodmapToday)
    expect(r.calendar.at(-2).fodmap).toBe(fodmapToday)
  })

  it('calendrier : les sous-groupes FODMAP du jour (N5)', () => {
    const entries = [
      { type: 'food', at: new Date(NOW.getTime() - 3600_000).toISOString(), payload: { items: [{ ingredient: 'Oignon jaune, cru', quantity_g: 40 }, { ingredient: 'Yaourt nature', quantity_g: 125 }] } },
    ]
    const r = buildReport(entries, { now: NOW })
    expect(r.calendar.at(-1)).toMatchObject({ fodmap: true, fodmapGroups: ['fructans', 'lactose'] })
    expect(r.calendar.at(-2)).toMatchObject({ fodmap: false, fodmapGroups: [] })
    expect(r.topFoods.some((f) => /riches en/.test(f.label))).toBe(false)
  })

  it('FODMAP par sous-groupe : jours riches, jours notés et jours de gêne ou douleur, sans les groupes absents (N6)', () => {
    const onion = (d) => ({ type: 'food', at: at(d, 12).toISOString(), payload: { items: [{ ingredient: 'Oignon jaune, cru', quantity_g: 40 }] } })
    const r = buildReport([onion(0), onion(-1), onion(-2), gut(0, 'pain'), gut(-1, 'calm')], { now: NOW })
    expect(r.fodmapGroups).toEqual([{ group: 'fructans', label: 'Fructanes', days: 3, notedDays: 2, symptomDays: 1 }])
    expect(buildReport([], { now: NOW }).fodmapGroups).toEqual([])
  })

  it('sommeil : durée moyenne des nuits mesurées de la période, régularité seulement avec assez de nuits', () => {
    const few = buildReport([night(0, 420), night(-1, 480)], { now: NOW })
    expect(few.sleep).toEqual({ nights: 2, meanMinutes: 450, regularity: null })
    const many = buildReport(Array.from({ length: 14 }, (_, i) => night(-i, 450)), { now: NOW })
    expect(many.sleep.nights).toBe(14)
    expect(many.sleep.regularity).toBe('régulier')
  })

  it('sources lisibles, la saisie à la main d’abord', () => {
    const hc = { type: 'sleep', source: 'health_connect', at: at(-2, 0).toISOString(), payload: { durationMinutes: 400, endDate: at(-2, 7).toISOString(), sourceName: 'Garmin' } }
    const r = buildReport([gut(0, 'calm'), meal(0, 'Riz'), night(-1, 450), hc], { now: NOW })
    expect(r.sources).toEqual(['Saisi à la main', 'Health Connect · Garmin', 'Montre Huawei'])
  })
})

describe('buildReport — réintroduction et pistes', () => {
  const calm = [gut(-30, 'calm'), gut(-29, 'calm'), gut(-28, 'calm')]
  const challenge = (payload) => ({ type: FODMAP_CHALLENGE_TYPE, source: FODMAP_CHALLENGE_SOURCE, at: payload.startedAt, payload })

  it('un test terminé donne son groupe, son aliment et sa phrase ; un test en cours est dit « en cours »', () => {
    let done = startChallenge({ group: 'lactose', food: 'milk' }, at(-27, 9))
    for (const d of [-27, -26, -25]) done = recordDose(done, calm, at(d, 12))
    const ongoing = recordDose(startChallenge({ group: 'fructans', food: 'wheat' }, at(0, 9)), calm, at(0, 12))
    const gutAfter = [gut(-24, 'calm'), gut(-23, 'calm'), gut(-22, 'calm')]
    const r = buildReport([...calm, ...gutAfter, challenge(done), challenge(ongoing), challenge({ ...done, abandonedAt: at(-1).toISOString() })], { now: NOW })
    expect(r.challenges).toHaveLength(2)
    expect(r.challenges[0]).toMatchObject({ group: 'Lactose', food: 'Lait', state: 'done', verdict: 'bien toléré' })
    expect(r.challenges[0].sentence).toMatch(/^Lait : bien toléré jusqu’à 375 ml\.$/)
    expect(r.challenges[1]).toMatchObject({ group: 'Fructanes', food: 'Blé', state: 'ongoing', verdict: null, sentence: null })
  })

  it('pistes ventre : reprises des moteurs, toujours « à confirmer », avec le nombre de comparaisons', () => {
    let found = null
    for (let seed = 1; seed <= 8 && !found; seed++) {
      const entries = simulateRealistic({ seed: seed * 31, days: 90, timedNotes: false, dayNotes: true, dayEffect: { food: 'oignon', day: 0, odds: 8 } })
      const last = new Date(Math.max(...entries.map((e) => Date.parse(e.at))))
      const r = buildReport(entries, { now: last })
      if (r.links.items.some((l) => l.label === 'Oignon')) found = r
    }
    expect(found).not.toBeNull()
    expect(found.links.status).toBe('links')
    expect(found.links.comparisons).toBeGreaterThan(0)
    const link = found.links.items.find((l) => l.label === 'Oignon')
    expect(link.strength).toBe('à confirmer')
    expect(link.exposed.n).toBeGreaterThanOrEqual(8)
  })
})

describe('buildReport — bien-être et textes', () => {
  it('le bien-être estimé n’apparaît que si on le demande', () => {
    expect(buildReport([], { now: NOW }).wellbeing).toBeNull()
    expect(buildReport([], { now: NOW, includeWellbeing: true }).wellbeing).toBeNull()
  })

  it('aucun « HealthTrack », aucun mot de diagnostic ou de traitement dans les textes', () => {
    const r = buildReport([gut(0, 'pain'), meal(0, 'Oignon'), night(0, 400)], { now: NOW, appVersion: '1.2.3' })
    const text = JSON.stringify(r)
    expect(text).not.toMatch(/HealthTrack/i)
    expect(text).not.toMatch(/diagnostiqu|traitement|guéri|intolérance|allergie/i)
    expect(r.app).toBe('Halcya')
    expect(r.appVersion).toBe('1.2.3')
  })

  it('nom du fichier daté', () => {
    expect(reportFileName(NOW)).toBe('Halcya-rapport-2026-10-26.pdf')
  })
})

describe('buildReport — forme des selles (I176)', () => {
  const stool = (d, payload) => ({ type: 'stool', source: 'app_stool', at: at(d, 9).toISOString(), payload })

  it('null sans note ; sinon répartition de la période, saisie comptée comme « saisi à la main »', () => {
    expect(buildReport([gut(0, 'calm')], { now: NOW }).stool).toBeNull()
    const r = buildReport([stool(0, { form: 'normal' }), stool(-1, { form: 'hard', bristol: 1 }), stool(-1, { bristol: 7 }), stool(-40, { form: 'loose' })], { now: NOW })
    expect(r.stool).toEqual({ total: 3, days: 2, hard: 1, normal: 1, loose: 1 })
    expect(r.sources).toContain('Saisi à la main')
  })
})

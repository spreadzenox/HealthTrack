import { describe, expect, it } from 'vitest'
import {
  CONTRACT_VERSION, DIGESTION_MIN_SYMPTOM_DAYS, FACTORS, factorKeysKnown, HORIZONS, OUTCOMES, UNLOCK_DAYS,
  computeAnalysisResults, contributionsByDay, dayContributions, outcomeSeries, SCALE_SPAN, boundToScale, sameUnitPerFactor,
} from './analysisResults'
import { isEstimatorInput } from './mood/estimatorInputs'

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const gauss = (r) => Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r())

const START = Date.UTC(2026, 6, 1)
const dk = (i) => new Date(START + i * 86_400_000).toISOString().slice(0, 10)
const at = (i, hh) => `${dk(i)}T${hh}:00:00`

/** n jours : pas aléatoires ; bien-être = 3 + effet des pas du jour + bruit ; ventre indépendant des pas. */
function world({ days = 70, stepsEffect = 0.0004, seed = 1, gut = true, wellbeing = true } = {}) {
  const r = rng(seed)
  const entries = []
  const steps = []
  for (let i = 0; i < days; i += 1) {
    const s = Math.round(6000 + 2500 * gauss(r))
    steps.push(s)
    entries.push({ type: 'steps', at: at(i, '12'), source: 'health_connect', payload: { value: Math.max(100, s), period: 'day' } })
    entries.push({ type: 'phone_usage', at: at(i, '23'), payload: { screenMinutes: Math.round(200 + 60 * gauss(r)) } })
    if (wellbeing) {
      const y = Math.min(5, Math.max(0, 3 + stepsEffect * (s - 6000) + 0.35 * gauss(r)))
      entries.push({ type: 'wellbeing', at: at(i, '21'), payload: { score: Math.round(y * 10) / 10 } })
    }
    if (gut) {
      const u = r()
      const level = u < 0.2 ? 'discomfort' : u < 0.27 ? 'pain' : 'calm'
      entries.push({ type: 'gut', at: at(i, '21'), payload: { level, scope: 'day' } })
    }
  }
  return { entries, steps, now: new Date(START + (days - 1) * 86_400_000 + 22 * 3_600_000) }
}

describe('contrat des résultats d’Analyses', () => {
  it('a la forme stable : deux résultats × trois horizons', () => {
    const { entries, now } = world({ days: 10 })
    const res = computeAnalysisResults(entries, { now })
    expect(res.contractVersion).toBe(CONTRACT_VERSION)
    expect(res.method).toBe('org5')
    expect(Object.keys(res.outcomes)).toEqual(OUTCOMES.map((o) => o.id))
    for (const o of Object.values(res.outcomes)) {
      expect(Object.keys(o.horizons)).toEqual(HORIZONS.map((h) => h.id))
      expect(o).toHaveProperty('beatsPersistence', null)
    }
  })

  it('reste verrouillé avant les seuils et dit combien de jours il manque', () => {
    const { entries, now } = world({ days: 10 })
    const wb = computeAnalysisResults(entries, { now }).outcomes.wellbeing
    expect(wb.status).toBe('locked')
    expect(wb.daysHave).toBe(10)
    expect(wb.daysToFirst).toBe(UNLOCK_DAYS.wellbeing.short - 10)
    expect(wb.horizons.short.factors).toEqual([])
  })

  it('débloque horizon par horizon (bien-être 14 / 21 / 42 jours)', () => {
    const { entries, now } = world({ days: 30 })
    const wb = computeAnalysisResults(entries, { now }).outcomes.wellbeing
    expect(wb.status).toBe('partial')
    expect(wb.horizons.short.status).toBe('ready')
    expect(wb.horizons.medium.status).toBe('ready')
    expect(wb.horizons.long.status).toBe('locked')
  })

  it('retrouve un effet fort et net, dans le bon horizon, avec sa variation habituelle', () => {
    const { entries, now } = world({ days: 70 })
    const wb = computeAnalysisResults(entries, { now }).outcomes.wellbeing
    const steps = wb.horizons.short.factors.find((f) => f.key === 'steps')
    expect(steps).toBeTruthy()
    expect(steps.net).toBe(true)
    expect(steps.effect).toBeGreaterThan(0.4)
    expect(steps.low).toBeGreaterThan(0)
    expect(steps.low).toBeLessThan(steps.effect)
    expect(steps.high).toBeGreaterThan(steps.effect)
    expect(steps.theme).toBe('activity')
    expect(steps.actionable).toBe(true)
    expect(steps.usualChange.text).toMatch(/pas de plus$/)
    expect(steps.usualChange.amount % 500).toBe(0)
    // Effet = pente × variation habituelle.
    expect(steps.effect).toBeCloseTo(steps.perUnit * steps.usualChange.amount, 1)
    // Le facteur le plus fort vient en premier.
    expect(wb.horizons.short.factors[0].key).toBe('steps')
  })

  it('POLISH-SIM-16 : une même variation pour toutes les lignes d’un facteur, celle du court terme', () => {
    const { entries, now } = world({ days: 70 })
    for (const o of Object.values(computeAnalysisResults(entries, { now }).outcomes)) {
      const amounts = new Map()
      const shorts = new Map()
      for (const h of Object.values(o.horizons)) {
        for (const f of h.factors) {
          amounts.set(f.key, new Set([...(amounts.get(f.key) ?? []), f.usualChange.text]))
          if (f.horizon === 'short') shorts.set(f.key, f.usualChange.amount)
        }
      }
      for (const [key, texts] of amounts) expect([key, texts.size]).toEqual([key, 1])
      const steps = o.horizons.long.factors.find((f) => f.key === 'steps')
      if (steps && shorts.has('steps')) expect(steps.usualChange.amount).toBe(shorts.get('steps'))
    }
  })

  it('POLISH-SIM-16 : changer d’unité met effet et fourchette à l’échelle, sans toucher la netteté', () => {
    const mk = (horizon, amount, effect) => ({
      key: 'steps', horizon, effect, low: effect - 0.1, high: effect + 0.1, net: true,
      usualChange: { amount, unit: 'pas', text: `${amount} pas de plus` },
    })
    const [s, l] = sameUnitPerFactor([mk('short', 2000, 0.4), mk('long', 500, -0.2)])
    expect(s.effect).toBe(0.4)
    expect(l.usualChange.amount).toBe(2000)
    expect(l.usualChange.text).toMatch(/^2\s?000 pas de plus$/)
    expect(l.effect).toBe(-0.8)
    expect(l.low).toBe(-1.2)
    expect(l.high).toBe(-0.4)
    expect(l.net).toBe(true)
  })

  it('POLISH-SIM-16 : un effet plus grand que l’échelle n’est jamais net et ne pèse sur aucun jour', () => {
    expect(SCALE_SPAN).toBe(4)
    expect(boundToScale({ effect: -4.7, net: true })).toEqual({ effect: -4.7, net: false, outOfScale: true })
    expect(boundToScale({ effect: 3.9, net: true })).toEqual({ effect: 3.9, net: true })
    const results = {
      outcomes: { wellbeing: { horizons: { short: { factors: [
        { key: 'steps', horizon: 'short', inModel: true, outOfScale: true, perUnit: 1, center: 0, label: 'Pas', theme: 'activity' },
      ] } } } },
    }
    const { entries } = world({ days: 5 })
    expect(dayContributions(results, entries, dk(4))).toEqual([])
  })

  it('ORG-5c : modèle régularisé, stabilité et comparaison à « demain = aujourd’hui »', () => {
    const { entries, now } = world({ days: 70 })
    const wb = computeAnalysisResults(entries, { now }).outcomes.wellbeing
    const steps = wb.horizons.short.factors.find((f) => f.key === 'steps')
    expect(steps.inModel).toBe(true)
    expect(steps.stability).toBeGreaterThanOrEqual(0.85)
    expect(typeof wb.beatsPersistence).toBe('boolean')
    for (const h of Object.values(wb.horizons)) {
      for (const f of h.factors) if (f.net) expect(f.inModel && f.stability >= 0.85).toBe(true)
    }
  })

  it('ne trouve pas de lien net sur un facteur sans effet', () => {
    const { entries, now } = world({ days: 70 })
    const wb = computeAnalysisResults(entries, { now }).outcomes.wellbeing
    for (const h of Object.values(wb.horizons)) {
      const screen = h.factors.find((f) => f.key === 'screen_minutes')
      if (screen) expect(screen.net).toBe(false)
    }
  })

  it('digestion : exige des jours de gêne ou de douleur, en plus des jours notés', () => {
    const calmOnly = world({ days: 60, gut: false })
    for (let i = 0; i < 60; i += 1) calmOnly.entries.push({ type: 'gut', at: at(i, '21'), payload: { level: 'calm', scope: 'day' } })
    const dig = computeAnalysisResults(calmOnly.entries, { now: calmOnly.now }).outcomes.digestion
    expect(dig.daysHave).toBe(60)
    expect(dig.symptomDays).toBe(0)
    expect(dig.symptomDaysNeeded).toBe(DIGESTION_MIN_SYMPTOM_DAYS)
    expect(dig.status).toBe('locked')
  })

  it('règle 5 : la digestion n’apprend que du ventre, jamais du bien-être', () => {
    const { entries } = world({ days: 40, gut: false })
    const s = outcomeSeries(entries)
    expect(s.wellbeing.size).toBe(40)
    expect(s.digestion.size).toBe(0)
  })

  it('règle 5 au banc : un facteur qui ne touche que le bien-être ne devient pas un facteur digestif', () => {
    let falseDigestive = 0
    for (let seed = 1; seed <= 20; seed += 1) {
      const { entries, now } = world({ days: 70, seed, stepsEffect: 0.0005 })
      const dig = computeAnalysisResults(entries, { now }).outcomes.digestion
      for (const h of Object.values(dig.horizons)) if (h.factors.some((f) => f.key === 'steps' && f.net)) falseDigestive += 1
    }
    expect(falseDigestive).toBeLessThanOrEqual(1)
  }, 120_000)

  it('aucun facteur n’est le bien-être, le ventre ou une entrée de l’estimateur', () => {
    expect(factorKeysKnown()).toBe(true)
    for (const f of FACTORS) {
      expect(isEstimatorInput(f.key)).toBe(false)
      expect(f.key).not.toMatch(/wellbeing|gut|mood/)
      expect(['wellbeing', 'digestion', 'nutrition', 'activity', 'sleep', 'body', 'context']).toContain(f.theme)
    }
  })

  it('contributions du jour : les plus grandes, signées, au plus 3', () => {
    const { entries, steps, now } = world({ days: 70 })
    const res = computeAnalysisResults(entries, { now })
    const hi = steps.indexOf(Math.max(...steps))
    const top = dayContributions(res, entries, dk(hi))
    expect(top.length).toBeGreaterThan(0)
    expect(top.length).toBeLessThanOrEqual(3)
    expect(top[0].key).toBe('steps')
    expect(top[0].points).toBeGreaterThan(0)
    expect(top[0].value).toBeGreaterThan(top[0].usual)
    const lo = steps.indexOf(Math.min(...steps))
    const down = dayContributions(res, entries, dk(lo)).find((c) => c.key === 'steps')
    expect(down.points).toBeLessThan(0)
    // T4-suite : au court terme, la valeur du seul jour est aussi donnée (« Nuit plus courte (6 h 21) »).
    for (const c of top) if (c.horizon !== 'short') expect(c.dayValue).toBeUndefined()
    if (top[0].horizon === 'short') expect(top[0].dayValue).toBe(Math.max(100, steps[hi]))
    for (let i = 1; i < top.length; i += 1) expect(Math.abs(top[i - 1].points)).toBeGreaterThanOrEqual(Math.abs(top[i].points))
  })

  it('contributions sur le modèle : une barre par facteur, seulement les termes du modèle, tous les jours', () => {
    const { entries, steps, now } = world({ days: 70 })
    const res = computeAnalysisResults(entries, { now })
    const inModel = new Set(Object.values(res.outcomes.wellbeing.horizons).flatMap((h) => h.factors.filter((f) => f.inModel).map((f) => f.key)))
    const all = contributionsByDay(res, entries)
    const hi = dk(steps.indexOf(Math.max(...steps)))
    expect(all.wellbeing[hi]).toEqual(dayContributions(res, entries, hi))
    for (const list of Object.values(all.wellbeing)) {
      expect(new Set(list.map((c) => c.key)).size).toBe(list.length)
      for (const c of list) expect(inModel.has(c.key)).toBe(true)
    }
    // POLISH-SIM-34 : chaque barre dit si Analyses trouve ce lien net (un horizon net suffit), comme Analyses
    const netKeys = new Set(Object.values(res.outcomes.wellbeing.horizons).flatMap((h) => h.factors.filter((f) => f.inModel && f.net).map((f) => f.key)))
    for (const list of Object.values(all.wellbeing)) for (const c of list) expect(c.net).toBe(netKeys.has(c.key))
    expect(JSON.parse(JSON.stringify(all))).toStrictEqual(all)
  })

  it('TS-2 : un lien doit tenir à l’intérieur des périodes (un saut commun n’en fait pas un lien)', () => {
    const r = rng(11)
    const entries = []
    for (let i = 0; i < 90; i += 1) {
      const after = i >= 45
      // Les pas montent d'un coup en même temps que le bien-être, mais au jour le jour ils ne jouent pas.
      const s = Math.round((after ? 9000 : 5000) + 800 * gauss(r))
      entries.push({ type: 'steps', at: at(i, '12'), source: 'health_connect', payload: { value: s, period: 'day' } })
      const y = (after ? 3.8 : 2.2) + 0.3 * gauss(r)
      entries.push({ type: 'wellbeing', at: at(i, '21'), payload: { score: Math.round(y * 10) / 10 } })
    }
    const res = computeAnalysisResults(entries, { now: new Date(START + 89 * 86_400_000 + 22 * 3_600_000) })
    const wb = res.outcomes.wellbeing
    expect(wb.changes.length).toBeGreaterThanOrEqual(1)
    for (const h of Object.values(wb.horizons)) expect(h.factors.some((f) => f.key === 'steps' && f.net)).toBe(false)
  })

  it('contributions : rien tant que le résultat est verrouillé', () => {
    const { entries, now } = world({ days: 8 })
    const res = computeAnalysisResults(entries, { now })
    expect(dayContributions(res, entries, dk(5))).toEqual([])
    expect(dayContributions(null, entries, dk(5))).toEqual([])
  })

  it('n’utilise pas les jours après « maintenant »', () => {
    const { entries } = world({ days: 30 })
    const res = computeAnalysisResults(entries, { now: new Date(START + 9 * 86_400_000 + 22 * 3_600_000) })
    expect(res.outcomes.wellbeing.daysHave).toBe(10)
  })
})

describe('matrice (ORG-5b)', () => {
  it('FODMAP par sous-groupe : repas au-dessus du repère comptés par jour', async () => {
    const { loadNutritionTable } = await import('../data/nutritionTable')
    await loadNutritionTable()
    const { buildAnalysisMatrix, factorMeta } = await import('./analysisResults')
    const entries = [
      { type: 'food', at: '2026-07-01T12:00:00', payload: { items: [{ ingredient: 'Oignon jaune, cru', quantity_g: 120 }] } },
      { type: 'food', at: '2026-07-01T19:00:00', payload: { items: [{ ingredient: 'Oignon jaune, cru', quantity_g: 120 }] } },
      { type: 'food', at: '2026-07-02T12:00:00', payload: { items: [{ ingredient: 'Riz blanc, cuit', quantity_g: 150 }] } },
    ]
    const { days } = buildAnalysisMatrix(entries, { today: '2026-07-02' })
    expect(days.get('2026-07-01').fodmap_fructans).toBe(2)
    expect(days.get('2026-07-02').fodmap_fructans).toBe(0)
    expect(factorMeta('fodmap_fructans')).toMatchObject({ theme: 'nutrition', actionable: true, label: 'Fructanes' })
  })

  it('un groupe FODMAP est nommé comme tel sous son libellé (POLISH-SIM-55)', async () => {
    const { factorMeta } = await import('./analysisResults')
    expect(factorMeta('fodmap_lactose').text(1)).toBe('1 repas riche en lactose (FODMAP) de plus')
    expect(factorMeta('fodmap_fructans').text(2)).toBe('2 repas riches en fructanes (FODMAP) de plus')
    expect(factorMeta('sugar_g').text(10)).not.toMatch(/FODMAP/)
  })

  it('journée à part : malade ou en voyage', async () => {
    const { buildAnalysisMatrix } = await import('./analysisResults')
    const entries = [
      { type: 'wellbeing', at: '2026-07-01T21:00:00', payload: { score: 2, tags: ['sick'] } },
      { type: 'wellbeing', at: '2026-07-02T21:00:00', payload: { score: 4 } },
    ]
    const { days } = buildAnalysisMatrix(entries, { today: '2026-07-02' })
    expect(days.get('2026-07-01')._disrupted).toBe(true)
    expect(days.get('2026-07-02')._disrupted).toBe(false)
  })

  it('résultat du jour = estimation TS-1, jours notés plus pesants ; digestion sans le bien-être', async () => {
    const { buildAnalysisMatrix, WEIGHT_RANGE } = await import('./analysisResults')
    const { entries } = world({ days: 30, gut: true })
    const { series } = buildAnalysisMatrix(entries, { today: dk(29) })
    expect(series.wellbeing.size).toBe(30)
    expect(series.weights.wellbeing.size).toBe(30)
    for (const w of series.weights.wellbeing.values()) {
      expect(w).toBeGreaterThanOrEqual(WEIGHT_RANGE[0])
      expect(w).toBeLessThanOrEqual(WEIGHT_RANGE[1])
    }
    // Retirer toutes les notes de bien-être ne change pas la série digestive (règle 5).
    const noWb = entries.filter((e) => e.type !== 'wellbeing')
    const a = [...series.digestion.values()]
    const b = [...buildAnalysisMatrix(noWb, { today: dk(29) }).series.digestion.values()]
    expect(b).toEqual(a)
  })
})

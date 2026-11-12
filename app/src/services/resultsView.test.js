import { describe, it, expect } from 'vitest'
import { resultsView, pistesTitles } from './resultsView'

const f = (key, effect, { actionable = true, net = true, horizon = 'short', label = key } = {}) => ({
  key, label, theme: 'sleep', actionable, outcome: 'wellbeing', horizon, effect, low: effect - 0.1, high: effect + 0.1, net,
  usualChange: { amount: 50, unit: 'min', text: '50 min de sommeil de plus' }, perUnit: 0.01, center: 400, days: 30,
})
const h = (id, status, factors = [], daysHave = 30, daysNeeded = 14) => ({ id, label: id, window: '', status, daysHave, daysNeeded, factors })

describe('Analyses sur le contrat (ORG-4, ORG-6)', () => {
  it('avant les résultats : un seul compte à rebours, la prochaine étape', () => {
    const v = resultsView({ status: 'locked', daysToFirst: 9, horizons: { short: h('short', 'locked', [], 5, 14), medium: h('medium', 'locked', [], 5, 21), long: h('long', 'locked', [], 5, 42) } })
    expect(v).toMatchObject({ state: 'locked', daysLeft: 9, progress: { have: 5, need: 14 } })
  })

  it('pistes : 3 liens nets au plus, sur ce qu’on peut changer, un par facteur', () => {
    const outcome = {
      status: 'partial', beatsPersistence: true,
      horizons: {
        short: h('short', 'ready', [f('sleep', 0.4), f('steps', 0.3), f('hrv', 0.5, { actionable: false }), f('screen', -0.2, { net: false })]),
        medium: h('medium', 'ready', [f('sleep', 0.2, { horizon: 'medium' }), f('fiber', 0.25, { horizon: 'medium' }), f('kcal', -0.1, { horizon: 'medium' })]),
        long: h('long', 'locked', [], 30, 42),
      },
    }
    const v = resultsView(outcome)
    expect(v.pistes.map((p) => p.key)).toEqual(['sleep', 'steps', 'fiber'])
    expect(v.weigh.map((x) => x.id)).toEqual(['short', 'medium'])
    expect(v.weigh[0].factors.map((x) => x.key)).toEqual(['sleep', 'steps', 'screen'])
    expect(v.lookOnly.map((x) => x.key)).toEqual(['hrv'])
    expect(v.nextLock).toEqual({ label: 'long', window: '', daysLeft: 12 })
  })

  it('pas de « Ce qui pèse » sans prévision meilleure que « demain = aujourd’hui »', () => {
    const v = resultsView({ status: 'ready', beatsPersistence: false, horizons: { short: h('short', 'ready', [f('sleep', 0.4)]) } })
    expect(v.weigh).toBeNull()
    expect(v.pistes).toHaveLength(1)
  })

  it('POLISH-SIM-50 : rien de net dans « Ce qui va avec » se dit une fois', () => {
    const v = resultsView({ status: 'ready', beatsPersistence: true, horizons: {
      short: h('short', 'ready', [f('lactose', -0.2, { net: false })]),
      long: h('long', 'ready', [f('lactose', -2.5, { net: false, horizon: 'long' }), f('sleep', -1.8, { net: false, horizon: 'long' })]),
    } })
    expect(v.weighNothingNet).toBe(true)
    expect(v.flipped).toEqual([])
  })

  it('POLISH-SIM-50 : un facteur qui change de sens selon le délai, sans être net, est nommé', () => {
    const v = resultsView({ status: 'ready', beatsPersistence: true, horizons: {
      short: h('short', 'ready', [f('lactose', -0.2, { net: false, label: 'Lactose' }), f('sleep', 0.4)]),
      medium: h('medium', 'ready', [f('lactose', 1.2, { net: false, horizon: 'medium', label: 'Lactose' }), f('sleep', -0.1, { horizon: 'medium', net: false })]),
      long: h('long', 'ready', [f('lactose', -2.5, { net: false, horizon: 'long', label: 'Lactose' })]),
    } })
    expect(v.weighNothingNet).toBe(false)
    // le sommeil est net à court terme : son sens n'est pas « flou »
    expect(v.flipped).toEqual(['Lactose'])
  })

  it('résumé pour l’Accueil et Agir', () => {
    const r = { outcomes: { wellbeing: { status: 'ready', horizons: { short: h('short', 'ready', [f('sleep', 0.4, { label: 'Sommeil' })]) } }, digestion: { status: 'ready', horizons: { short: h('short', 'ready', [f('fodmap_fructans', -0.4, { label: 'Fructanes' })]) } } } }
    expect(pistesTitles(r)).toEqual({ gut: ['Fructanes → digestion'], levers: ['Sommeil'] })
  })
})

/**
 * Données fictives « plus marquées » de la visite et de « Voir un exemple » (accord du propriétaire, 08/11 vers 22:55) :
 * sur le seul historique annoncé par l'étiquette (jour 14, jour 28), le vrai moteur d'Analyses montre au jour 14 une
 * piste nette (donc un essai dans Agir) et, au jour 28, une piste digestion. Toujours en mémoire, jamais dans la base.
 */
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { buildTourEntries } from './tourData'
import { enterExampleMode, exitExampleMode } from '../storage/exampleMode'
import { runAnalysisTask } from '../workers/analysisTasks'
import { resultsView } from './resultsView'
import { FIRST_RESULTS_DAY } from '../config/firstResults'

const W = FIRST_RESULTS_DAY.wellbeing
const D = FIRST_RESULTS_DAY.digestion
const WATCH = new Set(['steps', 'sleep', 'heartRate', 'restingHeartRate', 'hrv', 'calories'])
const CONFIGS = {
  'montre et Health Connect': { received: WATCH },
  'tout, visage compris': { received: WATCH, face: true, weather: true, screen: true },
  'pas seulement': { received: new Set(['steps']) },
  'aucune source': { received: new Set() },
}
// Des jours de la semaine et des heures différents. Tard le soir, 28 jours en arrière traversent le passage à l'heure
// d'hiver du 25/10 : « maintenant − 24 h » y tombait le lendemain et décalait d'un jour toutes les entrées ajoutées.
const dates = () => [
  new Date(2026, 10, 8, 20, 0), new Date(2026, 10, 9, 23, 30), new Date(2026, 10, 10, 9, 30),
  new Date(2026, 10, 12, 18, 0), new Date(2026, 10, 14, 23, 0),
]

// Le moteur compte les jours jusqu'à aujourd'hui : l'horloge suit la date testée, à l'heure de Paris
const env = globalThis.process.env
const TZ = env.TZ
beforeEach(() => {
  env.TZ = 'Europe/Paris'
  vi.useFakeTimers({ toFake: ['Date'] })
})
afterEach(() => {
  vi.useRealTimers()
  env.TZ = TZ
})

async function resultsFor(days, now, cfg) {
  vi.setSystemTime(now)
  enterExampleMode(buildTourEntries({ days, now, ...cfg }))
  try {
    return await runAnalysisTask('analysisResults')
  } finally {
    exitExampleMode()
  }
}

/** Les essais que propose Agir (pages/Act.jsx) : pistes nettes hors FODMAP. */
const proposedTrials = (outcome) => (resultsView(outcome).pistes ?? []).filter((f) => !f.key.startsWith('fodmap_'))

describe('visite guidée : des pistes dès le jour annoncé', () => {
  for (const [name, cfg] of Object.entries(CONFIGS)) {
    it(`${name} : jour ${W}, une piste nette, son détail et un essai proposé`, async () => {
      for (const now of dates()) {
        const wb = (await resultsFor(W, now, cfg)).outcomes.wellbeing
        const view = resultsView(wb)
        expect(view.state, now.toDateString()).toBe('results')
        expect(view.pistes.length, now.toDateString()).toBeGreaterThan(0)
        expect(view.weigh?.length, now.toDateString()).toBeGreaterThan(0)
        expect(proposedTrials(wb).length, now.toDateString()).toBeGreaterThan(0)
      }
    }, 60_000)

    it(`${name} : jour ${D}, une piste digestion (fructanes)`, async () => {
      for (const now of dates()) {
        const r = await resultsFor(D, now, cfg)
        const gut = resultsView(r.outcomes.digestion)
        expect(gut.state, now.toDateString()).toBe('results')
        expect(gut.pistes.map((f) => f.key), now.toDateString()).toContain('fodmap_fructans')
        expect(gut.weigh?.length, now.toDateString()).toBeGreaterThan(0)
        // Le bien-être garde sa piste
        expect(resultsView(r.outcomes.wellbeing).pistes.length, now.toDateString()).toBeGreaterThan(0)
      }
    }, 60_000)
  }

  it('sans montre, la piste vient de ce qu’on note : le vin de certains soirs', async () => {
    const wb = (await resultsFor(W, dates()[0], CONFIGS['aucune source'])).outcomes.wellbeing
    expect(resultsView(wb).pistes.map((f) => f.key)).toContain('alcohol_g')
  }, 60_000)

  it('avec le sommeil, la piste est le sommeil', async () => {
    const wb = (await resultsFor(W, dates()[0], CONFIGS['montre et Health Connect'])).outcomes.wellbeing
    expect(resultsView(wb).pistes[0].key).toBe('sleepMinutes')
  }, 60_000)
})

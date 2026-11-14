import { describe, it, expect } from 'vitest'
import { buildDailyJournal } from './dailyJournal'
import { chipKey, chipTheme, summaryChips } from './journalChips'

// Version iOS (HealthTrack-iOS) : la VFC de l'app Santé est en SDNN (`heartRateVariabilitySdnn`) ; le Journal la
// montre à part, jamais comme une fréquence cardiaque ni comme la VFC RMSSD d'Android
const sdnn = { type: 'heart_rate', source: 'health_connect', at: '2026-10-20T03:00:00Z', payload: { value: 48, unit: 'millisecond', subtype: 'heartRateVariabilitySdnn' } }
const hr = { type: 'heart_rate', source: 'health_connect', at: '2026-10-20T09:00:00Z', payload: { bpm: 70, subtype: 'heartRate' } }

describe('Journal : VFC en SDNN (iPhone)', () => {
  it('« Variabilité cardiaque » de l’app Santé, à part (clé hrvSdnn) ; ni fréquence cardiaque, ni VFC RMSSD', () => {
    const [day] = buildDailyJournal([sdnn, hr])
    expect(day.summary.hrvSdnn).toBe(48)
    expect(day.summary.hrv).toBeNull()
    const chips = summaryChips(day.summary)
    expect(chips).toContainEqual(['Variabilité cardiaque', '48 ms', undefined, 'hrvSdnn'])
    expect(chips).toContainEqual(['FC', '70 bpm']) // la SDNN n'entre pas dans la fréquence cardiaque
    expect(chips.map(([label]) => label)).not.toContain('VFC')
  })

  // Correctif 56 (9/11) : la tuile était grise, avec l'icône par défaut ; elle a celles de la VFC, sans « d'habitude »
  it('avec une RMSSD le même jour (fichier d’Android), celle de l’app Santé dit d’où elle vient, même icône et même couleur', () => {
    const chips = summaryChips({ hrv: 41, hrvSdnn: 48 })
    expect(chips).toContainEqual(['Variabilité cardiaque', '41 ms'])
    expect(chips).toContainEqual(['Variabilité cardiaque, app Santé', '48 ms', undefined, 'hrvSdnn'])
    expect(chipKey('Variabilité cardiaque, app Santé')).toBe('hrvDay')
    expect(chipTheme('Variabilité cardiaque, app Santé')).toBe(chipTheme('Variabilité cardiaque'))
  })

  // POLISH-SIM-72-iOS-b : la mesure se reconnaît à sa clé, plus à un libellé « (SDNN) »
  it('aucune tuile ne dit « SDNN »', () => {
    for (const s of [{ hrvSdnn: 48 }, { hrv: 41, hrvSdnn: 48 }]) expect(summaryChips(s).map(([label]) => label).join(' ')).not.toMatch(/SDNN/)
  })
})

// Version iOS : une nuit écrite dans l'app Santé par plusieurs sources (Apple Watch avec ses phases, l'iPhone « au
// lit », une app de sommeil) garde une seule source (sleepSources.js d'Android, v607) : toutes ont la source
// `health_connect` (même connecteur), seul `sourceName` (nom de la source HealthKit) les distingue
const BEDTIME = new Date('2026-10-07T23:00:00').getTime()
const night = (sourceName, sleepState, fromMin, mins) => {
  const at = BEDTIME + fromMin * 60000
  const endDate = new Date(at + mins * 60000).toISOString()
  return { type: 'sleep', source: 'health_connect', at: new Date(at).toISOString(), payload: { durationMinutes: mins, sleepState, endDate, sourceName } }
}

describe('Journal : une nuit de l’app Santé comptée une fois (iPhone)', () => {
  it('Apple Watch, iPhone et une app de sommeil sur la même nuit : 7 h, pas 14 h', () => {
    const watch = [night('Apple Watch', 'light', 0, 240), night('Apple Watch', 'deep', 240, 60), night('Apple Watch', 'rem', 300, 120)]
    const app = night('AutoSleep', 'asleep', 0, 420)
    const phone = night('iPhone', 'inBed', -15, 480)
    const days = buildDailyJournal([...watch, app, phone])
    expect(days.map((d) => d.summary.sleepMinutes)).toEqual([420])
  })
})

// Version iOS (Android v746, MONTRE-SCORE) : « Score montre » et « FC nuit » viennent du résumé de nuit de la montre
// Huawei (Health Kit d'Android). L'app Santé n'en donne pas (aucune API du score de sommeil d'Apple, forum des
// développeurs d'Apple, sept. 2025) : une nuit de l'app Santé ne montre ni l'un ni l'autre, jamais un chiffre inventé
describe('Journal : pas de score de nuit sans montre qui le donne (iPhone)', () => {
  it('nuit Apple Watch ou Huawei Santé via l’app Santé : sommeil oui, « Score montre » et « FC nuit » non', () => {
    const watch = [night('Apple Watch', 'light', 0, 240), night('Apple Watch', 'deep', 240, 60), night('Apple Watch', 'rem', 300, 120)]
    const huawei = [night('Huawei Santé', 'asleep', 600 * 24, 400)]
    for (const day of buildDailyJournal([...watch, ...huawei])) {
      expect(day.summary.sleepMinutes).toBeGreaterThan(0)
      expect(day.summary.watchSleepScore).toBeNull()
      expect(day.summary.sleepHr).toBeNull()
      const labels = summaryChips(day.summary).map(([label]) => label)
      expect(labels).toContain('Sommeil')
      expect(labels).not.toContain('Score montre')
      expect(labels).not.toContain('FC nuit')
    }
  })
})

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { describe, expect, it } from 'vitest'
import { chipTheme, chipValueBreaks, summaryChips, watchStressBand } from './journalChips'
import { isLikelyIncompleteEnergy } from './nutritionIntakeCompare'

describe('summaryChips — repas', () => {
  const meals = (s) => summaryChips(s).find(([label]) => /repas$/i.test(label))

  it('garde la valeur des kcal sur une ligne, le nombre de repas dans le titre (POL-PLAY-8)', () => {
    expect(meals({ meals: 1, mealKcal: 479 })).toEqual(['Repas', '≈ 479 kcal'])
    expect(meals({ meals: 3, mealKcal: 1450 })[0]).toBe('3 repas')
    expect(meals({ meals: 3, mealKcal: 1450 })[1]).not.toMatch(/ /)
    expect(meals({ meals: 2, mealKcal: 0 })).toEqual(['Repas', '2'])
  })

  it('table Ciqual pas encore chargée : kcal « en cours », jamais « Repas 1 » (POLISH-SIM-59)', () => {
    expect(meals({ meals: 1, mealKcal: 0, mealKcalPending: true })).toEqual(['Repas', '≈\u00a0…\u00a0kcal'])
    expect(meals({ meals: 2, mealKcal: 0, mealKcalPending: true })[0]).toBe('2 repas')
    // Des kcal déjà connues priment ; un repas sans aliment garde le simple compte
    expect(meals({ meals: 1, mealKcal: 479, mealKcalPending: true })[1]).toBe('≈\u00a0479\u00a0kcal')
  })

  it('signale des repas incomplets face à la dépense du jour, avec la règle de Nutrition (POLISH-SIM-24)', () => {
    // 479 kcal mangés pour 2 285 dépensés : sous la moitié, « repas incomplets ? » plutôt qu'un faux gros déficit
    expect(meals({ meals: 1, mealKcal: 479, burnedKcal: 2285 })).toEqual(['Repas', '≈\u00a0479\u00a0kcal', 'repas incomplets\u00a0?'])
    expect(meals({ meals: 3, mealKcal: 1450, burnedKcal: 2285 })).toHaveLength(2)
    // Sans dépense mesurée, aucune comparaison n'est affichée, donc rien à nuancer
    expect(meals({ meals: 1, mealKcal: 479 })).toHaveLength(2)
    expect(isLikelyIncompleteEnergy(479, 2285)).toBe(true)
    expect(isLikelyIncompleteEnergy(1200, 2285)).toBe(false)
    expect(isLikelyIncompleteEnergy(0, 2285)).toBe(false)
    expect(isLikelyIncompleteEnergy(479, 0)).toBe(false)
  })

  it('« 3 repas » garde la couleur pêche des repas', () => {
    expect(chipTheme('3 repas')).toBe('peach')
    expect(chipTheme('Repas')).toBe('peach')
  })

  it('donne un pastel à chaque tuile, météo comprise (POL-PLAY-27 : la tuile Météo restait sans couleur)', () => {
    expect(chipTheme('Météo')).toBe('stone')
    for (const label of ['Sommeil', 'Pas', 'Variabilité cardiaque', 'Repas', 'Écran', 'Météo', 'Stress']) {
      expect(['mint', 'peach', 'lilac', 'night', 'rose', 'stone']).toContain(chipTheme(label))
    }
  })

  it('prend la couleur du thème de chaque mesure (AUJ-8)', () => {
    expect(chipTheme('Sommeil')).toBe('night')
    expect(chipTheme('Variabilité cardiaque')).toBe('rose')
    expect(chipTheme('FC au repos')).toBe('rose')
    expect(chipTheme('Pas')).toBe('lilac')
    expect(chipTheme('Écran')).toBe('stone')
    expect(chipTheme('Bien-être')).toBe('mint')
  })
})

describe('summaryChips — séances de sport (POLISH-SIM-58)', () => {
  const chip = (workouts) => summaryChips({ workouts }).find(([label]) => /éance/.test(label))

  it('une séance : son type et sa durée', () => {
    expect(chip({ count: 1, minutes: 56, type: 'cycling' })).toEqual(['Séance', 'Vélo, 56 min'])
    expect(chip({ count: 1, minutes: null, type: 'swimming' })).toEqual(['Séance', 'Natation'])
    expect(chip({ count: 1, minutes: 30, type: null })).toEqual(['Séance', '30 min'])
  })

  it('plusieurs séances : le nombre dans le titre, la durée totale en valeur', () => {
    expect(chip({ count: 2, minutes: 70, type: null })).toEqual(['2 séances', '1 h 10'])
    expect(chip({ count: 2, minutes: null, type: null })).toEqual(['Séances', '2'])
  })

  it('aucune séance : aucune tuile ; la tuile est lilas (activité)', () => {
    expect(chip(null)).toBeUndefined()
    expect(chipTheme('Séance')).toBe('lilac')
    expect(chipTheme('2 séances')).toBe('lilac')
  })
})

describe('summaryChips — nuit de la montre (MONTRE-SCORE, I200)', () => {
  it('montre le score de la montre et la FC de la nuit juste après le sommeil', () => {
    const chips = summaryChips({ sleepMinutes: 441, watchSleepScore: 82, sleepHr: 57, steps: 4000 })
    expect(chips.slice(0, 3)).toEqual([['Sommeil', '7 h 21'], ['Score de nuit', '82 / 100'], ['FC nuit', '57 bpm']])
    expect(chipTheme('Score de nuit')).toBe('night')
  })

  it('n’ajoute rien sans montre', () => {
    const labels = summaryChips({ sleepMinutes: 441 }).map(([l]) => l)
    expect(labels).not.toContain('Score de nuit')
    expect(labels).not.toContain('FC nuit')
  })
})

describe('summaryChips — stress de la montre (POL-PLAY-15)', () => {
  it('dit la plage de la montre plutôt que « / 99 »', () => {
    expect(summaryChips({ watchStress: 37 })).toContainEqual(['Stress', '37, normal'])
  })

  it('suit l’échelle de la montre aux bornes', () => {
    expect([1, 29, 30, 59, 60, 79, 80, 99].map(watchStressBand))
      .toEqual(['détendu', 'détendu', 'normal', 'normal', 'moyen', 'moyen', 'élevé', 'élevé'])
  })
})

describe('chipValueBreaks — grande police (GRANDE-POLICE-1)', () => {
  const NB = ' '
  const breaks = (v) => chipValueBreaks(v).split(' ')

  it('ne sépare jamais un nombre de son unité', () => {
    expect(breaks('2\u202f285 kcal')).toEqual([`2\u202f285${NB}kcal`])
    expect(breaks('36,6 °C')).toEqual([`36,6${NB}°C`])
    expect(breaks('14 /min')).toEqual([`14${NB}/min`])
    expect(breaks('8 h 21')).toEqual([`8${NB}h${NB}21`])
  })

  it('coupe seulement entre deux morceaux qui se lisent seuls', () => {
    expect(breaks('68 à 82 bpm')).toEqual([`68${NB}à`, `82${NB}bpm`])
    expect(breaks('37, normal')).toEqual(['37,', 'normal'])
    expect(breaks('11° / 1°')).toEqual([`11°${NB}/`, '1°'])
    expect(breaks(`≈${NB}1\u202f039${NB}kcal`)).toEqual(['≈', `1\u202f039${NB}kcal`])
  })

  it('garde le texte lu identique', () => {
    for (const v of ['≈ 1 039 kcal', '68 à 82 bpm', '37, normal', '120/80 mmHg']) {
      expect(chipValueBreaks(v).replace(/\u00a0/g, ' ')).toBe(v.replace(/\u00a0/g, ' '))
    }
  })

  it('chaque tuile du jour garde ses morceaux courts (≤ 11 signes)', () => {
    const chips = summaryChips({
      sleepMinutes: 501, steps: 8585, restingHr: 60, hrv: 51, respiratoryRate: 14.4, temperatureC: 36.6,
      skinTempC: 33.7, watchStress: 37, heartRate: { min: 68, max: 82 }, burnedKcal: 2285, meals: 2, mealKcal: 1039,
      screenMinutes: 236, bloodPressure: { systolic: 120, diastolic: 80 },
    })
    for (const [, value] of chips) {
      for (const part of chipValueBreaks(value).split(' ')) expect(part.length).toBeLessThanOrEqual(11)
    }
  })
})

describe('tuiles du Journal en grande police (GRANDE-POLICE-1, CSS)', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/App.css'), 'utf8')
  const rule = (sel) => css.match(new RegExp(`\\n${sel.replace(/\./g, '\\.')}\\s*\\{([^}]*)\\}`))?.[1] ?? ''

  it('la valeur ne se coupe jamais en plein mot et suit la largeur de sa tuile', () => {
    expect(rule('.day-summary-item')).toMatch(/container-type:\s*inline-size/)
    const dd = rule('.day-summary-item dd')
    expect(dd).not.toMatch(/overflow-wrap:\s*anywhere/)
    expect(dd).toMatch(/font-size:\s*min\(0\.8rem, \d+cqi\)/)
  })
})

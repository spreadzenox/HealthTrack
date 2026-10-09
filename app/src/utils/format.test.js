import { describe, it, expect } from 'vitest'
import { formatDuration, sleepStateLabel, periodLabel, pickLabelIndices, formatSigned, workoutTypeLabel, evidenceLabel } from './format'

describe('formatDuration', () => {
  it('affiche heures et minutes', () => {
    expect(formatDuration(390)).toBe('6 h 30')
    expect(formatDuration(425)).toBe('7 h 05')
  })
  it('affiche des heures rondes sans minutes', () => {
    expect(formatDuration(480)).toBe('8 h')
  })
  it('affiche les durées courtes en minutes', () => {
    expect(formatDuration(45)).toBe('45 min')
    expect(formatDuration(0)).toBe('0 min')
  })
  it('arrondit à la minute', () => {
    expect(formatDuration(59.6)).toBe('1 h')
  })
  it('renvoie une chaîne vide pour une valeur invalide', () => {
    expect(formatDuration(undefined)).toBe('')
    expect(formatDuration(NaN)).toBe('')
    expect(formatDuration(-5)).toBe('')
  })
})

describe('sleepStateLabel', () => {
  it('traduit les états Health Connect', () => {
    expect(sleepStateLabel('asleep')).toBe('endormi')
    expect(sleepStateLabel('deep')).toBe('sommeil profond')
    expect(sleepStateLabel('rem')).toBe('sommeil paradoxal')
    expect(sleepStateLabel('light')).toBe('sommeil léger')
    expect(sleepStateLabel('awake')).toBe('éveillé')
    expect(sleepStateLabel('inBed')).toBe('au lit')
  })
  it('renvoie la valeur brute si inconnue, vide si absente', () => {
    expect(sleepStateLabel('foo')).toBe('foo')
    expect(sleepStateLabel(undefined)).toBe('')
  })
})

describe('periodLabel', () => {
  it('traduit les périodes', () => {
    expect(periodLabel('day')).toBe('sur la journée')
    expect(periodLabel('hour')).toBe("sur l'heure")
    expect(periodLabel('xyz')).toBe('xyz')
    expect(periodLabel(undefined)).toBe('')
  })
})

describe('pickLabelIndices', () => {
  it('garde tout quand il y a de la place', () => {
    expect(pickLabelIndices(5, 7)).toEqual([0, 1, 2, 3, 4])
  })
  it('espace régulièrement et garde toujours le dernier', () => {
    const idx = pickLabelIndices(15, 6)
    expect(idx.length).toBeLessThanOrEqual(6)
    expect(idx[idx.length - 1]).toBe(14)
    const gaps = idx.slice(1).map((v, i) => v - idx[i])
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(2)
  })
  it('gère les cas limites', () => {
    expect(pickLabelIndices(0, 6)).toEqual([])
    expect(pickLabelIndices(1, 6)).toEqual([0])
    expect(pickLabelIndices(14, 1)).toEqual([13])
  })
})

describe('formatSigned', () => {
  it('affiche le signe et la virgule française', () => {
    expect(formatSigned(0.364, 2)).toBe('+0,36')
    expect(formatSigned(-0.284, 2)).toBe('−0,28')
    expect(formatSigned(-1.25, 1)).toBe('−1,3')
  })
  it("n'affiche jamais « −0,00 » : une valeur qui s'arrondit à zéro est neutre", () => {
    expect(formatSigned(-0.001, 2)).toBe('0,00')
    expect(formatSigned(0.004, 2)).toBe('0,00')
    expect(formatSigned(-0.04, 1)).toBe('0,0')
  })
})

describe('workoutTypeLabel', () => {
  it('traduit les types d’activité Health Connect courants', () => {
    expect(workoutTypeLabel('cycling')).toBe('Vélo')
    expect(workoutTypeLabel('running')).toBe('Course à pied')
    expect(workoutTypeLabel('walking')).toBe('Marche')
    expect(workoutTypeLabel('strengthTraining')).toBe('Renforcement musculaire')
  })
  it('rend lisible un type inconnu plutôt que de l’afficher brut', () => {
    expect(workoutTypeLabel('dumbbellLateralRaise')).toBe('Dumbbell lateral raise')
  })
  it('renvoie une chaîne vide sans type', () => {
    expect(workoutTypeLabel(undefined)).toBe('')
  })
})

describe('evidenceLabel', () => {
  it('accorde le niveau de confiance avec « hypothèse »', () => {
    expect(evidenceLabel('solide')).toBe('Hypothèse solide')
    expect(evidenceLabel('à confirmer')).toBe('Hypothèse à confirmer')
    expect(evidenceLabel('incertain')).toBe('Hypothèse incertaine')
  })
})

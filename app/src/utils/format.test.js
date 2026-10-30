import { describe, it, expect } from 'vitest'
import { formatDuration, sleepStateLabel, periodLabel, pickLabelIndices, formatSigned, workoutTypeLabel, evidenceLabel, shortFoodName, formatClock, formatPace, workoutDetailParts } from './format'

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
  it('suit l’échelle unique de DESIGN.md (VC-23)', () => {
    expect(evidenceLabel('solide')).toBe('Piste solide')
    expect(evidenceLabel('à confirmer')).toBe('À confirmer')
    expect(evidenceLabel('incertain')).toBe('Trop tôt pour dire')
  })
})

describe('shortFoodName', () => {
  it('retire la cuisson et les précisions d’un nom Ciqual', () => {
    expect(shortFoodName('Saumon, cuit à la vapeur')).toBe('Saumon')
    expect(shortFoodName("Brocoli, bouilli/cuit à l'eau (aliment moyen)")).toBe('Brocoli')
    expect(shortFoodName("Pomme de terre, bouillie/cuite à l'eau")).toBe('Pomme de terre')
    expect(shortFoodName('Haricot vert, cuit')).toBe('Haricot vert')
  })
  it('retire aussi la partie du fruit et la forme du café (POL-PLAY-55)', () => {
    expect(shortFoodName('Banane, chair sans peau, crue')).toBe('Banane')
    expect(shortFoodName('Pomme, chair et peau, crue')).toBe('Pomme')
    expect(shortFoodName('Café, non instantané, non sucré, prêt à boire')).toBe('Café')
    expect(shortFoodName('Mangue, pulpe, crue')).toBe('Mangue')
    expect(shortFoodName('Pêche, pelée, crue')).toBe('Pêche')
  })
  it('garde la précision qui distingue l’aliment après un mot seul', () => {
    expect(shortFoodName("Poulet, cuisse, viande bouillie/cuite à l'eau")).toBe('Poulet, cuisse')
    expect(shortFoodName('Fromage, emmental')).toBe('Fromage, emmental')
    expect(shortFoodName('Pain, baguette, courante')).toBe('Pain, baguette')
  })
  it('laisse un nom simple tel quel', () => {
    expect(shortFoodName('Riz blanc cuit')).toBe('Riz blanc cuit')
    expect(shortFoodName('  Café  ')).toBe('Café')
  })
  it('renvoie une chaîne vide sans nom', () => {
    expect(shortFoodName(undefined)).toBe('')
    expect(shortFoodName('')).toBe('')
  })
})

describe('formatClock', () => {
  it('formats minutes after midnight as a French clock time rounded to 5 min', () => {
    expect(formatClock(23 * 60 + 27)).toBe('23 h 25')
    expect(formatClock(7 * 60)).toBe('7 h')
    expect(formatClock(1439)).toBe('0 h')
  })
})

describe('séances de la montre (M7)', () => {
  it('allure en min:s par km, FC moyenne, rien si la montre n’a rien envoyé', () => {
    expect(formatPace(324)).toBe('5:24 /km')
    expect(formatPace(299.6)).toBe('5:00 /km')
    expect(workoutDetailParts({ avgHeartRate: 135, paceSplitsSecPerKm: [330, 318] })).toEqual(['FC moy. 135 bpm', '5:24 /km'])
    expect(workoutDetailParts({ workoutType: 'yoga' })).toEqual([])
    expect(workoutDetailParts(null)).toEqual([])
  })
})

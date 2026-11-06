import { describe, it, expect } from 'vitest'
import { mealHoursEffect, signFlipP, MEAL_HOURS_MIN_DAYS } from './mealHours'

const NEUTRAL = { smile: 0.1, duchenne: 0.05, mouthFrown: 0.05, browDown: 0.15, browInnerUp: 0.1, yaw: 4 }

function burst(at, valence) {
  return { type: 'face_burst', source: 'face_sense', at: at.toISOString(), payload: { v: 1, trigger: 'unlock', frames: 3, valid: 3, values: { ...NEUTRAL, valence, arousal: 0 }, rejected: {} } }
}
const meal = (at) => ({ type: 'food', source: 'app_food', at: at.toISOString(), payload: { items: [{ name: 'Riz' }] } })
const day = (i, h, m = 0) => new Date(2026, 9, 1 + i, h, m)
// Petit bruit déterministe, sans sens.
const jitter = (i, h) => (((i * 7 + h * 13) % 5) - 2) * 0.02

/** `days` jours ; `lunchAt(i)` heure du déjeuner ; `valence(i, h, afterMeal)` valence de la lecture de l'heure h. */
function build(days, { lunchAt = () => 12, valence }) {
  const entries = []
  for (let i = 0; i < days; i++) {
    const lunch = lunchAt(i)
    entries.push(meal(day(i, 7, 30)), meal(day(i, Math.floor(lunch), (lunch % 1) * 60)), meal(day(i, 19, 30)))
    for (const h of [9, 11, 13, 15, 17, 18, 20, 21]) {
      const after = (h >= lunch && h - lunch <= 2) || (h >= 19.5 && h - 19.5 <= 2) || (h >= 7.5 && h - 7.5 <= 2)
      entries.push(burst(day(i, h), valence(i, h, after) + jitter(i, h)))
    }
  }
  return entries
}

describe('mealHoursEffect — bien-être dans les heures après un repas (ANALYSES-ONGLETS-5)', () => {
  it('sans lecture du visage, ou sans repas noté : rien à comparer', () => {
    expect(mealHoursEffect([meal(day(0, 12))])).toEqual({ status: 'no_face' })
    expect(mealHoursEffect([burst(day(0, 9), 0), burst(day(0, 10), 0), burst(day(0, 11), 0)])).toEqual({ status: 'no_meals' })
  })

  it('pas assez de jours avec des lectures près et loin des repas : compteur', () => {
    const res = mealHoursEffect(build(5, { valence: () => 0 }))
    expect(res).toEqual({ status: 'not_enough_data', currentDays: 5, minDays: MEAL_HOURS_MIN_DAYS })
  })

  it('bien-être plus haut dans les 2 h après les repas : écart net et positif', () => {
    const res = mealHoursEffect(build(14, { valence: (i, h, after) => (after ? 0.35 : -0.05) }))
    expect(res.status).toBe('ok')
    expect(res.days).toBe(14)
    expect(res.shift).toBeGreaterThan(0.1)
    expect(res.clear).toBe(true)
  })

  it('le sens n’est pas présupposé : plus bas après les repas, dit tel quel', () => {
    const res = mealHoursEffect(build(14, { valence: (i, h, after) => (after ? -0.35 : 0.05) }))
    expect(res.shift).toBeLessThan(-0.1)
    expect(res.clear).toBe(true)
  })

  it('aucun lien avec les repas : pas d’écart net', () => {
    const res = mealHoursEffect(build(14, { valence: (i, h) => jitter(i + 3, h * 2) * 3 }))
    expect(res.status).toBe('ok')
    expect(res.clear).toBe(false)
  })

  it('le moment de la journée ne se fait pas passer pour un effet des repas', () => {
    // Le visage est plus souriant vers 13 h tous les jours ; le déjeuner est à 12 h trois jours sur quatre, à 14 h sinon.
    const res = mealHoursEffect(build(16, { lunchAt: (i) => (i % 4 ? 12 : 14), valence: (i, h) => (h === 13 ? 0.4 : 0) }))
    expect(res.status).toBe('ok')
    expect(res.clear).toBe(false)
    expect(Math.abs(res.shift)).toBeLessThan(0.1)
  })

  it('la lecture d’avant le repas ne compte jamais comme « après »', () => {
    // Déjeuner noté à 13 h 30 : la lecture de 13 h, plus haute, le précède.
    const res = mealHoursEffect(build(14, { lunchAt: () => 13.5, valence: (i, h) => (h === 13 ? 0.5 : 0) }))
    expect(res.status === 'ok' ? res.shift : 0).toBeLessThanOrEqual(0)
  })

  it('test de permutation des signes : stable (graine fixe) et dans ]0, 1]', () => {
    const d = [0.3, 0.2, 0.25, 0.1, 0.4, 0.2, 0.3, 0.15, 0.2, 0.35]
    expect(signFlipP(d)).toBe(signFlipP(d))
    expect(signFlipP(d)).toBeLessThan(0.01)
    expect(signFlipP([0.2, -0.2, 0.1, -0.1, 0.05, -0.05, 0.3, -0.3, 0.01, -0.01])).toBeGreaterThan(0.5)
  })
})

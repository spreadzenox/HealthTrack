import { describe, it, expect } from 'vitest'
import { dayChecklist, mealSlotOf, MEAL_SLOTS } from './dayChecklist'

const at = (h, m = 0, dayOffset = 0) => new Date(2026, 10, 15 + dayOffset, h, m).toISOString()
const meal = (h, dish = 'Repas') => ({ id: `m${h}`, type: 'food', at: at(h), payload: { dish } })
const NOON = new Date(2026, 10, 15, 12, 0)
const EVENING = new Date(2026, 10, 15, 20, 0)

describe('mealSlotOf', () => {
  it('range un repas dans Matin, Midi ou Soir selon son heure', () => {
    expect(MEAL_SLOTS.map((s) => s.label)).toEqual(['Matin', 'Midi', 'Soir'])
    expect(mealSlotOf(at(7, 30))).toBe('morning')
    expect(mealSlotOf(at(10, 59))).toBe('morning')
    expect(mealSlotOf(at(11))).toBe('noon')
    expect(mealSlotOf(at(15, 59))).toBe('noon')
    expect(mealSlotOf(at(16))).toBe('evening')
    expect(mealSlotOf(at(23, 30))).toBe('evening')
  })
})

describe('dayChecklist', () => {
  it('journée vide sans objectif digestion : repas et bien-être, jamais le ventre', () => {
    const c = dayChecklist([], { now: NOON, askGut: false })
    expect(c.tasks.map((t) => t.id)).toEqual(['meals', 'wellbeing'])
    expect(c.remaining).toBe(2)
    expect(c.allDone).toBe(false)
    expect(c.tasks[0].slots.map((s) => s.filled)).toEqual([false, false, false])
  })

  it('avec l’objectif digestion : le ventre attend le soir, puis se note', () => {
    const before = dayChecklist([], { now: NOON, askGut: true })
    expect(before.tasks.map((t) => t.id)).toEqual(['meals', 'wellbeing', 'gut'])
    expect(before.tasks[2]).toMatchObject({ done: false, available: false })
    expect(before.remaining).toBe(3)
    const after = dayChecklist([], { now: EVENING, askGut: true })
    expect(after.tasks[2]).toMatchObject({ done: false, available: true })
  })

  it('les repas remplissent leurs cercles ; la ligne est faite à 3 sur 3', () => {
    const two = dayChecklist([meal(8), meal(13)], { now: EVENING, askGut: false })
    expect(two.tasks[0].slots.map((s) => s.filled)).toEqual([true, true, false])
    expect(two.tasks[0].done).toBe(false)
    expect(two.tasks[0].count).toBe(2)
    const three = dayChecklist([meal(8), meal(13), meal(19)], { now: EVENING, askGut: false })
    expect(three.tasks[0].done).toBe(true)
    expect(three.remaining).toBe(1)
  })

  it('deux repas dans le même créneau ne remplissent qu’un cercle', () => {
    const c = dayChecklist([meal(12), meal(14)], { now: EVENING, askGut: false })
    expect(c.tasks[0].slots.map((s) => s.filled)).toEqual([false, true, false])
    expect(c.tasks[0].count).toBe(1)
  })

  it('seule une note de bien-être d’aujourd’hui compte ; une lecture du visage ne coche rien', () => {
    const yesterday = { id: 1, type: 'wellbeing', at: at(10, 0, -1), payload: { score: 4 } }
    const face = { id: 2, type: 'face_burst', at: at(9), payload: {} }
    expect(dayChecklist([yesterday, face], { now: NOON, askGut: false }).tasks[1].done).toBe(false)
    const note = { id: 3, type: 'wellbeing', at: at(9), payload: { score: 4 } }
    const c = dayChecklist([yesterday, face, note], { now: NOON, askGut: false })
    expect(c.tasks[1].done).toBe(true)
    expect(c.tasks[1].entry).toBe(note)
  })

  it('le ventre est fait avec le bilan du jour, pas avec une note d’un moment', () => {
    const moment = { id: 1, type: 'gut', at: at(19), payload: { level: 'calm' } }
    expect(dayChecklist([moment], { now: EVENING, askGut: true }).tasks[2].done).toBe(false)
    const bilan = { id: 2, type: 'gut', at: at(19, 30), payload: { level: 'discomfort', scope: 'day' } }
    const c = dayChecklist([moment, bilan], { now: EVENING, askGut: true })
    expect(c.tasks[2].done).toBe(true)
    expect(c.tasks[2].entry).toBe(bilan)
  })

  it('tout est noté : plus rien à faire, et la liste de ce qui est déjà noté', () => {
    const entries = [
      meal(8, 'Tartines'), meal(13, 'Salade'), meal(19, 'Soupe'),
      { id: 4, type: 'wellbeing', at: at(9), payload: { score: 4 } },
      { id: 5, type: 'gut', at: at(19, 30), payload: { level: 'calm', scope: 'day' } },
    ]
    const c = dayChecklist(entries, { now: EVENING, askGut: true })
    expect(c.allDone).toBe(true)
    expect(c.remaining).toBe(0)
    expect(c.noted.map((n) => n.kind)).toEqual(['meal', 'wellbeing', 'meal', 'meal', 'gut'])
  })

  it('« déjà noté » compte aussi les repas d’une ligne encore ouverte', () => {
    const c = dayChecklist([meal(8)], { now: NOON, askGut: false })
    expect(c.noted).toHaveLength(1)
    expect(c.remaining).toBe(2)
  })
})

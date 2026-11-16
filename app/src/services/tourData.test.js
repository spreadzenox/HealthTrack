import { describe, it, expect } from 'vitest'
import { buildTourEntries } from './tourData'
import { measuresOf } from '../devices/deviceCapabilities'
import { gutNotesProgress } from './today'

const NOW = new Date(2026, 10, 8, 20, 0)

describe('données fictives de la visite (ACC-8)', () => {
  it('suivent les mesures reçues : sans VFC chez la personne, pas de VFC dans l’exemple', () => {
    const list = buildTourEntries({ days: 14, now: NOW, received: new Set(['steps', 'sleep', 'heartRate']) })
    const measures = new Set(list.flatMap(measuresOf))
    expect(measures.has('hrv')).toBe(false)
    expect(measures.has('steps')).toBe(true)
    expect(list.some((e) => e.type === 'wellbeing')).toBe(true)
  })

  it('sans source : ni pas ni sommeil, seulement ce qu’on note', () => {
    const list = buildTourEntries({ days: 14, now: NOW })
    expect(list.flatMap(measuresOf)).toEqual([])
    expect(list.some((e) => e.type === 'food')).toBe(true)
  })

  it('visage seulement s’il est activé', () => {
    expect(buildTourEntries({ days: 14, now: NOW }).some((e) => e.type === 'face_burst')).toBe(false)
    expect(buildTourEntries({ days: 14, now: NOW, face: true }).some((e) => e.type === 'face_burst')).toBe(true)
  })

  it('jour 28 : une note de digestion chaque jour, dont des jours de gêne', () => {
    const gut = buildTourEntries({ days: 28, now: NOW }).filter((e) => e.type === 'gut')
    expect(new Set(gut.map((e) => e.at.slice(0, 10))).size).toBeGreaterThanOrEqual(28)
    expect(gut.filter((e) => e.payload.level !== 'calm').length).toBeGreaterThanOrEqual(5)
  })

  it('jour 14 : 14 jours notés en digestion, comme chez qui note chaque soir (POLISH-SIM-39)', () => {
    // Au J1 le vrai écran dit « Encore 27 jours » : au jour 14 de l'exemple, il en reste 14, jamais 18
    const bar = gutNotesProgress(buildTourEntries({ days: 14, now: NOW }))
    expect(bar.days).toBe(14)
    expect(bar.remaining).toBe(14)
  })

  it('rien dans le futur : la note du soir d’aujourd’hui est ramenée à tout à l’heure', () => {
    const list = buildTourEntries({ days: 14, now: NOW })
    expect(list.every((e) => Date.parse(e.at) <= NOW.getTime())).toBe(true)
    expect(list.some((e) => e.type === 'wellbeing' && new Date(e.at).toDateString() === NOW.toDateString())).toBe(true)
  })

  it('tôt le matin, les saisies ramenées à aujourd’hui gardent leur ordre et des heures distinctes (REFONTE-7b-2)', () => {
    for (const [h, m] of [[0, 20], [1, 30], [9, 30], [14, 30]]) {
      const now = new Date(2026, 10, 16, h, m)
      const start = new Date(2026, 10, 16).getTime()
      const today = buildTourEntries({ days: 14, now }).filter((e) => new Date(e.at).toDateString() === now.toDateString())
      const times = today.map((e) => Date.parse(e.at))
      // deux repas d'hier recopiés : jamais à la même minute
      const meals = today.filter((e) => e.type === 'food').map((e) => e.at)
      expect(meals.length).toBeGreaterThanOrEqual(2)
      expect(new Set(meals).size).toBe(meals.length)
      expect(Math.max(...times)).toBeLessThanOrEqual(now.getTime())
      expect(Math.min(...times)).toBeGreaterThanOrEqual(start)
      // la note du soir reste la dernière saisie du jour
      const note = today.find((e) => e.type === 'wellbeing')
      expect(Date.parse(note.at)).toBe(Math.max(...times))
    }
  })

  it('aucune entrée n’a d’identifiant : elles ne visent jamais la base', () => {
    expect(buildTourEntries({ days: 14, now: NOW }).every((e) => e.id === undefined)).toBe(true)
  })
})

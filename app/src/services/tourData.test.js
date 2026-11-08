import { describe, it, expect } from 'vitest'
import { buildTourEntries } from './tourData'
import { measuresOf } from '../devices/deviceCapabilities'

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

  it('rien dans le futur : la note du soir d’aujourd’hui est ramenée à tout à l’heure', () => {
    const list = buildTourEntries({ days: 14, now: NOW })
    expect(list.every((e) => Date.parse(e.at) <= NOW.getTime())).toBe(true)
    expect(list.some((e) => e.type === 'wellbeing' && new Date(e.at).toDateString() === NOW.toDateString())).toBe(true)
  })

  it('aucune entrée n’a d’identifiant : elles ne visent jamais la base', () => {
    expect(buildTourEntries({ days: 14, now: NOW }).every((e) => e.id === undefined)).toBe(true)
  })
})

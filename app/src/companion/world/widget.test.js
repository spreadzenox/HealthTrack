import { describe, expect, it } from 'vitest'
import { dayText, mealNotification, remainingText, widgetPose, widgetState } from './widget.js'
import { worldState } from './index.js'

const d = (h, m = 0) => new Date(2026, 10, 19, h, m) // jeudi 19/11/2026

describe('widget', () => {
  it('choisit une des six poses', () => {
    expect(widgetPose({ now: d(23), remaining: 3 })).toBe('dort')
    expect(widgetPose({ now: d(3), remaining: 0 })).toBe('dort')
    expect(widgetPose({ now: d(14), remaining: 0 })).toBe('fete')
    expect(widgetPose({ now: d(7, 20), remaining: 2 })).toBe('se-reveille')
    expect(widgetPose({ now: d(8, 20), remaining: 2, wakeMinute: 8 * 60 })).toBe('se-reveille')
    expect(widgetPose({ now: d(19), remaining: 2 })).toBe('soir')
    expect(widgetPose({ now: d(13), remaining: 2, lastMealAt: d(12, 15).toISOString() })).toBe('rassasie')
    expect(widgetPose({ now: d(15), remaining: 2, lastMealAt: d(12, 15).toISOString() })).toBe('content')
  })

  it('écrit ce qui reste, jamais ce qui a été oublié', () => {
    expect(remainingText(0)).toBe('Plus rien à faire')
    expect(remainingText(1)).toBe('Encore 1 chose')
    expect(remainingText(3)).toBe('Encore 3 choses')
    expect(dayText(d(10), 3)).toBe('Jeudi · jour 3')
    expect(dayText(d(10), 12)).toBe('Jeudi')
    expect(dayText(d(10))).toBe('Jeudi')
  })

  it('donne un état complet, lisible au lecteur d’écran, au nom choisi', () => {
    const bubbles = [
      { label: 'Repas', theme: 'digestion' },
      { label: 'Bien-être', theme: 'wellbeing' },
      { label: 'Méditation', theme: 'habit' },
      { label: 'Lecture', theme: 'habit' },
      { label: 'Ventre', theme: 'digestion' },
    ]
    const s = widgetState({ now: d(15), name: 'Bulle', bubbles, usageDay: 3 })
    expect(s).toMatchObject({ pose: 'content', title: 'Encore 5 choses', day: 'Jeudi · jour 3', more: 1, link: 'halcya://journee' })
    expect(s.bubbles).toHaveLength(4)
    expect(s.accessibility).toBe('Bulle est content. Encore 5 choses : Repas, Bien-être, Méditation, Lecture, Ventre. Jeudi · jour 3.')
    const done = widgetState({ now: d(15), bubbles: [] })
    expect(done.accessibility).toBe('Pilou fait la fête. Plus rien à faire. Jeudi.')
    for (const t of [s.accessibility, done.accessibility]) expect(t).not.toMatch(/manqu|oubli|retard|série/i)
  })

  it('la nuit, le reste attend demain, sans compte', () => {
    const s = widgetState({ now: d(23), name: 'Bulle', bubbles: [{ label: 'Repas' }, { label: 'Bien-être' }], usageDay: 3 })
    expect(s).toMatchObject({ pose: 'dort', title: 'Le reste peut attendre demain', bubbles: [], more: 0 })
    expect(s.accessibility).toBe('Bulle dort. Le reste peut attendre demain. Jeudi · jour 3.')
  })

  it('notification d’un repas seulement s’il n’est pas noté', () => {
    expect(mealNotification('lunch', { name: 'Bulle' })).toEqual({
      title: 'Bulle garde une place pour votre déjeuner',
      body: "Une photo de votre assiette, et c'est noté.",
      image: 'content',
    })
    expect(mealNotification('lunch', { alreadyNoted: true })).toBeNull()
    expect(mealNotification('goûter')).toBeNull()
  })
})

describe('état du monde', () => {
  it('rassemble lumière, météo, croissance, saison et étiquette', () => {
    const w = worldState({
      now: d(15, 30),
      weather: { temperature: 11, precipitation: 0.5, at: d(15).toISOString() },
      usageDays: 30,
      latitude: 47.2,
    })
    expect(w.day).toBe('2026-11-19')
    expect(w.light.sun.color).toBe('#FFCFA0')
    expect(w.weather.effect).toBe('pluie')
    expect(w.growth.neighbourIsland).toBe(true)
    expect(w.season).toBe('automne')
    expect(w.label).toBe('Pluie fine · 11 °C')
    expect(w.labels).toEqual(['Pluie fine · 11 °C'])
  })

  it('la nuit, l’étiquette dit que Pilou dort (avec son nom), puis la météo', () => {
    const w = worldState({ now: d(23, 30), name: 'Bulle', weather: { temperature: 4, at: d(23).toISOString() } })
    expect(w.label).toBe('Bulle dort. Le reste peut attendre demain.')
    expect(w.labels).toEqual(['Bulle dort. Le reste peut attendre demain.', 'Froid · 4 °C'])
    expect(w.light.asleep).toBe(true)
  })

  it('en mouvements réduits : fondu de 600 ms et aucune particule', () => {
    const w = worldState({ now: d(10), reducedMotion: true, weather: { precipitation: 3, at: d(10).toISOString() } })
    expect(w.lightFadeMs).toBe(600)
    expect(w.weather.particles).toEqual({ kind: null, count: 0 })
  })
})

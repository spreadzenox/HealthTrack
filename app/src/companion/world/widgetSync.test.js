import { afterEach, describe, expect, it, vi } from 'vitest'
import { resetWidgetContextCache, syncPilouWidget, takePilouWidgetOpen, widgetDayState } from './widgetSync.js'
import { widgetState } from './widget.js'

const now = new Date(2026, 10, 19, 13, 0)
const iso = (h, m = 0) => new Date(2026, 10, 19, h, m).toISOString()
const habits = [{ id: 'meditation', label: 'Méditation' }]

afterEach(() => resetWidgetContextCache())

describe('état du widget', () => {
  it('reprend les lignes de Ma journée, dans le même ordre', () => {
    const entries = [{ type: 'food', source: 'app_food', at: iso(12, 15), payload: {} }]
    const s = widgetDayState(entries, { now, habits, askGut: true, context: { daysOfUse: 2, wake: 420, bedtime: 1380 } })
    expect(s.planned).toEqual(['Repas', 'Bien-être', 'Méditation', 'Digestion'])
    expect(s.remaining).toEqual(['Repas', 'Bien-être', 'Méditation', 'Digestion'])
    expect(s.lastMealAt).toBe(new Date(iso(12, 15)).getTime())
    expect(s).toMatchObject({ day: '2026-11-19', wake: 420, bed: 1380, usageDay: 2, name: 'Pilou' })
    // même pose que la règle JS (et que PilouWidgetRule.java) : un repas il y a 45 min → rassasié
    expect(widgetState({ now, bubbles: s.remaining.map((label) => ({ label })), lastMealAt: iso(12, 15) }).pose).toBe('rassasie')
  })

  it('sans objectif digestion, pas de ligne digestion ; sans saisie aujourd’hui, le jour d’usage avance', () => {
    const s = widgetDayState([], { now, context: { daysOfUse: 4 } })
    expect(s.planned).toEqual(['Repas', 'Bien-être'])
    expect(s.usageDay).toBe(5)
    expect(s.wake).toBe(-1)
  })
})

describe('synchronisation', () => {
  it('envoie l’état au plugin, lit le contexte une fois par jour', async () => {
    const plugin = { update: vi.fn(async () => {}) }
    const loadContext = vi.fn(async () => ({ daysOfUse: 1, wake: null, bedtime: null }))
    expect(await syncPilouWidget({ entries: [], now, plugin, loadContext })).toBe(true)
    expect(await syncPilouWidget({ entries: [], now, plugin, loadContext })).toBe(true)
    expect(loadContext).toHaveBeenCalledTimes(1)
    expect(plugin.update.mock.calls[0][0].state.remaining).toEqual(['Repas', 'Bien-être'])
  })

  it('porte le nom choisi pour le compagnon (Réglages ou rencontre), « Pilou » sinon', async () => {
    const plugin = { update: vi.fn(async () => {}) }
    const loadContext = async () => ({})
    localStorage.setItem('halcya_companion', JSON.stringify({ name: 'Noisette' }))
    await syncPilouWidget({ entries: [], now, plugin, loadContext })
    expect(plugin.update.mock.calls[0][0].state.name).toBe('Noisette')
    localStorage.removeItem('halcya_companion')
    await syncPilouWidget({ entries: [], now, plugin, loadContext })
    expect(plugin.update.mock.calls[1][0].state.name).toBe('Pilou')
  })

  it('sans plugin (iPhone, navigateur) : rien ; une erreur ne remonte jamais', async () => {
    expect(await syncPilouWidget({ entries: [], now, plugin: null })).toBe(false)
    const broken = { update: async () => { throw new Error('x') } }
    expect(await syncPilouWidget({ entries: [], now, plugin: broken, loadContext: async () => ({}) })).toBe(false)
    expect(await takePilouWidgetOpen(null)).toBe(false)
    expect(await takePilouWidgetOpen({ takeOpen: async () => ({ open: true }) })).toBe(true)
  })
})

import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { bus, EVENTS } from './bus'
import { USAGE_DAYS_KEY } from './world/context.js'
import { worldDayKey } from './world/daylight.js'

const { default: CompanionScene } = await import('./CompanionScene')

afterEach(() => {
  cleanup()
  bus.clear()
  localStorage.removeItem(USAGE_DAYS_KEY)
})

describe("la croissance de l'îlot dans la scène (MONDE-3)", () => {
  it('à l’ouverture, la croissance vient du décompte gardé, sans relire les notes', async () => {
    const now = new Date(2026, 10, 17, 12, 0)
    localStorage.setItem(USAGE_DAYS_KEY, JSON.stringify({ day: worldDayKey(now), days: 45 }))
    const seen = []
    bus.on(EVENTS.TIME_PHASE, (p) => seen.push(p))
    render(<CompanionScene now={() => now} />)
    await vi.waitFor(() => expect(seen.some((p) => p.growth)).toBe(true))
    const g = seen.find((p) => p.growth).growth
    expect(g.days).toBe(45)
    expect(g.islandScaleXZ).toBeGreaterThan(1)
    expect(g.season).toBe('automne')
  })

  it('sans décompte gardé : îlot de départ en attendant le recompte', async () => {
    const now = new Date(2026, 10, 17, 12, 0)
    const seen = []
    bus.on(EVENTS.TIME_PHASE, (p) => seen.push(p))
    render(<CompanionScene now={() => now} />)
    await vi.waitFor(() => expect(seen.some((p) => p.growth)).toBe(true))
    expect(seen.find((p) => p.growth).growth.days).toBe(0)
  })
})

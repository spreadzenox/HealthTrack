import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { bus, EVENTS } from './bus'

// Couché vers 0 h 15, levé vers 9 h (MONDE-1) : l'île suit ces heures-là, comme le widget Android.
vi.mock('./world/context.js', async (importOriginal) => {
  const real = await importOriginal()
  const load = async () => ({ wake: 9 * 60, bedtime: 15 })
  return { ...real, sleepHabitsForDay: ({ now } = {}) => real.sleepHabitsForDay({ now, load }) }
})

const { default: CompanionScene } = await import('./CompanionScene')
const { resetWorldContextCache } = await import('./world/context.js')

afterEach(() => {
  cleanup()
  bus.clear()
  resetWorldContextCache()
})

// La scène émet plusieurs fois à l'ouverture (heures par défaut, croissance, puis heures lues) : on attend l'état
// attendu sur la dernière émission ; avec 7 h et 22 h 30 par défaut, 23 h et 8 h donneraient l'inverse.
async function phaseAt(date, asleep) {
  const seen = []
  bus.on(EVENTS.TIME_PHASE, (p) => seen.push(p.light))
  render(<CompanionScene now={() => date} />)
  await vi.waitFor(() => expect(seen[seen.length - 1]?.asleep).toBe(asleep))
  return seen[seen.length - 1]
}

describe('lever et coucher réels sur l’île (MONDE-1)', () => {
  it('à 23 h, Pilou veille encore quand on se couche vers 0 h 15', async () => {
    const l = await phaseAt(new Date(2026, 10, 17, 23, 0), false)
    expect(l.asleep).toBe(false)
    expect(screen.queryByText('Pilou dort')).toBeNull()
  })

  it('à 0 h 30, il dort', async () => {
    const l = await phaseAt(new Date(2026, 10, 18, 0, 30), true)
    expect(l.asleep).toBe(true)
    await vi.waitFor(() => expect(screen.getByText('Pilou dort')).toBeTruthy())
  })

  it('à 8 h, il dort encore quand on se lève vers 9 h', async () => {
    const l = await phaseAt(new Date(2026, 10, 18, 8, 0), true)
    expect(l.asleep).toBe(true)
  })
})

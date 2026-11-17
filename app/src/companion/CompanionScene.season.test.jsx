import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { bus, EVENTS } from './bus'

// La position météo dit l'hémisphère : nord par défaut, sud si la latitude est négative (MONDE-2).
let lat = null
vi.mock('../services/weatherSync', async (importOriginal) => {
  const real = await importOriginal()
  return { ...real, getWeatherSettings: () => (lat == null ? { enabled: false } : { enabled: false, location: { lat, lon: 0 } }) }
})

const { default: CompanionScene } = await import('./CompanionScene')

afterEach(() => {
  cleanup()
  bus.clear()
  lat = null
})

async function seasonAt(date) {
  const seen = []
  bus.on(EVENTS.TIME_PHASE, (p) => seen.push(p))
  render(<CompanionScene now={() => date} />)
  await vi.waitFor(() => expect(seen.some((p) => p.season)).toBe(true))
  return seen.find((p) => p.season).season
}

describe("la saison de l'îlot (MONDE-2)", () => {
  it('le 17 novembre, c’est l’automne dans l’hémisphère nord', async () => {
    expect(await seasonAt(new Date(2026, 10, 17, 12, 0))).toBe('automne')
  })

  it('le 10 janvier, c’est l’hiver', async () => {
    expect(await seasonAt(new Date(2027, 0, 10, 12, 0))).toBe('hiver')
  })

  it('dans l’hémisphère sud, le 17 novembre est au printemps', async () => {
    lat = -34.6
    expect(await seasonAt(new Date(2026, 10, 17, 12, 0))).toBe('printemps-ete')
  })
})

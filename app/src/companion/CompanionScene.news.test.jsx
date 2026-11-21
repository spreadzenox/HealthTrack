import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { bus, EVENTS } from './bus'
import { USAGE_DAYS_KEY, WORLD_SEEN_KEY } from './world/context.js'
import { worldDayKey } from './world/daylight.js'

const { default: CompanionScene } = await import('./CompanionScene')

afterEach(() => {
  cleanup()
  bus.clear()
  localStorage.removeItem(USAGE_DAYS_KEY)
  localStorage.removeItem(WORLD_SEEN_KEY)
})

const seenBefore = { pond: false, neighbour: true, tree: false, season: 'automne' }

describe("la nouvelle de l'îlot à l'ouverture (MONDE-4b)", () => {
  it('le petit arbre est dit dans l’étiquette et Pilou saute, une seule fois', async () => {
    const now = new Date(2026, 10, 17, 12, 0)
    localStorage.setItem(USAGE_DAYS_KEY, JSON.stringify({ day: worldDayKey(now), days: 45 }))
    localStorage.setItem(WORLD_SEEN_KEY, JSON.stringify(seenBefore))
    const news = []
    bus.on(EVENTS.WORLD_NEWS, (p) => news.push(p))
    render(<CompanionScene now={() => now} />)
    expect(await screen.findByText("L'arbuste est devenu un petit arbre")).toBeTruthy()
    expect(news.map((p) => p.text)).toEqual(["L'arbuste est devenu un petit arbre"])
    cleanup()
    render(<CompanionScene now={() => now} />)
    await vi.waitFor(() => expect(JSON.parse(localStorage.getItem(WORLD_SEEN_KEY)).tree).toBe(true))
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.queryByText("L'arbuste est devenu un petit arbre")).toBeNull()
  })

  it('la nouvelle passe avant l’étiquette de l’Accueil, le temps de la dire', async () => {
    const now = new Date(2026, 10, 17, 12, 0)
    localStorage.setItem(USAGE_DAYS_KEY, JSON.stringify({ day: worldDayKey(now), days: 45 }))
    localStorage.setItem(WORLD_SEEN_KEY, JSON.stringify(seenBefore))
    render(<CompanionScene now={() => now} label="Pilou est tranquille · 2 bulles à faire" />)
    expect(await screen.findByText("L'arbuste est devenu un petit arbre")).toBeTruthy()
  })

  it('la nuit, Pilou dort : la nouvelle attend le matin', async () => {
    const night = new Date(2026, 10, 17, 2, 0)
    localStorage.setItem(USAGE_DAYS_KEY, JSON.stringify({ day: worldDayKey(night), days: 45 }))
    localStorage.setItem(WORLD_SEEN_KEY, JSON.stringify(seenBefore))
    const phases = []
    bus.on(EVENTS.TIME_PHASE, (p) => phases.push(p))
    render(<CompanionScene now={() => night} />)
    await vi.waitFor(() => expect(phases.some((p) => p.growth?.tree)).toBe(true))
    expect(screen.queryByText("L'arbuste est devenu un petit arbre")).toBeNull()
    expect(JSON.parse(localStorage.getItem(WORLD_SEEN_KEY)).tree).toBe(false)
  })
})

describe("l'image fixe suit l'îlot (palier bas, MONDE-4b)", () => {
  it('à 60 jours en automne : îlot voisin, herbe dorée ; la nuit : Pilou qui dort', async () => {
    const now = new Date(2026, 10, 17, 12, 0)
    localStorage.setItem(USAGE_DAYS_KEY, JSON.stringify({ day: worldDayKey(now), days: 60 }))
    const day = render(<CompanionScene now={() => now} />)
    await vi.waitFor(() => expect(day.container.querySelector('img.companion-scene__still').getAttribute('src')).toMatch(/j30-automne/))
    cleanup()
    const night = new Date(2026, 10, 17, 2, 0)
    const n = render(<CompanionScene now={() => night} />)
    await vi.waitFor(() => expect(n.container.querySelector('img.companion-scene__still').getAttribute('src')).toMatch(/nuit/))
  })

  it('ciel sombre avant le coucher : Pilou veille, l’image du soir ne le montre pas endormi (NUIT-ETIQUETTE, STILL-SOIR)', async () => {
    // 22 h : étoiles au ciel, coucher par défaut à 22 h 30 → « soir », Pilou veille à la lanterne
    const evening = new Date(2026, 10, 17, 22, 0)
    localStorage.setItem(USAGE_DAYS_KEY, JSON.stringify({ day: worldDayKey(evening), days: 60 }))
    const { container } = render(<CompanionScene now={() => evening} />)
    await vi.waitFor(() => expect(container.querySelector('img.companion-scene__still').getAttribute('src')).toMatch(/soir/))
    expect(screen.queryByText(/dort/)).toBeNull()
    cleanup()
    // 18 h : encore jour au ciel → l'îlot éclairé de son étape et de sa saison
    const dusk = new Date(2026, 10, 17, 18, 0)
    const d = render(<CompanionScene now={() => dusk} />)
    await vi.waitFor(() => expect(d.container.querySelector('img.companion-scene__still').getAttribute('src')).toMatch(/j30-automne/))
  })

  it('avant de connaître les jours d’usage : l’îlot nu de la saison', async () => {
    const now = new Date(2027, 0, 10, 12, 0)
    const { container } = render(<CompanionScene now={() => now} />)
    await vi.waitFor(() => expect(container.querySelector('img.companion-scene__still').getAttribute('src')).toMatch(/j0-hiver/))
  })
})

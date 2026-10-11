import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WatchGuides from './WatchGuides'
import { WATCH_GUIDES } from '../data/watchGuides'

describe('WatchGuides', () => {
  it('propose un guide par grande marque, Huawei en premier', () => {
    render(<WatchGuides />)
    expect(screen.getByRole('heading', { name: /Votre montre n’apparaît pas/ })).toBeInTheDocument()
    const ids = WATCH_GUIDES.map((g) => g.id)
    expect(ids[0]).toBe('huawei')
    expect(ids).toEqual(expect.arrayContaining(['samsung', 'xiaomi', 'garmin']))
  })

  it('détaille le chemin Huawei → Gadgetbridge → Health Connect sans réinitialiser la montre', () => {
    render(<WatchGuides />)
    fireEvent.click(screen.getByText(/Huawei \/ Honor/))
    expect(screen.getByText(/Ne désappairez pas la montre/)).toBeInTheDocument()
    expect(screen.getByText(/ID de compte Huawei/)).toBeInTheDocument()
    expect(screen.getAllByText(/Health Connect/).length).toBeGreaterThan(1)
    const fdroid = screen.getByRole('link', { name: /Gadgetbridge sur F-Droid/ })
    expect(fdroid).toHaveAttribute('href', 'https://f-droid.org/packages/nodomain.freeyourgadget.gadgetbridge/')
    expect(fdroid).toHaveAttribute('target', '_blank')
    // Les contreparties sont dites honnêtement.
    expect(screen.getByText(/stress/)).toBeInTheDocument()
  })

  it('chaque guide a des étapes', () => {
    for (const g of WATCH_GUIDES) expect(g.steps.length).toBeGreaterThan(0)
  })
})

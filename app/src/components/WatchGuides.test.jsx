import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WatchGuides from './WatchGuides'
import { WATCH_GUIDES, watchGuidesFor } from '../data/watchGuides'
import { featuresFor } from '../config/distribution'

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

  it('variante play : Huawei renvoie à la connexion directe, sans cookie ni F12 (VC-13)', () => {
    const play = watchGuidesFor(featuresFor('play'))
    expect(play.map((g) => g.id)).toEqual(WATCH_GUIDES.map((g) => g.id))
    const huawei = play.find((g) => g.id === 'huawei')
    render(<ol>{huawei.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>)
    const text = [huawei.intro, document.body.textContent, huawei.caveats].join(' ')
    expect(text).toMatch(/Connecter ma montre/)
    expect(text).toMatch(/dissociez jamais/i)
    expect(text).not.toMatch(/F12|cookie|userId|F-Droid/i)
    expect(watchGuidesFor(featuresFor('sideload'))).toBe(WATCH_GUIDES)
    // VC-7 : pas de renvoi vers la carte Withings, masquée en play
    const other = play.find((g) => g.id === 'other')
    expect(other.steps.length).toBe(WATCH_GUIDES.find((g) => g.id === 'other').steps.length - 1)
  })
})

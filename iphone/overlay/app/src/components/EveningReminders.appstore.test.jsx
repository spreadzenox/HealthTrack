import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Version iOS (HealthTrack-iOS) : rappels du soir (bien-être, Android v855 ; bilan du ventre) quand les notifications
// ont été refusées : l'iPhone dit où les rétablir (Réglages › Notifications › Halcya), jamais « réglages Android »
vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, DISTRIBUTION: 'appstore', FEATURES: actual.featuresFor('appstore') }
})

vi.mock('../storage/localHealthStorage', () => ({
  createEntry: vi.fn(() => Promise.resolve(1)),
  updateEntry: vi.fn(() => Promise.resolve()),
  listEntries: vi.fn(() => Promise.resolve([])),
  upsertEntries: vi.fn(() => Promise.resolve({ inserted: 0, skipped: 0 })),
}))

import WellbeingPrompt from './WellbeingPrompt'
import GutEveningReminder from './GutEveningReminder'

const IPHONE = /autorisez-les dans Réglages › Notifications › Halcya\./

/** Notifications refusées une fois pour toutes : l'iPhone ne peut plus les redemander. */
function refused() {
  let s = { enabled: false, minuteOfDay: 21 * 60, notifications: false }
  return {
    status: vi.fn(async () => s),
    configure: vi.fn(async (o) => (s = { ...s, ...o })),
    requestNotifications: vi.fn(async () => ({ asked: false, notifications: false })),
    list: vi.fn(async () => ({ notes: [] })),
    remove: vi.fn(),
  }
}

describe('Rappels du soir sur iPhone, notifications refusées', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    delete window.__healthtrackFakeEveningNote
    delete window.__healthtrackFakeGutEvening
  })

  it('bien-être, « Recevoir un rappel » : dit où les autoriser sur l’iPhone, sans mot d’Android', async () => {
    window.__healthtrackFakeEveningNote = refused()
    const onClose = vi.fn()
    const { container } = render(<WellbeingPrompt open onClose={onClose} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Recevoir un rappel' }))
    fireEvent.click(screen.getByRole('button', { name: 'Programmer le rappel' }))
    expect(await screen.findByText(IPHONE)).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/Android/)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('bilan du ventre, interrupteur de Paramètres : même indication', async () => {
    window.__healthtrackFakeGutEvening = refused()
    const { container } = render(<GutEveningReminder variant="setting" />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(await screen.findByText(IPHONE)).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/Android/)
  })
})

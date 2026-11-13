import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Version iOS (HealthTrack-iOS) : Android v809 (SELLES-PHOTO-2) ajoute « Selles : estimer la forme avec une photo ».
// Masquée sur iPhone du 5/11 après-midi (correctif 42) jusqu'à la décision du propriétaire du 05/11 vers 20:15 : la photo
// des selles fait partie de la soumission (il déclare « Santé » dans « Confidentialité de l'app »). Même règle qu'Android :
// seulement avec l'objectif digestion. Android v884 (AUJ-1b, 07/11) : la ligne quitte le Journal pour le bouton
// « Selles » du bandeau d'ajout de l'Accueil (même composant, `StoolPhotoLine`), sur iPhone comme sur Android.
vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, DISTRIBUTION: 'appstore', FEATURES: actual.featuresFor('appstore') }
})
vi.mock('../storage/localHealthStorage', () => ({
  listEntries: vi.fn(),
  countEntries: vi.fn(),
  deleteEntry: vi.fn(),
  updateEntry: vi.fn(),
  createEntry: vi.fn(),
}))
vi.mock('react-router-dom', async (importOriginal) => ({ ...(await importOriginal()), useNavigate: () => vi.fn() }))

import Journal from './Journal'
import StoolPhotoLine from '../components/StoolPhotoLine'

const ONBOARDING_KEY = 'healthtrack_onboarding'

describe('Photo des selles sur iPhone, comme sur Android (décision du 05/11 ; Accueil depuis v884)', () => {
  beforeEach(async () => {
    const { listEntries, countEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([])
    countEntries.mockResolvedValue(0)
  })

  it('la ligne a quitté le Journal, même avec l’objectif digestion', async () => {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify({ done: true, goal: 'gut' }))
    render(<BrowserRouter><Journal /></BrowserRouter>)
    await screen.findByText('Vos derniers jours')
    expect(screen.queryByRole('button', { name: /estimer la forme avec une photo/ })).toBeNull()
    localStorage.removeItem(ONBOARDING_KEY)
  })

  it('le composant du bouton « Selles » de l’Accueil reste proposé sur iPhone', async () => {
    render(<BrowserRouter><StoolPhotoLine /></BrowserRouter>)
    expect(await screen.findByRole('button', { name: /Selles : estimer la forme avec une photo/ })).toBeInTheDocument()
  })
})

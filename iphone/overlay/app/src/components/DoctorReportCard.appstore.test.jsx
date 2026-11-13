import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Version iOS (HealthTrack-iOS) : le fichier se retrouve dans Fichiers › Sur mon iPhone › Halcya. Depuis l'ouverture
// de l'achat sur iPhone (I6), le rapport fait partie de l'abonnement, comme sur Google Play.
vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, DISTRIBUTION: 'appstore', FEATURES: actual.featuresFor('appstore'), STORE: actual.storeFor('appstore') }
})

import DoctorReportCard from './DoctorReportCard'

const subscribed = { premium: true, source: 'appstore', state: 'active', tier: 'silver', productId: 'halcya_premium', expiresAt: '2099-01-01T00:00:00.000Z' }

describe('Rapport PDF sur iPhone (variante appstore)', () => {
  beforeEach(() => localStorage.clear())

  it('abonné : indique où retrouver le fichier sur iPhone', async () => {
    localStorage.setItem('halcya_entitlement', JSON.stringify(subscribed))
    const create = vi.fn().mockResolvedValue({ fileName: 'rapport.pdf', bytes: new Uint8Array() })
    const save = vi.fn().mockResolvedValue({ saved: 'documents', shared: true })
    render(<MemoryRouter><DoctorReportCard create={create} save={save} /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: /Préparer le rapport/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Créer le PDF' }))
    expect(await screen.findByText('rapport.pdf est aussi dans l’app Fichiers › Sur mon iPhone › Halcya.')).toBeInTheDocument()
  })

  it('sans abonnement : « Débloquer » mène à l’écran d’abonnement, comme sur Google Play', () => {
    render(<MemoryRouter><DoctorReportCard create={vi.fn()} save={vi.fn()} /></MemoryRouter>)
    expect(screen.getByRole('link', { name: 'Débloquer' })).toHaveAttribute('href', '/premium')
  })
})

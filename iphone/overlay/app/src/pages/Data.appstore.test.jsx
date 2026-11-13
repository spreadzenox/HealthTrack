import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Version iOS (HealthTrack-iOS) : pas de « sauvegarde Google » ni d'Android sur la page des données
vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, DISTRIBUTION: 'appstore', FEATURES: actual.featuresFor('appstore') }
})
vi.mock('../storage/localHealthStorage', () => ({
  exportToJson: vi.fn(), importFromJson: vi.fn(), parseBackup: vi.fn(), countAllEntries: vi.fn(async () => 12),
}))
vi.mock('../components/DoctorReportCard', () => ({ default: () => null }))
vi.mock('../services/deleteAllData', () => ({ deleteAllMyData: vi.fn() }))

import Data from './Data'

describe('Vos données sur iPhone (variante appstore)', () => {
  it('garde le conseil d’exporter, sans parler de la sauvegarde Google ni d’Android', () => {
    render(<MemoryRouter><Data /></MemoryRouter>)
    // Phrase d'Android depuis v674 (SLOP-1b-4) : « Vos données sont sur ce téléphone et passent les mises à jour. »
    const intro = screen.getByText(/passent les mises à jour/)
    expect(intro).toHaveTextContent(/changer de téléphone, exportez-les/)
    expect(intro).not.toHaveTextContent(/Google|Android/)
    // Copie de secours tenue à jour par l'app (overlay/app/src/ios/snapshot.js)
    expect(intro).toHaveTextContent(/copie de secours est tenue à jour dans l’app Fichiers › Sur mon iPhone › Halcya/)
  })

  it('avant de tout supprimer : les connexions restantes nomment l’app Santé, pas Health Connect', async () => {
    render(<MemoryRouter><Data /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: /Supprimer toutes mes données/ }))
    const hint = await screen.findByText(/Restent : vos réglages/)
    expect(hint).toHaveTextContent('vos connexions (montre, app Santé)')
    expect(hint).not.toHaveTextContent(/Health Connect/)
  })
})

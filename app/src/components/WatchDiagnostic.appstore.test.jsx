import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Version iOS (HealthTrack-iOS) : la lecture directe des montres Huawei passe par un plugin Android absent sur iPhone
vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, DISTRIBUTION: 'appstore', FEATURES: actual.featuresFor('appstore') }
})

import WatchDiagnostic from './WatchDiagnostic'

afterEach(() => {
  delete window.Capacitor
})

describe('Montre Huawei sur iPhone (variante appstore)', () => {
  it('dans l’app iPhone : ni test ni connexion, un message honnête, sans renvoi vers l’app Android', () => {
    window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'ios', isPluginAvailable: () => false }
    render(<MemoryRouter><WatchDiagnostic setup={null} connect={null} /></MemoryRouter>)
    expect(screen.getByText(/La lecture directe des montres Huawei n’est pas encore possible sur iPhone/)).toBeInTheDocument()
    expect(screen.queryByText(/app Android/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })
})

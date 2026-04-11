import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Connectors from './Connectors'

// Helpers to create a promise that never resolves (simulates a hanging native bridge call)
function neverResolves() {
  return new Promise(() => {})
}

// Mock the connector registry
vi.mock('../connectors/connectorRegistry', () => ({
  CONNECTORS: [
    {
      id: 'test_connector',
      name: 'Test Connector',
      description: 'A test connector for unit tests',
      dataTypes: ['steps', 'sleep'],
      isAvailable: vi.fn().mockResolvedValue(false),
      availabilityDetails: vi.fn().mockResolvedValue({ available: false, reason: 'unavailable' }),
      checkPermissions: vi.fn().mockResolvedValue('not_asked'),
      requestPermissions: vi.fn().mockResolvedValue('denied'),
      openHealthConnectSettings: vi.fn().mockResolvedValue(true),
      openSamsungHealth: vi.fn().mockResolvedValue(true),
      openGooglePlaySystemUpdates: vi.fn().mockResolvedValue(true),
      sync: vi.fn().mockResolvedValue({ synced: 0, skipped: 0, errors: [] }),
    },
  ],
}))

// Mock storage functions
vi.mock('../storage/localHealthStorage', () => ({
  upsertEntries: vi.fn().mockResolvedValue({ inserted: 0, skipped: 0 }),
  getLatestEntryAt: vi.fn().mockResolvedValue(null),
}))

// Mock connector settings
vi.mock('../settings/connectorSettings', () => ({
  getConnectorSettings: vi.fn().mockReturnValue({
    enabled: false,
    lastSyncAt: null,
    lastSyncResult: null,
    historicalSince: null,
  }),
  setConnectorSettings: vi.fn(),
}))

function renderConnectors() {
  return render(
    <BrowserRouter>
      <Connectors />
    </BrowserRouter>
  )
}

describe('Connectors page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the page title', () => {
    renderConnectors()
    expect(screen.getByRole('heading', { name: /Connecteurs/i })).toBeInTheDocument()
  })

  it('renders the connector name', async () => {
    renderConnectors()
    await waitFor(() => {
      expect(screen.getByText('Test Connector')).toBeInTheDocument()
    })
  })

  it('renders the connector description', async () => {
    renderConnectors()
    await waitFor(() => {
      expect(screen.getByText(/A test connector for unit tests/i)).toBeInTheDocument()
    })
  })

  it('renders the toggle checkbox for each connector', async () => {
    renderConnectors()
    const toggle = screen.getByRole('checkbox', { name: /Activer Test Connector/i })
    expect(toggle).toBeInTheDocument()
    expect(toggle).not.toBeChecked()
  })

  it('shows availability and permission badges', async () => {
    renderConnectors()
    // The connector is not available (mocked to return false)
    await waitFor(() => {
      expect(screen.getByText('Non disponible')).toBeInTheDocument()
    })
  })

  it('enables the connector when toggle is clicked', async () => {
    const { setConnectorSettings } = await import('../settings/connectorSettings')
    renderConnectors()
    const toggle = screen.getByRole('checkbox', { name: /Activer Test Connector/i })
    fireEvent.click(toggle)
    expect(setConnectorSettings).toHaveBeenCalledWith('test_connector', { enabled: true })
  })

  it('shows the Samsung Fit 3 setup instructions', () => {
    renderConnectors()
    expect(screen.getByText(/Comment connecter la Samsung Galaxy Fit 3/i)).toBeInTheDocument()
  })

  it('shows Health Connect install instruction', () => {
    renderConnectors()
    const matches = screen.getAllByText(/Samsung Health/i)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('mentions system module (no Play Store) in setup instructions for Android 14+', () => {
    renderConnectors()
    expect(screen.getByText(/module système intégré/i)).toBeInTheDocument()
  })

  it('shows provider_update_required message when Health Connect needs a system update', async () => {
    const { CONNECTORS } = await import('../connectors/connectorRegistry')
    CONNECTORS[0].availabilityDetails.mockResolvedValue({ available: false, reason: 'provider_update_required' })

    renderConnectors()
    // Enable the connector so the alert body is shown
    const { getConnectorSettings } = await import('../settings/connectorSettings')
    getConnectorSettings.mockReturnValue({ enabled: true, lastSyncAt: null, lastSyncResult: null })

    // Re-render with enabled state
    const { unmount } = renderConnectors()
    await waitFor(() => {
      expect(screen.getByText(/nécessite une mise à jour/i)).toBeInTheDocument()
    })
    // Should also show settings and retry buttons (multiple occurrences due to wizard auto-open)
    expect(screen.getAllByRole('button', { name: /Ouvrir les paramètres Health Connect/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /Revérifier la disponibilité/i }).length).toBeGreaterThan(0)
    unmount()
  })

  it('shows sdk_unavailable message with system update steps for Android 16 / One UI 8', async () => {
    const { CONNECTORS } = await import('../connectors/connectorRegistry')
    CONNECTORS[0].availabilityDetails.mockResolvedValue({ available: false, reason: 'sdk_unavailable', platform: 'android' })

    const { getConnectorSettings } = await import('../settings/connectorSettings')
    getConnectorSettings.mockReturnValue({ enabled: true, lastSyncAt: null, lastSyncResult: null })

    const { unmount } = renderConnectors()
    await waitFor(() => {
      expect(screen.getByText(/Health Connect non disponible sur cet appareil/i)).toBeInTheDocument()
    })
    // Should mention system module (appears in alert and in help section)
    expect(screen.getAllByText(/module système intégré/i).length).toBeGreaterThan(0)
    // Should include buttons to open Health Connect settings (may appear multiple times due to wizard)
    expect(screen.getAllByRole('button', { name: /Ouvrir les paramètres Health Connect/i }).length).toBeGreaterThan(0)
    // Should include a retry button
    expect(screen.getAllByRole('button', { name: /Revérifier la disponibilité/i }).length).toBeGreaterThan(0)
    unmount()
  })

  it('shows settings and retry buttons in generic unavailable state', async () => {
    const { CONNECTORS } = await import('../connectors/connectorRegistry')
    CONNECTORS[0].availabilityDetails.mockResolvedValue({ available: false, reason: 'unavailable' })

    const { getConnectorSettings } = await import('../settings/connectorSettings')
    getConnectorSettings.mockReturnValue({ enabled: true, lastSyncAt: null, lastSyncResult: null })

    const { unmount } = renderConnectors()
    await waitFor(() => {
      expect(screen.getByText(/Health Connect non disponible\./i)).toBeInTheDocument()
    })
    // Multiple instances possible due to wizard auto-opening
    expect(screen.getAllByRole('button', { name: /Ouvrir les paramètres Health Connect/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /Revérifier la disponibilité/i }).length).toBeGreaterThan(0)
    unmount()
  })

  it('re-checks availability when retry button is clicked', async () => {
    const { CONNECTORS } = await import('../connectors/connectorRegistry')
    CONNECTORS[0].availabilityDetails.mockResolvedValue({ available: false, reason: 'sdk_unavailable', platform: 'android' })

    const { getConnectorSettings } = await import('../settings/connectorSettings')
    getConnectorSettings.mockReturnValue({ enabled: true, lastSyncAt: null, lastSyncResult: null })

    const { unmount } = renderConnectors()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Revérifier la disponibilité/i })).toBeInTheDocument()
    })

    // Simulate that after system update, Health Connect becomes available
    CONNECTORS[0].availabilityDetails.mockResolvedValue({ available: true, platform: 'android' })
    CONNECTORS[0].checkPermissions.mockResolvedValue('not_asked')

    fireEvent.click(screen.getByRole('button', { name: /Revérifier la disponibilité/i }))

    await waitFor(() => {
      expect(screen.getByText('Disponible')).toBeInTheDocument()
    })
    unmount()
  })

  it('does not tell Android 14+ users to install from Play Store', () => {
    renderConnectors()
    // The Play Store instruction should only appear in the Android 8-13 clarification, not as the primary step
    const playStoreText = screen.queryAllByText(/installez.*Health Connect.*Play Store/i)
    // It should appear only in the context of "Android 8-13 uniquement"
    playStoreText.forEach((el) => {
      expect(el.textContent).toMatch(/8.13/i)
    })
  })

  it('resolves to "Non disponible" when isAvailable never resolves (timeout fallback)', async () => {
    const { CONNECTORS } = await import('../connectors/connectorRegistry')
    CONNECTORS[0].availabilityDetails.mockReturnValue(neverResolves())
    CONNECTORS[0].isAvailable.mockReturnValue(neverResolves())
    CONNECTORS[0].checkPermissions.mockResolvedValue('not_asked')

    vi.useFakeTimers()
    try {
      // Render and let effects register their setTimeout calls
      await act(async () => {
        renderConnectors()
      })
      // Now advance past the 8-second timeout so the race resolves with the fallback
      await act(async () => {
        await vi.advanceTimersByTimeAsync(9000)
      })
      expect(screen.getByText('Non disponible')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  }, 15000)

  it('resolves to "Non demandé" when checkPermissions never resolves (timeout fallback)', async () => {
    const { CONNECTORS } = await import('../connectors/connectorRegistry')
    CONNECTORS[0].isAvailable.mockResolvedValue(false)
    CONNECTORS[0].checkPermissions.mockReturnValue(neverResolves())

    vi.useFakeTimers()
    try {
      await act(async () => {
        renderConnectors()
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(9000)
      })
      expect(screen.getByText('Non demandé')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  }, 15000)

  describe('Activation wizard', () => {
    it('shows the wizard launch button in the sdk_unavailable alert', async () => {
      const { CONNECTORS } = await import('../connectors/connectorRegistry')
      CONNECTORS[0].availabilityDetails.mockResolvedValue({ available: false, reason: 'sdk_unavailable', platform: 'android' })

      const { getConnectorSettings } = await import('../settings/connectorSettings')
      getConnectorSettings.mockReturnValue({ enabled: true, lastSyncAt: null, lastSyncResult: null })

      const { unmount } = renderConnectors()
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Lancer l'assistant d'activation/i })).toBeInTheDocument()
      })
      unmount()
    })

    it('shows the wizard launch button in the provider_update_required alert', async () => {
      const { CONNECTORS } = await import('../connectors/connectorRegistry')
      CONNECTORS[0].availabilityDetails.mockResolvedValue({ available: false, reason: 'provider_update_required' })

      const { getConnectorSettings } = await import('../settings/connectorSettings')
      getConnectorSettings.mockReturnValue({ enabled: true, lastSyncAt: null, lastSyncResult: null })

      const { unmount } = renderConnectors()
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Lancer l'assistant d'activation/i })).toBeInTheDocument()
      })
      unmount()
    })

    it('shows the wizard launch button in the generic unavailable alert', async () => {
      const { CONNECTORS } = await import('../connectors/connectorRegistry')
      CONNECTORS[0].availabilityDetails.mockResolvedValue({ available: false, reason: 'unavailable' })

      const { getConnectorSettings } = await import('../settings/connectorSettings')
      getConnectorSettings.mockReturnValue({ enabled: true, lastSyncAt: null, lastSyncResult: null })

      const { unmount } = renderConnectors()
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Lancer l'assistant d'activation/i })).toBeInTheDocument()
      })
      unmount()
    })

    it('opens the wizard dialog when launch button is clicked', async () => {
      const { CONNECTORS } = await import('../connectors/connectorRegistry')
      CONNECTORS[0].availabilityDetails.mockResolvedValue({ available: false, reason: 'sdk_unavailable', platform: 'android' })

      const { getConnectorSettings } = await import('../settings/connectorSettings')
      getConnectorSettings.mockReturnValue({ enabled: true, lastSyncAt: null, lastSyncResult: null })

      const { unmount } = renderConnectors()
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Lancer l'assistant d'activation/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /Lancer l'assistant d'activation/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /Assistant d'activation Health Connect/i })).toBeInTheDocument()
      })
      unmount()
    })

    it('auto-opens the wizard when connector is enabled and HC is unavailable', async () => {
      const { CONNECTORS } = await import('../connectors/connectorRegistry')
      CONNECTORS[0].availabilityDetails.mockResolvedValue({ available: false, reason: 'sdk_unavailable', platform: 'android' })

      const { getConnectorSettings } = await import('../settings/connectorSettings')
      // Connector is already enabled
      getConnectorSettings.mockReturnValue({ enabled: true, lastSyncAt: null, lastSyncResult: null })

      const { unmount } = renderConnectors()
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /Assistant d'activation Health Connect/i })).toBeInTheDocument()
      })
      unmount()
    })

    it('closes the wizard when the close button is clicked', async () => {
      const { CONNECTORS } = await import('../connectors/connectorRegistry')
      CONNECTORS[0].availabilityDetails.mockResolvedValue({ available: false, reason: 'sdk_unavailable', platform: 'android' })

      const { getConnectorSettings } = await import('../settings/connectorSettings')
      getConnectorSettings.mockReturnValue({ enabled: true, lastSyncAt: null, lastSyncResult: null })

      const { unmount } = renderConnectors()
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /Fermer l'assistant/i }))

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
      unmount()
    })

    it('shows step navigation buttons in the wizard', async () => {
      const { CONNECTORS } = await import('../connectors/connectorRegistry')
      CONNECTORS[0].availabilityDetails.mockResolvedValue({ available: false, reason: 'sdk_unavailable', platform: 'android' })

      const { getConnectorSettings } = await import('../settings/connectorSettings')
      getConnectorSettings.mockReturnValue({ enabled: true, lastSyncAt: null, lastSyncResult: null })

      const { unmount } = renderConnectors()
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // First step should show "Étape suivante" but not "Précédent"
      expect(screen.getByRole('button', { name: /Étape suivante/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Précédent/i })).not.toBeInTheDocument()

      // Go to next step
      fireEvent.click(screen.getByRole('button', { name: /Étape suivante/i }))

      // Second step should show both
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Précédent/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Étape suivante/i })).toBeInTheDocument()
      })
      unmount()
    })

    it('calls openGooglePlaySystemUpdates when primary action is triggered on step 1', async () => {
      const { CONNECTORS } = await import('../connectors/connectorRegistry')
      CONNECTORS[0].availabilityDetails.mockResolvedValue({ available: false, reason: 'sdk_unavailable', platform: 'android' })

      const { getConnectorSettings } = await import('../settings/connectorSettings')
      getConnectorSettings.mockReturnValue({ enabled: true, lastSyncAt: null, lastSyncResult: null })

      const { unmount } = renderConnectors()
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Step 1: primary action is "Mettre à jour Health Connect via Google Play"
      const dialog = screen.getByRole('dialog')
      const updateBtn = within(dialog).getByRole('button', { name: /Mettre à jour Health Connect via Google Play/i })
      fireEvent.click(updateBtn)

      await waitFor(() => {
        expect(CONNECTORS[0].openGooglePlaySystemUpdates).toHaveBeenCalled()
      })
      unmount()
    })

    it('calls openHealthConnectSettings when primary action is triggered on step 3', async () => {
      const { CONNECTORS } = await import('../connectors/connectorRegistry')
      CONNECTORS[0].availabilityDetails.mockResolvedValue({ available: false, reason: 'sdk_unavailable', platform: 'android' })

      const { getConnectorSettings } = await import('../settings/connectorSettings')
      getConnectorSettings.mockReturnValue({ enabled: true, lastSyncAt: null, lastSyncResult: null })

      const { unmount } = renderConnectors()
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Navigate to step 3 (0-indexed steps: 0=update, 1=samsung health, 2=permissions, 3=final check)
      for (let i = 0; i < 2; i++) {
        fireEvent.click(screen.getByRole('button', { name: /Étape suivante/i }))
        await waitFor(() => {
          expect(screen.getByRole('button', { name: /Précédent/i })).toBeInTheDocument()
        })
      }

      const dialog = screen.getByRole('dialog')
      const settingsBtn = within(dialog).getByRole('button', { name: /Ouvrir les paramètres Health Connect/i })
      fireEvent.click(settingsBtn)

      await waitFor(() => {
        expect(CONNECTORS[0].openHealthConnectSettings).toHaveBeenCalled()
      })
      unmount()
    })
  })
})

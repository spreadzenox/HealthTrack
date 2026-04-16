import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
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

  it('shows provider_update_required message when Health Connect needs a system update', async () => {
    const { CONNECTORS } = await import('../connectors/connectorRegistry')
    CONNECTORS[0].availabilityDetails.mockResolvedValue({ available: false, reason: 'provider_update_required' })

    const { getConnectorSettings } = await import('../settings/connectorSettings')
    getConnectorSettings.mockReturnValue({ enabled: true, lastSyncAt: null, lastSyncResult: null })

    const { unmount } = renderConnectors()
    await waitFor(() => {
      expect(screen.getByText(/nécessite une mise à jour/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /Ouvrir les paramètres Health Connect/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Revérifier la disponibilité/i })).toBeInTheDocument()
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
    expect(screen.getByText(/module système intégré/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ouvrir les paramètres Health Connect/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Revérifier la disponibilité/i })).toBeInTheDocument()
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
    expect(screen.getByRole('button', { name: /Ouvrir les paramètres Health Connect/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Revérifier la disponibilité/i })).toBeInTheDocument()
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
      // Advance past the 12-second availability timeout so the race resolves with the fallback
      await act(async () => {
        await vi.advanceTimersByTimeAsync(13000)
      })
      expect(screen.getByText('Non disponible')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  }, 20000)

  it('resolves to "Non demandé" when checkPermissions never resolves (timeout fallback)', async () => {
    const { CONNECTORS } = await import('../connectors/connectorRegistry')
    CONNECTORS[0].isAvailable.mockResolvedValue(false)
    // Explicitly mock availabilityDetails so it resolves immediately (state from a prior
    // test that called mockReturnValue(neverResolves()) is not reset by clearAllMocks).
    CONNECTORS[0].availabilityDetails.mockResolvedValue({ available: false, reason: 'unavailable' })
    CONNECTORS[0].checkPermissions.mockReturnValue(neverResolves())

    vi.useFakeTimers()
    try {
      await act(async () => {
        renderConnectors()
      })
      // Advance past the 12-second permissions timeout so the race resolves with the fallback
      await act(async () => {
        await vi.advanceTimersByTimeAsync(13000)
      })
      expect(screen.getByText('Non demandé')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  }, 20000)

})

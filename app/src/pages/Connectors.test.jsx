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
      openHealthConnectSettings: vi.fn().mockResolvedValue(undefined),
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
    // Should include a button to open Health Connect settings
    expect(screen.getByRole('button', { name: /Ouvrir les paramètres Health Connect/i })).toBeInTheDocument()
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
})

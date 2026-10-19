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
  listEntries: vi.fn().mockResolvedValue([]),
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

  it('n’affiche pas les badges techniques tant que la source est désactivée', async () => {
    const { getConnectorSettings } = await import('../settings/connectorSettings')
    getConnectorSettings.mockReturnValue({ enabled: false, lastSyncAt: null, lastSyncResult: null })
    renderConnectors()
    await screen.findByText('Test Connector')
    expect(screen.queryByText('Plateforme :')).not.toBeInTheDocument()
  })

  it('shows availability and permission badges', async () => {
    const { getConnectorSettings } = await import('../settings/connectorSettings')
    getConnectorSettings.mockReturnValue({ enabled: true, lastSyncAt: null, lastSyncResult: null })
    renderConnectors()
    // The connector is not available (mocked to return false)
    await waitFor(() => {
      expect(screen.getByText('Non disponible')).toBeInTheDocument()
    })
  })

  it('enables the connector when toggle is clicked', async () => {
    const { getConnectorSettings, setConnectorSettings } = await import('../settings/connectorSettings')
    getConnectorSettings.mockReturnValue({ enabled: false, lastSyncAt: null, lastSyncResult: null })
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
    const { getConnectorSettings } = await import('../settings/connectorSettings')
    getConnectorSettings.mockReturnValue({ enabled: true, lastSyncAt: null, lastSyncResult: null })
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
    const { getConnectorSettings } = await import('../settings/connectorSettings')
    getConnectorSettings.mockReturnValue({ enabled: true, lastSyncAt: null, lastSyncResult: null })
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

  it('propose d’autoriser les nouvelles mesures quand la synchro est déjà autorisée', async () => {
    const { CONNECTORS } = await import('../connectors/connectorRegistry')
    const c = CONNECTORS[0]
    c.availabilityDetails.mockResolvedValue({ available: true })
    c.checkPermissions.mockImplementation(async () => {
      c.missingReadTypes = ['respiratoryRate', 'bloodPressure']
      return 'granted'
    })
    c.requestPermissions.mockImplementation(async () => {
      c.missingReadTypes = []
      return 'granted'
    })
    const { getConnectorSettings } = await import('../settings/connectorSettings')
    getConnectorSettings.mockReturnValue({ enabled: true, lastSyncAt: null, lastSyncResult: null })

    const { unmount } = renderConnectors()
    expect(await screen.findByText(/fréquence respiratoire, tension artérielle/)).toBeInTheDocument()
    // La synchro reste possible en attendant.
    expect(screen.getByRole('button', { name: /Importer l'historique/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Autoriser ces mesures/ }))
    await waitFor(() => expect(c.requestPermissions).toHaveBeenCalled())
    await waitFor(() => expect(screen.queryByRole('button', { name: /Autoriser ces mesures/ })).not.toBeInTheDocument())
    delete c.missingReadTypes
    unmount()
  })

  it('affiche les guides par marque (montre Huawei absente de Health Connect)', async () => {
    const { CONNECTORS } = await import('../connectors/connectorRegistry')
    CONNECTORS[0].availabilityDetails.mockResolvedValue({ available: false, reason: 'unavailable' })
    CONNECTORS[0].checkPermissions.mockResolvedValue('not_asked')
    renderConnectors()
    expect(screen.getByText(/Huawei \/ Honor/)).toBeInTheDocument()
  })
  it('ordre par statut : une source active passe en tête, le reste est replié sous « Brancher une autre source »', async () => {
    const { getConnectorSettings } = await import('../settings/connectorSettings')
    getConnectorSettings.mockReturnValue({ enabled: true, lastSyncAt: null, lastSyncResult: null })
    const { container, unmount } = renderConnectors()
    const more = container.querySelector('details.connectors-more')
    expect(more.open).toBe(false)
    expect(screen.getByText('Brancher une autre source')).toBeInTheDocument()
    expect(more.contains(screen.getByText('Test Connector'))).toBe(false)
    expect(more.contains(screen.getByText(/Huawei \/ Honor/))).toBe(true)
    unmount()
  })

  it('premier lancement : rien de branché, « Sources à brancher » ouvert', async () => {
    const { getConnectorSettings } = await import('../settings/connectorSettings')
    getConnectorSettings.mockReturnValue({ enabled: false, lastSyncAt: null, lastSyncResult: null })
    const { container, unmount } = renderConnectors()
    expect(container.querySelector('details.connectors-more').open).toBe(true)
    expect(screen.getByText('Sources à brancher')).toBeInTheDocument()
    unmount()
  })

  it('app Android native : la carte « Lecture du visage » est visible en tête, hors du volet replié, même désactivée', async () => {
    const { getConnectorSettings } = await import('../settings/connectorSettings')
    getConnectorSettings.mockReturnValue({ enabled: true, lastSyncAt: null, lastSyncResult: null })
    const previous = window.Capacitor
    window.Capacitor = { ...(previous || {}), isNativePlatform: () => true, getPlatform: () => 'android' }
    try {
      const { container, unmount } = renderConnectors()
      const title = screen.getByRole('heading', { name: 'Lecture du visage' })
      const more = container.querySelector('details.connectors-more')
      expect(more.contains(title)).toBe(false)
      // première source de la page, avant les connecteurs actifs
      const cardTitles = [...container.querySelectorAll('h3')].map((h) => h.textContent)
      expect(cardTitles.indexOf('Lecture du visage')).toBeLessThan(cardTitles.indexOf('Test Connector'))
      const card = title.closest('section')
      expect(card.textContent).not.toContain('Disponible dans l’app Android.')
      unmount()
    } finally {
      window.Capacitor = previous
    }
  })
})

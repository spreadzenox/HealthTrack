import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Connectors from './Connectors'

// Mock the connector registry
vi.mock('../connectors/connectorRegistry', () => ({
  CONNECTORS: [
    {
      id: 'test_connector',
      name: 'Test Connector',
      description: 'A test connector for unit tests',
      dataTypes: ['steps', 'sleep'],
      isAvailable: vi.fn().mockResolvedValue(false),
      checkPermissions: vi.fn().mockResolvedValue('not_asked'),
      requestPermissions: vi.fn().mockResolvedValue('denied'),
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
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Recommendations from './Recommendations'

vi.mock('../storage/localHealthStorage', () => ({
  listEntries: vi.fn(),
}))


// Helper to build a minimal set of entries (no real health data)
function makeEntries(days = 0) {
  const entries = []
  for (let d = 1; d <= days; d++) {
    const date = `2026-01-${String(d).padStart(2, '0')}`
    entries.push({
      type: 'wellbeing',
      source: 'app_wellbeing',
      at: `${date}T12:00:00Z`,
      payload: { score: 2 + (d % 4) },
      id: d,
      created_at: `${date}T12:00:00Z`,
    })
    entries.push({
      type: 'sleep',
      source: 'health_connect',
      at: `${date}T08:00:00Z`,
      payload: { durationMinutes: 360 + d * 10 },
      id: 100 + d,
      created_at: `${date}T08:00:00Z`,
    })
    entries.push({
      type: 'steps',
      source: 'health_connect',
      at: `${date}T22:00:00Z`,
      payload: { value: 5000 + d * 300 },
      id: 200 + d,
      created_at: `${date}T22:00:00Z`,
    })
  }
  return entries
}

function renderPage() {
  return render(
    <BrowserRouter>
      <Recommendations />
    </BrowserRouter>
  )
}

describe('Recommendations page', () => {
  beforeEach(async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([])
  })

  it('renders the page title', async () => {
    renderPage()
    await screen.findByRole('heading', { name: /Recommandations/i })
    expect(screen.getByRole('heading', { name: /Recommandations/i })).toBeInTheDocument()
  })

  it('renders both tab buttons', async () => {
    renderPage()
    await screen.findByRole('heading', { name: /Recommandations/i })
    expect(screen.getByRole('button', { name: /Recommandations basiques/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Recommandations avancées/i })).toBeInTheDocument()
  })

  it('shows basic tab by default', async () => {
    renderPage()
    await screen.findByRole('heading', { name: /Recommandations/i })
    const basicBtn = screen.getByRole('button', { name: /Recommandations basiques/i })
    expect(basicBtn).toHaveAttribute('aria-selected', 'true')
  })

  it('shows not-enough-data message with 0 days for basic tab', async () => {
    renderPage()
    await screen.findByText(/Données insuffisantes/i)
    expect(screen.getByText(/Enregistrez votre bien-être/i)).toBeInTheDocument()
  })

  it('switches to advanced tab on click', async () => {
    renderPage()
    await screen.findByRole('heading', { name: /Recommandations/i })
    const advancedBtn = screen.getByRole('button', { name: /Recommandations avancées/i })
    fireEvent.click(advancedBtn)
    expect(advancedBtn).toHaveAttribute('aria-selected', 'true')
    await screen.findByText(/Données insuffisantes/i)
  })

  it('shows analysis when basic has enough data (2+ days)', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue(makeEntries(3))
    renderPage()
    await waitFor(() => {
      expect(screen.queryByText(/Chargement/i)).not.toBeInTheDocument()
    })
    // Not-enough-data placeholder for basic should NOT appear
    expect(screen.queryByText(/Données insuffisantes pour les recommandations basiques/i)).not.toBeInTheDocument()
    // Analysis metadata or sections should be visible
    expect(
      screen.queryByText(/Corrélations avec votre bien-être/i) ||
      screen.queryByText(/facteurs à améliorer/i) ||
      screen.queryByText(/Analyse sur/i)
    ).toBeTruthy()
  })

  it('shows advanced analysis after 7+ days', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue(makeEntries(7))
    renderPage()
    // Switch to advanced tab
    await screen.findByRole('button', { name: /Recommandations avancées/i })
    fireEvent.click(screen.getByRole('button', { name: /Recommandations avancées/i }))
    await waitFor(() => {
      expect(screen.queryByText(/Chargement/i)).not.toBeInTheDocument()
    })
    // Should show advanced analysis (not not-enough-data)
    expect(
      screen.queryByText(/recommandations avancées/i) === null ||
      screen.queryByText(/Analyse sur/i) !== null
    ).toBe(true)
  })

  it('shows remaining-days message when some but not enough data for advanced', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue(makeEntries(3))
    renderPage()
    // Click advanced tab after initial render (button should be there immediately)
    const advBtn = await screen.findByRole('button', { name: /Recommandations avancées/i })
    fireEvent.click(advBtn)
    await waitFor(() => {
      expect(screen.queryByText(/Chargement/i)).not.toBeInTheDocument()
    })
    // 3 days < 7 required for advanced — should show not-enough-data
    expect(screen.getByText(/Données insuffisantes pour les recommandations avancées/i)).toBeInTheDocument()
  })

  it('reloads when health-entries-updated event fires', async () => {
    const { listEntries } = await import('../storage/localHealthStorage')
    listEntries.mockResolvedValue([])
    renderPage()
    await screen.findByText(/Enregistrez votre bien-être/i)

    const callsBefore = listEntries.mock.calls.length

    // Simulate new data arriving
    listEntries.mockResolvedValue(makeEntries(5))
    window.dispatchEvent(new CustomEvent('health-entries-updated'))
    await waitFor(() => expect(listEntries.mock.calls.length).toBeGreaterThan(callsBefore))
  })
})

// ─── Correlation bar color semantics ─────────────────────────────────────────

describe('CorrelationBar color logic', () => {
  it('renders bar color based on the sign of r, not the variable direction', async () => {
    // Bar color is always determined by the raw Pearson r sign:
    //   r >= 0 → green (reco-corr-pos)
    //   r < 0  → red   (reco-corr-neg)
    // This keeps bar color and the displayed numeric sign coherent.
    const { listEntries } = await import('../storage/localHealthStorage')

    const analysisModule = await import('../services/analysisEngine')

    const spy = vi.spyOn(analysisModule, 'computeBasicCorrelations').mockReturnValue({
      status: 'ok',
      datasetDays: 3,
      correlations: [
        { variable: 'protein_g', label: 'Protéines', r: -0.97, direction: 'higher_better' },
        { variable: 'fat_g',     label: 'Lipides',   r:  0.65, direction: 'neutral' },
      ],
      topNegativeFactors: [],
    })

    listEntries.mockResolvedValue(makeEntries(3))
    renderPage()

    await waitFor(() => {
      expect(screen.queryByText(/Chargement/i)).not.toBeInTheDocument()
    })

    // Protéines (r<0) must have the red class regardless of direction
    const proteinLabel = await screen.findByText('Protéines')
    const proteinRow = proteinLabel.closest('.reco-corr-row')
    const proteinBar = proteinRow.querySelector('.reco-corr-bar')
    expect(proteinBar).toHaveClass('reco-corr-neg')
    expect(proteinBar).not.toHaveClass('reco-corr-pos')

    // Lipides (r>0) must have the green class
    const lipidLabel = screen.getByText('Lipides')
    const lipidRow = lipidLabel.closest('.reco-corr-row')
    const lipidBar = lipidRow.querySelector('.reco-corr-bar')
    expect(lipidBar).toHaveClass('reco-corr-pos')
    expect(lipidBar).not.toHaveClass('reco-corr-neg')

    spy.mockRestore()
  })
})

// ─── Navigation (App-level) test ──────────────────────────────────────────────

describe('Recommendations navigation link', () => {
  it('is present in the App navigation', async () => {
    const App = (await import('../App')).default
    render(<App />)
    const link = await screen.findByRole('link', { name: /Recommandations/i })
    expect(link).toHaveAttribute('href', '/recommendations')
  })
})

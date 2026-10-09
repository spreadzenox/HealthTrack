import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Recommendations from './Recommendations'

vi.mock('../storage/localHealthStorage', () => ({
  listEntriesForAnalysis: vi.fn(),
  countAllEntries: vi.fn().mockResolvedValue(0),
}))

// Prevent auto-sync from calling Health Connect during unit tests
vi.mock('../hooks/useAutoSync', () => ({
  useAutoSync: vi.fn(),
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
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue([])
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

  it('shows analysis when basic has enough data (5+ days)', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue(makeEntries(5))
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

  it('shows advanced analysis after 9+ days (MIN_DAYS_ADVANCED + HOLD_OUT_DAYS)', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue(makeEntries(9))
    renderPage()
    // Switch to advanced tab
    await screen.findByRole('button', { name: /Recommandations avancées/i })
    fireEvent.click(screen.getAllByRole('button', { name: /Recommandations avancées/i })[0])
    await waitFor(() => {
      expect(screen.queryByText(/Chargement/i)).not.toBeInTheDocument()
    })
    // Should show advanced analysis, not not-enough-data
    expect(screen.queryByText(/Analyse sur/i)).not.toBeNull()
  })

  it('lists redundant variables left out of the advanced model', async () => {
    // In makeEntries, sleep and steps both grow linearly with the day → r = 1
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue(makeEntries(20))
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: /Recommandations avancées/i }))
    expect(await screen.findByText(/Variables redondantes écartées/i)).toBeInTheDocument()
    expect(screen.getByText(/redondantes écartées/i).closest('p').textContent).toMatch(/Pas quotidiens \(≈ Durée de sommeil\)/)
  })

  it('shows remaining-days message when some but not enough data for advanced', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue(makeEntries(3))
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
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue([])
    renderPage()
    await screen.findByText(/Enregistrez votre bien-être/i)

    const callsBefore = listEntriesForAnalysis.mock.calls.length

    // Simulate new data arriving
    listEntriesForAnalysis.mockResolvedValue(makeEntries(5))
    window.dispatchEvent(new CustomEvent('health-entries-updated'))
    await waitFor(() => expect(listEntriesForAnalysis.mock.calls.length).toBeGreaterThan(callsBefore))
  })
})

// ─── Correlation bar color semantics ─────────────────────────────────────────

describe('CorrelationBar color logic', () => {
  it('renders bar color based on the sign of r, not the variable direction', async () => {
    // Bar color is always determined by the raw Pearson r sign:
    //   r >= 0 → green (reco-corr-pos)
    //   r < 0  → red   (reco-corr-neg)
    // This keeps bar color and the displayed numeric sign coherent.
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')

    const analysisModule = await import('../services/analysisEngine')

    const spy = vi.spyOn(analysisModule, 'computeBasicCorrelations').mockReturnValue({
      status: 'ok',
      datasetDays: 3,
      correlations: [
        { variable: 'protein_g', label: 'Protéines', r: -0.97, direction: 'higher_better' },
        { variable: 'fat_g',     label: 'Lipides',   r:  0.65, direction: 'neutral' },
      ],
      levers: [],
    })

    listEntriesForAnalysis.mockResolvedValue(makeEntries(3))
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

// ─── Auto-sync trigger ────────────────────────────────────────────────────────

describe('Recommendations auto-sync', () => {
  it('calls useAutoSync when the page mounts', async () => {
    const { useAutoSync } = await import('../hooks/useAutoSync')
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue([])

    render(
      <BrowserRouter>
        <Recommendations />
      </BrowserRouter>
    )

    await screen.findByRole('heading', { name: /Recommandations/i })
    expect(useAutoSync).toHaveBeenCalled()
  })
})

// ─── Navigation (App-level) test ──────────────────────────────────────────────

describe('Recommendations navigation link', () => {
  it('is present in the App navigation', async () => {
    const App = (await import('../App')).default
    render(<App />)
    const link = await screen.findByRole('link', { name: /Analyses/ })
    expect(link).toHaveAttribute('href', '/recommendations')
  })
})

// ─── Levers ("Pistes à tester") ──────────────────────────────────────────────

describe('Recommendations levers', () => {
  const baseCorr = { n: 40, nEff: 31.6, p: 0.001, q: 0.004, strength: 'modéré', evidence: 'solide' }

  async function renderWithBasic(result) {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    const analysisModule = await import('../services/analysisEngine')
    const spy = vi.spyOn(analysisModule, 'computeBasicCorrelations').mockReturnValue(result)
    listEntriesForAnalysis.mockResolvedValue(makeEntries(3))
    renderPage()
    await waitFor(() => expect(screen.queryByText(/Calcul des analyses/i)).not.toBeInTheDocument())
    return spy
  }

  it('shows each lever as an action with its strength, r, effective days and evidence level', async () => {
    const lever = {
      ...baseCorr, variable: 'steps', label: 'Pas quotidiens', r: 0.42,
      direction: 'higher_better', action: 'Marcher davantage',
    }
    const spy = await renderWithBasic({
      status: 'ok', datasetDays: 40, reliability: 'good',
      correlations: [lever], levers: [lever],
    })
    expect(await screen.findByText(/Pistes à tester/i)).toBeInTheDocument()
    expect(screen.getByText('Marcher davantage')).toBeInTheDocument()
    expect(screen.getByText(/lien modéré/i)).toBeInTheDocument()
    expect(screen.getByText(/r = \+0,42/)).toBeInTheDocument()
    expect(screen.getByText(/32 jours/)).toBeInTheDocument()
    expect(screen.getByText(/solide/i)).toBeInTheDocument()
    expect(screen.getByText(/ne prouve pas une cause/i)).toBeInTheDocument()
    expect(screen.queryByText(/% de corrélation/i)).not.toBeInTheDocument()
    spy.mockRestore()
  })

  it('explains that no lever stands out yet when the list is empty', async () => {
    const spy = await renderWithBasic({
      status: 'ok', datasetDays: 12, reliability: 'good',
      correlations: [{ ...baseCorr, variable: 'steps', label: 'Pas quotidiens', r: 0.05, q: 0.9, evidence: 'incertain', strength: 'négligeable' }],
      levers: [],
    })
    expect(await screen.findByText(/Aucune piste ne se dégage/i)).toBeInTheDocument()
    spy.mockRestore()
  })

  it('fades uncertain correlations in the chart', async () => {
    const solid = { ...baseCorr, variable: 'sleepMinutes', label: 'Durée de sommeil', r: 0.5, direction: 'higher_better' }
    const weak = { ...baseCorr, variable: 'fat_g', label: 'Lipides', r: -0.1, q: 0.8, evidence: 'incertain', direction: 'neutral' }
    const spy = await renderWithBasic({
      status: 'ok', datasetDays: 40, reliability: 'good',
      correlations: [solid, weak], levers: [],
    })
    const weakRow = (await screen.findByText('Lipides')).closest('.reco-corr-row')
    const solidRow = screen.getByText('Durée de sommeil').closest('.reco-corr-row')
    expect(weakRow).toHaveClass('reco-corr-row-uncertain')
    expect(solidRow).not.toHaveClass('reco-corr-row-uncertain')
    spy.mockRestore()
  })
  it('shows a near-zero correlation as 0,00 (never −0,00)', async () => {
    const tiny = { ...baseCorr, variable: 'fat_g', label: 'Lipides', r: -0.001, q: 0.99, evidence: 'incertain', direction: 'neutral' }
    const spy = await renderWithBasic({
      status: 'ok', datasetDays: 40, reliability: 'good',
      correlations: [tiny], levers: [],
    })
    const row = (await screen.findByText('Lipides')).closest('.reco-corr-row')
    expect(row).toHaveTextContent('0,00')
    expect(row).not.toHaveTextContent('−0,00')
    spy.mockRestore()
  })
})

describe('Recommendations — behaviour tags', () => {
  // 30 days; alcohol every 3rd day, the following day is worse.
  function taggedEntries() {
    const entries = makeEntries(30)
    for (const e of entries) {
      if (e.type !== 'wellbeing') continue
      const d = Number(e.at.slice(8, 10))
      e.payload = {
        score: (d - 1) % 3 === 0 ? 2 : 4,
        ...(d % 3 === 0 && { tags: ['alcohol'] }),
        ...(d === 4 && { tags: ['sick'] }),
      }
    }
    return entries
  }

  it('invites the user to add tags when none were ever used', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue(makeEntries(10))
    renderPage()
    expect(await screen.findByText(/Vos habitudes/i)).toBeInTheDocument()
    expect(screen.getByText(/Ajoutez des tags/i)).toBeInTheDocument()
  })

  it('compares days with and without each tag, with the day the effect is measured', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue(taggedEntries())
    renderPage()
    const card = (await screen.findByText('Alcool')).closest('.reco-tag-card')
    expect(card).toHaveTextContent(/Le lendemain/i)
    expect(card).toHaveTextContent(/2,0 \/ 5/)
    expect(card).toHaveTextContent(/4,0 sans/)
    expect(card).toHaveTextContent(/−2,0 point/)
    expect(card).toHaveTextContent(/Hypothèse solide/i)
    // A tag used on fewer than 5 days is listed as still being collected.
    expect(screen.getByText(/En cours de collecte/i)).toHaveTextContent(/Malade/)
  })

  it('labels an unconvincing tag « Hypothèse incertaine » (agreement with hypothèse)', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    const entries = taggedEntries()
    // Stress on even days: unrelated to the score pattern (period 3) → no clear effect.
    for (const e of entries) {
      if (e.type !== 'wellbeing') continue
      const d = Number(e.at.slice(8, 10))
      if (d % 2 === 0) e.payload.tags = [...(e.payload.tags ?? []), 'stress']
    }
    listEntriesForAnalysis.mockResolvedValue(entries)
    renderPage()
    const card = (await screen.findByText('Stress')).closest('.reco-tag-card')
    expect(card).toHaveTextContent(/Hypothèse incertaine/)
  })
})

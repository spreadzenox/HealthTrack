import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Recommendations from './Recommendations'
import { _resetAnalysisRunner } from '../services/analysisRunner'
import { bumpDataRevision } from '../storage/dataRevision'

vi.mock('../storage/localHealthStorage', () => ({
  listEntriesForAnalysis: vi.fn(),
  countAllEntries: vi.fn().mockResolvedValue(0),
  // Carte lilas des pistes (état vide, VC-2) : mêmes lectures que l'Accueil
  listEntries: vi.fn().mockResolvedValue([]),
}))

// Prevent auto-sync from calling Health Connect during unit tests
vi.mock('../hooks/useAutoSync', () => ({
  useAutoSync: vi.fn(),
}))


// Chaque test part d'un cache d'analyses vide (perf D2)
beforeEach(() => {
  localStorage.clear()
  _resetAnalysisRunner()
})

// Helper to build a minimal set of entries (no real health data)
function makeEntries(days = 0) {
  const entries = []
  for (let d = 1; d <= days; d++) {
    const date = `2026-01-${String(d).padStart(2, '0')}`
    entries.push({
      type: 'wellbeing',
      source: 'app_wellbeing',
      at: new Date(`${date}T21:30:00`).toISOString(), // le soir : toute la journée compte
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

/** Ouvre la note « Le modèle qui prédit votre bien-être » (ex-onglet « Analyse avancée »), en bas de page. */
async function openModel() {
  const summary = await screen.findByText('Le modèle qui prédit votre bien-être')
  summary.closest('details').open = true
  fireEvent(summary.closest('details'), new Event('toggle'))
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
    await screen.findByRole('heading', { name: /^Vos analyses$/i })
    expect(screen.getByRole('heading', { name: /^Vos analyses$/i })).toBeInTheDocument()
  })

  // POL-7 : une seule analyse, plus d'onglets « simple / avancée »
  it('shows one analysis, without « simple / avancée » tabs, and says on how many days it is based', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue(makeEntries(5))
    const { container } = renderPage()
    expect(await screen.findByText(/Pistes à tester/)).toBeInTheDocument()
    expect(screen.getByText(/analyse sur 5 jours notés/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Analyse simple|Analyse avancée/i })).toBeNull()
    expect(container.textContent).not.toMatch(/Analyse (simple|avancée)/)
    expect(screen.getByText('Des liens repérés dans vos données, pas des causes ni un diagnostic.')).toBeInTheDocument()
  })

  it('keeps a single « Comment c’est calculé » note, at the bottom of the page', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue(makeEntries(20))
    renderPage()
    await screen.findByText(/Pistes à tester/)
    const notes = screen.getAllByText(/Comment c.est calculé/)
    expect(notes).toHaveLength(1)
    const footer = notes[0].closest('footer')
    expect(footer).not.toBeNull()
    // Rien après le pied de page
    expect(footer.nextElementSibling).toBeNull()
  })

  // VC-2 : sans données, la page dit la même chose que la carte lilas de l'Accueil
  it('shows the same lilac card as the home page when there is no data, without tabs nor jargon', async () => {
    const { container } = renderPage()
    expect(await screen.findByText(/Vos pistes arrivent dans 21 jours/i)).toBeInTheDocument()
    expect(screen.getByText(/0\/21 jours avec un repas ou une note du ventre/)).toBeInTheDocument()
    expect(screen.getByText(/On préfère attendre plutôt que de vous montrer de faux suspects/)).toBeInTheDocument()
    // VC-12 : un seul seuil visible sous la carte lilas
    expect(screen.queryByText(/Pas encore assez de jours mesurés/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/au moins 5 jours/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Analyse simple/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Analyse avancée/i })).not.toBeInTheDocument()
    const text = container.textContent
    expect(text).not.toMatch(/recommandations/i)
    expect(text).not.toMatch(/≥ \d+j/)
    expect(text).not.toMatch(/Données insuffisantes/)
    expect(text).not.toContain('📊')
    // Données vierges : la carte lilas seule, ni « Bientôt » ni note de méthode
    expect(screen.queryByTestId('reco-soon')).toBeNull()
    expect(screen.queryByTestId('doctor-report')).toBeNull()
    expect(screen.queryByText(/Comment c.est calculé/)).toBeNull()
    // Déjà sur la page Pistes : pas de lien vers elle-même
    expect(screen.queryByRole('link', { name: /onglet (Pistes|Analyses)/i })).not.toBeInTheDocument()
  })

  it('keeps the wellbeing threshold in the lilac card details, not in a second card (VC-12)', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue(makeEntries(2))
    renderPage()
    await screen.findByText(/Vos pistes arrivent dans/i)
    expect(screen.queryByText(/Encore 3 jours avec une note de bien-être/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /détails/i }))
    expect(await screen.findByText(/liens avec le bien-être : 2\/5 jours avec une note de bien-être/)).toBeInTheDocument()
  })

  it('computes the prediction model only when its note is opened', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue(makeEntries(5))
    renderPage()
    await screen.findByText(/Pistes à tester/)
    expect(screen.queryByText(/Pas encore assez de jours mesurés/i)).toBeNull()
    await openModel()
    await screen.findByText(/Pas encore assez de jours mesurés/i)
  })

  it('shows analysis when basic has enough data (5+ days)', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue(makeEntries(5))
    renderPage()
    // Wait for the analysis itself (not just the end of « Chargement », which can
    // be observed before loading has even started — flaky on CI, run 309).
    await waitFor(() => {
      expect(
        screen.queryByTestId('reco-links') ||
        screen.queryByText(/facteurs à améliorer/i) ||
        screen.queryByText(/Analyse sur/i)
      ).toBeTruthy()
    })
    // Not-enough-data placeholder for basic should NOT appear
    expect(screen.queryByText(/Pas encore assez de jours mesurés/i)).not.toBeInTheDocument()
  })

  it('shows advanced analysis after 9+ days (MIN_DAYS_ADVANCED + HOLD_OUT_DAYS)', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue(makeEntries(9))
    renderPage()
    await openModel()
    // Should show advanced analysis, not not-enough-data (computed asynchronously)
    expect(await screen.findByText(/Analyse sur/i)).toBeInTheDocument()
  })

  it('lists redundant variables left out of the advanced model', async () => {
    // In makeEntries, sleep and steps both grow linearly with the day → r = 1
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue(makeEntries(20))
    renderPage()
    await openModel()
    expect(await screen.findByText(/Variables redondantes écartées/i)).toBeInTheDocument()
    expect(screen.getByText(/redondantes écartées/i).closest('p').textContent).toMatch(/Pas quotidiens \(≈ Durée de sommeil\)/)
  })

  it('shows remaining-days message when some but not enough data for advanced', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue(makeEntries(5))
    renderPage()
    // Click advanced tab after initial render (button should be there immediately)
    await openModel()
    // 5 days < 9 required for advanced — should show not-enough-data (computed asynchronously)
    expect(await screen.findByText(/Pas encore assez de jours mesurés/i)).toBeInTheDocument()
    expect(screen.getByText(/Encore 4 jours avec une note de bien-être \(vous en avez 5\)/)).toBeInTheDocument()
  })

  it('reloads when health-entries-updated event fires', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue([])
    renderPage()
    await screen.findByText(/Vos pistes arrivent dans/i)

    const callsBefore = listEntriesForAnalysis.mock.calls.length

    // Simulate new data arriving (a real write bumps the data revision before the event)
    listEntriesForAnalysis.mockResolvedValue(makeEntries(5))
    bumpDataRevision()
    window.dispatchEvent(new CustomEvent('health-entries-updated'))
    await waitFor(() => expect(listEntriesForAnalysis.mock.calls.length).toBeGreaterThan(callsBefore))
  })

  it('serves an already computed tab from the cache without recomputing (perf D2)', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue([])
    const first = renderPage()
    await screen.findByTestId('reco-basic-waiting')
    first.unmount()
    _resetAnalysisRunner() // app restarted: only the persisted cache remains
    const calls = listEntriesForAnalysis.mock.calls.length

    renderPage()
    expect(screen.getByTestId('reco-basic-waiting')).toBeInTheDocument()
    expect(listEntriesForAnalysis.mock.calls.length).toBe(calls)
  })
})

// ─── Correlation bar color semantics ─────────────────────────────────────────

describe('Correlation link direction', () => {
  it('says the direction in words, in the same card as every other link, never green / red (VC-24, D6)', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    const analysisModule = await import('../services/analysisEngine')
    const spy = vi.spyOn(analysisModule, 'computeBasicCorrelations').mockReturnValue({
      status: 'ok',
      datasetDays: 3,
      correlations: [
        { variable: 'protein_g', label: 'Protéines', r: -0.97, direction: 'higher_better', evidence: 'solide' },
        { variable: 'fat_g',     label: 'Lipides',   r:  0.65, direction: 'neutral', evidence: 'solide' },
      ],
      levers: [],
    })
    listEntriesForAnalysis.mockResolvedValue(makeEntries(3))
    renderPage()

    const protein = (await screen.findByText('Protéines')).closest('.reco-link-card')
    expect(protein).toHaveTextContent('plus c’est élevé, moins bon est votre bien-être')
    expect(protein).toHaveTextContent('r = −0,97')

    const lipid = screen.getByText('Lipides').closest('.reco-link-card')
    expect(lipid).toHaveTextContent('plus c’est élevé, meilleur est votre bien-être')
    expect(lipid).toHaveClass('reco-link-card--corr')

    expect(document.querySelector('.reco-corr-pos, .reco-corr-neg')).toBeNull()
    expect(screen.queryByText(/Vert =|Rouge =/)).not.toBeInTheDocument()
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

    await screen.findByRole('heading', { name: /^Vos analyses$/i })
    expect(useAutoSync).toHaveBeenCalled()
  })
})

// ─── Navigation (App-level) test ──────────────────────────────────────────────

describe('Recommendations navigation link', () => {
  it('is present in the App navigation', async () => {
    const App = (await import('../App')).default
    render(<App />)
    const nav = await screen.findByRole('navigation', { name: 'Principal' })
    const link = within(nav).getByRole('link', { name: /Analyses/ })
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

  it('shows each lever simply, with its statistics behind the chevron (POL-7b)', async () => {
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
    expect(screen.getByText(/solide/i)).toBeInTheDocument()
    // Simple d'abord : pas de r ni de jours indépendants avant le chevron
    expect(screen.queryByText(/r = \+0,42/)).not.toBeInTheDocument()
    const card = screen.getByText('Marcher davantage').closest('li')
    const chevron = within(card).getByRole('button', { name: 'Afficher les détails' })
    fireEvent.click(chevron)
    expect(chevron).toHaveAttribute('aria-expanded', 'true')
    expect(within(card).getByText(/r = \+0,42/)).toBeInTheDocument()
    expect(within(card).getByText(/32 jours/)).toBeInTheDocument()
    expect(screen.getByText(/ne prouve pas une cause/i)).toBeInTheDocument()
    expect(screen.queryByText(/% de corrélation/i)).not.toBeInTheDocument()
    spy.mockRestore()
  })

  it('says « Chez vous » on a lever with q < 0.05 and « À vérifier » on the single tentative one (I108)', async () => {
    const solid = {
      ...baseCorr, variable: 'sleepMinutes', label: 'Sommeil', r: 0.5,
      direction: 'higher_better', action: 'Dormir davantage', stage: 'personal',
    }
    const tentative = {
      ...baseCorr, q: 0.12, evidence: 'à confirmer', variable: 'steps', label: 'Pas quotidiens', r: 0.3,
      direction: 'higher_better', action: 'Marcher davantage', stage: 'toVerify',
    }
    const spy = await renderWithBasic({
      status: 'ok', datasetDays: 40, reliability: 'good',
      correlations: [solid, tentative], levers: [solid, tentative],
    })
    expect(await screen.findByText('Dormir davantage')).toBeInTheDocument()
    // VC-23 : l'échelle unique, la phrase longue derrière le chevron
    const solidCard = screen.getByText('Dormir davantage').closest('li')
    const verifyCard = screen.getByText('Marcher davantage').closest('li')
    expect(within(solidCard).getByText('Piste solide')).toBeInTheDocument()
    expect(within(verifyCard).getByText('À confirmer')).toBeInTheDocument()
    expect(screen.getByText(/Lien possible avec votre bien-être/)).toBeInTheDocument()
    expect(verifyCard).toHaveClass('reco-advice-card--verify')
    expect(screen.queryByText(/Chez vous : lien net|À vérifier : peut-être|Hypothèse (solide|à confirmer|incertaine)/)).not.toBeInTheDocument()
    fireEvent.click(within(verifyCard).getByRole('button'))
    expect(verifyCard).toHaveTextContent('Peut-être encore le hasard')
    spy.mockRestore()
  })

  it('says plainly when a lever goes against the general hypothesis (D6)', async () => {
    const lever = {
      ...baseCorr, variable: 'screen_late_minutes', label: 'Écran tard', r: 0.42,
      direction: 'lower_better', action: 'Ne pas chercher à lâcher le téléphone plus tôt le soir', againstNorm: true,
    }
    const spy = await renderWithBasic({
      status: 'ok', datasetDays: 40, reliability: 'good', correlations: [lever], levers: [lever],
    })
    expect(await screen.findByText('Ne pas chercher à lâcher le téléphone plus tôt le soir')).toBeInTheDocument()
    expect(screen.getByText(/Contraire à l’hypothèse générale : chez vous, vos données font foi/)).toBeInTheDocument()
    spy.mockRestore()
  })

  it('does not mention the general hypothesis on a lever that follows it', async () => {
    const lever = {
      ...baseCorr, variable: 'steps', label: 'Pas quotidiens', r: 0.42,
      direction: 'higher_better', action: 'Marcher davantage', againstNorm: false,
    }
    const spy = await renderWithBasic({
      status: 'ok', datasetDays: 40, reliability: 'good', correlations: [lever], levers: [lever],
    })
    await screen.findByText('Marcher davantage')
    expect(screen.queryByText(/Contraire à l’hypothèse générale/)).not.toBeInTheDocument()
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
    const weakRow = (await screen.findByText('Lipides')).closest('.reco-link-card')
    const solidRow = screen.getByText('Durée de sommeil').closest('.reco-link-card')
    expect(weakRow).toHaveClass('reco-link-card-uncertain')
    expect(weakRow).toHaveTextContent('Trop tôt pour dire')
    expect(solidRow).not.toHaveClass('reco-link-card-uncertain')
    spy.mockRestore()
  })
  it('folds uncertain correlations behind « Voir les N liens incertains »', async () => {
    const solid = { ...baseCorr, variable: 'sleepMinutes', label: 'Durée de sommeil', r: 0.5, direction: 'higher_better' }
    const weak1 = { ...baseCorr, variable: 'fat_g', label: 'Lipides', r: -0.1, q: 0.8, evidence: 'incertain', direction: 'neutral' }
    const weak2 = { ...baseCorr, variable: 'sugar_g', label: 'Sucres', r: 0.08, q: 0.9, evidence: 'incertain', direction: 'neutral' }
    const spy = await renderWithBasic({
      status: 'ok', datasetDays: 40, reliability: 'good',
      correlations: [solid, weak1, weak2], levers: [],
    })
    const summary = await screen.findByText(/Voir les 2 liens incertains/i)
    const details = summary.closest('details')
    expect(details).not.toHaveAttribute('open')
    expect(details).toContainElement(screen.getByText('Lipides'))
    expect(details).not.toContainElement(screen.getByText('Durée de sommeil'))
    spy.mockRestore()
  })

  it('says so when no correlation is clear yet, uncertain ones stay reachable', async () => {
    const weak = { ...baseCorr, variable: 'fat_g', label: 'Lipides', r: -0.1, q: 0.8, evidence: 'incertain', direction: 'neutral' }
    const spy = await renderWithBasic({
      status: 'ok', datasetDays: 40, reliability: 'good',
      correlations: [weak], levers: [],
    })
    expect(await screen.findByText(/Aucun lien net pour l’instant/i)).toBeInTheDocument()
    expect(screen.getByText(/Voir le lien incertain/i)).toBeInTheDocument()
    spy.mockRestore()
  })

  it('does not repeat « Écran tard » in the chart (already in « Vos habitudes », measured by the phone)', async () => {
    const late = { ...baseCorr, variable: 'screen_late_minutes', label: 'Écran tard (veille au soir, 22 h–4 h)', r: 0.5 }
    const spy = await renderWithBasic({
      status: 'ok', datasetDays: 40, reliability: 'good',
      correlations: [late], levers: [],
    })
    await screen.findByText(/Pistes à tester/i)
    expect(screen.queryByText(/Écran tard \(veille au soir/)).not.toBeInTheDocument()
    spy.mockRestore()
  })

  it('does not repeat a lever in the correlation chart (D1: same r shown twice)', async () => {
    const lever = {
      ...baseCorr, variable: 'steps', label: 'Pas quotidiens', r: 0.42,
      direction: 'higher_better', action: 'Marcher davantage',
    }
    const hrv = { ...baseCorr, variable: 'hrv', label: 'Variabilité cardiaque', r: 0.5, direction: 'higher_better' }
    const spy = await renderWithBasic({
      status: 'ok', datasetDays: 40, reliability: 'good',
      correlations: [hrv, lever], levers: [lever],
    })
    expect(await screen.findByText('Marcher davantage')).toBeInTheDocument()
    expect(screen.queryByText('Pas quotidiens')).not.toBeInTheDocument()
    expect(screen.getByText('Variabilité cardiaque')).toBeInTheDocument()
    expect(screen.getByText('Autres liens repérés')).toBeInTheDocument()
    spy.mockRestore()
  })

  it('hides the correlation section when every clear link is already a lever', async () => {
    const lever = {
      ...baseCorr, variable: 'steps', label: 'Pas quotidiens', r: 0.42,
      direction: 'higher_better', action: 'Marcher davantage',
    }
    const spy = await renderWithBasic({
      status: 'ok', datasetDays: 40, reliability: 'good', correlations: [lever], levers: [lever],
    })
    await screen.findByText('Marcher davantage')
    expect(screen.queryByTestId('reco-links')).not.toBeInTheDocument()
    expect(screen.queryByText('Pas quotidiens')).not.toBeInTheDocument()
    expect(screen.queryByText(/Aucun .*lien net/i)).not.toBeInTheDocument()
    spy.mockRestore()
  })

  it('folds clear links beyond the first 5 behind « Voir N autres liens » (POL-7c)', async () => {
    const labels = ['Sommeil', 'Pas', 'Fibres', 'Eau', 'Café', 'Sucres', 'Sel']
    const corrs = labels.map((label, i) => ({ ...baseCorr, variable: `v${i}`, label, r: 0.6 - i * 0.05, q: 0.001 * (i + 1) }))
    const spy = await renderWithBasic({ status: 'ok', datasetDays: 40, reliability: 'good', correlations: corrs, levers: [] })
    const summary = await screen.findByText('Voir 2 autres liens')
    expect(summary.closest('details')).toContainElement(screen.getByText('Sel'))
    expect(summary.closest('details')).not.toContainElement(screen.getByText('Sommeil'))
    spy.mockRestore()
  })

  it('does not list a tag as « en cours de collecte » when it is already shown as a link (POL-PLAY-6)', async () => {
    const tagsModule = await import('../services/behaviorTags')
    const tagSpy = vi.spyOn(tagsModule, 'computeTagEffects').mockReturnValue({
      status: 'ok', trackedDays: 40,
      pending: [{ tagId: 'alcohol', label: 'Alcool', nWith: 4, nWithout: 30 }, { tagId: 'sick', label: 'Malade', nWith: 2, nWithout: 30 }],
      effects: [],
    })
    const alcohol = { ...baseCorr, variable: 'alcohol_g', label: 'Alcool', r: -0.45, q: 0.004, evidence: 'solide' }
    const spy = await renderWithBasic({ status: 'ok', datasetDays: 40, reliability: 'good', correlations: [alcohol], levers: [] })
    const pending = await screen.findByText(/En cours de collecte/i)
    expect(pending).toHaveTextContent(/Malade/)
    expect(pending).not.toHaveTextContent(/Alcool/)
    spy.mockRestore()
    tagSpy.mockRestore()
  })

  it('gives one verdict per factor: alcohol as a variable and as a tag shown once (POL-7c)', async () => {
    const tagsModule = await import('../services/behaviorTags')
    const tagSpy = vi.spyOn(tagsModule, 'computeTagEffects').mockReturnValue({
      status: 'ok', trackedDays: 40, pending: [],
      effects: [{
        tagId: 'alcohol', label: 'Alcool', emoji: '🍷', effectDay: 'next', nWith: 10, nWithout: 30,
        meanWith: 3, meanWithout: 3.4, diff: -0.4, diffRaw: -0.4, p: 0.05, q: 0.08, evidence: 'à confirmer',
      }],
    })
    const alcohol = { ...baseCorr, variable: 'alcohol_g', label: 'Alcool', r: -0.45, q: 0.004, evidence: 'solide' }
    const spy = await renderWithBasic({ status: 'ok', datasetDays: 40, reliability: 'good', correlations: [alcohol], levers: [] })
    const section = await screen.findByTestId('reco-links')
    expect(within(section).getAllByText('Alcool')).toHaveLength(1)
    expect(section.querySelector('.reco-link-card--tag')).toBeNull()
    expect(section).toHaveTextContent('Se retrouve aussi avec vos notes (jours avec / sans).')
    expect(section).not.toHaveTextContent('🍷')
    spy.mockRestore()
    tagSpy.mockRestore()
  })

  it('shows activity calories and the total daily expenditure as one factor (POL-PLAY-5)', async () => {
    const active = { ...baseCorr, variable: 'activityCalories', label: 'Calories brûlées (activité)', r: 0.4, q: 0.02, evidence: 'à confirmer' }
    const total = { ...baseCorr, variable: 'dailyCaloriesHC', label: 'Dépense totale de la journée', r: 0.45, q: 0.004, evidence: 'solide' }
    const spy = await renderWithBasic({ status: 'ok', datasetDays: 40, reliability: 'good', correlations: [active, total], levers: [] })
    const section = await screen.findByTestId('reco-links')
    expect(within(section).getByText('Dépense totale de la journée')).toBeInTheDocument()
    expect(within(section).queryByText('Calories brûlées (activité)')).not.toBeInTheDocument()
    // même source, même mesure : rien à rappeler en « Se retrouve aussi »
    expect(section).not.toHaveTextContent('Se retrouve aussi')
    spy.mockRestore()
  })

  it('shows a near-zero correlation as 0,00 (never −0,00)', async () => {
    const tiny = { ...baseCorr, variable: 'fat_g', label: 'Lipides', r: -0.001, q: 0.99, evidence: 'incertain', direction: 'neutral' }
    const spy = await renderWithBasic({
      status: 'ok', datasetDays: 40, reliability: 'good',
      correlations: [tiny], levers: [],
    })
    const row = (await screen.findByText('Lipides')).closest('.reco-link-card')
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
    const card = (await screen.findByText('Alcool')).closest('.reco-link-card')
    expect(card).toHaveTextContent(/Le lendemain/i)
    expect(card).toHaveTextContent(/2,0 \/ 5/)
    expect(card).toHaveTextContent(/4,0 sans/)
    expect(card).toHaveTextContent(/−2,0 point/)
    expect(card).toHaveTextContent(/Piste solide/)
    // A tag used on fewer than 5 days is listed as still being collected.
    expect(screen.getByText(/En cours de collecte/i)).toHaveTextContent(/Malade/)
  })

  it('never compares felt stress with wellbeing as a cause (it is part of the mood, D5)', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    const entries = taggedEntries()
    for (const e of entries) {
      if (e.type === 'wellbeing' && Number(e.at.slice(8, 10)) % 2 === 0) e.payload.tags = [...(e.payload.tags ?? []), 'stress']
    }
    listEntriesForAnalysis.mockResolvedValue(entries)
    renderPage()
    await screen.findByText('Alcool')
    expect(screen.queryByText('Stress')).toBeNull()
    expect(screen.getByText(/stress ressenti fait partie de votre/)).toBeInTheDocument()
  })

  it('labels an unconvincing tag « Trop tôt pour dire » (VC-23)', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    const entries = taggedEntries()
    // Sick on even days: unrelated to the score pattern (period 3) → no clear effect.
    for (const e of entries) {
      if (e.type !== 'wellbeing') continue
      const d = Number(e.at.slice(8, 10))
      if (d % 2 === 0) e.payload.tags = [...(e.payload.tags ?? []), 'sick']
    }
    listEntriesForAnalysis.mockResolvedValue(entries)
    renderPage()
    const card = (await screen.findByText('Malade')).closest('.reco-link-card')
    expect(card).toHaveTextContent(/Trop tôt pour dire/)
  })
  it('shows the week-end-controlled difference when it differs from the raw one', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    const tagsModule = await import('../services/behaviorTags')
    const spy = vi.spyOn(tagsModule, 'computeTagEffects').mockReturnValue({
      status: 'ok',
      trackedDays: 40,
      effects: [
        {
          tagId: 'alcohol', label: 'Alcool', emoji: '🍷', effectDay: 'next',
          nWith: 12, nWithout: 28, meanWith: 4.1, meanWithout: 3.5,
          diff: -0.3, diffRaw: 0.6, p: 0.04, q: 0.04, evidence: 'à confirmer',
        },
        {
          tagId: 'stress', label: 'Stress', emoji: '😣', effectDay: 'same',
          nWith: 10, nWithout: 30, meanWith: 2.8, meanWithout: 3.8,
          diff: -1.0, diffRaw: -1.0, p: 0.001, q: 0.002, evidence: 'solide',
        },
      ],
      pending: [
        { tagId: 'late_meal', label: 'Repas tardif', emoji: '🍽️', effectDay: 'next', nWith: 6, nWithout: 30, weekendOnly: true },
      ],
    })
    listEntriesForAnalysis.mockResolvedValue(makeEntries(10))
    renderPage()
    const alcohol = (await screen.findByText('Alcool')).closest('.reco-link-card')
    expect(alcohol).toHaveTextContent(/\+0,6 point/)
    expect(alcohol).toHaveTextContent(/week-end à part : −0,3/)
    const stress = screen.getByText('Stress').closest('.reco-link-card')
    expect(stress).not.toHaveTextContent(/week-end à part/)
    expect(document.querySelector('.reco-method-note')).toHaveTextContent(
      /week-ends sont comparés aux week-ends/i,
    )
    expect(screen.getByText(/En cours de collecte/i)).toHaveTextContent(
      /Repas tardif \(pas encore comparable : jours avec et sans jamais du même type/,
    )
    spy.mockRestore()
  })
  it('says where an automatic tag comes from: screen from the phone, evening sport from workouts', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    const tagsModule = await import('../services/behaviorTags')
    const base = { nWith: 10, nWithout: 30, meanWith: 3, meanWithout: 3.5, diff: -0.5, diffRaw: -0.5, p: 0.01, q: 0.02, evidence: 'à confirmer', auto: true }
    const spy = vi.spyOn(tagsModule, 'computeTagEffects').mockReturnValue({
      status: 'ok',
      trackedDays: 40,
      effects: [
        { ...base, tagId: 'late_screen', label: 'Écran tard', emoji: '📱', effectDay: 'next' },
        { ...base, tagId: 'evening_sport', label: 'Sport le soir', emoji: '🏃', effectDay: 'next' },
        { ...base, tagId: 'late_meal', label: 'Repas tardif', emoji: '🍽️', effectDay: 'next' },
      ],
      pending: [],
    })
    listEntriesForAnalysis.mockResolvedValue(makeEntries(10))
    renderPage()
    const sport = (await screen.findByText('Sport le soir')).closest('.reco-link-card')
    expect(sport).toHaveTextContent(/déduit de vos séances/)
    expect(sport).not.toHaveTextContent(/téléphone/)
    expect(screen.getByText('Écran tard').closest('.reco-link-card')).toHaveTextContent(/mesuré par le téléphone/)
    expect(screen.getByText('Repas tardif').closest('.reco-link-card')).toHaveTextContent(/déduit de vos repas notés \(après 21 h\)/)
    spy.mockRestore()
  })
})


// ─── Week-end control ────────────────────────────────────────────────────────

describe('Recommendations — week-end control', () => {
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

  it('says the week-end is taken into account, with both averages', async () => {
    const spy = await renderWithBasic({
      status: 'ok', datasetDays: 40, reliability: 'good', correlations: [], levers: [],
      weekendControl: { applied: true, weekendDays: 11, weekdayDays: 29, weekendMean: 3.64, weekdayMean: 3.2 },
    })
    expect(await screen.findByText(/en tenant compte du week-end/i)).toBeInTheDocument()
    expect(screen.getByText(/3,6 le week-end/)).toBeInTheDocument()
    expect(screen.getByText(/3,2 en semaine/)).toBeInTheDocument()
    spy.mockRestore()
  })

  it("says on how many days the food intake is known when meals are missing", async () => {
    const spy = await renderWithBasic({
      status: 'ok', datasetDays: 40, nutritionDays: 31, reliability: 'good', correlations: [], levers: [],
      weekendControl: { applied: false, weekendDays: 2, weekdayDays: 38 },
    })
    expect(await screen.findByText(/alimentation connue sur 31 jours sur 40/i)).toBeInTheDocument()
    expect(screen.getByText(/pas un jeûne/i)).toBeInTheDocument()
    spy.mockRestore()
  })

  it("does not mention food coverage when meals are logged every day", async () => {
    const spy = await renderWithBasic({
      status: 'ok', datasetDays: 40, nutritionDays: 40, reliability: 'good', correlations: [], levers: [],
      weekendControl: { applied: false, weekendDays: 2, weekdayDays: 38 },
    })
    await screen.findByText(/Analyse sur/i)
    expect(screen.queryByText(/alimentation connue sur/i)).not.toBeInTheDocument()
    spy.mockRestore()
  })

  it('says when there are not enough week-end days yet', async () => {
    const spy = await renderWithBasic({
      status: 'ok', datasetDays: 6, reliability: 'exploratory', correlations: [], levers: [],
      weekendControl: { applied: false, weekendDays: 1, weekdayDays: 5, weekendMean: 4, weekdayMean: 3 },
    })
    expect(await screen.findByText(/pas encore assez de jours de week-end/i)).toBeInTheDocument()
    spy.mockRestore()
  })

  it('shows the raw r on a lever when the week-end changed it noticeably', async () => {
    const lever = {
      ...baseCorr, variable: 'steps', label: 'Pas quotidiens', r: 0.31, rRaw: 0.52,
      direction: 'higher_better', action: 'Marcher davantage',
    }
    const spy = await renderWithBasic({
      status: 'ok', datasetDays: 40, reliability: 'good', correlations: [lever], levers: [lever],
      weekendControl: { applied: true, weekendDays: 11, weekdayDays: 29, weekendMean: 3.6, weekdayMean: 3.2 },
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Afficher les détails' }))
    expect(screen.getByText(/\+0,52 sans tenir compte du week-end/)).toBeInTheDocument()
    spy.mockRestore()
  })
})

describe('Recommendations — week-end in the advanced model', () => {
  it('shows the estimated week-end effect', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    const analysisModule = await import('../services/analysisEngine')
    const spy = vi.spyOn(analysisModule, 'computeAdvancedAnalysis').mockReturnValue({
      status: 'ok', datasetDays: 40,
      modelInfo: { r2: 0.6, r2_loo: 0.4, method: 'ols_linear_regression', nFeaturesFinal: 3, nFeaturesCandidate: 40, lagDays: 10.5, lambda: 3, droppedCollinear: [], weekendEffect: 0.42, model_reliable: true },
      featureImportance: [], topRecommendations: [], residuals: null, todayPrediction: null,
    })
    listEntriesForAnalysis.mockResolvedValue(makeEntries(12))
    renderPage()
    await openModel()
    expect(await screen.findByText(/\+0,4 point le week-end/)).toBeInTheDocument()
    spy.mockRestore()
  })
})

describe('Recommendations — lagged effects', () => {
  // 40 days; wellbeing follows the steps of the day before (deterministic pseudo-noise).
  function laggedEntries() {
    const entries = []
    const steps = []
    for (let i = 0; i < 40; i++) {
      const date = new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10)
      steps.push(4000 + ((i * 7919) % 8000))
      entries.push({ type: 'steps', source: 'health_connect', at: `${date}T22:00:00Z`, payload: { value: steps[i] } })
      const prev = i > 0 ? steps[i - 1] : 8000
      const score = Math.round((2.5 + (prev - 8000) / 2500 + (((i * 31) % 7) - 3) / 10) * 10) / 10
      entries.push({ type: 'wellbeing', source: 'app_wellbeing', at: `${date}T20:00:00Z`, payload: { score } })
    }
    return entries
  }

  it('shows the effect of the day before, with its size, timing and evidence', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue(laggedEntries())
    renderPage()
    // POL-7c : un facteur = un verdict. Les pas sont déjà une piste : leur effet de la veille est rappelé au chevron
    const lever = (await screen.findByText('Marcher davantage')).closest('li')
    expect(screen.queryByTestId('reco-links')?.querySelector('.reco-lag-card') ?? null).toBeNull()
    fireEvent.click(within(lever).getByRole('button', { name: 'Afficher les détails' }))
    expect(lever).toHaveTextContent(/La veille, .*pas de plus que d’habitude → bien-être \+\d,\d point/)
    expect(lever).toHaveTextContent(/(piste solide)/)
  })

  it('says how many consecutive days are still needed', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue(makeEntries(8))
    renderPage()
    // POL-7 : une ligne discrète dans « Bientôt », pas une section presque vide
    const soon = await screen.findByTestId('reco-soon')
    expect(soon).toHaveTextContent(/Effets décalés\s*7\/14 jours/)
    expect(screen.queryByRole('heading', { name: 'Effets décalés' })).toBeNull()
  })

  it('shows no empty « Effets décalés » block when no delayed effect stands out (POL-7c)', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue(makeEntries(20))
    renderPage()
    await screen.findByText(/Comment c.est calculé/)
    expect(screen.queryByRole('heading', { name: 'Effets décalés' })).toBeNull()
    expect(screen.queryByText(/Aucun effet décalé net/)).toBeNull()
  })
})

// ─── Nettoyage D1 : une seule explication de méthode, repliée ────────────────

describe('Recommendations — explanations grouped (D1)', () => {
  it('groups method, week-end, tags and delayed-effects explanations in one collapsed note', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue(makeEntries(20))
    renderPage()
    const note = (await screen.findByText(/Comment c.est calculé/)).closest('details')
    expect(note).not.toHaveAttribute('open')
    expect(note).toHaveTextContent(/Benjamini-Hochberg/)
    expect(note).toHaveTextContent(/le lendemain qui compte/)
    expect(note).toHaveTextContent(/bien-être de la veille égal/)
    expect(note).toHaveTextContent(/une corrélation ne prouve pas une cause/)
    expect(note).toHaveTextContent(/Un jour noté avant 20 h, seuls les pas.*d’avant la note comptent|Un jour noté avant 20 h, seuls les pas.*d'avant la note comptent/)
  })

  it('says « a correlation is not a cause » once, not in every section', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue(makeEntries(20))
    renderPage()
    await screen.findByText(/Comment c.est calculé/)
    const text = document.querySelector('.reco-tab-content').textContent
    expect(text.match(/corrélation ne prouve pas une cause/g)).toHaveLength(1)
    expect(text).toMatch(/pas un avis médical/)
    for (const hint of document.querySelectorAll('.reco-section-hint')) {
      expect(hint.textContent.length).toBeLessThan(110)
    }
  })
  it('advanced tab: one short summary line, model details folded in one note', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue(makeEntries(20))
    renderPage()
    await openModel()
    const meta = await screen.findByText(/Analyse sur/i)
    expect(meta.closest('p').textContent).not.toMatch(/R²|Variables retenues|Régression/)
    const note = screen.getByText(/Comment fonctionne ce modèle/).closest('details')
    expect(note).toHaveTextContent(/Régression linéaire multiple|Corrélation de Pearson/)
    expect(note).toHaveTextContent(/Variables redondantes écartées/)
    // Chaque notion expliquée une seule fois (le modèle, la sélection des variables, le week-end, les R²).
    const paras = [...note.querySelectorAll('p')].map((p) => p.textContent)
    const count = (re) => paras.filter((t) => re.test(t)).length
    expect(note.textContent.match(/Régression linéaire multiple/g)).toHaveLength(1)
    expect(count(/week-end/i)).toBeLessThanOrEqual(1)
    expect(count(/plus (liées|corrélées) au bien-être/)).toBe(1)
    expect(count(/R² LOO/)).toBe(1)
    for (const hint of document.querySelectorAll('.reco-section-hint')) {
      expect(hint.textContent.length).toBeLessThan(110)
    }
  })

  it('advanced tab: section titles in plain words, bar scale explained once', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue(makeEntries(20))
    renderPage()
    await openModel()
    await screen.findByText(/Analyse sur/i)
    const titles = [...document.querySelectorAll('.reco-section-title')].map((h) => h.textContent)
    expect(titles.length).toBeGreaterThan(0)
    for (const t of titles) expect(t).not.toMatch(/coefficients|standardis|\bvs\b|variables/i)
    const text = document.querySelector('.reco-tab-content').textContent
    expect(text).not.toMatch(/généralise/)
    // L'échelle relative des barres est dite sous les barres, pas une 2ᵉ fois dans la note de méthode.
    expect(text.match(/la plus influente|le plus influent/g) ?? []).toHaveLength(
      document.querySelector('.reco-corr-chart') ? 1 : 0,
    )
  })
})

describe('Analyses — humeur estimée par le visage (sans aucune note)', () => {
  const NEUTRAL = { smile: 0.1, duchenne: 0.05, mouthFrown: 0.05, browDown: 0.15, browInnerUp: 0.1, yaw: 4 }
  function faceHistory(days) {
    const entries = []
    for (let i = 0; i < days; i++) {
      const steps = 4000 + 3000 * Math.sin(i * 1.7)
      for (let k = 0; k < 3; k++) {
        entries.push({ type: 'face_burst', source: 'face_sense', at: new Date(2026, 8, 1 + i, 8 + k).toISOString(), payload: { v: 1, trigger: 'unlock', frames: 3, valid: 3, values: { ...NEUTRAL, valence: (steps - 4000) / 4000, arousal: 0 } } })
      }
      entries.push({ type: 'steps', source: 'health_connect', at: new Date(2026, 8, 1 + i, 7).toISOString(), payload: { value: steps } })
    }
    return entries
  }

  it('compares the factors to the estimated mood even with no wellbeing note', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue(faceHistory(20))
    renderPage()
    const section = await screen.findByTestId('reco-links')
    expect(section).toHaveTextContent('Liens repérés')
    expect(section).toHaveTextContent('« visage » : comparé à votre bien-être estimé par la caméra (20 jours)')
    expect(section).toHaveTextContent('Pas')
    expect(section.querySelector('.reco-link-src')).toHaveTextContent('visage')
    // Les notes manquent toujours pour l'analyse classique : la carte lilas le dit, sans second seuil (VC-12).
    expect(screen.queryByText(/Pas encore assez de jours mesurés/i)).not.toBeInTheDocument()
  })

  it('shows the habits compared to the estimated mood, without the felt stress and without any lever', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    const entries = faceHistory(42).filter((e) => e.type !== 'face_burst')
    for (let i = 0; i < 42; i++) {
      const valence = i > 0 && (i - 1) % 3 === 0 ? -0.5 : 0.3
      for (let k = 0; k < 3; k++) {
        entries.push({ type: 'face_burst', source: 'face_sense', at: new Date(2026, 8, 1 + i, 8 + k).toISOString(), payload: { v: 1, trigger: 'unlock', frames: 3, valid: 3, values: { ...NEUTRAL, valence, arousal: 0 } } })
      }
      if (i % 3 === 0) entries.push({ type: 'wellbeing', at: new Date(2026, 8, 1 + i, 22).toISOString(), payload: { score: 3, tags: ['alcohol', 'stress'] } })
    }
    listEntriesForAnalysis.mockResolvedValue(entries)
    renderPage()
    const habits = await screen.findByTestId('reco-links')
    expect(habits).toHaveTextContent('Alcool')
    expect(habits).toHaveTextContent('Le lendemain : bien-être estimé')
    expect(habits).not.toHaveTextContent('Stress')
    expect(habits).not.toHaveTextContent('Piste :')
  })

  it('counts the days still needed', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue(faceHistory(4))
    renderPage()
    expect(await screen.findByTestId('reco-soon')).toHaveTextContent(/Avec votre bien-être estimé\s*4\/14 jours/)
    expect(screen.queryByTestId('reco-links')).toBeNull()
  })

  it('shows nothing about the face without any face reading', async () => {
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue(makeEntries(6))
    renderPage()
    await screen.findByText(/Pistes à tester/i)
    expect(document.querySelector('.reco-link-src')).toBeNull()
  })
})

// Jalon 5 : pistes repas → ventre (notes par fenêtre et bilans du soir), seulement pour qui suit son ventre
describe('Recommendations — votre ventre et vos repas', () => {
  const gutEntries = async () => {
    const { simulateRealistic } = await import('../services/gutWindows.sim')
    // Effet net « le jour même » (seed vérifiée dans gutLinks.test.js) + quelques jours de bien-être
    return [
      ...makeEntries(5),
      ...simulateRealistic({ seed: 31, days: 90, timedNotes: false, dayNotes: true, dayEffect: { food: 'oignon', day: 0, odds: 8 } })
        .map((e, i) => ({ id: 1000 + i, source: 'app_gut', created_at: e.at, ...e })),
    ]
  }

  it('shows each kept link as « aliment → ventre », with the counts and an expectation note in details', async () => {
    const { saveOnboarding } = await import('../settings/onboarding')
    saveOnboarding({ goal: 'gut' })
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue(await gutEntries())
    renderPage()
    const section = await screen.findByTestId('gut-links')
    expect(within(section).getByText('Votre ventre et vos repas')).toBeInTheDocument()
    expect(within(section).getByText(/Oignon → ventre/)).toBeInTheDocument()
    expect(within(section).getByText(/Les jours où vous en avez mangé, gêne ou douleur \d+ fois sur \d+/)).toBeInTheDocument()
    expect(within(section).getByText('À confirmer')).toBeInTheDocument()
    expect(section.textContent).not.toMatch(/cause|intolérance|diagnostic/i)
    expect(within(section).queryByText(/L’attente joue aussi/)).toBeNull()
    fireEvent.click(within(section).getAllByRole('button', { name: /détails/i })[0])
    expect(within(section).getByText(/L’attente joue aussi : une réintroduction guidée aide à trancher/)).toBeInTheDocument()
    expect(within(section).getByText(/RR = .* · q = /)).toBeInTheDocument()
    expect(screen.getByTestId('reintro-entry')).toHaveAttribute('href', '/reintroduction')
    expect(screen.getByTestId('doctor-report')).toHaveTextContent('Rapport PDF pour mon médecin')
  })

  it('says « trop tôt » in one discreet line while there are only a few days of gut notes', async () => {
    const { saveOnboarding } = await import('../settings/onboarding')
    saveOnboarding({ goal: 'gut' })
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue([
      ...makeEntries(5),
      { id: 900, type: 'gut', source: 'app_gut', at: '2026-01-03T10:00:00', created_at: '2026-01-03T10:00:00', payload: { level: 'calm' } },
    ])
    renderPage()
    const soon = await screen.findByTestId('reco-soon')
    expect(within(soon).getByText('Votre ventre et vos repas')).toBeInTheDocument()
    expect(within(soon).getByText('1/28 jours')).toBeInTheDocument()
    expect(screen.queryByTestId('gut-links')).toBeNull()
  })

  it('no gut note yet: the PDF report is one discreet « Bientôt » line, never an empty report or « Débloquer »', async () => {
    const { saveOnboarding } = await import('../settings/onboarding')
    saveOnboarding({ goal: 'gut' })
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue(makeEntries(5))
    renderPage()
    const soon = await screen.findByTestId('reco-soon')
    expect(within(soon).getByText('Rapport PDF pour mon médecin')).toBeInTheDocument()
    expect(within(soon).getByText('dès votre 1re note du ventre')).toBeInTheDocument()
    expect(screen.queryByTestId('doctor-report')).toBeNull()
    expect(screen.queryByRole('link', { name: 'Débloquer' })).toBeNull()
  })

  it('shows nothing about the gut with another goal (POL-4), without deleting anything', async () => {
    const { saveOnboarding } = await import('../settings/onboarding')
    saveOnboarding({ goal: 'energy' })
    const { listEntriesForAnalysis } = await import('../storage/localHealthStorage')
    listEntriesForAnalysis.mockResolvedValue(await gutEntries())
    renderPage()
    await screen.findByText(/Pistes à tester/)
    expect(screen.queryByTestId('gut-links')).toBeNull()
    expect(screen.queryByText('Votre ventre et vos repas')).toBeNull()
    expect(screen.queryByTestId('reintro-entry')).toBeNull()
    expect(screen.queryByTestId('doctor-report')).toBeNull()
  })
})

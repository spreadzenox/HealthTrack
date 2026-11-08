import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import Recommendations from './Recommendations'
import { PISTES_SUMMARY_KEY } from '../services/pistesSummary'

const f = (key, label, effect, { theme = 'sleep', actionable = true, net = true, horizon = 'short' } = {}) => ({
  key, label, theme, actionable, outcome: 'wellbeing', horizon, effect, low: effect - 0.15, high: effect + 0.15, net,
  usualChange: { amount: 50, unit: 'min', text: '50 min de sommeil de plus' }, perUnit: 0.01, center: 400, days: 30,
})
const h = (id, label, status, factors = [], daysHave = 30, daysNeeded = 14) => ({ id, label, window: 'le jour même et la veille', status, daysHave, daysNeeded, factors })
const lockedOutcome = (daysHave, extra = {}) => ({
  status: 'locked', daysToFirst: 14 - daysHave, daysHave, beatsPersistence: null,
  horizons: { short: h('short', 'Court terme', 'locked', [], daysHave, 14), medium: h('medium', 'Moyen terme', 'locked', [], daysHave, 21), long: h('long', 'Long terme', 'locked', [], daysHave, 42) },
  ...extra,
})
const readyResults = {
  outcomes: {
    wellbeing: {
      status: 'partial', beatsPersistence: true, daysToFirst: 0,
      horizons: {
        short: h('short', 'Court terme', 'ready', [f('sleepMinutes', 'Sommeil', 0.4), f('screen_minutes', 'Temps d’écran', -0.2, { theme: 'context', net: false }), f('hrv_ms', 'VFC', 0.3, { theme: 'body', actionable: false })]),
        medium: h('medium', 'Moyen terme', 'ready', [f('steps', 'Pas', 0.25, { theme: 'activity', horizon: 'medium' })], 30, 21),
        long: h('long', 'Long terme', 'locked', [], 30, 42),
      },
    },
    digestion: lockedOutcome(3, { symptomDays: 1, symptomDaysNeeded: 5, daysToFirst: 25 }),
  },
}

function Where() {
  const loc = useLocation()
  return <p data-testid="where">{loc.pathname} {loc.state?.open ?? ''}</p>
}
const renderPage = (props, results) => render(
  <MemoryRouter initialEntries={['/recommendations']}>
    <Routes>
      <Route path="/recommendations" element={<Recommendations read={async () => results} {...props} />} />
      <Route path="*" element={<Where />} />
    </Routes>
  </MemoryRouter>,
)

describe('Analyses sur le contrat de la méthode (ORG-4, ORG-6)', () => {
  beforeEach(() => localStorage.clear())

  it('avant les résultats : un seul compte à rebours, la phrase du propriétaire et « Noter maintenant »', async () => {
    renderPage({}, { outcomes: { wellbeing: lockedOutcome(5), digestion: lockedOutcome(0) } })
    const card = await screen.findByTestId('reco-countdown-wellbeing')
    expect(within(card).getByRole('heading')).toHaveTextContent('Vos premiers résultats arrivent dans 9 jours')
    expect(card).toHaveTextContent('Notez votre bien-être chaque jour : Halcya cherchera ensuite quels facteurs sont statistiquement liés à votre bien-être.')
    expect(within(card).getByRole('button', { name: 'Noter maintenant' })).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/Sur quelques semaines|Autres liens repérés|Bientôt|Dans les heures|Benjamini/)
  })

  it('résultats : pistes à tester vers Agir, ce qui pèse par horizon, à regarder à part, un seul compte à rebours suivant', async () => {
    renderPage({}, readyResults)
    const pistes = await screen.findByRole('region', { name: 'Pistes à tester' })
    expect(within(pistes).getAllByRole('listitem').map((li) => li.querySelector('.reco-piste-title').textContent)).toEqual(['Sommeil', 'Pas'])
    expect(within(pistes).getAllByRole('link', { name: 'Essayer dans Agir' })[0]).toHaveAttribute('href', '/agir')
    // titre neutre : la liste montre aussi ce qui va avec les bons jours ; valeurs en « pt » comme Tendances
    expect(screen.queryByRole('region', { name: /pèse/ })).toBeNull()
    const weigh = screen.getByRole('region', { name: 'Ce qui va avec votre bien-être' })
    for (const v of weigh.querySelectorAll('.reco-effect-value')) expect(v.textContent).toMatch(/^[+−]?\d+,\d\u00a0pt$/)
    expect(weigh).toHaveTextContent('Court terme')
    expect(weigh).toHaveTextContent('Moyen terme')
    expect(within(weigh).getByText('Sommeil').closest('li')).toHaveAttribute('data-tone', 'night')
    expect(within(weigh).getByText('Temps d’écran').closest('li')).toHaveClass('is-unsure')
    expect(within(weigh).queryByText('VFC')).toBeNull()
    expect(within(screen.getByRole('region', { name: 'À regarder, pas à changer' })).getByText('VFC')).toBeInTheDocument()
    expect(screen.getByText(/Long terme : dans/)).toHaveTextContent('12')
    expect(document.body.textContent).not.toMatch(/cause|diagnostic/i)
    // l'Accueil et Agir relisent les titres
    expect(JSON.parse(localStorage.getItem(PISTES_SUMMARY_KEY)).levers).toEqual(['Sommeil', 'Pas'])
  })

  it('« Comment c’est calculé » : un lien discret en bas', async () => {
    renderPage({}, readyResults)
    const how = await screen.findByRole('button', { name: 'Comment c’est calculé' })
    expect(how).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(how)
    expect(screen.getByText(/Une ligne par jour/)).toBeInTheDocument()
  })

  it('Digestion : même structure ; les jours de gêne manquants sont dits ; « Noter maintenant » ouvre la fenêtre de l’Accueil', async () => {
    renderPage({ view: 'gut' }, readyResults)
    const card = await screen.findByTestId('reco-countdown-digestion')
    expect(card).toHaveTextContent('Vos premiers résultats arrivent dans 25 jours')
    expect(card).toHaveTextContent('statistiquement liés à votre confort digestif')
    expect(card).toHaveTextContent('4 jours de plus avec une gêne ou une douleur notée')
    fireEvent.click(within(card).getByRole('button', { name: 'Noter maintenant' }))
    expect(screen.getByTestId('where')).toHaveTextContent('/ digestion')
  })
})

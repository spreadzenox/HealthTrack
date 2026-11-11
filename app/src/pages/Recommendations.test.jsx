import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within, fireEvent, act } from '@testing-library/react'
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
    expect(within(card).getByRole('heading')).toHaveTextContent('Encore 9 jours notés avant vos premiers résultats')
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
    // simulation du 10/11 : sur une petite barre le hachurage ne se voit pas ; le chiffre passe en gris
    expect(within(weigh).getByText('Temps d’écran').closest('li').querySelector('.reco-effect-value')).toHaveClass('is-unsure')
    expect(within(weigh).getByText('Sommeil').closest('li').querySelector('.reco-effect-value')).not.toHaveClass('is-unsure')
    expect(weigh.querySelector('.reco-legend')).toHaveTextContent('hachuré, chiffre en gris : pas assez net')
    expect(within(weigh).queryByText('VFC')).toBeNull()
    expect(within(screen.getByRole('region', { name: 'À regarder, pas à changer' })).getByText('VFC')).toBeInTheDocument()
    // POLISH-SIM-23 : des jours notés, comme le compte à rebours
    expect(screen.getByText(/Long terme : encore/)).toHaveTextContent('Long terme : encore 12 jours notés.')
    // POLISH-SIM-23 : l'unité « pt » est dite une fois, sous le premier titre à barres
    const units = document.querySelectorAll('.reco-unit')
    expect(units).toHaveLength(1)
    expect(weigh).toContainElement(units[0])
    expect(units[0]).toHaveTextContent('pt : points de votre note de bien-être, sur 5.')
    expect(document.body.textContent).not.toMatch(/cause|diagnostic/i)
    // l'Accueil et Agir relisent les titres
    expect(JSON.parse(localStorage.getItem(PISTES_SUMMARY_KEY)).levers).toEqual(['Sommeil', 'Pas'])
  })

  it('POLISH-SIM-16 : un effet plus grand que l’échelle dit « pas assez de données », sans chiffre ni barre', async () => {
    const out = { ...f('fodmap_lactose', 'Lactose', -4.7, { theme: 'nutrition', net: false, horizon: 'long' }), outOfScale: true }
    const results = structuredClone(readyResults)
    results.outcomes.wellbeing.horizons.short.factors.push(out)
    renderPage({}, results)
    await screen.findByRole('region', { name: 'Pistes à tester' })
    const row = [...document.querySelectorAll('.reco-effect')].find((li) => li.textContent.startsWith('Lactose'))
    expect(row).toHaveTextContent('pas assez de données')
    expect(row.textContent).not.toMatch(/4,7|pt/)
    expect(row.querySelector('.reco-effect-bar')).toBeNull()
    // L'échelle des autres barres ne s'étire pas pour lui.
    const sleep = [...document.querySelectorAll('.reco-effect')].find((li) => li.textContent.startsWith('Sommeil'))
    // Sans lui, la barre de 0,4 pt n'occupe qu'un vingtième de la piste (max 4,85) ; avec, elle va presque au bout.
    expect(Number(sleep.querySelector('.reco-effect-bar').style.right.match(/([\d.]+)%/)?.[1] ?? 100)).toBeLessThan(30)
  })

  it('POLISH-SIM-50 : un facteur qui change de sens selon le délai est dit une fois, sous la légende', async () => {
    const results = structuredClone(readyResults)
    results.outcomes.wellbeing.horizons.short.factors.push(f('fodmap_lactose', 'Lactose', -0.2, { theme: 'nutrition', net: false }))
    results.outcomes.wellbeing.horizons.medium.factors.push(f('fodmap_lactose', 'Lactose', 1.2, { theme: 'nutrition', net: false, horizon: 'medium' }))
    renderPage({}, results)
    const weigh = await screen.findByRole('region', { name: 'Ce qui va avec votre bien-être' })
    expect(weigh.querySelector('.reco-flipped')).toHaveTextContent('Lactose change de sens selon le délai : rien à en tirer pour l’instant.')
    expect(weigh.querySelector('.reco-legend')).toHaveTextContent('hachuré, chiffre en gris : pas assez net')
  })

  it('POLISH-SIM-50 : rien de net, une phrase en tête remplace la légende', async () => {
    const results = structuredClone(readyResults)
    const w = results.outcomes.wellbeing.horizons
    w.short.factors = [f('fodmap_lactose', 'Lactose', -0.2, { theme: 'nutrition', net: false })]
    w.medium.factors = [f('fodmap_lactose', 'Lactose', 1.2, { theme: 'nutrition', net: false, horizon: 'medium' })]
    renderPage({}, results)
    const weigh = await screen.findByRole('region', { name: 'Ce qui va avec votre bien-être' })
    expect(weigh.querySelector('.reco-unsure-all')).toHaveTextContent('Rien n’est net pour l’instant (barres hachurées, chiffres en gris) : ces chiffres bougeront avec vos prochains jours notés.')
    expect(weigh.querySelector('.reco-legend')).toBeNull()
    expect(weigh.querySelector('.reco-flipped')).toBeNull()
    // dit une fois, avant les barres
    expect(weigh.querySelector('.reco-unsure-all').compareDocumentPosition(weigh.querySelector('.reco-horizon')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('« Comment c’est calculé » : un lien discret en bas', async () => {
    renderPage({}, readyResults)
    const how = await screen.findByRole('button', { name: 'Comment c’est calculé' })
    expect(how).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(how)
    // POLISH-SIM-23 : deux phrases simples d'abord, la méthode repliée
    const text = screen.getByTestId('reco-how-simple')
    expect(text).toHaveTextContent('Halcya compare vos jours notés à ce que vous avez fait le jour même et les semaines d’avant.')
    expect(text.textContent).not.toMatch(/régularisé|fenêtre|27/)
    expect(screen.queryByText(/Une ligne par jour/)).toBeNull()
    const more = screen.getByRole('button', { name: 'Le détail' })
    fireEvent.click(more)
    expect(more).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/Une ligne par jour/)).toBeInTheDocument()
  })

  it('Digestion : même structure ; les jours de gêne manquants sont dits ; « Noter maintenant » ouvre la fenêtre de l’Accueil', async () => {
    renderPage({ view: 'gut' }, readyResults)
    const card = await screen.findByTestId('reco-countdown-digestion')
    expect(card).toHaveTextContent('Encore 25 jours notés avant vos premiers résultats')
    // POLISH-SIM-32 : la fenêtre du compteur est dite
    expect(card.querySelector('.pistes-count')).toHaveTextContent(/^\d+\/\d+ jours notés, pas forcément d’affilée$/)
    expect(card).toHaveTextContent('statistiquement liés à votre confort digestif')
    // POLISH-SIM-5 : on voit que la gêne notée compte (1 sur 5), sans « 4 jours de plus » ambigu
    expect(card).toHaveTextContent('Il faut aussi 5 jours avec une gêne ou une douleur notée : vous en avez 1.')
    expect(card).not.toHaveTextContent('de plus avec une gêne')
    fireEvent.click(within(card).getByRole('button', { name: 'Noter maintenant' }))
    expect(screen.getByTestId('where')).toHaveTextContent('/ digestion')
  })
})

describe('Exemple digestion sans l’objectif ventre (POLISH-SIM-37b)', () => {
  beforeEach(() => localStorage.clear())

  it('le bandeau « suivi digestif masqué » se cache pendant l’exemple et revient après', async () => {
    const { saveOnboarding } = await import('../settings/onboarding')
    const { enterExampleMode, exitExampleMode } = await import('../storage/exampleMode')
    saveOnboarding({ goals: ['stress'] })
    renderPage({ view: 'gut' }, readyResults)
    expect(await screen.findByTestId('gut-off')).toBeInTheDocument()
    act(() => enterExampleMode([]))
    expect(screen.queryByTestId('gut-off')).not.toBeInTheDocument()
    act(() => exitExampleMode())
    expect(await screen.findByTestId('gut-off')).toBeInTheDocument()
  })
})

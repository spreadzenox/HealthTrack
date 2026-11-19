import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import Recommendations from './Recommendations'
import { PISTES_SUMMARY_KEY } from '../services/pistesSummary'
import { startChallenge, defaultPlan } from '../services/fodmapChallenge'

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
        long: { ...h('long', 'Long terme', 'locked', [], 30, 42), window: 'de 7 à 27 jours avant' },
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

  it('REFONTE-6b : « Par famille » en tête des résultats, la force du lien en trois points et en mots', async () => {
    renderPage({}, readyResults)
    const block = await screen.findByRole('region', { name: 'Par famille' })
    const rows = within(block).getAllByRole('listitem')
    expect(rows.map((li) => li.querySelector('.reco-family-label').textContent)).toEqual(['Sommeil', 'Activité', 'Alimentation'])
    // 7d-4 : une famille qui s'ouvre finit par l'icône chevron, plus par un « › » texte
    expect(rows[0].querySelector('.reco-family-label svg.reco-family-chevron')).not.toBeNull()
    expect(rows[2].querySelector('.reco-family-chevron')).toBeNull()
    expect(rows[0]).toHaveTextContent('Lien moyen')
    expect(rows[0].querySelectorAll('.reco-family-dot.is-on')).toHaveLength(2)
    expect(rows[1]).toHaveTextContent('Pas')
    expect(rows[1]).toHaveTextContent('Lien moyen')
    expect(rows[2]).toHaveTextContent('Pas assez de données')
    expect(rows[2].querySelector('.reco-family-dots')).toBeNull()
    // Le temps d'écran, pas net, n'ajoute pas de ligne « Écrans »
    expect(screen.queryByTestId('reco-family-screen')).toBeNull()
    // « Par famille » vient avant « Pistes à tester »
    const pistes = screen.getByRole('region', { name: 'Pistes à tester' })
    expect(block.compareDocumentPosition(pistes) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  const renderAt = (path, results, props = {}) => render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/recommendations/bien-etre" element={<Recommendations read={async () => results} {...props} />} />
        <Route path="/recommendations/bien-etre/famille/:family" element={<Recommendations read={async () => results} {...props} />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  )

  it('REFONTE-6c : une famille qui a des facteurs comparés ouvre son détail ; sans donnée, pas de lien', async () => {
    renderAt('/recommendations/bien-etre', readyResults)
    const block = await screen.findByRole('region', { name: 'Par famille' })
    expect(within(block).getByRole('link', { name: /Sommeil/ })).toHaveAttribute('href', '/recommendations/bien-etre/famille/sleep')
    expect(within(block).getByRole('link', { name: /Activité/ })).toHaveAttribute('href', '/recommendations/bien-etre/famille/activity')
    expect(within(block).queryByRole('link', { name: /Alimentation/ })).toBeNull()
  })

  it('REFONTE-6c : le détail d’une famille : son lien net à tester, puis ses seuls facteurs, délai par délai', async () => {
    const results = structuredClone(readyResults)
    results.outcomes.wellbeing.horizons.medium.factors.push(f('screen_late_minutes', 'Écran tard le soir', -0.1, { theme: 'context', net: false, horizon: 'medium' }))
    renderAt('/recommendations/bien-etre/famille/sleep', results)
    expect(await screen.findByRole('heading', { level: 2, name: 'Sommeil' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '← Votre bien-être' })).toHaveAttribute('href', '/recommendations/bien-etre')
    const piste = screen.getByRole('region', { name: 'Piste à tester' })
    expect(within(piste).getAllByRole('listitem')).toHaveLength(1)
    expect(piste).toHaveTextContent('+0,4 point sur 5 pour 50 min de sommeil de plus (court terme)')
    expect(within(piste).getByRole('link', { name: 'Vérifier par un essai' })).toHaveAttribute('href', '/agir')
    const bars = screen.getByRole('region', { name: 'Ce qui a été comparé' })
    expect(bars).toHaveTextContent('Court terme')
    expect(bars).toHaveTextContent('Moyen terme')
    expect(bars).toHaveTextContent('Écran tard le soir')
    expect(bars).toHaveTextContent('pt : points de votre note de bien-être, sur 5')
    // Rien des autres familles, ni la vue d'ensemble de l'objectif
    expect(document.body.textContent).not.toMatch(/Pas\b.*pt|VFC|Temps d’écran/)
    expect(screen.queryByRole('region', { name: 'Par famille' })).toBeNull()
    expect(screen.queryByRole('region', { name: 'À regarder, pas à changer' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Comment est calculé votre bien-être ?' })).toBeNull()
  })

  it('REFONTE-6c : une famille sans lien net le dit, sans carte de piste', async () => {
    const results = structuredClone(readyResults)
    results.outcomes.wellbeing.horizons.short.factors[0].net = false
    renderAt('/recommendations/bien-etre/famille/sleep', results)
    await screen.findByRole('heading', { level: 2, name: 'Sommeil' })
    expect(screen.queryByRole('region', { name: 'Piste à tester' })).toBeNull()
    expect(screen.getByTestId('reco-family-none')).toHaveTextContent('Aucun lien assez net pour l’instant dans cette famille.')
    expect(screen.getByRole('region', { name: 'Ce qui a été comparé' })).toBeInTheDocument()
  })

  it('REFONTE-6c : famille inconnue, sans facteur comparé ou avant les résultats : retour au détail de l’objectif', async () => {
    renderAt('/recommendations/bien-etre/famille/nutrition', readyResults)
    expect(await screen.findByRole('region', { name: 'Par famille' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Votre bien-être' })).toBeInTheDocument()
  })

  it('REFONTE-6b : « Comment est calculé votre bien-être ? » replié, pour le bien-être seulement', async () => {
    renderPage({}, readyResults)
    const link = await screen.findByRole('button', { name: 'Comment est calculé votre bien-être ?' })
    expect(screen.queryByTestId('reco-how-wellbeing')).toBeNull()
    fireEvent.click(link)
    expect(screen.getByTestId('reco-how-wellbeing')).toHaveTextContent('votre note et la lecture du visage, si vous l’utilisez')
  })

  it('REFONTE-6b : la digestion n’a pas cette explication', async () => {
    renderPage({ view: 'gut' }, readyResults)
    await screen.findByTestId('reco-countdown-digestion')
    expect(screen.queryByRole('button', { name: 'Comment est calculé votre bien-être ?' })).toBeNull()
  })

  it('REFONTE-6b : pas de familles avant les premiers résultats', async () => {
    renderPage({}, { outcomes: { wellbeing: lockedOutcome(5), digestion: lockedOutcome(0) } })
    await screen.findByTestId('reco-countdown-wellbeing')
    expect(screen.queryByRole('region', { name: 'Par famille' })).toBeNull()
  })

  it('résultats : pistes à tester vers Agir, ce qui pèse par horizon, à regarder à part, un seul compte à rebours suivant', async () => {
    renderPage({}, readyResults)
    const pistes = await screen.findByRole('region', { name: 'Pistes à tester' })
    expect(within(pistes).getAllByRole('listitem').map((li) => li.querySelector('.reco-piste-title').textContent)).toEqual(['Sommeil', 'Pas'])
    expect(within(pistes).getAllByRole('link', { name: 'Vérifier par un essai' })[0]).toHaveAttribute('href', '/agir')
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
    expect(screen.getByText(/Long terme \(/)).toHaveTextContent('Long terme (de 7 à 27 jours avant) : encore 12 jours avec votre bien-être noté ou lu.')
    // POLISH-SIM-23 : l'unité « pt » est dite une fois, sous le premier titre à barres
    const units = document.querySelectorAll('.reco-unit')
    expect(units).toHaveLength(1)
    expect(weigh).toContainElement(units[0])
    expect(units[0]).toHaveTextContent('pt : points de votre note de bien-être, sur 5. + : meilleur bien-être.')
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
    fireEvent.click(await screen.findByRole('button', { name: 'Voir les liens pas encore nets' }))
    const weigh = await screen.findByRole('region', { name: 'Ce qui va avec votre bien-être' })
    expect(weigh.querySelector('.reco-unsure-all')).toHaveTextContent('Rien n’est net pour l’instant (barres hachurées, chiffres en gris) : ces chiffres bougeront avec vos prochains jours notés.')
    expect(weigh.querySelector('.reco-legend')).toBeNull()
    expect(weigh.querySelector('.reco-flipped')).toBeNull()
    // dit une fois, avant les barres
    expect(weigh.querySelector('.reco-unsure-all').compareDocumentPosition(weigh.querySelector('.reco-horizon')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('POLISH-SIM-69 : rien de net, les barres hachurées sont repliées ; en tête, ce qui a été comparé et ce qui manque', async () => {
    const results = structuredClone(readyResults)
    const w = results.outcomes.wellbeing.horizons
    w.short.factors = [f('fodmap_lactose', 'Lactose', -0.2, { theme: 'nutrition', net: false }), f('temp', 'Température', 0.3, { theme: 'context', actionable: false, net: false })]
    w.medium.factors = [f('fodmap_gos', 'GOS', 1.2, { theme: 'nutrition', net: false, horizon: 'medium' })]
    renderPage({}, results)
    const pistes = await screen.findByRole('region', { name: 'Pistes à tester' })
    expect(pistes).toHaveTextContent('Aucun lien assez net pour l’instant sur ce que vous pouvez changer.')
    expect(within(pistes).getByTestId('reco-compared')).toHaveTextContent('3 facteurs comparés à votre bien-être, du jour même à 6 jours avant.')
    // le compte « encore N jours » est dit en tête, une seule fois
    expect(pistes).toHaveTextContent('Long terme (de 7 à 27 jours avant) : encore 12 jours avec votre bien-être noté ou lu.')
    expect(screen.getAllByText(/: encore/)).toHaveLength(1)
    // aucune barre tant qu'on ne les demande pas
    expect(screen.queryByRole('region', { name: 'Ce qui va avec votre bien-être' })).toBeNull()
    expect(screen.queryByRole('region', { name: 'À regarder, pas à changer' })).toBeNull()
    expect(document.querySelector('.reco-effect')).toBeNull()
    const more = screen.getByRole('button', { name: 'Voir les liens pas encore nets' })
    expect(more).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(more)
    expect(more).toHaveAttribute('aria-expanded', 'true')
    expect(within(screen.getByRole('region', { name: 'Ce qui va avec votre bien-être' })).getByText('GOS')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'À regarder, pas à changer' })).getByText('Température')).toBeInTheDocument()
  })

  it('POLISH-SIM-69 : dès qu’un lien est net, rien n’est replié', async () => {
    renderPage({}, readyResults)
    await screen.findByRole('region', { name: 'Ce qui va avec votre bien-être' })
    expect(screen.queryByRole('button', { name: 'Voir les liens pas encore nets' })).toBeNull()
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

  it('Digestion : même structure ; les jours de gêne manquants sont dits ; « Noter maintenant » ouvre la fenêtre de Ma journée', async () => {
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
    expect(screen.getByTestId('where')).toHaveTextContent('/ma-journee digestion')
  })
  it('POLISH-SIM-53 et 54 : en digestion, l’unité dit le sens du « + » et la note de chaque niveau', async () => {
    const gut = structuredClone(readyResults.outcomes.wellbeing)
    for (const hz of Object.values(gut.horizons)) for (const x of hz.factors) x.outcome = 'digestion'
    renderPage({ view: 'gut' }, { outcomes: { wellbeing: readyResults.outcomes.wellbeing, digestion: gut } })
    await screen.findByRole('region', { name: 'Ce qui va avec votre confort digestif' })
    const units = document.querySelectorAll('.reco-unit')
    expect(units).toHaveLength(1)
    expect(units[0]).toHaveTextContent('pt : points de votre note de confort digestif, sur 5 (Calme 5, Gêne 3, Douleur 1). + : plus de confort.')
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

describe('REFONTE-6e : la réintroduction guidée sous Confort digestif', () => {
  beforeEach(() => localStorage.clear())
  const gutPage = (readReintro, results = readyResults) => renderPage({ view: 'gut', readReintro }, results)

  it('sans test ni groupe cité par une analyse : aucune ligne (leçon 17)', async () => {
    gutPage(async () => ({ challenges: [], gut: [] }))
    await screen.findByTestId('reco-countdown-digestion')
    expect(screen.queryByTestId('reco-reintro')).toBeNull()
  })

  it('un groupe cité par une piste digestive : la ligne mène à la réintroduction', async () => {
    const gut = JSON.parse(JSON.stringify(readyResults.outcomes.wellbeing))
    gut.horizons.short.factors = [{ ...f('fodmap_lactose', 'Lactose', -0.4, { theme: 'nutrition' }), outcome: 'digestion' }]
    gut.horizons.medium.factors = []
    gutPage(async () => ({ challenges: [], gut: [] }), { outcomes: { wellbeing: readyResults.outcomes.wellbeing, digestion: gut } })
    const link = await screen.findByTestId('reco-reintro')
    expect(link).toHaveAttribute('href', '/reintroduction')
    expect(link).toHaveTextContent('Réintroduction guidée')
    expect(link).toHaveTextContent('À tester d’après vos analyses : le lactose')
  })

  it('un test en cours se retrouve ici même avant les premiers résultats', async () => {
    const payload = startChallenge({ group: 'lactose', food: 'milk', plan: defaultPlan('lactose', 'milk') }, new Date(Date.now() - 86_400_000))
    const challenges = [{ id: 1, type: 'fodmap_challenge', at: payload.startedAt, payload }]
    gutPage(async () => ({ challenges, gut: [] }))
    expect(await screen.findByTestId('reco-reintro')).toHaveTextContent('Test en cours : le lactose')
  })

  it('le bien-être n’a pas cette ligne, et une lecture en échec ne casse rien', async () => {
    renderPage({ readReintro: async () => { throw new Error('x') } }, readyResults)
    await screen.findByText('Par famille')
    expect(screen.queryByTestId('reco-reintro')).toBeNull()
    gutPage(async () => { throw new Error('x') })
    await screen.findByTestId('reco-countdown-digestion')
    expect(screen.queryByTestId('reco-reintro')).toBeNull()
  })
})


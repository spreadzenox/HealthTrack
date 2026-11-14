import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Trends from './Trends'
import { readMeasureDays } from '../services/trendsMeasureDays'


const NOW = new Date(2026, 10, 7, 20)
const band = (mean) => ({ mean, low: mean - 0.4, high: mean + 0.4, sd: 0.3 })
const states = {
  showDigestiveCurve: false,
  days: ['2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07'].map((date, i) => ({
    date, future: false, observed: { wellbeing: i === 1, digestion: false }, wellbeing: band(3), digestion: band(3), digestionOwn: band(3),
  })).concat([{ date: '2026-11-08', future: true, observed: { wellbeing: false, digestion: false }, wellbeing: band(3), digestion: band(3), digestionOwn: band(3) }]),
}
const days = [4, 5, 6, 7].map((d) => ({ dateKey: `2026-11-0${d}`, summary: { sleepMinutes: 400 + d, steps: 6000 + d } }))

const ex = (sad) => ({ exHappiness: 0.2, exNeutral: 0.4, exSurprise: 0.05, exSadness: sad, exAnger: 0.05, exFear: 0.05, exDisgust: 0.05, exContempt: 0.2 - sad + 0.05 })
const burst = (d, h, sad, arousal) => ({ type: 'face_burst', at: new Date(2026, 10, d, h).toISOString(), payload: { trigger: 'unlock', valid: 3, values: { valence: 0, arousal, ...ex(sad) } } })
const face = [
  ...[1, 2, 3, 4].flatMap((d) => [burst(d, 9, 0.05, 0.1), burst(d, 17, 0.05, 0.2)]),
  burst(5, 9, 0.15, -0.3), burst(5, 13, 0.15, -0.2),
  { type: 'wellbeing', at: new Date(2026, 10, 5, 21).toISOString(), payload: { score: 2.5 } },
]
const contributions = { wellbeing: { '2026-11-05': [
  { key: 'sleepMinutes', label: 'Sommeil', theme: 'sleep', horizon: 'short', points: -0.4, value: 300, usual: 420 },
  { key: 'steps', label: 'Pas', theme: 'activity', horizon: 'short', points: 0.2, value: 9000, usual: 7000 },
] } }

const changes = { wellbeing: [{ date: '2026-10-25', before: 3, after: 2, shift: -1, size: 1, t: 5, confirmedOn: '2026-11-01' }], sleepMinutes: [{ date: '2026-10-27', before: 450, after: 390, shift: -60, size: 1, t: 5, confirmedOn: '2026-11-03' }] }

const renderAt = (path) => render(
  <MemoryRouter initialEntries={[path]}>
    <Trends now={NOW} readDays={async () => days} readDayStates={async () => states}
      readFaceEntries={async () => face} readDayContributions={async () => contributions}
      readDayChanges={async () => changes} />
  </MemoryRouter>,
)

describe('Journal › Tendances (ORG-3)', () => {
  it('sous les onglets du Journal, une carte avec les mesures, « + » et Jour / Semaine / Mois', async () => {
    renderAt('/tendances')
    expect(screen.getByRole('navigation', { name: 'Journal' })).toBeInTheDocument()
    const chips = await screen.findByRole('list', { name: 'Mesures affichées' })
    expect(within(chips).getByText('Bien-être').closest('li')).toHaveAttribute('data-tone', 'mint')
    expect(screen.getByRole('button', { name: 'Semaine' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('img', { name: /Courbe de Bien-être/ })).toBeInTheDocument()
    expect(screen.queryByText('Votre forme')).toBeNull()
  })

  it('« + » ajoute une mesure qui a au moins 3 points ; un axe par unité', async () => {
    renderAt('/tendances')
    fireEvent.click(await screen.findByRole('button', { name: 'Ajouter une mesure' }))
    const menu = screen.getByRole('list', { name: 'Mesures à ajouter' })
    fireEvent.click(within(menu).getByRole('button', { name: /Sommeil/ }))
    expect(screen.getByRole('img', { name: 'Courbe de Bien-être, Sommeil' })).toBeInTheDocument()
  })

  it('POLISH-SIM-3 : chaque axe dit son unité ; avec deux axes, chacun prend la couleur de sa courbe', async () => {
    const { container } = renderAt('/tendances')
    await screen.findByRole('img', { name: 'Courbe de Bien-être' })
    const units = () => [...container.querySelectorAll('.trends-axis-unit')]
    expect(units().map((u) => u.textContent)).toEqual(['/5'])
    expect(units()[0]).not.toHaveAttribute('data-tone')
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter une mesure' }))
    fireEvent.click(within(screen.getByRole('list', { name: 'Mesures à ajouter' })).getByRole('button', { name: /Sommeil/ }))
    expect(units().map((u) => [u.textContent, u.getAttribute('data-tone')])).toEqual([['/5', 'mint'], ['h', 'night']])
    const sleepTicks = [...container.querySelectorAll('.trends-axis[data-tone="night"]')]
    expect(sleepTicks.length).toBeGreaterThan(1)
  })

  it('POLISH-SIM-6 : VFC et FC au repos disent une fois leur nom en toutes lettres sous les mesures', async () => {
    const hrDays = [4, 5, 6, 7].map((d) => ({ dateKey: `2026-11-0${d}`, summary: { hrv: 40 + d, restingHr: 58 + d } }))
    const { container } = render(
      <MemoryRouter initialEntries={['/tendances?mesure=hrv']}>
        <Trends now={NOW} readDays={async () => hrDays} readDayStates={async () => null}
          readFaceEntries={async () => []} readDayContributions={async () => null} readDayChanges={async () => null} />
      </MemoryRouter>,
    )
    await screen.findByRole('img', { name: 'Courbe de Variabilité cardiaque' })
    // Pas d'attendu tracé pour la VFC : pas de mot « attendu » au-dessus d'un futur vide
    expect(container.querySelector('.trends-future-label')).toBeNull()
    const gloss = () => [...container.querySelectorAll('.trends-gloss li')].map((li) => li.textContent)
    expect(gloss()).toEqual(['Variabilité cardiaque : mesurée pendant la nuit, en millisecondes'])
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter une mesure' }))
    fireEvent.click(within(screen.getByRole('list', { name: 'Mesures à ajouter' })).getByRole('button', { name: /FC au repos/ }))
    expect(gloss()).toHaveLength(2)
    expect(gloss()[1]).toBe('FC au repos : fréquence cardiaque au repos, en battements par minute')
  })

  it('POLISH-SIM-6 : rien à expliquer pour le bien-être seul', async () => {
    const { container } = renderAt('/tendances')
    await screen.findByRole('img', { name: 'Courbe de Bien-être' })
    expect(container.querySelector('.trends-gloss')).toBeNull()
  })

  it('POLISH-SIM-54 : le confort digestif dit une fois la note de chaque niveau sous la courbe', async () => {
    const gutStates = { ...states, showDigestiveCurve: true }
    const { container } = render(
      <MemoryRouter initialEntries={['/tendances?mesure=digestion']}>
        <Trends now={NOW} readDays={async () => days} readDayStates={async () => gutStates}
          readFaceEntries={async () => []} readDayContributions={async () => null} readDayChanges={async () => null} />
      </MemoryRouter>,
    )
    await screen.findByRole('img', { name: 'Courbe de Confort digestif' })
    const gloss = [...container.querySelectorAll('.trends-gloss li')].map((li) => li.textContent)
    expect(gloss).toEqual(['Confort digestif : Calme 5, Gêne 3, Douleur 1'])
  })

  it('POLISH-SIM-28 : la grille suit chaque graduation de l’axe de gauche, aucune ligne grise isolée', async () => {
    const { container } = renderAt('/tendances')
    await screen.findByRole('img', { name: 'Courbe de Bien-être' })
    const grid = [...container.querySelectorAll('.trends-chart .trends-grid')].map((l) => l.getAttribute('y1'))
    const ticks = [...container.querySelectorAll('.trends-chart .trends-axis.mono[text-anchor="end"]')]
    expect(ticks.length).toBeGreaterThan(1)
    expect(grid).toHaveLength(ticks.length)
    ticks.forEach((t, i) => expect(Number(grid[i])).toBeCloseTo(Number(t.getAttribute('y')) - 3, 5))
  })

  it('POLISH-SIM-13 : la partie pointillée après « auj. » commence par le mot « attendu »', async () => {
    const { container } = renderAt('/tendances')
    await screen.findByRole('img', { name: 'Courbe de Bien-être' })
    const label = container.querySelector('.trends-future-label')
    expect(label).toHaveTextContent('attendu')
    expect(Number(label.getAttribute('x'))).toBeGreaterThan(Number(container.querySelector('.trends-today line').getAttribute('x1')))
  })

  it('POLISH-SIM-61 : sous la courbe, le pointillé dit d’où il vient', async () => {
    const { container } = renderAt('/tendances')
    await screen.findByRole('img', { name: 'Courbe de Bien-être' })
    const legend = container.querySelector('.trends-future-legend')
    expect(legend).toHaveTextContent('attendu d’après vos habitudes')
    expect(legend.querySelector('.trends-future-swatch')).not.toBeNull()
  })

  it('POLISH-SIM-61 : une mesure sans attendu s’arrête à aujourd’hui, sans jours futurs vides ni légende', async () => {
    const { container } = renderAt('/tendances?mesure=sleep')
    await screen.findByRole('img', { name: 'Courbe de Sommeil' })
    expect(screen.getByRole('button', { name: 'samedi 7 novembre' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'dimanche 8 novembre' })).toBeNull()
    expect(container.querySelector('.trends-future-legend')).toBeNull()
    // Le bien-être ajouté ramène son attendu, donc les jours futurs
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter une mesure' }))
    fireEvent.click(within(screen.getByRole('list', { name: 'Mesures à ajouter' })).getByRole('button', { name: /Bien-être/ }))
    expect(screen.getByRole('button', { name: 'dimanche 8 novembre' })).toBeInTheDocument()
    expect(container.querySelector('.trends-future-legend')).not.toBeNull()
  })

  it('toucher un jour passé montre sa valeur, jamais un « attendu » ; un jour futur, l’attendu et sa fourchette', async () => {
    renderAt('/tendances')
    await screen.findByRole('img', { name: /Courbe/ })
    fireEvent.click(screen.getByRole('button', { name: 'jeudi 5 novembre' }))
    const past = screen.getByRole('group', { name: /Détail du jeudi 5 novembre/ })
    expect(past).toHaveTextContent('votre note 3')
    expect(past.textContent).not.toMatch(/attendu|habitudes/i)
    fireEvent.click(screen.getByRole('button', { name: 'dimanche 8 novembre' }))
    const future = screen.getByRole('group', { name: /Détail du dimanche 8 novembre/ })
    expect(future).toHaveTextContent('D’après vos habitudes')
    expect(future).toHaveTextContent(/à/)
  })

  it('ORG-3c : un jour passé dit ses lectures et sa note, l’étoile des expressions, humeur et éveil, et ce qui a pu peser', async () => {
    renderAt('/tendances')
    await screen.findByRole('img', { name: /Courbe/ })
    fireEvent.click(screen.getByRole('button', { name: 'jeudi 5 novembre' }))
    const detail = screen.getByRole('group', { name: /Détail du jeudi 5 novembre/ })
    expect(detail).toHaveTextContent('2 lectures du visage')
    // T3 : la note dit son chiffre une seule fois, sur la ligne du bien-être
    expect(detail).toHaveTextContent(/votre note( 3,\d et (le visage|les jours voisins))?/)
    expect(detail.textContent.match(/note/g)).toHaveLength(1)
    expect(within(detail).getByRole('img', { name: /Expressions du visage : .*Tristesse 15 %/ })).toBeInTheDocument()
    expect(detail).toHaveTextContent('Plus de tristesse')
    expect(within(detail).getByRole('img', { name: 'Humeur et éveil : 2 lectures' })).toBeInTheDocument()
    expect(detail).toHaveTextContent('Éveil plutôt calme, moins que d’habitude')
    // T4 : les légendes de la maquette, l'habitude étant connue
    expect(detail).toHaveTextContent('Plus de tristesse, moins de mépris que d’habitude. Le trait gris montre votre habitude.')
    expect(detail).toHaveTextContent('Chaque point est une lecture ; la zone grise, votre habitude.')
    // contributions lues au premier jour touché (budget de lectures)
    const weigh = await within(detail).findByRole('region', { name: 'Ce qui a pu peser ce jour-là' })
    // T4 : ce qui s'est passé, avec la valeur, et l'unité « pt »
    expect(within(weigh).getByText('Nuits plus courtes que d’habitude (5 h)').closest('li')).toHaveAttribute('data-tone', 'night')
    expect(weigh).toHaveTextContent('−0,40 pt')
    expect(detail.textContent).not.toMatch(/diagnostic|cause/i)
  })

  it('POLISH-SIM-34 : sous « Sommeil » seul, ni lectures du visage ni facteurs du bien-être', async () => {
    renderAt('/tendances?mesure=sleep')
    await screen.findByRole('img', { name: /Courbe de Sommeil/ })
    fireEvent.click(screen.getByRole('button', { name: 'jeudi 5 novembre' }))
    const detail = screen.getByRole('group', { name: /Détail du jeudi 5 novembre/ })
    expect(detail).toHaveTextContent('Sommeil')
    expect(detail.textContent).not.toMatch(/lectures? du visage/)
    await new Promise((r) => setTimeout(r, 20))
    expect(within(detail).queryByRole('region', { name: 'Ce qui a pu peser ce jour-là' })).toBeNull()
  })

  it('TS-2 : vue Mois, repère « changement » avec niveau avant et après et « Au même moment », jamais de cause', async () => {
    renderAt('/tendances')
    fireEvent.click(await screen.findByRole('button', { name: 'Mois' }))
    // changements lus à la première vue Mois (budget de lectures)
    await waitFor(() => expect(document.querySelectorAll('.trends-change')).toHaveLength(1))
    fireEvent.click(screen.getByRole('button', { name: 'dimanche 25 octobre' }))
    const detail = screen.getByRole('group', { name: /Détail du dimanche 25 octobre/ })
    expect(detail).toHaveTextContent('Changement durable : bien-être')
    expect(detail).toHaveTextContent(/Niveau avant 3,4 \/5, après 2,6 \/5/)
    expect(detail).toHaveTextContent('Au même moment : sommeil')
    expect(detail.textContent).not.toMatch(/cause|à cause|parce que/i)
  })

  // Correction T2 du propriétaire (07/11 vers 23:50) : la vue Jour de la maquette, l'ancien historique retiré
  it('T2/T3 : ?vue=jour ouvre le dernier jour qui a une lecture ; › jusqu’à aujourd’hui ; lectures en points, note en losange', async () => {
    renderAt('/tendances?vue=jour')
    // T3 : rien encore le 7 ni le 6 → la vue s'ouvre sur le 5, pas sur un jour vide
    expect(await screen.findByRole('img', { name: 'Bien-être du jeudi 5 novembre, heure par heure' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Jour' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Jour suivant' }))
    fireEvent.click(screen.getByRole('button', { name: 'Jour suivant' }))
    expect(screen.getByRole('img', { name: 'Bien-être du samedi 7 novembre, heure par heure' })).toBeInTheDocument()
    expect(screen.getByText('Aucune lecture du visage ce jour-là')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Jour suivant' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Jour précédent' }))
    fireEvent.click(screen.getByRole('button', { name: 'Jour précédent' }))
    const chart = screen.getByRole('img', { name: 'Bien-être du jeudi 5 novembre, heure par heure' })
    expect(chart.querySelectorAll('.trends-reading')).toHaveLength(2)
    expect(chart.querySelectorAll('.trends-note')).toHaveLength(1)
    const legend = screen.getByRole('list', { name: 'Légende' })
    expect(within(legend).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['une lecture du visage', 'votre note'])
    // dessous, le même détail du jour qu'en Semaine
    const detail = screen.getByRole('group', { name: /Détail du jeudi 5 novembre/ })
    expect(within(detail).getByRole('img', { name: /Expressions du visage/ })).toBeInTheDocument()
    expect(within(detail).getByRole('img', { name: 'Humeur et éveil : 2 lectures' })).toBeInTheDocument()
    // l'ancien détail est retiré (une information n'a qu'une maison)
    const page = document.body.textContent
    expect(page).not.toMatch(/moyenne|Fiabilité mesurée|diagnostic|Deux modèles embarqués|Valence/i)
  })

  it('T2 : un jour touché en Semaine s’ouvre en Jour', async () => {
    renderAt('/tendances')
    await screen.findByRole('img', { name: /Courbe/ })
    fireEvent.click(screen.getByRole('button', { name: 'jeudi 5 novembre' }))
    fireEvent.click(screen.getByRole('button', { name: 'Jour' }))
    expect(screen.getByRole('img', { name: 'Bien-être du jeudi 5 novembre, heure par heure' })).toBeInTheDocument()
  })

  it('T2 : « + » en Jour : les mesures sans détail heure par heure sont grisées, les toucher passe en Semaine', async () => {
    renderAt('/tendances?vue=jour')
    fireEvent.click(await screen.findByRole('button', { name: 'Ajouter une mesure' }))
    const menu = screen.getByRole('list', { name: 'Mesures à ajouter' })
    const sleep = within(menu).getByRole('button', { name: /Sommeil/ })
    expect(sleep).toHaveClass('is-daily')
    expect(screen.getByText('Une valeur par jour, en Semaine')).toBeInTheDocument()
    fireEvent.click(sleep)
    expect(screen.getByRole('button', { name: 'Semaine' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('img', { name: 'Courbe de Bien-être, Sommeil' })).toBeInTheDocument()
  })

  // Correction T1 du propriétaire (07/11 vers 23:50) : jamais une carte vide à l'ouverture
  const renderWith = (path, { st = states, d = days, f = face } = {}) => render(
    <MemoryRouter initialEntries={[path]}>
      <Trends now={NOW} readDays={async () => d} readDayStates={async () => st}
        readFaceEntries={async () => f} readDayContributions={async () => null} readDayChanges={async () => ({})} />
    </MemoryRouter>,
  )

  it('T1 : bien-être sur 2 jours seulement → vue Jour à l’ouverture', async () => {
    const two = { ...states, days: states.days.filter((x) => x.date >= '2026-11-06') }
    renderWith('/tendances', { st: two })
    expect(await screen.findByRole('img', { name: /heure par heure/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Jour' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('T1 : sans bien-être, la première mesure qui a une courbe s’affiche en Semaine', async () => {
    renderWith('/tendances', { st: null, f: [] })
    expect(await screen.findByRole('img', { name: 'Courbe de Sommeil' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Semaine' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('T1 : mesure demandée sans courbe → les mesures disponibles en grandes puces, sans « Choisissez… avec + »', async () => {
    renderWith('/tendances?mesure=digestion', { st: null, f: [] })
    const pick = await screen.findByRole('list', { name: 'Courbes disponibles' })
    expect(screen.queryByText(/Choisissez une mesure/)).toBeNull()
    expect(screen.queryByRole('button', { name: 'Ajouter une mesure' })).toBeNull()
    fireEvent.click(within(pick).getByRole('button', { name: /Pas/ }))
    expect(screen.getByRole('img', { name: 'Courbe de Pas' })).toBeInTheDocument()
  })
  it('historique vierge : seulement le message, sans Jour / Semaine / Mois qui ne montreraient rien (revue 09/11)', async () => {
    renderWith('/tendances', { st: null, d: [], f: [] })
    expect(await screen.findByText('Vos courbes apparaîtront après 3 jours de mesures.')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Période' })).toBeNull()
    expect(screen.queryByRole('list', { name: 'Mesures affichées' })).toBeNull()
  })
})

describe('POLISH-SIM-47 : le poids dans Tendances', () => {
  it('les pesées (poids, composition) sont lues avec les autres mesures', async () => {
    const fake = async ({ type }) => (type === 'weight'
      ? [5, 6].map((d) => ({ type, source: 'app_weight', at: new Date(2026, 10, d, 8).toISOString(), payload: { valueKg: 80 - d / 10 } }))
      : type === 'body_composition'
        ? [{ type, source: 'withings', at: new Date(2026, 10, 7, 7).toISOString(), payload: { valueKg: 79.1 } }]
        : [])
    const got = await readMeasureDays(NOW, fake)
    expect(got.map((d) => [d.dateKey, d.summary.weightKg])).toEqual([['2026-11-07', 79.1], ['2026-11-06', 79.4], ['2026-11-05', 79.5]])
  })
})

describe('POLISH-SIM-47 : graduations du poids', () => {
  it('un pas de 0,25 kg s’écrit en entier (77,25, jamais « 77,3 »)', async () => {
    const weighIns = [5, 6, 7].map((d, i) => ({ dateKey: `2026-11-0${d}`, summary: { weightKg: [77.9, 77.4, 77.1][i] } }))
    const { container } = render(
      <MemoryRouter initialEntries={['/tendances?mesure=weight']}>
        <Trends now={NOW} readDays={async () => weighIns} readDayStates={async () => null}
          readFaceEntries={async () => []} readDayContributions={async () => null} readDayChanges={async () => null} />
      </MemoryRouter>,
    )
    await waitFor(() => expect(container.querySelector('.trends-axis.mono')).not.toBeNull())
    const labels = [...container.querySelectorAll('.trends-axis.mono')].map((t) => t.textContent)
    expect(labels).toContain('77,25')
    expect(labels).not.toContain('77,3')
  })
})

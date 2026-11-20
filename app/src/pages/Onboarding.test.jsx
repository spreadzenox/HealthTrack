import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

const stored = vi.hoisted(() => ({ entries: [], created: [] }))
vi.mock('../storage/localHealthStorage', () => ({
  listEntries: vi.fn(async () => stored.entries),
  upsertEntries: vi.fn(async () => {}),
  countAllEntries: vi.fn(async () => 0),
  createEntry: vi.fn(async (e) => {
    stored.created.push(e)
    return stored.created.length
  }),
  updateEntry: vi.fn(async () => {}),
}))
// Sans Health Connect (navigateur) : l'accueil ne doit jamais rester bloqué
vi.mock('../connectors/connectorRegistry', () => ({ getConnector: () => undefined, CONNECTORS: [] }))

import Onboarding from './Onboarding'
import onboardingSource from './Onboarding.jsx?raw'
import { FLOW_VERSION, loadOnboarding, saveOnboarding } from '../settings/onboarding'
import { getHabits, setHabits } from '../settings/habits'
import { stepsFor, TEMPS, AUTO_TILES, autoTiles, dailyNotes, dailySummary } from '../services/onboardingFlow'
import { CHANGELOG } from '../data/changelog'
import { getLastSeenId } from '../services/whatsNew'
import { markMet, wearsWatch } from '../companion/life/companionState'

function renderAt() {
  return render(
    <MemoryRouter initialEntries={['/bienvenue']}>
      <Routes>
        <Route path="/bienvenue" element={<Onboarding />} />
        <Route path="/" element={<p>Page Aujourd’hui</p>} />
        <Route path="/connectors" element={<p>Page Sources</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const btn = (name) => screen.getByRole('button', { name })
const heading = (name) => screen.getByRole('heading', { name })

const at = (lastScreen, extra = {}) => saveOnboarding({ flow: FLOW_VERSION, lastScreen, ...extra })
const check = (name) => screen.getByRole('checkbox', { name })
const radio = (name) => screen.getByRole('radio', { name })
/** La rencontre (lot VIE) : passer l'éclosion, garder « Pilou », continuer. */
const meetPilou = () => {
  fireEvent.click(btn('Passer'))
  fireEvent.click(btn('Valider'))
  fireEvent.click(btn('Continuer'))
}

describe('Accueil en 4 temps (refonte étape 5b) : le parcours', () => {
  beforeEach(() => {
    localStorage.clear()
    stored.created = []
  })

  it('écrans : ouverture, puis les 4 temps (sideload, sans visage ni Gold)', () => {
    expect(TEMPS).toEqual(['goal', 'watch', 'auto', 'notes'])
    expect(stepsFor()).toEqual(['intro', 'meet', 'goal', 'watch', 'auto', 'notes'])
  })

  it('une seule carte d’ouverture : bienvenue et ce qui quitte le téléphone ; ni compteur, ni retour, ni « Passer »', () => {
    renderAt()
    expect(heading('Bienvenue dans Halcya')).toBeInTheDocument()
    expect(document.querySelector('.onb-tuto-pills').textContent).toBe('RepasSommeilAppareilsRessenti')
    expect(heading('Vos données restent sur votre téléphone')).toBeInTheDocument()
    expect(screen.getByText('Quand vous le demandez')).toBeInTheDocument()
    expect(screen.getByText('Si vous l’activez')).toBeInTheDocument()
    for (const t of ['Analyser un repas ou une photo de selles', 'Exporter vos données, partager le rapport pour votre médecin', 'Envoyer votre avis', 'Météo', 'Sauvegarde du téléphone']) {
      expect(screen.getByText(t)).toBeInTheDocument()
    }
    expect(screen.getByText(/18 ans ou plus/)).toBeInTheDocument()
    expect(screen.getByText(/ne pose pas de diagnostic/)).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Retour' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Passer' })).toBeNull()
    // la carte des onglets (« Agir » n'est plus un onglet) a disparu
    expect(onboardingSource).not.toContain('Trois usages')
    fireEvent.click(btn('Commencer'))
    // Lot VIE : la rencontre de Pilou, puis le temps 1
    expect(screen.getByText('Bonjour !')).toBeInTheDocument()
    meetPilou()
    expect(heading('Qu’est-ce qui vous amène ?')).toBeInTheDocument()
  })

  it('parcours complet sans rien toucher : aucun écran ne bloque, aucune saisie créée, bien-être seul, méditation proposée', async () => {
    renderAt()
    fireEvent.click(btn('Commencer'))
    meetPilou()
    expect(screen.getByText('1 sur 4')).toBeInTheDocument()
    fireEvent.click(btn('Continuer'))
    expect(heading('Avez-vous une montre, un bracelet ou une balance ?')).toBeInTheDocument()
    expect(screen.getByText('2 sur 4')).toBeInTheDocument()
    fireEvent.click(btn('Continuer'))
    expect(heading('Ce que Halcya suit pour vous, sans rien faire')).toBeInTheDocument()
    expect(screen.getByText('3 sur 4')).toBeInTheDocument()
    fireEvent.click(btn('Continuer'))
    expect(heading('Ce que vous noterez chaque jour')).toBeInTheDocument()
    expect(screen.getByText('4 sur 4')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Avancement' })).toHaveAttribute('aria-valuenow', '4')
    fireEvent.click(btn('C’est parti !'))
    expect(await screen.findByText('Page Aujourd’hui')).toBeInTheDocument()
    expect(loadOnboarding()).toMatchObject({ done: true, endedBy: 'completed', goals: ['wellbeing'], goalsVersion: 2, tour: 'pending' })
    expect(getHabits().map((h) => h.id)).toEqual(['meditation'])
    expect(stored.created).toEqual([])
  })

  it('la première note a quitté l’accueil', () => {
    expect(onboardingSource).not.toContain('Comment vous sentez-vous maintenant')
    expect(onboardingSource).not.toContain('createEntry')
  })

  it('un accueil d’une version précédente, commencé, repart du début en gardant les réponses', () => {
    saveOnboarding({ flow: 2, goals: ['gut', 'care'], step: 4, lastScreen: 'first' })
    renderAt()
    expect(heading('Bienvenue dans Halcya')).toBeInTheDocument()
    expect(loadOnboarding()).toMatchObject({ flow: FLOW_VERSION, goals: ['gut', 'care'], step: 0 })
  })

  it('note les écrans vus pour le diagnostic local (I156)', () => {
    renderAt()
    expect(loadOnboarding()).toMatchObject({ seen: ['intro'], lastScreen: 'intro', screens: 6 })
  })

  it('installation neuve : l’historique des nouveautés est déjà « lu » (VC-5)', () => {
    renderAt()
    expect(getLastSeenId()).toBe(CHANGELOG[0].id)
  })

  it('le retour du temps 1 ramène à la rencontre, puis à l’ouverture', () => {
    at('goal', { step: 2 })
    renderAt()
    fireEvent.click(btn('Retour'))
    fireEvent.click(btn('Retour'))
    expect(heading('Bienvenue dans Halcya')).toBeInTheDocument()
  })

  it('Pilou déjà rencontré (accueil repris) : pas de seconde rencontre', () => {
    markMet('onboarding', { name: 'Bulle' })
    expect(stepsFor()).toEqual(['intro', 'goal', 'watch', 'auto', 'notes'])
  })

  it('Pilou suit les temps : le ventre, la montre', () => {
    at('goal', { step: 2 })
    renderAt()
    fireEvent.click(check(/Confort digestif/))
    expect(screen.getByText('La digestion aussi : c’est noté.')).toBeInTheDocument()
    fireEvent.click(btn('Continuer'))
    fireEvent.click(radio('Oui'))
    expect(screen.getByText('Une montre ? Moi aussi !')).toBeInTheDocument()
    expect(wearsWatch()).toBe(true)
    fireEvent.click(radio('Non, pas pour l’instant'))
    expect(wearsWatch()).toBe(false)
  })
})

describe('Temps 1 : « Qu’est-ce qui vous amène ? »', () => {
  beforeEach(() => localStorage.clear())

  it('Bien-être coché et verrouillé (« Toujours suivi »), Confort digestif à cocher (« Ajouté »), la ligne « Inclus »', () => {
    at('goal')
    renderAt()
    expect(screen.getByText('Choisissez ce que vous voulez améliorer.')).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox')).toHaveLength(2)
    expect(check(/Bien-être/)).toBeChecked()
    expect(check(/Bien-être/)).toBeDisabled()
    expect(screen.getByText('Toujours suivi')).toBeInTheDocument()
    expect(screen.getByText('Comprendre ce qui influence comment vous vous sentez.')).toBeInTheDocument()
    expect(check(/Confort digestif/)).not.toBeChecked()
    expect(screen.queryByText('Ajouté')).toBeNull()
    expect(screen.getByText('Inclus : le bien-être + 1 objectif.')).toBeInTheDocument()
    fireEvent.click(check(/Confort digestif/))
    expect(screen.getByText('Ajouté')).toBeInTheDocument()
    expect(loadOnboarding()).toMatchObject({ goals: ['wellbeing', 'gut'], goalsVersion: 2 })
    fireEvent.click(check(/Confort digestif/))
    expect(loadOnboarding().goals).toEqual(['wellbeing'])
  })

  it('les anciens objectifs ne sont plus proposés', () => {
    at('goal')
    renderAt()
    expect(screen.queryByText(/Mon stress|Prendre soin de moi|Tout mesurer|Mon cycle|Mon sport/)).toBeNull()
  })

  it('accueil commencé avant la mise à jour avec « Ma digestion » : Confort digestif déjà coché, anciens choix gardés', () => {
    at('goal', { goals: ['gut', 'care'] })
    renderAt()
    expect(check(/Confort digestif/)).toBeChecked()
    fireEvent.click(btn('Continuer'))
    expect(loadOnboarding()).toMatchObject({ goals: ['wellbeing', 'gut'], goalsBefore: ['gut', 'care'], goalsVersion: 2 })
  })

  it('l’ancien « Mon cycle » garde son marqueur d’affichage', () => {
    at('goal', { goals: ['cycle'] })
    renderAt()
    fireEvent.click(btn('Continuer'))
    expect(loadOnboarding().goals).toEqual(['wellbeing', 'gut', 'cycle'])
  })

  it('renvoie au même nom que la roue : « Réglages › Paramètres » (POLISH-SIM-44)', () => {
    at('goal')
    renderAt()
    expect(screen.getByText('Vous pourrez le changer dans Réglages › Paramètres (roue en haut à droite).')).toBeInTheDocument()
  })

  it('aucun texte ne renvoie à « Paramètres » seul (POLISH-SIM-44)', () => {
    // L'écran du visage n'existe pas en jsdom (pas de lecture du visage) : on lit ses textes dans la source.
    expect(onboardingSource).toContain("'à tout moment, dans Réglages › Paramètres'")
    expect(onboardingSource).not.toMatch(/dans Paramètres/)
  })
})

describe('Temps 2 : « Avez-vous une montre, un bracelet ou une balance ? » (sans Health Connect sur le téléphone)', () => {
  beforeEach(() => localStorage.clear())

  it('rien de choisi : ni carte de source, ni permission ; la météo reste proposée par son interrupteur', () => {
    at('watch')
    renderAt()
    expect(screen.getByText('On les branche une seule fois.')).toBeInTheDocument()
    expect(radio('Oui')).not.toBeChecked()
    expect(radio('Non, pas pour l’instant')).not.toBeChecked()
    expect(screen.queryByText(/Health Connect/)).toBeNull()
    expect(screen.getByRole('switch', { name: 'Météo' })).not.toBeChecked()
    expect(btn('Continuer')).toBeEnabled()
  })

  it('« Oui » ouvre les sources et dit qu’elles vivent ensuite dans Réglages › Sources', async () => {
    at('watch')
    renderAt()
    fireEvent.click(radio('Oui'))
    expect(loadOnboarding().watch).toBe('yes')
    expect(await screen.findByText(/Health Connect n’est pas sur ce téléphone/)).toBeInTheDocument()
    expect(screen.getByText('Une seule fois. Ensuite, vos sources se gèrent dans Réglages › Sources.')).toBeInTheDocument()
    expect(screen.getByText('Une balance connectée ? Votre poids arrive aussi par Health Connect, à voir dans Tendances.')).toBeInTheDocument()
  })

  it('la balance n’est citée qu’après « Oui » (POLISH-SIM-115)', () => {
    at('watch')
    renderAt()
    expect(screen.queryByText(/Votre poids arrive/)).toBeNull()
    fireEvent.click(radio('Non, pas pour l’instant'))
    expect(screen.queryByText(/Votre poids arrive/)).toBeNull()
  })

  it('« Non, pas pour l’instant » : une ligne discrète, aucune carte', () => {
    at('watch')
    renderAt()
    fireEvent.click(radio('Non, pas pour l’instant'))
    expect(loadOnboarding().watch).toBe('no')
    expect(screen.getByText('Si votre téléphone compte vos pas, vous pourrez relier Health Connect dans Réglages › Sources.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Connecter/ })).toBeNull()
  })

  it('une ancienne réponse (« none », accueil d’avant le 08/11) ne coche rien', () => {
    at('watch', { watch: 'none' })
    renderAt()
    expect(radio('Oui')).not.toBeChecked()
    expect(radio('Non, pas pour l’instant')).not.toBeChecked()
  })
})

describe('Temps 3 : « Ce que Halcya suit pour vous, sans rien faire »', () => {
  beforeEach(() => localStorage.clear())
  const tiles = () => [...screen.getByRole('list', { name: 'Suivi sans rien faire' }).children].map((li) => li.textContent)

  it('avec une montre : Sommeil, Pas, Séances, Cœur sûrs ; VFC, respiration, température « selon votre montre » (POLISH-SIM-105)', () => {
    at('auto', { watch: 'yes', weather: 'on' })
    renderAt()
    expect(screen.getByText('Pour information : rien à valider.')).toBeInTheDocument()
    expect(tiles()).toEqual(['Sommeil', 'Pas', 'Séances de sport', 'Cœur', 'Météo'])
    expect(screen.getByText('Selon votre montre : variabilité cardiaque, respiration, température de la peau.')).toBeInTheDocument()
    expect(AUTO_TILES.some((t) => /stress/i.test(t.label))).toBe(false)
    expect(screen.getByText('Sommeil').closest('li')).toHaveAttribute('data-tone', 'night')
    expect(screen.getByText('Rien à cocher : tout se fait en arrière-plan, grâce à votre montre et à votre téléphone.')).toBeInTheDocument()
    expect(screen.queryByText(/Activables dans/)).toBeNull()
    expect(screen.queryByRole('checkbox')).toBeNull()
  })

  it('météo éteinte à l’écran d’avant : pas de tuile Météo, une ligne vers Réglages › Sources (POLISH-SIM-105)', () => {
    at('auto', { watch: 'yes', weather: 'off' })
    renderAt()
    expect(tiles()).toEqual(['Sommeil', 'Pas', 'Séances de sport', 'Cœur'])
    expect(screen.getByText('Activables dans Réglages › Sources : météo.')).toBeInTheDocument()
  })

  it('sans montre, météo allumée : seulement la météo ; le reste est annoncé pour plus tard, sans le promettre', () => {
    at('auto', { watch: 'no', weather: 'on' })
    renderAt()
    expect(tiles()).toEqual(['Météo'])
    expect(screen.getByText('Avec une montre ou un bracelet : sommeil, séances de sport, cœur, variabilité cardiaque, respiration, température de la peau.')).toBeInTheDocument()
    // POLISH-SIM-124 : le téléphone compte les pas, une montre n'est pas nécessaire
    expect(screen.getByText('Activables dans Réglages › Sources : pas (votre téléphone).')).toBeInTheDocument()
    expect(screen.queryByText(/grâce à votre montre/)).toBeNull()
    expect(screen.queryByText(/Selon votre montre/)).toBeNull()
  })

  it('Android : temps d’écran allumé en tuile, éteint dans « Activables » avec la météo (autoTiles)', () => {
    const a = autoTiles({ watch: true, on: { screen: true, weather: false }, available: { screen: true } })
    expect(a.tiles.map((t) => t.id)).toEqual(['sleep', 'steps', 'workouts', 'heart', 'screen'])
    expect(a.off).toEqual(['météo'])
    const b = autoTiles({ watch: false, on: {}, available: { screen: true } })
    expect(b.off).toEqual(['pas (votre téléphone)', 'temps d’écran', 'météo'])
    expect(b.maybe).toEqual([])
  })

  it('sans montre, les pas du téléphone : suivis si Health Connect est relié, activables s’il existe, absents sinon (POLISH-SIM-124)', () => {
    const granted = autoTiles({ watch: false, health: 'granted', on: { weather: true }, available: { screen: false } })
    expect(granted.tiles.map((t) => t.label)).toEqual(['Pas (votre téléphone)', 'Météo'])
    expect(granted.later).not.toContain('pas')
    const none = autoTiles({ watch: false, health: 'unavailable', on: {}, available: { screen: false } })
    expect(none.tiles).toEqual([])
    expect(none.off).toEqual(['météo'])
    expect(none.later).not.toContain('pas')
    // Avec une montre, rien ne change : les pas viennent d'elle
    const watch = autoTiles({ watch: true, health: 'granted', on: {}, available: { screen: false } })
    expect(watch.tiles.map((t) => t.label)).toContain('Pas')
  })

  it('sans montre ni météo : aucune liste vide, juste ce qui est activable et ce qu’une montre ajouterait', () => {
    at('auto', { watch: 'no', weather: 'off' })
    renderAt()
    expect(screen.queryByRole('list', { name: 'Suivi sans rien faire' })).toBeNull()
    expect(screen.queryByText(/Rien à cocher/)).toBeNull()
    expect(screen.getByText('Activables dans Réglages › Sources : pas (votre téléphone), météo.')).toBeInTheDocument()
    expect(screen.getByText(/^Avec une montre ou un bracelet :/)).toBeInTheDocument()
  })
})

describe('Temps d’écran que le téléphone ne donne pas (Android 8, iPhone avant iOS 26.4 ; POLISH-SIM-105i)', () => {
  const fake = (supported) => {
    window.__healthtrackFakePhoneUsage = {
      checkAccess: async () => ({ granted: false, supported }),
      openAccessSettings: async () => {},
      queryScreenEvents: async () => ({ events: [] }),
    }
  }
  beforeEach(() => localStorage.clear())
  afterEach(() => {
    delete window.__healthtrackFakePhoneUsage
  })

  it('temps 3 : « temps d’écran » n’est pas dit activable', async () => {
    fake(false)
    at('auto', { watch: 'no', weather: 'off' })
    renderAt()
    await waitFor(() => expect(screen.getByText('Activables dans Réglages › Sources : pas (votre téléphone), météo.')).toBeInTheDocument())
  })

  it('temps 3 : pris en charge, il reste activable', async () => {
    fake(true)
    at('auto', { watch: 'no', weather: 'off' })
    renderAt()
    expect(await screen.findByText('Activables dans Réglages › Sources : pas (votre téléphone), temps d’écran, météo.')).toBeInTheDocument()
  })

  it('temps 2 : pas de ligne « Temps d’écran » ; la météo reste', async () => {
    fake(false)
    at('watch', { watch: 'no' })
    renderAt()
    await waitFor(() => expect(screen.queryByRole('switch', { name: 'Temps d’écran' })).toBeNull())
    expect(screen.getByRole('switch', { name: 'Météo' })).toBeInTheDocument()
  })

  it('temps 2 : déjà allumé, la ligne reste pour pouvoir le couper', async () => {
    fake(false)
    localStorage.setItem('healthtrack_phone_usage', JSON.stringify({ enabled: true }))
    at('watch', { watch: 'no' })
    renderAt()
    await new Promise((r) => setTimeout(r, 0))
    expect(screen.getByRole('switch', { name: 'Temps d’écran' })).toBeInTheDocument()
  })
})

describe('Temps 4 : « Ce que vous noterez chaque jour »', () => {
  beforeEach(() => localStorage.clear())
  const notes = () => [...screen.getByRole('list', { name: 'Chaque jour' }).children].map((li) => li.textContent)

  it('sans l’objectif digestion : repas et bien-être, méditation cochée ; « 3 choses par jour »', () => {
    at('notes', { goals: ['wellbeing'] })
    renderAt()
    expect(notes()).toEqual(['Repasen photo, 3 par jour', 'Bien-êtreune note rapide'])
    expect(screen.queryByText('Digestion')).toBeNull()
    expect(check('Méditation')).toBeChecked()
    for (const h of ['Étirements', 'Relaxation', 'Lecture']) expect(check(h)).not.toBeChecked()
    expect(screen.getByRole('status')).toHaveTextContent('3 choses par jour · environ 1 minute')
    expect(screen.getByText('Partez de ce que vous faites déjà : ce n’est pas une liste de bonnes résolutions.')).toBeInTheDocument()
    // rien n'est enregistré tant que la personne n'a ni changé ni validé
    expect(getHabits()).toEqual([])
  })

  it('avec l’objectif digestion : la ligne « Digestion · le soir » et « 4 choses par jour » ; jamais « ventre »', () => {
    at('notes', { goals: ['wellbeing', 'gut'] })
    renderAt()
    expect(notes()).toEqual(['Repasen photo, 3 par jour', 'Bien-êtreune note rapide', 'Digestionle soir'])
    expect(screen.getByRole('status')).toHaveTextContent('4 choses par jour · environ 1 minute')
    expect(document.body.textContent).not.toMatch(/ventre/i)
    expect(dailyNotes(false).map((n) => n.id)).toEqual(['meals', 'wellbeing'])
    expect(dailySummary(5)).toBe('5 choses par jour · environ 1 minute')
  })

  it('cocher, décocher : le réglage des habitudes suit aussitôt, le résumé aussi', () => {
    at('notes', { goals: ['wellbeing'] })
    renderAt()
    fireEvent.click(check('Étirements'))
    expect(getHabits().map((h) => h.id)).toEqual(['meditation', 'stretching'])
    expect(screen.getByRole('status')).toHaveTextContent('4 choses par jour')
    fireEvent.click(check('Méditation'))
    expect(getHabits().map((h) => h.id)).toEqual(['stretching'])
    expect(loadOnboarding().habitsChosen).toBe(true)
  })

  it('une habitude libre : « Ajouter » grisé sans nom, puis une case cochée de plus ; une seule habitude libre', () => {
    at('notes', { goals: ['wellbeing'] })
    renderAt()
    expect(btn('Ajouter')).toBeDisabled()
    fireEvent.change(screen.getByRole('textbox', { name: 'Ajouter une habitude' }), { target: { value: '  Marche du soir ' } })
    fireEvent.click(btn('Ajouter'))
    expect(check('Marche du soir')).toBeChecked()
    expect(getHabits()).toEqual([{ id: 'meditation', label: 'Méditation' }, { id: 'custom:marche-du-soir', label: 'Marche du soir' }])
    expect(screen.queryByRole('textbox', { name: 'Ajouter une habitude' })).toBeNull()
    fireEvent.click(check('Marche du soir'))
    expect(screen.getByRole('textbox', { name: 'Ajouter une habitude' })).toBeInTheDocument()
  })

  it('tout décoché puis « C’est parti ! » : aucune habitude, la méditation ne revient pas', async () => {
    at('notes', { goals: ['wellbeing'] })
    renderAt()
    fireEvent.click(check('Méditation'))
    fireEvent.click(btn('C’est parti !'))
    expect(await screen.findByText('Page Aujourd’hui')).toBeInTheDocument()
    expect(getHabits()).toEqual([])
  })

  it('habitudes déjà choisies (retour sur l’écran) : relues telles quelles', () => {
    setHabits([{ id: 'reading', label: 'Lecture' }])
    at('notes', { goals: ['wellbeing'], habitsChosen: true })
    renderAt()
    expect(check('Lecture')).toBeChecked()
    expect(check('Méditation')).not.toBeChecked()
  })
})

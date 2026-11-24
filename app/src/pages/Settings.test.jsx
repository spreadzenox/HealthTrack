import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Settings from './Settings'
import { DebugProvider } from '../contexts/DebugContext'
import { getGeminiModel } from '../settings/geminiModel'

function renderSettings() {
  return render(
    <DebugProvider>
      <BrowserRouter>
        <Settings />
      </BrowserRouter>
    </DebugProvider>
  )
}

describe('Settings — Gemini', () => {
  beforeEach(() => localStorage.clear())

  it('prévient qu’une clé gratuite permet à Google d’utiliser les photos', () => {
    renderSettings()
    expect(screen.getByText(/Avec une clé gratuite/i)).toBeInTheDocument()
    expect(screen.getByText(/relus par des personnes/i)).toBeInTheDocument()
  })

  it('dit tout ce qui part chez Google : la photo, ou le texte d’un repas décrit', () => {
    renderSettings()
    const sent = screen.getByText(/Ce qui est envoyé/i).closest('p')
    expect(sent).toHaveTextContent(/photo du repas/i)
    expect(sent).toHaveTextContent(/texte/i)
    expect(screen.getByText(/Sans clé/i)).toHaveTextContent(/description/i)
  })

  it('dit simplement qu’une clé est enregistrée', () => {
    localStorage.setItem('healthtrack_gemini_api_key', 'AIzaTest')
    renderSettings()
    expect(screen.getByText('✓ Clé enregistrée')).toBeInTheDocument()
  })

  it('permet de choisir le modèle Gemini (replié sous « Choisir le modèle ») et l’enregistre', () => {
    renderSettings()
    const select = screen.getByLabelText(/Modèle Gemini/i)
    expect(select.value).toBe('gemini-3.8-flash')
    fireEvent.change(select, { target: { value: 'gemini-3.5-flash-lite' } })
    expect(getGeminiModel()).toBe('gemini-3.5-flash-lite')
  })
})

describe('Settings — Withings', () => {
  beforeEach(() => localStorage.clear())

  it('ne contient plus la configuration Withings (déplacée dans la carte Withings des Connecteurs)', () => {
    renderSettings()
    expect(screen.queryByText(/Withings/i)).not.toBeInTheDocument()
  })
})

describe('Settings — Cigarettes', () => {
  beforeEach(() => localStorage.clear())

  it('épingle le bouton « + 1 cigarette » de l’accueil', () => {
    renderSettings()
    fireEvent.click(screen.getByLabelText(/Toujours afficher le bouton cigarette/i))
    expect(localStorage.getItem('healthtrack_cigarette_counter')).toBe('on')
    expect(screen.getByLabelText(/Toujours afficher le bouton cigarette/i).querySelector('input')).toBeChecked()
  })
})

describe('Settings — Vos objectifs (refonte étape 5a)', () => {
  beforeEach(() => localStorage.clear())
  const stored = () => JSON.parse(localStorage.getItem('healthtrack_onboarding'))

  it('Bien-être toujours suivi et verrouillé, Confort digestif à cocher', () => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, goals: ['wellbeing'], goalsVersion: 2 }))
    renderSettings()
    const group = screen.getByRole('group', { name: 'Vos objectifs' })
    expect(within(group).getAllByRole('checkbox')).toHaveLength(2)
    const wellbeing = within(group).getByRole('checkbox', { name: /Bien-être/ })
    expect(wellbeing).toBeChecked()
    expect(wellbeing).toBeDisabled()
    expect(within(group).getByText('Toujours suivi')).toBeInTheDocument()
    const gut = within(group).getByRole('checkbox', { name: 'Confort digestif' })
    expect(gut).not.toBeChecked()
    fireEvent.click(gut)
    expect(stored().goals).toEqual(['wellbeing', 'gut'])
    fireEvent.click(gut)
    expect(stored().goals).toEqual(['wellbeing'])
  })

  it('reprend les anciens choix : « Ma digestion » (ancien goal) coche Confort digestif ; les autres non', () => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, goal: 'gut' }))
    const { unmount } = renderSettings()
    expect(screen.getByRole('checkbox', { name: 'Confort digestif' })).toBeChecked()
    unmount()
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, goals: ['stress', 'care'] }))
    renderSettings()
    expect(screen.getByRole('checkbox', { name: 'Confort digestif' })).not.toBeChecked()
    expect(screen.queryByRole('checkbox', { name: /Mon stress|Prendre soin|Tout mesurer|Mon cycle|Mon sport/ })).toBeNull()
  })

  it('un choix fait avant la migration du démarrage écrit la nouvelle forme et garde les anciens choix', () => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, goals: ['stress', 'sport'] }))
    renderSettings()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Confort digestif' }))
    expect(stored()).toMatchObject({ goals: ['wellbeing', 'gut'], goalsBefore: ['stress', 'sport'], goalsVersion: 2 })
  })

  it('l’ancien « Mon cycle » : décocher Confort digestif garde le marqueur du cycle et retire le ventre', () => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, goals: ['cycle'] }))
    renderSettings()
    const gut = screen.getByRole('checkbox', { name: 'Confort digestif' })
    expect(gut).toBeChecked()
    fireEvent.click(gut)
    expect(stored().goals).toEqual(['wellbeing', 'cycle'])
    expect(gut).not.toBeChecked()
    expect(screen.queryByRole('checkbox', { name: 'Rappel du bilan digestif, le soir' })).toBeNull()
  })

  it('POLISH-SIM-100 : après la migration, une ligne dit où sont passés Sport et Mon cycle', () => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({
      done: true, goals: ['wellbeing', 'gut', 'cycle'], goalsBefore: ['sport', 'cycle'], goalsVersion: 2,
    }))
    renderSettings()
    const note = screen.getByRole('list', { name: 'Vos anciens objectifs' })
    expect(within(note).getAllByRole('listitem')).toHaveLength(2)
    expect(within(note).getByText(/Sport : vos séances comptent dans la famille Activité d’Objectifs\./)).toBeInTheDocument()
    expect(within(note).getByText(/Mon cycle : notez vos règles dans Ma journée › Règles\. Confort digestif le remplace\./))
      .toBeInTheDocument()
  })

  it('POLISH-SIM-100 : anciens « Mon stress » et « Mon sport », avant la migration du démarrage : une ligne chacun', () => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, goals: ['stress', 'sport'] }))
    renderSettings()
    const note = screen.getByRole('list', { name: 'Vos anciens objectifs' })
    expect(within(note).getAllByRole('listitem')).toHaveLength(2)
    expect(within(note).queryByText(/Mon cycle/)).toBeNull()
  })

  it('POLISH-SIM-100 : installation neuve ou autres anciens objectifs, aucune ligne', () => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, goals: ['wellbeing', 'gut'], goalsVersion: 2 }))
    const { unmount } = renderSettings()
    expect(screen.queryByRole('list', { name: 'Vos anciens objectifs' })).toBeNull()
    unmount()
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({
      done: true, goals: ['wellbeing'], goalsBefore: ['care', 'all'], goalsVersion: 2,
    }))
    renderSettings()
    expect(screen.queryByRole('list', { name: 'Vos anciens objectifs' })).toBeNull()
  })

  it('POLISH-SIM-155 : l’ancien « Mon stress et mon sommeil » (ou « energy » du tout premier accueil) dit où il est passé', () => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({
      done: true, goals: ['wellbeing'], goalsBefore: ['stress', 'care'], goalsVersion: 2,
    }))
    const { unmount } = renderSettings()
    const note = screen.getByRole('list', { name: 'Vos anciens objectifs' })
    expect(within(note).getAllByRole('listitem')).toHaveLength(1)
    expect(within(note).getByText('Mon stress et mon sommeil : Bien-être le remplace, le sommeil en fait partie.'))
      .toBeInTheDocument()
    unmount()
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, goal: 'energy' }))
    renderSettings()
    expect(within(screen.getByRole('list', { name: 'Vos anciens objectifs' })).getByText(/^Mon stress et mon sommeil :/))
      .toBeInTheDocument()
  })

  it('sans Confort digestif, pas de rappel du soir', () => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true }))
    renderSettings()
    expect(screen.queryByRole('checkbox', { name: 'Rappel du bilan digestif, le soir' })).toBeNull()
    expect(screen.queryByText(/Sans objectif/)).not.toBeInTheDocument()
  })

  it('rappel du bilan digestif : seulement avec la carte ventre, et retiré du natif quand l’objectif change (I170)', async () => {
    const configure = vi.fn(async (o) => ({ enabled: !!o.enabled }))
    window.__healthtrackFakeGutEvening = { status: async () => ({ enabled: true, minuteOfDay: 20 * 60 + 30 }), configure }
    try {
      localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, goal: 'gut' }))
      localStorage.setItem('healthtrack_gut_evening', JSON.stringify({ enabled: true }))
      renderSettings()
      expect(screen.getByRole('checkbox', { name: 'Rappel du bilan digestif, le soir' })).toBeChecked()
      expect(await screen.findByText(/Vers 20 h 30/)).toBeInTheDocument()
      fireEvent.click(screen.getByRole('checkbox', { name: 'Confort digestif' }))
      expect(screen.queryByRole('checkbox', { name: 'Rappel du bilan digestif, le soir' })).not.toBeInTheDocument()
      await waitFor(() => expect(configure).toHaveBeenLastCalledWith({ enabled: false }))
      expect(JSON.parse(localStorage.getItem('healthtrack_gut_evening'))).toEqual({ enabled: true })
    } finally {
      delete window.__healthtrackFakeGutEvening
    }
  })
})

describe('Settings — Rappels (POLISH-SIM-114)', () => {
  beforeEach(() => localStorage.clear())

  const fakeEvening = (enabled = false) => {
    const configure = vi.fn(async (o) => ({ enabled: !!o.enabled, minuteOfDay: 21 * 60, notifications: true }))
    window.__healthtrackFakeEveningNote = {
      status: async () => ({ enabled, minuteOfDay: 21 * 60 }),
      configure,
      requestNotifications: async () => ({ notifications: true, asked: true }),
    }
    return configure
  }

  it('sans rappel possible sur ce téléphone, pas de bloc Rappels', () => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, goal: 'gut' }))
    renderSettings()
    expect(screen.queryByRole('region', { name: 'Rappels' })).toBeNull()
  })

  it('regroupe la note du soir, le bilan digestif et la portion du jour', async () => {
    fakeEvening()
    window.__healthtrackFakeGutEvening = { status: async () => ({ enabled: false, minuteOfDay: 20 * 60 }), configure: vi.fn(async (o) => o) }
    window.__healthtrackFakePortionReminder = { schedule: vi.fn(async () => ({ notifications: true })) }
    try {
      localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, goal: 'gut' }))
      renderSettings()
      const block = screen.getByRole('region', { name: 'Rappels' })
      expect(within(block).getByRole('checkbox', { name: 'Note de bien-être, le soir' })).not.toBeChecked()
      expect(within(block).getByRole('checkbox', { name: 'Rappel du bilan digestif, le soir' })).toBeInTheDocument()
      expect(within(block).getByRole('checkbox', { name: 'Portion du jour, pendant une réintroduction' })).not.toBeChecked()
      expect(await within(block).findByText(/Vers 21 h, seulement si vous n’avez pas déjà noté/)).toBeInTheDocument()
    } finally {
      delete window.__healthtrackFakeEveningNote
      delete window.__healthtrackFakeGutEvening
      delete window.__healthtrackFakePortionReminder
    }
  })

  it('allume et éteint la note du soir avec l’interrupteur existant', async () => {
    const configure = fakeEvening()
    try {
      localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true }))
      renderSettings()
      const box = screen.getByRole('checkbox', { name: 'Note de bien-être, le soir' })
      fireEvent.click(box)
      await waitFor(() => expect(configure).toHaveBeenCalledWith(expect.objectContaining({ enabled: true })))
      await waitFor(() => expect(box).toBeChecked())
      fireEvent.click(box)
      await waitFor(() => expect(configure).toHaveBeenLastCalledWith({ enabled: false }))
      await waitFor(() => expect(box).not.toBeChecked())
    } finally {
      delete window.__healthtrackFakeEveningNote
    }
  })

  it('la portion du jour garde le choix de la réintroduction', async () => {
    const schedule = vi.fn(async () => ({ notifications: true }))
    window.__healthtrackFakePortionReminder = { schedule }
    try {
      localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true }))
      localStorage.setItem('halcya_portion_reminder', JSON.stringify({ enabled: true, minute: 13 * 60 }))
      renderSettings()
      const box = screen.getByRole('checkbox', { name: 'Portion du jour, pendant une réintroduction' })
      expect(box).toBeChecked()
      expect(screen.getByText(/Chaque jour de test vers 13 h/)).toBeInTheDocument()
      fireEvent.click(box)
      await waitFor(() => expect(JSON.parse(localStorage.getItem('halcya_portion_reminder'))).toEqual({ enabled: false, minute: 13 * 60 }))
    } finally {
      delete window.__healthtrackFakePortionReminder
    }
  })
})

describe('Settings — Apparence', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('propose Clair (choisi par défaut), Sombre et Comme le téléphone', () => {
    renderSettings()
    expect(screen.getByRole('radio', { name: 'Clair' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Sombre' })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: 'Comme le téléphone' })).toBeInTheDocument()
  })

  it('applique le thème sombre tout de suite et le retient', () => {
    renderSettings()
    fireEvent.click(screen.getByRole('radio', { name: 'Sombre' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('healthtrack_theme')).toBe('dark')
  })
})

describe('Settings — Mode diagnostic (sideload)', () => {
  beforeEach(() => localStorage.clear())

  it('visible d’emblée, avec le numéro de version en bas', () => {
    renderSettings()
    expect(screen.getByText('Mode diagnostic')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Version / })).toBeInTheDocument()
  })
})

describe('Settings — Votre avis (sideload)', () => {
  beforeEach(() => localStorage.clear())

  it('ouvre un ticket GitHub prérempli avec la version', () => {
    renderSettings()
    const link = screen.getByRole('link', { name: 'un ticket GitHub' })
    expect(link.getAttribute('href')).toMatch(/^https:\/\/github\.com\/spreadzenox\/HealthTrack\/issues\/new\?title=/)
    expect(link).toHaveAttribute('target', '_blank')
  })
})

describe('Settings — langue (jalon 9)', () => {
  it('le réglage « Langue » reste caché tant que l’anglais n’est pas prêt (VITE_I18N_EN coupé)', () => {
    renderSettings()
    expect(screen.queryByRole('radiogroup', { name: 'Langue' })).not.toBeInTheDocument()
  })
})

describe('Settings — lien vers une rubrique (POLISH-SIM-119)', () => {
  beforeEach(() => localStorage.clear())

  it('/settings#habitudes fait venir « Vos habitudes » à l’écran', async () => {
    const scroll = vi.fn()
    const original = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = scroll
    window.history.pushState({}, '', '/settings#habitudes')
    try {
      renderSettings()
      await waitFor(() => expect(scroll).toHaveBeenCalled())
      expect(scroll.mock.contexts[0]).toBe(document.getElementById('habitudes'))
    } finally {
      Element.prototype.scrollIntoView = original
      window.history.pushState({}, '', '/')
    }
  })

  it('sans ancre, la page s’ouvre en haut', () => {
    const scroll = vi.fn()
    const original = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = scroll
    window.history.pushState({}, '', '/settings')
    try {
      renderSettings()
      expect(scroll).not.toHaveBeenCalled()
    } finally {
      Element.prototype.scrollIntoView = original
      window.history.pushState({}, '', '/')
    }
  })
})

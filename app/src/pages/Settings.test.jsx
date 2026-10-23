import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
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

describe('Settings — Ce qui vous amène (I155)', () => {
  beforeEach(() => localStorage.clear())

  it('reprend l’objectif de l’onboarding et retient le nouveau choix', () => {
    localStorage.setItem('healthtrack_onboarding', JSON.stringify({ done: true, goal: 'gut' }))
    renderSettings()
    const group = screen.getByRole('radiogroup', { name: 'Ce qui vous amène' })
    expect(within(group).getByRole('radio', { name: 'Mon ventre' })).toBeChecked()
    fireEvent.click(within(group).getByRole('radio', { name: 'Mon énergie et mon sommeil' }))
    expect(JSON.parse(localStorage.getItem('healthtrack_onboarding'))).toMatchObject({ done: true, goal: 'energy' })
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

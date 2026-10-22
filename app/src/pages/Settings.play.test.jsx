import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, DISTRIBUTION: 'play', FEATURES: actual.featuresFor('play') }
})

import Settings from './Settings'
import { DebugProvider } from '../contexts/DebugContext'

const renderSettings = () => render(<DebugProvider><BrowserRouter><Settings /></BrowserRouter></DebugProvider>)

describe('Settings — variante play (relais Halcya)', () => {
  beforeEach(() => localStorage.clear())

  it('aucun champ de clé Gemini : l’analyse passe par notre serveur', () => {
    renderSettings()
    expect(screen.queryByLabelText(/Clé API Gemini/i)).toBeNull()
    expect(screen.getByText('Analyse des repas (IA)')).toBeInTheDocument()
    expect(screen.getByText(/Aucune clé à saisir/)).toBeInTheDocument()
    const sent = screen.getByText(/Ce qui est envoyé/i).closest('p')
    expect(sent).toHaveTextContent(/identifiant aléatoire/)
    expect(sent).toHaveTextContent(/ne garde rien/)
  })

  it('montre les analyses restantes du jour quand le relais les a données', () => {
    localStorage.setItem('halcya_ai_quota', JSON.stringify({ remaining: 7, resetAt: new Date(Date.now() + 3600_000).toISOString() }))
    renderSettings()
    expect(screen.getByText('7 analyses restantes aujourd’hui.')).toBeInTheDocument()
  })
})

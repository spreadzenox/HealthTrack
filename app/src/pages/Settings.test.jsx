import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

  it('permet de choisir le modèle Gemini et l’enregistre', () => {
    renderSettings()
    const select = screen.getByLabelText(/Modèle Gemini/i)
    expect(select.value).toBe('gemini-3.8-flash')
    fireEvent.change(select, { target: { value: 'gemini-3.5-flash-lite' } })
    expect(getGeminiModel()).toBe('gemini-3.5-flash-lite')
  })
})

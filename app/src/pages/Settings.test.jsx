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
    expect(screen.getByText(/relues par des personnes/i)).toBeInTheDocument()
  })

  it('permet de choisir le modèle Gemini et l’enregistre', () => {
    renderSettings()
    const select = screen.getByLabelText(/Modèle Gemini/i)
    expect(select.value).toBe('gemini-3.8-flash')
    fireEvent.change(select, { target: { value: 'gemini-3.5-flash-lite' } })
    expect(getGeminiModel()).toBe('gemini-3.5-flash-lite')
  })
})

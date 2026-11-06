import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import MealsEmpty from './MealsEmpty'

describe('MealsEmpty (retours du testeur du 06/11, (4))', () => {
  beforeEach(() => localStorage.clear())

  it('un titre et un bouton, sans texte d’explication', () => {
    render(<MealsEmpty inputId="camera-upload" />)
    expect(screen.getByText('Aucun repas enregistré pour l’instant')).toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    expect(screen.queryByText(/Comparés à/)).toBeNull()
  })

  it('le bouton ouvre l’appareil photo du repas (même champ que « Photo du repas »)', () => {
    render(
      <>
        <input id="camera-upload" type="file" capture="environment" aria-label="Prendre une photo" />
        <MealsEmpty inputId="camera-upload" />
      </>,
    )
    const btn = screen.getByText('Ajouter mon premier repas').closest('label')
    expect(btn).toHaveAttribute('for', 'camera-upload')
  })
})

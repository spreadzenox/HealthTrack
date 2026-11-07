import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StripPlus from './StripPlus'
import { scrollToStrip } from '../utils/scrollToStrip'

describe('StripPlus (AUJ-6)', () => {
  it('le « + » remonte au bandeau d’ajout et y place le focus', () => {
    render(
      <>
        <section id="today-add"><button type="button">Repas</button></section>
        <StripPlus label="Ajouter un repas" />
      </>,
    )
    const strip = document.getElementById('today-add')
    strip.scrollIntoView = vi.fn()
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter un repas' }))
    expect(strip.scrollIntoView).toHaveBeenCalled()
    expect(strip).toHaveClass('is-called')
    expect(screen.getByRole('button', { name: 'Repas' })).toHaveFocus()
  })

  it('sans bandeau sur la page, ne fait rien', () => {
    expect(() => scrollToStrip()).not.toThrow()
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AddStrip from './AddStrip'

const view = (props) => render(
  <MemoryRouter>
    <AddStrip onWellbeing={() => {}} digestion={<section data-testid="gut" />} {...props} />
  </MemoryRouter>,
)

describe('AddStrip (nouvel écran Aujourd’hui du 07/11) : le seul endroit pour ajouter', () => {
  it('repas en photo, bien-être, digestion et autre chose, dans cet ordre', () => {
    view()
    const strip = screen.getByRole('region', { name: 'Ajouter' })
    const labels = within(strip).getAllByRole('button').map((b) => b.textContent.trim())
    expect(labels).toEqual(['Repas', 'Bien-être', 'Digestion', 'Autre chose'])
  })

  it('« Repas » ouvre l’appareil photo (champ photo arrière)', () => {
    view()
    const photo = screen.getByRole('button', { name: 'Repas' })
    const input = document.getElementById(photo.getAttribute('for'))
    expect(input).toHaveAttribute('capture', 'environment')
  })

  it('« Bien-être » ouvre la note de 1 à 5', () => {
    const onWellbeing = vi.fn()
    view({ onWellbeing })
    fireEvent.click(screen.getByRole('button', { name: 'Bien-être' }))
    expect(onWellbeing).toHaveBeenCalledTimes(1)
  })

  it('« Digestion » ouvre la note digestive dans une fenêtre, qui se ferme', () => {
    view()
    expect(screen.queryByTestId('gut')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Digestion' }))
    const dialog = screen.getByRole('dialog', { name: 'Ma digestion' })
    expect(within(dialog).getByTestId('gut')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Fermer' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('cigarette dans le bandeau si le compteur est actif, sinon dans « Autre chose »', () => {
    const { unmount } = view({ cigarette: <button type="button">+ 1 cigarette</button>, cigaretteInStrip: true })
    const strip = screen.getByRole('region', { name: 'Ajouter' })
    expect(within(strip).getByRole('button', { name: '+ 1 cigarette' })).toBeInTheDocument()
    unmount()
    view({ cigarette: <button type="button">+ 1 cigarette</button>, cigaretteInStrip: false })
    expect(screen.queryByRole('button', { name: '+ 1 cigarette' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Autre chose' }))
    const dialog = screen.getByRole('dialog', { name: 'Autre chose' })
    expect(within(dialog).getByRole('button', { name: '+ 1 cigarette' })).toBeInTheDocument()
    expect(within(dialog).getByRole('link', { name: /Décrire un repas/ })).toHaveAttribute('href', '/food')
  })

  it('sans fenêtre de digestion fournie, pas de bouton « Digestion »', () => {
    view({ digestion: null })
    expect(screen.queryByRole('button', { name: 'Digestion' })).toBeNull()
  })
})

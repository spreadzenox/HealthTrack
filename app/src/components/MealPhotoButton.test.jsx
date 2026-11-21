import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MealPhotoButton from './MealPhotoButton'
import { takePendingMealPhoto } from '../services/mealPhotoHandoff'

const navigateMock = vi.fn()
vi.mock('react-router-dom', async (orig) => ({ ...(await orig()), useNavigate: () => navigateMock }))

const renderBtn = () => render(<MemoryRouter><MealPhotoButton className="btn">Photo du repas</MealPhotoButton></MemoryRouter>)
const inputOf = (btn) => document.getElementById(btn.getAttribute('for'))

describe('MealPhotoButton (TESTEUR-4b)', () => {
  beforeEach(() => { navigateMock.mockReset(); takePendingMealPhoto() })

  it('is the label of a rear-camera photo field', () => {
    renderBtn()
    const input = inputOf(screen.getByRole('button', { name: 'Photo du repas' }))
    expect(input).toHaveAttribute('type', 'file')
    expect(input).toHaveAttribute('accept', 'image/*')
    expect(input).toHaveAttribute('capture', 'environment')
  })

  it('hands the photo over to the meals page, once', () => {
    renderBtn()
    const file = new File(['x'], 'repas.jpg', { type: 'image/jpeg' })
    fireEvent.change(inputOf(screen.getByRole('button')), { target: { files: [file] } })
    expect(navigateMock).toHaveBeenCalledWith('/food')
    expect(takePendingMealPhoto()).toBe(file)
    expect(takePendingMealPhoto()).toBeNull()
  })

  it('passes the touched circle to the meals page (POLISH-SIM-122)', () => {
    render(<MemoryRouter><MealPhotoButton className="btn" slot="noon">Midi</MealPhotoButton></MemoryRouter>)
    const input = inputOf(screen.getByRole('button', { name: 'Midi' }))
    fireEvent.change(input, { target: { files: [new File(['x'], 'r.jpg', { type: 'image/jpeg' })] } })
    expect(navigateMock).toHaveBeenCalledWith('/food', { state: { mealSlot: 'noon' } })
  })

  it('does nothing when the camera is closed without a photo', () => {
    renderBtn()
    fireEvent.change(inputOf(screen.getByRole('button')), { target: { files: [] } })
    expect(navigateMock).not.toHaveBeenCalled()
    expect(takePendingMealPhoto()).toBeNull()
  })

  it('offers to describe the meal when the camera closes without a photo (POLISH-SIM-17)', () => {
    renderBtn()
    const input = inputOf(screen.getByRole('button', { name: 'Photo du repas' }))
    expect(screen.queryByRole('status')).toBeNull()
    fireEvent(input, new Event('cancel'))
    const hint = screen.getByRole('status')
    expect(hint).toHaveTextContent('Aucune photo prise.')
    expect(screen.getByRole('link', { name: 'Décrire le repas' })).toHaveAttribute('href', '/food')
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }))
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('renders the hint at the root of the page, outside a transformed scene (POLISH-SIM-134)', () => {
    const { container } = render(
      <MemoryRouter><div data-testid="scene" style={{ transform: 'scale(1)' }}><MealPhotoButton className="btn">Repas</MealPhotoButton></div></MemoryRouter>,
    )
    fireEvent(inputOf(screen.getByRole('button', { name: 'Repas' })), new Event('cancel'))
    const hint = screen.getByRole('status')
    expect(screen.getByTestId('scene').contains(hint)).toBe(false)
    expect(container.contains(hint)).toBe(false)
    expect(hint.parentElement).toBe(document.body)
  })

  it('hides the hint once a photo is taken', () => {
    renderBtn()
    const input = inputOf(screen.getByRole('button', { name: 'Photo du repas' }))
    fireEvent(input, new Event('cancel'))
    fireEvent.change(input, { target: { files: [new File(['x'], 'r.jpg', { type: 'image/jpeg' })] } })
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('opens the field from the keyboard', () => {
    renderBtn()
    const btn = screen.getByRole('button')
    const click = vi.spyOn(inputOf(btn), 'click')
    fireEvent.keyDown(btn, { key: 'Enter' })
    expect(click).toHaveBeenCalled()
  })
})

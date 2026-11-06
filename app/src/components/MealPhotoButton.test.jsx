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

  it('does nothing when the camera is closed without a photo', () => {
    renderBtn()
    fireEvent.change(inputOf(screen.getByRole('button')), { target: { files: [] } })
    expect(navigateMock).not.toHaveBeenCalled()
    expect(takePendingMealPhoto()).toBeNull()
  })

  it('opens the field from the keyboard', () => {
    renderBtn()
    const btn = screen.getByRole('button')
    const click = vi.spyOn(inputOf(btn), 'click')
    fireEvent.keyDown(btn, { key: 'Enter' })
    expect(click).toHaveBeenCalled()
  })
})

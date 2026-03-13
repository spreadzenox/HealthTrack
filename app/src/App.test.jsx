import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

describe('App', () => {
  it('renders and shows navigation', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )
    expect(screen.getByRole('heading', { name: /HealthTrack/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Tableau de bord/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Alimentation/i })).toBeInTheDocument()
  })

  it('dashboard link points to /', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )
    const dashboardLink = screen.getByRole('link', { name: /Tableau de bord/i })
    expect(dashboardLink).toHaveAttribute('href', '/')
  })

  it('food link points to /food', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )
    const foodLink = screen.getByRole('link', { name: /Alimentation/i })
    expect(foodLink).toHaveAttribute('href', '/food')
  })
})

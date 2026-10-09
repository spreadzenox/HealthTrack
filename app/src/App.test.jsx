import { describe, it, expect } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders and shows navigation', () => {
    const { container } = render(<App />)
    expect(container.querySelector('img.header-logo')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /HealthTrack/i })).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Principal' })
    expect(within(nav).getByRole('link', { name: /Accueil/ })).toHaveAttribute('href', '/')
    expect(within(nav).getByRole('link', { name: /Repas/ })).toHaveAttribute('href', '/food')
    expect(within(nav).getByRole('link', { name: /Nutrition/ })).toHaveAttribute('href', '/nutrition')
    expect(within(nav).getByRole('link', { name: /Analyses/ })).toHaveAttribute('href', '/recommendations')
    expect(within(nav).getByRole('link', { name: /Plus/ })).toHaveAttribute('href', '/plus')
  })

  it('reaches secondary pages through « Plus »', async () => {
    render(<App />)
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', { name: /Plus/ }))
    expect(await screen.findByRole('link', { name: /Données/ })).toHaveAttribute('href', '/data')
    expect(screen.getByRole('link', { name: /Paramètres/ })).toHaveAttribute('href', '/settings')
  })
})

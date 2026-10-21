import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import WeatherCard from './WeatherCard'
import { getWeatherSettings, enableWeather } from '../services/weatherSync'

beforeEach(() => {
  localStorage.clear()
})

describe('WeatherCard', () => {
  it('désactivée : explique ce qui est capté et ce qui sort du téléphone', () => {
    render(<WeatherCard sync={vi.fn()} />)
    expect(screen.getByText('Météo, pression et air')).toBeInTheDocument()
    expect(screen.getByText(/aucune donnée de santé/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Utiliser ma position approximative' })).toBeInTheDocument()
  })

  it('position du téléphone → activée (arrondie) et première mise à jour lancée', async () => {
    const sync = vi.fn(async () => ({ ran: true }))
    const getPosition = vi.fn(async () => ({ lat: 45.76412, lon: 4.83566 }))
    render(<WeatherCard sync={sync} getPosition={getPosition} />)
    fireEvent.click(screen.getByRole('button', { name: 'Utiliser ma position approximative' }))
    fireEvent.click(screen.getByRole('button', { name: 'J’accepte, utiliser ma position' }))
    await waitFor(() => expect(sync).toHaveBeenCalledWith({ force: true }))
    expect(getWeatherSettings()).toMatchObject({ enabled: true, location: { lat: 45.8, lon: 4.8, name: null } })
    expect(await screen.findByText(/Votre position \(à ≈ 10 km près\)/)).toBeInTheDocument()
  })

  it('position refusée : propose la recherche de ville', async () => {
    const getPosition = vi.fn(async () => {
      throw new Error('denied')
    })
    render(<WeatherCard sync={vi.fn()} getPosition={getPosition} />)
    fireEvent.click(screen.getByRole('button', { name: 'Utiliser ma position approximative' }))
    fireEvent.click(screen.getByRole('button', { name: 'J’accepte, utiliser ma position' }))
    expect(await screen.findByText(/Position indisponible/)).toBeInTheDocument()
    expect(screen.getByLabelText('Ou choisissez une ville')).toBeInTheDocument()
  })

  it('divulgation avant la position : « Pas maintenant » ne lit pas la position', async () => {
    const getPosition = vi.fn()
    render(<WeatherCard sync={vi.fn()} getPosition={getPosition} />)
    fireEvent.click(screen.getByRole('button', { name: 'Utiliser ma position approximative' }))
    expect(screen.getByRole('dialog', { name: 'Avant d’utiliser votre position' }).textContent).toMatch(/Open-Meteo/)
    fireEvent.click(screen.getByRole('button', { name: 'Pas maintenant' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(getPosition).not.toHaveBeenCalled()
    expect(getWeatherSettings().enabled).toBe(false)
  })

  it('recherche de ville puis choix', async () => {
    const sync = vi.fn(async () => ({ ran: true }))
    const search = vi.fn(async () => [{ name: 'Nantes', detail: 'Pays de la Loire, France', lat: 47.2, lon: -1.6 }])
    render(<WeatherCard sync={sync} search={search} />)
    fireEvent.change(screen.getByLabelText('Ou choisissez une ville'), { target: { value: 'Nantes' } })
    fireEvent.click(screen.getByRole('button', { name: 'Chercher' }))
    fireEvent.click(await screen.findByRole('button', { name: /Nantes/ }))
    await waitFor(() => expect(sync).toHaveBeenCalled())
    expect(getWeatherSettings().location).toMatchObject({ name: 'Nantes', lat: 47.2 })
  })

  it('activée : lieu, météo du jour, mise à jour et désactivation', async () => {
    enableWeather({ lat: 47.2, lon: -1.6, name: 'Nantes' })
    localStorage.setItem(
      'healthtrack_weather',
      JSON.stringify({
        ...getWeatherSettings(),
        lastSyncAt: '2026-10-12T07:00:00.000Z',
        today: { date: '2026-10-12', tempMaxC: 14.2, tempMinC: 6.8, pressureHpa: 1004, pressureChangeHpa: -8, aqi: 25, pollenMax: 0, pollen: {} },
      }),
    )
    const sync = vi.fn(async () => ({ ran: true }))
    render(<WeatherCard sync={sync} now={new Date('2026-10-12T08:00:00.000Z')} />)
    expect(screen.getByText('Nantes')).toBeInTheDocument()
    expect(screen.getByText(/14° \/ 7°/)).toBeInTheDocument()
    expect(screen.getByText(/1004 hPa \(−8\)/)).toBeInTheDocument()
    expect(screen.getByText(/Pression en forte baisse/)).toBeInTheDocument()
    // Tout arrive seul à chaque ouverture : pas de bouton « Mettre à jour » quand la météo du jour est là.
    expect(screen.queryByRole('button', { name: 'Mettre à jour' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Réessayer' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Désactiver' }))
    expect(getWeatherSettings().enabled).toBe(false)
    expect(screen.getByRole('button', { name: 'Utiliser ma position approximative' })).toBeInTheDocument()
  })

  it('affiche l’erreur de la dernière mise à jour', async () => {
    enableWeather({ lat: 47.2, lon: -1.6, name: 'Nantes' })
    localStorage.setItem('healthtrack_weather', JSON.stringify({ ...getWeatherSettings(), lastError: 'Pas de connexion internet : nouvel essai à la prochaine ouverture.' }))
    const sync = vi.fn(async () => ({ ran: true }))
    render(<WeatherCard sync={sync} />)
    expect(screen.getByText(/Pas de connexion internet/)).toBeInTheDocument()
    // Après un échec seulement, un geste pour réessayer sans attendre la prochaine ouverture.
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    await waitFor(() => expect(sync).toHaveBeenCalledWith({ force: true }))
  })
})

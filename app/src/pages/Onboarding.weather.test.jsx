import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

const geo = vi.hoisted(() => ({ getApproxPosition: vi.fn() }))
vi.mock('../services/approxPosition', () => geo)
const weather = vi.hoisted(() => ({ syncWeather: vi.fn() }))
vi.mock('../services/weatherSync', async (orig) => ({ ...(await orig()), ...weather }))

import Onboarding from './Onboarding'
import { saveOnboarding, loadOnboarding } from '../settings/onboarding'
import { getWeatherSettings, enableWeather } from '../services/weatherSync'

function renderAt() {
  return render(
    <MemoryRouter initialEntries={['/bienvenue']}>
      <Routes>
        <Route path="/bienvenue" element={<Onboarding />} />
        <Route path="/" element={<p>Page Aujourd’hui</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const cont = () => screen.getByRole('button', { name: 'Continuer' })
const allow = () => screen.getByRole('button', { name: 'Utiliser ma position approximative' })

describe('Onboarding : la météo pendant l’accueil (TESTEUR-5a)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    geo.getApproxPosition.mockResolvedValue({ lat: 45.7641, lon: 4.8357 })
    weather.syncWeather.mockResolvedValue({})
    // Sans montre : objectif, suivis, montre, puis la météo
    saveOnboarding({ goal: 'gut', watch: 'none', step: 3 })
  })

  it('facultatif : on peut continuer sans rien autoriser', () => {
    renderAt()
    expect(screen.getByRole('heading', { name: 'La météo de votre ville' })).toBeInTheDocument()
    expect(cont()).toBeEnabled()
    expect(geo.getApproxPosition).not.toHaveBeenCalled()
  })

  it('divulgation d’abord, puis position lue une fois, arrondie, météo activée en arrière-plan', async () => {
    renderAt()
    fireEvent.click(allow())
    expect(await screen.findByText('Avant d’utiliser votre position')).toBeInTheDocument()
    expect(geo.getApproxPosition).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /J’accepte, utiliser ma position/ }))
    expect(await screen.findByText(/C’est activé/)).toBeInTheDocument()
    expect(geo.getApproxPosition).toHaveBeenCalledTimes(1)
    const s = getWeatherSettings()
    expect(s.enabled).toBe(true)
    expect(s.location.lat).not.toBe(45.7641)
    expect(Math.abs(s.location.lat - 45.7641)).toBeLessThan(0.1)
    expect(weather.syncWeather).toHaveBeenCalledWith({ force: true })
    expect(loadOnboarding()).toMatchObject({ weather: 'on' })
    expect(screen.queryByRole('button', { name: 'Utiliser ma position approximative' })).not.toBeInTheDocument()
  })

  it('« Pas maintenant » : aucune position lue, la ville se choisit plus tard dans Sources', async () => {
    renderAt()
    fireEvent.click(allow())
    fireEvent.click(await screen.findByRole('button', { name: 'Pas maintenant' }))
    expect(await screen.findByText(/choisir une ville plus tard dans l’onglet Sources/)).toBeInTheDocument()
    expect(geo.getApproxPosition).not.toHaveBeenCalled()
    expect(getWeatherSettings().enabled).toBe(false)
    expect(cont()).toBeEnabled()
  })

  it('position refusée par Android ou coupée : on le dit, rien n’est activé', async () => {
    geo.getApproxPosition.mockRejectedValue(new Error('denied'))
    renderAt()
    fireEvent.click(allow())
    fireEvent.click(await screen.findByRole('button', { name: /J’accepte, utiliser ma position/ }))
    expect(await screen.findByText(/Position indisponible/)).toBeInTheDocument()
    expect(getWeatherSettings().enabled).toBe(false)
    await waitFor(() => expect(allow()).toBeEnabled())
  })

  it('météo déjà activée (réinstallation, retour en arrière) : rien à redemander', () => {
    enableWeather({ lat: 48.85, lon: 2.35, name: 'Paris' })
    renderAt()
    expect(screen.getByText(/C’est activé/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Utiliser ma position approximative' })).not.toBeInTheDocument()
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Version iOS (HealthTrack-iOS) : la détection des apps n'existe pas sur iPhone (null) → pas de renvoi vers « l’app Android »
vi.mock('../config/distribution', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, DISTRIBUTION: 'appstore', FEATURES: actual.featuresFor('appstore') }
})

import MyDevices from './MyDevices'

describe('Mes appareils sur iPhone (variante appstore)', () => {
  it('annonce la lecture de l’app Santé à venir, sans parler de l’app Android', async () => {
    render(<MyDevices detect={async () => null} loadEntries={async () => []} />)
    expect(await screen.findByText(/Sur iPhone, Halcya lit vos mesures dans l’app Santé d’Apple .* rien reçu ces 30 derniers jours\. Voir la carte « App Santé » plus bas\./)).toBeInTheDocument()
    expect(screen.queryByText(/app Android/)).not.toBeInTheDocument()
  })

  it('mesures jamais reçues : conseille le partage vers l’app Santé, pas vers Health Connect', async () => {
    const at = new Date(Date.now() - 3600 * 1000).toISOString()
    const hc = (type) => ({ source: 'health_connect', at, type, payload: { sourceName: 'Garmin Connect' } })
    render(<MyDevices detect={async () => null} loadEntries={async () => [hc('sleep'), hc('heart_rate')]} />)
    expect(await screen.findByText(/activez ce partage vers l’app Santé dans Garmin Connect/)).toBeInTheDocument()
    expect(screen.queryByText(/Health Connect/)).not.toBeInTheDocument()
  })

  it('Apple Watch : la mesure s’active dans l’app Watch de l’iPhone, pas « dans Apple Watch »', async () => {
    const at = new Date(Date.now() - 3600 * 1000).toISOString()
    const hc = (type) => ({ source: 'health_connect', at, type, payload: { sourceName: 'Apple Watch de Julie' } })
    render(<MyDevices detect={async () => null} loadEntries={async () => [hc('sleep'), hc('heart_rate')]} />)
    expect(await screen.findByText(/Si votre montre en est capable, activez cette mesure dans l’app Watch de l’iPhone\./)).toBeInTheDocument()
    expect(screen.queryByText(/dans Apple Watch/)).not.toBeInTheDocument()
  })

  // Android v1013 (#934) : « Samsung Health ne partage pas la VFC avec Health Connect » ; sur iPhone, l'app Santé
  it('mesure jamais partagée par l’app source : dit l’app Santé, pas Health Connect', async () => {
    const at = new Date(Date.now() - 3600 * 1000).toISOString()
    const hc = (type) => ({ source: 'health_connect', at, type, payload: { sourceName: 'Samsung Health' } })
    render(<MyDevices detect={async () => null} loadEntries={async () => [hc('sleep'), hc('heart_rate')]} />)
    expect(await screen.findByText(/Samsung Health ne partage pas la variabilité cardiaque avec l’app Santé\./)).toBeInTheDocument()
    expect(screen.queryByText(/Health Connect/)).not.toBeInTheDocument()
  })
})

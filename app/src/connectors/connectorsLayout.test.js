import { describe, it, expect } from 'vitest'
import { splitSourcesByStatus } from './connectorsLayout'

const base = {
  connectorIds: ['health_connect', 'withings'],
  isConnectorEnabled: () => false,
  weatherEnabled: false,
  phoneUsageEnabled: false,
  watchEverConnected: false,
}

describe('splitSourcesByStatus', () => {
  it('premier lancement : rien de branché, tout à brancher dans l’ordre (montre en tête)', () => {
    expect(splitSourcesByStatus(base)).toEqual({
      active: [],
      toConnect: ['watch', 'health_connect', 'withings', 'weather', 'phone', 'ble', 'guides'],
    })
  })

  it('ce qui envoie passe en tête, le reste est à brancher', () => {
    const r = splitSourcesByStatus({
      ...base,
      isConnectorEnabled: (id) => id === 'health_connect',
      weatherEnabled: true,
      watchEverConnected: true,
    })
    expect(r.active).toEqual(['watch', 'health_connect', 'weather'])
    expect(r.toConnect).toEqual(['withings', 'phone', 'ble', 'guides'])
  })

  it('capteurs Bluetooth et guides par marque restent toujours dans « à brancher »', () => {
    const r = splitSourcesByStatus({
      ...base,
      isConnectorEnabled: () => true,
      weatherEnabled: true,
      phoneUsageEnabled: true,
      watchEverConnected: true,
    })
    expect(r.active).toEqual(['watch', 'health_connect', 'withings', 'weather', 'phone'])
    expect(r.toConnect).toEqual(['ble', 'guides'])
  })
})

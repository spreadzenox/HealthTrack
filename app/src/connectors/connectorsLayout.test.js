import { describe, it, expect } from 'vitest'
import { splitSourcesByStatus, visibleConnectorIds } from './connectorsLayout'

const base = {
  connectorIds: ['health_connect', 'withings'],
  isConnectorEnabled: () => false,
  weatherEnabled: false,
  phoneUsageEnabled: false,
  watchEverConnected: false,
}

describe('splitSourcesByStatus', () => {
  it('premier lancement sans montre Huawei : la montre, le Bluetooth et les guides passent derrière « Ajouter une source »', () => {
    expect(splitSourcesByStatus(base)).toEqual({
      active: [],
      nothingSending: true,
      toConnect: ['face', 'health_connect', 'withings', 'weather', 'phone'],
      addable: ['watch', 'ble', 'guides'],
    })
  })

  it('app Huawei Santé installée : la carte de la montre est proposée en tête (POL-8)', () => {
    const r = splitSourcesByStatus({ ...base, watchDetected: true })
    expect(r.toConnect).toEqual(['face', 'watch', 'health_connect', 'withings', 'weather', 'phone'])
    expect(r.addable).toEqual(['ble', 'guides'])
  })

  it('ce qui envoie passe en tête, le reste est à brancher', () => {
    const r = splitSourcesByStatus({
      ...base,
      isConnectorEnabled: (id) => id === 'health_connect',
      weatherEnabled: true,
      watchEverConnected: true,
    })
    expect(r.active).toEqual(['watch', 'health_connect', 'weather'])
    expect(r.toConnect).toEqual(['face', 'withings', 'phone'])
    expect(r.addable).toEqual(['ble', 'guides'])
  })

  it('app Android : la Lecture du visage est toujours en tête, même pas encore activée (signalement du 19/10)', () => {
    const r = splitSourcesByStatus({ ...base, watchEverConnected: true, faceSenseAvailable: true })
    expect(r.active).toEqual(['face', 'watch'])
    expect(r.toConnect).not.toContain('face')
    expect(r.nothingSending).toBe(false)
    expect(splitSourcesByStatus({ ...base, faceSenseAvailable: true }).nothingSending).toBe(true)
    expect(splitSourcesByStatus({ ...base, faceSenseAvailable: true, faceSenseEnabled: true }).nothingSending).toBe(false)
  })

  it('capteurs Bluetooth et guides par marque restent toujours derrière « Ajouter une source »', () => {
    const r = splitSourcesByStatus({
      ...base,
      isConnectorEnabled: () => true,
      weatherEnabled: true,
      phoneUsageEnabled: true,
      watchEverConnected: true,
      faceSenseEnabled: true,
    })
    expect(r.active).toEqual(['face', 'watch', 'health_connect', 'withings', 'weather', 'phone'])
    expect(r.toConnect).toEqual([])
    expect(r.addable).toEqual(['ble', 'guides'])
  })
})

describe('visibleConnectorIds (VC-7)', () => {
  const ids = ['health_connect', 'withings']
  it('sideload : Withings toujours proposé', () => {
    expect(visibleConnectorIds(ids, { withingsApi: true, withingsInUse: false })).toEqual(ids)
  })
  it('play : Withings masqué (Health Connect le lit déjà)…', () => {
    expect(visibleConnectorIds(ids, { withingsApi: false, withingsInUse: false })).toEqual(['health_connect'])
  })
  it('… sauf s’il sert déjà : on ne retire jamais une source branchée', () => {
    expect(visibleConnectorIds(ids, { withingsApi: false, withingsInUse: true })).toEqual(ids)
  })
})

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  HEALTH_APPS,
  matchHealthApp,
  detectInstalledApps,
  summarizeHealthConnectSources,
  adviseDevices,
} from './healthApps'
import { WATCH_GUIDES } from '../data/watchGuides'

const NOW = new Date('2026-10-12T08:00:00Z')
const hc = (sourceName, at, type = 'heart_rate') => ({ source: 'health_connect', at, type, payload: { sourceName } })

describe('HEALTH_APPS', () => {
  it('déclare chaque paquet dans <queries> du manifeste Android (sinon Android 11+ le cache)', () => {
    const manifest = readFileSync(
      resolve(globalThis.process.cwd(), 'android/app/src/main/AndroidManifest.xml'),
      'utf8',
    )
    const queries = manifest.slice(manifest.indexOf('<queries>'), manifest.indexOf('</queries>'))
    for (const app of HEALTH_APPS) {
      for (const pkg of app.packages) expect(queries, pkg).toContain(`<package android:name="${pkg}" />`)
    }
  })

  it('renvoie vers des guides qui existent', () => {
    const ids = new Set(WATCH_GUIDES.map((g) => g.id))
    for (const app of HEALTH_APPS) expect(ids.has(app.guideId), app.id).toBe(true)
  })

  it('a des identifiants et paquets uniques', () => {
    const pkgs = HEALTH_APPS.flatMap((a) => a.packages)
    expect(new Set(pkgs).size).toBe(pkgs.length)
    expect(new Set(HEALTH_APPS.map((a) => a.id)).size).toBe(HEALTH_APPS.length)
  })
})

describe('matchHealthApp', () => {
  it('reconnaît un nom de paquet ou un nom affiché', () => {
    expect(matchHealthApp('nodomain.freeyourgadget.gadgetbridge')?.id).toBe('gadgetbridge')
    expect(matchHealthApp('Gadgetbridge')?.id).toBe('gadgetbridge')
    expect(matchHealthApp('Samsung Health')?.id).toBe('samsung_health')
    expect(matchHealthApp('Santé Honor')).toBe(null)
  })

  it('préfère le nom le plus long (Zepp Life ≠ Zepp)', () => {
    expect(matchHealthApp('Zepp Life')?.id).toBe('zepp_life')
    expect(matchHealthApp('Zepp')?.id).toBe('zepp')
  })

  it('renvoie null pour une source vide ou inconnue', () => {
    expect(matchHealthApp('')).toBe(null)
    expect(matchHealthApp(undefined)).toBe(null)
    expect(matchHealthApp('com.example.inconnu')).toBe(null)
  })
})

describe('detectInstalledApps', () => {
  it('garde les apps installées avec le paquet trouvé (variante nightly comprise)', async () => {
    const installed = new Set(['com.huawei.health', 'nodomain.freeyourgadget.gadgetbridge.nightly'])
    const apps = await detectInstalledApps(async (pkg) => installed.has(pkg))
    expect(apps.map((a) => [a.id, a.package])).toEqual([
      ['huawei_health', 'com.huawei.health'],
      ['gadgetbridge', 'nodomain.freeyourgadget.gadgetbridge.nightly'],
    ])
  })

  it('traite une erreur du pont natif comme « non installé »', async () => {
    const apps = await detectInstalledApps(async () => {
      throw new Error('not implemented on web')
    })
    expect(apps).toEqual([])
  })
})

describe('summarizeHealthConnectSources', () => {
  it('regroupe par app, garde la dernière date et les types', () => {
    const s = summarizeHealthConnectSources([
      hc('Gadgetbridge', '2026-10-11T07:00:00Z'),
      hc('nodomain.freeyourgadget.gadgetbridge', '2026-10-12T04:00:00Z', 'sleep'),
      hc('com.example.balance', '2026-10-01T07:00:00Z', 'weight'),
      { source: 'withings', at: '2026-10-12T07:00:00Z', type: 'weight', payload: {} },
      { source: 'health_connect', at: '2026-10-12T07:00:00Z', type: 'steps', payload: {} },
    ])
    expect(s).toHaveLength(2)
    expect(s[0]).toMatchObject({ name: 'Gadgetbridge', lastAt: '2026-10-12T04:00:00Z', count: 2, types: ['heart_rate', 'sleep'] })
    expect(s[0].app.id).toBe('gadgetbridge')
    expect(s[1]).toMatchObject({ name: 'com.example.balance', app: null, count: 1 })
  })
})

describe('adviseDevices', () => {
  const app = (id, pkg) => ({ ...HEALTH_APPS.find((a) => a.id === id), package: pkg ?? HEALTH_APPS.find((a) => a.id === id).packages[0] })
  const src = (name, lastAt) => summarizeHealthConnectSources([hc(name, lastAt)])[0]

  it('Huawei Health seul : à brancher via Gadgetbridge, guide Huawei', () => {
    const [row] = adviseDevices({ installed: [app('huawei_health')], sources: [], now: NOW })
    expect(row).toMatchObject({ id: 'huawei_health', status: 'action', guideId: 'huawei' })
    expect(row.message).toMatch(/Gadgetbridge/)
  })

  it('Huawei Health + Gadgetbridge sans données : activer Health Connect dans Gadgetbridge', () => {
    const rows = adviseDevices({ installed: [app('huawei_health'), app('gadgetbridge')], sources: [], now: NOW })
    expect(rows.map((r) => r.status)).toEqual(['action', 'action'])
    expect(rows[0].message).toMatch(/Gadgetbridge est installé/)
    expect(rows[1].message).toMatch(/Intégrations externes/)
  })

  it('Gadgetbridge qui envoie : Huawei « via Gadgetbridge », Gadgetbridge OK', () => {
    const rows = adviseDevices({
      installed: [app('huawei_health'), app('gadgetbridge')],
      sources: [src('Gadgetbridge', '2026-10-12T04:00:00Z')],
      now: NOW,
    })
    expect(rows.map((r) => [r.id, r.status])).toEqual([
      ['gadgetbridge', 'ok'],
      ['huawei_health', 'bridged'],
    ])
  })

  it('passerelle qui envoie sans avoir été détectée : Huawei quand même relayé', () => {
    const rows = adviseDevices({ installed: [app('huawei_health')], sources: [src('Gadgetbridge', '2026-10-12T04:00:00Z')], now: NOW })
    expect(rows.map((r) => [r.id, r.status])).toEqual([
      ['gadgetbridge', 'ok'],
      ['huawei_health', 'bridged'],
    ])
  })

  it('source ancienne : « stale » ; source inconnue non installée : affichée quand même', () => {
    const rows = adviseDevices({
      installed: [app('samsung_health')],
      sources: [src('Samsung Health', '2026-10-01T04:00:00Z'), src('Balance XYZ', '2026-10-12T06:00:00Z')],
      now: NOW,
    })
    expect(rows.map((r) => [r.name, r.status])).toEqual([
      ['Samsung Health', 'stale'],
      ['Balance XYZ', 'ok'],
    ])
  })

  it('app qui écrit dans Health Connect mais rien reçu : rappelle où l’activer', () => {
    const [row] = adviseDevices({ installed: [app('garmin')], sources: [], now: NOW })
    expect(row.status).toBe('action')
    expect(row.message).toMatch(/Garmin Connect → .*Health Connect/)
  })

  it('rien de détecté : liste vide', () => {
    expect(adviseDevices({ installed: [], sources: [], now: NOW })).toEqual([])
  })
})

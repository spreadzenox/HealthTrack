import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  describeFaceSense,
  faceDiagnosticReport,
  faceDiagnosticLines,
  getFaceSenseStatus,
  startFaceSense,
  stopFaceSense,
  isFaceSenseEnabled,
  outcomeLabel,
} from './faceSense'

const active = {
  models: true,
  enabled: true,
  permission: true,
  running: true,
  batteryExempt: false,
  dayUnlocks: 12,
  dayBursts: 9,
  dayFaces: 7,
  timed: 4,
  sumCameraMs: 4000,
  sumInferenceMs: 400,
  lastOutcome: 'face',
  lastTrigger: 'unlock',
  lastOutcomeAt: Date.UTC(2026, 9, 18, 20, 0),
  outcomes: { face: 7, 'skip:too_soon': 3, 'camera:camera_busy': 1 },
  rejected: { no_face: 2, too_dark: 5 },
  startBattery: 80,
  battery: 74,
  manufacturer: 'samsung',
  model: 'SM-A566B',
  release: '16',
  sdk: 36,
  pending: 9,
}

describe('describeFaceSense', () => {
  it('suit l’état du service', () => {
    expect(describeFaceSense(null).state).toBe('unavailable')
    expect(describeFaceSense({ models: false, enabled: true }).state).toBe('no_models')
    expect(describeFaceSense({ ...active, enabled: false }).state).toBe('off')
    expect(describeFaceSense({ ...active, permission: false })).toMatchObject({ state: 'denied', badge: 'À autoriser' })
    expect(describeFaceSense({ ...active, running: false })).toMatchObject({ state: 'stopped', badge: 'Arrêtée' })
  })

  it('active : des comptes, jamais un indice', () => {
    const d = describeFaceSense({ ...active, values: { smile: 0.8 } })
    expect(d).toMatchObject({ state: 'active', badge: 'Active' })
    expect(d.lines[0]).toBe('Aujourd’hui : 12 déverrouillages, 9 lectures, visage lu 7 fois.')
    expect(JSON.stringify(d)).not.toMatch(/smile|0\.8/)
    expect(describeFaceSense({ ...active, dayUnlocks: 0 }).lines[0]).toMatch(/prochain/)
    expect(describeFaceSense({ ...active, dayUnlocks: 1, dayBursts: 1, dayFaces: 0 }).lines[0])
      .toBe('Aujourd’hui : 1 déverrouillage, 1 lecture, visage lu 0 fois.')
  })
})

describe('diagnostic exportable', () => {
  it('appareil, compteurs, temps moyens ; aucun score', () => {
    const r = faceDiagnosticReport({ ...active, values: { smile: 0.8 } }, { appVersion: 168, now: new Date(Date.UTC(2026, 9, 18, 21)) })
    expect(r.kind).toBe('healthtrack-face-diagnostic')
    expect(r.device).toEqual({ manufacturer: 'samsung', model: 'SM-A566B', android: '16', sdk: 36 })
    expect(r.today).toEqual({ unlocks: 12, bursts: 9, faces: 7 })
    expect(r.timing).toMatchObject({ cameraMsAvg: 1000, inferenceMsAvg: 100, bursts: 4 })
    expect(r.last.at).toBe('2026-10-18T20:00:00.000Z')
    expect(JSON.stringify(r)).not.toMatch(/smile/)
  })

  it('lignes lisibles', () => {
    const lines = faceDiagnosticLines(active)
    expect(lines[0]).toBe('Service : actif · caméra autorisée · batterie optimisée par Android')
    expect(lines).toContain('Dernière lecture : visage lu')
    expect(lines).toContain('Temps moyen : caméra 1000 ms, analyse 100 ms (4 lectures)')
    expect(lines).toContain('Images écartées : trop sombre 5, pas de visage 2')
    expect(lines).toContain('Autres résultats : sautée (déverrouillage trop rapproché) 3, caméra occupée par une autre app 1')
    expect(lines).toContain('Batterie : 80 % au démarrage, 74 % maintenant (tout le téléphone)')
    expect(faceDiagnosticLines({ ...active, lastTrigger: 'manual' })).toContain('Dernière lecture : visage lu (test)')
  })

  it('historique (I90) : comptes des lectures rangées et du dernier rangement, jamais une valeur', () => {
    const history = { stored: 42, forMood: 30, firstAt: '2026-10-19T06:00:00.000Z' }
    const lastImport = { at: '2026-10-19T08:00:00.000Z', imported: 5, dropped: 1, kept: 0 }
    const r = faceDiagnosticReport(active, { history, lastImport })
    expect(r.history).toEqual({ stored: 42, forMood: 30, firstAt: '2026-10-19T06:00:00.000Z', lastImportAt: '2026-10-19T08:00:00.000Z', lastImport: { imported: 5, dropped: 1, kept: 0 } })
    const lines = faceDiagnosticLines({ ...active, pending: 0 }, { history, lastImport })
    expect(lines).toContain('Historique : 42 lectures rangées, dont 30 au déverrouillage avec un visage (comptent pour l’humeur)')
    expect(lines).toContain('Lectures illisibles écartées au dernier rangement : 1')
    expect(lines.some((l) => l.startsWith('En attente'))).toBe(false)
    expect(faceDiagnosticLines(active)).toContain('En attente d’être rangées : 9')
    expect(faceDiagnosticReport(active).history.stored).toBeNull()
  })

  it('résultat inconnu : affiché tel quel', () => {
    expect(outcomeLabel('skip:nouveau')).toBe('skip:nouveau')
    expect(outcomeLabel(null)).toBe('—')
  })
})

describe('interrupteur', () => {
  beforeEach(() => localStorage.clear())

  it('le statut natif met à jour le miroir local', async () => {
    expect(isFaceSenseEnabled()).toBe(false)
    await getFaceSenseStatus({ status: async () => ({ ...active }) })
    expect(isFaceSenseEnabled()).toBe(true)
    await getFaceSenseStatus({ status: async () => ({ ...active, enabled: false }) })
    expect(isFaceSenseEnabled()).toBe(false)
  })

  it('statut : jamais d’exception, null hors de l’app', async () => {
    expect(await getFaceSenseStatus(null)).toBeNull()
    expect(await getFaceSenseStatus({ status: async () => { throw new Error('x') } })).toBeNull()
  })

  it('activer / arrêter', async () => {
    const plugin = { start: vi.fn(async () => ({ started: true, permission: true })), stop: vi.fn(async () => {}) }
    expect(await startFaceSense(plugin)).toEqual({ started: true, permission: true, error: undefined })
    expect(isFaceSenseEnabled()).toBe(true)
    await stopFaceSense(plugin)
    expect(plugin.stop).toHaveBeenCalled()
    expect(isFaceSenseEnabled()).toBe(false)
  })

  it('caméra refusée : pas activée', async () => {
    const res = await startFaceSense({ start: async () => ({ started: false, permission: false }) })
    expect(res).toMatchObject({ started: false, permission: false })
    expect(isFaceSenseEnabled()).toBe(false)
    expect(await startFaceSense(null)).toMatchObject({ started: false, error: 'unavailable' })
  })
})

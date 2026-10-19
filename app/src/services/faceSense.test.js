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
  faceCameraAccess,
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

  it('porte de calibration (I112) : jours comparables et accord, jamais une humeur', () => {
    const gate = { state: 'candidate', nDays: 34, needed: 30, r: 0.21, z: 1.234, openedAt: null, closedAt: null, periods: [], looks: [{}, {}, {}] }
    const r = faceDiagnosticReport(active, { history: { stored: 1, forMood: 1, firstAt: null, gate } })
    expect(r.gate).toEqual({ state: 'candidate', days: 34, needed: 30, z: 1.23, openedAt: null, closedAt: null, looks: 3 })
    expect(JSON.stringify(r.gate)).not.toMatch(/note|score|mood/)
    expect(faceDiagnosticLines(active, { history: { stored: 1, forMood: 1, gate } }))
      .toContain('Vérification visage ↔ notes (facultative) : 34 / 30 jours comparables, accord z = 1.23 (réussie à 3,29 deux semaines de suite)')
    const open = { ...gate, state: 'active', z: 4.5, openedAt: '2026-11-20' }
    expect(faceDiagnosticLines(active, { history: { stored: 1, forMood: 1, gate: open } }))
      .toContain('Vérification visage ↔ notes (facultative) : réussie le 2026-11-20 (z = 4.5)')
    expect(faceDiagnosticReport(active).gate).toBeNull()
  })

  it('lectures par jour et 2e essais (I118) : assez pour la calibration ?', () => {
    const perDay = { days: 7, unlocksPerDay: 41, burstsPerDay: 20, validBurstsPerDay: 9, target: 12, enough: false }
    const s = { ...active, retries: 6, retryFaces: 4 }
    const r = faceDiagnosticReport(s, { history: { stored: 1, forMood: 1, perDay } })
    expect(r.perDay).toEqual(perDay)
    expect(r.retries).toEqual({ tried: 6, faces: 4 })
    const lines = faceDiagnosticLines(s, { history: { stored: 1, forMood: 1, perDay } })
    expect(lines).toContain('Par jour (médiane sur 7 jours) : 41 déverrouillages, 20 lectures, 9 avec un visage — en dessous des 12 visés : l’estimation restera plus incertaine')
    expect(lines).toContain('2e essais (2 s après une lecture sans visage) : 6, visage lu 4 fois')
    const ok = { ...perDay, days: 1, unlocksPerDay: null, validBurstsPerDay: 14, enough: true }
    expect(faceDiagnosticLines(active, { history: { stored: 1, forMood: 1, perDay: ok } }))
      .toContain('Par jour (médiane sur 1 jour) : 20 lectures, 14 avec un visage — objectif de 12 atteint')
    expect(faceDiagnosticReport(active).perDay).toBeNull()
    expect(faceDiagnosticReport(active).retries).toEqual({ tried: 0, faces: 0 })
    expect(faceDiagnosticLines(active).some((l) => l.startsWith('Par jour') || l.startsWith('2e essais'))).toBe(false)
  })

  it('rappels « Reprendre » (I88 ②) : combien, le dernier, ce qu’a décidé la dernière vérification', () => {
    const at = Date.UTC(2026, 9, 19, 6)
    const s = { ...active, running: false, resumeNotices: 2, resumeNoticeAt: at, resumeTaps: 1, resumeCheck: 'recent', resumeCheckAt: at, resumeCheckTrigger: 'periodic' }
    const r = faceDiagnosticReport(s)
    expect(r.resume).toEqual({ notices: 2, lastNoticeAt: new Date(at).toISOString(), taps: 1, lastCheck: 'recent', lastCheckAt: new Date(at).toISOString(), lastCheckTrigger: 'periodic' })
    expect(faceDiagnosticLines(s)).toContain('Notifications « Reprendre » : 2, reprise d’un geste 1 fois ; dernière vérification : déjà prévenu il y a peu (vérification horaire)')
    expect(faceDiagnosticReport(active).resume).toEqual({ notices: 0, lastNoticeAt: null, taps: 0, lastCheck: null, lastCheckAt: null, lastCheckTrigger: null })
    expect(faceDiagnosticLines(active).some((l) => l.startsWith('Notifications'))).toBe(false)
  })

  it('note du soir (I113) : réglages et compteurs, jamais une note', () => {
    const eveningNote = { enabled: true, minuteOfDay: 1290, asked: 4, answers: 3, check: 'noted_today', checkAt: 0, pending: 0 }
    const r = faceDiagnosticReport(active, { eveningNote })
    expect(r.eveningNote).toMatchObject({ enabled: true, time: '21 h 30', asked: 4, answers: 3, lastCheck: 'noted_today' })
    expect(faceDiagnosticReport(active).eveningNote).toBeNull()
    expect(faceDiagnosticLines(active, { eveningNote }))
      .toContain('Note du soir : vers 21 h 30, demandée 4 fois, donnée d’un geste 3 fois ; dernier soir : déjà notée ce jour-là')
    expect(faceDiagnosticLines(active, { eveningNote: { ...eveningNote, enabled: false } }).join()).not.toMatch(/Note du soir/)
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

describe('repérage du déverrouillage et accès caméra (signalement du 19/10 15:05)', () => {
  const at = (h, m) => new Date(2026, 9, 19, h, m).getTime()
  const attempts = JSON.stringify([
    { at: at(15, 1), trigger: 'manual', source: 'test', outcome: 'face' },
    { at: at(15, 5), trigger: 'unlock', source: 'keyguard', outcome: 'camera:camera_disabled', detail: 'onError:3' },
  ])
  const seen = {
    ...active,
    dayUnlocks: 3,
    dayScreenOns: 5,
    dayPresents: 1,
    dayUnlock_user_present: 1,
    dayUnlock_keyguard: 2,
    lastUnlockAt: at(15, 5),
    lastUnlockSource: 'keyguard',
    lastScreenOnAt: at(15, 4),
    cameraOp: 'foreground',
    startOrigin: 'app',
    startAction: 'START',
    starts: 2,
    attempts,
  }

  it('export : allumages, déverrouillages par source, mode caméra, démarrage, dernières tentatives', () => {
    const r = faceDiagnosticReport(seen, { now: new Date(at(15, 10)) })
    expect(r.version).toBe(2)
    expect(r.detection).toEqual({
      screenOns: 5,
      userPresents: 1,
      unlocks: 3,
      bySource: { user_present: 1, keyguard: 2, screen_on: 0 },
      lastUnlockAt: new Date(at(15, 5)).toISOString(),
      lastUnlockSource: 'keyguard',
      lastScreenOnAt: new Date(at(15, 4)).toISOString(),
    })
    expect(r.camera).toEqual({ op: 'foreground', startOrigin: 'app', startAction: 'START', starts: 2 })
    expect(r.attempts).toHaveLength(2)
    expect(r.attempts[1]).toEqual({
      at: new Date(at(15, 5)).toISOString(), trigger: 'unlock', source: 'keyguard', outcome: 'camera:camera_disabled',
      detail: 'onError:3', retry: false,
    })
  })

  it('journal des tentatives illisible ou absent : liste vide, jamais d’exception', () => {
    expect(faceDiagnosticReport({ ...active, attempts: '{oups' }).attempts).toEqual([])
    expect(faceDiagnosticReport(active).attempts).toEqual([])
    expect(faceDiagnosticReport(null).detection.unlocks).toBe(0)
  })

  it('lignes : allumages et déverrouillages du jour, accès caméra, dernières tentatives avec l’erreur exacte', () => {
    const lines = faceDiagnosticLines(seen).join('\n')
    expect(lines).toContain('Aujourd’hui : écran allumé 5 fois, 3 déverrouillages repérés (écran de verrouillage 1, verrou interrogé 2), le dernier à 15:05')
    expect(lines).toContain('Accès caméra : seulement quand l’app est utilisée (réglage Android) · service démarré depuis l’app ouverte')
    expect(lines).toContain('Dernières tentatives : 15:05 déverrouillage (verrou interrogé) → caméra coupée (accès caméra désactivé dans Android ?) [onError:3] ; 15:01 test → visage lu')
  })

  it('écran allumé mais aucun déverrouillage repéré : la carte le dit', () => {
    const d = describeFaceSense({ ...active, dayUnlocks: 0, dayScreenOns: 4 })
    expect(d.lines[0]).toBe('Écran allumé 4 fois aujourd’hui, mais aucun déverrouillage repéré : ouvrez le Diagnostic et envoyez-le.')
  })

  it('caméra refusée en arrière-plan : état « à relancer » ; accès permanent : rien à signaler', () => {
    expect(faceCameraAccess(seen)).toMatchObject({ op: 'foreground', permanent: false, blocked: true })
    const d = describeFaceSense(seen)
    expect(d).toMatchObject({ state: 'blocked', badge: 'À relancer' })
    expect(describeFaceSense({ ...seen, cameraOp: 'allow' }).state).toBe('active')
    expect(faceCameraAccess({ ...seen, cameraOp: 'allow' })).toMatchObject({ permanent: true, blocked: false })
    // démarré hors de l'app ouverte : Android coupera la caméra
    expect(describeFaceSense({ ...active, startOrigin: 'background', cameraOp: 'foreground' }).state).toBe('blocked')
    // une lecture réussie après l'erreur : plus bloqué
    const ok = JSON.stringify([...JSON.parse(attempts), { at: at(15, 9), trigger: 'unlock', source: 'user_present', outcome: 'face' }])
    expect(describeFaceSense({ ...seen, attempts: ok }).state).toBe('active')
  })

  it('relancer depuis l’app ouverte : redémarre le service', async () => {
    const plugin = { start: vi.fn(async () => ({ started: true, permission: true })) }
    await startFaceSense(plugin, { restart: true })
    expect(plugin.start).toHaveBeenCalledWith({ restart: true })
  })
})

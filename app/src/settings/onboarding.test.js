import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  loadOnboarding,
  saveOnboarding,
  finishOnboarding,
  defaultTracks,
  needsOnboarding,
  homeFocus,
  gutCardMode,
  markScreenSeen,
  onboardingDiagnostic,
  shouldShowUnlockReminder,
  dismissUnlockReminder,
  GOALS,
  TRACKS,
} from './onboarding'

describe('settings/onboarding', () => {
  beforeEach(() => localStorage.clear())

  it('état par défaut : pas fait, rien choisi, premier écran', () => {
    expect(loadOnboarding()).toMatchObject({ done: false, goal: null, tracks: null, watch: null, step: 0, maxStep: 0 })
  })

  it('garde l’objectif, les suivis et l’écran atteint (pour reprendre là où on s’est arrêté)', () => {
    saveOnboarding({ goal: 'gut', step: 1 })
    saveOnboarding({ tracks: ['gut', 'meals'] })
    expect(loadOnboarding()).toMatchObject({ goal: 'gut', tracks: ['gut', 'meals'], step: 1, maxStep: 1 })
  })

  it('homeFocus : « énergie » seulement pour l’objectif énergie, sinon l’ordre ventre de la maquette', () => {
    expect(homeFocus()).toBe('gut')
    saveOnboarding({ goal: 'energy' })
    expect(homeFocus()).toBe('energy')
    expect(homeFocus('all')).toBe('gut')
    expect(homeFocus('gut')).toBe('gut')
  })

  it('gutCardMode : carte ventre seulement avec « Mon ventre » ; sans objectif, selon l’installation (POL-4)', () => {
    expect(gutCardMode()).toBe('show')
    saveOnboarding({ goal: 'gut' })
    expect(gutCardMode()).toBe('show')
    expect(gutCardMode({ goal: 'energy' })).toBe('hide')
    expect(gutCardMode({ goal: 'all' })).toBe('hide')
    expect(gutCardMode({ goal: null, endedBy: 'existing' })).toBe('used')
    expect(gutCardMode({ goal: null, endedBy: 'skipped' })).toBe('show')
  })

  it('maxStep ne recule jamais (écran le plus loin atteint, pour le diagnostic)', () => {
    saveOnboarding({ step: 2 })
    saveOnboarding({ step: 0 })
    expect(loadOnboarding()).toMatchObject({ step: 0, maxStep: 2 })
  })

  it('ignore une valeur illisible', () => {
    localStorage.setItem('healthtrack_onboarding', '{pas du json')
    expect(loadOnboarding().done).toBe(false)
  })

  it('finishOnboarding note la fin et comment (terminé, passé, utilisateur existant)', () => {
    finishOnboarding('skipped')
    const s = loadOnboarding()
    expect(s.done).toBe(true)
    expect(s.endedBy).toBe('skipped')
    expect(typeof s.doneAt).toBe('string')
  })

  it('suivis cochés d’avance selon l’objectif ; chaque suivi existe', () => {
    const ids = TRACKS.map((t) => t.id)
    for (const g of GOALS) {
      const tracks = defaultTracks(g.id)
      expect(tracks.length).toBeGreaterThan(0)
      for (const t of tracks) expect(ids).toContain(t)
    }
    expect(defaultTracks('gut')).toEqual(expect.arrayContaining(['gut', 'meals']))
    expect(defaultTracks('energy')).toEqual(expect.arrayContaining(['sleep', 'wellbeing']))
    expect(defaultTracks('all')).toEqual(ids)
  })

  describe('needsOnboarding', () => {
    it('installation vierge (aucune entrée) → oui', async () => {
      expect(await needsOnboarding({ countEntries: async () => 0 })).toBe(true)
    })

    it('utilisateur existant (des entrées) → non, et ne sera plus jamais montré', async () => {
      expect(await needsOnboarding({ countEntries: async () => 12 })).toBe(false)
      expect(loadOnboarding()).toMatchObject({ done: true, endedBy: 'existing' })
      const count = vi.fn(async () => 0)
      expect(await needsOnboarding({ countEntries: count })).toBe(false)
      expect(count).not.toHaveBeenCalled()
    })

    it('commencé puis interrompu après l’import ou le premier geste → on reprend, sans lire la base', async () => {
      saveOnboarding({ goal: 'gut', step: 4 })
      const count = vi.fn(async () => 120)
      expect(await needsOnboarding({ countEntries: count })).toBe(true)
      expect(count).not.toHaveBeenCalled()
      expect(loadOnboarding().done).toBe(false)
    })

    it('déjà fait → non, sans lire la base', async () => {
      finishOnboarding('completed')
      const count = vi.fn(async () => 0)
      expect(await needsOnboarding({ countEntries: count })).toBe(false)
      expect(count).not.toHaveBeenCalled()
    })

    it('base illisible → non (on ne montre jamais l’onboarding par erreur)', async () => {
      expect(
        await needsOnboarding({
          countEntries: async () => {
            throw new Error('indexedDB indisponible')
          },
        }),
      ).toBe(false)
      expect(loadOnboarding().done).toBe(false)
    })
  })

  describe('diagnostic local (I156)', () => {
    it('vide par défaut', () => {
      expect(onboardingDiagnostic()).toMatchObject({ done: false, step: 0, maxStep: 0, seen: [], lastScreen: null, screens: null })
    })

    it('note chaque écran une seule fois, dans l’ordre, et le dernier montré', () => {
      markScreenSeen('goal', 6)
      markScreenSeen('tracks', 6)
      markScreenSeen('goal', 6)
      const d = onboardingDiagnostic()
      expect(d.seen).toEqual(['goal', 'tracks'])
      expect(d.lastScreen).toBe('goal')
      expect(d.screens).toBe(6)
    })

    it('reprend les choix et la fin, sans rien d’autre que des identifiants', () => {
      saveOnboarding({ goal: 'gut', watch: 'none', tracks: ['gut'], step: 2 })
      finishOnboarding('skipped')
      const d = onboardingDiagnostic()
      expect(d).toMatchObject({ done: true, endedBy: 'skipped', goal: 'gut', watch: 'none', step: 2, maxStep: 2 })
      expect(Object.keys(d).sort()).toEqual(
        ['done', 'doneAt', 'endedBy', 'face', 'goal', 'health', 'lastScreen', 'maxStep', 'screens', 'seen', 'step', 'unlockLater', 'unlockReminderDone', 'watch'],
      )
    })
  })

  describe('rappel de la lecture au déverrouillage (POL-PLAY-84)', () => {
    const doneAt = new Date(2026, 9, 20, 9).toISOString()
    const off = { state: 'off' }
    const later = (days) => new Date(new Date(doneAt).getTime() + days * 86_400_000)

    it('après « Plus tard » sur l’écran mis en avant, 2 jours après la fin, tant que c’est coupé', () => {
      saveOnboarding({ done: true, doneAt, face: 'later', unlockLater: true })
      expect(shouldShowUnlockReminder(loadOnboarding(), off, later(1))).toBe(false)
      expect(shouldShowUnlockReminder(loadOnboarding(), off, later(2))).toBe(true)
      expect(shouldShowUnlockReminder(loadOnboarding(), { state: 'on' }, later(3))).toBe(false)
      expect(shouldShowUnlockReminder(loadOnboarding(), { state: 'paused' }, later(3))).toBe(false)
      // version sans lecture au déverrouillage (sideload, play sans l'interrupteur)
      expect(shouldShowUnlockReminder(loadOnboarding(), null, later(3))).toBe(false)
    })

    it('jamais après un refus dans la divulgation, ni sans onboarding fini', () => {
      saveOnboarding({ done: true, doneAt, face: 'later' })
      expect(shouldShowUnlockReminder(loadOnboarding(), off, later(5))).toBe(false)
      localStorage.clear()
      saveOnboarding({ unlockLater: true })
      expect(shouldShowUnlockReminder(loadOnboarding(), off, later(5))).toBe(false)
    })

    it('une seule fois : fermé, il ne revient plus', () => {
      saveOnboarding({ done: true, doneAt, unlockLater: true })
      dismissUnlockReminder()
      expect(shouldShowUnlockReminder(loadOnboarding(), off, later(10))).toBe(false)
      expect(onboardingDiagnostic()).toMatchObject({ unlockLater: true, unlockReminderDone: true })
    })
  })
})

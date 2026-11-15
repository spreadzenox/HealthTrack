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
  RETIRED_GOALS,
  gutAsked,
  TRACKS,
  goalsOf,
  handNotes,
  migrateGoals,
  ensureGoalsMigrated,
  wantsGut,
  OBJECTIVES,
  GOALS_VERSION,
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

  it('homeFocus : « énergie » avec stress et sommeil sans ventre, sinon l’ordre ventre ; ancien goal lu', () => {
    expect(homeFocus()).toBe('gut')
    saveOnboarding({ goal: 'energy' })
    expect(homeFocus()).toBe('energy')
    expect(homeFocus(['stress', 'sport'])).toBe('energy')
    expect(homeFocus(['stress', 'cycle'])).toBe('gut')
    expect(homeFocus('all')).toBe('gut')
  })

  it('gutCardMode : carte ventre avec « Ma digestion » ou « Mon cycle » ; sans objectif, selon l’installation (ACC-3)', () => {
    expect(gutCardMode()).toBe('used')
    saveOnboarding({ goals: ['cycle'] })
    expect(gutCardMode()).toBe('show')
    expect(gutCardMode({ goals: ['gut', 'sport'] })).toBe('show')
    expect(gutCardMode({ goals: ['stress'] })).toBe('hide')
    expect(gutCardMode({ goals: ['all'] })).toBe('hide')
    expect(gutCardMode({ goals: [], endedBy: 'existing' })).toBe('used')
    // refonte étape 1 : accueil passé sans choisir → on ne demande plus le ventre
    expect(gutCardMode({ goals: [], endedBy: 'skipped' })).toBe('used')
    expect(gutCardMode({ goals: ['sport'] })).toBe('hide')
    // ancien format (un seul objectif)
    expect(gutCardMode({ goal: 'gut' })).toBe('show')
    expect(gutCardMode({ goal: 'energy' })).toBe('hide')
    expect(gutCardMode({ goal: null, endedBy: 'existing' })).toBe('used')
  })

  it('goalsOf : migration de l’ancien goal (gut, energy, all) ; goals prime ; ids inconnus ignorés', () => {
    expect(goalsOf({ goal: 'gut' })).toEqual(['gut'])
    expect(goalsOf({ goal: 'energy' })).toEqual(['stress'])
    expect(goalsOf({ goal: 'all' })).toEqual(['all'])
    expect(goalsOf({ goal: null })).toEqual([])
    expect(goalsOf({ goal: 'gut', goals: ['sport', 'x'] })).toEqual(['sport'])
    // refonte étape 1 : « Mon cycle » et « Mon sport » ne sont plus proposés, mais restent lus (anciens réglages)
    expect(GOALS.map((g) => g.id)).toEqual(['gut', 'stress', 'care', 'all'])
    expect(RETIRED_GOALS).toEqual(['cycle', 'sport'])
    expect(goalsOf({ goals: ['cycle', 'gut', 'sport'] })).toEqual(['cycle', 'gut', 'sport'])
  })

  it('gutAsked : le ventre n’est demandé qu’avec l’objectif digestion, ou à qui le note déjà (refonte étape 1)', () => {
    const now = Date.parse('2026-11-15T12:00:00Z')
    const gut = (daysAgo) => ({ type: 'gut', at: new Date(now - daysAgo * 86_400_000).toISOString() })
    expect(gutAsked('show', [], now)).toBe(true)
    expect(gutAsked('hide', [gut(0)], now)).toBe(false)
    expect(gutAsked('used', [], now)).toBe(false)
    expect(gutAsked('used', [{ type: 'food', at: new Date(now).toISOString() }], now)).toBe(false)
    expect(gutAsked('used', [gut(8)], now)).toBe(false)
    expect(gutAsked('used', [gut(6)], now)).toBe(true)
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

  it('suivis déduits des objectifs (le champ reste enregistré pour les anciens fichiers)', () => {
    const ids = TRACKS.map((t) => t.id)
    for (const g of GOALS) {
      const tracks = defaultTracks([g.id])
      expect(tracks.length).toBeGreaterThan(0)
      for (const t of tracks) expect(ids).toContain(t)
    }
    expect(defaultTracks(['gut'])).toEqual(expect.arrayContaining(['gut', 'meals']))
    expect(defaultTracks(['stress'])).toEqual(expect.arrayContaining(['sleep', 'wellbeing']))
    expect(defaultTracks(['all'])).toEqual(ids)
    expect(defaultTracks([])).toEqual(ids)
    expect(defaultTracks('energy')).toEqual(expect.arrayContaining(['sleep', 'wellbeing']))
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
      expect(d).toMatchObject({ done: true, endedBy: 'skipped', goal: 'gut', goals: ['wellbeing', 'gut'], goalsBefore: ['gut'], watch: 'none', step: 2, maxStep: 2 })
      expect(Object.keys(d).sort()).toEqual(
        ['done', 'doneAt', 'endedBy', 'face', 'goal', 'goals', 'goalsBefore', 'health', 'huawei', 'lastScreen', 'maxStep', 'screen', 'screens', 'seen', 'step', 'unlockLater', 'unlockReminderDone', 'watch', 'weather'],
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

describe('handNotes (POLISH-SIM-51) : ce que l’on note sans source, selon l’objectif', () => {
  it('sans objectif ou « Tout mesurer » : bien-être et repas en photo, pas la digestion (refonte étape 1)', () => {
    expect(handNotes([])).toEqual(['bien-être', 'repas en photo'])
    expect(handNotes(['all'])).toEqual(['bien-être', 'repas en photo'])
    expect(handNotes(['gut'])).toEqual(['bien-être', 'digestion', 'repas en photo'])
  })
  it('« Prendre soin de moi » : le poids, pas la digestion', () => {
    expect(handNotes(['care'])).toEqual(['bien-être', 'repas en photo', 'poids'])
  })
  it('« Mon cycle » : digestion et règles', () => {
    expect(handNotes(['cycle'])).toEqual(['bien-être', 'digestion', 'règles', 'repas en photo'])
  })
  it('« Mon stress et mon sommeil » : ni digestion ni poids', () => {
    expect(handNotes(['stress'])).toEqual(['bien-être', 'repas en photo'])
  })
})

describe('migration des objectifs (refonte étape 5a) : bien-être toujours, confort digestif facultatif', () => {
  beforeEach(() => localStorage.clear())
  const day = 86_400_000
  const now = Date.parse('2026-11-15T10:00:00Z')
  const gutNote = (ago) => ({ type: 'gut', at: new Date(now - ago).toISOString() })

  it('les deux objectifs de la refonte : Bien-être (verrouillé) et Confort digestif', () => {
    expect(OBJECTIVES.map((o) => [o.id, o.label, !!o.locked])).toEqual([
      ['wellbeing', 'Bien-être', true],
      ['gut', 'Confort digestif', false],
    ])
  })

  it.each([
    [{ goals: ['gut'] }, ['wellbeing', 'gut']],
    [{ goals: ['gut', 'stress', 'all'] }, ['wellbeing', 'gut']],
    [{ goals: ['stress'] }, ['wellbeing']],
    [{ goals: ['care', 'all'] }, ['wellbeing']],
    [{ goals: ['sport'] }, ['wellbeing']],
    [{ goal: 'gut' }, ['wellbeing', 'gut']],
    [{ goal: 'energy' }, ['wellbeing']],
    [{ goal: 'all' }, ['wellbeing']],
  ])('%j devient %j', (before, after) => {
    const next = migrateGoals({ done: true, ...before })
    expect(next.goals).toEqual(after)
    expect(next.goalsVersion).toBe(GOALS_VERSION)
  })

  it('l’ancien « Mon cycle » garde le ventre et l’affichage du cycle', () => {
    const next = migrateGoals({ done: true, goals: ['cycle', 'sport'] })
    expect(next.goals).toEqual(['wellbeing', 'gut', 'cycle'])
    expect(wantsGut(goalsOf(next))).toBe(true)
  })

  it('sans aucun objectif : le ventre reste seulement à qui l’a noté ces 7 derniers jours', () => {
    expect(migrateGoals({ done: true }, true).goals).toEqual(['wellbeing', 'gut'])
    expect(migrateGoals({ done: true }, false).goals).toEqual(['wellbeing'])
    expect(migrateGoals({ done: true, goals: [] }, true).goals).toEqual(['wellbeing', 'gut'])
    // une note récente n’ajoute pas le ventre à qui avait choisi autre chose
    expect(migrateGoals({ done: true, goals: ['stress'] }, true).goals).toEqual(['wellbeing'])
  })

  it('garde les anciens choix (goalsBefore) et ne touche à rien d’autre', () => {
    const s = { done: true, goals: ['care', 'sport'], goal: 'all', watch: 'huawei', step: 4, tour: 'done' }
    const next = migrateGoals(s)
    expect(next).toMatchObject({ done: true, goal: 'all', watch: 'huawei', step: 4, tour: 'done' })
    expect(next.goalsBefore).toEqual(['care', 'sport'])
    expect(s.goals).toEqual(['care', 'sport'])
  })

  it('idempotente : une seconde passe ne change rien, même si une note du ventre est apparue', () => {
    const once = migrateGoals({ done: true, goals: ['stress'] })
    expect(migrateGoals(once, true)).toEqual(once)
  })

  it('après la migration, le ventre est montré ou caché, jamais « selon l’usage »', () => {
    expect(gutCardMode(migrateGoals({ done: true }, false))).toBe('hide')
    expect(gutCardMode(migrateGoals({ done: true }, true))).toBe('show')
    expect(gutCardMode({ done: true })).toBe('used')
  })

  describe('ensureGoalsMigrated (au démarrage)', () => {
    it('ne fait rien tant que l’accueil n’est pas fini', async () => {
      saveOnboarding({ goals: ['gut'], step: 2 })
      const list = vi.fn()
      await ensureGoalsMigrated({ list, now })
      expect(loadOnboarding().goalsVersion).toBeUndefined()
      expect(list).not.toHaveBeenCalled()
    })

    it('migre sans lire la base quand un objectif était choisi', async () => {
      saveOnboarding({ done: true, goals: ['gut', 'care'] })
      const list = vi.fn()
      await ensureGoalsMigrated({ list, now })
      expect(loadOnboarding()).toMatchObject({ goals: ['wellbeing', 'gut'], goalsBefore: ['gut', 'care'] })
      expect(list).not.toHaveBeenCalled()
    })

    it('sans objectif : lit les notes du ventre, 7 jours comptent, 8 non', async () => {
      saveOnboarding({ done: true })
      await ensureGoalsMigrated({ list: async () => [gutNote(6 * day)], now })
      expect(loadOnboarding().goals).toEqual(['wellbeing', 'gut'])
      localStorage.clear()
      saveOnboarding({ done: true })
      await ensureGoalsMigrated({ list: async () => [gutNote(8 * day)], now })
      expect(loadOnboarding().goals).toEqual(['wellbeing'])
    })

    it('base illisible : rien n’est figé, la migration réessaiera', async () => {
      saveOnboarding({ done: true })
      await ensureGoalsMigrated({ list: async () => { throw new Error('idb') }, now })
      expect(loadOnboarding().goalsVersion).toBeUndefined()
      expect(gutCardMode()).toBe('used')
    })

    it('une seule fois : un choix fait ensuite dans Réglages n’est pas écrasé', async () => {
      saveOnboarding({ done: true, goals: ['gut'] })
      await ensureGoalsMigrated({ now })
      saveOnboarding({ goals: ['wellbeing'] })
      await ensureGoalsMigrated({ list: async () => [gutNote(day)], now })
      expect(loadOnboarding().goals).toEqual(['wellbeing'])
    })
  })

  it('finishOnboarding migre les choix d’un accueil terminé ou passé', () => {
    saveOnboarding({ goals: ['stress', 'gut'], step: 3 })
    expect(finishOnboarding('completed')).toMatchObject({ goals: ['wellbeing', 'gut'], goalsBefore: ['stress', 'gut'] })
    localStorage.clear()
    expect(finishOnboarding('skipped').goals).toEqual(['wellbeing'])
  })

  it('utilisateur existant sans accueil : needsOnboarding lance la migration avec ses notes', async () => {
    const list = vi.fn(async () => [gutNote(day)])
    expect(await needsOnboarding({ countEntries: async () => 12, list, now })).toBe(false)
    await vi.waitFor(() => expect(loadOnboarding().goals).toEqual(['wellbeing', 'gut']))
    expect(loadOnboarding().endedBy).toBe('existing')
  })

  it('le diagnostic garde les anciens choix', () => {
    saveOnboarding({ done: true, goals: ['care'] })
    finishOnboarding('completed')
    expect(onboardingDiagnostic()).toMatchObject({ goals: ['wellbeing'], goalsBefore: ['care'] })
  })
})

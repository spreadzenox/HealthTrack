import { describe, it, expect, beforeEach } from 'vitest'
import {
  COMPANION_KEY,
  DEFAULT_NAME,
  ceremonyDue,
  cleanName,
  companionBackup,
  companionName,
  loadCompanion,
  markCeremony,
  markMet,
  needsMeeting,
  openDay,
  restoreCompanion,
  sanitizeCompanionBackup,
  setCompanionName,
  setWatch,
  wearsWatch,
} from './companionState'

beforeEach(() => localStorage.clear())

describe('nom du compagnon', () => {
  it('« Pilou » tant que personne n’a choisi', () => {
    expect(companionName()).toBe(DEFAULT_NAME)
    expect(DEFAULT_NAME).toBe('Pilou')
  })

  it('le nom choisi est gardé, nettoyé, 20 caractères au plus', () => {
    setCompanionName('  Gaston   le  brave ')
    expect(companionName()).toBe('Gaston le brave')
    expect(cleanName('a'.repeat(40))).toHaveLength(20)
    expect(cleanName('   ')).toBeNull()
    expect(cleanName('Zoé\u0007')).toBe('Zoé')
    expect(cleanName(42)).toBeNull()
  })

  it('un nom vide ne remplace pas le nom choisi', () => {
    setCompanionName('Bulle')
    setCompanionName('  ')
    expect(companionName()).toBe('Bulle')
  })

  it('une valeur abîmée dans le stockage ne casse rien', () => {
    localStorage.setItem(COMPANION_KEY, '{oups')
    expect(companionName()).toBe('Pilou')
    localStorage.setItem(COMPANION_KEY, '[1,2]')
    expect(loadCompanion().metAt).toBeNull()
  })
})

describe('la rencontre, une seule fois (rétrocompatibilité)', () => {
  it('installation d’avant la refonte (accueil fini, aucune clé compagnon) : il le rencontre une fois', () => {
    const before = { done: true, endedBy: 'existing', goals: ['gut'] }
    expect(needsMeeting(before)).toBe(true)
    markMet('update', { name: 'Pilou' })
    expect(needsMeeting(before)).toBe(false)
    expect(loadCompanion().metBy).toBe('update')
  })

  it('installation neuve : pas de rencontre hors de l’onboarding tant que l’accueil n’est pas fini', () => {
    expect(needsMeeting({ done: false })).toBe(false)
    markMet('onboarding', { name: 'Noisette' })
    expect(needsMeeting({ done: true })).toBe(false)
    expect(companionName()).toBe('Noisette')
  })
})

describe('montre', () => {
  it('il garde sa montre, sauf « Non » à l’onboarding', () => {
    expect(wearsWatch()).toBe(true)
    setWatch(false)
    expect(wearsWatch()).toBe(false)
    setWatch(true)
    expect(wearsWatch()).toBe(true)
  })
})

describe('cérémonie du jour 7', () => {
  it('due au premier score, après la rencontre, une seule fois', () => {
    expect(ceremonyDue(true)).toBe(false)
    markMet('onboarding')
    expect(ceremonyDue(false)).toBe(false)
    expect(ceremonyDue(true)).toBe(true)
    markCeremony('shown')
    expect(ceremonyDue(true)).toBe(false)
  })
})

describe('Bon retour', () => {
  it('compte les jours entiers sans ouverture, sans rien d’autre', () => {
    expect(openDay('2026-11-16')).toBe(0)
    expect(openDay('2026-11-16')).toBe(0)
    expect(openDay('2026-11-17')).toBe(0)
    expect(openDay('2026-11-19')).toBe(1)
    expect(openDay('2026-11-25')).toBe(5)
    // horloge remise en arrière : rien
    expect(openDay('2026-11-20')).toBe(0)
  })
})

describe('sauvegarde', () => {
  it('rien dans l’export sans nom ni rencontre', () => {
    expect(companionBackup()).toBeNull()
  })

  it('le nom et les moments vécus suivent l’export', () => {
    markMet('onboarding', { name: 'Câlin' })
    markCeremony()
    setWatch(false)
    const b = companionBackup()
    expect(b).toMatchObject({ name: 'Câlin', watch: false })
    expect(typeof b.metAt).toBe('string')
    expect(typeof b.ceremony7At).toBe('string')
  })

  it('ancien fichier ou bloc illisible : rien n’est touché', () => {
    expect(sanitizeCompanionBackup(undefined)).toBeNull()
    expect(sanitizeCompanionBackup('Pilou')).toBeNull()
    expect(sanitizeCompanionBackup({ metAt: 'pas une date', name: '' })).toBeNull()
    expect(restoreCompanion(undefined)).toBe(false)
    expect(localStorage.getItem(COMPANION_KEY)).toBeNull()
  })

  it('sur un téléphone neuf : le nom revient et la rencontre n’est pas rejouée', () => {
    expect(restoreCompanion({ name: 'Câlin', metAt: '2026-11-16T20:00:00.000Z' })).toBe(true)
    expect(companionName()).toBe('Câlin')
    expect(needsMeeting({ done: true })).toBe(false)
  })

  it('ce qui est vécu sur ce téléphone prime sur le fichier', () => {
    markMet('onboarding', { name: 'Bulle' })
    restoreCompanion({ name: 'Câlin', metAt: '2020-01-01T00:00:00.000Z' })
    expect(companionName()).toBe('Bulle')
    expect(loadCompanion().metBy).toBe('onboarding')
  })
})

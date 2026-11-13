import { describe, it, expect, afterEach } from 'vitest'
import { missingOnIos } from './nativePlugins.js'
import { eveningNotePlugin } from '../services/eveningNote'
import { gutEveningPlugin } from '../services/gutEvening'
import { portionReminderPlugin } from '../services/fodmapReminder'
import { voiceProbePlugin } from '../services/voiceProbe'
import { markerPlugin } from '../services/restoreGuard'
import { vaultPlugin } from '../services/watchVault'
import { companionPlugin } from '../services/watchPresence'
import { capturePlugin } from '../services/watchCaptures'

// Version iOS (HealthTrack-iOS) : un plugin maison d'Android absent côté Swift = pas de plugin pour le service
// (sinon ses réglages s'affichent et ne font rien : interrupteur qui revient, rappel jamais posé)
const ACCESSORS = { eveningNotePlugin, gutEveningPlugin, portionReminderPlugin, voiceProbePlugin, markerPlugin, vaultPlugin, companionPlugin, capturePlugin }
const capacitor = (platform, available) => ({ isNativePlatform: () => true, getPlatform: () => platform, isPluginAvailable: () => available })

afterEach(() => {
  delete window.Capacitor
})

describe('missingOnIos', () => {
  it('vrai seulement dans l’app iPhone sans le plugin', () => {
    expect(missingOnIos('GutEvening', capacitor('ios', false))).toBe(true)
    expect(missingOnIos('GutEvening', capacitor('ios', true))).toBe(false)
    expect(missingOnIos('GutEvening', capacitor('android', false))).toBe(false)
    expect(missingOnIos('GutEvening', undefined)).toBe(false)
  })
})

describe('services à plugin natif', () => {
  it.each(Object.keys(ACCESSORS))('%s : aucun plugin sur iPhone tant que le Swift n’existe pas', (name) => {
    window.Capacitor = capacitor('ios', false)
    expect(ACCESSORS[name]()).toBeNull()
  })

  it.each(Object.keys(ACCESSORS))('%s : le plugin dès qu’il existe sur iPhone, et toujours sur Android', (name) => {
    window.Capacitor = capacitor('ios', true)
    expect(ACCESSORS[name]()).not.toBeNull()
    window.Capacitor = capacitor('android', false)
    expect(ACCESSORS[name]()).not.toBeNull()
  })
})

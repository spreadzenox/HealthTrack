import { describe, it, expect } from 'vitest'
import { ALL_CHANGELOG, PLAY_CHANGELOG_SINCE, changelogFor } from './changelog'

const LOG = [
  { id: '2026-10-25-0100-c', variants: ['sideload'] },
  { id: '2026-10-25-0000-b', variants: ['play'] },
  { id: '2026-10-24-0100-a' },
  { id: '2026-10-20-0100-old' },
]

describe('changelog par variante (VC-5)', () => {
  it('sideload : tout l’historique, sauf les entrées réservées à play', () => {
    expect(changelogFor(LOG, 'sideload').map((e) => e.id)).toEqual(['2026-10-25-0100-c', '2026-10-24-0100-a', '2026-10-20-0100-old'])
  })

  it('play : seulement les entrées play ou communes, à partir de la date de départ', () => {
    expect(changelogFor(LOG, 'play').map((e) => e.id)).toEqual(['2026-10-25-0000-b', '2026-10-24-0100-a'])
  })

  it('play : aucune entrée visible ne parle de HealthTrack, de la clé Gemini ni du bouton de mise à jour', () => {
    const play = changelogFor(ALL_CHANGELOG, 'play')
    expect(play.length).toBeGreaterThan(0)
    for (const e of play) {
      expect(e.id >= PLAY_CHANGELOG_SINCE).toBe(true)
      const text = [e.title, ...(e.items || [])].join(' ')
      expect(text, e.id).not.toMatch(/HealthTrack|Gemini|clé API|mise à jour en un clic|bandeau de mise à jour|APK|GitHub/i)
    }
  })

  it('une note propre à Android (play et sideload) reste visible dans les deux variantes', () => {
    const android = [{ id: '2026-10-27-2133-x', variants: ['play', 'sideload'] }]
    expect(changelogFor(android, 'play')).toHaveLength(1)
    expect(changelogFor(android, 'sideload')).toHaveLength(1)
  })

  it('les notes Android connues sont marquées pour l’app iPhone (barres système, sauvegarde, montre restaurée)', () => {
    for (const id of ['2026-10-27-2133-bord-a-bord', '2026-10-28-0433-montre-restauree', '2026-10-24-1630-sauvegarde-android']) {
      expect(ALL_CHANGELOG.find((e) => e.id === id)?.variants, id).toEqual(['play', 'sideload'])
    }
  })

  it('les notes qui ne valent que pour Android le disent (DEM-IOS-5, DEM-IOS-11)', () => {
    for (const id of ['2026-11-11-1635-noter-objectif', '2026-10-29-0533-paywall-lancement']) {
      expect(ALL_CHANGELOG.find((e) => e.id === id)?.variants, id).toEqual(['play', 'sideload'])
    }
  })

  it('les notes du code partagé valent aussi pour l’iPhone (DEM-IOS-12)', () => {
    for (const id of ['2026-11-07-2150-norme-apres-changement', '2026-11-07-2200-bien-etre-du-jour-ts1']) {
      const e = ALL_CHANGELOG.find((x) => x.id === id)
      expect(e, id).toBeTruthy()
      expect(e.variants, id).toBeUndefined()
    }
  })

  it('une note propre à l’iPhone (appstore) ne s’affiche ni sur play ni en sideload', () => {
    const ios = [{ id: '2026-11-20-0630-x', variants: ['appstore'] }]
    expect(changelogFor(ios, 'play')).toHaveLength(0)
    expect(changelogFor(ios, 'sideload')).toHaveLength(0)
  })

  it('sideload garde l’historique complet d’avant la variante play', () => {
    expect(changelogFor(ALL_CHANGELOG, 'sideload').some((e) => e.id < PLAY_CHANGELOG_SINCE)).toBe(true)
  })
})

describe('notes à la une (REFONTE-UPG-2)', () => {
  it('la note de la nouvelle navigation est à la une, et elle seule', () => {
    expect(ALL_CHANGELOG.filter((e) => e.aLaUne).map((e) => e.id)).toEqual(['2026-11-15-0435-refonte-navigation'])
  })
})

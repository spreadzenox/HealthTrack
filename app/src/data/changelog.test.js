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

  it('sideload garde l’historique complet d’avant la variante play', () => {
    expect(changelogFor(ALL_CHANGELOG, 'sideload').some((e) => e.id < PLAY_CHANGELOG_SINCE)).toBe(true)
  })
})

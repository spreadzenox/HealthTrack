import { describe, it, expect, beforeEach } from 'vitest'
import { restoreSafeArea } from './safeAreaRestore'

const style = () => document.documentElement.style

describe('restoreSafeArea (encarts relus au démarrage, Android ≤ 14)', () => {
  beforeEach(() => {
    for (const side of ['top', 'right', 'bottom', 'left']) style().removeProperty(`--safe-area-inset-${side}`)
  })

  it('pose les encarts connus du natif quand la page les a perdus (rechargement)', async () => {
    const plugin = { getInsets: async () => ({ known: true, top: 49, right: 0, bottom: 24, left: 0 }) }
    expect(await restoreSafeArea(plugin)).toBe(true)
    expect(style().getPropertyValue('--safe-area-inset-top')).toBe('49px')
    expect(style().getPropertyValue('--safe-area-inset-bottom')).toBe('24px')
    expect(style().getPropertyValue('--safe-area-inset-left')).toBe('0px')
  })

  it('ne touche à rien si le natif ne connaît pas encore les encarts (ou Android 15+)', async () => {
    style().setProperty('--safe-area-inset-top', '30px')
    expect(await restoreSafeArea({ getInsets: async () => ({ known: false }) })).toBe(false)
    expect(style().getPropertyValue('--safe-area-inset-top')).toBe('30px')
  })

  it('ancienne version native sans la méthode : aucune erreur', async () => {
    expect(await restoreSafeArea({ getInsets: async () => { throw new Error('not implemented') } })).toBe(false)
    expect(await restoreSafeArea(undefined)).toBe(false)
  })
})

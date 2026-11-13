import { describe, it, expect } from 'vitest'
import { largeTextPlan, LARGE_TEXT_ROUTES, textSizeAdjusted } from './captureMode'

// 3e passage de scripts/ios-captures.sh : taille du texte d'iOS agrandie (`simctl ui content_size`), appliquée par le
// natif (TextSize.swift, police de <html>) avant le premier rendu ; quelques pages de démo, sans sondes
describe('captures en grand texte', () => {
  it('reconnaît la police agrandie posée par le natif sur <html>', () => {
    // Comme dans WebKit : la propriété lue par getPropertyValue (posée par setProperty côté natif)
    const doc = (value) => ({ documentElement: { style: { getPropertyValue: (name) => (name === 'font-size' ? value ?? '' : '') } } })
    expect(textSizeAdjusted(doc('135%'))).toBe(true)
    expect(textSizeAdjusted(doc('100%'))).toBe(false)
    expect(textSizeAdjusted(doc(''))).toBe(false)
    expect(textSizeAdjusted(doc(undefined))).toBe(false)
    expect(textSizeAdjusted({})).toBe(false)
  })

  it('part de l’accueil vierge, puis les pages de démo en clair, sans sonde', () => {
    const plan = largeTextPlan()
    expect(plan[0]).toEqual({ name: 'vierge-onboarding', route: null, data: null, theme: null })
    expect(plan.slice(1).map((s) => s.route)).toEqual(LARGE_TEXT_ROUTES)
    expect(plan.slice(1).every((s) => s.data === 'demo' && s.theme === 'light')).toBe(true)
    expect(plan.map((s) => s.name)).toContain('demo-clair-accueil')
    expect(new Set(plan.map((s) => s.name)).size).toBe(plan.length)
  })
})

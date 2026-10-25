import { describe, it, expect } from 'vitest'
import { feedbackLink } from './feedback'

describe('« Envoyer un avis » (AVIS)', () => {
  it('play : la page Halcya du Play Store (commentaires privés pendant le test, avis ensuite)', () => {
    const link = feedbackLink('play', '271')
    expect(link.url).toBe('https://play.google.com/store/apps/details?id=fr.jpesquet.sante')
    expect(link.label).toBe('Donner mon avis sur le Play Store')
    expect(link.hint).toMatch(/commentaires privés/)
  })

  it('sideload : un ticket GitHub prérempli avec la version, sans aucune donnée de santé', () => {
    const link = feedbackLink('sideload', '271')
    const url = new URL(link.url)
    expect(url.origin + url.pathname).toBe('https://github.com/spreadzenox/HealthTrack/issues/new')
    expect(url.searchParams.get('title')).toBe('Avis — Halcya v271')
    expect([...url.searchParams.keys()]).toEqual(['title'])
  })

  it('variante inconnue : comme la sideload', () => {
    expect(feedbackLink('autre', '1').url).toMatch(/^https:\/\/github\.com\//)
  })
})

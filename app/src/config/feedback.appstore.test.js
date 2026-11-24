import { describe, it, expect } from 'vitest'
import { feedbackLink } from './feedback'

// Sur iPhone, « Votre avis » ouvre un ticket du dépôt unique (l'ancien dépôt de l'iPhone ne reçoit plus rien depuis
// la fusion du 13/11), titré « pour iPhone » ; ancien correctif iphone/patches/27, fondu le 24/11 (FUSION-3)
describe('« Votre avis » sur iPhone (variante appstore)', () => {
  it('ouvre un ticket du dépôt HealthTrack, titré « pour iPhone » avec la version, sans rien joindre', () => {
    const link = feedbackLink('appstore', '576')
    const url = new URL(link.url)
    expect(url.origin + url.pathname).toBe('https://github.com/spreadzenox/HealthTrack/issues/new')
    expect(url.searchParams.get('title')).toBe('Avis — Halcya pour iPhone v576')
    expect([...url.searchParams.keys()]).toEqual(['title'])
    expect(link.label).toBe('Envoyer un avis')
    expect(link.hint).not.toMatch(/Play|Google|Android/)
  })

  // Android v782 (AVIS-RELAIS-2) : le lien devient le secours du formulaire « Votre avis », sous « Autre moyen : »
  it('a un texte de secours, sans Play Store', () => {
    const link = feedbackLink('appstore', '782')
    expect(link.fallback).toBe('un ticket GitHub')
    expect(link.fallback).not.toMatch(/Play|Google|Android/)
  })

  it('ne change rien à Android : Play Store en play, ticket sans « iPhone » en sideload', () => {
    expect(feedbackLink('play', '1').url).toMatch(/^https:\/\/play\.google\.com\//)
    expect(new URL(feedbackLink('sideload', '1').url).searchParams.get('title')).toBe('Avis — Halcya v1')
  })
})

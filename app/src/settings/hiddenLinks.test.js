import { describe, it, expect, beforeEach } from 'vitest'
import { getHiddenLinks, setHiddenLinks, hideLink, unhideAllLinks, sanitizeHiddenLinks } from './hiddenLinks'

describe('hiddenLinks (I86)', () => {
  beforeEach(() => localStorage.clear())

  it('vide par défaut', () => {
    expect(getHiddenLinks()).toEqual([])
  })

  it('masque, garde l’ordre sans doublon, réaffiche tout', () => {
    hideLink('sleep_duration')
    hideLink('alcool')
    hideLink('sleep_duration')
    expect(getHiddenLinks()).toEqual(['sleep_duration', 'alcool'])
    unhideAllLinks()
    expect(getHiddenLinks()).toEqual([])
    expect(localStorage.getItem('healthtrack_hidden_links')).toBeNull()
  })

  it('ignore les valeurs illisibles (fichier ou stockage abîmé)', () => {
    expect(sanitizeHiddenLinks('x')).toEqual([])
    expect(sanitizeHiddenLinks([1, null, '', '  a ', 'a', 'x'.repeat(81)])).toEqual(['a'])
    localStorage.setItem('healthtrack_hidden_links', '{pas du json')
    expect(getHiddenLinks()).toEqual([])
  })

  it('borne la liste', () => {
    const many = Array.from({ length: 250 }, (_, i) => `k${i}`)
    expect(setHiddenLinks(many)).toHaveLength(200)
  })
})

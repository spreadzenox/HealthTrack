import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getThemeChoice, setThemeChoice, resolveTheme, applyTheme, THEME_CHOICES } from './theme'

function mockSystemDark(dark) {
  window.matchMedia = vi.fn().mockImplementation((q) => ({
    matches: q.includes('dark') ? dark : false,
    media: q,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}

describe('thème de l’app', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    mockSystemDark(false)
  })

  it('est clair par défaut, même si le téléphone est en mode sombre', () => {
    mockSystemDark(true)
    expect(getThemeChoice()).toBe('light')
    expect(resolveTheme()).toBe('light')
  })

  it('propose trois choix, clair en premier', () => {
    expect(THEME_CHOICES.map((c) => c.value)).toEqual(['light', 'dark', 'system'])
  })

  it('retient le choix et ignore une valeur inconnue', () => {
    setThemeChoice('dark')
    expect(getThemeChoice()).toBe('dark')
    localStorage.setItem('healthtrack_theme', 'violet')
    expect(getThemeChoice()).toBe('light')
  })

  it('« Comme le téléphone » suit le réglage système', () => {
    setThemeChoice('system')
    mockSystemDark(true)
    expect(resolveTheme()).toBe('dark')
    mockSystemDark(false)
    expect(resolveTheme()).toBe('light')
  })

  it('pose data-theme sur <html> et la couleur de la barre du navigateur', () => {
    const meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.appendChild(meta)
    setThemeChoice('dark')
    applyTheme()
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(meta.content).toBe('#0c1915')
    setThemeChoice('light')
    applyTheme()
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(meta.content).toBe('#ffffff')
    meta.remove()
  })
})

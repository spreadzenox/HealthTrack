/**
 * Thème de l'app (journal/DESIGN.md) : clair par défaut, sombre en option, ou « Comme le
 * téléphone ». Le choix est une préférence d'affichage, gardée dans localStorage (pas dans les
 * données de santé ni dans l'export). Les couleurs vivent dans tokens.css ; ici on ne fait que
 * poser <html data-theme="light|dark"> et accorder les icônes des barres système Android.
 */

const THEME_KEY = 'healthtrack_theme'

export const THEME_CHOICES = [
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
  { value: 'system', label: 'Comme le téléphone' },
]

/** Fond de chaque thème, pour la barre du navigateur (<meta name="theme-color">). */
const THEME_BG = { light: '#ffffff', dark: '#0c1915' }

export function getThemeChoice() {
  try {
    const v = localStorage.getItem(THEME_KEY)
    return THEME_CHOICES.some((c) => c.value === v) ? v : 'light'
  } catch {
    return 'light'
  }
}

export function setThemeChoice(choice) {
  try {
    if (choice === 'light') localStorage.removeItem(THEME_KEY)
    else localStorage.setItem(THEME_KEY, choice)
  } catch {
    // ignore
  }
}

function systemPrefersDark() {
  try {
    return Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches)
  } catch {
    return false
  }
}

/** 'light' ou 'dark', une fois « Comme le téléphone » tranché. */
export function resolveTheme(choice = getThemeChoice()) {
  if (choice === 'system') return systemPrefersDark() ? 'dark' : 'light'
  return choice === 'dark' ? 'dark' : 'light'
}

async function styleSystemBars(dark) {
  try {
    const { Capacitor, registerPlugin } = await import('@capacitor/core')
    if (!Capacitor.isNativePlatform()) return
    await registerPlugin('SystemBars').setStyle({ dark })
  } catch {
    // Ancienne version native sans le plugin : les icônes restent celles du thème Android.
  }
}

export function applyTheme() {
  const theme = resolveTheme()
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_BG[theme])
  styleSystemBars(theme === 'dark')
  return theme
}

let systemWatch = null

/** À l'ouverture : applique le thème et suit les changements du téléphone en mode « system ». */
export function initTheme() {
  applyTheme()
  if (systemWatch) return
  try {
    systemWatch = window.matchMedia?.('(prefers-color-scheme: dark)')
    systemWatch?.addEventListener?.('change', () => {
      if (getThemeChoice() === 'system') applyTheme()
    })
  } catch {
    // ignore
  }
}

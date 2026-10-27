/**
 * Langue de l'app et formats qui en dépendent (jalon 9, étape 9a — `journal/IDEES.md` I181).
 *
 * Tant que l'anglais n'est pas complet, l'interrupteur de build `VITE_I18N_EN` reste coupé : l'app est en français
 * partout, quel que soit le téléphone (comme avant). Allumé, le réglage « Langue » (Automatique / Français / English)
 * apparaît dans les Paramètres ; « Automatique » suit la langue du téléphone (français si elle est française, sinon
 * anglais).
 *
 * Les dates et les nombres passent par `appLocale()` au lieu d'un `'fr-FR'` écrit en dur. Les clés internes (noms
 * d'aliments Ciqual, normalisation) gardent `'fr-FR'` : ce ne sont pas des textes affichés.
 */
export const LANGS = ['fr', 'en']
export const LANG_CHOICES = ['auto', ...LANGS]
export const LANG_STORAGE_KEY = 'halcya.lang'
const LOCALES = { fr: 'fr-FR', en: 'en-GB' }

/** Interrupteur de build : l'anglais n'est proposé que s'il est allumé. */
export const I18N_EN = ['1', 'true'].includes(String(import.meta.env?.VITE_I18N_EN ?? '').trim().toLowerCase())

/**
 * Langue effective, sans effet de bord.
 * @param {{ enabled: boolean, choice?: string|null, systemLanguages?: readonly string[] }} opts
 * @returns {'fr'|'en'}
 */
export function resolveLang({ enabled, choice, systemLanguages = [] }) {
  if (!enabled) return 'fr'
  if (LANGS.includes(choice)) return choice
  const first = String(systemLanguages[0] ?? '').toLowerCase()
  if (!first) return 'fr'
  return first.startsWith('fr') ? 'fr' : 'en'
}

function readChoice() {
  try {
    const v = localStorage.getItem(LANG_STORAGE_KEY)
    return LANG_CHOICES.includes(v) ? v : 'auto'
  } catch {
    return 'auto'
  }
}

function systemLanguages() {
  if (typeof navigator === 'undefined') return []
  return navigator.languages?.length ? navigator.languages : [navigator.language].filter(Boolean)
}

let current = resolveLang({ enabled: I18N_EN, choice: readChoice(), systemLanguages: systemLanguages() })

/** Langue affichée : `'fr'` ou `'en'`. */
export const getLang = () => current

/** Choix enregistré dans les Paramètres : `'auto'`, `'fr'` ou `'en'`. */
export const getLangChoice = readChoice

/**
 * Enregistre le choix de la personne. La page est rechargée par l'appelant : les formats calculés au chargement des
 * modules (constantes `Intl`) suivent ainsi la nouvelle langue.
 */
export function setLangChoice(choice) {
  const v = LANG_CHOICES.includes(choice) ? choice : 'auto'
  try {
    localStorage.setItem(LANG_STORAGE_KEY, v)
  } catch {
    // stockage indisponible : le choix vaut pour cette session seulement
  }
  current = resolveLang({ enabled: I18N_EN, choice: v, systemLanguages: systemLanguages() })
  return current
}

/** Pour les tests : force la langue affichée (`'fr'` par défaut dans `src/test/setup.js`). */
export function __setLangForTests(lang) {
  current = LANGS.includes(lang) ? lang : 'fr'
}

/** Locale BCP 47 des formats `Intl` / `toLocale*String` : `'fr-FR'` ou `'en-GB'`. */
export const appLocale = () => LOCALES[current]

/**
 * Séparateur décimal de la langue, pour un nombre mis en forme par `toFixed` / `String` :
 * `(3.4).toFixed(1).replace('.', decimalMark())` → « 3,4 » en français, « 3.4 » en anglais.
 */
export const decimalMark = () => (current === 'fr' ? ',' : '.')

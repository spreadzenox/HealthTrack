/**
 * Traduction des textes visibles (jalon 9 — `journal/IDEES.md` I181) : un `t()` maison, sans dépendance, où la
 * phrase française est la clé.
 *
 *   t('Plutôt une bonne journée')
 *   t('{n} jours notés', { n: 12 })
 *   t.plural(n, { one: '{n} repas noté', other: '{n} repas notés' })
 *
 * Le catalogue `en.json` associe chaque phrase française à sa version anglaise. Une phrase absente du catalogue
 * s'affiche en français : jamais une clé brute ni un vide. Les pluriels suivent `Intl.PluralRules` (0 est « one » en
 * français, « other » en anglais).
 */
import en from './en.json'
import { appLocale, getLang } from './locale.js'

const CATALOGS = { en }

function interpolate(text, vars) {
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] == null ? m : String(vars[k])))
}

function translate(fr) {
  const lang = getLang()
  if (lang === 'fr') return fr
  const out = CATALOGS[lang]?.[fr]
  return typeof out === 'string' && out ? out : fr
}

/**
 * @param {string} fr - phrase française (clé)
 * @param {Record<string, string|number>} [vars] - valeurs des `{nom}`
 */
export function t(fr, vars) {
  return interpolate(translate(fr), vars)
}

/**
 * Pluriel : `forms` donne les phrases françaises par catégorie (`one`, `other`, éventuellement `zero`…) ; chacune est
 * une clé du catalogue. `{n}` vaut `n` sauf si `vars.n` est fourni (nombre déjà mis en forme, par exemple).
 * @param {number} n
 * @param {{ one: string, other: string } & Record<string, string>} forms
 * @param {Record<string, string|number>} [vars]
 */
t.plural = function plural(n, forms, vars) {
  const category = new Intl.PluralRules(appLocale()).select(n)
  // La catégorie est choisie sur la langue affichée, mais les clés sont les formes françaises : « one » anglais
  // (n = 1) n'est pas « one » français (n = 0 ou 1), d'où la traduction de la forme française correspondante.
  const fr = forms[category] ?? forms.other
  return interpolate(translate(fr), { n, ...vars })
}

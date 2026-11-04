/**
 * I86 « Masquer ce lien » : facteurs que la personne ne veut plus voir dans les Analyses (piste évidente, fausse ou
 * sans intérêt pour elle). Réglage local, réversible, joint à l'export JSON. Masquer n'efface aucune donnée et ne
 * change aucun calcul : le facteur n'est simplement plus affiché.
 */

const KEY = 'healthtrack_hidden_links'
const MAX_KEYS = 200
const MAX_KEY_LENGTH = 80

/** Garde une liste de clés courtes, uniques, dans l'ordre (formulaire, localStorage ou fichier de sauvegarde). */
export function sanitizeHiddenLinks(raw) {
  if (!Array.isArray(raw)) return []
  const out = []
  for (const k of raw) {
    if (typeof k !== 'string') continue
    const key = k.trim()
    if (!key || key.length > MAX_KEY_LENGTH || out.includes(key)) continue
    out.push(key)
    if (out.length >= MAX_KEYS) break
  }
  return out
}

/** @returns {string[]} */
export function getHiddenLinks() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return sanitizeHiddenLinks(JSON.parse(raw))
  } catch { /* ignore */ }
  return []
}

/** @param {string[]} keys */
export function setHiddenLinks(keys) {
  const clean = sanitizeHiddenLinks(keys)
  try {
    if (clean.length === 0) localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, JSON.stringify(clean))
  } catch { /* stockage indisponible : rien de masqué durablement */ }
  return clean
}

/** Clé d'une piste repas → ventre : l'aliment (ou le sous-groupe FODMAP), tous délais confondus. */
export function gutLinkKey(link) {
  return `gut:${link.factor}`
}

export function hideLink(key) {
  return setHiddenLinks([...getHiddenLinks(), key])
}

export function unhideAllLinks() {
  return setHiddenLinks([])
}

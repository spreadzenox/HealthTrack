/**
 * Mode « exemple » de la visite guidée (ACC-8, 08/11) : pendant qu'un écran montre des données fictives, les
 * lectures de localHealthStorage viennent d'une liste en mémoire et les écritures attendent la fin de l'exemple.
 * Rien n'est jamais écrit dans la base de la personne : les données fictives n'existent qu'ici, en mémoire.
 * Les écritures d'une synchro lancée pendant l'exemple partent, telles quelles, dans la vraie base dès la sortie.
 */
let example = null
let release = null
let gate = null

const notify = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('health-entries-updated'))
}

/** Les données fictives sont-elles affichées ? */
export const isExampleMode = () => example !== null

/** Entrées fictives (identifiants « exemple-N », qui ne croisent jamais un identifiant de la base). */
export const exampleEntries = () => example?.entries ?? []

/** Affiche des données fictives ; les écrans se relisent (événement health-entries-updated). */
export function enterExampleMode(entries) {
  const list = (entries || []).map((e, i) => ({ created_at: e.at, ...e, id: `exemple-${i}` }))
  if (!example) gate = new Promise((resolve) => (release = resolve))
  example = { entries: list }
  notify()
}

/** Rend les vraies données ; les écritures en attente partent. Sans effet hors du mode exemple. */
export function exitExampleMode() {
  if (!example) return
  example = null
  release?.()
  release = null
  gate = null
  notify()
}

/** À attendre avant toute écriture : immédiat hors du mode exemple. */
export const waitForRealData = () => gate ?? Promise.resolve()

/** Filtres de listEntries appliqués à la liste en mémoire (même ordre : du plus récent au plus ancien). */
export function readExample(opts = {}) {
  let list = exampleEntries()
  if (opts.type) list = list.filter((e) => e.type === opts.type)
  if (opts.subtypes) list = list.filter((e) => opts.subtypes.includes(e.payload?.subtype))
  if (opts.source) list = list.filter((e) => e.source === opts.source)
  if (opts.since) list = list.filter((e) => e.at >= opts.since)
  if (opts.until) list = list.filter((e) => e.at <= opts.until)
  return [...list].sort((a, b) => (b.at < a.at ? -1 : 1)).slice(0, opts.limit ?? 100)
}

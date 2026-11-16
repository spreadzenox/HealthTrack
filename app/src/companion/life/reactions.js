/**
 * Ce qui vient d'être noté (lot VIE) : le compagnon répond au geste de noter. Les saisies arrivent par plusieurs
 * chemins (la checklist, la feuille de bien-être, la page Repas après une photo) : plutôt que de brancher chacun, on
 * compare les saisies du jour à celles déjà vues pendant cette session (sessionStorage, effacé à la fermeture de
 * l'app). Fonctions pures + un petit stockage ; rien n'est envoyé.
 */
import { localDateKey } from '../../services/analysisEngine'
import { reactionFor, undoLine } from './lines'

const SEEN_KEY = 'halcya_life_seen'
/** Types notés à la main : une saisie de ces types qui disparaît est une annulation. */
const HAND_TYPES = new Set(['food', 'wellbeing', 'habit', 'gut'])

/** Type de saisie → `kind` du bus (CONTRAT.md § 4). */
const KIND = { food: 'meal', wellbeing: 'wellbeing', habit: 'habit', gut: 'gut' }

const keyOf = (e) => (e?.id != null ? String(e.id) : `${e?.type}|${e?.at}`)

/**
 * @param {{ day: string, ids: Record<string, string> } | null} prev saisies vues (id → type), ou null
 * @param {object[]} entries saisies chargées
 * @param {string} todayKey AAAA-MM-JJ
 * @returns {{ added: object[], undone: boolean, removed: { id: string, kind: string }[],
 *   next: { day: string, ids: Record<string, string> } }}
 */
export function diffToday(prev, entries, todayKey) {
  const today = (entries || []).filter((e) => e?.at && localDateKey(e.at) === todayKey && HAND_TYPES.has(e.type))
  const ids = Object.fromEntries(today.map((e) => [keyOf(e), e.type]))
  const next = { day: todayKey, ids }
  // Premier regard de la session, ou nouvelle journée : on prend la mesure, sans réagir à ce qui était déjà là.
  if (!prev || prev.day !== todayKey || !prev.ids) return { added: [], undone: false, next }
  const added = today.filter((e) => !(keyOf(e) in prev.ids))
  const removed = Object.keys(prev.ids).filter((k) => !(k in ids)).map((id) => ({ id, kind: KIND[prev.ids[id]] ?? prev.ids[id] }))
  const undone = !added.length && removed.length > 0
  return { added, undone, removed, next }
}

/**
 * La réaction à montrer pour ce qui vient d'arriver : la saisie la plus récente qui en a une (`entry`), sinon
 * l'annulation (`undone`).
 */
export function pickReaction({ added, undone, removed = [] }, ctx = {}) {
  const sorted = [...added].sort((a, b) => String(b.created_at || b.at).localeCompare(String(a.created_at || a.at)))
  for (const e of sorted) {
    const r = reactionFor(e, ctx)
    if (r) return { ...r, entry: e }
  }
  return undone ? { ...undoLine(), entry: null, undone: removed[0] } : null
}

export function loadSeen() {
  try {
    const raw = JSON.parse(globalThis.sessionStorage?.getItem(SEEN_KEY) || 'null')
    return raw && typeof raw === 'object' ? raw : null
  } catch {
    return null
  }
}

export function saveSeen(seen) {
  try {
    globalThis.sessionStorage?.setItem(SEEN_KEY, JSON.stringify(seen))
  } catch {
    // stockage indisponible : la prochaine saisie sera simplement vue comme la première
  }
}

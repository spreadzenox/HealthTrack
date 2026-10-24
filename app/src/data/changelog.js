/**
 * Journal des changements visible dans l'app (page « Nouveautés »).
 *
 * Une entrée = un fichier `changelog/AAAA-MM-JJ-HHMM-<slug>.json` (heure UTC) :
 *   { "date": "AAAA-MM-JJ", "kind": "nouveau" | "amélioration" | "correctif",
 *     "title": "…", "items": ["…"], "variants"?: ["play"] | ["sideload"] }
 * L'id est le nom du fichier, dont l'ordre alphabétique est chronologique.
 * Un fichier par changement évite les conflits Git entre branches parallèles.
 * `variants` (facultatif) limite l'entrée à une variante ; sans lui, elle vaut pour les deux.
 */
import { DISTRIBUTION, resolveDistribution } from '../config/distribution'

const modules = import.meta.glob('./changelog/*.json', { eager: true, import: 'default' })

export const ALL_CHANGELOG = Object.entries(modules)
  .map(([path, entry]) => ({ id: path.replace(/^.*\/|\.json$/g, ''), ...entry }))
  .sort((a, b) => b.id.localeCompare(a.id))

/**
 * Première entrée montrée dans la variante play (VC-5) : l'historique d'avant parle de « HealthTrack », de la clé
 * Gemini ou du bouton de mise à jour, qui n'existent pas sur Google Play. Les testeurs partent d'ici.
 */
export const PLAY_CHANGELOG_SINCE = '2026-10-24-0000'

/** Entrées qui concernent une variante, de la plus récente à la plus ancienne. */
export function changelogFor(entries, distribution) {
  const d = resolveDistribution(distribution)
  return entries.filter(
    (e) =>
      (!Array.isArray(e.variants) || e.variants.includes(d)) && (d !== 'play' || e.id >= PLAY_CHANGELOG_SINCE),
  )
}

export const CHANGELOG = changelogFor(ALL_CHANGELOG, DISTRIBUTION)

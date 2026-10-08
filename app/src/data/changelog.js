/**
 * Journal des changements visible dans l'app (page « Nouveautés »).
 *
 * Une entrée = un fichier `changelog/AAAA-MM-JJ-HHMM-<slug>.json` (heure UTC) :
 *   { "date": "AAAA-MM-JJ", "kind": "nouveau" | "amélioration" | "correctif",
 *     "title": "…", "items": ["…"] }
 * L'id est le nom du fichier, dont l'ordre alphabétique est chronologique.
 * Un fichier par changement évite les conflits Git entre branches parallèles.
 */
const modules = import.meta.glob('./changelog/*.json', { eager: true, import: 'default' })

export const CHANGELOG = Object.entries(modules)
  .map(([path, entry]) => ({ id: path.replace(/^.*\/|\.json$/g, ''), ...entry }))
  .sort((a, b) => b.id.localeCompare(a.id))

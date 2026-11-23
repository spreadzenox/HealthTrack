/**
 * Journal des changements visible dans l'app (page « Nouveautés »).
 *
 * Une entrée = un fichier `changelog/AAAA-MM-JJ-HHMM-<slug>.json` (heure UTC) :
 *   { "date": "AAAA-MM-JJ", "kind": "nouveau" | "amélioration" | "correctif",
 *     "title": "…", "items": ["…"], "variants"?: ["play"] | ["sideload"] | ["play", "sideload"] | ["appstore"], "aLaUne"?: true }
 * L'id est le nom du fichier, dont l'ordre alphabétique est chronologique.
 * Un fichier par changement évite les conflits Git entre branches parallèles.
 * `variants` (facultatif) limite l'entrée à une variante ; sans lui, elle vaut pour toutes. Une note propre à Android
 * (barres système, sauvegarde Android, montre en Bluetooth, Health Connect) porte `["play", "sideload"]` : l'app
 * iPhone, construite depuis ce code, ne la montre pas. Une note propre à l'iPhone porte `["appstore"]` et vit dans
 * `iphone/overlay/app/src/data/changelog/`.
 * `aLaUne` : le bandeau des Nouveautés titre cette note tant qu'elle n'est pas lue, même si d'autres sont plus
 * récentes (une seule à la fois, réservée à un changement que tout le monde doit lire : la refonte).
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

/**
 * App iPhone (variante appstore) : première entrée montrée, celle du premier TestFlight (30/10, build 616.97) ; avant,
 * l'historique parle de « HealthTrack », de la clé Gemini, de la mise à jour par APK ou de la montre en Bluetooth.
 */
export const APPSTORE_CHANGELOG_SINCE = '2026-10-30-2100'
/** Notes communes fausses sur iPhone (période de lancement, grande police d'Android…), cachées dans la variante appstore. */
export const APPSTORE_HIDDEN = new Set([
  '2026-10-29-0533-paywall-lancement', '2026-10-30-0933-sommeil-une-source',
  '2026-11-01-0233-textes-notifications', '2026-11-01-0333-slop-fiche-site',
  '2026-11-01-0533-sources-relues', '2026-11-01-0733-premiers-pas-relus', '2026-11-04-0235-bouton-bienvenue',
  '2026-11-04-1435-grande-police', '2026-11-06-1335-grande-police',
  '2026-11-06-1935-ventre-grande-police', '2026-11-06-2135-onboarding-reperes', '2026-11-08-1830-nouvel-accueil',
  '2026-11-10-0935-mono-mots-3', '2026-11-10-1635-journal-tuiles', '2026-11-11-1635-noter-objectif',
])

/** Entrées qui concernent une variante, de la plus récente à la plus ancienne. */
export function changelogFor(entries, distribution) {
  const d = resolveDistribution(distribution)
  return entries.filter(
    (e) =>
      (!Array.isArray(e.variants) || e.variants.includes(d)) && (d !== 'play' || e.id >= PLAY_CHANGELOG_SINCE) &&
      (d !== 'appstore' || (e.id >= APPSTORE_CHANGELOG_SINCE && !APPSTORE_HIDDEN.has(e.id))),
  )
}

export const CHANGELOG = changelogFor(ALL_CHANGELOG, DISTRIBUTION)

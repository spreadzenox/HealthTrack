import { listEntries, countEntries } from '../storage/localHealthStorage'
import { localDateKey } from './analysisEngine'

/** Lecture des entrées du journal par jour (« Vos derniers jours », onglet Journal) et des tuiles de l'accueil. */

/** Jours affichés d'emblée, puis ajoutés à chaque « Voir les jours précédents ». */
export const INITIAL_DAYS = 3
export const MORE_DAYS = 4
/**
 * Fenêtre du journal (les mesures de la montre rendent un « limit » fixe trop court). Seuls les jours affichés
 * d'emblée sont lus à l'ouverture (perf D2 : les tranches de FC / SpO₂ de deux semaines), les 14 jours au
 * premier « Voir les jours précédents ».
 */
const JOURNAL_WINDOW_DAYS = 14

function daysAgoStart(days) {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1)
}

/**
 * Entrées des derniers jours : les `INITIAL_DAYS` premiers (et s'il en reste de plus anciens dans la fenêtre),
 * ou toute la fenêtre (`full`, ou rien de récent) ; repli sur les 30 dernières si rien de récent (synchro ancienne).
 * La veille du premier jour est lue aussi (une nuit commencée la veille au soir compte pour le jour du réveil),
 * mais n'est pas affichée : `hiddenKey` = cette veille.
 * @returns {Promise<{ entries: object[], full: boolean, hasOlder: boolean, hiddenKey: string | null }>}
 */
export async function loadJournalEntries(full) {
  if (!full) {
    const shown = daysAgoStart(INITIAL_DAYS)
    const eve = daysAgoStart(INITIAL_DAYS + 1)
    const recent = await listEntries({ since: eve.toISOString(), limit: 5000 })
    if (recent.length > 0) {
      const older = await countEntries({
        since: daysAgoStart(JOURNAL_WINDOW_DAYS + 1).toISOString(),
        until: new Date(shown.getTime() - 1).toISOString(),
      })
      return { entries: recent, full: false, hasOlder: older > 0, hiddenKey: localDateKey(eve.toISOString()) }
    }
  }
  const eve = daysAgoStart(JOURNAL_WINDOW_DAYS + 1)
  const recent = await listEntries({ since: eve.toISOString(), limit: 5000 })
  if (recent.length > 0) return { entries: recent, full: true, hasOlder: false, hiddenKey: localDateKey(eve.toISOString()) }
  return { entries: await listEntries({ limit: 30 }), full: true, hasOlder: false, hiddenKey: null }
}

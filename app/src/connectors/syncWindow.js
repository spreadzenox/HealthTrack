/**
 * Fenêtre de lecture des synchronisations.
 *
 * Sans la permission READ_HEALTH_DATA_HISTORY (déclarée nulle part), Health Connect ne laisse lire que
 * les 30 jours qui précèdent la toute première autorisation de l'app (date remise à zéro à chaque
 * réinstallation) ; lire plus ancien renvoie une erreur. On borne donc la date de départ, avec un jour
 * de marge, et on n'avance pas `lastSyncAt` quand toutes les lectures ont échoué.
 */
import { getConnectorSettings, setConnectorSettings } from '../settings/connectorSettings'

const DAY_MS = 24 * 60 * 60 * 1000

/** Recouvrement pour ne pas manquer des données arrivées en retard de la montre. */
export const SYNC_OVERLAP_MS = 2 * 60 * 60 * 1000

/** Jours lisibles avant la première autorisation Health Connect (30, moins un jour de marge). */
export const HEALTH_CONNECT_READ_WINDOW_DAYS = 29

/**
 * Note la date de première autorisation, seulement sur un connecteur jamais synchronisé : pour un
 * utilisateur existant, la vraie date est inconnue et la synchro incrémentale n'en a pas besoin.
 */
export function noteFirstGrant(connectorId, now = new Date()) {
  const settings = getConnectorSettings(connectorId)
  if (settings.firstGrantAt || settings.lastSyncAt) return
  setConnectorSettings(connectorId, { firstGrantAt: now.toISOString() })
}

/**
 * Date de départ d'une synchro.
 * @param {{ now: Date, settings: object, latestAt: string|null, historyDays: number, readWindowDays: number|null }} p
 */
export function syncSince({ now, settings, latestAt, historyDays, readWindowDays }) {
  let since
  if (settings.lastSyncAt) {
    since = new Date(new Date(settings.lastSyncAt).getTime() - SYNC_OVERLAP_MS)
  } else if (latestAt) {
    since = new Date(new Date(latestAt).getTime() - SYNC_OVERLAP_MS)
  } else {
    since = new Date(now.getTime() - historyDays * DAY_MS)
  }
  // Utilisateur existant (synchronisé avant que la date ne soit notée) : son autorisation est ancienne,
  // la synchro incrémentale reste lisible ; on ne borne pas.
  if (!readWindowDays || (settings.lastSyncAt && !settings.firstGrantAt)) return since
  const grant = settings.firstGrantAt ? new Date(settings.firstGrantAt) : now
  const floor = new Date(grant.getTime() - readWindowDays * DAY_MS)
  return since < floor ? floor : since
}

/** Vrai quand rien n'a été importé et que des lectures ont échoué. */
export function readsAllFailed(result) {
  return !!result && result.synced === 0 && (result.errors?.length ?? 0) > 0
}

const HISTORY_OPTIONS = [
  { days: 7, label: '7 jours' },
  { days: 30, label: '30 jours' },
  { days: 90, label: '3 mois' },
  { days: 180, label: '6 mois' },
  { days: 365, label: '1 an' },
  { days: 730, label: '2 ans' },
]

/** Durées proposées pour le premier import, limitées à ce que la source laisse lire. */
export function historyOptions(readWindowDays) {
  if (!readWindowDays) return HISTORY_OPTIONS
  return [
    ...HISTORY_OPTIONS.filter((o) => o.days < readWindowDays),
    { days: readWindowDays, label: `${readWindowDays + 1} jours` },
  ]
}

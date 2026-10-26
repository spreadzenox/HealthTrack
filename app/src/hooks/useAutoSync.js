/**
 * useAutoSync – React hook that triggers a background auto-sync once when the
 * component mounts (i.e. when the user opens the app or navigates to a page).
 *
 * The sync only runs if the last sync is stale (> 1 hour old), so it is safe
 * to call this from multiple places without worrying about duplicate syncs.
 */
import { useEffect } from 'react'
import { triggerAutoSync } from '../connectors/autoSync'
import { syncWeather } from '../services/weatherSync'
import { syncPhoneUsage } from '../services/phoneUsageSync'
import { syncWatchIfStale, WATCH_FOREGROUND_CHECK_MS } from '../services/watchAutoSync'
import { listenWatchPresence } from '../services/watchPresence'
import { compactWatchSpo2Once } from '../services/spo2Slots'
import { recordTimezoneContext } from '../services/timezoneContext'
import { importPendingFaceBursts } from '../services/faceBursts'
import { readFaceOnOpen } from '../services/faceAppOpen'
import { importPendingEveningNotes, syncEveningNote } from '../services/eveningNote'
import { importPendingGutEvenings, syncGutEvening } from '../services/gutEvening'

/**
 * Call inside any component that should trigger an auto-sync on mount.
 *
 * @example
 * // In Layout (runs on every app launch / cold start):
 * useAutoSync()
 *
 * // In Recommendations (runs when the user navigates to that page):
 * useAutoSync()
 */
export function useAutoSync() {
  useEffect(() => {
    // Une fois par téléphone : anciennes SpO₂ « minute » de la montre regroupées par 10 min (I82, perf)
    // (avant la synchro de la montre, qui pourrait sinon écrire la même tranche en parallèle)
    const compacted = compactWatchSpo2Once().then((r) => {
      if (r?.removed) window.dispatchEvent(new CustomEvent('health-entries-updated'))
    })
    triggerAutoSync()
    // Fuseau horaire du jour (une écriture par jour et par fuseau) : un changement fait « Voyage » sans rien cocher.
    recordTimezoneContext()
    // Météo / air : au plus toutes les 3 h, seulement si l'utilisateur l'a activée.
    syncWeather()
    // Temps d'écran / sommeil estimé : au plus toutes les 30 min, seulement si activé et autorisé.
    syncPhoneUsage()
    // Lecture du visage : rafales déposées par le service natif depuis la dernière ouverture (scores seuls, I90) ;
    // l'humeur estimée de l'accueil se met à jour dès qu'une lecture est rangée.
    const faces = () => importPendingFaceBursts().then((r) => {
      if (r?.inserted) window.dispatchEvent(new CustomEvent('health-entries-updated'))
    })
    faces()
    // Variante play (sans service caméra) : une lecture du visage à l'ouverture, signalée à l'écran, puis rangée.
    const readOnOpen = () => readFaceOnOpen().then((outcome) => outcome && faces())
    readOnOpen()
    // Note du soir d'un geste (I113) : notes données depuis la notification rangées, puis heure et dernière note
    // transmises au natif (pas de notification un soir déjà noté).
    // Bilan du ventre du soir (I170) : même boîte native, même chemin, seulement avec la carte ventre.
    const evening = () => {
      importPendingEveningNotes().finally(() => syncEveningNote())
      importPendingGutEvenings().finally(() => syncGutEvening())
    }
    evening()
    // Montre Huawei en direct : au plus toutes les 30 min, seulement si HealthTrack a sa clé.
    compacted.finally(() => syncWatchIfStale())
    // … quand la montre associée se reconnecte au téléphone, même app en arrière-plan (une seule écoute) ;
    listenWatchPresence()
    // … et au retour dans l'app (déverrouillage, changement d'app) : la montre a de nouvelles minutes.
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      recordTimezoneContext()
      faces()
      readOnOpen()
      evening()
      syncWatchIfStale()
    }
    document.addEventListener('visibilitychange', onVisible)
    // … et après chaque note saisie : la notification de ce soir n'a plus lieu d'être.
    const onEntries = () => {
      syncEveningNote()
      syncGutEvening()
    }
    window.addEventListener('health-entries-updated', onEntries)
    // … et tant que l'app reste à l'écran : la relecture native s'efface alors (« l'app s'en charge »), et sans ce
    // minuteur rien ne relisait la montre avant la prochaine ouverture (18/10/2026, « dernière synchro il y a 4 h »).
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') syncWatchIfStale()
    }, WATCH_FOREGROUND_CHECK_MS)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('health-entries-updated', onEntries)
      clearInterval(timer)
    }
  }, [])
}

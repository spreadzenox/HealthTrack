/**
 * « Temps d'écran et sommeil » (page Connecteurs) : le téléphone lui-même devient un capteur.
 * Un geste pour activer (accès aux données d'utilisation d'Android), ensuite tout arrive seul :
 * temps d'écran, écran tard le soir, déverrouillages, temps par catégorie d'app (réseaux sociaux, vidéo…)
 * et nuit estimée quand la montre n'en donne pas.
 * Rien ne quitte le téléphone. Logique dans services/phoneUsage*.js, natif dans PhoneUsagePlugin.java.
 */
import { useEffect, useState } from 'react'
import MethodNote from './MethodNote'
import {
  getPhoneUsageSettings,
  enablePhoneUsage,
  disablePhoneUsage,
  syncPhoneUsage,
  checkPhoneUsageAccess,
  openPhoneUsageAccessSettings,
  isPhoneUsageAvailable,
} from '../services/phoneUsageSync'
import { formatScreenMinutes } from '../services/phoneUsage'
import { APP_CATEGORY_LABELS } from '../services/phoneApps'
import { formatAgo } from '../utils/timeAgo'
import useDisclosure from '../hooks/useDisclosure'
import { APP_NAME } from '../config/brand'
import './MyDevices.css'
import './WeatherCard.css'
import './PhoneUsageCard.css'
import { appLocale } from '../i18n/locale.js'

function hhmm(iso) {
  return new Date(iso).toLocaleTimeString(appLocale(), { hour: '2-digit', minute: '2-digit' })
}

/** « réseaux sociaux 1 h 12 · vidéo 40 min » : les 3 catégories les plus utilisées (hors « autres »). */
function appsLine(minutes) {
  const parts = Object.entries(minutes || {})
    .filter(([cat, m]) => cat !== 'other' && m > 0 && APP_CATEGORY_LABELS[cat])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat, m]) => `${APP_CATEGORY_LABELS[cat]} ${formatScreenMinutes(m)}`)
  return parts.length ? parts.join(' · ') : null
}

/**
 * @param {{ available?: boolean, sync?: Function, checkAccess?: Function, openSettings?: Function, now?: Date }} props
 */
export default function PhoneUsageCard({
  available = isPhoneUsageAvailable(),
  sync = syncPhoneUsage,
  checkAccess = checkPhoneUsageAccess,
  openSettings = openPhoneUsageAccessSettings,
  now,
}) {
  const [settings, setSettings] = useState(getPhoneUsageSettings)
  const [access, setAccess] = useState(null)
  const [disclosure, askConsent] = useDisclosure()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const reload = () => setSettings(getPhoneUsageSettings())
    window.addEventListener('phone-usage-settings-updated', reload)
    return () => window.removeEventListener('phone-usage-settings-updated', reload)
  }, [])

  // Retour des réglages Android : l'app revient au premier plan → on revérifie l'accès.
  useEffect(() => {
    if (!available) return undefined
    let cancelled = false
    async function recheck() {
      const res = await checkAccess()
      if (cancelled) return
      setAccess(res)
      if (res.granted && getPhoneUsageSettings().enabled) {
        setBusy(true)
        await sync({ force: true })
        if (!cancelled) setBusy(false)
      }
    }
    recheck()
    const onVisible = () => document.visibilityState === 'visible' && recheck()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [available, checkAccess, sync])

  async function activate() {
    if (!access?.granted && !(await askConsent('usage'))) return
    enablePhoneUsage()
    setSettings(getPhoneUsageSettings())
    if (access?.granted) {
      setBusy(true)
      try {
        await sync({ force: true })
      } finally {
        setBusy(false)
      }
    } else {
      try {
        await openSettings()
      } catch {
        /* réglage introuvable : le guide reste affiché */
      }
    }
  }

  function turnOff() {
    disablePhoneUsage()
    setSettings(getPhoneUsageSettings())
  }

  const on = settings.enabled
  const granted = !!access?.granted
  const today = settings.today
  const night = today?.sleepEstimate
  const apps = settings.todayApps?.date === today?.date ? appsLine(settings.todayApps?.minutes) : null

  return (
    <section className="weather-card" aria-labelledby="phone-usage-title">
      <div className="my-device-head">
        <h3 id="phone-usage-title" className="my-devices-title">Temps d’écran et sommeil</h3>
        {on && granted && <span className="my-device-status device-status-ok">Automatique</span>}
        {on && access && !granted && <span className="my-device-status device-status-action">À autoriser</span>}
      </div>

      {(!on || !granted) && (
        <>
          <p className="my-devices-intro">
            Votre temps d’écran, l’écran tard le soir et vos nuits sans montre, lus sur le téléphone. Jamais le contenu
            des apps ni vos messages, et rien ne quitte le téléphone.
          </p>
          <MethodNote summary="Détails">
            Votre téléphone sait quand il s’allume et quelles apps sont ouvertes : {APP_NAME} en tire votre temps
            d’écran, l’écran tard le soir, le temps passé sur les réseaux sociaux, la vidéo, les jeux… et, les nuits
            sans montre, une estimation de votre sommeil. Vos Analyses regardent comment tout cela va avec{' '}
            <em>votre</em> bien-être, dans un sens ou dans l’autre.
          </MethodNote>
        </>
      )}

      {!available && (
        <p className="my-device-message">Disponible dans l’app Android.</p>
      )}

      {available && !on && (
        <button type="button" className="btn btn-primary connector-btn" onClick={activate} disabled={busy}>
          Activer
        </button>
      )}

      {available && on && access && !granted && (
        <div className="phone-usage-guide">
          <ol className="phone-usage-steps">
            <li>Touchez « Ouvrir le réglage » : Android affiche « Accès aux données d’utilisation ».</li>
            <li>Choisissez <strong>{APP_NAME}</strong> et activez « Autoriser l’accès ».</li>
            <li>Revenez ici : tout se met à jour seul.</li>
          </ol>
          <p className="my-device-meta">
            Réglage grisé (« Paramètre restreint ») ? Paramètres Android → Applications → {APP_NAME} → menu ⋮ →
            « Autoriser les paramètres restreints », puis recommencez.
          </p>
          <div className="my-device-actions">
            <button type="button" className="btn btn-primary connector-btn" onClick={() => openSettings().catch(() => {})}>
              Ouvrir le réglage
            </button>
            <button type="button" className="btn btn-secondary connector-btn" onClick={turnOff}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {available && on && granted && (
        <div className="weather-on">
          {today ? (
            <p className="weather-today">
              <span className="weather-today-label">Aujourd’hui</span> {formatScreenMinutes(today.screenMinutes)} d’écran
              {today.lateScreenMinutes > 0 && ` · ${formatScreenMinutes(today.lateScreenMinutes)} hier soir après 22 h`}
              {today.unlocks > 0 && ` · ${today.unlocks} déverrouillage${today.unlocks > 1 ? 's' : ''}`}
            </p>
          ) : (
            <p className="my-device-message">{busy ? 'Lecture du téléphone…' : 'Pas encore de données aujourd’hui.'}</p>
          )}
          {today && apps && (
            <p className="weather-today">
              <span className="weather-today-label">Dont</span> {apps}
            </p>
          )}
          {night && (
            <p className="weather-today">
              <span className="weather-today-label">Nuit estimée</span> {hhmm(night.start)} → {hhmm(night.end)}
              {' '}({formatScreenMinutes(night.minutes)} sans écran)
            </p>
          )}
          <p className="my-device-meta">
            Estimation d’après l’écran : si vous lisez au lit ou laissez le téléphone de côté le soir, elle se trompe.
            Une montre qui envoie son sommeil passe toujours avant.
          </p>
          {settings.lastError && <p className="weather-error">{settings.lastError}</p>}
          {settings.lastSyncAt && (
            <p className="my-device-meta">Mis à jour {formatAgo(settings.lastSyncAt, now || new Date())}</p>
          )}
          <div className="my-device-actions">
            <button type="button" className="btn btn-secondary connector-btn" onClick={turnOff} disabled={busy}>
              Désactiver
            </button>
          </div>
        </div>
      )}
      {disclosure}
    </section>
  )
}

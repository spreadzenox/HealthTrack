/**
 * Cartes de l'accueil « Aujourd'hui » (maquette du 20/10/2026, journal/DESIGN.md §7) : carte pêche du ventre et
 * carte lilas des analyses. Les mesures du jour sont dans TodayBySource (TESTEUR-1d-b).
 */
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { APP_NAME } from '../config/brand'
import { createEntry, listEntries } from '../storage/localHealthStorage'
import {
  GUT_LEVELS,
  GUT_SOURCE,
  GUT_TYPE,
  gutLevelLabel,
  gutEveningCheck,
  GUT_DAY_SCOPE,
  gutSummary,
  gutWeekLine,
  PISTES_MIN_DAYS,
  GUT_PISTES_MIN_NOTE_DAYS,
  WHEN_TO_SEE_DOCTOR,
} from '../services/today'
import DetailsToggle from './DetailsToggle'
import { FEATURES } from '../config/distribution'
import GutEveningReminder from './GutEveningReminder'
import StoolLine from './StoolLine'
import LineIcon from './LineIcon'
import { useStackedChoices } from '../hooks/useStackedChoices'
import './TodayCards.css'
import { appLocale, localeDate } from '../i18n/locale.js'
import { monoDigits } from '../utils/monoDigits'

const DAY_MS = 86_400_000

function timeOf(iso) {
  return new Date(iso).toLocaleTimeString(appLocale(), { hour: '2-digit', minute: '2-digit' })
}

/** « à 08:15 » aujourd'hui, « hier à 10:19 », « lundi à 10:19 » dans la semaine, « le 12 octobre à 10:19 » au-delà. */
function lastNoteWhen(iso) {
  const at = new Date(iso)
  const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((midnight(new Date()) - midnight(at)) / DAY_MS)
  const time = `à ${timeOf(iso)}`
  if (days <= 0) return time
  if (days === 1) return `hier ${time}`
  if (days < 7) return `${at.toLocaleDateString(appLocale(), { weekday: 'long' })} ${time}`
  return `le ${localeDate(at, { day: 'numeric', month: 'long' })} ${time}`
}

/** Rechargé à chaque écriture (`health-entries-updated`). */
function useEntries(read) {
  const [entries, setEntries] = useState(null)
  const refresh = useCallback(async () => {
    try {
      setEntries(await read())
    } catch {
      setEntries([])
    }
  }, [read])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement asynchrone depuis IndexedDB
    refresh()
    window.addEventListener('health-entries-updated', refresh)
    return () => window.removeEventListener('health-entries-updated', refresh)
  }, [refresh])
  return entries
}

/** Rangée Calme / Gêne / Douleur : rond à côté du mot, au-dessus pour les trois à la fois (grande police), ou un
 * choix par ligne quand même le mot seul ne tient plus (320 px, police ×1,3). */
function GutChoiceRow({ children, ...rest }) {
  const [ref, layout] = useStackedChoices()
  const cls = layout === 'row' ? 'gut-choices' : `gut-choices gut-choices--${layout}`
  return (
    <div ref={ref} className={cls} {...rest}>
      {children}
    </div>
  )
}

const readGut = () => listEntries({ type: GUT_TYPE, since: new Date(Date.now() - 7 * DAY_MS).toISOString(), limit: 500 })

/**
 * Carte pêche « Votre ventre » : Calme / Gêne / Douleur en un geste, horodaté.
 * `title` : « Mon ventre » dans la section « Noter » de l'Accueil (TESTEUR-1d).
 * `onlyIfUsed` : rien n'est affiché tant qu'aucune note des 7 derniers jours n'existe (voir gutCardMode).
 */
export function GutCard({
  details, onToggleDetails, read = readGut, onlyIfUsed = false, now = null, title = 'Votre digestion',
}) {
  const entries = useEntries(read)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [momentOpen, setMomentOpen] = useState(false)
  const summary = gutSummary(entries || [])
  const evening = gutEveningCheck(entries || [], now || new Date())
  // Le soir, une seule question à l'écran (POL-PLAY-12) : le bilan du jour ; la note d'un moment précis reste à un geste
  const eveningFirst = Boolean(entries && evening.ask)
  const showMoment = !eveningFirst || momentOpen
  // Jamais deux rangées Calme / Gêne / Douleur à la fois (POLISH-SIM-41) : la journée ou le moment, l'un puis l'autre
  const showDay = eveningFirst && !momentOpen

  async function note(level, scope = null) {
    setSaving(true)
    setError(null)
    try {
      await createEntry({ type: GUT_TYPE, source: GUT_SOURCE, payload: scope ? { level, scope } : { level } })
      window.dispatchEvent(new CustomEvent('health-entries-updated'))
    } catch (e) {
      setError(e?.message || 'Enregistrement impossible')
    } finally {
      setSaving(false)
    }
  }

  const current = summary.lastToday ? summary.last.payload.level : null
  if (onlyIfUsed && !entries?.length) return null
  return (
    <section className="today-card gut-card" aria-labelledby="gut-card-title">
      <div className="today-card-head">
        <h3 id="gut-card-title" className="today-card-title">{title}</h3>
        <DetailsToggle on={details} onToggle={onToggleDetails} />
      </div>
      {showDay && (
        <div className="gut-evening gut-evening-first" role="group" aria-labelledby="gut-evening-title">
          <p id="gut-evening-title" className="gut-evening-title">Et votre digestion aujourd’hui, dans l’ensemble ?</p>
          <GutChoiceRow>
            {GUT_LEVELS.map((l) => (
              <button
                key={l.id}
                type="button"
                className="gut-choice"
                disabled={saving}
                onClick={() => note(l.id, GUT_DAY_SCOPE)}
                aria-label={`Journée : ${l.label}`}
              >
                <span className="gut-choice-radio" aria-hidden="true" />
                <span className="choice-label">{l.label}</span>
              </button>
            ))}
          </GutChoiceRow>
        </div>
      )}
      {error && <p className="error-msg" role="alert">{error}</p>}
      {showMoment && (
        <>
          {eveningFirst && <p className="gut-moment-title">À l’instant</p>}
          <GutChoiceRow role="group" aria-label="Comment va votre digestion ?">
            {GUT_LEVELS.map((l) => (
              <button
                key={l.id}
                type="button"
                className="gut-choice"
                aria-pressed={current === l.id}
                disabled={saving || entries === null}
                onClick={() => note(l.id)}
              >
                <span className="gut-choice-radio" aria-hidden="true" />
                <span className="choice-label">{l.label}</span>
              </button>
            ))}
          </GutChoiceRow>
          <p className="today-card-text">
            {summary.last
              ? `Dernière note : ${gutLevelLabel(summary.last.payload.level)}, ${lastNoteWhen(summary.last.at)}.`
              : 'Un geste suffit, l’heure est notée. Vous pouvez noter plusieurs fois par jour.'}
          </p>
        </>
      )}
      {entries && evening.done && (
        <p className="gut-evening-done">Bilan du jour : {gutLevelLabel(evening.done.payload.level)}. Merci !</p>
      )}
      {entries && (evening.ask || evening.done) && <GutEveningReminder />}
      {entries && (
        // Les gestes facultatifs sur une seule ligne, comme « Noter moi-même · Historique » (POL-PLAY-29)
        <div className="gut-card-actions">
          {showDay && (
            <button type="button" className="gut-moment-link" onClick={() => setMomentOpen(true)}>
              <LineIcon name="plus" size={16} />
              Noter un moment précis
            </button>
          )}
          {eveningFirst && momentOpen && (
            <button type="button" className="gut-moment-link" onClick={() => setMomentOpen(false)}>
              <LineIcon name="plus" size={16} />
              Bilan de la journée
            </button>
          )}
          <StoolLine />
        </div>
      )}
      {details && entries && <p className="today-details-line">{monoDigits(gutWeekLine(summary))}</p>}
      {details && <p className="gut-consult-note">{WHEN_TO_SEE_DOCTOR}</p>}
    </section>
  )
}

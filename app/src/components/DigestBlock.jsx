/**
 * Bloc digestif de l'Accueil (AUJ-4, revue design du 07/11). Avant les analyses : « Vos analyses digestives arrivent
 * dans N jours », ce qu'elles chercheront, « N/28 jours avec une note digestive », un bouton « Noter ma digestion »
 * (le même geste que « Digestion » du bandeau d'ajout) et le rappel du soir. Les notes du jour se lisent sur un petit
 * graphique (une pastille par note, à son heure). Une fois les analyses prêtes : une ligne qui ouvre Analyses ›
 * Digestion (leçon 16 : les résultats n'ont qu'une maison). Ni délais, ni correction statistique, ni minimum ici.
 * Couleur du thème digestion (pêche, leçon 12).
 */
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { APP_NAME } from '../config/brand'
import { listEntries } from '../storage/localHealthStorage'
import { GUT_TYPE, gutLevelLabel, gutNotesProgress, isGutDayNote } from '../services/today'
import { localDateKey } from '../services/analysisEngine'
import { readPistesSummary } from '../services/pistesSummary'
import GutEveningReminder from './GutEveningReminder'
import LineIcon from './LineIcon'
import StripPlus from './StripPlus'
import { keepWhole } from '../utils/keepWhole'
import './DigestBlock.css'

const DAY_MS = 86_400_000
/** Les 28 derniers jours (et un peu plus) suffisent au compte à rebours. */
const WINDOW_DAYS = 42

const readGutNotes = () => listEntries({
  type: GUT_TYPE, since: new Date(Date.now() - WINDOW_DAYS * DAY_MS).toISOString(), limit: Infinity,
})

const hourOf = (iso) => { const d = new Date(iso); return d.getHours() + d.getMinutes() / 60 }

/** Les notes du jour, une pastille à leur heure (de 6 h à 23 h au moins). */
function DayNotes({ notes }) {
  if (!notes.length) return null
  const hours = notes.map((n) => hourOf(n.at))
  const start = Math.min(6, Math.floor(Math.min(...hours)))
  const end = Math.max(23, Math.ceil(Math.max(...hours)))
  const left = (n) => `${((hourOf(n.at) - start) / (end - start)) * 100}%`
  const label = notes.map((n) => gutLevelLabel(n.payload.level)).join(', ')
  return (
    <div className="digest-day" role="img" aria-label={`Vos notes du jour : ${label}`}>
      <div className="digest-day-axis" />
      {notes.map((n) => (
        <span key={n.at} className={`digest-day-dot is-${n.payload.level}`} style={{ left: left(n) }} />
      ))}
      <span className="digest-day-tick mono" style={{ left: 0 }}>{start} h</span>
      <span className="digest-day-tick mono" style={{ right: 0 }}>{end} h</span>
    </div>
  )
}

/**
 * @param {{ onNote: () => void, read?: () => Promise<object[]>, summary?: object | null, now?: Date }} props
 *   `summary` : résumé des pistes mémorisé par Analyses (par défaut, lu au montage).
 */
export default function DigestBlock({ onNote, read = readGutNotes, summary: summaryProp, now }) {
  const [entries, setEntries] = useState(null)
  const [summary] = useState(() => (summaryProp !== undefined ? summaryProp : readPistesSummary()))
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
  if (entries === null) return null

  const bar = gutNotesProgress(entries)
  const today = localDateKey((now || new Date()).toISOString())
  const todayNotes = entries
    .filter((e) => e?.at && localDateKey(e.at) === today && !isGutDayNote(e) && gutLevelLabel(e.payload?.level))
    .sort((a, b) => (a.at < b.at ? -1 : 1))
  const ready = bar.ready || (summary?.gut?.length ?? 0) > 0

  return (
    <section className="today-card digest-block" data-tone="peach" aria-labelledby="digest-title">
      {ready ? (
        <Link to="/recommendations/ventre" className="digest-ready">
          <h2 id="digest-title" className="digest-title">Vos analyses digestives sont prêtes</h2>
          <LineIcon name="chevron" size={20} className="digest-chevron" />
        </Link>
      ) : (
        <>
          <h2 id="digest-title" className="digest-title">
            {keepWhole(`Vos analyses digestives arrivent dans ${bar.remaining} jour${bar.remaining > 1 ? 's' : ''}`)}
          </h2>
          <p className="digest-text">
            {APP_NAME} cherchera quels facteurs sont statistiquement liés à votre confort digestif.
          </p>
          <div className="digest-progress" role="progressbar" aria-valuemin={0} aria-valuemax={bar.target}
            aria-valuenow={bar.days} aria-label="Jours avec une note digestive">
            <div className="digest-progress-bar" style={{ width: `${(bar.days / bar.target) * 100}%` }} />
          </div>
          <p className="digest-count">
            <span className="mono">{bar.days}/{bar.target}</span> jours avec une note digestive
          </p>
        </>
      )}
      <DayNotes notes={todayNotes} />
      <button type="button" className="digest-note-button" onClick={onNote}>Noter ma digestion</button>
      <GutEveningReminder />
      <StripPlus label="Ajouter une note digestive ou une photo des selles" />
    </section>
  )
}

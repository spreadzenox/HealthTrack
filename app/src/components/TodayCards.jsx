/**
 * Cartes de l'accueil « Aujourd'hui » (maquette du 20/10/2026, journal/DESIGN.md §7), hors bien-être estimé
 * (MoodEstimateCard) : tuiles de mesures, carte pêche « Votre ventre », carte lilas des pistes.
 */
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
  pistesProgress,
} from '../services/today'
import DetailsToggle from './DetailsToggle'
import GutEveningReminder from './GutEveningReminder'
import './TodayCards.css'

const DAY_MS = 86_400_000

function timeOf(iso) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
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

/** Sommeil, VFC et pas du jour ; chiffres en mono, source en mode détails. */
export function MeasureTiles({ tiles, details }) {
  // Rien de mesuré : une ligne plutôt que trois tuiles « — » (VC-26), les tuiles reviennent avec le premier chiffre
  if (tiles.every((t) => t.value == null)) {
    return (
      <section className="today-tiles-wrap" aria-label="Mesures du jour">
        <p className="today-tiles-hint today-tiles-empty">
          Sommeil, cœur et pas arrivent de votre montre · <Link to="/connectors">Ajouter une source</Link>
        </p>
      </section>
    )
  }
  return (
    <section className="today-tiles-wrap" aria-label="Mesures du jour">
      <ul className="today-tiles">
        {tiles.map((t) => (
          <li key={t.key} className="today-tile">
            <span className="today-tile-label">{t.label}</span>
            <span className="today-tile-value mono">{t.value ?? '—'}</span>
            {details && (
              <span className="today-tile-source mono">{t.sources.length ? t.sources.join(', ') : 'aucune source'}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

const readGut = () => listEntries({ type: GUT_TYPE, since: new Date(Date.now() - 7 * DAY_MS).toISOString(), limit: 500 })

/**
 * Carte pêche « Votre ventre » : Calme / Gêne / Douleur en un geste, horodaté.
 * `onlyIfUsed` : rien n'est affiché tant qu'aucune note des 7 derniers jours n'existe (voir gutCardMode).
 */
export function GutCard({ details, onToggleDetails, read = readGut, onlyIfUsed = false, now = null }) {
  const entries = useEntries(read)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const summary = gutSummary(entries || [])
  const evening = gutEveningCheck(entries || [], now || new Date())

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
        <h3 id="gut-card-title" className="today-card-title">Votre ventre</h3>
        <DetailsToggle on={details} onToggle={onToggleDetails} />
      </div>
      <div className="gut-choices" role="group" aria-label="Comment va votre ventre ?">
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
            {l.label}
          </button>
        ))}
      </div>
      {error && <p className="error-msg" role="alert">{error}</p>}
      <p className="today-card-text">
        {summary.last
          ? `Dernière note : ${gutLevelLabel(summary.last.payload.level)}, ${summary.lastToday ? `à ${timeOf(summary.last.at)}` : `le ${new Date(summary.last.at).toLocaleDateString('fr-FR', { weekday: 'long' })} à ${timeOf(summary.last.at)}`}.`
          : 'Un geste suffit, l’heure est notée. Vous pouvez noter plusieurs fois par jour.'}
      </p>
      {entries && evening.ask && (
        <div className="gut-evening" role="group" aria-labelledby="gut-evening-title">
          <p id="gut-evening-title" className="gut-evening-title">Et votre ventre aujourd’hui, dans l’ensemble ?</p>
          <div className="gut-evening-choices">
            {GUT_LEVELS.map((l) => (
              <button
                key={l.id}
                type="button"
                className="gut-evening-choice"
                disabled={saving}
                onClick={() => note(l.id, GUT_DAY_SCOPE)}
                aria-label={`Journée : ${l.label}`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {entries && evening.done && (
        <p className="gut-evening-done">Bilan du jour : {gutLevelLabel(evening.done.payload.level)}. Merci !</p>
      )}
      {entries && (evening.ask || evening.done) && <GutEveningReminder />}
      {details && entries && <p className="today-details-line mono">{gutWeekLine(summary)}</p>}
    </section>
  )
}

/** Fenêtre des jours suivis : bornée pour le budget de lectures de l'accueil (perf D2, scripts/perf/budget.json). */
const TRACKED_WINDOW_DAYS = 42

const readTracked = async () => {
  const since = new Date(Date.now() - TRACKED_WINDOW_DAYS * DAY_MS).toISOString()
  const [food, gut] = await Promise.all([
    listEntries({ type: 'food', since, limit: Infinity }),
    listEntries({ type: GUT_TYPE, since, limit: Infinity }),
  ])
  return [...food, ...gut]
}

// Objectif « énergie et sommeil » : les nuits (une de plus pour celle qui finit le premier jour) et le bien-être
const readTrackedEnergy = async () => {
  const since = new Date(Date.now() - TRACKED_WINDOW_DAYS * DAY_MS).toISOString()
  const sleepSince = new Date(Date.now() - (TRACKED_WINDOW_DAYS + 1) * DAY_MS).toISOString()
  const [sleep, notes, faces] = await Promise.all([
    listEntries({ type: 'sleep', since: sleepSince, limit: Infinity }),
    listEntries({ type: 'wellbeing', since, limit: Infinity }),
    listEntries({ type: 'face_burst', since, limit: Infinity }),
  ])
  return [...sleep, ...notes, ...faces]
}

const PISTES_TEXT = {
  gut: {
    count: 'jours avec un repas ou une note du ventre',
    ready: 'vos pistes repas → ventre se précisent à chaque note (28 jours de notes du ventre au moins)',
    details: 'Délais testés : 0–4 h, 4–24 h, 24–48 h après le repas ; le jour même ou la veille pour le bilan du soir',
  },
  energy: {
    count: 'nuits suivies d’une mesure du bien-être',
    ready: 'les pistes sommeil → bien-être arrivent dans une prochaine version',
    details: 'Vos pistes sommeil → bien-être compareront chaque nuit au bien-être du jour qui suit',
  },
}

/** Carte lilas : jours suivis avant les pistes ; on préfère attendre que montrer de faux suspects. */
export function PistesTeaser({ details, onToggleDetails, focus = 'gut', read, onPistesPage = false, extraDetail = null }) {
  const entries = useEntries(read || (focus === 'energy' ? readTrackedEnergy : readTracked))
  if (entries === null) return null
  const p = pistesProgress(entries, focus)
  const text = PISTES_TEXT[focus] || PISTES_TEXT.gut
  return (
    <section className="today-card pistes-card" aria-labelledby="pistes-card-title">
      <div className="today-card-head">
        <h3 id="pistes-card-title" className="today-card-title">
          {p.ready ? 'Assez de jours pour chercher des pistes' : `Vos pistes arrivent dans ${p.remaining} jour${p.remaining > 1 ? 's' : ''}`}
        </h3>
        <DetailsToggle on={details} onToggle={onToggleDetails} />
      </div>
      <div
        className="pistes-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={p.target}
        aria-valuenow={p.days}
        aria-label="Jours suivis"
      >
        <div className="pistes-progress-bar" style={{ width: `${(p.days / p.target) * 100}%` }} />
      </div>
      <p className="pistes-count mono">{p.days}/{p.target} {text.count} (6 dernières semaines)</p>
      <p className="today-card-text">
        {p.ready
          ? (onPistesPage
            ? `Vos jours sont prêts ; ${text.ready}.`
            : <>Vos jours sont prêts ; {text.ready}. En attendant, voyez <Link to="/recommendations">l’onglet Analyses</Link>.</>)
          : 'On préfère attendre plutôt que de vous montrer de faux suspects.'}
      </p>
      {details && (
        <p className="today-details-line mono">
          {text.details} · comparaisons multiples corrigées (Benjamini-Hochberg) · minimum 21 jours
        </p>
      )}
      {details && extraDetail && <p className="today-details-line mono">{extraDetail}</p>}
    </section>
  )
}

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
  pistesProgress,
  gutNotesProgress,
  PISTES_MIN_DAYS,
  GUT_PISTES_MIN_NOTE_DAYS,
  WHEN_TO_SEE_DOCTOR,
} from '../services/today'
import DetailsToggle from './DetailsToggle'
import { FEATURES } from '../config/distribution'
import { useEntitlement } from '../hooks/useEntitlement'
import { gutCardMode } from '../settings/onboarding'
import { pisteTouchingToday, readPistesSummary } from '../services/pistesSummary'
import GutEveningReminder from './GutEveningReminder'
import StoolLine from './StoolLine'
import LineIcon from './LineIcon'
import { useStackedChoices } from '../hooks/useStackedChoices'
import { keepWhole } from '../utils/keepWhole'
import './TodayCards.css'
import { appLocale, localeDate } from '../i18n/locale.js'

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
      {eveningFirst && (
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
          {eveningFirst && !momentOpen && (
            <button type="button" className="gut-moment-link" onClick={() => setMomentOpen(true)}>
              <LineIcon name="plus" size={16} />
              Noter un moment précis
            </button>
          )}
          <StoolLine />
        </div>
      )}
      {details && entries && <p className="today-details-line mono">{gutWeekLine(summary)}</p>}
      {details && <p className="gut-consult-note">{WHEN_TO_SEE_DOCTOR}</p>}
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
  // Carte ventre montrée : le compte des notes du ventre, celui de l'onglet Ventre (revue du 06/11)
  gut: {
    title: 'Vos analyses digestives arrivent dans',
    explain: `${APP_NAME} cherchera quels repas reviennent avant vos gênes digestives.`,
    count: 'jours avec une note digestive',
    bar: 'Jours de notes digestives',
    ready: 'Aucune piste pour l’instant : elles se précisent à chaque note digestive',
    details: 'Délais testés : 0–4 h, 4–24 h, 24–48 h après le repas ; le jour même ou la veille pour le bilan du soir',
    minimum: `minimum ${GUT_PISTES_MIN_NOTE_DAYS} jours de notes digestives`,
  },
  // Carte ventre masquée (autre objectif) : les repas seuls, sans parler du ventre
  meals: {
    title: 'Vos analyses arrivent dans',
    explain: `${APP_NAME} cherchera ce qui revient avant vos bons et vos mauvais jours.`,
    count: 'jours avec un repas',
    bar: 'Jours suivis',
    ready: 'Aucune piste pour l’instant : elles se précisent à chaque jour suivi',
    details: 'Vos repas sont comparés à votre bien-être des heures et des jours qui suivent',
    minimum: `minimum ${PISTES_MIN_DAYS} jours suivis`,
  },
  energy: {
    title: 'Vos analyses arrivent dans',
    explain: `${APP_NAME} cherchera comment vos nuits vont avec votre bien-être du lendemain.`,
    count: 'nuits suivies d’une mesure du bien-être',
    bar: 'Jours suivis',
    ready: 'Les pistes sommeil → bien-être arrivent dans une prochaine version',
    details: 'Vos pistes sommeil → bien-être compareront chaque nuit au bien-être du jour qui suit',
    minimum: `minimum ${PISTES_MIN_DAYS} jours suivis`,
  },
}

/**
 * POL-PLAY-21 : des pistes déjà repérées par Analyses (résumé mémorisé, rien recalculé ici) — leur nombre et la
 * première en une ligne ; toucher la carte ouvre Analyses. Les pistes du ventre restent floues sans premium
 * (version Play), comme dans Analyses.
 */
function PistesFound({ gut, levers, locked, today = null }) {
  const count = gut.length + levers.length
  // TESTEUR-1d-3 : la piste qui touche une mesure du jour passe devant, avec la mesure (pistes du bien-être, jamais floues)
  const first = today ? today.title : locked ? levers[0] : (gut[0] ?? levers[0])
  // Retours du 04/11 (4) : la carte ouvre le sous-onglet de la piste annoncée (ventre ou bien-être)
  const to = gut.length > 0 && (first === gut[0] || !levers.length) ? '/recommendations/ventre' : '/recommendations'
  return (
    <Link to={to} className="today-card pistes-card pistes-card--found" data-tone={to === '/recommendations' ? 'mint' : 'peach'} aria-labelledby="pistes-card-title">
      <div className="today-card-head">
        <h3 id="pistes-card-title" className="today-card-title">
          {count} {count > 1 ? 'pistes repérées' : 'piste repérée'}
        </h3>
        <span className="pistes-card-chevron" aria-hidden="true">›</span>
      </div>
      {first ? (
        <p className="pistes-first">{first}</p>
      ) : (
        <p className="pistes-first pistes-first--locked">
          <span className="pistes-first-blur" aria-hidden="true" />
          <span className="pistes-premium-tag mono">premium</span>
        </p>
      )}
      {today && <p className="pistes-today">Aujourd’hui : {today.today}.</p>}
      <p className="today-card-text">
        {count > 1 ? 'Touchez pour voir le détail et comment les vérifier.' : 'Touchez pour voir le détail et comment la vérifier.'}
      </p>
    </Link>
  )
}

/**
 * Carte lilas : jours suivis avant les pistes (pas de piste tant que le hasard domine).
 * `todayChanges` : les écarts de « Ce qui change aujourd'hui » (dayDeviations), pour citer la piste qui touche le jour.
 */
export function PistesTeaser({
  details, onToggleDetails, focus = 'gut', read, onPistesPage = false, extraDetail = null, todayChanges = null,
}) {
  const entries = useEntries(read || (focus === 'energy' ? readTrackedEnergy : readTracked))
  const [summary] = useState(() => (onPistesPage ? null : readPistesSummary()))
  const [ent] = useEntitlement()
  if (entries === null) return null
  if (summary) {
    const gut = gutCardMode() !== 'hide' ? summary.gut : []
    if (gut.length + summary.levers.length > 0) {
      const locked = gut.length > 0 && FEATURES.billing && !ent.premium
      return <PistesFound gut={gut} levers={summary.levers} locked={locked} today={pisteTouchingToday(summary, todayChanges)} />
    }
  }
  // Objectif ventre avec la carte ventre : les pistes repas → ventre ne dépendent que des notes du ventre (chaque jour
  // noté est aussi un jour suivi) ; un seul compte à rebours, le même que l'onglet Ventre d'Analyses
  const kind = focus === 'energy' ? 'energy' : gutCardMode() !== 'hide' ? 'gut' : 'meals'
  const bar = kind === 'gut'
    ? gutNotesProgress(entries)
    : pistesProgress(kind === 'meals' ? entries.filter((e) => e.type !== GUT_TYPE) : entries, focus)
  const text = PISTES_TEXT[kind]
  const title = bar.ready
    ? 'Assez de jours pour chercher des pistes'
    : `${text.title} ${bar.remaining} jour${bar.remaining > 1 ? 's' : ''}`
  return (
    <section className="today-card pistes-card" data-tone={kind === 'energy' ? 'mint' : 'peach'} aria-labelledby="pistes-card-title">
      <div className="today-card-head">
        <h3 id="pistes-card-title" className="today-card-title">{keepWhole(title)}</h3>
        <DetailsToggle on={details} onToggle={onToggleDetails} />
      </div>
      {/* Ce que les analyses cherchent, en une phrase (retours du testeur du 06/11 : « piste » n'était pas compris) */}
      {!bar.ready && <p className="today-card-text">{text.explain}</p>}
      <div
        className="pistes-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={bar.target}
        aria-valuenow={bar.days}
        aria-label={text.bar}
      >
        <div className="pistes-progress-bar" style={{ width: `${(bar.days / bar.target) * 100}%` }} />
      </div>
      <p className="pistes-count">
        <span className="mono">{bar.days}/{bar.target}</span> {text.count}
      </p>
      {/* Avant l'échéance, le compte à rebours suffit : plus de « surtout du hasard » (retours du testeur du 06/11) */}
      {bar.ready && (
        <p className="today-card-text">
          {onPistesPage
            ? `${text.ready}.`
            : <>{text.ready}. Voyez <Link to="/recommendations">l’onglet Analyses</Link>.</>}
        </p>
      )}
      {details && (
        <p className="today-details-line mono">
          {text.details}. Comparaisons multiples corrigées (Benjamini-Hochberg), {text.minimum}.
        </p>
      )}
      {details && extraDetail && <p className="today-details-line mono">{extraDetail}</p>}
    </section>
  )
}

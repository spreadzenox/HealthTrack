/**
 * Bloc digestif de l'Accueil (AUJ-4, revue design du 07/11). Avant les analyses : « Vos analyses digestives arrivent
 * dans N jours », ce qu'elles chercheront, « N/28 jours notés, pas forcément d'affilée », un bouton « Noter ma digestion »
 * (le même geste que « Digestion » du bandeau d'ajout) et le rappel du soir. Les notes du jour se lisent sur un petit
 * graphique (une pastille par note, à son heure). Une fois les analyses prêtes : une ligne qui ouvre Analyses ›
 * Digestion (leçon 16 : les résultats n'ont qu'une maison). Ni délais, ni correction statistique, ni minimum ici.
 * Couleur du thème digestion (pêche, leçon 12).
 */
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { APP_NAME } from '../config/brand'
import { readGutNotes } from '../services/gutNotes'
import { GUT_TYPE, gutLevelLabel, gutNotesProgress, isGutDayNote } from '../services/today'
import { localDateKey } from '../services/analysisEngine'
import { readPistesSummary } from '../services/pistesSummary'
import { computeTotalsFromItems } from '../services/nutritionKPIs'
import { appLocale } from '../i18n/locale.js'
import GutEveningReminder from './GutEveningReminder'
import LineIcon from './LineIcon'
import StripPlus from './StripPlus'
import { keepWhole } from '../utils/keepWhole'
import './DigestBlock.css'
import { monoDigits } from '../utils/monoDigits'

const hourOf = (iso) => { const d = new Date(iso); return d.getHours() + d.getMinutes() / 60 }

/** Les notes du jour, une pastille à leur heure (de 6 h à 23 h au moins). */
function DayNotes({ notes }) {
  if (!notes.length) return null
  const hours = notes.map((n) => hourOf(n.at))
  const start = Math.min(6, Math.floor(Math.min(...hours)))
  const end = Math.max(23, Math.ceil(Math.max(...hours)))
  const left = (n) => `${((hourOf(n.at) - start) / (end - start)) * 100}%`
  const label = notes.map((n) => gutLevelLabel(n.payload.level)).join(', ')
  // AUJ-9 : toucher le graphique ouvre Journal › Tendances réglé sur le confort digestif
  return (
    <Link to="/tendances?mesure=digestion" className="digest-day" aria-label={`Vos notes du jour : ${label}. Voir les tendances`}>
      <div className="digest-day-axis" />
      {notes.map((n) => (
        <span key={n.at} className={`digest-day-dot is-${n.payload.level}`} style={{ left: left(n) }} />
      ))}
      <span className="digest-day-tick" style={{ left: 0 }}><span className="mono">{start}</span> h</span>
      <span className="digest-day-tick" style={{ right: 0 }}><span className="mono">{end}</span> h</span>
    </Link>
  )
}

const INTAKE = [
  ['energy_kcal', 'kcal'],
  ['protein_g', 'protéines', 'g'],
  ['carbohydrates_g', 'glucides', 'g'],
  ['fat_g', 'lipides', 'g'],
  ['fiber_g', 'fibres', 'g'],
]

/**
 * Apports du jour, d'après les repas notés (AUJ-4b) : après le premier repas, sans rouge ni alerte ni objectif ;
 * un toucher ouvre Journal › Nutrition. Rien si la table nutritionnelle n'est pas encore chargée.
 */
function TodayIntake({ meals }) {
  if (!meals.length) return null
  let totals
  try {
    totals = computeTotalsFromItems(meals.flatMap((m) => m.payload?.items || []))
  } catch {
    return null
  }
  if (!(totals.energy_kcal > 0)) return null
  const fmt = (v) => Math.round(v).toLocaleString(appLocale())
  return (
    <Link to="/nutrition" className="digest-intake">
      <span className="digest-intake-title">Vos apports jusqu’ici</span>
      <span className="digest-intake-values">
        {INTAKE.map(([k, label, unit]) => (
          <span key={k} className="digest-intake-value">
            <span>{monoDigits(fmt(totals[k]))}{unit ? `\u00a0${unit}` : ''}</span> {label}
          </span>
        ))}
      </span>
      <LineIcon name="chevron" size={18} className="digest-chevron" />
    </Link>
  )
}

/**
 * @param {{ onNote: () => void, read?: () => Promise<object[]>, summary?: object | null, now?: Date }} props
 *   `summary` : résumé des pistes mémorisé par Analyses (par défaut, lu au montage).
 *   `meals` : les repas du jour (entrées `food`), pour « Vos apports jusqu'ici ».
 */
export default function DigestBlock({ onNote, read = readGutNotes, summary: summaryProp, now, meals = [] }) {
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
            {keepWhole(`Encore ${bar.remaining} jour${bar.remaining > 1 ? 's' : ''} noté${bar.remaining > 1 ? 's' : ''} avant vos analyses digestives`)}
          </h2>
          <p className="digest-text">
            {APP_NAME} cherchera quels facteurs sont statistiquement liés à votre confort digestif.
          </p>
          <div className="digest-progress" role="progressbar" aria-valuemin={0} aria-valuemax={bar.target}
            aria-valuenow={bar.days} aria-label="Jours avec une note digestive">
            <div className="digest-progress-bar" style={{ width: `${(bar.days / bar.target) * 100}%` }} />
          </div>
          <p className="digest-count">
            <span className="mono">{bar.days}/{bar.target}</span> jours notés, pas forcément d’affilée
          </p>
        </>
      )}
      <DayNotes notes={todayNotes} />
      <TodayIntake meals={meals} />
      <button type="button" className="digest-note-button" onClick={onNote}>Noter ma digestion</button>
      <GutEveningReminder />
      <StripPlus label="Ajouter une note digestive ou une photo des selles" />
    </section>
  )
}

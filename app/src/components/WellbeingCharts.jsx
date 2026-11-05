import { useState, useEffect } from 'react'
import { loadWellbeingTrends } from '../services/mood/faceMoodData'
import { getAnalysis, peekAnalysis } from '../services/analysisRunner'
import { decimalMark } from '../i18n/locale.js'
import { HistoryChart, ReadingDetail } from '../pages/WellbeingHistory'
import PastelTiles from './PastelTiles'
import WellbeingPrompt from './WellbeingPrompt'
import './WellbeingCharts.css'

/**
 * « Votre bien-être » d'Analyses → Tendances (signalement du propriétaire du 05/11) : le bien-être estimé, même série
 * que l'historique du bien-être et la carte de l'Accueil (`wellbeingHistory`), sur 14 jours et sur aujourd'hui ; les
 * notes à la main en losanges à part. Toucher un point ouvre ce que les modèles ont lu (retour (6) du 04/11).
 * Anti-circularité (règle 5) : seules des entrées Y (lectures du visage, notes) sont lues pour les courbes.
 */
const DAYS = 14
// POL-PLAY-48 : sans rien à montrer, les deux façons d'avoir du bien-être, en tuiles menthe ; la note s'ouvre sur place
const emptyTiles = (onNote) => [
  { to: '/connectors', theme: 'mint', icon: 'camera', label: 'Activer la lecture du visage' },
  { onClick: onNote, theme: 'mint', icon: 'pen', label: 'Noter votre bien-être' },
]

const fmt = (v) => v.toFixed(1).replace('.', decimalMark())

/**
 * « Attendu d'après vos habitudes » : ce que vos jours notés à la main laissent attendre pour une journée comme
 * aujourd'hui, comparé à votre note du jour (le modèle apprend sur les notes, pas sur le visage).
 */
function PredictionLegend({ prediction }) {
  return (
    <details className="wellbeing-pred-row wellbeing-pred-details">
      <summary>
        <span className="wellbeing-chart-pred-legend">
          <span>Attendu d’après vos habitudes :</span>
          <strong className="wellbeing-prediction-value">{fmt(prediction.predicted)} / 5</strong>
          {prediction.actual != null && <span>· votre note du jour : {fmt(prediction.actual)}</span>}
        </span>
      </summary>
      <p className="wellbeing-prediction-note">
        Ce que vos jours notés à la main laissent attendre pour une journée comme aujourd’hui (sommeil, pas…).
        {prediction.actual == null ? ' Notez votre journée pour comparer.' : ' À comparer à votre note du jour.'}
        {prediction.assumedTypical?.length > 0 && ' Ce qui n’est pas encore connu compte comme une journée habituelle.'}
      </p>
    </details>
  )
}

function Legend({ history }) {
  return (
    <ul className="wbh-legend" aria-label="Légende">
      {history.points.length > 0 && (
        <li><span className="wbh-key is-estimate" aria-hidden="true" />estimé (visage){history.points.some((p) => p.hourly) && ', par heure'}</li>
      )}
      {history.notes.length > 0 && <li><span className="wbh-key is-note" aria-hidden="true" />noté à la main</li>}
      {history.period === 'day' && history.points.some((p) => Number.isFinite(p.low) && Number.isFinite(p.high)) && (
        <li><span className="wbh-key is-range" aria-hidden="true" />fourchette</li>
      )}
      {history.points.some((p) => p.few) && <li><span className="wbh-key is-few" aria-hidden="true" />peu de lectures</li>}
    </ul>
  )
}

/** Une courbe (14 jours ou aujourd'hui) et, sous elle, le détail du point touché. */
function TrendChart({ title, history, now }) {
  const [selected, setSelected] = useState(null)
  const point = selected ? history.points.find((p) => p.at === selected) : null
  return (
    <div className="wellbeing-chart-block">
      <h4 className="wellbeing-chart-subtitle">{title}</h4>
      <HistoryChart history={history} now={now} selected={selected} onSelect={setSelected} />
      <Legend history={history} />
      {!point && history.points.length > 0 && <p className="wbh-hint">Touchez un point pour voir sa lecture.</p>}
      {point && <ReadingDetail point={point} period={history.period} onClose={() => setSelected(null)} />}
    </div>
  )
}

export default function WellbeingCharts({ now: givenNow }) {
  const [now] = useState(() => givenNow ?? new Date())
  const [trends, setTrends] = useState(null)
  // Prédiction en cache (données inchangées depuis le dernier calcul) : affichée dès le premier rendu
  const [todayPrediction, setTodayPrediction] = useState(() => peekAnalysis('todayPrediction').result ?? null)
  const [loading, setLoading] = useState(true)
  const [noteOpen, setNoteOpen] = useState(false)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const t = await loadWellbeingTrends({ now })
        if (alive) setTrends(t)
      } catch {
        if (alive) setTrends(null)
      } finally {
        if (alive) setLoading(false)
      }
      // Calcul lourd hors du fil principal (Web Worker) : les courbes s'affichent sans l'attendre
      try {
        const prediction = await getAnalysis('todayPrediction')
        if (alive) setTodayPrediction(prediction ?? null)
      } catch {
        /* pas de prédiction : la ligne reste masquée */
      }
    }
    load()
    window.addEventListener('health-entries-updated', load)
    return () => {
      alive = false
      window.removeEventListener('health-entries-updated', load)
    }
  }, [now])

  if (loading) {
    return (
      <section className="wellbeing-charts" aria-busy="true">
        <p className="wellbeing-charts-loading">Chargement des courbes...</p>
      </section>
    )
  }

  const title = (
    <h3 id="wellbeing-charts-title" className="section-title">
      Votre bien-être
    </h3>
  )

  const days = trends?.days
  const today = trends?.today
  const hasDays = Boolean(days && (days.points.length || days.notes.length))
  const hasToday = Boolean(today && (today.points.length || today.notes.length))

  // POL-PLAY-38 : sans rien sur 14 jours, une ligne discrète plutôt qu'un grand cadre de graphique vide
  if (!hasDays) {
    const older = Boolean(days?.earliest && days.earliest < days.from)
    return (
      <section className="wellbeing-charts" aria-labelledby="wellbeing-charts-title">
        {title}
        <p className="empty-hint wellbeing-charts-empty">
          {older ? `Rien ces ${DAYS} derniers jours.` : 'Pas encore de bien-être noté ni estimé.'}
        </p>
        {todayPrediction != null && <PredictionLegend prediction={todayPrediction} />}
        <PastelTiles tiles={emptyTiles(() => setNoteOpen(true))} />
        <WellbeingPrompt open={noteOpen} onClose={() => setNoteOpen(false)} />
      </section>
    )
  }

  return (
    <section className="wellbeing-charts" aria-labelledby="wellbeing-charts-title">
      {title}
      <TrendChart title={`Par jour, sur 5 (${DAYS} derniers jours)`} history={days} now={now} />
      {todayPrediction != null && <PredictionLegend prediction={todayPrediction} />}
      {/* Sans rien aujourd'hui, ce bloc ne serait qu'un grand cadre vide : il apparaît à la première lecture. */}
      {hasToday && <TrendChart title="Aujourd’hui" history={today} now={now} />}
    </section>
  )
}

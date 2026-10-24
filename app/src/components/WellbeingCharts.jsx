import { useState, useEffect, useMemo } from 'react'
import { listEntries, countEntries } from '../storage/localHealthStorage'
import { seriesByCalendarDay, seriesByHourToday } from '../services/wellbeingSeries'
import { getAnalysis, peekAnalysis } from '../services/analysisRunner'
import { pickLabelIndices } from '../utils/format'
import './WellbeingCharts.css'

const W = 320
const H = 160
const PAD = { top: 12, right: 16, bottom: 28, left: 22 }
// ~45 px de viewBox par étiquette « 07/10 » : au-delà elles se chevauchent sur un écran de 412 px
const MAX_X_LABELS = 7
const DAYS = 14

// Relie les points successifs, sauf s'ils sont séparés de plus de `maxGap` (jours sans note) :
// le trou reste visible au lieu d'être comblé par une droite trompeuse.
function linePath(points, maxGap) {
  return points
    .map((p, i) => {
      const joined = i > 0 && p.dataX - points[i - 1].dataX <= maxGap
      return `${joined ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
    })
    .filter((cmd, i, cmds) => cmd[0] === 'L' || cmds[i + 1]?.[0] === 'L')
    .join(' ')
}

/**
 * @param {{ points, xDomain, labels, emptyMessage, predictionPoint?, maxGap? }}
 *   points: [{ x, v }] avec x en unités de données (jour, heure) — placés proportionnellement sur xDomain [min, max]
 *   labels: [{ x, text, isPred? }]
 *   predictionPoint: { x, v } point estimé (aujourd'hui), relié au dernier point s'il est adjacent
 *   maxGap: écart maximal (en unités de x) entre deux points reliés par la ligne
 */
function WellbeingLineChart({ points, xDomain, labels, emptyMessage, predictionPoint, maxGap = Infinity }) {
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const { scaled, scaledPred, toX } = useMemo(() => {
    const [min, max] = xDomain
    const toXFn = (x) => PAD.left + (max === min ? innerW / 2 : ((x - min) / (max - min)) * innerW)
    const toY = (v) => PAD.top + innerH * (1 - v / 5)
    return {
      scaled: points.map((p) => ({ x: toXFn(p.x), y: toY(p.v), dataX: p.x })),
      scaledPred: predictionPoint
        ? { x: toXFn(predictionPoint.x), y: toY(predictionPoint.v), dataX: predictionPoint.x }
        : null,
      toX: toXFn,
    }
  }, [points, xDomain, predictionPoint, innerW, innerH])

  if (points.length === 0 && !predictionPoint) {
    return (
      <div className="wellbeing-chart-empty" role="img" aria-label={emptyMessage}>
        {emptyMessage}
      </div>
    )
  }

  const d = linePath(scaled, maxGap)

  // Pointillé du dernier point réel vers la prédiction, seulement s'ils sont adjacents (note d'hier)
  const lastActual = scaled[scaled.length - 1]
  const dPred = lastActual && scaledPred && scaledPred.dataX - lastActual.dataX <= maxGap
    ? `M ${lastActual.x.toFixed(1)} ${lastActual.y.toFixed(1)} L ${scaledPred.x.toFixed(1)} ${scaledPred.y.toFixed(1)}`
    : ''

  return (
    <svg
      className="wellbeing-chart-svg"
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Courbe de bien-être"
    >
      {[0, 1, 2, 3, 4, 5].map((g) => {
        const y = PAD.top + innerH * (1 - g / 5)
        return (
          <line
            key={g}
            x1={PAD.left}
            y1={y}
            x2={PAD.left + innerW}
            y2={y}
            className="wellbeing-chart-grid"
          />
        )
      })}
      {[0, 1, 2, 3, 4, 5].map((g) => (
        <text
          key={g}
          x={PAD.left - 8}
          y={PAD.top + innerH * (1 - g / 5) + 3}
          textAnchor="end"
          className="wellbeing-chart-axis-label"
          fontSize="9"
        >
          {g}
        </text>
      ))}
      {d && <path d={d} className="wellbeing-chart-line" fill="none" />}
      {dPred && (
        <path d={dPred} className="wellbeing-chart-pred-line" fill="none" />
      )}
      {scaled.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} className="wellbeing-chart-dot" />
      ))}
      {scaledPred && (
        <circle cx={scaledPred.x} cy={scaledPred.y} r={5} className="wellbeing-chart-pred-dot" />
      )}
      {labels.map((l) => (
        <text
          key={l.x}
          x={toX(l.x)}
          y={H - 8}
          textAnchor="middle"
          className={l.isPred ? 'wellbeing-chart-pred-label' : 'wellbeing-chart-x-label'}
          fontSize="9"
        >
          {l.text}
        </text>
      ))}
    </svg>
  )
}

const fmt = (v) => v.toFixed(1).replace('.', ',')

/**
 * Une seule mention de la prédiction, sous le graphique (nettoyage D1 / I87) : avant, une grande carte
 * au-dessus et une légende au-dessous disaient la même chose. L'explication est repliée.
 */
function PredictionLegend({ prediction, onChart }) {
  const line = (
    <span className="wellbeing-chart-pred-legend">
      {onChart && <span className="wellbeing-pred-dot-legend" aria-hidden="true" />}
      <span>Attendu d’après vos habitudes :</span>
      <strong className="wellbeing-prediction-value">{fmt(prediction.predicted)} / 5</strong>
      {prediction.actual != null && <span>· réel : {fmt(prediction.actual)}</span>}
    </span>
  )
  if (!(prediction.assumedTypical?.length > 0)) return <p className="wellbeing-pred-row">{line}</p>
  return (
    <details className="wellbeing-pred-row wellbeing-pred-details">
      <summary>{line}</summary>
      <p className="wellbeing-prediction-note">
        Journée en cours : ce qui n’est pas encore connu (pas, repas, mesures…) compte comme une journée
        habituelle. Une estimation, pas une mesure.
      </p>
    </details>
  )
}

// Minuit local du premier jour affiché, moins un jour de marge : seule cette plage est lue (perf D2),
// le découpage par jour du calendrier se fait ensuite dans seriesByCalendarDay.
function windowStart(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - DAYS).toISOString()
}

export default function WellbeingCharts() {
  const [entries, setEntries] = useState([])
  const [hasOlderNotes, setHasOlderNotes] = useState(false)
  // Prédiction en cache (données inchangées depuis le dernier calcul) : affichée dès le premier rendu
  const [todayPrediction, setTodayPrediction] = useState(() => peekAnalysis('todayPrediction').result ?? null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const since = windowStart()
        const wellbeingData = await listEntries({ type: 'wellbeing', since, limit: 2000 })
        // Notes plus anciennes : comptées (sans les lire) seulement pour choisir le message du graphique vide
        const older = wellbeingData.length === 0 ? await countEntries({ type: 'wellbeing', until: since }) : 0
        if (alive) {
          setEntries(wellbeingData)
          // (une note du jour de marge, hors des 14 jours affichés, compte aussi comme « plus ancienne »)
          setHasOlderNotes(older > 0 || wellbeingData.some((e) => typeof e.payload?.score === 'number'))
        }
      } finally {
        if (alive) setLoading(false)
      }
      // Calcul lourd hors du fil principal (Web Worker) : les courbes s'affichent sans l'attendre
      try {
        const prediction = await getAnalysis('todayPrediction')
        if (alive) setTodayPrediction(prediction ?? null)
      } catch {
        /* pas de prédiction : le badge reste masqué */
      }
    }
    load()
    window.addEventListener('health-entries-updated', load)
    return () => {
      alive = false
      window.removeEventListener('health-entries-updated', load)
    }
  }, [])

  const daySeries = useMemo(() => seriesByCalendarDay(entries, DAYS), [entries])
  const hourSeries = useMemo(() => seriesByHourToday(entries), [entries])

  const dayPoints = daySeries.filter((d) => d.average != null).map((d) => ({ x: d.offset, v: d.average }))

  // Only show prediction dot on chart when today has no real wellbeing score yet
  const today = daySeries[DAYS - 1]
  const showPredictionOnChart = todayPrediction != null && today.average == null

  // Étiquettes à dates fixes (aujourd'hui, puis tous les 3 jours) : l'axe est un vrai calendrier
  const labelStep = Math.ceil((DAYS - 1) / (MAX_X_LABELS - 1))
  const dayLabels = daySeries
    .filter((d) => (DAYS - 1 - d.offset) % labelStep === 0)
    .map((d) => {
      const [, m, day] = d.dateKey.split('-')
      return { x: d.offset, text: `${day}/${m}`, isPred: showPredictionOnChart && d.offset === DAYS - 1 }
    })

  const hourPoints = hourSeries.map((d) => ({ x: d.hour, v: d.average }))
  const hourLabels = pickLabelIndices(hourSeries.length, MAX_X_LABELS)
    .map((i) => ({ x: hourSeries[i].hour, text: `${hourSeries[i].hour}h` }))
  const hourDomain = hourSeries.length > 0
    ? [hourSeries[0].hour, hourSeries[hourSeries.length - 1].hour]
    : [0, 0]

  if (loading) {
    return (
      <section className="wellbeing-charts" aria-busy="true">
        <p className="wellbeing-charts-loading">Chargement des courbes...</p>
      </section>
    )
  }

  return (
    <section className="wellbeing-charts" aria-labelledby="wellbeing-charts-title">
      <h2 id="wellbeing-charts-title" className="section-title">
        Bien-être (0–5)
      </h2>

      <div className="wellbeing-chart-block">
        <h3 className="wellbeing-chart-subtitle">Par jour ({DAYS} derniers jours)</h3>
        <WellbeingLineChart
          points={dayPoints}
          xDomain={[0, DAYS - 1]}
          labels={dayLabels}
          maxGap={1}
          emptyMessage={hasOlderNotes
            ? `Aucune note ces ${DAYS} derniers jours. Notez votre bien-être pour suivre son évolution.`
            : 'Pas encore de bien-être noté. Activez la lecture du visage ou notez-le avec «\u00a0Ajouter une note\u00a0».'}
          predictionPoint={showPredictionOnChart ? { x: DAYS - 1, v: todayPrediction.predicted } : null}
        />
        {todayPrediction != null && (
          <PredictionLegend prediction={todayPrediction} onChart={showPredictionOnChart} />
        )}
      </div>

      {/* Sans note aujourd'hui, ce bloc n'était qu'un grand cadre vide : il apparaît à la première note. */}
      {hourSeries.length > 0 && (
        <div className="wellbeing-chart-block">
          <h3 className="wellbeing-chart-subtitle">Par heure (aujourd’hui)</h3>
          <WellbeingLineChart
            points={hourPoints}
            xDomain={hourDomain}
            labels={hourLabels}
            emptyMessage="Aucune note aujourd’hui pour l’instant."
          />
        </div>
      )}
    </section>
  )
}

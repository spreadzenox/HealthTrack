import { useState, useEffect, useMemo } from 'react'
import { listEntries, listEntriesForAnalysis } from '../storage/localHealthStorage'
import { seriesByDay, seriesByHourToday } from '../services/wellbeingSeries'
import { computeTodayPrediction } from '../services/analysisEngine'
import './WellbeingCharts.css'

const W = 320
const H = 160
const PAD = { top: 12, right: 8, bottom: 28, left: 28 }

function linePath(points) {
  if (points.length === 0) return ''
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')
}

/**
 * @param {{ points, xLabels, emptyMessage, predictionPoint? }}
 *   predictionPoint: { v: number, label: string } appended as a future/predicted dot
 */
function WellbeingLineChart({ points, xLabels, emptyMessage, predictionPoint }) {
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const { scaled, allLabels } = useMemo(() => {
    const combinedPoints = predictionPoint
      ? [...points, { v: predictionPoint.v, isPrediction: true }]
      : points
    const n = combinedPoints.length
    const s = n === 0 ? [] : combinedPoints.map((p, i) => ({
      x: PAD.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW),
      y: PAD.top + innerH * (1 - p.v / 5),
      isPrediction: p.isPrediction ?? false,
    }))
    const labels = predictionPoint
      ? [...xLabels, predictionPoint.label]
      : xLabels
    return { scaled: s, allLabels: labels }
  }, [points, xLabels, predictionPoint, innerW, innerH])

  if (points.length === 0 && !predictionPoint) {
    return (
      <div className="wellbeing-chart-empty" role="img" aria-label={emptyMessage}>
        {emptyMessage}
      </div>
    )
  }

  // Draw the main line only through actual (non-prediction) points
  const actualScaled = scaled.filter((p) => !p.isPrediction)
  const d = linePath(actualScaled)

  // Dashed line from last actual point to prediction point
  const lastActual = actualScaled[actualScaled.length - 1]
  const predScaled = scaled.find((p) => p.isPrediction)
  const dPred = lastActual && predScaled
    ? `M ${lastActual.x.toFixed(1)} ${lastActual.y.toFixed(1)} L ${predScaled.x.toFixed(1)} ${predScaled.y.toFixed(1)}`
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
      <text x={4} y={PAD.top + 4} className="wellbeing-chart-axis-label" fontSize="10">
        5
      </text>
      <text x={4} y={PAD.top + innerH / 2 + 4} className="wellbeing-chart-axis-label" fontSize="10">
        2
      </text>
      <text x={4} y={PAD.top + innerH + 4} className="wellbeing-chart-axis-label" fontSize="10">
        0
      </text>
      {d && <path d={d} className="wellbeing-chart-line" fill="none" />}
      {dPred && (
        <path d={dPred} className="wellbeing-chart-pred-line" fill="none" />
      )}
      {scaled.map((p, i) =>
        p.isPrediction ? (
          <circle key={i} cx={p.x} cy={p.y} r={5} className="wellbeing-chart-pred-dot" />
        ) : (
          <circle key={i} cx={p.x} cy={p.y} r={4} className="wellbeing-chart-dot" />
        )
      )}
      {allLabels.map((label, i) => {
        const x = scaled[i]?.x ?? PAD.left
        const isPred = scaled[i]?.isPrediction ?? false
        return (
          <text
            key={i}
            x={x}
            y={H - 8}
            textAnchor="middle"
            className={isPred ? 'wellbeing-chart-pred-label' : 'wellbeing-chart-x-label'}
            fontSize="9"
          >
            {label}
          </text>
        )
      })}
    </svg>
  )
}

export default function WellbeingCharts() {
  const [entries, setEntries] = useState([])
  const [todayPrediction, setTodayPrediction] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const [wellbeingData, allData] = await Promise.all([
        listEntries({ type: 'wellbeing', limit: 2000 }),
        listEntriesForAnalysis(),
      ])
      setEntries(wellbeingData)
      setTodayPrediction(computeTodayPrediction(allData))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const onUpdate = () => load()
    window.addEventListener('health-entries-updated', onUpdate)
    return () => window.removeEventListener('health-entries-updated', onUpdate)
  }, [])

  const daySeries = useMemo(() => seriesByDay(entries, 14), [entries])
  const hourSeries = useMemo(() => seriesByHourToday(entries), [entries])

  const dayPoints = daySeries.map((d) => ({ v: d.average }))
  const dayLabels = daySeries.map((d) => {
    const [, m, day] = d.dateKey.split('-')
    return `${day}/${m}`
  })

  const hourPoints = hourSeries.map((d) => ({ v: d.average }))
  const hourLabels = hourSeries.map((d) => `${d.hour}h`)

  // Only show prediction dot on chart when today has no real wellbeing score yet
  const todayKey = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD local
  const todayAlreadyInSeries = daySeries.some((d) => d.dateKey === todayKey)
  const showPredictionOnChart = todayPrediction != null && !todayAlreadyInSeries

  const todayLabel = (() => {
    const now = new Date()
    return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`
  })()

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
      <p className="wellbeing-charts-hint">
        Moyennes par jour et par heure aujourd'hui — données locales uniquement.
      </p>

      {todayPrediction != null && (
        <div className="wellbeing-prediction-badge">
          <span className="wellbeing-prediction-icon" aria-hidden="true">🤖</span>
          <span className="wellbeing-prediction-label">Prédiction ML aujourd'hui</span>
          <span className="wellbeing-prediction-value">{todayPrediction.predicted.toFixed(1)} / 5</span>
          {todayPrediction.actual != null && (
            <span className="wellbeing-prediction-actual">
              · réel : {todayPrediction.actual.toFixed(1)}
            </span>
          )}
        </div>
      )}

      <div className="wellbeing-chart-block">
        <h3 className="wellbeing-chart-subtitle">Par jour (14 derniers jours)</h3>
        <WellbeingLineChart
          points={dayPoints}
          xLabels={dayLabels}
          emptyMessage="Pas encore assez de données. Enregistrez votre bien-être à l'ouverture de l'app."
          predictionPoint={showPredictionOnChart ? { v: todayPrediction.predicted, label: todayLabel } : null}
        />
        {showPredictionOnChart && (
          <p className="wellbeing-chart-pred-legend">
            <span className="wellbeing-pred-dot-legend" aria-hidden="true" /> Prédiction ML (pas encore de score aujourd'hui)
          </p>
        )}
      </div>

      <div className="wellbeing-chart-block">
        <h3 className="wellbeing-chart-subtitle">Par heure (aujourd'hui)</h3>
        <WellbeingLineChart
          points={hourPoints}
          xLabels={hourLabels}
          emptyMessage="Aucune note aujourd'hui pour l'instant."
        />
      </div>
    </section>
  )
}

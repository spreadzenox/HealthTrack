import { useState, useEffect, useMemo } from 'react'
import { listEntries, listEntriesForAnalysis } from '../storage/localHealthStorage'
import { seriesByCalendarDay, seriesByHourToday } from '../services/wellbeingSeries'
import { computeTodayPrediction } from '../services/analysisEngine'
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

  const daySeries = useMemo(() => seriesByCalendarDay(entries, DAYS), [entries])
  const hourSeries = useMemo(() => seriesByHourToday(entries), [entries])

  const dayPoints = daySeries.filter((d) => d.average != null).map((d) => ({ x: d.offset, v: d.average }))
  const hasOlderNotes = dayPoints.length === 0 && entries.some((e) => typeof e.payload?.score === 'number')

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
      <p className="wellbeing-charts-hint">
        {hourSeries.length > 0
          ? "Moyennes par jour et par heure aujourd'hui — données locales uniquement."
          : 'Moyenne par jour — données locales uniquement.'}
      </p>

      {todayPrediction != null && (
        <div className="wellbeing-prediction-badge">
          <span className="wellbeing-prediction-icon" aria-hidden="true">🤖</span>
          <span className="wellbeing-prediction-label">Prédiction du jour</span>
          <span className="wellbeing-prediction-value">{todayPrediction.predicted.toFixed(1).replace('.', ',')} / 5</span>
          {todayPrediction.actual != null && (
            <span className="wellbeing-prediction-actual">
              · réel : {todayPrediction.actual.toFixed(1).replace('.', ',')}
            </span>
          )}
          {todayPrediction.assumedTypical?.length > 0 && (
            <span className="wellbeing-prediction-note">
              Journée en cours : ce qui n'est pas encore connu (pas, repas, mesures…) compte comme une journée
              habituelle. Une estimation, pas une mesure.
            </span>
          )}
        </div>
      )}

      <div className="wellbeing-chart-block">
        <h3 className="wellbeing-chart-subtitle">Par jour ({DAYS} derniers jours)</h3>
        <WellbeingLineChart
          points={dayPoints}
          xDomain={[0, DAYS - 1]}
          labels={dayLabels}
          maxGap={1}
          emptyMessage={hasOlderNotes
            ? `Aucune note ces ${DAYS} derniers jours. Notez votre bien-être pour suivre son évolution.`
            : "Pas encore assez de données. Enregistrez votre bien-être à l'ouverture de l'app."}
          predictionPoint={showPredictionOnChart ? { x: DAYS - 1, v: todayPrediction.predicted } : null}
        />
        {showPredictionOnChart && (
          <p className="wellbeing-chart-pred-legend">
            <span className="wellbeing-pred-dot-legend" aria-hidden="true" /> Prédiction du jour (pas encore de note aujourd'hui)
          </p>
        )}
      </div>

      {/* Sans note aujourd'hui, ce bloc n'était qu'un grand cadre vide : il apparaît à la première note. */}
      {hourSeries.length > 0 && (
        <div className="wellbeing-chart-block">
          <h3 className="wellbeing-chart-subtitle">Par heure (aujourd'hui)</h3>
          <WellbeingLineChart
            points={hourPoints}
            xDomain={hourDomain}
            labels={hourLabels}
            emptyMessage="Aucune note aujourd'hui pour l'instant."
          />
        </div>
      )}
    </section>
  )
}

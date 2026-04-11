import { useState, useEffect, useMemo } from 'react'
import { listEntries } from '../storage/localHealthStorage'
import { seriesByDay, seriesByHourToday } from '../services/wellbeingSeries'
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

function WellbeingLineChart({ points, xLabels, emptyMessage }) {
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const scaled = useMemo(() => {
    if (points.length === 0) return []
    const n = points.length
    return points.map((p, i) => ({
      x: PAD.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW),
      y: PAD.top + innerH * (1 - p.v / 5),
    }))
  }, [points, innerW, innerH])

  if (points.length === 0) {
    return (
      <div className="wellbeing-chart-empty" role="img" aria-label={emptyMessage}>
        {emptyMessage}
      </div>
    )
  }

  const d = linePath(scaled)

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
      <path d={d} className="wellbeing-chart-line" fill="none" />
      {scaled.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} className="wellbeing-chart-dot" />
      ))}
      {xLabels.map((label, i) => {
        const x = scaled[i]?.x ?? PAD.left
        return (
          <text
            key={i}
            x={x}
            y={H - 8}
            textAnchor="middle"
            className="wellbeing-chart-x-label"
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
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const data = await listEntries({ type: 'wellbeing', limit: 2000 })
      setEntries(data)
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

  if (loading) {
    return (
      <section className="wellbeing-charts" aria-busy="true">
        <p className="wellbeing-charts-loading">Chargement des courbes…</p>
      </section>
    )
  }

  return (
    <section className="wellbeing-charts" aria-labelledby="wellbeing-charts-title">
      <h2 id="wellbeing-charts-title" className="section-title">
        Bien-être (0–5)
      </h2>
      <p className="wellbeing-charts-hint">
        Moyennes par jour et par heure aujourd’hui — données locales uniquement.
      </p>

      <div className="wellbeing-chart-block">
        <h3 className="wellbeing-chart-subtitle">Par jour (14 derniers jours)</h3>
        <WellbeingLineChart
          points={dayPoints}
          xLabels={dayLabels}
          emptyMessage="Pas encore assez de données. Enregistrez votre bien-être à l’ouverture de l’app."
        />
      </div>

      <div className="wellbeing-chart-block">
        <h3 className="wellbeing-chart-subtitle">Par heure (aujourd’hui)</h3>
        <WellbeingLineChart
          points={hourPoints}
          xLabels={hourLabels}
          emptyMessage="Aucune note aujourd’hui pour l’instant."
        />
      </div>
    </section>
  )
}
